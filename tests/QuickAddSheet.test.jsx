import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import QuickAddSheet from '../src/components/QuickAddSheet';
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
describe('quick add sheet', () => {
  it('chooses a pictured food, validates details and submits through the fixed save action', async () => {
    const submit = jest.fn().mockResolvedValue('saved');
    const screen = render(<QuickAddSheet onSubmit={submit} onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('Find a food'), 'Mil');
    expect(screen.getByLabelText('Milk photo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Choose Milk' }));
    fireEvent.changeText(screen.getByLabelText('Quantity'), '0');
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    expect(await screen.findByText('Enter a quantity between 0 and 9,999.')).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText('Quantity'), '2');
    fireEvent.changeText(screen.getByLabelText('Expiry / best-before date'), '2026-12-20');
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Milk',
          quantity: '2',
          unit: 'l',
          category: 'Dairy',
          expiresOn: '2026-12-20',
        }),
      ),
    );
  });
  it('keeps a custom name and displays save errors without closing the sheet', async () => {
    const close = jest.fn();
    const screen = render(
      <QuickAddSheet
        onClose={close}
        onSubmit={jest.fn().mockRejectedValue(new Error('Could not connect.'))}
      />,
    );
    fireEvent.changeText(screen.getByLabelText('Find a food'), 'Homemade jam');
    fireEvent.press(screen.getByRole('button', { name: 'Use custom name' }));
    expect(screen.getByText('Homemade jam')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    expect(await screen.findByText('Could not connect.')).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
  });
});

it('preserves quantity and date when choosing a different ingredient', async () => {
  const submit = jest.fn().mockResolvedValue('saved');
  const screen = render(<QuickAddSheet onClose={jest.fn()} onSubmit={submit} />);
  fireEvent.changeText(screen.getByLabelText('Find a food'), 'Milk');
  fireEvent.press(screen.getByRole('button', { name: 'Choose Milk' }));
  fireEvent.changeText(screen.getByLabelText('Quantity'), '3');
  fireEvent.changeText(screen.getByLabelText('Expiry / best-before date'), '2050-12-20');
  fireEvent.press(screen.getByRole('button', { name: 'Change food' }));
  fireEvent.changeText(screen.getByLabelText('Find a food'), 'Bread');
  fireEvent.press(screen.getByRole('button', { name: 'Choose Bread' }));
  expect(screen.getByLabelText('Quantity').props.value).toBe('3');
  fireEvent.press(screen.getByRole('button', { name: 'More details' }));
  expect(screen.getByRole('button', { name: 'Grains' }).props.accessibilityState.selected).toBe(
    true,
  );
  fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bread',
        quantity: '3',
        unit: 'pcs',
        expiresOn: '2050-12-20',
      }),
    ),
  );
});
