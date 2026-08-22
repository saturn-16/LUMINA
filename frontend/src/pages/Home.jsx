import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, MapPin, ArrowUpRight, Film, Music, Sparkles, X, ChevronDown, Ticket, Drama, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'ALL';
  const initialQuery = searchParams.get('query') || '';
  const initialCity = searchParams.get('city') || '';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [visibleCount, setVisibleCount] = useState(8);

  const indianCities = [
    'All Cities',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Goa',
    'Kochi',
    'Chandigarh',
    'Lucknow',
  ];

  // Sync state with URL search params
  useEffect(() => {
    setSelectedType(searchParams.get('type') || 'ALL');
    setSearchQuery(searchParams.get('query') || '');
    setSelectedCity(searchParams.get('city') || '');
    setVisibleCount(8);
  }, [searchParams]);

  // Fetch events on query/type/city change
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const params = {};
        if (selectedType !== 'ALL') params.event_type = selectedType;
        if (searchQuery.trim()) params.query = searchQuery.trim();
        if (selectedCity.trim() && selectedCity !== 'All Cities') params.city = selectedCity.trim();

        const res = await api.get('/events', { params });
        setEvents(res.data);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchEvents();
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, selectedCity]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setVisibleCount(8);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'ALL') {
      newParams.delete('type');
    } else {
      newParams.set('type', type);
    }
    setSearchParams(newParams);
  };

  const handleCityChange = (city) => {
    const cityName = city === 'All Cities' ? '' : city;
    setSelectedCity(cityName);
    setVisibleCount(8);
    const newParams = new URLSearchParams(searchParams);
    if (!cityName) {
      newParams.delete('city');
    } else {
      newParams.set('city', cityName);
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('query');
    setSearchParams(newParams);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  const featuredEvent = events.length > 0 ? events[0] : null;
  const remainingEvents = events.length > 1 ? events.slice(1) : [];
  const displayedEvents = remainingEvents.slice(0, visibleCount);
  const hasMore = remainingEvents.length > visibleCount;

  // Format currency into INR ₹
  const formatPrice = (val) => {
    if (!val && val !== 0) return 'Pricing TBA';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20 selection:text-white pb-24 overflow-x-hidden">
      {/* Subtle Atmospheric Gradient Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(30, 30, 45, 0.35) 0%, rgba(5, 5, 5, 0.8) 60%, #000000 100%)',
        }}
      />

      {/* Header Bar */}
      <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-4">
        {/* Subtle Back Link */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/50 hover:text-white transition-colors group cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1 font-mono">←</span>
            <span>Back to Lumina</span>
          </Link>
        </div>

        {/* Editorial Page Header & Floating Search Row */}
        <motion.section
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            {/* Left Column: Editorial Typography */}
            <div className="lg:col-span-7">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.05em] leading-[0.9] text-white">
                Discover <br />
                <span className="italic">what's happening.</span>
              </h1>

              <p className="text-sm sm:text-base text-white/60 max-w-lg mt-5 leading-relaxed font-normal">
                Movies, concerts, theatre and live arena sports across 15+ Indian cities. Reserve your seats with instant holds and live availability.
              </p>
            </div>

            {/* Right Column: Floating Sleek Liquid-Glass Search & City Filter */}
            <div className="lg:col-span-5 w-full flex flex-col gap-3">
              <div className="liquid-glass rounded-2xl p-2 flex items-center gap-2 border border-white/10 shadow-2xl backdrop-blur-2xl">
                <div className="flex items-center gap-2.5 flex-1 px-3 py-2">
                  <Search className="w-4 h-4 text-white/40 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search movies, concerts, artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="text-white/40 hover:text-white p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* City Dropdown */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-white/50 shrink-0" />
                  <select
                    value={selectedCity || 'All Cities'}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="bg-transparent text-xs text-white/90 font-medium focus:outline-none cursor-pointer pr-1"
                  >
                    {indianCities.map((city) => (
                      <option key={city} value={city} className="bg-neutral-900 text-white">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Pill Filters */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-2 scrollbar-none">
            {[
              { label: 'ALL EVENTS', value: 'ALL' },
              { label: 'MOVIES', value: 'MOVIE' },
              { label: 'CONCERTS', value: 'CONCERT' },
              { label: 'THEATRE', value: 'THEATRE' },
              { label: 'SPORTS', value: 'SPORTS' },
            ].map((tab) => {
              const isActive = selectedType === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTypeChange(tab.value)}
                  className={`relative px-5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'liquid-glass text-white/60 hover:text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-[440px] rounded-3xl liquid-glass border border-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 h-96 rounded-3xl liquid-glass border border-white/10" />
              <div className="md:col-span-5 h-96 rounded-3xl liquid-glass border border-white/10" />
            </div>
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 liquid-glass rounded-3xl border border-white/10 p-8 my-8">
            <Film className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-normal text-white mb-2">No experiences found</h3>
            <p className="text-xs sm:text-sm text-white/50 max-w-sm mx-auto mb-6">
              {searchQuery || selectedCity
                ? `No events found matching "${searchQuery || selectedCity}". Try resetting your filters.`
                : `No events in this category yet. Check back soon for upcoming showtimes.`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedType('ALL');
                setSearchParams({});
              }}
              className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-colors shadow-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-14">
            {/* =========================================================================
                1. FEATURED CINEMATIC SPOTLIGHT EVENT CARD (Dynamic First Event)
               ========================================================================= */}
            {featuredEvent && (
              <motion.section
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={`/events/${featuredEvent.id}`}
                  className="group relative block w-full rounded-3xl overflow-hidden liquid-glass border border-white/10 hover:border-white/25 shadow-2xl transition-all duration-500 hover:shadow-white/5"
                >
                  {/* Full Bleed Image Container */}
                  <div className="relative w-full h-[420px] sm:h-[480px] md:h-[540px] overflow-hidden bg-black">
                    <img
                      src={
                        featuredEvent.banner_url ||
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80'
                      }
                      alt={featuredEvent.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Dark Multi-Stop Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

                    {/* Featured Top Badge */}
                    <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/20">
                        {featuredEvent.event_type}
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/60 text-white/80 backdrop-blur-md border border-white/10">
                        Featured Premiere
                      </span>
                      {featuredEvent.city && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium text-white/70 bg-black/40 backdrop-blur-md border border-white/10">
                          <MapPin className="w-3 h-3 text-white/50" />
                          {featuredEvent.city}
                        </span>
                      )}
                    </div>

                    {/* Duration / Meta Top Right */}
                    <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-white/80 bg-black/60 backdrop-blur-md border border-white/10">
                        {featuredEvent.duration_minutes} mins
                      </span>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end">
                      <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] text-white leading-tight mb-3 max-w-3xl group-hover:text-white/95 transition-colors">
                        {featuredEvent.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-white/70 line-clamp-2 max-w-2xl leading-relaxed mb-6 font-normal">
                        {featuredEvent.description}
                      </p>

                      {/* Footer Row in Card */}
                      <div className="pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/50">Tickets from</div>
                            <div className="text-lg sm:text-xl font-bold text-white">
                              {formatPrice(featuredEvent.min_price)}
                            </div>
                          </div>

                          <div className="h-7 w-px bg-white/15 hidden sm:block" />

                          <div className="hidden sm:block">
                            <div className="text-[10px] uppercase tracking-widest text-white/50">Venue</div>
                            <div className="text-xs font-medium text-white/80">
                              {featuredEvent.venue_name || 'Premier Auditorium'}
                            </div>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <div className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center gap-2 group-hover:bg-white/90 transition-all shadow-xl group-hover:translate-x-1">
                          <span>Explore Event</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.section>
            )}

            {/* =========================================================================
                2. ASYMMETRIC EDITORIAL GRID (Trending This Week)
               ========================================================================= */}
            {displayedEvents.length > 0 && (
              <section className="pt-2">
                <motion.div
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-between mb-8"
                >
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white flex items-center gap-2.5">
                      <Flame className="w-6 h-6 text-amber-400" />
                      Trending <span className="italic text-white/70">this week</span>
                    </h2>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-white/40 font-mono">
                    Showing {displayedEvents.length + 1} of {events.length}
                  </span>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                  {displayedEvents.map((evt, idx) => {
                    // Asymmetric column span pattern: 7 vs 5, 5 vs 7, 4 vs 4 vs 4
                    const pattern = idx % 6;
                    let colSpanClass = 'md:col-span-6';
                    let heightClass = 'h-[380px] sm:h-[430px]';

                    if (pattern === 0) {
                      colSpanClass = 'md:col-span-7';
                      heightClass = 'h-[360px] sm:h-[420px]';
                    } else if (pattern === 1) {
                      colSpanClass = 'md:col-span-5';
                      heightClass = 'h-[380px] sm:h-[440px]';
                    } else if (pattern === 2) {
                      colSpanClass = 'md:col-span-5';
                      heightClass = 'h-[380px] sm:h-[440px]';
                    } else if (pattern === 3) {
                      colSpanClass = 'md:col-span-7';
                      heightClass = 'h-[360px] sm:h-[420px]';
                    } else if (pattern === 4 || pattern === 5) {
                      colSpanClass = 'md:col-span-6';
                      heightClass = 'h-[360px] sm:h-[400px]';
                    }

                    return (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 0.65, delay: 0.1 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className={colSpanClass}
                      >
                        <Link
                          to={`/events/${evt.id}`}
                          className="group relative block rounded-3xl overflow-hidden liquid-glass border border-white/10 hover:border-white/25 shadow-xl transition-all duration-500 hover:shadow-white/5 h-full"
                        >
                          {/* Background Poster Image */}
                          <div className={`relative w-full ${heightClass} overflow-hidden bg-black`}>
                            <img
                              src={
                                evt.banner_url ||
                                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80'
                              }
                              alt={evt.title}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&auto=format&fit=crop&q=80';
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                            />

                            {/* Dark Vignette Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />

                            {/* Top Badges */}
                            <div className="absolute top-5 left-5 flex items-center gap-1.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white backdrop-blur-md border border-white/20">
                                {evt.event_type}
                              </span>
                              {evt.city && (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/80 bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-white/50" />
                                  {evt.city}
                                </span>
                              )}
                            </div>

                            {/* Duration Tag */}
                            <div className="absolute top-5 right-5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-white/75 bg-black/60 backdrop-blur-md border border-white/10">
                                {evt.duration_minutes}m
                              </span>
                            </div>

                            {/* Bottom Card Content */}
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col justify-end">
                              <h3 className="text-xl sm:text-2xl md:text-3xl font-normal tracking-tight text-white leading-tight mb-2 group-hover:text-white/90 transition-colors line-clamp-1">
                                {evt.title}
                              </h3>

                              <p className="text-xs text-white/60 line-clamp-2 mb-4 leading-relaxed font-normal">
                                {evt.description}
                              </p>

                              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-white/40">Tickets from</div>
                                  <div className="text-base font-bold text-white">
                                    {formatPrice(evt.min_price)}
                                  </div>
                                </div>

                                <span className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold tracking-wide flex items-center gap-1.5 group-hover:bg-white/90 transition-all group-hover:translate-x-0.5">
                                  <span>Select Seats</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mt-12 text-center"
                  >
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 rounded-full liquid-glass border border-white/20 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
                    >
                      Load More Experiences ({remainingEvents.length - visibleCount} remaining) ↓
                    </button>
                  </motion.div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Editorial Liquid Glass Footer */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 mt-20">
        <Footer />
      </div>
    </div>
  );
}
