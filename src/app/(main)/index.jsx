import { useEnjoyItem } from '../../hooks/useEnjoyItem';
import { AnimatedCount } from '../../components/Motion';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Clock3, Leaf, Package, Plus, Sprout } from '../../components/Icons';
import Page from '../../components/Page';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  IconButton,
  PageHeading,
  SectionHeading,
  Txt,
} from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';
import { useAuth } from '../../context/AuthContext';
import { usePantry } from '../../context/PantryContext';
import { useQuickAdd } from '../../context/QuickAddContext';
import { daysUntil } from '../../lib/items';
import { photos } from '../../lib/photos';
import { colors, fonts, shared } from '../../theme';

export default function Overview() {
  const { user } = useAuth();
  const { stats, now, loading, error, reload } = usePantry();
  const { openAdd } = useQuickAdd();
  const { width } = useWindowDimensions();
  const columns = width >= 1280 ? 4 : width >= 700 ? 3 : 2;
  const { enjoy, busy } = useEnjoyItem();
  const openItem = useCallback((id) => router.push({ pathname: '/item', params: { id } }), []);

  const eatFirst = useMemo(
    () => [...stats.soon].sort((a, b) => a.expiresOn.localeCompare(b.expiresOn)).slice(0, 4),
    [stats.soon],
  );
  const todayCount = stats.soon.filter((item) => daysUntil(item.expiresOn, now) === 0).length;
  const firstName = user?.displayName?.split(' ')[0] || 'friend';
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <Page testID="overview-screen">
      <PageHeading
        eyebrow={now
          .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          .toUpperCase()}
        title={`${greeting}, ${firstName}.`}
        subtitle={
          loading
            ? 'Your little kitchen is getting ready.'
            : todayCount
              ? `${todayCount} ${todayCount === 1 ? 'thing to enjoy' : 'things to enjoy'} today. Let’s make something good.`
              : stats.soon.length
                ? `${stats.soon.length} ingredients to keep an eye on this week.`
                : 'A little room for fresh possibilities.'
        }
        action={
          <IconButton
            icon={Plus}
            label="Add item"
            onPress={openAdd}
            style={{ backgroundColor: colors.lightGreen, borderRadius: 15 }}
          />
        }
      />
      <View
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          minHeight: 210,
          backgroundColor: colors.green,
          marginBottom: 24,
        }}
      >
        <ImageBackground
          source={photos.hero}
          imageStyle={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['#213F30FA', '#213F30DA', '#213F3035']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{ padding: width < 500 ? 22 : 30, gap: 11, maxWidth: width < 500 ? '96%' : '70%' }}
        >
          <View style={[shared.row, { gap: 7 }]}>
            <Sprout size={15} color={colors.lime} />
            <Txt
              style={{
                color: colors.lime,
                fontFamily: fonts.bold,
                fontSize: 9,
                letterSpacing: 1.8,
              }}
            >
              YOUR KITCHEN, A LITTLE FRESHER
            </Txt>
          </View>
          <Txt
            serif
            style={{
              fontSize: width < 500 ? 30 : 38,
              lineHeight: width < 500 ? 34 : 44,
              color: '#fff',
            }}
          >
            Good food.{'\n'}A little sooner.
          </Txt>
          <Txt style={{ fontSize: 12, lineHeight: 20, color: '#DFE7D9', maxWidth: 320 }}>
            {width < 500
              ? 'Your next good meal might already be here.'
              : stats.soon.length
                ? 'Start with the ingredients that need a little love. Your next meal might already be here.'
                : 'Know what you have. Keep the good stuff in sight, and make the most of every shelf.'}
          </Txt>
          <Button
            title={stats.soon.length ? 'See what to use first' : 'Explore my pantry'}
            small
            icon={ArrowRight}
            variant="secondary"
            onPress={() => router.navigate(stats.soon.length ? '/pantry?view=soon' : '/pantry')}
            style={{ alignSelf: 'flex-start', backgroundColor: colors.lime, marginTop: 4 }}
          />
        </View>
      </View>
      <SectionHeading
        title="Use first"
        subtitle="A little attention now. Something delicious later."
        badge={stats.soon.length}
        link="View pantry"
        onPress={() => router.navigate('/pantry')}
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : eatFirst.length ? (
        <FlatList
          key={columns}
          data={eatFirst}
          numColumns={columns}
          scrollEnabled={false}
          columnWrapperStyle={{ gap: 15 }}
          contentContainerStyle={{ gap: 15 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              today={now}
              onOpen={openItem}
              onEnjoy={enjoy}
              busy={!!busy}
              style={{ maxWidth: `${100 / columns - 1}%` }}
            />
          )}
        />
      ) : (
        <EmptyState
          title={stats.active.length ? 'Nothing in a hurry.' : 'Your fresh start begins here.'}
          message={
            stats.active.length
              ? 'Your ingredients have a little breathing room. Keep your pantry up to date.'
              : 'Start with a few things from your fridge or cupboard.'
          }
          action="Add something fresh"
          onPress={openAdd}
        />
      )}
      <View style={[shared.row, { gap: width < 500 ? 9 : 17, marginTop: 25, marginBottom: 25 }]}>
        {[
          ['ON YOUR SHELF', stats.active.length, Package, '/pantry'],
          ['USE SOON', stats.soon.length, Clock3, '/pantry?view=soon'],
          ['ENJOYED', stats.enjoyed, Leaf, '/insights'],
        ].map(([label, count, Icon, href]) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${count}`}
            onPress={() => router.navigate(href)}
            style={[
              shared.card,
              { flex: 1, padding: width < 500 ? 14 : 22, gap: 11, borderRadius: 18 },
            ]}
          >
            <Icon size={18} strokeWidth={1.5} color={colors.green} />
            <AnimatedCount
              value={loading ? '—' : count}
              style={{ fontSize: width < 500 ? 29 : 36 }}
            />
            <Txt
              style={{
                fontFamily: fonts.bold,
                fontSize: width < 500 ? 8 : 10,
                letterSpacing: 0.5,
                color: colors.muted,
              }}
            >
              {label}
            </Txt>
          </Pressable>
        ))}
      </View>
      {stats.expired.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Review past-date items"
          onPress={() => router.navigate('/pantry?view=past')}
          style={[
            shared.row,
            { gap: 11, padding: 17, backgroundColor: '#F9EEE4', borderRadius: 15, marginTop: 20 },
          ]}
        >
          <Clock3 size={19} color={colors.orange} />
          <Txt style={{ flex: 1, color: colors.orange, fontSize: 12, lineHeight: 19 }}>
            {stats.expired.length} items are past the date you entered. Take a moment to review
            them.
          </Txt>
          <ArrowRight size={16} color={colors.orange} />
        </Pressable>
      )}
      <View
        style={[shared.card, { marginTop: 25, padding: 23, gap: 10, backgroundColor: '#EEF2E5' }]}
      >
        <View style={[shared.row, { gap: 8 }]}>
          <Leaf size={18} color={colors.green} />
          <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
            Small habits. Something to feel good about.
          </Txt>
        </View>
        <Txt muted style={{ fontSize: 12, lineHeight: 21 }}>
          {stats.enjoyed
            ? `${stats.enjoyed} ingredients happily enjoyed. Your pantry tells the story of the good choices you’ve made.`
            : 'Every ingredient you enjoy is a small win. Your story starts with the next good meal.'}
        </Txt>
        <Button
          title="See your week"
          variant="ghost"
          small
          icon={ArrowRight}
          onPress={() => router.navigate('/insights')}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>
    </Page>
  );
}
