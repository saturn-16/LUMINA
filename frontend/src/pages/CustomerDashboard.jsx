import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Ticket, Clock, XCircle, AlertCircle, Sparkles, CheckCircle, RefreshCw, ArrowRight, UserCheck } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, waitlistsRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/waitlist'),
      ]);
      setBookings(bookingsRes.data);
      setWaitlists(waitlistsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Released seats will be automatically reallocated to the waitlist queue.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setMessage({ type: 'success', text: res.data.message });
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to cancel booking.' });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 pb-24 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Customer Portal</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Welcome back, {user?.full_name || 'Guest'}
            </h1>
          </div>

          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 rounded-xl liquid-glass border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5 self-start cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {message && (
          <div className={`mb-8 p-4 rounded-2xl border text-sm flex items-center gap-3 shadow-xl backdrop-blur-xl ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border-red-800 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Section 1: Active Waitlist Entries & Time-Limited Offers */}
        {waitlists.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Active Waitlists & Instant Queue Reallocations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitlists.map((wl) => (
                <div
                  key={wl.id}
                  className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl transition-all ${
                    wl.status === 'OFFERED'
                      ? 'liquid-glass border-amber-500/80 ring-2 ring-amber-500/30'
                      : 'liquid-glass border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Show #{wl.show_id}</div>
                      <div className="text-base font-black text-white mt-0.5">{wl.category_name} Tier</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      wl.status === 'OFFERED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {wl.status === 'OFFERED' ? '⚡ Seat Offered!' : `Queue Position #${wl.queue_position}`}
                    </span>
                  </div>

                  {wl.status === 'OFFERED' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-amber-300 mb-3">
                        A released seat has been offered to you! You have an active claim window to complete checkout.
                      </p>
                      <Link
                        to={`/waitlist/claim?token=${wl.offer_token}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all"
                      >
                        Claim Offered Seat Now <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Confirmed Bookings & QR Passes */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-blue-400" />
            My Bookings & QR Entry Passes
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-3xl liquid-glass border border-white/10 animate-pulse"></div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center liquid-glass rounded-3xl border border-white/10">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No active bookings yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">Browse movies and concerts to select your seats.</p>
              <Link
                to="/events"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg"
              >
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        Booking Ref: <strong className="text-slate-100">{b.booking_reference}</strong>
                      </div>
                      <div className="text-lg font-black text-white mt-1">
                        ${b.total_amount.toFixed(2)} • {b.tickets?.length || 0} Tickets
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {b.status}
                      </span>

                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {cancellingId === b.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual E-Tickets */}
                  <div className="mt-6 space-y-4">
                    {b.tickets?.map((t) => (
                      <TicketCard
                        key={t.id}
                        ticket={t}
                        bookingReference={b.booking_reference}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
