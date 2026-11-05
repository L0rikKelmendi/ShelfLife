import { AnimateIn } from './Motion';
import { useQuickAdd } from '../context/QuickAddContext';
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  Plus,
  UserRound,
} from './Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/errors';
import { colors, fonts, shared } from '../theme';
import { Button, IconButton, Logo, Txt } from './UI';

const navigation = [
  { href: '/', label: 'Overview', mobile: 'Today', icon: LayoutDashboard },
  { href: '/pantry', label: 'My pantry', mobile: 'Pantry', icon: Package },
  { href: '/insights', label: 'My impact', mobile: 'Impact', icon: ChartNoAxesCombined },
  { href: '/profile', label: 'My account', mobile: 'Account', icon: UserRound },
];

export default function AppShell({ children }) {
  const { width } = useWindowDimensions();
  const { openAdd } = useQuickAdd();
  const desktop = width >= 1050;
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const { user, mode, logout } = useAuth();
  const { stats } = usePantry();
  const notify = useToast();
  const current =
    navigation.find((item) => item.href === path)?.label ||
    (path === '/item' ? 'Pantry item' : 'My kitchen');
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'friend';
  const exit = async () => {
    try {
      await logout();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {desktop && (
        <View style={styles.sidebar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="ShelfLife overview"
            onPress={() => router.navigate('/')}
            style={{ paddingHorizontal: 25, marginBottom: 47 }}
          >
            <Logo />
          </Pressable>
          <Txt style={[shared.label, { fontSize: 9, marginLeft: 27, marginBottom: 15 }]}>
            YOUR LITTLE KITCHEN
          </Txt>
          <View style={{ gap: 7, paddingHorizontal: 15 }}>
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return (
                <Pressable
                  key={href}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => router.navigate(href)}
                  style={({ hovered }) => [
                    styles.navItem,
                    { backgroundColor: active ? '#EAF0E1' : hovered ? '#F4F6EF' : 'transparent' },
                  ]}
                >
                  <Icon
                    size={19}
                    color={active ? colors.green : colors.muted}
                    strokeWidth={active ? 2 : 1.6}
                  />
                  <Txt
                    style={{
                      fontFamily: active ? fonts.bold : fonts.medium,
                      color: active ? colors.green : colors.muted,
                      fontSize: 13,
                      flex: 1,
                    }}
                  >
                    {label}
                  </Txt>
                  {href === '/pantry' && (
                    <Txt
                      style={{
                        fontSize: 10,
                        color: active ? colors.green : colors.muted,
                        backgroundColor: active ? '#DCE7CB' : '#F0F2EB',
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 5,
                      }}
                    >
                      {stats.active.length}
                    </Txt>
                  )}
                </Pressable>
              );
            })}
          </View>
          <View style={{ padding: 20, marginTop: 24 }}>
            <Button title="Add an item" icon={Plus} onPress={openAdd} />
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.sideNote}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Leaf size={17} color={colors.green} />
              <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                {mode === 'preview' ? 'A little preview' : 'Small steps. Big difference.'}
              </Txt>
            </View>
            <Txt muted style={{ fontSize: 11, lineHeight: 18, marginTop: 9 }}>
              {mode === 'preview'
                ? 'Make yourself at home. Your preview changes stay on this device.'
                : 'A fresher pantry. A lighter footprint. One ingredient at a time.'}
            </Txt>
            {mode === 'preview' && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile')}
                style={[shared.row, { gap: 5, marginTop: 12, minHeight: 30 }]}
              >
                <Txt style={{ fontSize: 11, color: colors.green, fontFamily: fonts.bold }}>
                  About this preview
                </Txt>
                <ChevronRight size={13} color={colors.green} />
              </Pressable>
            )}
          </View>
          <View style={styles.sideAccount}>
            <View style={styles.avatar}>
              <Txt serif style={{ fontSize: 19 }}>
                {firstName[0].toUpperCase()}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }} numberOfLines={1}>
                {firstName}’s kitchen
              </Txt>
              <Txt muted style={{ fontSize: 10, marginTop: 4 }}>
                {mode === 'preview' ? 'Preview account' : 'Your personal pantry'}
              </Txt>
            </View>
            <IconButton
              label={mode === 'preview' ? 'Leave preview' : 'Sign out'}
              icon={LogOut}
              onPress={exit}
            />
          </View>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={[styles.toolbar, { paddingHorizontal: desktop ? 38 : 20 }]}>
          {desktop ? (
            <View style={[shared.row, { gap: 10 }]}>
              <Txt muted style={{ fontSize: 12 }}>
                My kitchen
              </Txt>
              <ChevronRight size={12} color="#A5AD9E" />
              <Txt style={{ fontSize: 12, fontFamily: fonts.medium }}>{current}</Txt>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="ShelfLife overview"
              onPress={() => router.navigate('/')}
            >
              <Logo small />
            </Pressable>
          )}
          <View style={[shared.row, { gap: desktop ? 18 : 6 }]}>
            {mode === 'preview' && (
              <View style={styles.previewBadge}>
                <View
                  style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#8B9D69' }}
                />
                <Txt
                  style={{
                    fontSize: 9,
                    fontFamily: fonts.bold,
                    color: '#738158',
                    letterSpacing: 0.8,
                  }}
                >
                  PREVIEW
                </Txt>
              </View>
            )}
            <View>
              <IconButton
                icon={Bell}
                label="Reminder settings"
                onPress={() => router.push('/profile')}
              />
              {stats.soon.length > 0 && (
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 4,
                    backgroundColor: colors.orange,
                    position: 'absolute',
                    top: 9,
                    right: 12,
                  }}
                />
              )}
            </View>
            {desktop && (
              <View style={[styles.avatar, { width: 33, height: 33 }]}>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                  {firstName[0].toUpperCase()}
                </Txt>
              </View>
            )}
          </View>
        </View>
        <AnimateIn key={path} style={{ flex: 1, minHeight: 0 }}>
          {children}
        </AnimateIn>
        {!desktop && (
          <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 9) }]}>
            {navigation.map(({ href, mobile, icon: Icon }) => (
              <Pressable
                key={href}
                accessibilityRole="button"
                accessibilityLabel={mobile}
                accessibilityState={{ selected: path === href }}
                onPress={() => router.navigate(href)}
                style={styles.bottomItem}
              >
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    backgroundColor: path === href ? colors.lightGreen : 'transparent',
                    borderRadius: 12,
                  }}
                >
                  <Icon
                    size={21}
                    color={path === href ? colors.green : colors.muted}
                    strokeWidth={path === href ? 2 : 1.6}
                  />
                </View>
                <Txt
                  style={{
                    fontSize: 10,
                    color: path === href ? colors.green : colors.muted,
                    fontFamily: path === href ? fonts.bold : fonts.medium,
                  }}
                >
                  {mobile}
                </Txt>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  sidebar: {
    width: 236,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingTop: 32,
  },
  navItem: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 47,
    borderRadius: 12,
  },
  sideNote: { backgroundColor: '#F3F5EB', margin: 19, padding: 18, borderRadius: 16 },
  sideAccount: {
    paddingHorizontal: 19,
    paddingVertical: 21,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 37,
    height: 37,
    borderRadius: 50,
    backgroundColor: '#E6EBD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    height: 76,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFFA8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBadge: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F0F3E8',
  },
  bottomNav: {
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  bottomItem: { alignItems: 'center', gap: 4, flex: 1 },
});
