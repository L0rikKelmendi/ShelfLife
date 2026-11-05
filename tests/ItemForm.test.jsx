import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ItemForm from '../src/components/ItemForm';

describe('interaction: add/edit an ingredient', () => {
  it('prevents submitting an empty name and explains what is missing', async () => {
    const onSubmit = jest.fn();
    const screen = render(<ItemForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    expect(await screen.findByText('Give your item a name.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the edited name, quantity, date and chosen category', async () => {
    const onSubmit = jest.fn().mockResolvedValue('new-id');
    const screen = render(<ItemForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('Item name'), 'Oat milk');
    fireEvent.changeText(screen.getByLabelText('Quantity'), '2');
    fireEvent.changeText(screen.getByLabelText('Expiry / best-before date'), '2026-12-20');
    fireEvent.press(screen.getByRole('button', { name: 'Dairy' }));
    fireEvent.press(screen.getByRole('button', { name: 'l' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Oat milk',
          quantity: '2',
          unit: 'l',
          category: 'Dairy',
          expiresOn: '2026-12-20',
        }),
      ),
    );
  });

  it('rejects impossible calendar dates', async () => {
    const onSubmit = jest.fn();
    const screen = render(
      <ItemForm
        initial={{ name: 'Milk', expiresOn: '2026-02-30' }}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    expect(await screen.findByText('Enter a valid date in YYYY-MM-DD format.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('food suggestions', () => {
  it('finds photos while typing and fills ingredient metadata without changing the chosen date', async () => {
    const onSubmit = jest.fn().mockResolvedValue('new-id');
    const screen = render(
      <ItemForm initial={{ expiresOn: '2026-12-20' }} onSubmit={onSubmit} onCancel={jest.fn()} />,
    );
    fireEvent.changeText(screen.getByLabelText('Item name'), 'straw');
    expect(screen.getByLabelText('Strawberries photo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Choose Strawberries' }));
    expect(screen.getByLabelText('Item name').props.value).toBe('Strawberries');
    fireEvent.changeText(screen.getByLabelText('Item name'), 'cornf');
    expect(screen.getByLabelText('Cornflakes photo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Choose Cornflakes' }));
    fireEvent.changeText(screen.getByLabelText('Item name'), 'Mil');
    expect(screen.getByLabelText('Milk photo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Choose Milk' }));
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Milk',
          unit: 'l',
          category: 'Dairy',
          storageLocation: 'Fridge',
          expiresOn: '2026-12-20',
        }),
      ),
    );
  });
  it('keeps custom names usable when no catalog suggestion matches', async () => {
    const onSubmit = jest.fn();
    const screen = render(<ItemForm onSubmit={onSubmit} onCancel={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('Item name'), 'Grandma homemade jam');
    expect(
      screen.getByText('No match yet. You can still add your own item with this name.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add to my pantry' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Grandma homemade jam' }),
      ),
    );
  });
});
