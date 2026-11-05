import React, { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Field, IconButton, Txt } from './UI';
import { Check, Search, X } from './Icons';
import { FoodPhoto } from './FoodPhoto';
import FoodSuggestions from './FoodSuggestions';
import ItemForm from './ItemForm';
import { FOODS } from '../lib/foodCatalog';
import { shiftDate } from '../lib/items';
import { errorMessage } from '../lib/errors';
import { colors, fonts, shared } from '../theme';

const popular = ['milk', 'strawberries', 'cornflakes', 'eggs', 'bread', 'bananas'].map((id) =>
  FOODS.find((food) => food.id === id),
);
function FoodRail({ title, foods, onChoose }) {
  if (!foods.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>{title}</Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 12 }}
      >
        {foods.map((food) => (
          <Pressable
            key={food.id}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${food.name}`}
            onPress={() => onChoose(food)}
            style={{ width: 91, alignItems: 'center', gap: 8, paddingBottom: 4 }}
          >
            <FoodPhoto item={food} size={78} />
            <Txt
              numberOfLines={2}
              style={{ fontSize: 11, fontFamily: fonts.medium, textAlign: 'center' }}
            >
              {food.name}
            </Txt>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
export default function QuickAddSheet({ recent = [], onClose, onSubmit }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const [stage, setStage] = useState('choose');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const form = useRef(null);
  const saving = useRef(false);
  const choose = (food) => {
    Keyboard.dismiss();
    setDraft((current) => ({
      quantity: '1',
      expiresOn: shiftDate(3),
      reminder: false,
      ...current,
      name: food.name,
      category: food.category || 'Other',
      unit: food.unit || 'pcs',
      storageLocation: food.storageLocation || 'Pantry',
    }));
    setError(null);
    setStage('details');
  };
  const submit = async (values) => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };
  const close = () => {
    if (!saving.current) onClose();
  };
  return (
    <Modal transparent visible animationType="slide" onRequestClose={close} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: '#182A2370',
          justifyContent: width >= 850 ? 'center' : 'flex-end',
          alignItems: 'center',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss add food"
          disabled={busy}
          onPress={close}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            width: '100%',
            maxWidth: 600,
            maxHeight: height - Math.max(insets.top, 22),
            flexShrink: 1,
          }}
        >
          <View
            accessibilityViewIsModal
            accessibilityLabel="Add food sheet"
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderBottomLeftRadius: width >= 850 ? 28 : 0,
              borderBottomRightRadius: width >= 850 ? 28 : 0,
              overflow: 'hidden',
              flexShrink: 1,
            }}
          >
            <View
              style={{
                alignSelf: 'center',
                height: 4,
                width: 38,
                backgroundColor: '#CBD3C4',
                borderRadius: 5,
                marginTop: 10,
              }}
            />
            <View style={[shared.between, { padding: 22, paddingBottom: 16, gap: 14 }]}>
              <View style={{ flex: 1 }}>
                <Txt style={[shared.label, { fontSize: 9 }]}>A LITTLE MORE GOODNESS</Txt>
                <Txt serif accessibilityRole="header" style={{ fontSize: 30, marginTop: 5 }}>
                  {stage === 'choose' ? 'What’s going on your shelf?' : 'Make it yours.'}
                </Txt>
              </View>
              <IconButton icon={X} label="Close add food" onPress={close} disabled={busy} />
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 22, paddingTop: 0, gap: 24 }}
              style={{ flexShrink: 1 }}
            >
              {stage === 'choose' ? (
                <>
                  <Field
                    label="Find a food"
                    placeholder="Milk, strawberries, cornflakes…"
                    value={query}
                    onChangeText={setQuery}
                    maxLength={80}
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {query.trim() ? (
                    <>
                      <FoodSuggestions query={query} onChoose={choose} />
                      <Button
                        title="Use custom name"
                        variant="secondary"
                        onPress={() => choose({ name: query.trim() })}
                      />
                    </>
                  ) : (
                    <>
                      <FoodRail title="Recently added" foods={recent} onChoose={choose} />
                      <FoodRail title="Popular foods" foods={popular} onChoose={choose} />
                      <View style={[shared.row, { gap: 8, paddingBottom: 8 }]}>
                        <Search size={15} color={colors.muted} />
                        <Txt muted style={{ fontSize: 11 }}>
                          {FOODS.length} foods with photos. Your own names are welcome, too.
                        </Txt>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <View
                    style={[
                      shared.row,
                      {
                        gap: 16,
                        backgroundColor: '#fff',
                        padding: 14,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <FoodPhoto item={draft} size={76} />
                    <View style={{ flex: 1 }}>
                      <Txt serif style={{ fontSize: 25 }}>
                        {draft.name}
                      </Txt>
                      <Txt muted style={{ marginTop: 5, fontSize: 11 }}>
                        {draft.category} · {draft.storageLocation}
                      </Txt>
                    </View>
                    <Button
                      title="Change food"
                      variant="ghost"
                      small
                      disabled={busy}
                      onPress={() => {
                        setDraft(form.current?.getValues() || draft);
                        setQuery('');
                        setStage('choose');
                      }}
                    />
                  </View>
                  <ItemForm
                    ref={form}
                    onValuesChange={setDraft}
                    onValidationError={setError}
                    initial={draft}
                    onSubmit={submit}
                    onCancel={close}
                    loading={busy}
                    compact
                    hideActions
                    hideName
                  />
                </>
              )}
            </ScrollView>
            {stage === 'details' && (
              <View
                style={{
                  padding: 20,
                  paddingBottom: Math.max(insets.bottom, 20),
                  backgroundColor: '#fff',
                  borderTopWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {error && (
                  <Txt
                    accessibilityRole="alert"
                    style={{ color: colors.red, lineHeight: 20, fontSize: 12, marginBottom: 11 }}
                  >
                    {error}
                  </Txt>
                )}
                <Button
                  title="Add to my pantry"
                  icon={Check}
                  loading={busy}
                  onPress={() => form.current?.submit()}
                />
              </View>
            )}
            {stage === 'choose' && <View style={{ height: Math.max(insets.bottom, 12) }} />}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
