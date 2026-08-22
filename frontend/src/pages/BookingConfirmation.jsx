import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { CheckCircle2, ArrowRight, LayoutDashboard, Mail } from 'lucide-react';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return (
      <div className="relative min-h-screen text-slate-100 flex items-center justify-center p-4">
        <GalaxyBackground />
        <div className="relative z-10 max-w-md w-full liquid-glass rounded-3xl p-8 text-center border border-white/10 shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-bold text-slate-200">No Booking Found</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            You can view your confirmed bookings in your customer dashboard.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg"
          >
            Go to My Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-slate-100 pb-20 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4 shadow-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 flex items-center justify-center gap-1.5">
            <Mail className="w-4 h-4 text-slate-500" />
            Your QR e-tickets and receipt have been generated.
          </p>
        </div>

        {/* Ticket Passcards */}
        <div className="space-y-6 mb-10">
          {booking.tickets?.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              bookingReference={booking.booking_reference}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl liquid-glass border border-white/20 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            View in My Tickets Portal
          </Link>

          <Link
            to="/events"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all"
          >
            Browse More Shows
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
