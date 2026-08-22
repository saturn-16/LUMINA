import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
} from 'lucide-react';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  const formatPrice = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (!booking) {
    return (
      <div className="relative min-h-screen bg-[#050505] text-white flex flex-col justify-between p-4 font-sans">
        <div className="max-w-7xl mx-auto w-full">
          <Navbar />
        </div>

        <div className="relative z-10 max-w-lg mx-auto w-full text-center py-20">
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
        </div>

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
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-2xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-2">
            Reservation Confirmed & Synced
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] text-white leading-tight mb-3">
            You're all set.
          </h1>

          <p className="text-xs sm:text-sm text-white/60 max-w-md mx-auto flex items-center justify-center gap-2">
            <Mail className="w-3.5 h-3.5 text-white/40" />
            <span>Digital passcard dispatched & synced to your personal wallet.</span>
          </p>
        </div>

        {/* Digital Boarding Passcard */}
        <div className="rounded-3xl overflow-hidden liquid-glass border border-white/15 shadow-2xl mb-10">
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
                    Reserved Seats ({booking.seats?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {booking.seats?.map((seat) => (
                      <span
                        key={seat.id || seat.show_seat_id}
                        className="px-3 py-1 rounded-xl bg-white/15 border border-white/20 text-xs font-semibold text-white"
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
                  <div className="text-lg font-bold font-mono text-white">
                    {formatPrice(booking.total_amount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Gate QR Scanner */}
            <div className="md:col-span-4 p-6 sm:p-8 bg-black/90 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-white/10">
              <div className="p-3 bg-white rounded-2xl shadow-2xl mb-3">
                {booking.qr_code_data ? (
                  <img
                    src={booking.qr_code_data}
                    alt={`QR code for ${booking.booking_reference}`}
                    className="w-36 h-36 object-contain"
                  />
                ) : (
                  <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-800">
                    <QrCode className="w-14 h-14" />
                  </div>
                )}
              </div>

              <div className="text-xs font-mono font-bold text-white tracking-wider mb-1">
                {booking.booking_reference}
              </div>

              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                Official Venue Admission Pass
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>View in My Tickets Wallet</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full liquid-glass border border-white/20 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Discover More Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Editorial Liquid Glass Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mt-20">
        <Footer />
      </div>
    </div>
  );
}
