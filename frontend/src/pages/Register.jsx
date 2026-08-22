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

  const { register } = useAuth();
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
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (err.message || 'Registration failed. Please try again.');
      setError(message);
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
            <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
            <p className="text-xs text-slate-400 mt-1">Join Lumina for premium movie and concert bookings</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

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
