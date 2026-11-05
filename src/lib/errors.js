const messages = {
  'auth/invalid-credential': 'That email and password do not match. Try again.',
  'auth/user-not-found': 'That email and password do not match. Try again.',
  'auth/wrong-password': 'That email and password do not match. Try again.',
  'auth/email-already-in-use': 'There is already an account with this email. Try signing in.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/operation-not-allowed':
    'This sign-in method is still being connected. Please try again after account setup.',
  'auth/configuration-not-found':
    'The cloud account connection is still being set up. Please try again shortly.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Could not connect. Check your internet connection and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again whenever you are ready.',
  'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow popups and try again.',
  'auth/account-exists-with-different-credential':
    'Use your existing sign-in method for this email.',
  'auth/unauthorized-domain': 'Add this hostname to Firebase Authentication’s authorized domains.',
  'permission-denied': 'Your account cannot access this data. Check the Firestore rules.',
  unavailable: 'Could not reach your pantry. Check your connection and try again.',
};
export function errorMessage(error) {
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}
