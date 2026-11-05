import React from 'react';
import { render } from '@testing-library/react-native';
import { ItemCard } from '../src/components/ItemCard';

describe('snapshot: pantry item card', () => {
  it('renders a stable expiry state with a fixed local date', () => {
    const item = {
      id: 'item-1',
      name: 'Ripe avocados',
      category: 'Produce',
      quantity: 2,
      unit: 'pcs',
      storageLocation: 'Pantry',
      expiresOn: '2026-11-05',
      status: 'active',
    };
    const view = render(
      <ItemCard
        item={item}
        today={new Date(2026, 10, 4, 12)}
        onOpen={jest.fn()}
        onEnjoy={jest.fn()}
      />,
    );
    expect(view.getByText('Use tomorrow')).toBeTruthy();
    expect(view.toJSON()).toMatchSnapshot();
  });
});
