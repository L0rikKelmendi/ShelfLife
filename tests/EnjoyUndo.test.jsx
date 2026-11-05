import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useEnjoyItem } from '../src/hooks/useEnjoyItem';
import { ToastProvider } from '../src/context/ToastContext';
const mockChange = jest.fn();
jest.mock('../src/context/PantryContext', () => ({
  usePantry: () => ({ changeStatus: mockChange }),
}));
function Harness() {
  const { enjoy } = useEnjoyItem();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Enjoy apples"
      onPress={() => enjoy('apple')}
    >
      <Text>Enjoy apples</Text>
    </Pressable>
  );
}
describe('enjoy and undo', () => {
  beforeEach(() => mockChange.mockReset().mockResolvedValue(undefined));
  it('writes the status, offers undo, and restores active status', async () => {
    const screen = render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Enjoy apples' }));
    const undo = await screen.findByRole('button', { name: 'Undo' });
    expect(mockChange).toHaveBeenCalledWith('apple', 'used');
    fireEvent.press(undo);
    await waitFor(() => expect(mockChange).toHaveBeenLastCalledWith('apple', 'active'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull());
  });
  it('does not claim success or offer undo after a failed write', async () => {
    mockChange.mockRejectedValue(new Error('Write failed'));
    const screen = render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Enjoy apples' }));
    expect(await screen.findByText('Write failed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();
  });
});

it('explains an undo failure instead of silently dismissing it', async () => {
  mockChange
    .mockReset()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('Record removed'));
  const screen = render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Enjoy apples' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Undo' }));
  expect(await screen.findByText('Could not undo that change. Please try again.')).toBeTruthy();
});
it('prevents a rapid double tap from writing the same action twice', async () => {
  let finish;
  mockChange.mockReset().mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const screen = render(
    <ToastProvider>
      <Harness />
    </ToastProvider>,
  );
  const button = screen.getByRole('button', { name: 'Enjoy apples' });
  fireEvent.press(button);
  fireEvent.press(button);
  expect(mockChange).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(await screen.findByRole('button', { name: 'Undo' })).toBeTruthy();
});
