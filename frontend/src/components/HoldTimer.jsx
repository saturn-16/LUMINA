import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function HoldTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateRemaining = () => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      return diff;
    };

    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = timeLeft > 0 && timeLeft < 120; // under 2 minutes
  const isExpired = timeLeft <= 0;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-all ${
        isExpired
          ? 'bg-red-950/60 border-red-800 text-red-400'
          : isCritical
          ? 'bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse shadow-lg shadow-amber-500/20'
          : 'bg-blue-950/60 border-blue-800 text-blue-300'
      }`}
    >
      {isCritical ? (
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      ) : (
        <Clock className="w-4 h-4 text-blue-400" />
      )}
      <span>{isExpired ? 'Hold Expired' : formatted}</span>
    </div>
  );
}
