import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  LayoutDashboard,
  Mail,
  Calendar,
  MapPin,
  Ticket,
  QrCode,
  ShieldCheck,
  Film,
  Send,
  Loader2,
} from 'lucide-react';

export default function BookingConfirmation() {
  const location = useLocation();
  const { user } = useAuth();
  const booking = location.state?.booking;

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const formatPrice = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const handleResendEmail = async () => {
    if (!booking?.booking_reference) return;
    setResending(true);
    setResendStatus(null);

    const ref = String(booking.booking_reference).replace(/^#/, '').trim();
    try {
      const res = await api.post(`/bookings/${encodeURIComponent(ref)}/resend-email`);
      setResendStatus({
        success: true,
        message: res.data?.message || `Confirmation email dispatched to ${user?.email || 'your registered Gmail ID'}!`,
      });
    } catch (err) {
      setResendStatus({
        success: false,
        message: err.response?.data?.detail || 'Failed to dispatch email. Please try again.',
      });
    } finally {
      setResending(false);
    }
  };

  if (!booking) {
    return (
      <div className="relative min-h-screen bg-[#050505] text-white flex flex-col justify-between p-4 font-sans">
        <div className="max-w-7xl mx-auto w-full">
          <Navbar />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg mx-auto w-full text-center py-20"
        >
          <span className="text-xs uppercase tracking-widest text-white/40 font-bold mb-3 block">
            Reservation Lookup
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-white mb-4">
            No Recent Booking Active
          </h2>
          <p className="text-sm text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
            All your confirmed passes, seats, and QR entry cards are safely stored in your personal Lumina Experience Wallet.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-white/90 transition-all shadow-2xl hover:scale-[1.02] cursor-pointer"
          >
            <span>Go to My Tickets</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="max-w-7xl mx-auto w-full">
          <Footer />
        </div>
      </div>
    );
  }

  const showDateStr = booking.show_start_time
    ? new Date(booking.show_start_time).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Confirmed Date';

  const showTimeStr = booking.show_start_time
    ? new Date(booking.show_start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const registeredEmail = user?.email || booking.customer_email || 'your registered Gmail ID';

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 selection:text-white pb-24 overflow-x-hidden">
      {/* Dark Ambient Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(30, 40, 35, 0.4) 0%, rgba(5, 5, 5, 0.9) 60%, #000000 100%)',
        }}
      />

      {/* Header Bar */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-6">
        {/* Success Announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-2xl"
          >
            <CheckCircle2 className="w-7 h-7" />
          </motion.div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-2">
            Reservation Confirmed & Synced
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] text-white leading-tight mb-3">
            You're all set.
          </h1>

          <div className="flex flex-col items-center gap-2">
            <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Confirmation ticket & entry QR dispatched to:</span>
            </p>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white font-medium">
              {registeredEmail}
            </span>
          </div>
        </motion.div>

        {/* Resend Email Status Alert */}
        <AnimatePresence>
          {resendStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl ${
                resendStatus.success
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                  : 'bg-red-950/80 border-red-700 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {resendStatus.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Mail className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{resendStatus.message}</span>
              </div>
              <button
                onClick={() => setResendStatus(null)}
                className="text-white/60 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Digital Boarding Passcard */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl mb-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* Left 8 Cols: Event info & Seat badges */}
            <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-black/60">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {booking.status || 'CONFIRMED'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white border border-white/20">
                    {booking.event_type || 'EXPERIENCE'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono text-white/70 bg-black/60 border border-white/10">
                    Ref #{booking.booking_reference}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white mb-4">
                  {booking.event_title || 'Confirmed Live Experience'}
                </h2>

                <div className="space-y-2 text-xs text-white/70 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span>
                      {showDateStr} {showTimeStr ? `• ${showTimeStr}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span>
                      {booking.venue_name}
                      {booking.venue_city ? `, ${booking.venue_city}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reserved Seats Chips */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Reserved Seats
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.seats?.map((seat) => (
                      <span
                        key={seat.id || seat.show_seat_id}
                        className="px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 text-xs font-semibold text-white"
                      >
                        {seat.row_label}
                        {seat.seat_number}{' '}
                        <span className="text-[10px] text-white/60 font-normal">
                          ({seat.category_name})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">
                    Total Paid
                  </div>
                  <div className="text-xl font-normal text-white">
                    {formatPrice(booking.total_amount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: QR Entry Pass Gate */}
            <div className="md:col-span-4 p-8 bg-black/90 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-white/10 relative">
              <div className="p-3 bg-white rounded-2xl shadow-2xl mb-4">
                {booking.qr_code_data ? (
                  <img
                    src={booking.qr_code_data}
                    alt={`Admission QR for ${booking.booking_reference}`}
                    className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-800">
                    <QrCode className="w-16 h-16" />
                  </div>
                )}
              </div>

              <div className="text-xs font-mono font-bold text-white tracking-wider mb-1">
                {booking.booking_reference}
              </div>

              <p className="text-[11px] text-white/50 max-w-[180px] leading-tight mb-4">
                Scan this official entry pass at venue turnstiles.
              </p>

              {/* Resend Email CTA */}
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-semibold text-white/90 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-emerald-400" />
                    <span>Resend to Mail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/10 hover:scale-[1.02] cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to My Tickets Wallet</span>
          </Link>

          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full liquid-glass border border-white/15 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <span>Explore More Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Editorial Liquid Glass Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mt-20">
        <Footer />
      </div>
    </div>
  );
}
