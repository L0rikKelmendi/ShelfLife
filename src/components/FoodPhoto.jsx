import React, { memo } from 'react';
import { Image, View } from 'react-native';
import { Leaf } from './Icons';
import { photoFor } from '../lib/photos';

// One photographic stage for cards, suggestions, selection previews and activity.
export const FoodPhoto = memo(function FoodPhoto({ item, size = 64, style, label }) {
  const source = photoFor(item);
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size * 0.23,
          backgroundColor: '#F1F3E9',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          resizeMode="contain"
          accessibilityLabel={label || `${item.name} photo`}
          style={{ width: '82%', height: '82%' }}
        />
      ) : (
        <Leaf size={size * 0.4} color="#7C9468" strokeWidth={1.25} />
      )}
    </View>
  );
});
