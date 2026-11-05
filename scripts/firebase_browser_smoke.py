"""Live SDK checks against local Firebase Auth + Firestore emulators."""
from playwright.sync_api import sync_playwright, expect
import os
import shutil
from pathlib import Path
import json,time
email=f'shelflife-check-{int(time.time())}@example.test'
password='Fresh-kitchen-2026!'
Path('.local/checks').mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1280,'height':1000})
    page=context.new_page();errors=[]
    # An emulator check must never create data in production, even with a stale Metro bundle.
    for host in ['identitytoolkit.googleapis.com','firestore.googleapis.com','securetoken.googleapis.com']:
        page.route('https://'+host+'/**',lambda route:route.abort())
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://localhost:8082/register',wait_until='domcontentloaded',timeout=120000)
    page.get_by_label('Your name',exact=True).fill('Pantry reviewer',timeout=120000)
    page.get_by_label('Email address',exact=True).fill(email)
    page.get_by_label('Password',exact=True).fill(password)
    page.get_by_label('Confirm password',exact=True).fill(password)
    page.get_by_role('button',name='Create my account',exact=True).click()
    expect(page.get_by_test_id('overview-screen')).to_be_visible(timeout=30000)
    expect(page.get_by_text('PREVIEW',exact=True)).not_to_be_visible()
    page.goto('http://localhost:8082/pantry')
    page.get_by_role('button',name='Add an item',exact=True).last.click()
    page.get_by_label('Find a food',exact=True).fill('Firebase oranges')
    page.get_by_role('button',name='Use custom name',exact=True).click()
    page.get_by_label('Quantity',exact=True).fill('5')
    page.get_by_label('Expiry / best-before date',exact=True).fill('2026-12-20')
    page.get_by_role('button',name='Add to my pantry',exact=True).click()
    # onSnapshot can show an optimistic local row before the server acknowledges it.
    expect(page.get_by_role('button',name='Close add food',exact=True)).not_to_be_visible(timeout=30000)
    expect(page.get_by_role('button',name='Open Firebase oranges',exact=True)).to_be_visible(timeout=30000)
    page.reload()
    try: expect(page.get_by_role('button',name='Open Firebase oranges',exact=True)).to_be_visible(timeout=30000)
    except:
        print('Reload URL:',page.url,flush=True);print('UI:',page.locator('body').inner_text()[:1000],flush=True);print('Page errors:',errors,flush=True);page.screenshot(path='.local/emulator-reload-failure.png');raise
    page.get_by_role('button',name='Open Firebase oranges',exact=True).click()
    page.get_by_label('Quantity',exact=True).fill('7')
    page.get_by_role('button',name='Save changes',exact=True).click()
    page.get_by_role('button',name='Open Firebase oranges',exact=True).click()
    expect(page.get_by_label('Quantity',exact=True)).to_have_value('7')
    page.get_by_role('button',name='Delete item',exact=True).click()
    page.get_by_role('button',name='Delete item',exact=True).last.click()
    expect(page.get_by_role('button',name='Open Firebase oranges',exact=True)).not_to_be_visible(timeout=30000)
    page.goto('http://localhost:8082/profile')
    page.get_by_role('button',name='Sign out of my kitchen',exact=True).click()
    expect(page.get_by_text('A fresher kind of everyday.')).to_be_visible()
    page.get_by_label('Email address',exact=True).fill(email)
    page.get_by_label('Password',exact=True).fill('incorrect-password')
    page.get_by_role('button',name='Step into my kitchen',exact=True).click()
    expect(page.get_by_text('That email and password do not match. Try again.')).to_be_visible(timeout=30000)
    page.get_by_label('Password',exact=True).fill(password)
    page.get_by_role('button',name='Step into my kitchen',exact=True).click()
    expect(page.get_by_test_id('overview-screen')).to_be_visible(timeout=30000)
    assert not errors,errors
    results.append({'appVersion':'1.2.0','productionFirebaseNetworkBlocked':True,'environment':'Firebase Auth + Firestore local emulators','passed':True,'flows':['register','create','realtime read','session and record persistence after reload','update','delete','sign out','wrong-password error','sign in'],'pageErrors':errors})
    print('PASS Firebase emulator UI',flush=True)
    browser.close()
Path('.local/checks/firebase-browser-checks.json').write_text(json.dumps(results,indent=2)+'\n')
