import React, { useState } from 'react';
import { Search, MapPin, ChevronDown, ArrowUpRight } from 'lucide-react';

export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Lucknow',
  'Indore',
  'Bhopal',
  'Kochi',
  'Goa',
];

export default function SearchBar({ onSearch }) {
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [query, setQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query, selectedCity);
  };

  return (
    <div className="w-full max-w-3xl relative">
      <form
        onSubmit={handleSubmit}
        className="liquid-glass rounded-2xl md:rounded-full p-2 md:p-2.5 flex flex-col md:flex-row items-center gap-2.5 shadow-2xl transition-all"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 px-4 py-2 w-full">
          <Search className="w-5 h-5 text-white/50 shrink-0" />
          <input
            type="text"
            placeholder="Search movies, concerts, artists or events"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm md:text-base text-white placeholder-white/40 focus:outline-none"
          />
        </div>

        {/* City Selector & Action Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto px-2 md:px-0">
          {/* City Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityOpen(!cityOpen)}
              className="liquid-glass rounded-full px-3.5 py-2 flex items-center gap-2 text-xs md:text-sm font-medium text-white/90 hover:text-white transition-all cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-white/70" />
              <span>{selectedCity}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/50 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* City Dropdown Menu */}
            {cityOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-44 max-h-56 overflow-y-auto liquid-glass rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl border border-white/10">
                {INDIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setCityOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      selectedCity === city
                        ? 'bg-white text-black font-semibold'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explore CTA Button */}
          <button
            type="submit"
            className="liquid-glass rounded-full px-5 py-2 text-xs md:text-sm font-medium text-white flex items-center gap-1.5 hover:bg-white/15 hover:scale-105 transition-all shadow-lg shrink-0 cursor-pointer"
          >
            <span>Explore</span>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>
        </div>
      </form>
    </div>
  );
}
