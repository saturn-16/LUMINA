import { initializeApp, getApps, getApp } from '@firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '@firebase/auth';

// Your web app's Firebase configuration
// These values can be set in your .env file or Vercel Environment Variables:
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForFallbackOnly123456",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lumina-ticket-booking.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lumina-ticket-booking",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lumina-ticket-booking.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
};

// Initialize Firebase safely (avoid multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes("Dummy")
);

export {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
};
