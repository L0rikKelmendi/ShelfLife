import React from 'react';
import { PanResponder } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ItemCard } from '../src/components/ItemCard';
it('enjoys a swiped card without also opening it on the subsequent release click', () => {
  let gesture;
  const responder = jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    gesture = config;
    return { panHandlers: {} };
  });
  let now = 100000;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  const open = jest.fn(),
    enjoy = jest.fn();
  try {
    const screen = render(
      <ItemCard
        item={{
          id: 'milk',
          name: 'Milk',
          quantity: 1,
          unit: 'l',
          category: 'Dairy',
          storageLocation: 'Fridge',
          status: 'active',
          expiresOn: '2050-12-20',
        }}
        today={new Date(2026, 10, 5)}
        onOpen={open}
        onEnjoy={enjoy}
      />,
    );
    act(() => gesture.onPanResponderGrant());
    act(() => gesture.onPanResponderRelease(null, { dx: 90, vx: 0.5 }));
    expect(enjoy).toHaveBeenCalledWith('milk');
    fireEvent.press(screen.getByRole('button', { name: 'Open Milk' }));
    expect(open).not.toHaveBeenCalled();
    now += 600;
    fireEvent.press(screen.getByRole('button', { name: 'Open Milk' }));
    expect(open).toHaveBeenCalledWith('milk');
  } finally {
    clock.mockRestore();
    responder.mockRestore();
  }
});
