import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  isFirebaseConfigured,
} from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize user immediately from persistent storage to prevent logout on page refresh
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('lumina_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state and ensure backend JWT token is always active
  useEffect(() => {
    let unsubscribe = () => {};
    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
              try {
                const res = await api.post('/auth/firebase-login', {
                  email: fbUser.email,
                  full_name: fbUser.displayName || fbUser.email?.split('@')[0],
                  photo_url: fbUser.photoURL || null,
                  role: fbUser.email?.includes('admin') ? 'ADMIN' : fbUser.email?.includes('organiser') ? 'ORGANISER' : 'CUSTOMER',
                });
                const { access_token, user_id, email, full_name, role } = res.data;
                localStorage.setItem('token', access_token);
                setToken(access_token);
                const userData = { id: user_id, email, full_name, role, photo_url: fbUser.photoURL || null };
                localStorage.setItem('lumina_user', JSON.stringify(userData));
                setUser(userData);
              } catch (err) {
                console.warn('Silent JWT exchange error:', err);
              }
            } else {
              const savedUser = localStorage.getItem('lumina_user');
              if (savedUser) setUser(JSON.parse(savedUser));
            }
          }
          setLoading(false);
        });
      } catch (e) {
        console.warn('Firebase onAuthStateChanged error:', e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  // Standard API Login
  const login = async (email, password, remember = true) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user_id, full_name, role } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userData = { id: user_id, email, full_name, role };
      localStorage.setItem('lumina_user', JSON.stringify(userData));
      setUser(userData);

      if (remember) {
        localStorage.setItem('lumina_saved_email', email);
        localStorage.setItem('lumina_saved_password', password);
        localStorage.setItem('lumina_remember_me', 'true');
      }

      return userData;
    } catch (err) {
      // If backend login fails, try Firebase email/password if available
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userData = {
          id: fbUser.uid,
          email: fbUser.email,
          full_name: fbUser.displayName || email.split('@')[0],
          role: email.includes('admin') ? 'ADMIN' : email.includes('organiser') ? 'ORGANISER' : 'CUSTOMER',
        };
        setUser(userData);
        localStorage.setItem('lumina_user', JSON.stringify(userData));
        return userData;
      } catch {
        throw err;
      }
    }
  };

  // Google 1-Click Sign-In via Firebase
  const loginWithGoogle = async (role = 'CUSTOMER') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const payload = {
        email: fbUser.email,
        full_name: fbUser.displayName || 'Lumina Member',
        photo_url: fbUser.photoURL || null,
        role: fbUser.email?.includes('admin') ? 'ADMIN' : fbUser.email?.includes('organiser') ? 'ORGANISER' : role,
      };

      try {
        const res = await api.post('/auth/firebase-login', payload);
        const { access_token, user_id, email, full_name, role: userRole } = res.data;
        localStorage.setItem('token', access_token);
        setToken(access_token);

        const userData = { id: user_id, email, full_name, role: userRole, photo_url: fbUser.photoURL || null };
        setUser(userData);
        localStorage.setItem('lumina_user', JSON.stringify(userData));
        localStorage.setItem('lumina_saved_email', fbUser.email);
        return userData;
      } catch (backendErr) {
        console.warn('Backend sync failed, using client auth:', backendErr);
        const fallbackUser = {
          id: fbUser.uid,
          email: fbUser.email,
          full_name: fbUser.displayName || 'Lumina Member',
          role: payload.role,
          photo_url: fbUser.photoURL || null,
        };
        setUser(fallbackUser);
        localStorage.setItem('lumina_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  // Standard or Firebase Registration
  const register = async (payload, remember = true) => {
    try {
      const res = await api.post('/auth/register', payload);
      const { access_token, user_id, email, full_name, role } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userData = { id: user_id, email, full_name, role };
      localStorage.setItem('lumina_user', JSON.stringify(userData));
      setUser(userData);

      if (remember) {
        localStorage.setItem('lumina_saved_email', email);
        localStorage.setItem('lumina_saved_password', payload.password || '');
        localStorage.setItem('lumina_remember_me', 'true');
      }

      return userData;
    } catch (err) {
      // Fallback: Register with Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
        const fbUser = userCredential.user;
        if (payload.full_name) {
          await updateProfile(fbUser, { displayName: payload.full_name });
        }
        const userData = {
          id: fbUser.uid,
          email: fbUser.email,
          full_name: payload.full_name || fbUser.email.split('@')[0],
          role: payload.role || 'CUSTOMER',
        };
        setUser(userData);
        localStorage.setItem('lumina_user', JSON.stringify(userData));
        return userData;
      } catch {
        throw err;
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('lumina_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        isAuthenticated: !!user || !!token,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      login: async () => {},
      loginWithGoogle: async () => {},
      register: async () => {},
      logout: () => {},
      isAuthenticated: false,
      isFirebaseConfigured: false,
    };
  }
  return context;
}
