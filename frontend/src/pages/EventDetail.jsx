import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Clock, MapPin, Ticket, Film, Music, ArrowLeft, AlertCircle } from 'lucide-react';

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEventDetails() {
      try {
        setLoading(true);
        const res = await api.get(`/events/${eventId}`);
        setEvent(res.data);
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    }
    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-200">{error || 'Event not found'}</h2>
        <Link to="/" className="inline-block mt-4 text-sm font-semibold text-blue-400 hover:underline">
          ← Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </Link>

      {/* Hero Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl mb-12">
        <div className="md:col-span-1 overflow-hidden rounded-2xl bg-slate-950 aspect-[3/4] max-h-96">
          <img
            src={event.banner_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                event.event_type === 'MOVIE'
                  ? 'bg-blue-900/80 text-blue-200 border border-blue-400/30'
                  : 'bg-purple-900/80 text-purple-200 border border-purple-400/30'
              }`}>
                {event.event_type}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {event.duration_minutes} Minutes
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              {event.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
              {event.description}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-slate-200">Organised by:</span> {event.organiser?.full_name || 'Apex Events'}
            </div>
            <div>
              <span className="font-semibold text-slate-200">Scheduled Shows:</span> {event.shows?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Venue Selection */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Select Showtime & Venue
        </h2>

        {(!event.shows || event.shows.length === 0) ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
            No upcoming showtimes scheduled for this event yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.shows.map((show) => {
              const startDate = new Date(show.start_time).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const startTime = new Date(show.start_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={show.id}
                  className="bg-slate-900 rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">{startDate}</div>
                        <div className="text-2xl font-black text-white mt-0.5">{startTime}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        show.is_sold_out
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {show.is_sold_out ? 'Sold Out' : `${show.available_seats_count} Seats Available`}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-xs text-slate-300 mb-4">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-100">{show.venue_name}</div>
                        <div className="text-slate-400">{show.venue_address}, {show.venue_city}</div>
                      </div>
                    </div>

                    {/* Pricing Tiers */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {show.pricing?.map((pr) => (
                        <span
                          key={pr.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
                        >
                          {pr.category?.name}: <strong className="text-slate-100">${pr.price.toFixed(2)}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/shows/${show.id}/seats`}
                    className={`w-full py-3 rounded-xl font-bold text-sm text-center transition-all ${
                      show.is_sold_out
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                    }`}
                  >
                    {show.is_sold_out ? 'Join Sold-Out Waitlist →' : 'Select Seats →'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
