import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  changeItemStatus,
  createItem,
  editItem,
  removeItem,
  watchItems,
} from '../src/services/pantry';

jest.mock('../src/services/firebase', () => ({ db: { test: true } }));
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(() => 'items-ref'),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => 'item-ref'),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'server-time'),
  updateDoc: jest.fn(),
}));
const values = {
  name: '  Apples ',
  quantity: '2',
  unit: 'pcs',
  category: 'Produce',
  storageLocation: 'Fridge',
  expiresOn: '2026-11-05',
  reminder: true,
};

describe('mocking: Firebase CRUD boundary', () => {
  beforeEach(() => jest.clearAllMocks());
  it('creates a validated item inside the signed-in user’s collection', async () => {
    addDoc.mockResolvedValue({ id: 'new-item' });
    await expect(createItem('alice', values)).resolves.toBe('new-item');
    expect(collection).toHaveBeenCalledWith({ test: true }, 'users', 'alice', 'items');
    expect(addDoc).toHaveBeenCalledWith(
      'items-ref',
      expect.objectContaining({
        name: 'Apples',
        quantity: 2,
        status: 'active',
        createdAt: 'server-time',
        updatedAt: 'server-time',
      }),
    );
  });
  it('maps realtime records and returns the subscription cleanup', () => {
    const callback = jest.fn();
    const unsubscribe = jest.fn();
    onSnapshot.mockImplementation((ref, receive) => {
      receive({ docs: [{ id: 'a', data: () => ({ name: 'Apple' }) }] });
      return unsubscribe;
    });
    expect(watchItems('alice', callback, jest.fn())).toBe(unsubscribe);
    expect(callback).toHaveBeenCalledWith([{ id: 'a', name: 'Apple' }]);
  });
  it('updates details and status, then deletes the exact owned document', async () => {
    await editItem('alice', 'a', values);
    expect(doc).toHaveBeenCalledWith({ test: true }, 'users', 'alice', 'items', 'a');
    expect(updateDoc).toHaveBeenCalledWith(
      'item-ref',
      expect.objectContaining({ name: 'Apples', updatedAt: 'server-time' }),
    );
    await changeItemStatus('alice', 'a', 'used');
    expect(updateDoc).toHaveBeenLastCalledWith('item-ref', {
      status: 'used',
      updatedAt: 'server-time',
    });
    await removeItem('alice', 'a');
    expect(deleteDoc).toHaveBeenCalledWith('item-ref');
  });
  it('propagates write failures so the UI cannot report false success', async () => {
    addDoc.mockRejectedValue(new Error('Offline'));
    await expect(createItem('alice', values)).rejects.toThrow('Offline');
  });
  it('rejects invalid input before attempting a network write', async () => {
    await expect(createItem('alice', { ...values, name: '' })).rejects.toThrow();
    expect(addDoc).not.toHaveBeenCalled();
    await expect(changeItemStatus('alice', 'a', 'unknown')).rejects.toThrow('Invalid item status.');
  });
});
