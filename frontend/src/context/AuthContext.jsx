import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('lumina_user', JSON.stringify(res.data));
        } catch (err) {
          // ONLY clear credentials if server explicitly returns 401 Unauthorized (token invalid/expired)
          // Never log out on temporary network glitches or proxy reload
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('lumina_user');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password, remember = true) => {
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
  };

  const register = async (payload, remember = true) => {
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
  };

  const logout = () => {
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
        register,
        logout,
        isAuthenticated: !!user || !!token,
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
      register: async () => {},
      logout: () => {},
      isAuthenticated: false,
    };
  }
  return context;
}
