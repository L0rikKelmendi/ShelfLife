import React, { useEffect } from 'react';
import { Redirect, Slot, router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import AppShell from '../../components/AppShell';
import { LoadingState } from '../../components/UI';
import { listenForReminder } from '../../services/notifications';

export default function MainLayout() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!user?.uid) return;
    return listenForReminder(user.uid, (itemId) =>
      router.push(itemId ? { pathname: '/item', params: { id: itemId } } : '/'),
    );
  }, [user?.uid]);
  if (loading) return <LoadingState />;
  if (!user) return <Redirect href="/login" />;
  return (
    <AppShell>
      <Slot />
    </AppShell>
  );
}
