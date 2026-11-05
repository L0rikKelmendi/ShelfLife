import React from 'react';
import { Redirect, Slot } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/UI';
export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState />;
  if (user) return <Redirect href="/" />;
  return <Slot />;
}
