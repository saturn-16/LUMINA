import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Lock, Mail, AlertCircle, ArrowRight, CheckSquare, Square, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('lumina_saved_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('lumina_saved_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('lumina_remember_me') === 'true');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const u = await login(email, password, rememberMe);
      if (!rememberMe) {
        localStorage.removeItem('lumina_saved_email');
        localStorage.removeItem('lumina_saved_password');
        localStorage.removeItem('lumina_remember_me');
      }
      if (u.role === 'ADMIN' && from === '/dashboard') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER' && from === '/dashboard') navigate('/organiser', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail || err.message;
      setError(typeof detail === 'string' ? detail : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle('CUSTOMER', rememberMe);
      if (u.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER') navigate('/organiser', { replace: true });
      else navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      console.error('Google Sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('API key')) {
        setError('Firebase project configuration needed. Please add your Firebase API keys to .env');
      } else {
        setError(err.message || 'Google sign-in failed. Please try email/password.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      const u = await login(demoEmail, demoPass, true);
      if (u.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER') navigate('/organiser', { replace: true });
      else navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-8 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-white tracking-tight">Sign In to Lumina</h1>
            <p className="text-xs text-slate-400 mt-1">Access your tickets, waitlists, and show reservations</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google 1-Click Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer mb-5 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-900 border-t-transparent" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0c0c14] px-3 text-[10px] uppercase font-mono tracking-widest text-slate-500 relative">
              OR EMAIL
            </span>
          </div>

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Remember my credentials</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                1-Click Demo Accounts
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('john@example.com', 'password123')}
                className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('organiser@ticketbooking.com', 'organiser123')}
                className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-purple-300 hover:text-purple-200 transition-all cursor-pointer"
              >
                Organiser
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@ticketbooking.com', 'admin123')}
                className="px-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:underline font-bold">
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 py-6 text-center text-xs text-slate-600">
        Lumina Ticketing Engine • Secure Session & Password Persistence
      </div>
    </div>
  );
}
