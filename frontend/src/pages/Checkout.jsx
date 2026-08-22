import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import HoldTimer from '../components/HoldTimer';
import { ShieldCheck, Ticket, CreditCard, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const holdData = location.state?.holdData;
  const seatMapMeta = location.state?.seatMapMeta;

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  if (!holdData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Seat Hold Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          Your hold session may have expired or was not initialized. Please select your seats.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  const handleHoldExpire = () => {
    setIsExpired(true);
    setError('Your 10-minute seat hold has expired. The seats have been released back to availability.');
  };

  const handleConfirmBooking = async () => {
    if (isExpired) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await api.post('/bookings', {
        hold_token: holdData.hold_token,
      });
      // Navigate to confirmation page
      navigate('/confirmation', { state: { booking: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete booking. Hold may have expired.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReleaseHold = async () => {
    try {
      await api.post('/holds/release', { hold_token: holdData.hold_token });
    } catch (e) {
      // Ignore
    }
    navigate(`/shows/${holdData.show_id}/seats`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
        onClick={handleReleaseHold}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel & Release Held Seats
      </button>

      {/* Top Banner with Hold Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl mb-8 shadow-xl">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Checkout Session</span>
          <h1 className="text-2xl font-black text-white mt-0.5">Review & Confirm Tickets</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-medium text-slate-400">Seats Reserved For</div>
          </div>
          <HoldTimer expiresAt={holdData.expires_at} onExpire={handleHoldExpire} />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-sm mb-6 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-red-200">Checkout Notice</div>
            <div>{error}</div>
            {isExpired && (
              <Link
                to={`/shows/${holdData.show_id}/seats`}
                className="inline-block mt-2 text-xs font-bold text-red-300 underline"
              >
                Re-select seats on seat map →
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Customer Info & Payment Note */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Ticket Holder Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-200">
                  {user?.full_name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email for QR Ticket</label>
                <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-semibold text-slate-200">
                  {user?.email}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Your QR tickets will be generated server-side and dispatched immediately to this email.
            </p>
          </div>

          {/* Payment Method Details */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment Processing
            </h3>
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/50 text-xs text-blue-200 leading-relaxed flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span>
                Demonstration checkout enabled. Click confirm below to complete the transaction and issue your entry QR tickets.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl h-fit flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4">Order Summary</h3>

            <div className="divide-y divide-slate-800 mb-6">
              {holdData.seats?.map((seat) => (
                <div key={seat.show_seat_id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold text-slate-200">Seat {seat.row_label}{seat.seat_number}</div>
                    <div className="text-xs text-slate-400">{seat.category_name}</div>
                  </div>
                  <div className="font-mono font-bold text-slate-100">${seat.price.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 mb-6 text-sm">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal</span>
                <span>${holdData.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Booking Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                <span>Total Due</span>
                <span className="text-emerald-400">${holdData.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={processing || isExpired}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Generating QR Ticket...
              </>
            ) : isExpired ? (
              'Hold Expired'
            ) : (
              'Confirm & Book Tickets →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
