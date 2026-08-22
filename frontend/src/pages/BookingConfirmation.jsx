import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
import { CheckCircle, Mail, ArrowRight, Home } from 'lucide-react';

export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  if (!booking) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Celebration */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10 animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Booking Confirmed!</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
          Your reservation is locked in. We have generated your entry QR code and emailed your ticket confirmation.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <Mail className="w-4 h-4 text-blue-400" />
          <span>Ticket QR dispatched to your email</span>
        </div>
      </div>

      {/* Ticket Card Component */}
      <div className="mb-10">
        <TicketCard booking={booking} />
      </div>

      {/* Navigation Options */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/dashboard"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
        >
          View in My Tickets Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm border border-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Explore More Shows
        </Link>
      </div>
    </div>
  );
}
