export const CATEGORIES = ['Produce', 'Dairy', 'Meat & fish', 'Grains', 'Other'];
export const LOCATIONS = ['Fridge', 'Freezer', 'Pantry'];
export const UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'packs'];

export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function shiftDate(days, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function daysUntil(value, today = new Date()) {
  if (!validDate(value)) return 0;
  const [y, m, d] = value.split('-').map(Number);
  return Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000,
  );
}

export function freshness(item, today = new Date()) {
  if (item.status === 'used') return { label: 'Enjoyed', tone: 'green', days: 0 };
  if (item.status === 'wasted') return { label: 'Discarded', tone: 'muted', days: 0 };
  const days = daysUntil(item.expiresOn, today);
  if (days < 0) return { label: `${Math.abs(days)}d past date`, tone: 'red', days };
  if (days === 0) return { label: 'Use today', tone: 'red', days };
  if (days === 1) return { label: 'Use tomorrow', tone: 'orange', days };
  if (days <= 3) return { label: `Use in ${days} days`, tone: 'orange', days };
  return { label: `${days} days left`, tone: 'green', days };
}

export function validateItem(values) {
  if (!values.name?.trim()) return 'Give your item a name.';
  if (values.name.trim().length > 80) return 'Keep the name under 80 characters.';
  if (
    !Number.isFinite(Number(values.quantity)) ||
    Number(values.quantity) <= 0 ||
    Number(values.quantity) > 9999
  )
    return 'Enter a quantity between 0 and 9,999.';
  if (!UNITS.includes(values.unit)) return 'Choose a unit.';
  if (!CATEGORIES.includes(values.category)) return 'Choose a category.';
  if (!LOCATIONS.includes(values.storageLocation)) return 'Choose a storage location.';
  if (!validDate(values.expiresOn)) return 'Enter a valid date in YYYY-MM-DD format.';
  return null;
}

export function cleanItem(values) {
  const error = validateItem(values);
  if (error) throw new Error(error);
  return {
    name: values.name.trim(),
    quantity: Number(values.quantity),
    unit: values.unit,
    category: values.category,
    storageLocation: values.storageLocation,
    expiresOn: values.expiresOn,
    reminder: !!values.reminder,
  };
}

export function summarize(items, today = new Date()) {
  const active = items.filter((item) => item.status === 'active');
  const enjoyed = items.filter((item) => item.status === 'used').length;
  const wasted = items.filter((item) => item.status === 'wasted').length;
  const soon = active.filter((item) => {
    const days = daysUntil(item.expiresOn, today);
    return days >= 0 && days <= 3;
  });
  const expired = active.filter((item) => daysUntil(item.expiresOn, today) < 0);
  return {
    active,
    enjoyed,
    wasted,
    soon,
    expired,
    rate: enjoyed + wasted ? Math.round((enjoyed / (enjoyed + wasted)) * 100) : null,
  };
}

export function filterItems(
  items,
  { search = '', category = 'All', location = 'All', status = 'active', sort = 'expiry' } = {},
) {
  const text = search.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        (status === 'history' ? item.status !== 'active' : item.status === status) &&
        (category === 'All' || item.category === category) &&
        (location === 'All' || item.storageLocation === location) &&
        (!text ||
          `${item.name} ${item.category} ${item.storageLocation}`.toLowerCase().includes(text)),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : a.expiresOn.localeCompare(b.expiresOn) || a.name.localeCompare(b.name),
    );
}

export function seedItems() {
  const item = (id, name, category, quantity, unit, storageLocation, days, status = 'active') => ({
    id,
    name,
    category,
    quantity,
    unit,
    storageLocation,
    expiresOn: shiftDate(days),
    status,
    reminder: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return [
    item('demo-avocado', 'Ripe avocados', 'Produce', 2, 'pcs', 'Pantry', 0),
    item('demo-strawberry', 'Strawberries', 'Produce', 250, 'g', 'Fridge', 1),
    item('demo-spinach', 'Baby spinach', 'Produce', 150, 'g', 'Fridge', 2),
    item('demo-yogurt', 'Greek yogurt', 'Dairy', 500, 'g', 'Fridge', 3),
    item('demo-bread', 'Sourdough loaf', 'Grains', 1, 'pcs', 'Pantry', 5),
    item('demo-orange', 'Sweet oranges', 'Produce', 4, 'pcs', 'Fridge', 8),
    item('demo-salmon', 'Salmon fillets', 'Meat & fish', 2, 'pcs', 'Freezer', 18),
    item('demo-oats', 'Rolled oats', 'Grains', 1, 'packs', 'Pantry', 45),
    item('demo-used-1', 'Cherry tomatoes', 'Produce', 250, 'g', 'Fridge', -1, 'used'),
    item('demo-used-2', 'Fresh basil', 'Produce', 1, 'packs', 'Fridge', -2, 'used'),
    item('demo-used-3', 'Oat milk', 'Dairy', 1, 'l', 'Fridge', -3, 'used'),
  ];
}
