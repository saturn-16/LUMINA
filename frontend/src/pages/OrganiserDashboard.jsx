import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  Music,
  PlusCircle,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Layers,
  ChevronRight,
  Search,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  SlidersHorizontal,
  LayoutDashboard,
  Radio,
} from 'lucide-react';

export default function OrganiserDashboard() {
  const { user } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, events, shows, analytics

  // Data states
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal States
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEventMeta, setSelectedEventMeta] = useState(null);

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
    tier_prices: {}, // { category_id: price }
  });

  const [selectedVenueMeta, setSelectedVenueMeta] = useState(null);

  // Fetch all organiser data
  const fetchOrganiserData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [eventsRes, venuesRes, analyticsRes] = await Promise.allSettled([
        api.get('/organiser/events'),
        api.get('/venues').catch(() => api.get('/admin/venues')),
        api.get('/organiser/analytics'),
      ]);

      let loadedEvents = [];
      if (eventsRes.status === 'fulfilled') {
        loadedEvents = eventsRes.value.data;
        setEvents(loadedEvents);
      }

      if (venuesRes.status === 'fulfilled' && venuesRes.value?.data) {
        const loadedVenues = venuesRes.value.data;
        setVenues(loadedVenues);
        if (loadedVenues.length > 0) {
          setScheduleForm((prev) => ({
            ...prev,
            venue_id: prev.venue_id || String(loadedVenues[0].id),
          }));
          setSelectedVenueMeta((prev) => prev || loadedVenues[0]);
        }
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load organiser data', err);
      setError('Unable to load studio data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganiserData();
  }, []);

  // Format Currency (INR)
  const formatINR = (val) => {
    if (val === null || val === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Create Event Handler
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/organiser/events', {
        ...eventForm,
        duration_minutes: parseInt(eventForm.duration_minutes, 10),
      });
      setShowEventModal(false);
      setActionSuccess(`Experience "${eventForm.title}" created successfully!`);
      setEventForm({
        title: '',
        description: '',
        event_type: 'MOVIE',
        duration_minutes: 120,
        banner_url: '',
      });
      fetchOrganiserData(true);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create event.');
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Delete experience "${eventTitle}" and all its scheduled showtimes?`)) return;
    try {
      await api.delete(`/organiser/events/${eventId}`);
      setActionSuccess(`Experience "${eventTitle}" deleted successfully.`);
      fetchOrganiserData(true);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete event.');
    }
  };

  // Venue selection in Schedule Modal
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

  // Open Schedule Modal for an Event
  const openScheduleModal = (evt) => {
    setSelectedEventId(evt.id);
    setSelectedEventMeta(evt);
    if (venues.length > 0) {
      setScheduleForm({
        venue_id: String(venues[0].id),
        start_time: '',
        tier_prices: {},
      });
      setSelectedVenueMeta(venues[0]);
    }
    setShowScheduleModal(true);
  };

  // Schedule Show Submit
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
      setActionSuccess(`Showtime scheduled at ${selectedVenueMeta?.name || 'auditorium'} with seat tier pricing!`);
      fetchOrganiserData(true);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to schedule show.');
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchQuery = evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'ALL' || evt.event_type === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [events, searchQuery, categoryFilter]);

  // Derived Performance Metrics from real backend analytics
  const totalRevenue = analytics?.total_revenue || 0;
  const totalTickets = analytics?.total_tickets_sold || 0;
  const totalBookings = analytics?.total_bookings || 0;

  // Flatten all scheduled shows across events for showtime timeline
  const allShows = useMemo(() => {
    const list = [];
    events.forEach((evt) => {
      if (evt.shows && Array.isArray(evt.shows)) {
        evt.shows.forEach((s) => {
          list.push({
            ...s,
            eventTitle: evt.title,
            eventType: evt.event_type,
            bannerUrl: evt.banner_url,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [events]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-purple-500/25 selection:text-purple-200">
      {/* Calm Studio Atmospheric Background: Deep black with faint purple cinematic ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-1/4 w-[700px] h-[700px] bg-purple-600/[0.035] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-1/3 w-[600px] h-[600px] bg-indigo-600/[0.025] rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/[0.03] via-transparent to-transparent" />
      </div>

      {/* Top Navbar */}
      <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      {/* Main Studio Operations Workspace */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 flex-1">
        {/* Toast Alerts */}
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-300 text-xs flex items-center justify-between shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchOrganiserData(true)}
              className="px-2.5 py-1 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-200 text-[11px] font-bold cursor-pointer"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* 2-Column Shell: Studio Sidebar + Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              1. STUDIO NAVIGATION SIDEBAR
             ========================================================================= */}
          <aside className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass rounded-3xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl sticky top-6"
            >
              {/* Studio Header Tag */}
              <div className="px-3 py-3 mb-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>Lumina Studio</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5 truncate max-w-[140px]">
                    {user?.full_name || 'Production Hub'}
                  </div>
                </div>

                <button
                  onClick={() => fetchOrganiserData(true)}
                  disabled={refreshing}
                  title="Sync Studio Data"
                  className={`p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer ${
                    refreshing ? 'animate-spin text-purple-400' : ''
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {[
                  { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
                  { id: 'events', label: 'Managed Events', icon: Film, count: events.length },
                  { id: 'shows', label: 'Scheduled Shows', icon: Calendar, count: allShows.length },
                  { id: 'analytics', label: 'Sales & Occupancy', icon: BarChart3, count: null },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-semibold shadow-lg shadow-purple-600/10'
                          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-purple-400' : 'text-white/40 group-hover:text-white/70'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.count !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-purple-500/30 text-purple-200' : 'bg-white/10 text-white/50'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Production Console Metadata */}
              <div className="mt-6 pt-4 border-t border-white/10 px-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                  <span>PRODUCTION STATUS</span>
                  <span className="text-purple-400 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="text-[11px] text-white/40">
                  Venues Available: {venues.length} Across India
                </div>
              </div>
            </motion.div>
          </aside>

          {/* =========================================================================
              2. MAIN STUDIO WORKSPACE
             ========================================================================= */}
          <div className="lg:col-span-9 space-y-8">
            {/* Top Studio Header */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10"
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  YOUR EVENT STUDIO
                </span>
                <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white mt-1">
                  {activeTab === 'overview' && 'Your Studio Overview'}
                  {activeTab === 'events' && 'Your Experiences & Productions'}
                  {activeTab === 'shows' && 'Scheduled Showtimes & Pricing'}
                  {activeTab === 'analytics' && 'Ticket Performance & Revenue'}
                </h1>
              </div>

              {/* Primary Action Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEventModal(true)}
                  className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all cursor-pointer group"
                >
                  <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
                  <span>Create Experience</span>
                </button>
              </div>
            </motion.div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Compact Performance KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">TICKETS SOLD</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {totalTickets.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-purple-400 mt-1 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{totalBookings} orders confirmed</span>
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">TOTAL REVENUE</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {formatINR(totalRevenue)}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1">
                      Direct gross receipts
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">ACTIVE EXPERIENCES</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {events.length}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1">
                      In production catalogue
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">SCHEDULED SHOWS</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {allShows.length}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1">
                      Across premier auditoriums
                    </div>
                  </div>
                </div>

                {/* Main Events Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-purple-400" />
                      <span>Your Experiences</span>
                    </h2>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({events.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-24 rounded-3xl liquid-glass border border-white/5 animate-pulse" />
                      ))}
                    </div>
                  ) : events.length === 0 ? (
                    /* Blank Stage Editorial Empty State */
                    <div className="liquid-glass rounded-3xl p-12 sm:p-16 border border-white/10 text-center shadow-2xl backdrop-blur-2xl relative overflow-hidden">
                      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative z-10 max-w-md mx-auto space-y-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                          STAGE READY
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-normal text-white tracking-tight">
                          YOUR STAGE IS WAITING.
                        </h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Produce your first concert, movie screening or live production and open ticketing to audiences across India.
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => setShowEventModal(true)}
                            className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                          >
                            + Create Experience ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Cinematic Horizontal Event Rows */
                    <div className="space-y-3">
                      {events.slice(0, 4).map((evt) => {
                        const eventAnalytics = analytics?.events?.find((e) => e.event_id === evt.id);
                        const sold = eventAnalytics?.tickets_sold || 0;
                        const rev = eventAnalytics?.total_revenue || 0;

                        return (
                          <div
                            key={evt.id}
                            className="liquid-glass rounded-3xl p-4 sm:p-5 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <img
                                src={evt.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                                alt={evt.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {evt.event_type}
                                  </span>
                                  <span className="text-[10px] text-white/40">{evt.duration_minutes} mins</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                  {evt.title}
                                </h3>
                                <p className="text-xs text-white/50 line-clamp-1 mt-0.5">
                                  {evt.description}
                                </p>
                              </div>
                            </div>

                            {/* Performance & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                              <div className="text-left sm:text-right">
                                <div className="text-[10px] font-mono text-white/40 uppercase">Performance</div>
                                <div className="text-xs font-bold text-white">
                                  {sold} Sold • {formatINR(rev)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openScheduleModal(evt)}
                                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>Schedule Show</span>
                                </button>

                                <Link
                                  to={`/events/${evt.id}`}
                                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white transition-all"
                                  title="View Public Page"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Up Next: Scheduled Showtimes Timeline */}
                {allShows.length > 0 && (
                  <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>Up Next: Scheduled Showtimes</span>
                      </h2>
                      <button
                        onClick={() => setActiveTab('shows')}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({allShows.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allShows.slice(0, 3).map((show) => (
                        <div
                          key={show.id}
                          className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-purple-400 font-mono mb-2">
                              <span>{new Date(show.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              <span>{new Date(show.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">{show.eventTitle}</h4>
                            <div className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{show.venue?.name || 'Premier Auditorium'}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-white/40">Status</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300">
                              {show.status || 'SCHEDULED'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT: 2. MANAGED EVENTS */}
            {activeTab === 'events' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Search & Category Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 w-full sm:w-80">
                    <Search className="w-4 h-4 text-white/40 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search experiences..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                    {['ALL', 'MOVIE', 'CONCERT', 'THEATRE', 'SPORTS'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Managed Events List */}
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-16 text-xs text-white/40 liquid-glass rounded-3xl border border-white/10">
                      No experiences found matching your query.
                    </div>
                  ) : (
                    filteredEvents.map((evt) => {
                      const eventAnalytics = analytics?.events?.find((e) => e.event_id === evt.id);
                      const sold = eventAnalytics?.tickets_sold || 0;
                      const rev = eventAnalytics?.total_revenue || 0;

                      return (
                        <div
                          key={evt.id}
                          className="liquid-glass rounded-3xl p-6 border border-white/10 hover:border-purple-500/40 transition-all shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <img
                              src={evt.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                              alt={evt.title}
                              className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-white/10"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {evt.event_type}
                                </span>
                                <span className="text-[10px] text-white/40">{evt.duration_minutes} mins</span>
                              </div>
                              <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {evt.title}
                              </h3>
                              <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                                {evt.description}
                              </p>
                            </div>
                          </div>

                          {/* Stats & Actions */}
                          <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/10">
                            <div className="text-left md:text-right">
                              <div className="text-[10px] font-mono uppercase text-white/40">Gross Receipts</div>
                              <div className="text-sm font-bold text-white">{formatINR(rev)}</div>
                              <div className="text-[10px] text-purple-400">{sold} tickets sold</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openScheduleModal(evt)}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Schedule Show</span>
                              </button>

                              <Link
                                to={`/events/${evt.id}`}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all"
                                title="Public View"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>

                              <button
                                onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                className="p-2 rounded-xl text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all cursor-pointer"
                                title="Delete Experience"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: 3. SCHEDULED SHOWS */}
            {activeTab === 'shows' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="liquid-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                        <tr>
                          <th className="py-3.5 px-4">Experience</th>
                          <th className="py-3.5 px-4">Auditorium / Venue</th>
                          <th className="py-3.5 px-4">Showtime</th>
                          <th className="py-3.5 px-4">Availability</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {allShows.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-white/40">
                              No showtimes scheduled. Click "Schedule Show" on an event to initialize a venue slot.
                            </td>
                          </tr>
                        ) : (
                          allShows.map((s) => (
                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold text-white">
                                {s.eventTitle}
                              </td>
                              <td className="py-3 px-4">
                                <div>{s.venue?.name || 'Auditorium'}</div>
                                <div className="text-[10px] text-white/40">{s.venue?.city || 'India'}</div>
                              </td>
                              <td className="py-3 px-4 font-mono text-purple-300">
                                {new Date(s.start_time).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-white/90">
                                  {s.available_seats_count ?? 'Active'} seats
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {s.status || 'SCHEDULED'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  to={`/events/${s.event_id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-purple-300 transition-all"
                                >
                                  <span>Seat Grid</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: 4. ANALYTICS & OCCUPANCY */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Performance Breakdown */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Event Performance Breakdown</h3>
                    <div className="space-y-4">
                      {analytics?.events && analytics.events.length > 0 ? (
                        analytics.events.map((evt) => (
                          <div key={evt.event_id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-white">{evt.title}</span>
                              <span className="font-mono text-purple-300 font-bold">{formatINR(evt.total_revenue)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-white/50">
                              <span>Tickets Sold: {evt.tickets_sold}</span>
                              <span>Orders: {evt.total_bookings}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-white/40 text-center py-6">
                          No performance data recorded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Production Capacity Telemetry */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Studio Infrastructure</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Registered Venues:</span>
                        <span className="font-mono text-purple-400 font-bold">{venues.length} Facilities</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Live Concurrency Protection:</span>
                        <span className="font-mono text-emerald-400 font-bold">Pessimistic Row-Level Lock</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Auto Waitlist Reallocation:</span>
                        <span className="font-mono text-emerald-400 font-bold">FIFO Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal: Create Experience */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="liquid-glass-strong border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl backdrop-blur-3xl my-8"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-white">Create New Experience</h3>
                    <p className="text-xs text-white/50 mt-0.5">Produce a new cinematic movie, concert or live event</p>
                  </div>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Title / Production Name</label>
                    <input
                      type="text"
                      required
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      placeholder="e.g. A.R. Rahman Live in Concert"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">Category</label>
                      <select
                        value={eventForm.event_type}
                        onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      >
                        <option value="MOVIE" className="bg-neutral-900">Movie</option>
                        <option value="CONCERT" className="bg-neutral-900">Concert</option>
                        <option value="THEATRE" className="bg-neutral-900">Theatre</option>
                        <option value="SPORTS" className="bg-neutral-900">Sports</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={eventForm.duration_minutes}
                        onChange={(e) => setEventForm({ ...eventForm, duration_minutes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Description / Artist Lineup</label>
                    <textarea
                      rows={3}
                      required
                      value={eventForm.description}
                      onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      placeholder="Provide event details, synopsis or VIP perks..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Banner Artwork URL</label>
                    <input
                      type="url"
                      value={eventForm.banner_url}
                      onChange={(e) => setEventForm({ ...eventForm, banner_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      placeholder="https://images.unsplash.com/..."
                    />
                    {eventForm.banner_url && (
                      <div className="mt-2 relative rounded-xl overflow-hidden h-24 border border-white/10">
                        <img
                          src={eventForm.banner_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
                    >
                      Save & Launch Experience
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Schedule Show with Pricing */}
        <AnimatePresence>
          {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="liquid-glass-strong border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl backdrop-blur-3xl my-8"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-white">Schedule Showtime & Tier Pricing</h3>
                    <p className="text-xs text-purple-300 mt-0.5">{selectedEventMeta?.title}</p>
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleScheduleShow} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Select Auditorium Venue</label>
                    <select
                      value={scheduleForm.venue_id}
                      onChange={(e) => handleVenueChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400 cursor-pointer"
                    >
                      {venues.map((v) => (
                        <option key={v.id} value={v.id} className="bg-neutral-900">
                          {v.name} ({v.city}) — {v.total_rows * (v.total_cols || v.seats_per_row || 10)} Seats
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Start Date & Showtime</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  {/* Seat Category Pricing Config */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                      Venue Tier Pricing (₹ INR)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedVenueMeta?.categories?.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-md"
                              style={{ backgroundColor: cat.color_code || '#8B5CF6' }}
                            />
                            <span className="text-xs font-semibold text-white">{cat.name} (Tier {cat.tier_level})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-white/50">₹</span>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              required
                              placeholder="e.g. 1500"
                              value={scheduleForm.tier_prices[cat.id] || ''}
                              onChange={(e) => handlePriceChange(cat.id, e.target.value)}
                              className="w-28 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-bold text-right focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer transition-all"
                    >
                      Confirm Showtime & Initialize Seats
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-white/40 border-t border-white/5">
        Lumina Event Studio • Production & High-Concurrency Ticketing Platform
      </footer>
    </div>
  );
}
