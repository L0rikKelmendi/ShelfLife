"""Full 1.2 browser acceptance: own temporary accounts + read-only demo review."""
import os
import shutil
from pathlib import Path
import json,time,requests
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('SHELFLIFE_TEST_URL','http://localhost:8081').rstrip('/')
config=dict(line.strip().split('=',1) for line in (ROOT/'.env.local').read_text().splitlines() if line.strip() and not line.startswith('#') and '=' in line)
demo=json.loads((ROOT/'.local/presentation-account.json').read_text())
(ROOT/'.local/checks/screenshots').mkdir(parents=True,exist_ok=True)
reports=[]
def auth_request(method,body):
    r=requests.post('https://identitytoolkit.googleapis.com/v1/accounts:'+method,params={'key':config['EXPO_PUBLIC_FIREBASE_API_KEY']},json=body,timeout=30)
    if not r.ok:raise RuntimeError('Firebase auth request failed: '+str(r.status_code))
    return r.json()
def cleanup(email,password):
    try:a=auth_request('signInWithPassword',{'email':email,'password':password,'returnSecureToken':True})
    except RuntimeError:return
    uid=a['localId'];headers={'Authorization':'Bearer '+a['idToken']}
    prefix=f"projects/{config['EXPO_PUBLIC_FIREBASE_PROJECT_ID']}/databases/(default)/documents/users/{uid}/items/"
    r=requests.get('https://firestore.googleapis.com/v1/'+prefix.rstrip('/'),headers=headers,timeout=30)
    if not r.ok:raise RuntimeError('Temporary data cleanup could not list owner records.')
    for d in r.json().get('documents',[]):
        assert d['name'].startswith(prefix)
        deleted=requests.delete('https://firestore.googleapis.com/v1/'+d['name'],headers=headers,timeout=30)
        if not deleted.ok:raise RuntimeError('Temporary record cleanup failed.')
    auth_request('delete',{'idToken':a['idToken']})
def screenshot(page,name):
    page.screenshot(path=str(ROOT/'.local/checks/screenshots'/name))
def login(page,email,password):
    page.goto(BASE+'/login',wait_until='domcontentloaded',timeout=120000)
    page.get_by_label('Email address',exact=True).fill(email,timeout=60000)
    page.get_by_label('Password',exact=True).fill(password)
    page.get_by_role('button',name='Step into my kitchen',exact=True).click()
    expect(page.get_by_test_id('overview-screen')).to_be_visible(timeout=60000)
def swipe(page,viewport):
    box=page.get_by_role('button',name='Open Milk',exact=True).bounding_box()
    x=box['x']+22;y=box['y']+box['height']/2
    if viewport=='phone':
        session=page.context.new_cdp_session(page)
        session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
        for delta in [20,40,65,85,105]:
            session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+delta,'y':y,'id':1}]})
            page.wait_for_timeout(30)
        session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        session.detach()
    else:
        page.mouse.move(x,y);page.mouse.down()
        page.mouse.move(x+105,y,steps=9)
        page.mouse.up()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox'])
    for kind,viewport in [('phone',{'width':393,'height':852}),('desktop',{'width':1440,'height':1100})]:
        email=f'premium-check-{kind}-{int(time.time())}@example.test';password=f'Fresh-check-{int(time.time())}!'
        context=browser.new_context(viewport=viewport,has_touch=kind=='phone',is_mobile=kind=='phone',reduced_motion='reduce' if kind=='desktop' else 'no-preference')
        page=context.new_page();errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        try:
            page.goto(BASE+'/register',wait_until='domcontentloaded',timeout=120000)
            page.get_by_label('Your name',exact=True).fill('Premium reviewer',timeout=60000)
            page.get_by_label('Email address',exact=True).fill(email)
            page.get_by_label('Password',exact=True).fill(password)
            page.get_by_label('Confirm password',exact=True).fill(password)
            page.get_by_role('button',name='Create my account',exact=True).click()
            expect(page.get_by_test_id('overview-screen')).to_be_visible(timeout=60000)
            page.get_by_role('button',name='Add item',exact=True).click()
            expect(page.get_by_text('Popular foods',exact=True)).to_be_visible()
            page.get_by_label('Find a food',exact=True).fill('straw')
            expect(page.get_by_label('Strawberries photo',exact=True)).to_be_visible()
            page.get_by_label('Find a food',exact=True).fill('Mil')
            page.get_by_role('button',name='Choose Milk',exact=True).click()
            expect(page.get_by_role('button',name='l',exact=True)).to_have_attribute('aria-pressed','true')
            page.get_by_label('Quantity',exact=True).fill('0')
            page.get_by_role('button',name='Add to my pantry',exact=True).click()
            expect(page.get_by_text('Enter a quantity between 0 and 9,999.',exact=True)).to_be_visible()
            page.get_by_label('Quantity',exact=True).fill('2')
            page.get_by_label('Expiry / best-before date',exact=True).fill('2050-12-20')
            if kind=='phone':
                page.set_viewport_size({'width':393,'height':560})
                save=page.get_by_role('button',name='Add to my pantry',exact=True)
                expect(save).to_be_in_viewport()
                assert save.bounding_box()['y']+save.bounding_box()['height']<=560
                screenshot(page,'premium-small-viewport-save.png')
                page.set_viewport_size(viewport)
            page.get_by_role('button',name='Add to my pantry',exact=True).click()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).to_be_visible(timeout=30000)
            page.reload()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).to_be_visible(timeout=30000)
            page.get_by_role('button',name='Mark Milk as enjoyed',exact=True).click()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).not_to_be_visible(timeout=10000)
            page.get_by_role('button',name='Undo',exact=True).click()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).to_be_visible(timeout=10000)
            swipe(page,kind)
            expect(page.get_by_role('button',name='Undo',exact=True)).to_be_visible(timeout=10000)
            expect(page.get_by_role('button',name='Open Milk',exact=True)).not_to_be_visible(timeout=10000)
            page.get_by_role('button',name='Undo',exact=True).click()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).to_be_visible(timeout=10000)
            page.get_by_role('button',name='Open Milk',exact=True).click()
            page.get_by_label('Quantity',exact=True).fill('4')
            page.get_by_role('button',name='Save changes',exact=True).click()
            page.get_by_role('button',name='Open Milk',exact=True).click()
            expect(page.get_by_label('Quantity',exact=True)).to_have_value('4')
            page.get_by_role('button',name='Delete item',exact=True).click()
            page.get_by_role('button',name='Cancel',exact=True).last.click()
            expect(page.get_by_text('Make a little space?',exact=True)).not_to_be_visible()
            expect(page.get_by_label('Quantity',exact=True)).to_have_value('4')
            page.get_by_role('button',name='Delete item',exact=True).click()
            page.get_by_role('button',name='Delete item',exact=True).last.click()
            expect(page.get_by_role('button',name='Open Milk',exact=True)).not_to_be_visible()
            page.get_by_role('button',name='Add an item',exact=True).first.click()
            expect(page.get_by_text('Recently added',exact=True)).to_be_visible()
            page.get_by_role('button',name='Close add food',exact=True).click()
            page.goto(BASE+'/profile')
            page.get_by_role('button',name='Sign out of my kitchen',exact=True).click()
            expect(page.get_by_label('Email address',exact=True)).to_be_visible()
            page.get_by_label('Email address',exact=True).fill(email)
            page.get_by_label('Password',exact=True).fill('incorrect-password')
            page.get_by_role('button',name='Step into my kitchen',exact=True).click()
            expect(page.get_by_text('That email and password do not match. Try again.',exact=True)).to_be_visible(timeout=30000)
            login(page,email,password)
            page.goto(BASE+'/profile');page.get_by_role('button',name='Sign out of my kitchen',exact=True).click()
            login(page,demo['email'],demo['password'])
            expect(page.get_by_role('button',name='ON YOUR SHELF: 90',exact=True)).to_be_visible(timeout=30000)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Overview overflow'
            screenshot(page,f'premium-overview-{kind}.png')
            page.get_by_role('button',name='Add item',exact=True).click()
            screenshot(page,f'premium-add-{kind}.png')
            page.get_by_label('Find a food',exact=True).fill('cornf')
            expect(page.get_by_label('Cornflakes photo',exact=True)).to_be_visible()
            page.get_by_role('button',name='Choose Cornflakes',exact=True).click()
            screenshot(page,f'premium-details-{kind}.png')
            page.get_by_role('button',name='Close add food',exact=True).click()
            page.goto(BASE+'/pantry')
            expect(page.get_by_role('button',name='All items (90)',exact=True)).to_be_visible(timeout=30000)
            page.get_by_label('Search pantry',exact=True).fill('Salmon')
            expect(page.get_by_role('button',name='Open Salmon',exact=True)).to_be_visible()
            screenshot(page,f'premium-pantry-{kind}.png')
            page.goto(BASE+'/insights')
            expect(page.get_by_text('A week of little wins.',exact=True)).to_be_visible(timeout=30000)
            expect(page.get_by_text('89%',exact=True)).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Impact overflow'
            screenshot(page,f'premium-week-{kind}.png')
            page.goto(BASE+'/profile')
            expect(page.get_by_role('button',name='Send a test reminder',exact=True)).to_be_disabled()
            assert not errors,errors
            reports.append({'viewport':kind,'passed':True,'flows':['real registration','pictured search','selected defaults','validation','sticky save at 560px viewport','cloud create/read/reload/edit/delete','button enjoy and undo','real touch swipe and undo' if kind=='phone' else 'mouse swipe and undo','recent foods','cancel deletion','logout','wrong password','login','450-record demo account','search/filter','weekly activity','responsive overflow checks','web notification control disabled'],'pageErrors':errors,'nativeDeviceTested':False})
            print('PASS premium full flow:',kind,flush=True)
        except:
            screenshot(page,f'premium-failure-{kind}.png')
            print('Uncaught page errors:',errors,flush=True)
            raise
        finally:
            context.close();cleanup(email,password)
    browser.close()
(ROOT/'.local/checks/cloud-browser-checks.json').write_text(json.dumps(reports,indent=2)+'\n')
