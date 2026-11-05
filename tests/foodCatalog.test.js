import { FOODS, findFood, searchFoods } from '../src/lib/foodCatalog';
import { validateItem } from '../src/lib/items';
import { foodImages } from '../src/lib/foodImages';

describe('local food catalog', () => {
  it('ranks exact and prefix matches first and supports Albanian aliases', () => {
    expect(searchFoods('straw')[0].name).toBe('Strawberries');
    expect(searchFoods('MIL')[0].name).toBe('Milk');
    expect(searchFoods('cornf')[0].name).toBe('Cornflakes');
    expect(searchFoods('QUMË')[0].name).toBe('Milk');
    expect(searchFoods('not-a-food')).toEqual([]);
    expect(searchFoods('')).toHaveLength(6);
  });
  it('maps every catalog item to a bundled image and gives specific names precedence', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(300);
    expect(new Set(FOODS.map((food) => food.id)).size).toBe(FOODS.length);
    for (const food of FOODS) {
      expect(foodImages[food.id]).toBeDefined();
      expect(findFood(food.name).id).toBe(food.id);
      expect(validateItem({ ...food, quantity: 1, expiresOn: '2050-01-01' })).toBeNull();
    }
    expect(findFood('Almond milk').id).toBe('almond-milk');
    expect(findFood('Fresh almond milk').id).toBe('almond-milk');
    expect(findFood('Sweet oranges').id).toBe('oranges');
    expect(findFood('Unknown food')).toBeNull();
  });
});
