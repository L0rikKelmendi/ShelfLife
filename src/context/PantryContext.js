import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { cleanItem, seedItems, summarize } from '../lib/items';
import { errorMessage } from '../lib/errors';
import * as pantry from '../services/pantry';
import {
  cancelUserReminders,
  enableNotifications,
  resumeUserReminders,
  syncReminders,
} from '../services/notifications';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const PantryContext = createContext(null);
const PREVIEW_ITEMS = '@shelflife/preview-items-v1';

export function PantryProvider({ children }) {
  const { user, mode } = useAuth();
  const notify = useToast();
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(new Date());
  const [reminders, setReminders] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const preview = mode === 'preview';
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    resumeUserReminders(uid);
    return () => {
      cancelUserReminders(uid).catch(() => {});
    };
  }, [uid]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const update = (data) => {
      if (active) {
        itemsRef.current = data;
        setItems(data);
        setError(null);
        setLoading(false);
      }
    };
    if (!uid) return;
    if (preview) {
      AsyncStorage.getItem(PREVIEW_ITEMS)
        .then(async (saved) => {
          const data = saved ? JSON.parse(saved) : seedItems();
          if (!Array.isArray(data)) throw new Error('The preview data could not be loaded.');
          if (!saved) await AsyncStorage.setItem(PREVIEW_ITEMS, JSON.stringify(data));
          update(data);
        })
        .catch((err) => {
          if (active) {
            setError(errorMessage(err));
            setLoading(false);
          }
        });
    } else {
      const unsubscribe = pantry.watchItems(uid, update, (err) => {
        if (active) {
          setError(errorMessage(err));
          setLoading(false);
        }
      });
      return () => {
        active = false;
        unsubscribe();
      };
    }
    return () => {
      active = false;
    };
  }, [uid, preview, retry]);

  useEffect(() => {
    let active = true;
    if (!uid) return;
    AsyncStorage.getItem(`@shelflife/reminders/${uid}`)
      .then((value) => {
        if (active) {
          setReminders(value === 'true');
          setPreferencesReady(true);
        }
      })
      .catch(() => {
        if (active) setPreferencesReady(true);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid || loading || error || !preferencesReady) return;
    syncReminders(uid, items, reminders).catch((err) => notify(errorMessage(err), 'error'));
  }, [uid, items, loading, error, reminders, preferencesReady, notify]);

  const writePreview = useCallback(async (transform) => {
    const next = transform(itemsRef.current);
    await AsyncStorage.setItem(PREVIEW_ITEMS, JSON.stringify(next));
    itemsRef.current = next;
    setItems(next);
  }, []);
  const save = useCallback(
    async (values, id) => {
      const data = cleanItem(values);
      if (preview) {
        const itemId = id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await writePreview((current) =>
          id
            ? current.map((item) =>
                item.id === id ? { ...item, ...data, updatedAt: Date.now() } : item,
              )
            : [
                ...current,
                {
                  ...data,
                  id: itemId,
                  status: 'active',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
              ],
        );
        return itemId;
      }
      if (id) {
        await pantry.editItem(uid, id, data);
        return id;
      }
      return pantry.createItem(uid, data);
    },
    [preview, uid, writePreview],
  );
  const changeStatus = useCallback(
    async (id, status) => {
      if (preview)
        await writePreview((current) =>
          current.map((item) =>
            item.id === id ? { ...item, status, updatedAt: Date.now() } : item,
          ),
        );
      else await pantry.changeItemStatus(uid, id, status);
    },
    [preview, uid, writePreview],
  );
  const remove = useCallback(
    async (id) => {
      if (preview) await writePreview((current) => current.filter((item) => item.id !== id));
      else await pantry.removeItem(uid, id);
    },
    [preview, uid, writePreview],
  );
  const toggleReminders = useCallback(
    async (enabled) => {
      if (enabled) {
        await enableNotifications();
        resumeUserReminders(uid);
      } else await cancelUserReminders(uid);
      await AsyncStorage.setItem(`@shelflife/reminders/${uid}`, String(enabled));
      setReminders(enabled);
    },
    [uid],
  );
  const resetPreview = useCallback(async () => {
    if (preview) await writePreview(() => seedItems());
  }, [preview, writePreview]);
  const stats = useMemo(() => summarize(items, now), [items, now]);
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetry((value) => value + 1);
  }, []);
  const value = useMemo(
    () => ({
      items,
      loading,
      error,
      stats,
      now,
      save,
      changeStatus,
      remove,
      reload,
      reminders,
      toggleReminders,
      resetPreview,
    }),
    [
      items,
      loading,
      error,
      stats,
      now,
      save,
      changeStatus,
      remove,
      reload,
      reminders,
      toggleReminders,
      resetPreview,
    ],
  );
  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}
export const usePantry = () => useContext(PantryContext);
