import { useEnjoyItem } from '../../hooks/useEnjoyItem';
import { useQuickAdd } from '../../context/QuickAddContext';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowDownAZ,
  ArrowDownWideNarrow,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from '../../components/Icons';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  HorizontalChoices,
  IconButton,
  LoadingState,
  PageHeading,
  Txt,
} from '../../components/UI';
import { ItemCard } from '../../components/ItemCard';
import { usePantry } from '../../context/PantryContext';
import { CATEGORIES, LOCATIONS, daysUntil, filterItems } from '../../lib/items';
import { colors, fonts, shared } from '../../theme';

export default function Pantry() {
  const { items, stats, loading, error, reload, now } = usePantry();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { openAdd } = useQuickAdd();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');
  const view = ['soon', 'past', 'history'].includes(params.view) ? params.view : 'active';
  const setView = (value) => router.setParams({ view: value });
  const [sort, setSort] = useState('expiry');
  const { enjoy, busy } = useEnjoyItem();
  const columns = width >= 1400 ? 4 : width >= 750 ? 3 : 2;
  const padding = width >= 1050 ? 38 : 20;
  const contentWidth = Math.min(width - (width >= 1050 ? 236 : 0), 1420) - 2 * padding;
  const cardWidth = (contentWidth - 15 * (columns - 1)) / columns;
  const filtered = useMemo(
    () =>
      filterItems(items, {
        search,
        category,
        location,
        sort,
        status: view === 'history' ? 'history' : 'active',
      }).filter((item) =>
        view === 'soon'
          ? daysUntil(item.expiresOn, now) >= 0 && daysUntil(item.expiresOn, now) <= 3
          : view === 'past'
            ? daysUntil(item.expiresOn, now) < 0
            : true,
      ),
    [items, search, category, location, sort, view, now],
  );
  const open = useCallback((id) => router.push({ pathname: '/item', params: { id } }), []);

  const renderItem = useCallback(
    ({ item }) => (
      <ItemCard
        item={item}
        today={now}
        onOpen={open}
        onEnjoy={enjoy}
        busy={!!busy}
        style={{ maxWidth: cardWidth }}
      />
    ),
    [now, open, enjoy, busy, cardWidth],
  );
  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setLocation('All');
    setView('active');
  };

  return (
    <FlatList
      key={columns}
      data={loading || error ? [] : filtered}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      initialNumToRender={12}
      maxToRenderPerBatch={8}
      windowSize={5}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={{ gap: 15, marginBottom: 17 }}
      contentContainerStyle={{
        paddingHorizontal: padding,
        paddingTop: width >= 1050 ? 32 : 25,
        paddingBottom: 30,
        width: '100%',
        maxWidth: 1420,
        alignSelf: 'center',
      }}
      ListHeaderComponent={
        <View>
          <PageHeading
            eyebrow="A HOME FOR THE GOOD STUFF"
            title="Your pantry, at a glance."
            subtitle="Swipe right to enjoy an ingredient, or use its button. You can undo the change."
            action={<Button title="Add an item" icon={Plus} onPress={openAdd} />}
          />
          <View
            style={[
              shared.row,
              {
                backgroundColor: '#EDF1E5',
                padding: 5,
                borderRadius: 12,
                gap: 3,
                marginBottom: 23,
                alignSelf: 'flex-start',
                flexWrap: 'wrap',
              },
            ]}
          >
            {[
              ['active', `All items (${stats.active.length})`],
              ['soon', `Use soon (${stats.soon.length})`],
              ...(stats.expired.length ? [['past', `Past date (${stats.expired.length})`]] : []),
              ['history', 'History'],
            ].map(([key, label]) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: view === key }}
                onPress={() => setView(key)}
                style={{
                  paddingHorizontal: width < 500 ? 11 : 18,
                  paddingVertical: 10,
                  backgroundColor: view === key ? '#fff' : 'transparent',
                  borderRadius: 9,
                  boxShadow: view === key ? '0 2px 5px #243C2D09' : undefined,
                }}
              >
                <Txt
                  style={{
                    fontFamily: view === key ? fonts.bold : fonts.medium,
                    fontSize: 12,
                    color: view === key ? colors.green : colors.muted,
                  }}
                >
                  {label}
                </Txt>
              </Pressable>
            ))}
          </View>
          <View style={[shared.row, { gap: 11, marginBottom: 17 }]}>
            <View
              style={[
                shared.row,
                {
                  flex: 1,
                  gap: 9,
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingLeft: 15,
                  minHeight: 48,
                },
              ]}
            >
              <Search size={18} color="#9BA591" />
              <TextInput
                accessibilityLabel="Search pantry"
                placeholder="Find something in your pantry…"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9AA18F"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  minWidth: 0,
                  fontFamily: fonts.regular,
                  color: colors.ink,
                  fontSize: 12,
                }}
              />
              {search ? (
                <IconButton icon={X} label="Clear search" onPress={() => setSearch('')} />
              ) : (
                <View style={{ width: 12 }} />
              )}
            </View>
            <IconButton
              icon={sort === 'expiry' ? ArrowDownWideNarrow : ArrowDownAZ}
              label={sort === 'expiry' ? 'Sort by name' : 'Sort by expiry date'}
              onPress={() => setSort((current) => (current === 'expiry' ? 'name' : 'expiry'))}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: '#fff',
                height: 48,
                width: 48,
              }}
            />
          </View>
          <HorizontalChoices>
            {['All', ...CATEGORIES].map((label) => (
              <Chip
                key={label}
                label={label === 'All' ? 'All categories' : label}
                selected={category === label}
                onPress={() => setCategory(label)}
              />
            ))}
          </HorizontalChoices>
          <View
            style={[shared.between, { marginTop: 16, marginBottom: 23, gap: 8, flexWrap: 'wrap' }]}
          >
            <View style={[shared.row, { gap: 4 }]}>
              <SlidersHorizontal size={13} color={colors.muted} />
              {['All', ...LOCATIONS].map((label) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: location === label }}
                  onPress={() => setLocation(label)}
                  style={{ paddingVertical: 9, paddingHorizontal: 8 }}
                >
                  <Txt
                    style={{
                      fontSize: 11,
                      fontFamily: location === label ? fonts.bold : fonts.regular,
                      color: location === label ? colors.green : colors.muted,
                    }}
                  >
                    {label === 'All' ? 'Everywhere' : label}
                  </Txt>
                </Pressable>
              ))}
            </View>
            <Txt muted style={{ fontSize: 10 }}>
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'} ·{' '}
              {sort === 'expiry' ? 'Date, soonest first' : 'Name, A–Z'}
            </Txt>
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <EmptyState
            title={
              view === 'history'
                ? 'Good habits start small.'
                : search || category !== 'All' || location !== 'All'
                  ? 'Nothing on this shelf.'
                  : 'Room for something fresh.'
            }
            message={
              view === 'history'
                ? 'Mark an item as enjoyed or discarded to see its story here.'
                : search || category !== 'All' || location !== 'All'
                  ? 'Try another search or clear your filters to see everything.'
                  : view === 'soon'
                    ? 'No ingredients need attention in the next 3 days.'
                    : 'Add the ingredients you have at home. We’ll help you keep track.'
            }
            action={
              search || category !== 'All' || location !== 'All' ? 'Clear filters' : 'Add an item'
            }
            onPress={search || category !== 'All' || location !== 'All' ? resetFilters : openAdd}
          />
        )
      }
      ListFooterComponent={
        <Txt muted style={{ fontSize: 10, textAlign: 'center', padding: 24 }}>
          {filtered.length
            ? 'You’ve reached the end of your shelf. Make something good.'
            : 'Fresh starts here.'}
        </Txt>
      }
    />
  );
}
