import { useReducedMotion } from './Motion';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ArrowLeft, ArrowRight, Leaf, Plus, X } from './Icons';
import { router } from 'expo-router';
import { colors, fonts, shared } from '../theme';

export function Txt({ children, style, serif, muted, ...props }) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: serif ? fonts.serif : fonts.regular,
          color: muted ? colors.muted : colors.ink,
          fontSize: 14,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Logo({ small, light }) {
  return (
    <View style={[shared.row, { gap: 9 }]}>
      <View
        style={{
          width: small ? 31 : 36,
          height: small ? 31 : 36,
          backgroundColor: light ? '#ffffff18' : colors.green,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-8deg' }],
        }}
      >
        <Leaf color={light ? colors.lime : '#fff'} size={small ? 19 : 23} strokeWidth={1.7} />
      </View>
      <Txt
        serif
        style={{
          fontSize: small ? 25 : 29,
          letterSpacing: -0.7,
          color: light ? '#fff' : colors.ink,
        }}
      >
        shelflife<Txt style={{ color: light ? colors.lime : colors.green, fontSize: 24 }}>.</Txt>
      </Txt>
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon: Icon,
  variant = 'primary',
  loading,
  disabled,
  small,
  style,
  testID,
  ...props
}) {
  const secondary = variant === 'secondary';
  const ghost = variant === 'ghost';
  const danger = variant === 'danger';
  const fg = secondary || ghost ? colors.green : '#fff';
  return (
    <Pressable
      {...props}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        {
          minHeight: small ? 44 : 48,
          paddingHorizontal: small ? 15 : 21,
          backgroundColor: ghost
            ? 'transparent'
            : secondary
              ? colors.lightGreen
              : danger
                ? colors.red
                : colors.green,
          opacity: disabled ? 0.45 : pressed ? 0.75 : 1,
          transform: [{ translateY: hovered && !disabled ? -1 : 0 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : Icon ? (
        <Icon size={small ? 16 : 18} color={fg} strokeWidth={1.8} />
      ) : null}
      <Txt style={{ color: fg, fontFamily: fonts.bold, fontSize: small ? 12 : 13 }}>{title}</Txt>
    </Pressable>
  );
}
export function IconButton({ icon: Icon, label, onPress, color = colors.ink, style, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed, hovered }) => [
        {
          height: 44,
          width: 44,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed || hovered ? colors.lightGreen : 'transparent',
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Icon size={20} color={color} strokeWidth={1.7} />
    </Pressable>
  );
}
export function PageHeading({ eyebrow, title, subtitle, action, back }) {
  return (
    <View style={{ marginBottom: 26 }}>
      {back && (
        <Pressable
          accessibilityRole="button"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/pantry'))}
          style={[shared.row, { gap: 7, alignSelf: 'flex-start', marginBottom: 20 }]}
        >
          <ArrowLeft size={16} color={colors.green} />
          <Txt style={{ color: colors.green, fontFamily: fonts.medium, fontSize: 12 }}>
            Back to pantry
          </Txt>
        </Pressable>
      )}
      {eyebrow && <Txt style={[shared.label, { marginBottom: 9 }]}>{eyebrow}</Txt>}
      <View style={[shared.between, { gap: 16, flexWrap: 'wrap' }]}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Txt
            serif
            accessibilityRole="header"
            style={{ fontSize: 36, lineHeight: 44, letterSpacing: -0.8 }}
          >
            {title}
          </Txt>
          {subtitle && (
            <Txt muted style={{ marginTop: 7, lineHeight: 22, fontSize: 13 }}>
              {subtitle}
            </Txt>
          )}
        </View>
        {action}
      </View>
    </View>
  );
}
export function SectionHeading({ title, subtitle, link, onPress, badge }) {
  return (
    <View style={[shared.between, { gap: 10, marginBottom: 19 }]}>
      <View style={{ flex: 1 }}>
        <View style={[shared.row, { gap: 9 }]}>
          <Txt serif style={{ fontSize: 25, letterSpacing: -0.3 }}>
            {title}
          </Txt>
          {badge !== undefined && (
            <View
              style={{
                backgroundColor: colors.lightOrange,
                borderRadius: 7,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <Txt style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.orange }}>
                {badge}
              </Txt>
            </View>
          )}
        </View>
        {subtitle && (
          <Txt muted style={{ fontSize: 12, marginTop: 5, lineHeight: 18 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {link && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={link}
          onPress={onPress}
          style={[shared.row, { gap: 6, minHeight: 42 }]}
        >
          <Txt style={{ color: colors.green, fontSize: 12, fontFamily: fonts.bold }}>{link}</Txt>
          <ArrowRight size={15} color={colors.green} />
        </Pressable>
      )}
    </View>
  );
}
export function Chip({ label, selected, onPress, icon: Icon }) {
  return (
    <Pressable
      {...(Platform.OS === 'web' ? { 'aria-pressed': !!selected } : {})}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        shared.row,
        {
          gap: 7,
          paddingVertical: 11,
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: selected ? colors.green : colors.border,
          backgroundColor: selected ? colors.green : colors.white,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {Icon && <Icon size={15} color={selected ? '#fff' : colors.muted} />}
      <Txt
        style={{
          color: selected ? '#fff' : colors.muted,
          fontFamily: selected ? fonts.bold : fonts.medium,
          fontSize: 12,
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}
export function Field({ label, error, style, inputStyle, onFocus, onBlur, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 8 }, style]}>
      <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9AA194"
        {...props}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          focused && { borderColor: colors.green, backgroundColor: '#FCFDF9' },
          error && { borderColor: colors.red },
          inputStyle,
        ]}
      />
    </View>
  );
}
export function EmptyState({
  title = 'A fresh start.',
  message = 'Your pantry is waiting for its first ingredient.',
  action,
  onPress,
  icon: Icon = Leaf,
}) {
  return (
    <View
      style={[
        shared.card,
        {
          padding: 30,
          alignItems: 'center',
          gap: 13,
          backgroundColor: '#FCFDF9',
          borderRadius: 23,
        },
      ]}
    >
      <View
        style={{
          height: 64,
          width: 64,
          borderRadius: 24,
          backgroundColor: colors.lightGreen,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={29} strokeWidth={1.3} color={colors.green} />
      </View>
      <Txt serif style={{ fontSize: 25, textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt muted style={{ textAlign: 'center', maxWidth: 300, lineHeight: 22 }}>
        {message}
      </Txt>
      {action && (
        <Button small title={action} onPress={onPress} icon={Plus} style={{ marginTop: 5 }} />
      )}
    </View>
  );
}
export function ErrorState({ message, onRetry }) {
  return (
    <View
      accessibilityRole="alert"
      style={[shared.card, { padding: 24, gap: 14, borderColor: '#EACCC4' }]}
    >
      <Txt serif style={{ fontSize: 25 }}>
        Let’s get your pantry back.
      </Txt>
      <Txt style={{ color: colors.red, lineHeight: 23 }}>{message}</Txt>
      <Button
        title="Try again"
        variant="secondary"
        onPress={onRetry}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}
export function Skeleton({ style }) {
  const [opacity] = useState(() => new Animated.Value(0.65));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.65);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ backgroundColor: '#DCE5D1', borderRadius: 12, opacity }, style]}
    />
  );
}
export function LoadingState() {
  return (
    <View
      accessibilityLabel="Loading pantry"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      style={{ paddingVertical: 28, width: '100%', gap: 17 }}
    >
      <Skeleton style={{ width: '48%', height: 18 }} />
      <View style={{ flexDirection: 'row', gap: 15 }}>
        {[0, 1].map((key) => (
          <View key={key} style={[shared.card, { flex: 1, padding: 14, gap: 13 }]}>
            <Skeleton style={{ height: 120 }} />
            <Skeleton style={{ height: 13, width: '70%' }} />
            <Skeleton style={{ height: 10, width: '45%' }} />
          </View>
        ))}
      </View>
      <View style={[shared.row, { gap: 10, justifyContent: 'center', padding: 8 }]}>
        <ActivityIndicator size="small" color={colors.green} />
        <Txt muted style={{ fontSize: 12 }}>
          Getting things fresh…
        </Txt>
      </View>
    </View>
  );
}
export function Dialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
  loading,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !loading && onClose()}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: '#16251CB0',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 22,
        }}
      >
        <View
          accessibilityViewIsModal
          style={[shared.card, { padding: 28, width: '100%', maxWidth: 420, gap: 16 }]}
        >
          <View style={shared.between}>
            <Txt serif style={{ fontSize: 27, flex: 1 }}>
              {title}
            </Txt>
            <IconButton label="Close dialog" icon={X} disabled={loading} onPress={onClose} />
          </View>
          <Txt muted style={{ lineHeight: 23 }}>
            {message}
          </Txt>
          <View style={[shared.row, { gap: 10, justifyContent: 'flex-end', marginTop: 8 }]}>
            <Button title="Cancel" variant="ghost" disabled={loading} onPress={onClose} />
            <Button
              title={confirmLabel}
              variant={danger ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
export function HorizontalChoices({ children, resetKey }) {
  const scroll = useRef(null);
  useEffect(() => {
    if (resetKey) scroll.current?.scrollTo({ x: 0, animated: false });
  }, [resetKey]);
  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 3 }}
    >
      {children}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    color: colors.ink,
    fontFamily: fonts.regular,
  },
});
