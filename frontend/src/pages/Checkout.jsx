import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import HoldTimer from '../components/HoldTimer';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { ShieldCheck, CreditCard, Ticket, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();

  const holdData = location.state?.holdData;
  const seatMapMeta = location.state?.seatMapMeta;

  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  if (!holdData) {
    return (
      <div className="relative min-h-screen text-slate-100 flex items-center justify-center p-4">
        <GalaxyBackground />
        <div className="relative z-10 max-w-md w-full liquid-glass rounded-3xl p-8 text-center border border-white/10 shadow-2xl backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-200">No Active Seat Hold</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            Your session may have expired or no seats were held. Please select seats from the live map.
          </p>
          <Link
            to="/events"
            className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-lg"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const handleExpire = () => {
    setError('Your 10-minute seat hold expired. Seats have been released back to the pool.');
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      const payload = {
        hold_token: holdData.hold_token,
        payment_method: paymentMethod,
      };
      const res = await api.post('/bookings/confirm', payload);
      navigate('/confirmation', { state: { booking: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment confirmation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 pb-16 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link
          to={`/shows/${holdData.show_id}/seats`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Seat Selection
        </Link>

        {/* Hold Countdown Banner */}
        <div className="mb-8">
          <HoldTimer expiresAt={holdData.expires_at} onExpire={handleExpire} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-center gap-3 shadow-lg backdrop-blur-md">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Payment & Guest Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Payment Method */}
            <div className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Payment Method
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-blue-600/20 border-blue-500/80 text-white'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-sm">Credit / Debit Card</div>
                  <div className="text-xs text-slate-400 mt-1">Instant confirmation</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'bg-blue-600/20 border-blue-500/80 text-white'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-sm">UPI / QR Pay</div>
                  <div className="text-xs text-slate-400 mt-1">GooglePay, PhonePe, Paytm</div>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-xs text-slate-300 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Demo Sandbox Mode active: Payments are simulated with mock transaction processing.
                </span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={processing}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base shadow-2xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating QR Tickets & Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm & Pay ${holdData.total_price.toFixed(2)}
                </>
              )}
            </button>
          </div>

          {/* Right Column: Order Summary */}
          <div className="md:col-span-1">
            <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-2xl backdrop-blur-xl sticky top-6">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-blue-400" />
                Order Summary
              </h3>

              <div className="space-y-3 pb-4 border-b border-white/10 text-xs">
                <div className="text-slate-400 font-medium">Held Seats:</div>
                <div className="flex flex-wrap gap-1.5">
                  {holdData.held_seats?.map((s) => (
                    <span
                      key={s.show_seat_id}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-200 font-bold"
                    >
                      {s.row_label}{s.seat_number}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({holdData.held_seats?.length} seats)</span>
                  <span className="text-slate-200 font-semibold">${holdData.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Convenience Fee</span>
                  <span className="text-emerald-400 font-semibold">$0.00</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between text-base font-black text-white">
                  <span>Total Due</span>
                  <span>${holdData.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
