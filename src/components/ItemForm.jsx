import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';
import { Bell, CalendarDays, Check, Minus, Plus } from './Icons';
import { CATEGORIES, LOCATIONS, UNITS, shiftDate, validateItem } from '../lib/items';
import { colors, fonts, shared } from '../theme';
import { Button, Chip, Field, HorizontalChoices, IconButton, Txt } from './UI';
import Calendar from './Calendar';
import FoodSuggestions from './FoodSuggestions';

const ItemForm = forwardRef(function ItemForm(
  {
    initial,
    onSubmit,
    onCancel,
    loading,
    submitLabel = 'Add to my pantry',
    compact = false,
    hideActions = false,
    hideName = false,
    onValuesChange,
    onValidationError,
  },
  ref,
) {
  const [values, setValues] = useState(() => ({
    name: '',
    unit: 'pcs',
    category: 'Produce',
    storageLocation: 'Fridge',
    expiresOn: shiftDate(3),
    reminder: false,
    ...initial,
    quantity: String(initial?.quantity || 1),
  }));
  const [error, setError] = useState(null);
  const [calendar, setCalendar] = useState(false);
  const [advanced, setAdvanced] = useState(!compact);
  useEffect(() => {
    onValuesChange?.(values);
  }, [values, onValuesChange]);
  const [suggestions, setSuggestions] = useState(false);
  const update = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
    onValidationError?.(null);
  };
  const submit = async () => {
    const issue = validateItem(values);
    if (issue) {
      setError(issue);
      onValidationError?.(issue);
      return;
    }
    onValidationError?.(null);
    await onSubmit(values);
  };
  useImperativeHandle(ref, () => ({ submit, getValues: () => values }));
  return (
    <View style={{ gap: compact ? 19 : 25 }}>
      {!hideName && (
        <View style={{ gap: 9 }}>
          <Field
            label="Item name"
            placeholder="Try straw, milk, cornflakes…"
            maxLength={80}
            value={values.name}
            onFocus={() => setSuggestions(true)}
            onChangeText={(text) => {
              update('name', text);
              setSuggestions(true);
            }}
            autoCapitalize="sentences"
            error={error && !values.name.trim()}
            editable={!loading}
          />
          {suggestions && (
            <FoodSuggestions
              query={values.name}
              disabled={loading}
              onChoose={(food) => {
                setValues((current) => ({
                  ...current,
                  name: food.name,
                  category: food.category,
                  unit: food.unit,
                  storageLocation: food.storageLocation,
                }));
                setError(null);
                setSuggestions(false);
              }}
            />
          )}
          <Txt muted style={{ fontSize: 10, lineHeight: 17 }}>
            Find a food with its photo, or type a name of your own.
          </Txt>
        </View>
      )}
      {advanced && (
        <View style={{ gap: 10 }}>
          <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>Category</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={category}
                selected={values.category === category}
                onPress={() => update('category', category)}
              />
            ))}
          </View>
        </View>
      )}
      <View style={{ gap: 10 }}>
        <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>How much do you have?</Txt>
        <View style={[shared.row, { gap: 10 }]}>
          <View
            style={[
              shared.row,
              {
                backgroundColor: '#F6F7F2',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            <IconButton
              icon={Minus}
              label="Decrease quantity"
              disabled={Number(values.quantity) <= 1 || loading}
              onPress={() => update('quantity', String(Math.max(1, Number(values.quantity) - 1)))}
            />
            <TextInput
              accessibilityLabel="Quantity"
              value={values.quantity}
              onChangeText={(text) => update('quantity', text)}
              keyboardType="decimal-pad"
              editable={!loading}
              style={{
                width: 48,
                height: 45,
                textAlign: 'center',
                fontFamily: fonts.medium,
                color: colors.ink,
                fontSize: 14,
              }}
            />
            <IconButton
              icon={Plus}
              label="Increase quantity"
              disabled={Number(values.quantity) >= 9999 || loading}
              onPress={() =>
                update('quantity', String(Math.min(9999, (Number(values.quantity) || 0) + 1)))
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <HorizontalChoices resetKey={compact ? values.unit : undefined}>
              {(compact
                ? [values.unit, ...UNITS.filter((unit) => unit !== values.unit)]
                : UNITS
              ).map((unit) => (
                <Chip
                  key={unit}
                  label={unit}
                  selected={values.unit === unit}
                  onPress={() => update('unit', unit)}
                />
              ))}
            </HorizontalChoices>
          </View>
        </View>
      </View>
      {advanced && (
        <View style={{ gap: 10 }}>
          <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>Where does it live?</Txt>
          <View style={[shared.row, { gap: 8 }]}>
            {LOCATIONS.map((location) => (
              <Chip
                key={location}
                label={location}
                selected={values.storageLocation === location}
                onPress={() => update('storageLocation', location)}
              />
            ))}
          </View>
        </View>
      )}
      <View style={{ gap: 10 }}>
        <View style={[shared.row, { gap: 10, alignItems: 'flex-end' }]}>
          <Field
            style={{ flex: 1 }}
            label="Expiry / best-before date"
            placeholder="YYYY-MM-DD"
            value={values.expiresOn}
            maxLength={10}
            onChangeText={(text) => update('expiresOn', text)}
            editable={!loading}
          />
          <IconButton
            icon={CalendarDays}
            label="Choose expiry date"
            onPress={() => setCalendar(true)}
            disabled={loading}
            style={{
              height: 50,
              width: 50,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: '#F7F9F1',
            }}
          />
        </View>
        <View style={[shared.row, { gap: 7, flexWrap: 'wrap' }]}>
          {[
            [0, 'Today'],
            [1, 'Tomorrow'],
            [3, 'In 3 days'],
            [7, 'In a week'],
          ].map(([days, label]) => (
            <Pressable
              key={days}
              accessibilityRole="button"
              onPress={() => update('expiresOn', shiftDate(days))}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 7,
                backgroundColor:
                  values.expiresOn === shiftDate(days) ? colors.lightGreen : '#F6F7F1',
              }}
            >
              <Txt
                style={{
                  color: values.expiresOn === shiftDate(days) ? colors.green : colors.muted,
                  fontSize: 10,
                }}
              >
                {label}
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>
      {compact && (
        <Button
          title={advanced ? 'Fewer details' : 'More details'}
          variant="ghost"
          small
          onPress={() => setAdvanced((value) => !value)}
          disabled={loading}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
      <View
        style={[shared.row, { backgroundColor: '#F3F6EC', borderRadius: 14, padding: 17, gap: 12 }]}
      >
        <Bell size={20} color={colors.green} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>Give me a gentle nudge</Txt>
          <Txt muted style={{ fontSize: 11, lineHeight: 18, marginTop: 4 }}>
            A reminder the day before, at 9 AM.{'\n'}Enable reminders in your account on this phone.
          </Txt>
        </View>
        <Switch
          accessibilityLabel="Remind me before expiry"
          value={values.reminder}
          onValueChange={(value) => update('reminder', value)}
          disabled={loading}
          trackColor={{ false: '#D4DCCD', true: '#8FA972' }}
          thumbColor="#fff"
        />
      </View>
      {error && !onValidationError && (
        <Txt accessibilityRole="alert" style={{ color: colors.red, fontSize: 13 }}>
          {error}
        </Txt>
      )}
      {!hideActions && (
        <View
          style={[
            shared.row,
            {
              gap: 10,
              justifyContent: 'flex-end',
              borderTopWidth: 1,
              borderColor: colors.border,
              paddingTop: 23,
            },
          ]}
        >
          <Button title="Cancel" variant="ghost" disabled={loading} onPress={onCancel} />
          <Button
            title={submitLabel}
            icon={Check}
            onPress={submit}
            loading={loading}
            testID="save-item"
          />
        </View>
      )}
      {calendar && (
        <Calendar
          visible={calendar}
          value={values.expiresOn}
          onChange={(value) => update('expiresOn', value)}
          onClose={() => setCalendar(false)}
        />
      )}
    </View>
  );
});
export default ItemForm;
