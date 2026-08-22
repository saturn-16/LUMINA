import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Armchair,
  Ticket,
  Users,
  Clock3,
  BarChart3,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Search,
  MapPin,
  ArrowUpRight,
  Trash2,
  Eye,
  RefreshCw,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('overview'); // overview, events, venues, seats, bookings, users, waitlist, analytics

  // Data states
  const [stats, setStats] = useState(null);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter States
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('ALL');
  const [venueSearch, setVenueSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Modals & Inspectors
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [inspectingVenue, setInspectingVenue] = useState(null);
  const [selectedSeatVenueId, setSelectedSeatVenueId] = useState(null);
  const [venueLayoutData, setVenueLayoutData] = useState(null);
  const [layoutLoading, setLayoutLoading] = useState(false);

  // Create Venue Form State
  const [venueForm, setVenueForm] = useState({
    name: '',
    address: '',
    city: '',
    total_rows: 6,
    total_cols: 10,
    categories: [
      { name: 'Standard', color_code: '#3b82f6', tier_level: 1 },
      { name: 'Premium', color_code: '#8b5cf6', tier_level: 2 },
      { name: 'VIP Recliner', color_code: '#f59e0b', tier_level: 3 },
    ],
  });

  // Fetch all admin data
  const loadAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsRes, venuesRes, eventsRes, bookingsRes, usersRes, waitlistRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/venues'),
        api.get('/events'),
        api.get('/admin/bookings'),
        api.get('/admin/users'),
        api.get('/admin/waitlist'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (venuesRes.status === 'fulfilled') {
        setVenues(venuesRes.value.data);
        if (!selectedSeatVenueId && venuesRes.value.data.length > 0) {
          setSelectedSeatVenueId(venuesRes.value.data[0].id);
        }
      }
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
      if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data);
      if (waitlistRes.status === 'fulfilled') setWaitlistEntries(waitlistRes.value.data);
    } catch (err) {
      console.error('Failed to load admin console data', err);
      setError('Unable to load administration data. Please verify your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch venue layout for seat inspector
  const loadVenueLayout = async (venueId) => {
    if (!venueId) return;
    try {
      setLayoutLoading(true);
      const res = await api.get(`/admin/venues/${venueId}`);
      setVenueLayoutData(res.data);
    } catch (err) {
      console.error('Failed to load venue layout', err);
    } finally {
      setLayoutLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSeatVenueId) {
      loadVenueLayout(selectedSeatVenueId);
    }
  }, [selectedSeatVenueId]);

  // Venue Category Handlers
  const handleAddCategory = () => {
    setVenueForm((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        { name: 'New Tier', color_code: '#10b981', tier_level: prev.categories.length + 1 },
      ],
    }));
  };

  const handleCategoryChange = (index, field, val) => {
    setVenueForm((prev) => {
      const updated = [...prev.categories];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, categories: updated };
    });
  };

  const handleRemoveCategory = (index) => {
    if (venueForm.categories.length <= 1) return;
    setVenueForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, idx) => idx !== index),
    }));
  };

  // Create Venue Submit
  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/venues', {
        ...venueForm,
        total_rows: parseInt(venueForm.total_rows, 10),
        total_cols: parseInt(venueForm.total_cols, 10),
      });
      setShowVenueModal(false);
      setSuccess(`Venue "${venueForm.name}" with ${venueForm.total_rows * venueForm.total_cols} seats generated successfully.`);
      setVenueForm({
        name: '',
        address: '',
        city: '',
        total_rows: 6,
        total_cols: 10,
        categories: [
          { name: 'Standard', color_code: '#3b82f6', tier_level: 1 },
          { name: 'Premium', color_code: '#8b5cf6', tier_level: 2 },
          { name: 'VIP Recliner', color_code: '#f59e0b', tier_level: 3 },
        ],
      });
      loadAllData(true);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create venue.');
    }
  };

  // Delete Venue
  const handleDeleteVenue = async (venueId, venueName) => {
    if (!window.confirm(`Are you sure you want to delete venue "${venueName}"?`)) return;
    try {
      await api.delete(`/admin/venues/${venueId}`);
      setSuccess(`Venue "${venueName}" deleted successfully.`);
      loadAllData(true);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete venue.');
    }
  };

  // Cancel Booking
  const handleCancelBooking = async (bookingId, ref) => {
    if (!window.confirm(`Cancel booking #${ref}? Released seats will be reassigned to waitlist or made available.`)) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      setSuccess(`Booking #${ref} has been cancelled.`);
      loadAllData(true);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel booking.');
    }
  };

  // Filtered lists
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch = e.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        e.city?.toLowerCase().includes(eventSearch.toLowerCase());
      const matchCat = eventCategoryFilter === 'ALL' || e.event_type === eventCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [events, eventSearch, eventCategoryFilter]);

  const filteredVenues = useMemo(() => {
    return venues.filter((v) => {
      return v.name?.toLowerCase().includes(venueSearch.toLowerCase()) ||
        v.city?.toLowerCase().includes(venueSearch.toLowerCase());
    });
  }, [venues, venueSearch]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      return b.booking_reference?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.customer_name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.event_title?.toLowerCase().includes(bookingSearch.toLowerCase());
    });
  }, [bookings, bookingSearch]);

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      return u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.role?.toLowerCase().includes(userSearch.toLowerCase());
    });
  }, [usersList, userSearch]);

  // INR Currency formatter
  const formatINR = (val) => {
    if (val === null || val === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Navigation Items Config
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, count: null },
    { id: 'events', label: 'Events', icon: CalendarDays, count: events.length },
    { id: 'venues', label: 'Venues', icon: Building2, count: venues.length },
    { id: 'seats', label: 'Seat Layouts', icon: Armchair, count: null },
    { id: 'bookings', label: 'Live Bookings', icon: Ticket, count: bookings.length },
    { id: 'users', label: 'User Accounts', icon: Users, count: usersList.length },
    { id: 'waitlist', label: 'Waitlist Queues', icon: Clock3, count: waitlistEntries.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200">
      {/* Subtle Lumina Background: Deep black with faint cinematic ambient radial glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.025] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[700px] h-[700px] bg-blue-500/[0.02] rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.02] via-transparent to-transparent" />
      </div>

      {/* Top Navbar */}
      <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      {/* Main Admin Operations Workspace */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20 flex-1">
        {/* Alerts & Notifications */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between shadow-xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-white cursor-pointer">
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
            <button onClick={() => loadAllData(true)} className="px-2.5 py-1 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-200 text-[11px] font-bold cursor-pointer">
              Retry
            </button>
          </motion.div>
        )}

        {/* Master 2-Column Admin Shell: Desktop Sidebar + Main Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* =========================================================================
              1. DESKTOP OPERATIONS SIDEBAR
             ========================================================================= */}
          <aside className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="liquid-glass rounded-3xl p-4 border border-white/10 shadow-2xl backdrop-blur-2xl sticky top-6"
            >
              {/* Header Profile Tag */}
              <div className="px-3 py-3 mb-3 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span>Lumina Admin</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-0.5 truncate max-w-[140px]">
                    {user?.full_name || 'Administrator'}
                  </div>
                </div>

                <button
                  onClick={() => loadAllData(true)}
                  disabled={refreshing}
                  title="Refresh Operational State"
                  className={`p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer ${
                    refreshing ? 'animate-spin text-amber-400' : ''
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shadow-lg shadow-amber-500/5'
                          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.count !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/50'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* System Health Quick Card */}
              <div className="mt-6 pt-4 border-t border-white/10 px-3">
                <div className="flex items-center justify-between text-[11px] text-white/50 mb-1.5 font-mono">
                  <span>SYSTEM STATUS</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="text-[11px] text-white/40">
                  Worker Loop: Active (15s TTL)
                </div>
              </div>
            </motion.div>
          </aside>

          {/* =========================================================================
              2. MAIN OPERATIONS WORKSPACE
             ========================================================================= */}
          <div className="lg:col-span-9 space-y-8">
            {/* Top Workspace Header */}
            <motion.div
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10"
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ADMIN OPERATIONS CONSOLE
                </span>
                <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-white mt-1">
                  {activeTab === 'overview' && 'Operations Overview'}
                  {activeTab === 'events' && 'Event Catalogue Management'}
                  {activeTab === 'venues' && 'Auditoriums & Venues'}
                  {activeTab === 'seats' && 'Interactive Seat Grid Inspector'}
                  {activeTab === 'bookings' && 'Live Ticket Bookings'}
                  {activeTab === 'users' && 'System Accounts & Roles'}
                  {activeTab === 'waitlist' && 'FIFO Waitlist Allocation Queues'}
                  {activeTab === 'analytics' && 'Platform Performance & Analytics'}
                </h1>
              </div>

              {/* Top Quick Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowVenueModal(true)}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Venue & Grid</span>
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
                {/* Compact KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">TOTAL REVENUE</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {formatINR(stats?.total_revenue || 0)}
                    </div>
                    <div className="text-[10px] text-amber-400 mt-1 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Confirmed transactions</span>
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">BOOKINGS</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {stats?.total_confirmed_bookings || 0}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1">
                      Live admissions issued
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">LIVE EVENTS</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {stats?.total_events || events.length}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1">
                      Across Movies & Live
                    </div>
                  </div>

                  <div className="liquid-glass rounded-3xl p-5 border border-white/10 backdrop-blur-xl">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-1">VENUES</div>
                    <div className="text-2xl sm:text-3xl font-normal tracking-tight text-white font-serif">
                      {stats?.total_venues || venues.length}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1">
                      Across 12+ Indian cities
                    </div>
                  </div>
                </div>

                {/* 2-Column Operational Feeds: Upcoming Events & Recent Bookings */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Upcoming Events */}
                  <div className="lg:col-span-7 liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-amber-400" />
                        <span>Upcoming Events</span>
                      </h2>
                      <button
                        onClick={() => setActiveTab('events')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({events.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {events.slice(0, 5).map((evt) => (
                        <div
                          key={evt.id}
                          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={evt.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300'}
                              alt={evt.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                            />
                            <div className="min-w-0">
                              <h3 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                                {evt.title}
                              </h3>
                              <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                                  {evt.event_type}
                                </span>
                                <span>{evt.city || 'India'}</span>
                                <span>•</span>
                                <span>{evt.duration_minutes}m</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-white">
                              {formatINR(evt.min_price)}
                            </div>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              ON SALE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Recent Bookings Stream */}
                  <div className="lg:col-span-5 liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-blue-400" />
                        <span>Recent Bookings</span>
                      </h2>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All ({bookings.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {bookings.length === 0 ? (
                        <div className="text-center py-8 text-xs text-white/40">
                          No recent bookings recorded yet.
                        </div>
                      ) : (
                        bookings.slice(0, 5).map((b) => (
                          <div
                            key={b.id}
                            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-mono font-bold text-amber-300">
                                #{b.booking_reference}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400">
                                {formatINR(b.total_amount)}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-white/90 truncate">
                              {b.customer_name} • <span className="text-white/50">{b.event_title}</span>
                            </div>
                            <div className="text-[10px] text-white/40 mt-1 flex items-center justify-between">
                              <span>{b.seats_count} Seat(s)</span>
                              <span>{b.city}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: 2. EVENTS MANAGEMENT */}
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
                      placeholder="Search events or city..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                    {['ALL', 'MOVIE', 'CONCERT', 'THEATRE', 'SPORTS'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setEventCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all cursor-pointer ${
                          eventCategoryFilter === cat
                            ? 'bg-amber-500 text-black shadow-md'
                            : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Events Operational Table */}
                <div className="liquid-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                        <tr>
                          <th className="py-3.5 px-4">Event</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4">City Venue</th>
                          <th className="py-3.5 px-4">Duration</th>
                          <th className="py-3.5 px-4">Price Range</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {filteredEvents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-white/40">
                              No events found matching your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredEvents.map((evt) => (
                            <tr key={evt.id} className="hover:bg-white/5 transition-colors group">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={evt.banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'}
                                    alt={evt.title}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                                  />
                                  <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                                    {evt.title}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-white/80 border border-white/10">
                                  {evt.event_type}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-white/90">{evt.venue_name || 'Auditorium'}</div>
                                <div className="text-[10px] text-white/40">{evt.city || 'India'}</div>
                              </td>
                              <td className="py-3 px-4 font-mono text-white/60">
                                {evt.duration_minutes} mins
                              </td>
                              <td className="py-3 px-4 font-semibold text-white">
                                {formatINR(evt.min_price)} {evt.max_price && evt.max_price !== evt.min_price ? `- ${formatINR(evt.max_price)}` : ''}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link
                                  to={`/events/${evt.id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-semibold text-amber-300 transition-all"
                                >
                                  <span>View</span>
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

            {/* TAB CONTENT: 3. VENUE MANAGEMENT */}
            {activeTab === 'venues' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Search Bar */}
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
                  <Search className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search venues or city..."
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                </div>

                {/* Venues Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredVenues.map((v, idx) => {
                    const totalSeats = (v.total_rows || 6) * (v.total_cols || v.seats_per_row || 10);

                    return (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.04 }}
                        className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-white">{v.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-white/50 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{v.address}, {v.city}</span>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {totalSeats} Seats
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-white/70 space-y-2 mb-6">
                            <div className="flex justify-between">
                              <span className="text-white/40">Grid Dimensions:</span>
                              <span className="font-mono text-white/90">
                                {v.total_rows} Rows × {v.total_cols || v.seats_per_row || 10} Columns
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/40">Tiers Configured:</span>
                              <div className="flex gap-1.5 flex-wrap justify-end">
                                {v.categories?.map((c) => (
                                  <span
                                    key={c.id}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                                    style={{
                                      backgroundColor: `${c.color_code || '#3B82F6'}25`,
                                      color: c.color_code || '#60A5FA',
                                      border: `1px solid ${c.color_code || '#3B82F6'}40`,
                                    }}
                                  >
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setSelectedSeatVenueId(v.id);
                              setActiveTab('seats');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Armchair className="w-3.5 h-3.5 text-amber-400" />
                            <span>Inspect Seat Map</span>
                          </button>

                          <button
                            onClick={() => handleDeleteVenue(v.id, v.name)}
                            className="p-2 rounded-xl text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all cursor-pointer"
                            title="Delete Venue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: 4. SEAT GRID INSPECTOR */}
            {activeTab === 'seats' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Venue Selector Dropdown */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono uppercase text-white/50">Select Auditorium:</label>
                  <select
                    value={selectedSeatVenueId || ''}
                    onChange={(e) => setSelectedSeatVenueId(Number(e.target.value))}
                    className="px-4 py-2 rounded-2xl bg-white/5 border border-white/15 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
                        {v.name} ({v.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visual Seat Map View */}
                {layoutLoading ? (
                  <div className="p-16 text-center text-xs text-white/40 animate-pulse">
                    Loading physical auditorium seating matrix...
                  </div>
                ) : venueLayoutData ? (
                  <div className="liquid-glass rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                      <div>
                        <h2 className="text-xl font-bold text-white">{venueLayoutData.name}</h2>
                        <div className="text-xs text-white/50">{venueLayoutData.address}, {venueLayoutData.city}</div>
                      </div>

                      {/* Tier Legend */}
                      <div className="flex items-center gap-3">
                        {venueLayoutData.categories?.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-1.5 text-xs">
                            <span
                              className="w-3 h-3 rounded-md"
                              style={{ backgroundColor: cat.color_code || '#3B82F6' }}
                            />
                            <span className="text-white/80 font-medium">{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stage Curve Indicator */}
                    <div className="max-w-md mx-auto mb-10 text-center">
                      <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                      <span className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase block mt-2">
                        AUDITORIUM STAGE / SCREEN
                      </span>
                    </div>

                    {/* Seat Grid Layout */}
                    <div className="overflow-x-auto pb-4">
                      <div className="inline-flex flex-col items-center gap-2 min-w-full">
                        {Array.from({ length: venueLayoutData.total_rows || 6 }).map((_, rIdx) => {
                          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                          const rowLetter = alphabet[rIdx % alphabet.length];
                          const rowSeats = venueLayoutData.seats?.filter((s) => s.row_label === rowLetter) || [];

                          return (
                            <div key={rowLetter} className="flex items-center gap-2">
                              <span className="w-5 text-[11px] font-mono font-bold text-white/40 text-right">
                                {rowLetter}
                              </span>

                              <div className="flex gap-1.5">
                                {rowSeats.length > 0 ? (
                                  rowSeats.map((s) => {
                                    const cat = venueLayoutData.categories?.find((c) => c.id === s.category_id);
                                    const color = cat?.color_code || '#3B82F6';

                                    return (
                                      <div
                                        key={s.id}
                                        title={`Row ${s.row_label}-${s.seat_number} (${cat?.name || 'Tier'})`}
                                        className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-mono font-bold text-white/90 cursor-default transition-transform hover:scale-110"
                                        style={{
                                          backgroundColor: `${color}35`,
                                          border: `1px solid ${color}80`,
                                        }}
                                      >
                                        {s.seat_number}
                                      </div>
                                    );
                                  })
                                ) : (
                                  Array.from({ length: venueLayoutData.total_cols || 10 }).map((_, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className="w-6 h-6 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-[9px] font-mono text-white/70"
                                    >
                                      {cIdx + 1}
                                    </div>
                                  ))
                                )}
                              </div>

                              <span className="w-5 text-[11px] font-mono font-bold text-white/40 text-left">
                                {rowLetter}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* TAB CONTENT: 5. LIVE BOOKINGS */}
            {activeTab === 'bookings' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
                  <Search className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by reference, customer or event..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                </div>

                <div className="liquid-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                        <tr>
                          <th className="py-3.5 px-4">Reference</th>
                          <th className="py-3.5 px-4">Customer</th>
                          <th className="py-3.5 px-4">Event</th>
                          <th className="py-3.5 px-4">Seats</th>
                          <th className="py-3.5 px-4">Amount</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-white/40">
                              No customer bookings recorded.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => (
                            <tr key={b.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-amber-300">
                                #{b.booking_reference}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{b.customer_name}</div>
                                <div className="text-[10px] text-white/40">{b.customer_email}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-white">{b.event_title}</div>
                                <div className="text-[10px] text-white/40">{b.venue_name} ({b.city})</div>
                              </td>
                              <td className="py-3 px-4 font-mono">
                                {b.seats_count}
                              </td>
                              <td className="py-3 px-4 font-bold text-white">
                                {formatINR(b.total_amount)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  b.status === 'CONFIRMED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {b.status === 'CONFIRMED' && (
                                  <button
                                    onClick={() => handleCancelBooking(b.id, b.booking_reference)}
                                    className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-300 text-[11px] font-semibold border border-red-800/40 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
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

            {/* TAB CONTENT: 6. USERS & ACCOUNTS */}
            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 max-w-sm">
                  <Search className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search accounts by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-white/40 focus:outline-none"
                  />
                </div>

                <div className="liquid-glass rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                        <tr>
                          <th className="py-3.5 px-4">User</th>
                          <th className="py-3.5 px-4">Email</th>
                          <th className="py-3.5 px-4">Role</th>
                          <th className="py-3.5 px-4 text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              {u.full_name}
                            </td>
                            <td className="py-3 px-4 text-white/70">
                              {u.email}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : u.role === 'ORGANISER'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[11px] text-white/40">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: 7. WAITLIST */}
            {activeTab === 'waitlist' && (
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
                          <th className="py-3.5 px-4">Event</th>
                          <th className="py-3.5 px-4">Requested Tier</th>
                          <th className="py-3.5 px-4">Customer</th>
                          <th className="py-3.5 px-4">City</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Queued At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {waitlistEntries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-white/40">
                              No active waitlist queues. All show categories currently have availability.
                            </td>
                          </tr>
                        ) : (
                          waitlistEntries.map((w) => (
                            <tr key={w.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-semibold text-white">
                                {w.event_title}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-md bg-white/10 font-bold text-white/80 text-[10px]">
                                  {w.category_name}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div>{w.customer_name}</div>
                                <div className="text-[10px] text-white/40">{w.customer_email}</div>
                              </td>
                              <td className="py-3 px-4 text-white/60">
                                {w.city}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                                  {w.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-[11px] text-white/40">
                                {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'N/A'}
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

            {/* TAB CONTENT: 8. ANALYTICS */}
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Breakdown */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Event Catalogue Distribution</h3>
                    <div className="space-y-3">
                      {['MOVIE', 'CONCERT', 'THEATRE', 'SPORTS'].map((type) => {
                        const count = events.filter((e) => e.event_type === type).length;
                        const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/70">{type}</span>
                              <span className="font-mono text-white/90">{count} shows ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Infrastructure Health */}
                  <div className="liquid-glass rounded-3xl p-6 border border-white/10 shadow-xl backdrop-blur-xl">
                    <h3 className="text-sm font-bold text-white mb-4">Platform Infrastructure</h3>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Temporary Seat Hold TTL:</span>
                        <span className="font-mono text-emerald-400 font-bold">120 seconds</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Worker Sweep Interval:</span>
                        <span className="font-mono text-emerald-400 font-bold">Every 15s</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-white/60">Email QR Passcard Dispatch:</span>
                        <span className="font-mono text-emerald-400 font-bold">Async Background Thread</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Modal: Create Venue & Grid */}
        <AnimatePresence>
          {showVenueModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="liquid-glass-strong border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl backdrop-blur-3xl my-8"
              >
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-bold text-white">Create New Auditorium Venue</h3>
                    <p className="text-xs text-white/50 mt-0.5">Define venue physical capacity and tier matrix</p>
                  </div>
                  <button
                    onClick={() => setShowVenueModal(false)}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateVenue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Venue Name</label>
                    <input
                      type="text"
                      required
                      value={venueForm.name}
                      onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                      placeholder="e.g. Jio World Convention Centre"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={venueForm.city}
                        onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                        placeholder="e.g. Mumbai"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">Address / Landmark</label>
                      <input
                        type="text"
                        required
                        value={venueForm.address}
                        onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                        placeholder="e.g. BKC Avenue"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">Total Rows (A-Z)</label>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        required
                        value={venueForm.total_rows}
                        onChange={(e) => setVenueForm({ ...venueForm, total_rows: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">Seats per Row</label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        required
                        value={venueForm.total_cols}
                        onChange={(e) => setVenueForm({ ...venueForm, total_cols: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Seat Categories Matrix */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        Seat Tier Categories
                      </label>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                      >
                        + Add Tier
                      </button>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {venueForm.categories.map((cat, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            required
                            value={cat.name}
                            onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white"
                            placeholder="Tier Name"
                          />
                          <input
                            type="color"
                            value={cat.color_code}
                            onChange={(e) => handleCategoryChange(idx, 'color_code', e.target.value)}
                            className="w-8 h-8 rounded-lg border border-white/15 cursor-pointer bg-transparent"
                          />
                          {venueForm.categories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(idx)}
                              className="text-white/40 hover:text-red-400 p-1 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Metric */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs flex items-center justify-between text-white/70">
                    <span>Generated Grid Size:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {venueForm.total_rows * venueForm.total_cols} Total Physical Seats
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowVenueModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-white/50 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
                    >
                      Generate Seat Grid
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs text-white/40 border-t border-white/5">
        Lumina Operations Console • Secure High-Concurrency Engine
      </footer>
    </div>
  );
}
