import { findFood } from './foodCatalog';
import { foodImages } from './foodImages';

export const photos = {
  hero: require('../../assets/food/hero.jpg'),
  avocado: require('../../assets/food/avocado.jpg'),
  strawberry: require('../../assets/food/strawberry.jpg'),
  spinach: require('../../assets/food/spinach.jpg'),
  yogurt: require('../../assets/food/yogurt.jpg'),
  bread: require('../../assets/food/bread.jpg'),
  orange: require('../../assets/food/orange.jpg'),
  salmon: require('../../assets/food/salmon.jpg'),
  oats: require('../../assets/food/oats.jpg'),
};
export function photoFor(item) {
  const food = findFood(item.name);
  if (food) return foodImages[food.id];
  const name = item.name.toLowerCase();
  if (/avocado/.test(name)) return photos.avocado;
  if (/strawberr|berr/.test(name)) return photos.strawberry;
  if (/spinach|basil|lettuce|salad/.test(name)) return photos.spinach;
  if (/yogurt|milk|cheese/.test(name)) return photos.yogurt;
  if (/bread|sourdough|loaf/.test(name)) return photos.bread;
  if (/orange|citrus|lemon/.test(name)) return photos.orange;
  if (/salmon|fish/.test(name)) return photos.salmon;
  if (/oat|grain|rice/.test(name)) return photos.oats;
  return null;
}
