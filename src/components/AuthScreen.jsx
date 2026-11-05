import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, Sprout } from './Icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../lib/errors';
import { photos } from '../lib/photos';
import { colors, fonts, shared } from '../theme';
import { Button, Field, IconButton, Logo, Txt } from './UI';

export default function AuthScreen({ signup = false }) {
  const { login, register, google, explore, resetPassword, firebaseReady } = useAuth();
  const notify = useToast();
  const { width } = useWindowDimensions();
  const desktop = width >= 950;
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const action = async (key, callback) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      await callback();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };
  const validEmail = () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const submit = () => {
    if (signup && !name.trim()) {
      setError('Tell us what to call you.');
      return;
    }
    if (!validEmail()) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    if (signup && password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    if (signup && password !== confirm) {
      setError('Your passwords don’t match yet.');
      return;
    }
    action('email', () => (signup ? register(name, email, password) : login(email, password)));
  };
  const forgot = () => {
    if (!validEmail()) {
      setError('Enter your email above, then tap “Forgot password?”.');
      return;
    }
    action('reset', async () => {
      await resetPassword(email);
      notify('If this email has an account, a reset link is on its way.');
    });
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {desktop && (
          <View style={{ width: '45%', overflow: 'hidden' }}>
            <ImageBackground
              source={photos.hero}
              imageStyle={{ width: '100%', height: '100%' }}
              style={{ flex: 1, backgroundColor: colors.green }}
            >
              <LinearGradient
                colors={['#173D2BD9', '#173D2BBA', '#173D2BF5']}
                style={{
                  flex: 1,
                  padding: 45,
                  paddingTop: 42 + insets.top,
                  justifyContent: 'space-between',
                }}
              >
                <Logo light />
                <View style={{ maxWidth: 450, paddingVertical: 50 }}>
                  <View style={[shared.row, { gap: 8, marginBottom: 23 }]}>
                    <Sprout size={19} color={colors.lime} />
                    <Txt
                      style={{
                        color: colors.lime,
                        fontSize: 10,
                        letterSpacing: 2.1,
                        fontFamily: fonts.bold,
                      }}
                    >
                      A FRESH LITTLE BEGINNING
                    </Txt>
                  </View>
                  <Txt
                    serif
                    style={{
                      color: '#fff',
                      fontSize: width > 1350 ? 65 : 52,
                      lineHeight: width > 1350 ? 73 : 60,
                      letterSpacing: -1,
                    }}
                  >
                    Good food.{'\n'}Better days.{'\n'}Less waste.
                  </Txt>
                  <Txt
                    style={{
                      color: '#DCE6D6',
                      lineHeight: 25,
                      marginTop: 24,
                      fontSize: 14,
                      maxWidth: 330,
                    }}
                  >
                    A thoughtful little home for everything in your pantry. Let’s make the most of
                    the good stuff.
                  </Txt>
                </View>
                <View style={[shared.row, { gap: 9 }]}>
                  <Leaf color={colors.lime} size={17} />
                  <Txt style={{ color: '#D6E0CE', fontSize: 11 }}>
                    Small habits. Delicious possibilities.
                  </Txt>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        )}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: desktop ? 45 : 26,
            paddingTop: desktop ? 45 : insets.top + 32,
            paddingBottom: insets.bottom + 32,
          }}
          style={{ flex: 1 }}
        >
          <View style={{ width: '100%', maxWidth: 395 }}>
            {!desktop && (
              <View style={{ marginBottom: 45 }}>
                <Logo />
              </View>
            )}
            <View
              style={{
                height: 47,
                width: 47,
                borderRadius: 16,
                backgroundColor: colors.lightGreen,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 22,
              }}
            >
              <Sprout size={25} strokeWidth={1.4} color={colors.green} />
            </View>
            <Txt style={[shared.label, { fontSize: 9, marginBottom: 10 }]}>
              {signup ? 'YOUR FRESH START' : 'WELCOME TO YOUR LITTLE KITCHEN'}
            </Txt>
            <Txt
              serif
              accessibilityRole="header"
              style={{ fontSize: 39, lineHeight: 47, letterSpacing: -0.8 }}
            >
              {signup ? 'Good things start here.' : 'A fresher kind of everyday.'}
            </Txt>
            <Txt muted style={{ fontSize: 13, lineHeight: 22, marginTop: 11, marginBottom: 26 }}>
              {signup
                ? 'Make a little room for less waste and more possibility.'
                : 'Come on in. Your pantry is full of possibilities.'}
            </Txt>
            <View style={{ gap: 16 }}>
              {signup && (
                <Field
                  label="Your name"
                  placeholder="What should we call you?"
                  value={name}
                  maxLength={60}
                  onChangeText={setName}
                  autoComplete="name"
                  editable={!busy}
                />
              )}
              <Field
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!busy}
              />
              <View>
                <Field
                  label="Password"
                  placeholder={signup ? 'At least 6 characters' : 'Your password'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!visible}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  editable={!busy}
                  onSubmitEditing={submit}
                  inputStyle={{ paddingRight: 50 }}
                />
                <View style={{ position: 'absolute', right: 4, bottom: 4 }}>
                  <IconButton
                    icon={visible ? EyeOff : Eye}
                    label={visible ? 'Hide password' : 'Show password'}
                    onPress={() => setVisible((value) => !value)}
                  />
                </View>
              </View>
              {signup && (
                <Field
                  label="Confirm password"
                  placeholder="One more time"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!visible}
                  autoComplete="new-password"
                  editable={!busy}
                  onSubmitEditing={submit}
                />
              )}
              {!signup && (
                <Pressable
                  accessibilityRole="button"
                  onPress={forgot}
                  disabled={!!busy}
                  style={{ alignSelf: 'flex-end', paddingVertical: 5 }}
                >
                  <Txt style={{ color: colors.green, fontSize: 11, fontFamily: fonts.bold }}>
                    {busy === 'reset' ? 'Sending a reset link…' : 'Forgot password?'}
                  </Txt>
                </Pressable>
              )}
              {error && (
                <View
                  accessibilityRole="alert"
                  style={{ backgroundColor: colors.lightRed, padding: 12, borderRadius: 10 }}
                >
                  <Txt style={{ color: colors.red, fontSize: 12, lineHeight: 20 }}>{error}</Txt>
                </View>
              )}
              <Button
                title={signup ? 'Create my account' : 'Step into my kitchen'}
                icon={ArrowRight}
                loading={busy === 'email'}
                disabled={!!busy && busy !== 'email'}
                onPress={submit}
              />
            </View>
            <View style={[shared.row, { gap: 12, marginVertical: 22 }]}>
              <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
              <Txt muted style={{ fontSize: 10 }}>
                or keep it simple
              </Txt>
              <View style={{ height: 1, backgroundColor: colors.border, flex: 1 }} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={!!busy}
              onPress={() => action('google', google)}
              style={({ hovered }) => [
                shared.row,
                {
                  justifyContent: 'center',
                  gap: 11,
                  minHeight: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: hovered ? '#F0F3E9' : '#fff',
                  opacity: busy ? 0.6 : 1,
                },
              ]}
            >
              <Txt style={{ fontFamily: fonts.bold, color: '#4285F4', fontSize: 20 }}>G</Txt>
              <Txt style={{ fontFamily: fonts.bold, fontSize: 12 }}>
                {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
              </Txt>
            </Pressable>
            <View
              style={[
                shared.row,
                { justifyContent: 'center', gap: 5, marginTop: 24, flexWrap: 'wrap' },
              ]}
            >
              <Txt muted style={{ fontSize: 12 }}>
                {signup ? 'Already feel at home?' : 'New around here?'}
              </Txt>
              <Pressable
                accessibilityRole="button"
                disabled={!!busy}
                onPress={() => router.replace(signup ? '/login' : '/register')}
                style={{ paddingVertical: 7 }}
              >
                <Txt style={{ fontFamily: fonts.bold, color: colors.green, fontSize: 12 }}>
                  {signup ? 'Sign in' : 'Make yourself an account'}
                </Txt>
              </Pressable>
            </View>
            <View
              style={{
                borderTopWidth: 1,
                borderColor: colors.border,
                marginTop: 25,
                paddingTop: 22,
                gap: 10,
                alignItems: 'center',
              }}
            >
              <Pressable
                accessibilityRole="button"
                disabled={!!busy}
                onPress={() => action('preview', explore)}
                style={[shared.row, { gap: 6, padding: 7 }]}
              >
                <Txt style={{ color: colors.green, fontFamily: fonts.bold, fontSize: 12 }}>
                  {busy === 'preview' ? 'Setting the table…' : 'Just looking? Explore the preview'}
                </Txt>
                <ArrowRight size={14} color={colors.green} />
              </Pressable>
              <Txt
                muted
                style={{ fontSize: 10, lineHeight: 17, textAlign: 'center', maxWidth: 310 }}
              >
                {firebaseReady
                  ? 'The preview uses sample data stored on this device.'
                  : 'Cloud accounts are not connected yet. Explore a working pantry with local sample data in the meantime.'}
              </Txt>
            </View>
            <View style={[shared.row, { justifyContent: 'center', gap: 6, marginTop: 23 }]}>
              <ShieldCheck size={12} color="#99A38D" />
              <Txt muted style={{ fontSize: 9 }}>
                Your kitchen. Your little corner of the world.
              </Txt>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
