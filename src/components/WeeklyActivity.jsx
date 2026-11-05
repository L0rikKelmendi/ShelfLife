import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { weeklyActivity, recentActivity, activityTime } from '../lib/activity';
import { FoodPhoto } from './FoodPhoto';
import { Txt } from './UI';
import { colors, fonts, shared } from '../theme';

export default function WeeklyActivity({ items, now }) {
  const days = useMemo(() => weeklyActivity(items, now), [items, now]);
  const activity = useMemo(() => recentActivity(items, now), [items, now]);
  const used = days.reduce((sum, day) => sum + day.used, 0);
  const wasted = days.reduce((sum, day) => sum + day.wasted, 0);
  const max = Math.max(1, ...days.map((day) => day.used + day.wasted));
  return (
    <View style={{ gap: 20, marginBottom: 24 }}>
      <View style={[shared.card, { padding: 24, gap: 18, borderRadius: 23 }]}>
        <View style={[shared.between, { gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <Txt style={[shared.label, { fontSize: 9 }]}>YOUR LAST SEVEN DAYS</Txt>
            <Txt serif accessibilityRole="header" style={{ fontSize: 26, marginTop: 5 }}>
              A week of little wins.
            </Txt>
          </View>
          <View style={{ backgroundColor: colors.lightGreen, borderRadius: 12, padding: 10 }}>
            <Txt style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.green }}>
              {used} enjoyed
            </Txt>
          </View>
        </View>
        <View style={[shared.row, { gap: 16, flexWrap: 'wrap' }]}>
          {[
            [colors.green, `${used} Enjoyed`],
            [colors.orange, `${wasted} Discarded`],
          ].map(([color, label]) => (
            <View key={color} style={[shared.row, { gap: 6 }]}>
              <View style={{ width: 7, height: 7, borderRadius: 3, backgroundColor: color }} />
              <Txt muted style={{ fontSize: 11 }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingTop: 3 }}>
          {days.map((day) => (
            <View
              key={day.key}
              accessible
              accessibilityLabel={`${day.label}: ${day.used} enjoyed, ${day.wasted} discarded`}
              style={{ flex: 1, alignItems: 'center', gap: 8 }}
            >
              <Txt style={{ fontSize: 10, color: colors.muted }}>
                {day.used + day.wasted || '—'}
              </Txt>
              <View
                style={{
                  height: 114,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}
              >
                <View
                  style={{
                    width: '70%',
                    maxWidth: 38,
                    borderRadius: 7,
                    overflow: 'hidden',
                    backgroundColor: '#F0F3E9',
                    minHeight: 4,
                  }}
                >
                  {day.wasted > 0 && (
                    <View
                      style={{ height: (day.wasted / max) * 108, backgroundColor: '#C28A5F' }}
                    />
                  )}
                  {day.used > 0 && (
                    <View
                      style={{
                        height: (day.used / max) * 108,
                        backgroundColor: dateKeyMatch(day.key, now) ? colors.green : '#9EB487',
                      }}
                    />
                  )}
                </View>
              </View>
              <Txt
                style={{
                  fontSize: 10,
                  fontFamily: dateKeyMatch(day.key, now) ? fonts.bold : fonts.regular,
                  color: dateKeyMatch(day.key, now) ? colors.green : colors.muted,
                }}
              >
                {day.label}
              </Txt>
            </View>
          ))}
        </View>
        {!used && !wasted && (
          <Txt muted style={{ fontSize: 12, lineHeight: 20 }}>
            Your next good meal starts the story. Mark an ingredient as enjoyed to see it here.
          </Txt>
        )}
        <Txt muted style={{ fontSize: 10, lineHeight: 17 }}>
          Saved outcomes over the last seven days, based on the records in your pantry.
        </Txt>
      </View>
      <View style={[shared.card, { padding: 24, gap: 16, borderRadius: 23 }]}>
        <Txt serif accessibilityRole="header" style={{ fontSize: 26 }}>
          The latest from your kitchen.
        </Txt>
        {activity.map(({ item, date }) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`View activity for ${item.name}`}
            onPress={() => router.push({ pathname: '/item', params: { id: item.id } })}
            style={[shared.row, { gap: 13, minHeight: 68 }]}
          >
            <FoodPhoto item={item} size={54} />
            <View style={{ flex: 1, gap: 5 }}>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>{item.name}</Txt>
              <Txt muted style={{ fontSize: 10 }}>
                {activityTime(date, now)}
              </Txt>
            </View>
            <Txt
              style={{
                color: item.status === 'wasted' ? colors.orange : colors.green,
                fontFamily: fonts.medium,
                fontSize: 11,
              }}
            >
              {item.status === 'used'
                ? 'Enjoyed'
                : item.status === 'wasted'
                  ? 'Discarded'
                  : 'Added'}
            </Txt>
          </Pressable>
        ))}
        {!activity.length && (
          <Txt muted style={{ fontSize: 12, lineHeight: 20 }}>
            A fresh page. Add your first ingredient and make yourself at home.
          </Txt>
        )}
      </View>
    </View>
  );
}
function dateKeyMatch(key, date) {
  const [y, m, d] = key.split('-').map(Number);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
