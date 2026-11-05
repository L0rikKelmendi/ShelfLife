import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  cancelUserReminders,
  resumeUserReminders,
  syncReminders,
  testReminder,
  REMINDER_CHANNEL,
  listenForTestReminder,
} from '../src/services/notifications.native';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  getNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3, HIGH: 4, NONE: 0 },
}));
describe('mocking: local device reminders', () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });
  beforeEach(() => {
    jest.clearAllMocks();
    resumeUserReminders('alice');
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    Notifications.getNotificationChannelAsync.mockResolvedValue({ importance: 4 });
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);
    Notifications.scheduleNotificationAsync.mockResolvedValue('local-id');
  });
  it('schedules an item at 9 AM on the preceding calendar day', async () => {
    await syncReminders(
      'alice',
      [{ id: 'apple', name: 'Apples', expiresOn: '2099-06-20', status: 'active', reminder: true }],
      true,
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({ type: 'date', date: new Date(2099, 5, 19, 9) }),
        content: expect.objectContaining({
          data: expect.objectContaining({ userId: 'alice', itemId: 'apple' }),
        }),
      }),
    );
  });
  it('cancels obsolete item reminders but does not touch another user’s reminders', async () => {
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'alice-old',
        content: { data: { app: 'shelflife', userId: 'alice', fingerprint: 'old' } },
      },
      {
        identifier: 'bob-item',
        content: { data: { app: 'shelflife', userId: 'bob', fingerprint: 'bob' } },
      },
    ]);
    await syncReminders('alice', [], true);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('alice-old');
  });
  it('requires permission and sends an immediate test on the Android reminder channel', async () => {
    Platform.OS = 'android';
    await testReminder('alice');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: { channelId: REMINDER_CHANNEL },
      }),
    );
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: false });
    Notifications.requestPermissionsAsync.mockResolvedValue({ granted: false });
    await expect(testReminder('alice')).rejects.toThrow('Notifications are turned off.');
  });

  it('does not duplicate a matching schedule or schedule a finished/past item', async () => {
    const date = new Date(2099, 5, 19, 9);
    Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([
      {
        identifier: 'existing',
        content: {
          data: {
            app: 'shelflife',
            userId: 'alice',
            fingerprint: `${REMINDER_CHANNEL}|apple|Apples|${date.getTime()}`,
          },
        },
      },
    ]);
    await syncReminders(
      'alice',
      [
        { id: 'apple', name: 'Apples', expiresOn: '2099-06-20', status: 'active', reminder: true },
        {
          id: 'used',
          name: 'Enjoyed item',
          expiresOn: '2099-06-20',
          status: 'used',
          reminder: true,
        },
        {
          id: 'past',
          name: 'Past item',
          expiresOn: '2001-01-01',
          status: 'active',
          reminder: true,
        },
      ],
      true,
    );
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it('prevents a queued data update from recreating reminders after sign-out', async () => {
    await cancelUserReminders('alice');
    await syncReminders(
      'alice',
      [{ id: 'apple', name: 'Apples', expiresOn: '2099-06-20', status: 'active', reminder: true }],
      true,
    );
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    resumeUserReminders('alice');
    await syncReminders(
      'alice',
      [{ id: 'apple', name: 'Apples', expiresOn: '2099-06-20', status: 'active', reminder: true }],
      true,
    );
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  });
});

describe('notification test feedback and races', () => {
  it('reports blocked Android channels instead of reporting a successful test', async () => {
    const previous = Platform.OS;
    Platform.OS = 'android';
    Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    Notifications.getNotificationChannelAsync.mockResolvedValue({ importance: 0 });
    try {
      await expect(testReminder('alice')).rejects.toThrow('Pantry reminders are blocked');
    } finally {
      Platform.OS = previous;
    }
  });
  it('does not send a test after sign-out while the permission dialog was open', async () => {
    jest.clearAllMocks();
    resumeUserReminders('alice');
    let allow;
    Notifications.getPermissionsAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          allow = resolve;
        }),
    );
    const pending = testReminder('alice');
    await Promise.resolve();
    await cancelUserReminders('alice');
    allow({ granted: true });
    await expect(pending).rejects.toThrow('Sign in again');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it('only reports test receipts for the current account and removes its listener', () => {
    const remove = jest.fn();
    const received = jest.fn();
    Notifications.addNotificationReceivedListener.mockReturnValue({ remove });
    const stop = listenForTestReminder('alice', received);
    const listener = Notifications.addNotificationReceivedListener.mock.calls.at(-1)[0];
    listener({ request: { content: { data: { app: 'shelflife', userId: 'bob', test: true } } } });
    expect(received).not.toHaveBeenCalled();
    listener({ request: { content: { data: { app: 'shelflife', userId: 'alice', test: true } } } });
    expect(received).toHaveBeenCalledTimes(1);
    stop();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
