import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, Platform } from 'react-native';
import { colors, fonts } from '../theme';

const MotionPreference = createContext(true);
export function MotionProvider({ children }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  return <MotionPreference.Provider value={reduced}>{children}</MotionPreference.Provider>;
}
export const useReducedMotion = () => useContext(MotionPreference);
export function AnimateIn({ children, style, delay = 0, ...props }) {
  const [value] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    value.setValue(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 210,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [value, reduced, delay]);
  return (
    <Animated.View
      {...props}
      style={[
        style,
        {
          opacity: value,
          transform: [
            { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function AnimatedCount({ value, style }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const previous = useRef(value);
  useEffect(() => {
    if (reduced || typeof value !== 'number' || typeof previous.current !== 'number') {
      previous.current = value;
      setShown(value);
      return;
    }
    const start = previous.current;
    previous.current = value;
    let frame;
    const began = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - began) / 240);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced]);
  return (
    <Text
      style={[{ fontFamily: fonts.serif, color: colors.ink }, style]}
      accessibilityLabel={`${value}`}
    >
      {shown}
    </Text>
  );
}
