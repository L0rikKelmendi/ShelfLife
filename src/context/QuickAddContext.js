import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';
import { usePantry } from './PantryContext';
import { useToast } from './ToastContext';
import { findFood, FOODS } from '../lib/foodCatalog';
import QuickAddSheet from '../components/QuickAddSheet';

const QuickAddContext = createContext(null);
export function QuickAddProvider({ children }) {
  const { user } = useAuth();
  const { save } = usePantry();
  const notify = useToast();
  const [visible, setVisible] = useState(false);
  const [recentIds, setRecentIds] = useState([]);
  const key = `@shelflife/recent-foods/${user?.uid || 'anonymous'}`;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key)
      .then((value) => {
        if (active && value) {
          const ids = JSON.parse(value);
          if (Array.isArray(ids))
            setRecentIds(ids.filter((id) => typeof id === 'string').slice(0, 12));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key]);
  const openAdd = useCallback(() => setVisible(true), []);
  const closeAdd = useCallback(() => setVisible(false), []);
  const add = useCallback(
    async (values) => {
      await save(values);
      const food = findFood(values.name);
      if (food) {
        const next = [food.id, ...recentIds.filter((id) => id !== food.id)].slice(0, 12);
        setRecentIds(next);
        // A preference write cannot turn a successful Firestore write into a failed save.
        AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
      }
      setVisible(false);
      router.navigate('/pantry');
      notify(`${values.name.trim()} added to your pantry.`);
    },
    [save, recentIds, key, notify],
  );
  const recent = useMemo(
    () => recentIds.map((id) => FOODS.find((food) => food.id === id)).filter(Boolean),
    [recentIds],
  );
  const value = useMemo(() => ({ openAdd, closeAdd }), [openAdd, closeAdd]);
  return (
    <QuickAddContext.Provider value={value}>
      {children}
      {visible && user && <QuickAddSheet recent={recent} onClose={closeAdd} onSubmit={add} />}
    </QuickAddContext.Provider>
  );
}
export const useQuickAdd = () => useContext(QuickAddContext);
