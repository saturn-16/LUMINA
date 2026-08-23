import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  auth,
  googleProvider,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  isFirebaseConfigured,
} from '../services/firebase';

const AuthContext = createContext(null);

// Professional Inactivity Timeout: 30 minutes of idle time
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

function clearAllAuthStorage() {
  try {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('lumina_user');
    sessionStorage.removeItem('lumina_last_activity');
    sessionStorage.removeItem('lumina_session_start');

    localStorage.removeItem('token');
    localStorage.removeItem('lumina_user');
    localStorage.removeItem('lumina_last_activity');
    localStorage.removeItem('lumina_session_start');
    localStorage.removeItem('lumina_remember_me');
  } catch (e) {
    console.warn('Error clearing auth storage:', e);
  }
}

function getInitialAuth() {
  try {
    // 1. Check for inactivity expiration
    const lastActivityStr = sessionStorage.getItem('lumina_last_activity') || localStorage.getItem('lumina_last_activity');
    if (lastActivityStr) {
      const elapsed = Date.now() - parseInt(lastActivityStr, 10);
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        clearAllAuthStorage();
        return { token: null, user: null };
      }
    }

    // 2. Default: read from sessionStorage (cleared automatically when tab/browser closes)
    let token = sessionStorage.getItem('token');
    let savedUser = sessionStorage.getItem('lumina_user');

    // 3. Optional: fallback to localStorage only if user explicitly checked "Remember Me"
    if (!token && localStorage.getItem('lumina_remember_me') === 'true') {
      token = localStorage.getItem('token');
      savedUser = localStorage.getItem('lumina_user');
    }

    if (token && savedUser) {
      // Update activity timestamp for active session
      const now = Date.now().toString();
      sessionStorage.setItem('lumina_last_activity', now);
      return { token, user: JSON.parse(savedUser) };
    }
    return { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const initial = getInitialAuth();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);
  const [loading, setLoading] = useState(true);

  // Helper to commit session storage
  const commitSession = (accessToken, userData, remember = false) => {
    const now = Date.now().toString();
    if (remember) {
      localStorage.setItem('token', accessToken);
      localStorage.setItem('lumina_user', JSON.stringify(userData));
      localStorage.setItem('lumina_remember_me', 'true');
      localStorage.setItem('lumina_last_activity', now);
      localStorage.setItem('lumina_session_start', now);
      if (auth) {
        setPersistence(auth, browserLocalPersistence).catch(() => {});
      }
    } else {
      sessionStorage.setItem('token', accessToken);
      sessionStorage.setItem('lumina_user', JSON.stringify(userData));
      sessionStorage.setItem('lumina_last_activity', now);
      sessionStorage.setItem('lumina_session_start', now);
      
      // Clear persistent storage to ensure browser close = logout
      localStorage.removeItem('token');
      localStorage.removeItem('lumina_user');
      localStorage.removeItem('lumina_remember_me');
      localStorage.removeItem('lumina_last_activity');
      if (auth) {
        setPersistence(auth, browserSessionPersistence).catch(() => {});
      }
    }
    setToken(accessToken);
    setUser(userData);
  };

  const logout = useCallback(async () => {
    try {
      if (auth) await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
    clearAllAuthStorage();
    setToken(null);
    setUser(null);
  }, []);

  // Idle Inactivity Tracker (Auto-Logout after 30 minutes of no user interactions)
  useEffect(() => {
    if (!user && !token) {
      setLoading(false);
      return;
    }

    const recordActivity = () => {
      const now = Date.now().toString();
      sessionStorage.setItem('lumina_last_activity', now);
      if (localStorage.getItem('lumina_remember_me') === 'true') {
        localStorage.setItem('lumina_last_activity', now);
      }
    };

    let throttleTimer = null;
    const onUserInteraction = () => {
      if (!throttleTimer) {
        recordActivity();
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
        }, 15000); // Throttle to write at most once every 15s
      }
    };

    window.addEventListener('mousemove', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });
    window.addEventListener('click', onUserInteraction, { passive: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true });

    // Periodic sweep every 30 seconds
    const interval = setInterval(() => {
      const lastActivity = sessionStorage.getItem('lumina_last_activity') || localStorage.getItem('lumina_last_activity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > INACTIVITY_TIMEOUT_MS) {
          console.warn('[Lumina Auth] Inactivity threshold exceeded (30m). Terminating session.');
          logout();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
      window.removeEventListener('touchstart', onUserInteraction);
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [user, token, logout]);

  // Listen to Firebase auth state safely
  useEffect(() => {
    let unsubscribe = () => {};
    if (auth) {
      try {
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const currentToken = sessionStorage.getItem('token') || (localStorage.getItem('lumina_remember_me') === 'true' ? localStorage.getItem('token') : null);
            if (!currentToken) {
              // If there's no active session storage, check if remember_me was set
              if (localStorage.getItem('lumina_remember_me') !== 'true') {
                // Not remembered, so tab was closed and reopened -> log out from Firebase
                try {
                  await firebaseSignOut(auth);
                } catch {}
                setLoading(false);
                return;
              }

              try {
                const res = await api.post('/auth/firebase-login', {
                  email: fbUser.email,
                  full_name: fbUser.displayName || fbUser.email?.split('@')[0],
                  photo_url: fbUser.photoURL || null,
                  role: fbUser.email?.includes('admin') ? 'ADMIN' : fbUser.email?.includes('organiser') ? 'ORGANISER' : 'CUSTOMER',
                });
                const { access_token, user_id, email, full_name, role } = res.data;
                const userData = { id: user_id, email, full_name, role, photo_url: fbUser.photoURL || null };
                commitSession(access_token, userData, true);
              } catch (err) {
                console.warn('Silent JWT exchange error:', err);
              }
            } else {
              const activeUser = sessionStorage.getItem('lumina_user') || localStorage.getItem('lumina_user');
              if (activeUser) setUser(JSON.parse(activeUser));
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
  const login = async (email, password, remember = false) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user_id, full_name, role } = res.data;
      const userData = { id: user_id, email, full_name, role };
      commitSession(access_token, userData, remember);

      if (remember) {
        localStorage.setItem('lumina_saved_email', email);
        localStorage.setItem('lumina_saved_password', password);
      } else {
        localStorage.removeItem('lumina_saved_email');
        localStorage.removeItem('lumina_saved_password');
      }

      return userData;
    } catch (err) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const userData = {
          id: fbUser.uid,
          email: fbUser.email,
          full_name: fbUser.displayName || email.split('@')[0],
          role: email.includes('admin') ? 'ADMIN' : email.includes('organiser') ? 'ORGANISER' : 'CUSTOMER',
        };
        commitSession('fb_session_token_' + fbUser.uid, userData, remember);
        return userData;
      } catch {
        throw err;
      }
    }
  };

  // Google 1-Click Sign-In via Firebase
  const loginWithGoogle = async (role = 'CUSTOMER', remember = false) => {
    try {
      if (auth) {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      }
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
        const userData = { id: user_id, email, full_name, role: userRole, photo_url: fbUser.photoURL || null };
        commitSession(access_token, userData, remember);
        return userData;
      } catch (backendErr) {
        try {
          const loginRes = await api.post('/auth/login', { email: payload.email, password: 'social_login_firebase_oauth' });
          const { access_token, user_id, email, full_name, role: userRole } = loginRes.data;
          const userData = { id: user_id, email, full_name, role: userRole, photo_url: fbUser.photoURL || null };
          commitSession(access_token, userData, remember);
          return userData;
        } catch {
          try {
            const regRes = await api.post('/auth/register', {
              email: payload.email,
              password: 'social_login_firebase_oauth',
              full_name: payload.full_name || 'Lumina Member',
              role: payload.role || 'CUSTOMER',
            });
            const { access_token, user_id, email, full_name, role: userRole } = regRes.data;
            const userData = { id: user_id, email, full_name, role: userRole, photo_url: fbUser.photoURL || null };
            commitSession(access_token, userData, remember);
            return userData;
          } catch (e) {
            const fallbackUser = {
              id: fbUser.uid,
              email: fbUser.email,
              full_name: fbUser.displayName || 'Lumina Member',
              role: payload.role,
              photo_url: fbUser.photoURL || null,
            };
            commitSession('fb_session_token_' + fbUser.uid, fallbackUser, remember);
            return fallbackUser;
          }
        }
      }
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  // Standard Registration
  const register = async (payload, remember = false) => {
    try {
      const res = await api.post('/auth/register', payload);
      const { access_token, user_id, email, full_name, role } = res.data;
      const userData = { id: user_id, email, full_name, role };
      commitSession(access_token, userData, remember);
      return userData;
    } catch (err) {
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
        commitSession('fb_session_token_' + fbUser.uid, userData, remember);
        return userData;
      } catch {
        throw err;
      }
    }
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
