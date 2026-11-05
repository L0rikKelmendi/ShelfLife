import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { searchFoods } from '../lib/foodCatalog';
import { FoodPhoto } from './FoodPhoto';
import { colors, fonts, shared } from '../theme';
import { Txt } from './UI';

export default function FoodSuggestions({ query, onChoose, disabled }) {
  const matches = useMemo(() => searchFoods(query), [query]);
  return (
    <View
      style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden' }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F3F6EC' }}>
        <Txt style={{ fontFamily: fonts.bold, fontSize: 11 }}>
          {query.trim() ? 'A little help finding your food' : 'A few pantry favourites'}
        </Txt>
      </View>
      {matches.map((food) => (
        <Pressable
          key={food.id}
          accessibilityRole="button"
          accessibilityLabel={`Choose ${food.name}`}
          disabled={disabled}
          onPress={() => onChoose(food)}
          style={({ pressed, hovered }) => [
            shared.row,
            {
              gap: 13,
              padding: 11,
              borderTopWidth: 1,
              borderColor: colors.border,
              backgroundColor: pressed || hovered ? colors.lightGreen : '#fff',
            },
          ]}
        >
          <FoodPhoto item={food} size={49} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontFamily: fonts.bold, fontSize: 13 }}>{food.name}</Txt>
            <Txt muted style={{ fontSize: 10, marginTop: 4 }}>
              {food.category} · {food.storageLocation} · {food.unit}
            </Txt>
          </View>
          <Txt style={{ color: colors.green, fontSize: 18 }}>+</Txt>
        </Pressable>
      ))}
      {!matches.length && (
        <Txt muted style={{ padding: 14, fontSize: 12 }}>
          No match yet. You can still add your own item with this name.
        </Txt>
      )}
    </View>
  );
}
