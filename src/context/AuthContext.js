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
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseReady, firebaseMode } from '../services/firebase';
import { signInGoogle } from '../services/google';
import { cancelUserReminders } from '../services/notifications';

const AuthContext = createContext(null);
const previewUser = { uid: 'preview', displayName: 'Alex', email: 'alex@preview.local' };
const PREVIEW = '@shelflife/preview';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState(firebaseMode);
  const [loading, setLoading] = useState(true);
  const previewPreference = useRef(false);
  useEffect(() => {
    let mounted = true;
    let unsubscribe;
    const boot = async () => {
      const preview = await AsyncStorage.getItem(PREVIEW);
      previewPreference.current = preview === 'true';
      if (!mounted) return;
      if (!firebaseReady) {
        if (preview === 'true') {
          setUser(previewUser);
          setMode('preview');
        }
        setLoading(false);
        return;
      }
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (!mounted) return;
          if (firebaseUser) {
            setUser(firebaseUser);
            setMode(firebaseMode);
          } else if (previewPreference.current) {
            setUser(previewUser);
            setMode('preview');
          } else setUser(null);
          setLoading(false);
        },
        () => {
          if (mounted) setLoading(false);
        },
      );
    };
    boot().catch(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const explore = useCallback(async () => {
    await AsyncStorage.setItem(PREVIEW, 'true');
    previewPreference.current = true;
    setMode('preview');
    setUser(previewUser);
  }, []);
  const requireFirebase = () => {
    if (!firebaseReady)
      throw new Error(
        'Firebase is not connected yet. You can explore the preview while the project is being configured.',
      );
  };
  const login = useCallback(async (email, password) => {
    requireFirebase();
    previewPreference.current = false;
    await AsyncStorage.removeItem(PREVIEW);
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    setMode(firebaseMode);
    setUser(result.user);
  }, []);
  const register = useCallback(async (name, email, password) => {
    requireFirebase();
    previewPreference.current = false;
    await AsyncStorage.removeItem(PREVIEW);
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(result.user, { displayName: name.trim() });
    setMode(firebaseMode);
    setUser({ ...result.user, displayName: name.trim() });
  }, []);
  const google = useCallback(async () => {
    requireFirebase();
    previewPreference.current = false;
    await AsyncStorage.removeItem(PREVIEW);
    const result = await signInGoogle();
    setMode(firebaseMode);
    setUser(result.user);
  }, []);
  const resetPassword = useCallback(async (email) => {
    requireFirebase();
    await sendPasswordResetEmail(auth, email.trim());
  }, []);
  const logout = useCallback(async () => {
    if (user) await cancelUserReminders(user.uid);
    previewPreference.current = false;
    await AsyncStorage.removeItem(PREVIEW);
    if (firebaseReady && auth.currentUser) await signOut(auth);
    setUser(null);
    setMode(firebaseMode);
  }, [user]);
  const value = useMemo(
    () => ({
      user,
      mode,
      loading,
      explore,
      login,
      register,
      google,
      resetPassword,
      logout,
      firebaseReady,
    }),
    [user, mode, loading, explore, login, register, google, resetPassword, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
