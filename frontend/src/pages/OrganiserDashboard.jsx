import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DollarSign, Ticket, Users, Plus, Calendar, Film, Music, MapPin, X, TrendingUp } from 'lucide-react';

export default function OrganiserDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showShowModal, setShowShowModal] = useState(false);

  // Event Form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'MOVIE',
    banner_url: '',
    duration_minutes: 120,
  });

  // Show Form
  const [showForm, setShowForm] = useState({
    event_id: '',
    venue_id: '',
    start_time: '',
    end_time: '',
    pricing: {},
  });

  const [selectedVenueMeta, setSelectedVenueMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrganiserData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, eventsRes, venuesRes] = await Promise.all([
        api.get('/organiser/analytics'),
        api.get('/organiser/events'),
        api.get('/admin/venues'),
      ]);
      setAnalytics(analyticsRes.data);
      setEvents(eventsRes.data);
      setVenues(venuesRes.data);
    } catch (err) {
      console.error('Failed to load organiser data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganiserData();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/organiser/events', {
        ...eventForm,
        duration_minutes: parseInt(eventForm.duration_minutes, 10),
      });
      setShowEventModal(false);
      setEventForm({
        title: '',
        description: '',
        event_type: 'MOVIE',
        banner_url: '',
        duration_minutes: 120,
      });
      fetchOrganiserData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVenueChange = (venueId) => {
    const venue = venues.find((v) => v.id === parseInt(venueId, 10));
    setSelectedVenueMeta(venue || null);
    setShowForm((prev) => ({
      ...prev,
      venue_id: venueId,
      pricing: venue
        ? venue.categories.reduce((acc, cat) => ({ ...acc, [cat.id]: 25.0 }), {})
        : {},
    }));
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const pricingList = Object.keys(showForm.pricing).map((catId) => ({
        category_id: parseInt(catId, 10),
        price: parseFloat(showForm.pricing[catId]),
      }));

      await api.post('/organiser/shows', {
        event_id: parseInt(showForm.event_id, 10),
        venue_id: parseInt(showForm.venue_id, 10),
        start_time: new Date(showForm.start_time).toISOString(),
        end_time: new Date(showForm.end_time).toISOString(),
        pricing: pricingList,
      });

      setShowShowModal(false);
      setShowForm({
        event_id: '',
        venue_id: '',
        start_time: '',
        end_time: '',
        pricing: {},
      });
      fetchOrganiserData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule show.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Organiser Management</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
            Organiser Studio & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create movies/concerts, schedule showtimes with per-tier pricing, and track live ticket sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
          <button
            onClick={() => {
              if (events.length > 0) {
                setShowForm((prev) => ({ ...prev, event_id: String(events[0].id) }));
              }
              if (venues.length > 0) {
                handleVenueChange(String(venues[0].id));
              }
              setShowShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            Schedule Show
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              ${analytics?.total_revenue?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed Bookings</div>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 mt-1">
              {analytics?.total_bookings || 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets Sold</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
              {analytics?.total_tickets_sold || 0}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Events & Shows Breakdown */}
      <div className="space-y-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Events & Showtimes Breakdown
        </h2>

        {(!analytics?.events || analytics.events.length === 0) ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 text-slate-400">
            No events created yet. Click "Create Event" to get started.
          </div>
        ) : (
          analytics.events.map((evt) => (
            <div key={evt.event_id} className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                      {evt.event_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{evt.title}</h3>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Revenue</div>
                    <div className="font-bold text-emerald-400">${evt.total_revenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Tickets Sold</div>
                    <div className="font-bold text-purple-400">{evt.tickets_sold}</div>
                  </div>
                </div>
              </div>

              {/* Showtimes Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-3 font-semibold">Showtime</th>
                      <th className="pb-3 font-semibold">Venue</th>
                      <th className="pb-3 font-semibold">Occupancy Rate</th>
                      <th className="pb-3 font-semibold">Tickets Sold</th>
                      <th className="pb-3 font-semibold">Show Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {evt.shows?.map((s) => (
                      <tr key={s.show_id} className="text-slate-200">
                        <td className="py-3 font-medium">
                          {new Date(s.start_time).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">{s.venue_name}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, s.occupancy_rate)}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-300">{s.occupancy_rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 font-bold">{s.tickets_sold} / {s.total_seats}</td>
                        <td className="py-3 font-bold text-emerald-400">${s.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Create New Event</h3>
              <button onClick={() => setShowEventModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dune Part Two 70mm IMAX"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="MOVIE">Movie</option>
                    <option value="CONCERT">Concert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    value={eventForm.duration_minutes}
                    onChange={(e) => setEventForm({ ...eventForm, duration_minutes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={eventForm.banner_url}
                  onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Synopsis</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {showShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Schedule Show & Tier Pricing</h3>
              <button onClick={() => setShowShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShow} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Event</label>
                <select
                  value={showForm.event_id}
                  onChange={(e) => setShowForm({ ...showForm, event_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Venue</label>
                <select
                  value={showForm.venue_id}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={showForm.start_time}
                    onChange={(e) => setShowForm({ ...showForm, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={showForm.end_time}
                    onChange={(e) => setShowForm({ ...showForm, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tier Pricing Configuration */}
              {selectedVenueMeta && (
                <div className="pt-3 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Per-Category Seat Pricing ($)
                  </label>
                  <div className="space-y-2.5">
                    {selectedVenueMeta.categories?.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-slate-300">
                          {cat.name} (Tier {cat.tier_level}):
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          required
                          value={showForm.pricing[cat.id] || ''}
                          onChange={(e) =>
                            setShowForm({
                              ...showForm,
                              pricing: { ...showForm.pricing, [cat.id]: e.target.value },
                            })
                          }
                          className="w-28 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-right font-mono font-bold text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Generating Seats...' : 'Schedule & Build Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
