import React, { useMemo, useState } from 'react';
import { Animated, PanResponder, View, Platform } from 'react-native';
import { Check } from './Icons';
import { useReducedMotion } from './Motion';
import { colors } from '../theme';

export default function SwipeEnjoy({ children, enabled, onEnjoy, onSwipeInteraction, style }) {
  const [x] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  const handlers = useMemo(() => {
    const finish = () =>
      Animated.timing(x, {
        toValue: 0,
        duration: reduced ? 0 : 170,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    const claim = (_, gesture) =>
      enabled && gesture.dx > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.6;
    return PanResponder.create({
      onPanResponderGrant: () => onSwipeInteraction?.(),
      onMoveShouldSetPanResponder: claim,
      onMoveShouldSetPanResponderCapture: claim,
      onPanResponderMove: (_, gesture) => x.setValue(Math.max(0, Math.min(105, gesture.dx))),
      onPanResponderRelease: (_, gesture) => {
        onSwipeInteraction?.();
        finish();
        if (gesture.dx >= 72 || (gesture.dx > 32 && gesture.vx > 0.65)) onEnjoy();
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        onSwipeInteraction?.();
        finish();
      },
    });
  }, [enabled, onEnjoy, onSwipeInteraction, reduced, x]);
  return (
    <View
      style={[
        { borderRadius: 20, backgroundColor: colors.green, overflow: 'hidden', flex: 1 },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 22, top: 0, bottom: 0, justifyContent: 'center' }}
      >
        <Check size={27} color="#D5E9AD" />
      </View>
      <Animated.View {...handlers.panHandlers} style={{ flex: 1, transform: [{ translateX: x }] }}>
        {children}
      </Animated.View>
    </View>
  );
}
