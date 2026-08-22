import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Sparkles, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function WaitlistClaim() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);

  const handleClaimOffer = async () => {
    if (!token) return;
    setClaiming(true);
    setError(null);

    try {
      const res = await api.post('/waitlist/claim', { offer_token: token });
      navigate('/confirmation', { state: { booking: res.data } });
    } catch (err) {
      setError(err.response?.data?.detail || 'This waitlist offer token has expired or is invalid.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="liquid-glass border border-white/10 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-6 shadow-xl">
            <Sparkles className="w-8 h-8" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-2">
            Claim Waitlist Seat
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            A previously held seat in your requested category became available and has been reserved for you.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleClaimOffer}
            disabled={claiming || !token}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {claiming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
                Creating Hold...
              </>
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link to="/events" className="inline-block text-xs font-semibold text-slate-400 hover:text-slate-200 mt-6">
            ← Browse other events
          </Link>
        </div>
      </div>

      <div className="relative z-10 py-6 text-center text-xs text-slate-600">
        Lumina Ticketing Engine • Automated FIFO Reallocation
      </div>
    </div>
  );
}
