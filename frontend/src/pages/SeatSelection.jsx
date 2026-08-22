import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { connectShowWebSocket } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/SeatMap';
import { ArrowLeft, Clock, ShieldCheck, AlertCircle, Sparkles, UserPlus, CheckCircle } from 'lucide-react';

export default function SeatSelection() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holding, setHolding] = useState(false);

  // Waitlist Modal
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedWaitlistCat, setSelectedWaitlistCat] = useState('');
  const [waitlistJoining, setWaitlistJoining] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(null);

  const fetchSeatMap = useCallback(async () => {
    try {
      const res = await api.get(`/shows/${showId}/seats`);
      setSeatMap(res.data);
      if (res.data.categories?.length > 0 && !selectedWaitlistCat) {
        setSelectedWaitlistCat(String(res.data.categories[0].id));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load seat layout.');
    } finally {
      setLoading(false);
    }
  }, [showId, selectedWaitlistCat]);

  useEffect(() => {
    fetchSeatMap();

    // Subscribe to real-time seat status updates via WebSockets
    const socket = connectShowWebSocket(
      showId,
      (message) => {
        // Refresh seat map on real-time broadcast
        fetchSeatMap();
      },
      (err) => {
        // Fallback polling if websocket fails
      }
    );

    return () => {
      socket.close();
    };
  }, [showId, fetchSeatMap]);

  const handleToggleSeat = (seat) => {
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.show_seat_id === seat.show_seat_id);
      if (exists) {
        return prev.filter((s) => s.show_seat_id !== seat.show_seat_id);
      } else {
        if (prev.length >= 8) {
          alert('You can select a maximum of 8 seats per order.');
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handleProceedToHold = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeats.length === 0) return;

    setHolding(true);
    setError(null);
    try {
      const payload = {
        show_id: parseInt(showId, 10),
        show_seat_ids: selectedSeats.map((s) => s.show_seat_id),
      };
      const res = await api.post('/holds', payload);
      // Navigate to checkout with hold data
      navigate('/checkout', { state: { holdData: res.data, seatMapMeta: seatMap } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place temporary hold. Please re-select seats.');
      // Refresh map to reflect taken seats
      fetchSeatMap();
      setSelectedSeats([]);
    } finally {
      setHolding(false);
    }
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    setWaitlistJoining(true);
    try {
      const res = await api.post('/waitlist/join', {
        show_id: parseInt(showId, 10),
        category_id: parseInt(selectedWaitlistCat, 10),
      });
      setWaitlistSuccess('Successfully joined the waitlist! You will be emailed if a seat is released.');
      setTimeout(() => {
        setShowWaitlistModal(false);
        setWaitlistSuccess(null);
      }, 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to join waitlist.');
    } finally {
      setWaitlistJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-slate-400 mt-4 text-sm font-medium">Loading live seat grid...</p>
      </div>
    );
  }

  const isConcert = seatMap?.event_title?.toLowerCase().includes('tour') || seatMap?.event_title?.toLowerCase().includes('symphony');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-36">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to={`/events/${seatMap?.event_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Showtimes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {seatMap?.event_title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {seatMap?.venue_name} • Real-Time Seating
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWaitlistModal(true)}
            className="px-4 py-2 rounded-xl bg-purple-950/60 border border-purple-800/80 text-purple-300 hover:bg-purple-900/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-purple-400" />
            Join Waitlist
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-center gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Seat Map */}
      <div className="bg-slate-900/70 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <SeatMap
          seatMapData={seatMap}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          isConcert={isConcert}
        />
      </div>

      {/* Fixed Bottom Action Bar */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl p-4 sm:p-6 transition-all duration-300">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div>
                <div className="text-xs text-slate-400 font-medium">Selected Seats ({selectedSeats.length})</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.show_seat_id}
                      className="px-2 py-0.5 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-bold"
                    >
                      {s.row_label}{s.seat_number} (${s.price.toFixed(0)})
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

              <div>
                <div className="text-xs text-slate-400 font-medium">Total Amount</div>
                <div className="text-xl font-black text-white">${totalPrice.toFixed(2)}</div>
              </div>
            </div>

            <button
              onClick={handleProceedToHold}
              disabled={holding}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {holding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Locking Seats (SELECT FOR UPDATE)...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Hold Seats & Checkout (10m TTL) →
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              Join Category Waitlist
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              When tickets are cancelled, released seats are automatically offered to the next customer in the FIFO waitlist queue.
            </p>

            {waitlistSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{waitlistSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Target Seat Category
                  </label>
                  <select
                    value={selectedWaitlistCat}
                    onChange={(e) => setSelectedWaitlistCat(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                  >
                    {seatMap?.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} (Tier {cat.tier_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowWaitlistModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={waitlistJoining}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                  >
                    {waitlistJoining ? 'Joining Queue...' : 'Confirm Waitlist Spot'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
