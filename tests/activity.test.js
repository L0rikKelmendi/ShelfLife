import { recentActivity, timestampDate, weeklyActivity } from '../src/lib/activity';
const now = new Date(2026, 10, 5, 12);
describe('weekly saved outcomes', () => {
  it('buckets real timestamps into seven local calendar days and excludes future/active records', () => {
    const days = weeklyActivity(
      [
        { status: 'used', updatedAt: { toDate: () => new Date(2026, 10, 5, 10) } },
        { status: 'wasted', updatedAt: new Date(2026, 10, 4, 11).getTime() },
        { status: 'used', updatedAt: new Date(2026, 9, 1).toISOString() },
        { status: 'used', updatedAt: new Date(2026, 10, 6).toISOString() },
        { status: 'active', updatedAt: now },
        { status: 'used', updatedAt: null },
      ],
      now,
    );
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toEqual(expect.objectContaining({ key: '2026-11-05', used: 1, wasted: 0 }));
    expect(days.at(-2).wasted).toBe(1);
    expect(days.reduce((sum, day) => sum + day.used + day.wasted, 0)).toBe(2);
    expect(timestampDate({ seconds: 123 }).getTime()).toBe(123000);
    expect(timestampDate('nonsense')).toBeNull();
  });
  it('uses creation time for active items and sorts current outcomes without mutating records', () => {
    const records = [
      {
        id: 'a',
        status: 'active',
        createdAt: new Date(2026, 10, 5, 8),
        updatedAt: new Date(2026, 10, 5, 11),
      },
      { id: 'b', status: 'used', createdAt: 0, updatedAt: new Date(2026, 10, 5, 10) },
      { id: 'c', status: 'wasted', updatedAt: null },
    ];
    expect(recentActivity(records, now).map((entry) => entry.item.id)).toEqual(['b', 'a']);
    expect(records[0].id).toBe('a');
    expect(weeklyActivity([], now).every((day) => day.used === 0 && day.wasted === 0)).toBe(true);
  });
});
