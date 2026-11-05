import foods from './foods.json';

export const FOODS = foods;
export const normalizeFoodName = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const labels = (food) => [food.name, ...food.aliases].map(normalizeFoodName);
const index = FOODS.map((food, order) => ({ food, names: labels(food), order }));

export function searchFoods(value, limit = 6) {
  const query = normalizeFoodName(value);
  if (!query) return FOODS.slice(0, limit);
  return index
    .map(({ food, names, order }) => {
      const score =
        names[0] === query
          ? 0
          : names[0].startsWith(query)
            ? 1
            : names.some((name) => name.startsWith(query))
              ? 2
              : names.some((name) => name.includes(query))
                ? 3
                : 4;
      return { food, score, order };
    })
    .filter(({ score }) => score < 4)
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, limit)
    .map(({ food }) => food);
}

export function findFood(value) {
  const query = normalizeFoodName(value);
  if (!query) return null;
  const exact =
    index.find(({ names }) => names[0] === query) ||
    index.find(({ names }) => names.includes(query));
  if (exact) return exact.food;
  // Longest named ingredient wins: almond milk must not become plain milk.
  const words = ` ${query.replace(/[^a-z0-9 ]/g, ' ')} `;
  return (
    index
      .flatMap(({ food, names }) =>
        names
          .filter((name) => name.length >= 4 && words.includes(` ${name} `))
          .map((name) => ({ food, length: name.length })),
      )
      .sort((a, b) => b.length - a.length)[0]?.food || null
  );
}
