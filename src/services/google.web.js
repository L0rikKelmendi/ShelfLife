import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';
export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}
