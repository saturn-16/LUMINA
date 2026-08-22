import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  QrCode,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, waitlistsRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/waitlist').catch(() => ({ data: [] })),
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setWaitlists(Array.isArray(waitlistsRes.data) ? waitlistsRes.data : []);
    } catch (err) {
      console.error('Failed to load dashboard data via /bookings, trying /bookings/my', err);
      try {
        const altRes = await api.get('/bookings/my');
        setBookings(Array.isArray(altRes.data) ? altRes.data : []);
      } catch (e) {
        console.error('Alt fetch failed', e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm(
        'Are you sure you want to cancel this booking? Released seats will be automatically reallocated to the waitlist queue.'
      )
    ) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setMessage({ type: 'success', text: res.data.message });
      fetchDashboardData();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to cancel booking.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleViewPasscard = (booking) => {
    navigate('/confirmation', { state: { booking } });
  };

  // Format currency into INR ₹
  const formatPrice = (val) => {
    if (!val && val !== 0) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Sort bookings so newest confirmed booking is immediately the top primary focus
  const sortedBookings = [...bookings].sort((a, b) => {
    const timeA = new Date(a.created_at || a.show_start_time || 0).getTime();
    const timeB = new Date(b.created_at || b.show_start_time || 0).getTime();
    return timeB - timeA;
  });

  const activeBookings = sortedBookings.filter((b) => b.status === 'CONFIRMED');
  const pastOrCancelledBookings = sortedBookings.filter((b) => b.status === 'CANCELLED');

  const primaryUpcoming = activeBookings.length > 0 ? activeBookings[0] : null;
  const secondaryUpcoming = activeBookings.length > 1 ? activeBookings.slice(1) : [];

  const firstName = user?.full_name?.split(' ')[0] || 'Member';

  // Calculate statistics
  const totalTickets = bookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
  const totalSpend = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 selection:text-white pb-24 overflow-x-hidden">
      {/* Subtle Atmospheric Dark Ambient Glow (No Starfield) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(35, 35, 50, 0.4) 0%, rgba(5, 5, 5, 0.85) 60%, #000000 100%)',
        }}
      />

      {/* Header Bar */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-4">
        {/* Subtle Back Link */}
        <div className="mb-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors group cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1 font-mono">←</span>
            <span>Discover Events</span>
          </Link>
        </div>

        {/* Editorial Page Header */}
        <motion.section
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 border border-white/10 mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
                Personal Experience Wallet
              </span>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.05em] leading-[0.9] text-white">
                {firstName}, <br />
                <span className="italic text-white/90">what's next?</span>
              </h1>

              <p className="text-sm sm:text-base text-white/60 max-w-lg mt-4 leading-relaxed font-normal">
                Your digital ticket passcards, seat reservations, and live entry archive across India.
              </p>
            </div>

            {/* Right Action / Summary Bar */}
            <div className="flex items-center gap-3">
              {bookings.length > 0 && (
                <div className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-2xl liquid-glass border border-white/10 text-xs font-medium text-white/70">
                  <span>
                    <strong className="text-white font-bold">{activeBookings.length}</strong> Upcoming
                  </span>
                  <span className="text-white/20">•</span>
                  <span>
                    <strong className="text-white font-bold">{totalTickets}</strong> Passes
                  </span>
                  <span className="text-white/20">•</span>
                  <span>
                    <strong className="text-white font-bold">{formatPrice(totalSpend)}</strong>
                  </span>
                </div>
              )}

              <button
                onClick={fetchDashboardData}
                className="px-4 py-2.5 rounded-full liquid-glass border border-white/15 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Passes</span>
              </button>
            </div>
          </div>
        </motion.section>

        {/* Notifications & Feedback Alerts */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
                : 'bg-red-950/80 border-red-800 text-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Section 1: Active Waitlists & Instant Queue Reallocation Offers */}
        {waitlists.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest font-bold text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Active Waitlist Queue & Auto-Reallocations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitlists.map((wl) => (
                <div
                  key={wl.id}
                  className={`p-6 rounded-3xl border shadow-2xl backdrop-blur-xl transition-all ${
                    wl.status === 'OFFERED'
                      ? 'liquid-glass border-amber-500/80 bg-amber-950/20 ring-1 ring-amber-500/40'
                      : 'liquid-glass border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                        Show #{wl.show_id}
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {wl.category_name} Tier Reservation
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        wl.status === 'OFFERED'
                          ? 'bg-amber-400 text-black shadow-lg shadow-amber-500/30 animate-pulse'
                          : 'bg-white/10 text-white/80 border border-white/10'
                      }`}
                    >
                      {wl.status === 'OFFERED' ? '⚡ Seat Offered!' : `Queue #${wl.queue_position}`}
                    </span>
                  </div>

                  {wl.status === 'OFFERED' ? (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-amber-200/90 mb-4 leading-relaxed">
                        A released seat has become available and is currently held for your account. Complete your claim before the TTL expiry.
                      </p>
                      <Link
                        to={`/waitlist/claim?token=${wl.offer_token}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg transition-all"
                      >
                        <span>Claim Offered Seat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 mt-2">
                      You are in line in the automated FIFO queue. When a booking is cancelled, seats are immediately offered to your account.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-[400px] rounded-3xl liquid-glass border border-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 rounded-3xl liquid-glass border border-white/10" />
              <div className="h-64 rounded-3xl liquid-glass border border-white/10" />
            </div>
          </div>
        ) : bookings.length === 0 ? (
          /* =========================================================================
             EDITORIAL EMPTY STATE (When customer has no bookings)
             ========================================================================= */
          <div className="py-20 text-left max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-white/40 font-bold mb-4 block">
              Experience Archive
            </span>

            <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-white leading-tight mb-4">
              Your next night <br />
              <span className="italic text-white/70">is still unwritten.</span>
            </h2>

            <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8 max-w-lg font-normal">
              You haven't booked an experience yet. Discover premier cinema screenings, stadium concerts, and live festivals across India worth remembering.
            </p>

            <Link
              to="/events"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-white/90 transition-all shadow-2xl hover:scale-[1.02] cursor-pointer"
            >
              <span>Explore Experiences</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {/* =========================================================================
                1. PRIMARY UPCOMING EXPERIENCE (Widescreen Cinematic Digital Ticket)
               ========================================================================= */}
            {primaryUpcoming && (
              <motion.section
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-widest font-bold text-white/50 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Next Experience
                  </span>
                  <span className="text-xs font-mono text-white/40 uppercase">
                    Ref #{primaryUpcoming.booking_reference}
                  </span>
                </div>

                <div className="group relative rounded-3xl overflow-hidden liquid-glass border border-white/15 hover:border-white/25 shadow-2xl transition-all duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
                    {/* Left 8 Cols: Event Poster & Integrated Ticket Details */}
                    <div className="lg:col-span-8 relative p-6 sm:p-10 flex flex-col justify-between overflow-hidden bg-black">
                      {/* Background Poster Image */}
                      <img
                        src={
                          primaryUpcoming.event_banner_url ||
                          'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg'
                        }
                        alt={primaryUpcoming.event_title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
                        }}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-60"
                      />

                      {/* Multi-Stop Gradient Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

                      {/* Top Badges */}
                      <div className="relative z-10 flex flex-wrap items-center gap-2 mb-6">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                          Confirmed Pass
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/20">
                          {primaryUpcoming.event_type}
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-medium text-white/80 bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-white/50" />
                          {primaryUpcoming.venue_city}
                        </span>
                      </div>

                      {/* Title & Metadata */}
                      <div className="relative z-10 mb-8">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-white leading-tight mb-4 group-hover:text-white/95 transition-colors">
                          {primaryUpcoming.event_title}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/80 pt-4 border-t border-white/15">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-white/50 shrink-0" />
                            <span>
                              {new Date(primaryUpcoming.show_start_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(primaryUpcoming.show_start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-white/50 shrink-0" />
                            <span className="truncate">{primaryUpcoming.venue_name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Ticket Row */}
                      <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
                            Reserved Seats
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {primaryUpcoming.seats?.map((seat) => (
                              <span
                                key={seat.id || seat.show_seat_id}
                                className="px-2.5 py-0.5 rounded-lg bg-white/15 border border-white/20 text-xs font-semibold text-white backdrop-blur-md"
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

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleViewPasscard(primaryUpcoming)}
                            className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold tracking-wide hover:bg-white/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xl hover:translate-x-0.5"
                          >
                            <span>View Passcard</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleCancelBooking(primaryUpcoming.id)}
                            disabled={cancellingId === primaryUpcoming.id}
                            className="text-xs text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            {cancellingId === primaryUpcoming.id ? 'Reallocating...' : 'Cancel Booking'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right 4 Cols: Perforated Digital QR Pass Gate */}
                    <div className="lg:col-span-4 p-8 bg-black/90 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-white/10 relative">
                      <div className="p-3 bg-white rounded-2xl shadow-2xl mb-4">
                        {primaryUpcoming.qr_code_data ? (
                          <img
                            src={primaryUpcoming.qr_code_data}
                            alt={`QR pass for ${primaryUpcoming.booking_reference}`}
                            className="w-36 h-36 sm:w-44 sm:h-44 object-contain"
                          />
                        ) : (
                          <div className="w-36 h-36 sm:w-44 sm:h-44 bg-slate-100 flex items-center justify-center text-slate-800">
                            <QrCode className="w-16 h-16" />
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-mono font-bold text-white tracking-wider mb-1">
                        {primaryUpcoming.booking_reference}
                      </div>

                      <p className="text-[11px] text-white/50 max-w-[200px] leading-tight">
                        Present this high-contrast QR pass at venue turnstiles for instant admission.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* =========================================================================
                2. SECONDARY UPCOMING EXPERIENCES (Editorial Ticket Rail)
               ========================================================================= */}
            {secondaryUpcoming.length > 0 && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between mb-6"
                >
                  <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white">
                    Coming <span className="italic text-white/70">next</span>
                  </h2>
                  <span className="text-xs uppercase tracking-widest text-white/40 font-mono">
                    {secondaryUpcoming.length} Upcoming Passes
                  </span>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {secondaryUpcoming.map((b, idx) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.65, delay: 0.15 + idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                      className="group relative rounded-3xl overflow-hidden liquid-glass border border-white/10 hover:border-white/25 shadow-xl transition-all duration-500 flex flex-col justify-between"
                    >
                      {/* Top Poster Aspect */}
                      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black">
                        <img
                          src={
                            b.event_banner_url ||
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80'
                          }
                          alt={b.event_title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                        <div className="absolute top-4 left-4 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/20">
                            {b.event_type}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/80 bg-black/60 backdrop-blur-md border border-white/10">
                            {b.venue_city}
                          </span>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-xl font-normal text-white leading-tight truncate">
                            {b.event_title}
                          </h3>
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-2 text-xs text-white/70 mb-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span>
                              {new Date(b.show_start_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              •{' '}
                              {new Date(b.show_start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <span className="truncate">{b.venue_name}</span>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Ticket className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {b.seats?.map((s) => (
                                <span
                                  key={s.id || s.show_seat_id}
                                  className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-medium text-white"
                                >
                                  {s.row_label}
                                  {s.seat_number}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                          <div className="text-xs font-mono text-white/50">#{b.booking_reference}</div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewPasscard(b)}
                              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Pass</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              disabled={cancellingId === b.id}
                              className="text-xs text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* =========================================================================
                3. PAST EXPERIENCES & ARCHIVE (Cinematic Visual Cards)
               ========================================================================= */}
            {pastOrCancelledBookings.length > 0 && (
              <section className="pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between mb-6"
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white">
                      Experience <span className="italic text-white/70">archive</span>
                    </h2>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/40 font-mono">
                    {pastOrCancelledBookings.length} Recorded Nights
                  </span>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastOrCancelledBookings.map((pb, idx) => {
                    const isCancelled = pb.status === 'CANCELLED';
                    return (
                      <motion.div
                        key={pb.id}
                        initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.6, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-3xl overflow-hidden liquid-glass border transition-all duration-300 ${
                          isCancelled
                            ? 'border-red-900/30 opacity-70 bg-red-950/10'
                            : 'border-white/10 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-black">
                          <img
                            src={
                              pb.event_banner_url ||
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'
                            }
                            alt={pb.event_title}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-full object-cover grayscale-[30%]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCancelled
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  : 'bg-white/10 text-white/80 border border-white/10'
                              }`}
                            >
                              {isCancelled ? 'Booking Cancelled' : 'Past Experience'}
                            </span>
                          </div>
                        </div>

                        <div className="p-5">
                          <h4 className="text-base font-normal text-white truncate mb-1">
                            {pb.event_title}
                          </h4>
                          <p className="text-xs text-white/50 mb-3">
                            {pb.venue_city} •{' '}
                            {new Date(pb.show_start_time).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40 font-mono">
                            <span>#{pb.booking_reference}</span>
                            <span>{formatPrice(pb.total_amount)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Editorial Liquid Glass Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mt-20">
        <Footer />
      </div>
    </div>
  );
}
