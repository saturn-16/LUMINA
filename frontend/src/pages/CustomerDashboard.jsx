import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TicketCard from '../components/TicketCard';
import HoldTimer from '../components/HoldTimer';
import { Ticket, Clock, CheckCircle, AlertCircle, Sparkles, ArrowRight, XCircle } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'waitlist'
  const [bookings, setBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, waitlistRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/waitlist'),
      ]);
      setBookings(bookingsRes.data);
      setWaitlistEntries(waitlistRes.data);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`);
      setActionMessage({
        type: 'success',
        text: 'Booking cancelled. Your released seats were automatically offered to the waitlist queue!',
      });
      fetchDashboardData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to cancel booking.',
      });
    }
  };

  const activeOffersCount = waitlistEntries.filter((e) => e.active_offer).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Customer Portal</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your movie & concert tickets, view QR codes, and monitor waitlist offers.
          </p>
        </div>

        <Link
          to="/"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all text-center"
        >
          + Explore Shows
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl mb-8 flex items-center justify-between gap-3 text-sm shadow-xl ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
            : 'bg-red-950/80 border border-red-800 text-red-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-8">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          My Tickets ({bookings.filter(b => b.status === 'CONFIRMED').length})
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'waitlist'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Waitlist & Offers ({waitlistEntries.length})
          {activeOffersCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1"></span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : activeTab === 'tickets' ? (
        /* My Tickets Tab */
        <div>
          {bookings.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
              <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-300">No Tickets Yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-6">
                You have not booked any events yet. Explore upcoming movies and concerts to select your seats!
              </p>
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30"
              >
                Browse Events →
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {bookings.map((booking) => (
                <TicketCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Waitlist Tab */
        <div>
          {waitlistEntries.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-300">No Active Waitlist Entries</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                When a high-demand show sells out, you can join its waitlist directly from the seat selection map.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {waitlistEntries.map((entry) => {
                const isOffered = entry.status === 'OFFERED' && entry.active_offer;
                const offer = entry.active_offer;

                return (
                  <div
                    key={entry.id}
                    className={`p-6 rounded-3xl border transition-all shadow-xl flex flex-col justify-between ${
                      isOffered
                        ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-600/60 shadow-amber-500/10'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isOffered
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                            : entry.status === 'WAITING'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isOffered ? 'Seat Offer Ready!' : entry.status}
                        </span>

                        <span className="text-[11px] text-slate-500">
                          Joined: {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white">{entry.event_title}</h3>
                      <div className="text-xs text-slate-400 mt-1">{entry.venue_name}</div>
                      <div className="text-xs text-purple-400 font-semibold mt-2">
                        Target Tier: {entry.category_name}
                      </div>

                      {/* Active Offer Details */}
                      {isOffered && offer && (
                        <div className="mt-5 p-4 rounded-2xl bg-amber-950/60 border border-amber-600/50 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-200 font-bold">Allocated Seat</span>
                            <span className="font-mono text-white font-bold">
                              {offer.row_label}{offer.seat_number} (${offer.price.toFixed(2)})
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-800/40">
                            <span className="text-amber-300 font-medium">Time Remaining to Claim</span>
                            <HoldTimer expiresAt={offer.expires_at} onExpire={fetchDashboardData} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800">
                      {isOffered && offer ? (
                        <Link
                          to={`/waitlist/claim?token=${offer.offer_token}`}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-2 text-center"
                        >
                          Claim & Book Allocated Seat Now →
                        </Link>
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center justify-between">
                          <span>FIFO Queue Active</span>
                          <span>Auto-notifies on cancellation</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
