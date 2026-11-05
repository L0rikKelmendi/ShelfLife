import { MotionProvider } from '../components/Motion';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PantryProvider } from '../context/PantryContext';
import { ToastProvider } from '../context/ToastContext';
import { QuickAddProvider } from '../context/QuickAddContext';
import { colors } from '../theme';

export { ErrorBoundary } from 'expo-router';
function SessionPantry({ children }) {
  const { user, mode } = useAuth();
  return (
    <ToastProvider key={`${mode}/${user?.uid || 'anonymous'}`}>
      <PantryProvider>
        <QuickAddProvider>{children}</QuickAddProvider>
      </PantryProvider>
    </ToastProvider>
  );
}
export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    DMSans_400Regular: require('@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf'),
    DMSans_500Medium: require('@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf'),
    DMSans_700Bold: require('@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf'),
    DMSerifDisplay_400Regular: require('@expo-google-fonts/dm-serif-display/400Regular/DMSerifDisplay_400Regular.ttf'),
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.green} />
      </View>
    );
  return (
    <SafeAreaProvider>
      <MotionProvider>
        <AuthProvider>
          <SessionPantry>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'fade',
              }}
            />
          </SessionPantry>
        </AuthProvider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}
