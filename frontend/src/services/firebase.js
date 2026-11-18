import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBEt973l5rVKlkkzQEIKNyfRleIyUgkMZQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'project-ff09712e-91d9-434f-807.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'project-ff09712e-91d9-434f-807',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'project-ff09712e-91d9-434f-807.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '600965688597',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:600965688597:web:029bcf28ca922dae724d1c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1H8YGFD870'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  return await signInWithPopup(auth, googleProvider);
};

export const resetPasswordWithFirebase = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

export { auth, googleProvider, sendPasswordResetEmail };
export default app;
