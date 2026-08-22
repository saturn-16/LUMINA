import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Search, Film, Music, Calendar, MapPin, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import GalaxyBackground from '../components/GalaxyBackground';

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

  useEffect(() => {
    setSelectedType(searchParams.get('type') || 'ALL');
    setSearchQuery(searchParams.get('query') || '');
    setSelectedCity(searchParams.get('city') || '');
  }, [searchParams]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const params = {};
        if (selectedType !== 'ALL') params.event_type = selectedType;
        if (searchQuery.trim()) params.query = searchQuery.trim();
        if (selectedCity.trim()) params.city = selectedCity.trim();

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

  return (
    <div className="relative min-h-screen text-slate-100 pb-16 overflow-x-hidden">
      {/* Galaxy Background */}
      <GalaxyBackground />

      {/* Header Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Navbar />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lumina Premiere Home
        </Link>

        {/* Hero Discovery Banner */}
        <div className="relative rounded-3xl overflow-hidden liquid-glass border border-white/10 p-6 sm:p-10 mb-10 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Live Seating & Instant Waitlist Reallocation
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              Book Movies, Concerts & Live Shows
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              Interactive 2D visual seat maps, temporary holds with 10-min TTL, zero double-booking, and automatic waitlist queue reallocation on cancellations.
            </p>

            {/* Search Filter Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 liquid-glass p-2 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 flex-1 px-3 py-2 bg-black/40 rounded-xl border border-white/10">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search movies, concerts, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-xl border border-white/10 sm:w-48">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="City (e.g. Mumbai)"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              selectedType === 'ALL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'liquid-glass text-slate-400 hover:text-slate-200 border border-white/10'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setSelectedType('MOVIE')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              selectedType === 'MOVIE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'liquid-glass text-slate-400 hover:text-slate-200 border border-white/10'
            }`}
          >
            <Film className="w-4 h-4" />
            Movies
          </button>
          <button
            onClick={() => setSelectedType('CONCERT')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              selectedType === 'CONCERT'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'liquid-glass text-slate-400 hover:text-slate-200 border border-white/10'
            }`}
          >
            <Music className="w-4 h-4" />
            Concerts
          </button>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl liquid-glass border border-white/10 animate-pulse"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 liquid-glass rounded-3xl border border-white/10">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No events found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Link
                key={evt.id}
                to={`/events/${evt.id}`}
                className="group liquid-glass rounded-3xl overflow-hidden border border-white/10 hover:border-blue-400/50 transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-xl"
              >
                {/* Event Image */}
                <div className="relative h-48 w-full overflow-hidden bg-black/60">
                  <img
                    src={evt.banner_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                      evt.event_type === 'MOVIE'
                        ? 'bg-blue-900/80 text-blue-200 border border-blue-400/30'
                        : 'bg-purple-900/80 text-purple-200 border border-purple-400/30'
                    }`}>
                      {evt.event_type}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 border border-white/10">
                    {evt.duration_minutes} mins
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                      {evt.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Tickets From</div>
                      <div className="text-base font-bold text-slate-100">
                        {evt.min_price ? `$${evt.min_price.toFixed(2)}` : 'Pricing TBA'}
                      </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center gap-1">
                      Select Seats <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
