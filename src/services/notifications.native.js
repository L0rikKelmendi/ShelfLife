import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

// Android channel importance cannot be raised after creation; use a new channel
// for the heads-up reminders instead of modifying the previous default channel.
export const REMINDER_CHANNEL = 'pantry-reminders-v2';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsSupported = true;
const ours = (request, uid) =>
  request.content.data?.app === 'shelflife' && request.content.data?.userId === uid;

export async function enableNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Pantry reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 150, 250],
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Notifications are turned off. Allow them in your phone settings to receive reminders.',
    );
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL);
    if (channel?.importance === Notifications.AndroidImportance.NONE)
      throw new Error(
        'Pantry reminders are blocked. Open notification settings and enable this channel.',
      );
  }
}

export async function getReminderStatus() {
  const permission = await Notifications.getPermissionsAsync();
  const channel =
    Platform.OS === 'android'
      ? await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL)
      : null;
  return {
    granted: permission.granted,
    channelBlocked: channel?.importance === Notifications.AndroidImportance.NONE,
  };
}
export const openNotificationSettings = () => Linking.openSettings();
export function listenForTestReminder(uid, onReceive) {
  const listener = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data;
    if (data?.app === 'shelflife' && data.userId === uid && data.test) onReceive();
  });
  return () => listener.remove();
}

async function cancelPending(uid, includeTests = true) {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((request) => ours(request, uid) && (includeTests || !request.content.data?.test))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
}

let queue = Promise.resolve();
const blockedUsers = new Set();
export function resumeUserReminders(uid) {
  blockedUsers.delete(uid);
}
export async function cancelUserReminders(uid) {
  blockedUsers.add(uid);
  const next = queue.catch(() => {}).then(() => cancelPending(uid));
  queue = next;
  return next;
}
export function syncReminders(uid, items, enabled) {
  const run = async () => {
    if (blockedUsers.has(uid)) return;
    if (!enabled) return cancelPending(uid, false);
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return cancelPending(uid);
    const pending = (await Notifications.getAllScheduledNotificationsAsync()).filter(
      (request) => ours(request, uid) && !request.content.data?.test,
    );
    const desired = items
      .filter((item) => item.status === 'active' && item.reminder)
      .map((item) => {
        const [y, m, d] = item.expiresOn.split('-').map(Number);
        return { item, date: new Date(y, m - 1, d - 1, 9) };
      })
      .filter(({ date }) => date.getTime() > Date.now())
      .sort((a, b) => a.date - b.date)
      .slice(0, 50);
    const fingerprint = (item, date) =>
      `${REMINDER_CHANNEL}|${item.id}|${item.name}|${date.getTime()}`;
    const wanted = new Set(desired.map(({ item, date }) => fingerprint(item, date)));
    await Promise.all(
      pending
        .filter((request) => !wanted.has(request.content.data.fingerprint))
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );
    const existing = new Set(pending.map((request) => request.content.data.fingerprint));
    for (const { item, date } of desired) {
      if (blockedUsers.has(uid)) break;
      const key = fingerprint(item, date);
      if (existing.has(key)) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'A little reminder from your pantry',
          body: `${item.name} reaches its date tomorrow. Make it something delicious.`,
          sound: 'default',
          data: { app: 'shelflife', userId: uid, itemId: item.id, fingerprint: key },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: REMINDER_CHANNEL,
        },
      });
    }
  };
  const next = queue.catch(() => {}).then(run);
  queue = next;
  return next;
}

export async function testReminder(uid) {
  await enableNotifications();
  const run = async () => {
    if (blockedUsers.has(uid)) throw new Error('Sign in again before sending a test reminder.');
    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good food deserves a little reminder 🌱',
        body: 'This is your local test reminder. A fresher pantry starts here.',
        sound: 'default',
        data: { app: 'shelflife', userId: uid, test: true },
      },
      // Immediate delivery avoids Android's inexact alarm delay on short timers.
      trigger: Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : null,
    });
  };
  const next = queue.catch(() => {}).then(run);
  queue = next;
  return next;
}

export function listenForReminder(uid, onOpen) {
  const listener = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.app === 'shelflife' && data.userId === uid) {
      onOpen(data.itemId);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    }
  });
  let active = true;
  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (!active || !response) return;
      const data = response.notification.request.content.data;
      if (data?.app === 'shelflife' && data.userId === uid) {
        onOpen(data.itemId);
        Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    })
    .catch(() => {});
  return () => {
    active = false;
    listener.remove();
  };
}
