# Asset credits

Food photographs are downloaded and bundled with the app, so the main UI does not rely on image network requests at presentation time. They are illustrative category/name matches, not user-uploaded photos.

Source: [Unsplash](https://unsplash.com/), [Unsplash license](https://unsplash.com/license).

| Asset | Original image |
| --- | --- |
| Pantry hero | https://images.unsplash.com/photo-1542838132-92c53300491e |
| Avocado | https://images.unsplash.com/photo-1523049673857-eb18f1d7b578 |
| Strawberries | https://images.unsplash.com/photo-1464965911861-746a04b4bca6 |
| Spinach | https://images.unsplash.com/photo-1576045057995-568f588f82fb |
| Yogurt | https://images.unsplash.com/photo-1488477181946-6428a0291777 |
| Bread | https://images.unsplash.com/photo-1509440159596-0249088772ff |
| Oranges | https://images.unsplash.com/photo-1547514701-42782101795e |
| Salmon | https://images.unsplash.com/photo-1510130387422-82bed34b37e9 |
| Oats | https://images.unsplash.com/photo-1517673132405-a56a62b18caf |

The botanical app icon is drawn for this project. Interface icons use [Lucide](https://lucide.dev/). The fonts are [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display), distributed by the installed Expo Google Fonts packages with their font licenses.

## Ingredient catalog

330 catalog entries have bundled thumbnails. Ingredient cutouts come from [TheMealDB](https://www.themealdb.com/api.php), downloaded from `https://www.themealdb.com/images/ingredients/{ingredient}-small.png`. Exact source ingredient names are retained in `src/lib/foods.json`. Images are bundled for this educational demonstration, not fetched at runtime.

Catalog metadata provides editable defaults, not product-specific expiry advice.

## Custom ingredient artwork

`assets/food/catalog/cornflakes-premium.png` is a generated transparent ingredient cutout created for this project. Ingredient pictures share the FoodPhoto framing component.
