import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HoldTimer from '../components/HoldTimer';
import {
  ShieldCheck,
  CreditCard,
  Ticket,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ArrowUpRight,
  Sparkles,
  Lock,
  User,
  Mail,
  Film,
} from 'lucide-react';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const holdData = location.state?.holdData;
  const seatMapMeta = location.state?.seatMapMeta;

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(false);

  // Safely extract held seats array
  const heldSeats = Array.isArray(holdData?.seats)
    ? holdData.seats
    : Array.isArray(holdData?.held_seats)
    ? holdData.held_seats
    : [];

  // Safely calculate total amount without relying on unsafe .toFixed()
  const calculateTotalAmount = () => {
    if (typeof holdData?.total_amount === 'number' && !isNaN(holdData.total_amount)) {
      return holdData.total_amount;
    }
    if (typeof holdData?.total_price === 'number' && !isNaN(holdData.total_price)) {
      return holdData.total_price;
    }
    if (heldSeats.length > 0) {
      return heldSeats.reduce(
        (sum, s) => sum + (typeof s.price === 'number' && !isNaN(s.price) ? s.price : 0),
        0
      );
    }
    return 0;
  };

  const totalAmount = calculateTotalAmount();

  // Format currency safely to INR ₹
  const formatPrice = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Fetch full event details if available for rich backdrop & metadata
  useEffect(() => {
    if (!holdData?.show_id) return;

    let isMounted = true;
    const fetchExtraDetails = async () => {
      setLoadingEvent(true);
      try {
        if (seatMapMeta?.event_id) {
          const res = await api.get(`/events/${seatMapMeta.event_id}`);
          if (isMounted) setEventDetails(res.data);
        } else {
          const res = await api.get(`/shows/${holdData.show_id}/seats`);
          if (res.data?.event_id) {
            const evtRes = await api.get(`/events/${res.data.event_id}`);
            if (isMounted) setEventDetails(evtRes.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch additional event details', err);
      } finally {
        if (isMounted) setLoadingEvent(false);
      }
    };

    fetchExtraDetails();
    return () => {
      isMounted = false;
    };
  }, [holdData, seatMapMeta]);

  if (!holdData) {
    return (
      <div className="relative min-h-screen bg-[#050505] text-white flex flex-col justify-between p-4 font-sans">
        <div className="max-w-7xl mx-auto w-full">
          <Navbar />
        </div>

        <div className="relative z-10 max-w-lg mx-auto w-full text-center py-20">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-3 block">
            Session Expired
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-white mb-4">
            No Active Seat Hold
          </h2>
          <p className="text-sm text-white/60 mb-8 max-w-md mx-auto leading-relaxed">
            Your temporary seat hold has expired or no seats were selected. Please choose your seats from the live seating map.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-white/90 transition-all shadow-2xl hover:scale-[1.02] cursor-pointer"
          >
            <span>Browse Events</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <Footer />
        </div>
      </div>
    );
  }

  const handleExpire = () => {
    setError('Your 10-minute seat hold has expired. Seats have been returned to the available pool.');
  };

  const handleConfirmBooking = async (e) => {
    if (e) e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      const payload = {
        hold_token: holdData.hold_token,
      };
      // Complete booking from held token
      const res = await api.post('/bookings', payload);
      navigate('/confirmation', { state: { booking: res.data } });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Booking confirmation could not be completed. Your seats may have timed out.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const eventTitle =
    eventDetails?.title || seatMapMeta?.event_title || 'Selected Live Experience';
  const venueName =
    seatMapMeta?.venue_name || eventDetails?.venue_name || 'Premier Auditorium';
  const eventBanner =
    eventDetails?.banner_url ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
  const eventType = eventDetails?.event_type || 'EVENT';

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 selection:text-white pb-24 overflow-x-hidden">
      {/* Subtle Atmospheric Event Blur in Background */}
      {eventBanner && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-15 blur-[90px] scale-110"
          style={{
            backgroundImage: `url(${eventBanner})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Dark Ambient Radial Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(30, 30, 45, 0.4) 0%, rgba(5, 5, 5, 0.9) 60%, #000000 100%)',
        }}
      />

      {/* Header Bar */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={`/shows/${holdData.show_id}/seats`}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors group cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1 font-mono">←</span>
            <span>Back to Seat Selection</span>
          </Link>
        </div>

        {/* Editorial Page Header */}
        <motion.section
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/80 border border-white/10 mb-4">
                <Lock className="w-3 h-3 text-white/80" />
                Step 2 of 2 • Guaranteed Reservation
              </span>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.05em] leading-[0.9] text-white">
                One last step. <br />
                <span className="italic text-white/80">Your night is almost here.</span>
              </h1>
            </div>

            {/* Hold Timer Widget */}
            <div className="flex flex-col items-start md:items-end">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                Seats Protected
              </div>
              <div className="liquid-glass rounded-2xl px-4 py-2 border border-white/15 shadow-xl flex items-center gap-3">
                <HoldTimer expiresAt={holdData.expires_at} onExpire={handleExpire} />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Inline Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-200 text-xs sm:text-sm flex items-center gap-3 shadow-2xl backdrop-blur-xl"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* 2-Column Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: Event Showcase, Seat Breakdown, and Customer Details */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8"
          >
            {/* 1. Event Showcase Card */}
            <div className="group rounded-3xl overflow-hidden liquid-glass border border-white/10 hover:border-white/20 shadow-2xl transition-all duration-500">
              <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-black">
                <img
                  src={eventBanner}
                  alt={eventTitle}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                <div className="absolute top-6 left-6 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/20">
                    {eventType}
                  </span>
                  {eventDetails?.city && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium text-white/80 bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-white/50" />
                      {eventDetails.city}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-white leading-tight mb-2">
                    {eventTitle}
                  </h2>
                  <p className="text-xs text-white/70 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
                    <span>{venueName}</span>
                  </p>
                </div>
              </div>

              {/* Show Meta Info */}
              <div className="p-6 sm:p-8 bg-white/[0.02] border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Date & Showtime</div>
                    <div className="font-semibold text-white">
                      Show #{holdData.show_id} • Guaranteed Reservation
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Ticket className="w-4 h-4 text-white/80" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/40">Total Seats</div>
                    <div className="font-semibold text-white">
                      {heldSeats.length} Reserved Pass{heldSeats.length > 1 ? 'es' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Selected Seats Breakdown */}
            <div className="rounded-3xl p-6 sm:p-8 liquid-glass border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest font-bold text-white/60 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-white/80" />
                  Your Held Seats
                </h3>
                <span className="text-xs text-white/40 font-mono">
                  {heldSeats.length} Selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {heldSeats.map((seat) => (
                  <div
                    key={seat.show_seat_id || `${seat.row_label}-${seat.seat_number}`}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-2.5 shadow-lg"
                  >
                    <span className="font-bold text-sm">
                      {seat.row_label}
                      {seat.seat_number}
                    </span>
                    <span className="h-3 w-px bg-white/20" />
                    <span className="text-[11px] text-white/70 font-normal">
                      {seat.category_name || 'Standard'}
                    </span>
                    <span className="text-[11px] text-white/90 font-mono font-bold">
                      {formatPrice(seat.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Customer Information */}
            <div className="rounded-3xl p-6 sm:p-8 liquid-glass border border-white/10 shadow-2xl">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white/60 mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-white/80" />
                Ticket Holder Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-semibold">
                    Full Name
                  </label>
                  <div className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs font-medium text-white/90 flex items-center gap-2.5">
                    <User className="w-4 h-4 text-white/40 shrink-0" />
                    <span>{user?.full_name || 'Registered Guest'}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/40 block mb-2 font-semibold">
                    Email Address
                  </label>
                  <div className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-xs font-medium text-white/90 flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-white/40 shrink-0" />
                    <span className="truncate">{user?.email || 'guest@ticketbooking.com'}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-white/40 mt-4 leading-relaxed">
                Your high-contrast QR entry passcards and booking confirmation will be stored in your Lumina Wallet and dispatched to your email address.
              </p>
            </div>
          </motion.div>

          {/* Right 5 Cols: Editorial Sticky Receipt / Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="rounded-3xl p-6 sm:p-8 liquid-glass border border-white/15 shadow-2xl sticky top-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-xs uppercase tracking-widest font-bold text-white/70">
                  Order Summary
                </h3>
                <span className="text-[10px] font-mono text-white/40 uppercase">
                  Hold #{holdData.hold_token.slice(0, 8)}
                </span>
              </div>

              {/* Itemized Line Items */}
              <div className="space-y-3 text-xs">
                {heldSeats.map((seat) => (
                  <div
                    key={seat.show_seat_id}
                    className="flex justify-between items-center text-white/80"
                  >
                    <span>
                      Seat {seat.row_label}
                      {seat.seat_number} ({seat.category_name})
                    </span>
                    <span className="font-mono font-medium text-white">
                      {formatPrice(seat.price)}
                    </span>
                  </div>
                ))}

                <div className="pt-3 border-t border-white/10 flex justify-between items-center text-white/60">
                  <span>Booking & Convenience Fee</span>
                  <span className="text-emerald-400 font-medium">₹0 (Complimentary)</span>
                </div>

                <div className="flex justify-between items-center text-white/60">
                  <span>GST & Municipal Entertainment Tax</span>
                  <span className="text-white/80 font-medium">Included</span>
                </div>
              </div>

              {/* Total Due in Large Typography */}
              <div className="pt-6 border-t border-white/15 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Total Amount</div>
                  <div className="text-3xl sm:text-4xl font-normal tracking-tight text-white mt-0.5">
                    {formatPrice(totalAmount)}
                  </div>
                </div>
                <span className="text-xs text-white/40 font-mono">INR</span>
              </div>

              {/* Confirm Booking CTA */}
              <button
                onClick={handleConfirmBooking}
                disabled={processing}
                className="w-full py-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-white/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer group"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    <span>Confirming Pass & Generating QR...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </>
                )}
              </button>

              {/* Trust Badge */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-white/40 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant Ticket Issuance & QR Admission Guaranteed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Editorial Liquid Glass Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mt-20">
        <Footer />
      </div>
    </div>
  );
}
