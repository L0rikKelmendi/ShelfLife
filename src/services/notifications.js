export const notificationsSupported = false;
export async function enableNotifications() {
  throw new Error('Open ShelfLife on your phone to enable local reminders.');
}
export async function cancelUserReminders() {}
export async function syncReminders() {}
export async function testReminder() {
  throw new Error('Open ShelfLife on your phone to try a local reminder.');
}
export function listenForReminder() {
  return () => {};
}

export function resumeUserReminders() {}
export async function getReminderStatus() {
  return { granted: false, channelBlocked: false };
}
export async function openNotificationSettings() {}
export function listenForTestReminder() {
  return () => {};
}
