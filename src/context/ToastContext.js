import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimateIn } from '../components/Motion';
import { CheckCircle2, Info, X } from '../components/Icons';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const [acting, setActing] = useState(false);
  const notify = useCallback((message, type = 'success', options = {}) => {
    clearTimeout(timer.current);
    setToast({ message, type, ...options });
    timer.current = setTimeout(
      () => setToast(null),
      options.duration || (type === 'error' ? 6500 : 3500),
    );
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={styles.wrap}>
          <AnimateIn
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, toast.type === 'error' && { backgroundColor: '#8C3D30' }]}
          >
            {toast.type === 'error' ? (
              <Info size={20} color="#fff" />
            ) : (
              <CheckCircle2 size={20} color="#D5E9AD" />
            )}
            <Text style={styles.text}>{toast.message}</Text>
            {toast.onAction && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={toast.actionLabel || 'Undo'}
                disabled={acting}
                onPress={async () => {
                  clearTimeout(timer.current);
                  setActing(true);
                  try {
                    await toast.onAction();
                    setToast((current) => (current === toast ? null : current));
                  } catch {
                    notify('Could not undo that change. Please try again.', 'error');
                  } finally {
                    setActing(false);
                  }
                }}
                style={{
                  minHeight: 44,
                  minWidth: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: acting ? 0.5 : 1,
                }}
              >
                <Text style={{ fontFamily: 'DMSans_700Bold', color: '#D5E9AD', fontSize: 13 }}>
                  {toast.actionLabel || 'Undo'}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss message"
              hitSlop={10}
              onPress={() => setToast(null)}
            >
              <X size={17} color="#fff" />
            </Pressable>
          </AnimateIn>
        </View>
      )}
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#223D2F',
    padding: 17,
    borderRadius: 16,
    maxWidth: 540,
    width: '100%',
    boxShadow: '0 8px 30px #182A2325',
  },
  text: { fontFamily: 'DMSans_500Medium', color: '#fff', flex: 1, fontSize: 14, lineHeight: 21 },
});
