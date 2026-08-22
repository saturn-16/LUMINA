import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Lock, Mail, AlertCircle, ArrowRight, UserCheck, CheckSquare, Square } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('lumina_saved_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('lumina_saved_password') || '');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('lumina_remember_me') !== 'false');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
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
        localStorage.setItem('lumina_remember_me', 'false');
      }
      if (u.role === 'ADMIN' && from === '/dashboard') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER' && from === '/dashboard') navigate('/organiser', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (err.message || 'Invalid email or password.');
      setError(message);
    } finally {
      setLoading(false);
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">Sign In to Lumina</h1>
            <p className="text-xs text-slate-400 mt-1">Access your tickets, waitlists, and show reservations</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="email"
                  name="email"
                  id="email"
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
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              1-Click Demo Accounts
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@ticketbooking.com', 'customer123')}
                className="px-2 py-2 rounded-xl liquid-glass border border-white/10 hover:bg-white/10 text-[11px] font-semibold text-blue-300 transition-colors cursor-pointer"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('organiser@ticketbooking.com', 'organiser123')}
                className="px-2 py-2 rounded-xl liquid-glass border border-white/10 hover:bg-white/10 text-[11px] font-semibold text-purple-300 transition-colors cursor-pointer"
              >
                Organiser
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@ticketbooking.com', 'admin123')}
                className="px-2 py-2 rounded-xl liquid-glass border border-white/10 hover:bg-white/10 text-[11px] font-semibold text-amber-300 transition-colors cursor-pointer"
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
