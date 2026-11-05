import { AnimateIn } from './Motion';
import SwipeEnjoy from './SwipeEnjoy';
import React, { memo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowUpRight, Check, Snowflake } from './Icons';
import { freshness } from '../lib/items';
import { FoodPhoto } from './FoodPhoto';
import { colors, fonts, shared } from '../theme';
import { Txt } from './UI';

const tones = {
  green: [colors.green, colors.lightGreen],
  orange: [colors.orange, colors.lightOrange],
  red: [colors.red, colors.lightRed],
  muted: [colors.muted, '#F0F1EC'],
};

export const ItemCard = memo(function ItemCard({ item, today, onOpen, onEnjoy, busy, style }) {
  const suppressPressUntil = useRef(0);
  const open = () => {
    if (Date.now() >= suppressPressUntil.current) onOpen(item.id);
  };
  const state = freshness(item, today);
  const [foreground, background] = tones[state.tone];

  return (
    <SwipeEnjoy
      style={style}
      enabled={item.status === 'active' && !!onEnjoy && !busy}
      onEnjoy={() => onEnjoy?.(item.id)}
      onSwipeInteraction={() => {
        suppressPressUntil.current = Date.now() + 500;
      }}
    >
      <AnimateIn style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.name}`}
          onPress={open}
          style={({ hovered }) => [
            styles.imageWrap,
            { backgroundColor: colors.lightGreen, opacity: hovered ? 0.9 : 1 },
          ]}
        >
          <FoodPhoto
            item={item}
            size={145}
            style={{ width: '100%', height: '100%', borderRadius: 0 }}
            label={item.name}
          />
          <View style={[styles.badge, { backgroundColor: background }]}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: foreground }} />
            <Txt style={{ fontSize: 10, fontFamily: fonts.bold, color: foreground }}>
              {state.label}
            </Txt>
          </View>
          <View style={styles.openIcon}>
            <ArrowUpRight size={15} color={colors.ink} />
          </View>
        </Pressable>
        <View style={{ padding: 15, gap: 7 }}>
          <Txt style={[shared.label, { fontSize: 9, letterSpacing: 1.1 }]}>
            {item.category.toUpperCase()}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.name}`}
            onPress={open}
          >
            <Txt numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 15 }}>
              {item.name}
            </Txt>
          </Pressable>
          <View style={[shared.between, { marginTop: 1, gap: 5 }]}>
            <Txt muted numberOfLines={2} style={{ fontSize: 11, lineHeight: 17, flexShrink: 1 }}>
              {`${item.quantity} ${item.unit} · ${item.storageLocation}`}
            </Txt>
            {item.storageLocation === 'Freezer' && <Snowflake size={12} color={colors.muted} />}
          </View>
          {item.status === 'active' && onEnjoy && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mark ${item.name} as enjoyed`}
              disabled={busy}
              onPress={() => {
                if (Date.now() >= suppressPressUntil.current) onEnjoy(item.id);
              }}
              style={({ pressed, hovered }) => [
                shared.row,
                {
                  gap: 5,
                  alignSelf: 'flex-start',
                  paddingTop: 8,
                  minHeight: 38,
                  opacity: busy ? 0.4 : pressed ? 0.6 : 1,
                },
              ]}
            >
              <Check size={14} color={colors.green} />
              <Txt style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.green }}>
                Mark as enjoyed
              </Txt>
            </Pressable>
          )}
        </View>
      </AnimateIn>
    </SwipeEnjoy>
  );
});
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    overflow: 'hidden',
    flex: 1,
  },
  imageWrap: {
    height: 145,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 11,
    left: 11,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    height: 25,
    width: 25,
    borderRadius: 20,
    backgroundColor: '#FFFFFFD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
