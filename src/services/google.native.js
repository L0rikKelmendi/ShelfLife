import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

export async function signInGoogle() {
  if (Constants.executionEnvironment === 'storeClient')
    throw new Error(
      'Google sign-in needs the ShelfLife development build. Email sign-in and the preview work in Expo Go.',
    );
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId)
    throw new Error(
      'Google sign-in is not configured yet. Add the Google web client ID from your Firebase project.',
    );
  const { GoogleSignin, isSuccessResponse } = require('@react-native-google-signin/google-signin');
  GoogleSignin.configure({
    webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) throw new Error('Google sign-in was cancelled.');
  if (!result.data.idToken)
    throw new Error('Google did not return a sign-in token. Check the OAuth client configuration.');
  return signInWithCredential(auth, GoogleAuthProvider.credential(result.data.idToken));
}
