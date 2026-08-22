import React, { useState } from 'react';
import { Calendar, MapPin, Ticket, QrCode, Printer, AlertCircle, XCircle } from 'lucide-react';

export default function TicketCard({ booking, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!booking) return null;

  const showDate = new Date(booking.show_start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const showTime = new Date(booking.show_start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    setCancelling(true);
    try {
      await onCancel(booking.id);
      setShowConfirm(false);
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className={`relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border shadow-2xl transition-all ${
      isCancelled
        ? 'bg-slate-900/60 border-red-900/50 opacity-80'
        : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Top Banner */}
      <div className={`p-6 text-white flex justify-between items-start ${
        isCancelled ? 'bg-red-950/80' : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
              {booking.event_type}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCancelled ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {booking.status}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">{booking.event_title}</h3>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase font-semibold">Booking Ref</div>
          <div className="font-mono text-sm font-bold text-blue-300">{booking.booking_reference}</div>
        </div>
      </div>

      {/* Ticket Details & Perforation */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Event & Venue Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-400">Date & Time</div>
              <div className="text-sm font-semibold text-slate-100">{showDate} at {showTime}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-400">Venue</div>
              <div className="text-sm font-semibold text-slate-100">{booking.venue_name}</div>
              <div className="text-xs text-slate-400">{booking.venue_city}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Ticket className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-400 mb-1.5">Seats Booked</div>
              <div className="flex flex-wrap gap-1.5">
                {booking.seats?.map((seat) => (
                  <span
                    key={seat.id || seat.show_seat_id}
                    className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
                  >
                    {seat.row_label}{seat.seat_number} <span className="text-slate-400 text-[10px]">({seat.category_name})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Paid</div>
              <div className="text-lg font-bold text-emerald-400">${booking.total_amount?.toFixed(2)}</div>
            </div>
            {booking.customer_name && (
              <div className="text-right">
                <div className="text-xs text-slate-400">Ticket Holder</div>
                <div className="text-xs font-medium text-slate-300">{booking.customer_name}</div>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
          {booking.qr_code_data ? (
            <img
              src={booking.qr_code_data}
              alt={`QR code for ${booking.booking_reference}`}
              className="w-36 h-36 rounded-lg bg-white p-1.5 shadow-md"
            />
          ) : (
            <div className="w-36 h-36 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500">
              <QrCode className="w-12 h-12" />
            </div>
          )}
          <span className="text-[11px] font-mono text-slate-400 mt-2 font-medium">
            Scan at venue gate
          </span>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <Printer className="w-4 h-4 text-blue-400" />
          Print / Save Ticket
        </button>

        {!isCancelled && onCancel && (
          <div>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
              >
                Cancel Booking
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Release seats to waitlist?</span>
                <button
                  onClick={handleCancelClick}
                  disabled={cancelling}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
