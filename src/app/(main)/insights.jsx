import WeeklyActivity from '../../components/WeeklyActivity';
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router } from 'expo-router';
import { ArrowRight, Leaf, Package, Sprout } from '../../components/Icons';
import Page from '../../components/Page';
import {
  Button,
  ErrorState,
  LoadingState,
  PageHeading,
  SectionHeading,
  Txt,
} from '../../components/UI';
import { usePantry } from '../../context/PantryContext';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../lib/items';
import { colors, fonts, shared } from '../../theme';

export default function Insights() {
  const { items, stats, loading, error, reload, now } = usePantry();
  const { mode } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 1150;
  const circumference = 2 * Math.PI * 77;
  const categories = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        used: items.filter((item) => item.category === category && item.status === 'used').length,
        wasted: items.filter((item) => item.category === category && item.status === 'wasted')
          .length,
        active: items.filter((item) => item.category === category && item.status === 'active')
          .length,
      })),
    [items],
  );
  if (loading)
    return (
      <Page>
        <LoadingState />
      </Page>
    );
  if (error)
    return (
      <Page>
        <ErrorState message={error} onRetry={reload} />
      </Page>
    );
  return (
    <Page>
      <PageHeading
        eyebrow="SMALL HABITS. REAL PROGRESS."
        title="Good food, put to good use."
        subtitle="Every ingredient enjoyed is a little win worth noticing."
      />
      {mode === 'preview' && (
        <View
          style={{
            backgroundColor: colors.lightOrange,
            borderRadius: 12,
            padding: 14,
            marginBottom: 23,
          }}
        >
          <Txt style={{ color: colors.orange, fontSize: 12, lineHeight: 20 }}>
            You’re viewing sample outcomes. Your own impact starts with your connected pantry.
          </Txt>
        </View>
      )}
      <WeeklyActivity items={items} now={now} />
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 22 }}>
        <View
          style={[shared.card, { flex: wide ? 1 : undefined, padding: 29, alignItems: 'center' }]}
        >
          <Txt style={[shared.label, { fontSize: 10 }]}>YOUR ENJOYMENT RATE</Txt>
          <View
            style={{
              width: 200,
              height: 200,
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: 23,
            }}
          >
            <Svg width={200} height={200} style={{ position: 'absolute' }}>
              <Circle cx={100} cy={100} r={77} fill="none" stroke="#EEF1E6" strokeWidth={12} />
              <Circle
                cx={100}
                cy={100}
                r={77}
                fill="none"
                stroke="#769653"
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - (stats.rate || 0) / 100)}
                transform="rotate(-90 100 100)"
              />
            </Svg>
            <Leaf size={24} color="#86A066" strokeWidth={1.4} />
            <Txt serif style={{ fontSize: 49, lineHeight: 61 }}>
              {stats.rate === null ? '—' : `${stats.rate}%`}
            </Txt>
            <Txt muted style={{ fontSize: 10 }}>
              of finished items enjoyed
            </Txt>
          </View>
          <Txt serif style={{ fontSize: 25, textAlign: 'center' }}>
            {stats.enjoyed ? 'That’s goodness, not waste.' : 'Your first little win awaits.'}
          </Txt>
          <Txt
            muted
            style={{
              fontSize: 12,
              lineHeight: 21,
              textAlign: 'center',
              marginTop: 10,
              maxWidth: 330,
            }}
          >
            Based on items marked enjoyed or discarded in your current history. Every ingredient
            counts.
          </Txt>
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 15 }}>
          {[
            [
              Sprout,
              stats.enjoyed,
              'Ingredients enjoyed',
              'Good things that made it to your table.',
              colors.lightGreen,
              colors.green,
            ],
            [
              Package,
              stats.active.length,
              'Possibilities on your shelf',
              'Ingredients waiting for their moment.',
              '#F0F0E3',
              '#7C8053',
            ],
            [
              Leaf,
              stats.wasted,
              'Ingredients discarded',
              'An honest record. A chance to learn.',
              colors.lightOrange,
              colors.orange,
            ],
          ].map(([Icon, count, title, caption, bg, color]) => (
            <View
              key={title}
              style={[
                shared.card,
                {
                  flex: wide ? 1 : undefined,
                  padding: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 19,
                },
              ]}
            >
              <View
                style={{
                  width: 49,
                  height: 49,
                  borderRadius: 17,
                  backgroundColor: bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={23} strokeWidth={1.5} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt serif style={{ fontSize: 31 }}>
                  {count}
                </Txt>
                <Txt style={{ fontFamily: fonts.bold, fontSize: 12, marginTop: 3 }}>{title}</Txt>
                <Txt muted style={{ fontSize: 11, lineHeight: 18, marginTop: 5 }}>
                  {caption}
                </Txt>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={[shared.card, { padding: width < 500 ? 20 : 29, marginTop: 25 }]}>
        <SectionHeading
          title="A little perspective."
          subtitle="How the different corners of your pantry are doing."
        />
        {categories.map(({ category, used, wasted, active }) => {
          const total = used + wasted + active;
          return (
            <View key={category} style={{ marginVertical: 13 }}>
              <View style={shared.between}>
                <Txt style={{ fontFamily: fonts.medium, fontSize: 12 }}>{category}</Txt>
                <Txt muted style={{ fontSize: 11 }}>
                  {total} {total === 1 ? 'item' : 'items'}
                </Txt>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: '#F1F3EB',
                  marginTop: 10,
                  flexDirection: 'row',
                  overflow: 'hidden',
                }}
              >
                {used > 0 && (
                  <View style={{ width: `${(used / total) * 100}%`, backgroundColor: '#7E9B5B' }} />
                )}
                {active > 0 && (
                  <View
                    style={{ width: `${(active / total) * 100}%`, backgroundColor: '#D2DFB8' }}
                  />
                )}
                {wasted > 0 && (
                  <View
                    style={{ width: `${(wasted / total) * 100}%`, backgroundColor: '#DBAD88' }}
                  />
                )}
              </View>
            </View>
          );
        })}
        <View style={[shared.row, { flexWrap: 'wrap', gap: 19, marginTop: 18 }]}>
          {[
            ['Enjoyed', '#7E9B5B'],
            ['On your shelf', '#D2DFB8'],
            ['Discarded', '#DBAD88'],
          ].map(([label, color]) => (
            <View key={label} style={[shared.row, { gap: 6 }]}>
              <View style={{ width: 7, height: 7, borderRadius: 3, backgroundColor: color }} />
              <Txt muted style={{ fontSize: 10 }}>
                {label}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <View
        style={{
          backgroundColor: colors.lightGreen,
          padding: 25,
          borderRadius: 18,
          marginTop: 25,
          gap: 12,
        }}
      >
        <Txt serif style={{ fontSize: 26 }}>
          Progress starts with what’s already there.
        </Txt>
        <Txt muted style={{ fontSize: 12, lineHeight: 22 }}>
          Check your “Use soon” shelf before your next shop. Your kitchen might already have just
          what you need.
        </Txt>
        <Button
          small
          title="Find your next little win"
          variant="ghost"
          icon={ArrowRight}
          onPress={() => router.navigate('/pantry?view=soon')}
          style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
        />
      </View>
      <Txt muted style={{ fontSize: 10, lineHeight: 18, marginTop: 17 }}>
        Counts reflect your current item records, not individual portions or a lifetime total.
        Deleting a record removes it from these totals.
      </Txt>
    </Page>
  );
}
