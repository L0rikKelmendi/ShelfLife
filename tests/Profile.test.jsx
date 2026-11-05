import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import Profile from '../src/app/(main)/profile';
import {
  getReminderStatus,
  listenForTestReminder,
  testReminder,
} from '../src/services/notifications';
const mockToast = jest.fn();
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'presentation-user', displayName: 'Lorik Demo', email: 'demo@example.test' },
    mode: 'cloud',
    logout: jest.fn(),
  }),
}));
jest.mock('../src/context/PantryContext', () => ({
  usePantry: () => ({
    reminders: false,
    toggleReminders: jest.fn(),
    resetPreview: jest.fn(),
    stats: { active: [], enjoyed: 0 },
  }),
}));
jest.mock('../src/context/ToastContext', () => ({ useToast: () => mockToast }));
jest.mock('../src/services/notifications', () => ({
  notificationsSupported: true,
  testReminder: jest.fn(),
  getReminderStatus: jest.fn(),
  listenForTestReminder: jest.fn(),
  openNotificationSettings: jest.fn(),
}));
describe('Account test reminder button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    testReminder.mockResolvedValue('test-id');
    getReminderStatus.mockResolvedValue({ granted: true, channelBlocked: false });
    listenForTestReminder.mockReturnValue(jest.fn());
  });
  it('sends with the signed-in UID and distinguishes submission from a received notification', async () => {
    const screen = render(<Profile />);
    await screen.findByText('Notification permission is enabled.');
    fireEvent.press(screen.getByRole('button', { name: 'Send a test reminder' }));
    expect(
      await screen.findByText(
        'Test submitted to your phone. Open the notification tray to check it.',
      ),
    ).toBeTruthy();
    expect(testReminder).toHaveBeenCalledWith('presentation-user');
    const callback = listenForTestReminder.mock.calls[0][1];
    act(() => callback());
    expect(
      screen.getByText('Received on this phone. Your local notification reached the app.'),
    ).toBeTruthy();
  });
  it('shows failures without claiming successful notification delivery', async () => {
    testReminder.mockRejectedValue(new Error('Notifications are turned off.'));
    const screen = render(<Profile />);
    await screen.findByText('Notification permission is enabled.');
    fireEvent.press(screen.getByRole('button', { name: 'Send a test reminder' }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith('Notifications are turned off.', 'error'),
    );
    expect(
      screen.queryByText('Received on this phone. Your local notification reached the app.'),
    ).toBeNull();
  });
});
