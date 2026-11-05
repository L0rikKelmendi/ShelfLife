import {
  cleanItem,
  dateKey,
  daysUntil,
  filterItems,
  freshness,
  summarize,
  validDate,
} from '../src/lib/items';

const values = {
  name: '  Apples  ',
  quantity: '2',
  unit: 'pcs',
  category: 'Produce',
  storageLocation: 'Fridge',
  expiresOn: '2026-11-05',
  reminder: false,
};
const today = new Date(2026, 10, 4, 12);
describe('pantry domain behavior', () => {
  it('validates calendar dates including leap years', () => {
    expect(validDate('2028-02-29')).toBe(true);
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2026-13-01')).toBe(false);
    expect(validDate('2026-1-1')).toBe(false);
  });
  it('uses calendar days, even across daylight-saving changes', () => {
    expect(daysUntil('2026-11-02', new Date(2026, 9, 31, 23, 59))).toBe(2);
    expect(dateKey(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
  it('normalizes input and rejects invalid quantities', () => {
    expect(cleanItem(values)).toEqual({ ...values, name: 'Apples', quantity: 2 });
    expect(() => cleanItem({ ...values, quantity: 'NaN' })).toThrow();
    expect(() => cleanItem({ ...values, quantity: -1 })).toThrow();
  });
  it('separates expired items from upcoming reminders and derives honest outcomes', () => {
    const items = [
      { ...values, id: 'a', status: 'active' },
      { ...values, id: 'b', status: 'active', expiresOn: '2026-11-03' },
      { ...values, id: 'c', status: 'used' },
      { ...values, id: 'd', status: 'wasted' },
    ];
    expect(summarize(items, today)).toEqual(
      expect.objectContaining({ enjoyed: 1, wasted: 1, rate: 50 }),
    );
    expect(summarize(items, today).soon.map((item) => item.id)).toEqual(['a']);
    expect(summarize(items, today).expired.map((item) => item.id)).toEqual(['b']);
    expect(summarize([], today).rate).toBeNull();
    expect(freshness(items[1], today).label).toBe('1d past date');
  });
  it('combines search, category and location filters without mutating records', () => {
    const items = [
      { ...values, name: 'Apples', id: 'a', status: 'active' },
      { ...values, id: 'b', name: 'Oat milk', category: 'Dairy', status: 'active' },
    ];
    expect(
      filterItems(items, { search: ' APP ', category: 'Produce', location: 'Fridge' }).map(
        (item) => item.id,
      ),
    ).toEqual(['a']);
    expect(items[0].id).toBe('a');
  });
});
