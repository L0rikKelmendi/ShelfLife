import { dateKey, shiftDate } from './items';

export function timestampDate(value) {
  if (value == null) return null;
  let result;
  if (typeof value.toDate === 'function') result = value.toDate();
  else if (typeof value === 'object' && typeof value.seconds === 'number')
    result = new Date(value.seconds * 1000);
  else result = new Date(value);
  return Number.isFinite(result.getTime()) ? result : null;
}
export function weeklyActivity(items, today = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const key = shiftDate(index - 6, today);
    const [y, m, d] = key.split('-').map(Number);
    return {
      key,
      label: new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }),
      used: 0,
      wasted: 0,
    };
  });
  const lookup = new Map(days.map((day) => [day.key, day]));
  for (const item of items) {
    if (!['used', 'wasted'].includes(item.status)) continue;
    const date = timestampDate(item.updatedAt);
    if (!date || date > today) continue;
    const day = lookup.get(dateKey(date));
    if (day) day[item.status]++;
  }
  return days;
}
export function recentActivity(items, today = new Date(), limit = 6) {
  return items
    .map((item) => ({
      item,
      date: timestampDate(item.status === 'active' ? item.createdAt : item.updatedAt),
    }))
    .filter((entry) => entry.date && entry.date <= today)
    .sort((a, b) => b.date - a.date || a.item.id.localeCompare(b.item.id))
    .slice(0, limit);
}
export function activityTime(date, today) {
  const sameDay = dateKey(date) === dateKey(today);
  return `${sameDay ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
