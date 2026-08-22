import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export default function WaitlistClaim() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { state: { from: `/waitlist/claim?token=${token}` } });
    }
  }, [authLoading, isAuthenticated, token, navigate]);

  const handleClaim = async () => {
    if (!token) return;
    setClaiming(true);
    setError(null);

    try {
      const res = await api.post('/waitlist/claim', {
        offer_token: token,
      });
      navigate('/confirmation', { state: { booking: res.data } });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to claim offer. It may have expired or been reallocated.'
      );
    } finally {
      setClaiming(false);
    }
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Invalid Offer Link</h2>
        <p className="text-sm text-slate-400 mb-6">No offer token was provided in the link.</p>
        <Link to="/" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm">
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/10">
          <Sparkles className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Exclusive Time-Limited Offer
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-3">
          Claim Your Released Seat
        </h1>
        <p className="text-sm text-slate-300 mb-8 leading-relaxed">
          A seat in your requested category has opened up from a cancellation. Complete your booking before the time window expires!
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-sm flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-200">Offer Expired or Invalid</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-4 rounded-xl font-black text-sm text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-xl shadow-amber-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {claiming ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
              Issuing Ticket & QR Code...
            </>
          ) : (
            <>
              Confirm & Book This Seat Now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
