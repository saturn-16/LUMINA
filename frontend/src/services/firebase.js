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

// Your web app's Firebase configuration strictly from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase safely
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);
const app = isConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : (getApps().length === 0 ? initializeApp({ apiKey: "AIzaSyPlaceholderKeyForBuild123456789" }) : getApp());

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = isConfigured;

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
