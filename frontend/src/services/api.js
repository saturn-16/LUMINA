import axios from 'axios';

let configuredUrl = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://lumina-16hr.onrender.com/api'
    : '/api'
);

// If URL points to remote backend and doesn't end with /api, append /api
if (configuredUrl.startsWith('http') && !configuredUrl.endsWith('/api') && !configuredUrl.endsWith('/api/')) {
  configuredUrl = configuredUrl.replace(/\/+$/, '') + '/api';
}

const api = axios.create({
  baseURL: configuredUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically (session-first)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and on protected page, clear auth tokens
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthUrl) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('lumina_user');
        sessionStorage.removeItem('lumina_last_activity');
        localStorage.removeItem('token');
        localStorage.removeItem('lumina_user');
        localStorage.removeItem('lumina_last_activity');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
