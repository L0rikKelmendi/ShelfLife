import { useQuickAdd } from '../../context/QuickAddContext';
import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Leaf, RotateCcw, Trash2 } from '../../components/Icons';
import Page from '../../components/Page';
import {
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeading,
  Txt,
} from '../../components/UI';
import ItemForm from '../../components/ItemForm';
import { usePantry } from '../../context/PantryContext';
import { useToast } from '../../context/ToastContext';
import { FoodPhoto } from '../../components/FoodPhoto';
import { freshness } from '../../lib/items';
import { errorMessage } from '../../lib/errors';
import { colors, fonts, shared } from '../../theme';

export default function ItemEditor() {
  const { id } = useLocalSearchParams();
  const { openAdd } = useQuickAdd();
  useEffect(() => {
    if (!id) {
      router.replace('/pantry');
      openAdd();
    }
  }, [id, openAdd]);
  const { items, loading, error, reload, save, remove, changeStatus, now } = usePantry();
  const notify = useToast();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const item = items.find((record) => record.id === id);
  const wide = width >= 1200;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/pantry'));
  const submit = async (values) => {
    if (busy) return;
    setBusy(true);
    try {
      await save(values, id);
      notify(id ? 'Fresh details, all saved.' : 'A little more goodness in your pantry.');
      back();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const setStatus = async (status) => {
    setBusy(true);
    try {
      await changeStatus(id, status);
      notify(
        status === 'used'
          ? 'Enjoyed, not wasted. That’s a win.'
          : status === 'active'
            ? 'Back on your shelf.'
            : 'Noted. Every little lesson helps.',
      );
      back();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  const deleteItem = async () => {
    setBusy(true);
    try {
      await remove(id);
      setDeleting(false);
      notify('Item removed from your pantry.');
      router.replace('/pantry');
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };
  if (id && loading)
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
  if (id && !item)
    return (
      <Page>
        <EmptyState
          title="This shelf is empty."
          message="This item may have been removed. Your other ingredients are still in the pantry."
          action="Back to pantry"
          onPress={() => router.replace('/pantry')}
        />
      </Page>
    );

  return (
    <Page>
      <PageHeading
        back
        eyebrow={id ? 'A LITTLE ATTENTION GOES A LONG WAY' : 'MAKE ROOM FOR SOMETHING GOOD'}
        title={id ? 'Keep the good stuff fresh.' : 'Something fresh for your shelf.'}
        subtitle={
          id
            ? 'Update the details, or tell us how this ingredient’s story ends.'
            : 'A few little details now. One less thing forgotten later.'
        }
      />
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 25, alignItems: 'flex-start' }}>
        <View
          style={[
            shared.card,
            { padding: width < 500 ? 20 : 29, flex: wide ? 1 : undefined, width: '100%' },
          ]}
        >
          <ItemForm
            key={id || 'new'}
            initial={item}
            onSubmit={submit}
            onCancel={back}
            loading={busy}
            submitLabel={id ? 'Save changes' : 'Add to my pantry'}
          />
          {item && (
            <View
              style={{
                borderTopWidth: 1,
                borderColor: colors.border,
                marginTop: 23,
                paddingTop: 23,
                gap: 13,
              }}
            >
              <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>The next chapter</Txt>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {item.status === 'active' ? (
                  <>
                    <Button
                      title="Mark as enjoyed"
                      icon={Check}
                      variant="secondary"
                      small
                      disabled={busy}
                      onPress={() => setStatus('used')}
                    />
                    <Button
                      title="Mark as discarded"
                      variant="ghost"
                      small
                      disabled={busy}
                      onPress={() => setStatus('wasted')}
                    />
                  </>
                ) : (
                  <Button
                    title="Put back in pantry"
                    icon={RotateCcw}
                    variant="secondary"
                    small
                    disabled={busy}
                    onPress={() => setStatus('active')}
                  />
                )}
                <Button
                  title="Delete item"
                  icon={Trash2}
                  variant="ghost"
                  small
                  disabled={busy}
                  onPress={() => setDeleting(true)}
                />
              </View>
            </View>
          )}
        </View>
        {wide && (
          <View style={{ width: 275, gap: 17 }}>
            {item && (
              <FoodPhoto item={item} size={220} style={{ width: '100%', borderRadius: 20 }} />
            )}
            <View style={{ padding: 25, backgroundColor: colors.lightGreen, borderRadius: 18 }}>
              <Leaf size={28} color={colors.green} strokeWidth={1.3} />
              <Txt serif style={{ fontSize: 26, lineHeight: 33, marginTop: 16 }}>
                {item ? item.name : 'A small habit.\nA fresher kitchen.'}
              </Txt>
              <Txt muted style={{ fontSize: 12, lineHeight: 21, marginTop: 12 }}>
                {item
                  ? `${freshness(item, now).label}. Keep your dates up to date and your pantry in the loop.`
                  : 'Start with what’s already in your fridge. Knowing what you have is the first step to using it well.'}
              </Txt>
            </View>
            <Txt muted style={{ fontSize: 11, lineHeight: 19, paddingHorizontal: 5 }}>
              Use the date printed on the packaging. Your pantry keeps track of the date you enter.
            </Txt>
          </View>
        )}
      </View>
      <Dialog
        visible={deleting}
        title="Make a little space?"
        message={`Remove ${item?.name || 'this item'} from your pantry? This also removes it from your history and impact totals.`}
        confirmLabel="Delete item"
        danger
        loading={busy}
        onClose={() => setDeleting(false)}
        onConfirm={deleteItem}
      />
    </Page>
  );
}
