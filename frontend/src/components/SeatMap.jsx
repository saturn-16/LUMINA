import React, { useState } from 'react';
import { Lock, Check, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export default function SeatMap({
  seatMapData,
  selectedSeats,
  onToggleSeat,
  isConcert = false,
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null);

  if (!seatMapData || !seatMapData.seats) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading seat map...
      </div>
    );
  }

  const { total_rows, total_cols, categories, seats } = seatMapData;

  // Group seats by row_label
  const seatsByRow = {};
  seats.forEach((seat) => {
    if (!seatsByRow[seat.row_label]) {
      seatsByRow[seat.row_label] = [];
    }
    seatsByRow[seat.row_label].push(seat);
  });

  // Sort seats inside each row by seat_number
  Object.keys(seatsByRow).forEach((row) => {
    seatsByRow[row].sort((a, b) => a.seat_number - b.seat_number);
  });

  const rowKeys = Object.keys(seatsByRow);

  const getCategoryColor = (catName) => {
    const lower = catName.toLowerCase();
    if (lower.includes('vip')) return { border: 'border-amber-400', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' };
    if (lower.includes('prem')) return { border: 'border-purple-400', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' };
    return { border: 'border-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto select-none">
      {/* Screen / Stage Orientation Visual */}
      <div className="w-full mb-10 flex flex-col items-center">
        <div className="relative w-3/4 max-w-lg h-3 bg-gradient-to-b from-blue-500/40 to-transparent rounded-t-full shadow-[0_-8px_25px_rgba(59,130,246,0.3)]"></div>
        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
          {isConcert ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              FRONT STAGE / PERFORMANCE AREA
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
              ALL EYES THIS WAY — CINEMA SCREEN
            </>
          )}
        </div>
      </div>

      {/* Interactive Seat Grid */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center">
        <div className="inline-flex flex-col gap-2.5 min-w-fit px-4">
          {rowKeys.map((rowLabel) => (
            <div key={rowLabel} className="flex items-center gap-3">
              {/* Row Label Left */}
              <span className="w-6 text-center text-xs font-bold text-slate-400">
                {rowLabel}
              </span>

              {/* Row Seats */}
              <div className="flex items-center gap-2">
                {seatsByRow[rowLabel].map((seat) => {
                  const isSelected = selectedSeats.some(
                    (s) => s.show_seat_id === seat.show_seat_id
                  );
                  const isAvailable = seat.status === 'AVAILABLE';
                  const isHeld = seat.status === 'HELD';
                  const isBooked = seat.status === 'BOOKED';
                  const isReservedWaitlist = seat.status === 'RESERVED_FOR_WAITLIST';
                  const isHeldByMe = seat.held_by_current_user;

                  const colors = getCategoryColor(seat.category_name);

                  let seatStyle = 'cursor-pointer transition-all duration-150 transform ';
                  let content = seat.seat_number;

                  if (isSelected) {
                    seatStyle += 'bg-blue-600 border-2 border-blue-400 text-white font-bold scale-105 shadow-md shadow-blue-500/30';
                    content = <Check className="w-3.5 h-3.5 stroke-[3]" />;
                  } else if (isHeldByMe) {
                    seatStyle += 'bg-blue-700/80 border-2 border-blue-400 text-white animate-pulse';
                    content = <Clock className="w-3 h-3" />;
                  } else if (isHeld) {
                    seatStyle += 'bg-amber-950/60 border border-amber-600/60 text-amber-400/80 cursor-not-allowed';
                    content = <Clock className="w-3 h-3" />;
                  } else if (isBooked) {
                    seatStyle += 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50';
                    content = '×';
                  } else if (isReservedWaitlist) {
                    seatStyle += 'bg-purple-950/60 border border-purple-600/60 text-purple-400/80 cursor-not-allowed';
                    content = <Lock className="w-3 h-3" />;
                  } else {
                    // Available
                    seatStyle += `bg-slate-900 border-2 ${colors.border} ${colors.text} hover:scale-110 hover:bg-slate-800 shadow-sm`;
                  }

                  return (
                    <div
                      key={seat.show_seat_id}
                      className="relative"
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                    >
                      <button
                        type="button"
                        onClick={() => isAvailable && onToggleSeat(seat)}
                        disabled={!isAvailable}
                        aria-label={`Seat ${seat.row_label}${seat.seat_number}, ${seat.category_name}, $${seat.price}`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-semibold ${seatStyle}`}
                      >
                        {content}
                      </button>

                      {/* Tooltip on Hover */}
                      {hoveredSeat?.show_seat_id === seat.show_seat_id && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-30 pointer-events-none w-36 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-center text-xs">
                          <div className="font-bold text-white">
                            Seat {seat.row_label}{seat.seat_number}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {seat.category_name}
                          </div>
                          <div className="font-bold text-blue-400 mt-0.5">
                            ${seat.price.toFixed(2)}
                          </div>
                          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] uppercase font-semibold">
                            {isAvailable && <span className="text-emerald-400">Available</span>}
                            {isHeld && <span className="text-amber-400">Held by Buyer</span>}
                            {isBooked && <span className="text-slate-500">Booked</span>}
                            {isReservedWaitlist && <span className="text-purple-400">Waitlist Hold</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="w-6 text-center text-xs font-bold text-slate-400">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Seat Legend */}
      <div className="mt-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 border-2 border-blue-400"></div>
          <span className="text-slate-300">Standard ($)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 border-2 border-purple-400"></div>
          <span className="text-slate-300">Premium ($$)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 border-2 border-amber-400"></div>
          <span className="text-slate-300">VIP Tier ($$$)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-600 border border-blue-400 flex items-center justify-center text-white font-bold">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-slate-300">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-950/60 border border-amber-600 flex items-center justify-center text-amber-400">
            <Clock className="w-3 h-3" />
          </div>
          <span className="text-slate-300">Held (10m TTL)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
            ×
          </div>
          <span className="text-slate-300">Booked</span>
        </div>
      </div>
    </div>
  );
}
