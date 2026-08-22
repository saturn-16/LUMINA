import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';
import { Film, Music, PlusCircle, DollarSign, Users, Calendar, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrganiserDashboard() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Form States
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'MOVIE',
    duration_minutes: 120,
    banner_url: '',
  });

  const [scheduleForm, setScheduleForm] = useState({
    venue_id: '',
    start_time: '',
    tier_prices: {}, // e.g. { category_id: price }
  });

  const [selectedVenueMeta, setSelectedVenueMeta] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchOrganiserData = async () => {
    try {
      setLoading(true);
      const [eventsRes, venuesRes] = await Promise.all([
        api.get('/organiser/events'),
        api.get('/venues'),
      ]);
      setEvents(eventsRes.data);
      setVenues(venuesRes.data);
      if (venuesRes.data.length > 0) {
        setScheduleForm((prev) => ({ ...prev, venue_id: String(venuesRes.data[0].id) }));
        setSelectedVenueMeta(venuesRes.data[0]);
      }
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
    try {
      await api.post('/organiser/events', {
        ...eventForm,
        duration_minutes: parseInt(eventForm.duration_minutes, 10),
      });
      setShowEventModal(false);
      setActionSuccess('New event created successfully!');
      fetchOrganiserData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create event.');
    }
  };

  const handleVenueChange = (venueId) => {
    setScheduleForm((prev) => ({ ...prev, venue_id: venueId }));
    const v = venues.find((x) => String(x.id) === String(venueId));
    setSelectedVenueMeta(v);
  };

  const handlePriceChange = (catId, price) => {
    setScheduleForm((prev) => ({
      ...prev,
      tier_prices: {
        ...prev.tier_prices,
        [catId]: parseFloat(price) || 0,
      },
    }));
  };

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        event_id: selectedEventId,
        venue_id: parseInt(scheduleForm.venue_id, 10),
        start_time: new Date(scheduleForm.start_time).toISOString(),
        pricing: Object.entries(scheduleForm.tier_prices).map(([catId, price]) => ({
          category_id: parseInt(catId, 10),
          price: price,
        })),
      };

      await api.post('/organiser/shows', payload);
      setShowScheduleModal(false);
      setActionSuccess('Show scheduled successfully with category tier pricing and seat grid initialization!');
      fetchOrganiserData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to schedule show.');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 pb-24 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">Studio Hub</span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Organiser Dashboard & Analytics
            </h1>
          </div>

          <button
            onClick={() => setShowEventModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-600/30 flex items-center gap-2 self-start cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Event
          </button>
        </motion.div>

        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3 shadow-xl backdrop-blur-xl"
          >
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {/* Events & Shows Management List */}
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            Managed Events & Scheduled Showtimes
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 rounded-3xl liquid-glass border border-white/10 animate-pulse"></div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center liquid-glass rounded-3xl border border-white/10">
              <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No events created yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">Create your first movie or concert to schedule showtimes.</p>
              <button
                onClick={() => setShowEventModal(true)}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg cursor-pointer"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="liquid-glass rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-purple-900/60 text-purple-200 border border-purple-500/30">
                          {evt.event_type}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{evt.duration_minutes} mins</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setShowScheduleModal(true);
                      }}
                      className="px-4 py-2 rounded-xl liquid-glass border border-purple-500/40 hover:bg-purple-950/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 self-start cursor-pointer transition-all"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Show + Pricing
                    </button>
                  </div>

                  {/* Scheduled Shows Sub-list */}
                  <div className="mt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Scheduled Shows ({evt.shows?.length || 0})
                    </h4>

                    {(!evt.shows || evt.shows.length === 0) ? (
                      <p className="text-xs text-slate-500 italic">No shows scheduled for this event yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {evt.shows.map((s) => (
                          <div key={s.id} className="p-4 rounded-2xl bg-black/40 border border-white/10">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-xs font-bold text-slate-200">{s.venue_name}</div>
                                <div className="text-xs text-purple-400 mt-0.5">
                                  {new Date(s.start_time).toLocaleString()}
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-400">
                                {s.available_seats_count} seats left
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Modal: Create Event */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="liquid-glass border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Create New Event</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Coldplay Live in Mumbai"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Event Type</label>
                    <select
                      value={eventForm.event_type}
                      onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Synopsis or artist line-up..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={eventForm.banner_url}
                    onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Schedule Show with Pricing Tiers */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="liquid-glass border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Schedule Show & Set Category Pricing</h3>
              <form onSubmit={handleScheduleShow} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Venue</label>
                  <select
                    value={scheduleForm.venue_id}
                    onChange={(e) => handleVenueChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.start_time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-slate-200 text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Category Pricing Config */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                    Venue Seat Category Pricing ($)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedVenueMeta?.categories?.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-xs font-semibold text-slate-200">{cat.name} (Tier {cat.tier_level})</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 50.00"
                          value={scheduleForm.tier_prices[cat.id] || ''}
                          onChange={(e) => handlePriceChange(cat.id, e.target.value)}
                          className="w-28 px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-slate-100 text-xs font-bold text-right focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer"
                  >
                    Confirm & Initialize Grid
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
