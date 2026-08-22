import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Lock, Mail, User, AlertCircle, ArrowRight, Shield, CheckSquare, Square } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'CUSTOMER',
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const u = await register(formData, rememberMe);
      if (u.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER') navigate('/organiser', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.response?.data?.detail || err.message;
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const u = await loginWithGoogle(formData.role || 'CUSTOMER');
      if (u.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (u.role === 'ORGANISER') navigate('/organiser', { replace: true });
      else navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Google Sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up cancelled.');
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('API key')) {
        setError('Firebase project configuration needed. Please add your Firebase API keys to .env');
      } else {
        setError(err.message || 'Google sign-up failed. Please try email/password.');
      }
    } finally {
      setGoogleLoading(false);
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
            <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
            <p className="text-xs text-slate-400 mt-1">Join Lumina for premium movie and concert bookings</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Google 1-Click Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
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
            <span>Sign up with Google</span>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-black/60 rounded-xl border border-white/15 focus-within:border-blue-500 transition-colors">
                <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="CUSTOMER" className="bg-slate-900 text-white">Customer (Book & Hold Seats)</option>
                  <option value="ORGANISER" className="bg-slate-900 text-white">Organiser (Host Events & Set Pricing)</option>
                  <option value="ADMIN" className="bg-slate-900 text-white">Admin (Venues & System Management)</option>
                </select>
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
                <span>Remember my credentials for fast sign in</span>
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
                  Creating Account...
                </>
              ) : (
                <>
                  Get Started <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:underline font-bold">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 py-6 text-center text-xs text-slate-600">
        Lumina Ticketing Engine • Fast & Reliable High-Concurrency Booking
      </div>
    </div>
  );
}
