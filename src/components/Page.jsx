import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Leaf } from './Icons';
import { colors } from '../theme';
import { Txt } from './UI';
export default function Page({ children, style, footer = true, testID }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View
        testID={testID}
        style={[
          {
            width: '100%',
            maxWidth: 1420,
            alignSelf: 'center',
            paddingHorizontal: width >= 1050 ? 38 : 20,
            paddingTop: width >= 1050 ? 32 : 25,
            paddingBottom: 24,
            flex: 1,
          },
          style,
        ]}
      >
        {children}
        {footer && (
          <View
            style={{
              marginTop: 37,
              paddingTop: 21,
              borderTopWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Leaf size={12} color="#9AA88B" />
            <Txt muted style={{ fontSize: 10, letterSpacing: 0.3 }}>
              A little less waste. A lot more possibility.
            </Txt>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
