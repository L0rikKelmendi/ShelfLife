import React, { useEffect, useState } from 'react';
import { AppState, Switch, View, useWindowDimensions } from 'react-native';
import {
  Bell,
  BellRing,
  Leaf,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  Sprout,
} from '../../components/Icons';
import Page from '../../components/Page';
import { Button, Dialog, PageHeading, SectionHeading, Txt } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { usePantry } from '../../context/PantryContext';
import { useToast } from '../../context/ToastContext';
import {
  notificationsSupported,
  testReminder,
  getReminderStatus,
  listenForTestReminder,
  openNotificationSettings,
} from '../../services/notifications';
import { errorMessage } from '../../lib/errors';
import { colors, fonts, shared } from '../../theme';

export default function Profile() {
  const { user, mode, logout } = useAuth();
  const { reminders, toggleReminders, resetPreview, stats } = usePantry();
  const notify = useToast();
  const { width } = useWindowDimensions();
  const wide = width >= 1200;
  const [busy, setBusy] = useState(null);
  const [reset, setReset] = useState(false);
  const [permission, setPermission] = useState(null);
  const [testResult, setTestResult] = useState(null);
  useEffect(() => {
    if (!notificationsSupported) return;
    let active = true;
    const refresh = () =>
      getReminderStatus()
        .then((value) => {
          if (active) setPermission(value);
        })
        .catch(() => {});
    refresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const stop = listenForTestReminder(user.uid, () => {
      if (active) setTestResult('received');
    });
    return () => {
      active = false;
      appState.remove();
      stop();
    };
  }, [user.uid]);
  const run = async (key, callback) => {
    if (busy) return;
    setBusy(key);
    try {
      await callback();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };
  const name = user?.displayName || user?.email?.split('@')[0] || 'Food lover';
  return (
    <Page>
      <PageHeading
        eyebrow="YOUR OWN LITTLE CORNER"
        title="Make yourself at home."
        subtitle="A few preferences for a pantry that feels like yours."
      />
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 23, alignItems: 'flex-start' }}>
        <View style={{ flex: wide ? 1.6 : undefined, width: '100%', gap: 23 }}>
          <View style={[shared.card, { padding: width < 500 ? 22 : 28 }]}>
            <View style={[shared.row, { gap: 17 }]}>
              <View
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 25,
                  backgroundColor: colors.lightGreen,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt serif style={{ fontSize: 35 }}>
                  {name[0].toUpperCase()}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt serif style={{ fontSize: 28 }}>
                  {name}’s kitchen
                </Txt>
                <Txt muted style={{ fontSize: 12, marginTop: 5 }}>
                  {mode === 'preview' ? 'A local preview, just for exploring' : user?.email}
                </Txt>
              </View>
            </View>
            <View
              style={{
                paddingTop: 22,
                marginTop: 22,
                borderTopWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                gap: 30,
              }}
            >
              <View>
                <Txt style={[shared.label, { fontSize: 9 }]}>ON YOUR SHELF</Txt>
                <Txt serif style={{ fontSize: 27, marginTop: 6 }}>
                  {stats.active.length}
                </Txt>
              </View>
              <View>
                <Txt style={[shared.label, { fontSize: 9 }]}>HAPPILY ENJOYED</Txt>
                <Txt serif style={{ fontSize: 27, marginTop: 6 }}>
                  {stats.enjoyed}
                </Txt>
              </View>
            </View>
          </View>
          <View style={[shared.card, { padding: width < 500 ? 22 : 28 }]}>
            <SectionHeading
              title="A gentle nudge."
              subtitle="Because good ingredients deserve to be remembered."
            />
            <View style={[shared.row, { gap: 13, marginTop: 5 }]}>
              <View
                style={{
                  width: 41,
                  height: 41,
                  borderRadius: 13,
                  backgroundColor: colors.lightGreen,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={20} color={colors.green} strokeWidth={1.6} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>Pantry reminders</Txt>
                <Txt muted style={{ fontSize: 11, lineHeight: 19, marginTop: 5 }}>
                  On this phone, at 9 AM the day before an item’s date. Turn on the reminder for
                  each item you want to follow.
                </Txt>
              </View>
              <Switch
                accessibilityLabel="Enable pantry reminders"
                value={reminders}
                onValueChange={(value) =>
                  run('reminders', async () => {
                    await toggleReminders(value);
                    notify(
                      value
                        ? 'A gentle nudge, right when you need it.'
                        : 'Pantry reminders are turned off on this device.',
                    );
                  })
                }
                disabled={!!busy || !notificationsSupported}
                trackColor={{ false: '#D4DCCD', true: '#8FA972' }}
                thumbColor="#fff"
              />
            </View>
            <View
              style={{
                backgroundColor: '#F6F7F1',
                padding: 16,
                borderRadius: 12,
                marginTop: 22,
                gap: 10,
              }}
            >
              <Txt muted style={{ fontSize: 11, lineHeight: 19 }}>
                {notificationsSupported
                  ? 'Send a local reminder now. Check the banner or your notification tray; sound depends on your phone’s settings.'
                  : 'Local reminders are available in the Android and iPhone app. Open ShelfLife on your phone to turn them on.'}
              </Txt>
              <Button
                title="Send a test reminder"
                icon={BellRing}
                small
                variant="secondary"
                disabled={!notificationsSupported || (!!busy && busy !== 'test')}
                loading={busy === 'test'}
                onPress={() =>
                  run('test', async () => {
                    setTestResult(null);
                    await testReminder(user.uid);
                    setTestResult((value) => (value === 'received' ? value : 'sent'));
                    setPermission(await getReminderStatus());
                    notify('Test sent. Check your notification tray.');
                  })
                }
                style={{ alignSelf: 'flex-start' }}
              />
              {testResult && (
                <Txt accessibilityLiveRegion="polite" style={{ fontSize: 11, color: colors.green }}>
                  {testResult === 'received'
                    ? 'Received on this phone. Your local notification reached the app.'
                    : 'Test submitted to your phone. Open the notification tray to check it.'}
                </Txt>
              )}
              {notificationsSupported && (
                <>
                  <Txt muted style={{ fontSize: 10, lineHeight: 17 }}>
                    {permission?.channelBlocked
                      ? 'Pantry reminders are blocked in notification settings.'
                      : permission?.granted
                        ? 'Notification permission is enabled.'
                        : 'Allow notifications when asked. If blocked, enable them in settings.'}
                  </Txt>
                  <Button
                    title="Open notification settings"
                    variant="ghost"
                    small
                    onPress={() => run('settings', openNotificationSettings)}
                    disabled={!!busy}
                    style={{ alignSelf: 'flex-start' }}
                  />
                </>
              )}
            </View>
            <Txt muted style={{ fontSize: 10, lineHeight: 18, marginTop: 15 }}>
              Upcoming reminders update when you edit your pantry in the app. Signing out cancels
              reminders on this device. Up to 50 upcoming item reminders are scheduled at once.
            </Txt>
          </View>
          {mode === 'preview' && (
            <View style={[shared.card, { padding: 25, gap: 13 }]}>
              <Txt serif style={{ fontSize: 24 }}>
                Room to explore.
              </Txt>
              <Txt muted style={{ fontSize: 12, lineHeight: 21 }}>
                This preview keeps sample items on this device. You can add, edit, enjoy, and remove
                them. It does not create a Firebase account or sync with other devices.
              </Txt>
              <Button
                title="Reset sample pantry"
                icon={RefreshCcw}
                variant="secondary"
                small
                disabled={!!busy}
                onPress={() => setReset(true)}
                style={{ alignSelf: 'flex-start' }}
              />
            </View>
          )}
          <Button
            title={mode === 'preview' ? 'Leave preview / sign in' : 'Sign out of my kitchen'}
            variant="ghost"
            icon={LogOut}
            loading={busy === 'logout'}
            disabled={!!busy && busy !== 'logout'}
            onPress={() => run('logout', logout)}
            style={{ alignSelf: 'flex-start' }}
          />
        </View>
        <View style={{ flex: wide ? 1 : undefined, width: '100%', gap: 20 }}>
          <View style={{ padding: 28, backgroundColor: '#EAF0DF', borderRadius: 20, gap: 15 }}>
            <Sprout size={34} color={colors.green} strokeWidth={1.2} />
            <Txt serif style={{ fontSize: 30, lineHeight: 37 }}>
              A little app.{'\n'}A fresher outlook.
            </Txt>
            <Txt style={{ color: '#66775C', fontSize: 12, lineHeight: 22 }}>
              ShelfLife is a thoughtful home for what’s in your fridge, freezer, and cupboards. Know
              what you have. Enjoy it while it’s there. Make room for a little less waste.
            </Txt>
            <View style={{ height: 1, backgroundColor: '#D3DDC6', marginVertical: 6 }} />
            <View style={[shared.row, { gap: 7 }]}>
              <Leaf size={14} color={colors.green} />
              <Txt style={{ color: colors.green, fontFamily: fonts.medium, fontSize: 10 }}>
                Made with a little care. Version 1.2
              </Txt>
            </View>
          </View>
          <View style={[shared.card, { padding: 25, gap: 12 }]}>
            <ShieldCheck size={23} color={colors.green} strokeWidth={1.5} />
            <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>Your pantry stays yours.</Txt>
            <Txt muted style={{ fontSize: 11, lineHeight: 20 }}>
              {mode === 'preview'
                ? 'Preview records live in this browser or app’s local storage. Reset them any time.'
                : 'Your pantry is linked to your account. Your records are protected by Firebase authentication and account-specific database rules.'}
            </Txt>
          </View>
        </View>
      </View>
      <Dialog
        visible={reset}
        title="A fresh set of samples?"
        message="This replaces all your preview changes with the original sample pantry. Your real account’s pantry is unaffected."
        confirmLabel="Reset preview"
        loading={busy === 'reset'}
        onClose={() => setReset(false)}
        onConfirm={() =>
          run('reset', async () => {
            await resetPreview();
            setReset(false);
            notify('A fresh preview pantry, ready to explore.');
          })
        }
      />
    </Page>
  );
}
