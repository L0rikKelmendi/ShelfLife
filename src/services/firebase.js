import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const emulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
export const firebaseReady = emulators || Object.values(config).every(Boolean);
export const firebaseMode = emulators ? 'emulator' : 'cloud';
export let auth = null;
export let db = null;

if (firebaseReady) {
  const app = getApps().length
    ? getApp()
    : initializeApp(
        emulators
          ? {
              apiKey: 'demo-key',
              authDomain: 'demo-shelflife.firebaseapp.com',
              projectId: 'demo-shelflife',
              appId: 'demo-app',
            }
          : config,
      );
  if (Platform.OS === 'web') auth = getAuth(app);
  else {
    try {
      auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch (error) {
      if (error.code !== 'auth/already-initialized') throw error;
      auth = getAuth(app);
    }
  }
  db = getFirestore(app);
  if (emulators && !globalThis.__shelflifeEmulatorsConnected) {
    const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || '127.0.0.1';
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    globalThis.__shelflifeEmulatorsConnected = true;
  }
}
