import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowUpRight,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  LayoutDashboard,
  Film,
  Music,
  MapPin,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LuminaLogo({ className = 'w-6 h-6' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={className}
    >
      <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136.034 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
    </svg>
  );
}

export default function Navbar({ onBookClick }) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const [citiesDropdownOpen, setCitiesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBook = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      navigate('/events');
    }
  };

  const navLinks = [
    { label: 'Movies', to: '/events?type=MOVIE', key: 'movies' },
    { label: 'Concerts', to: '/events?type=CONCERT', key: 'concerts' },
    { label: 'Events', to: '/events', key: 'events' },
    { label: 'Cities', to: '#cities', isDropdown: true, key: 'cities' },
    { label: 'My Tickets', to: '/dashboard', key: 'dashboard' },
  ];

  const popularCities = [
    { name: 'Mumbai', state: 'Maharashtra', count: '12+ Shows' },
    { name: 'Delhi', state: 'NCR', count: '9+ Shows' },
    { name: 'Bengaluru', state: 'Karnataka', count: '14+ Shows' },
    { name: 'Hyderabad', state: 'Telangana', count: '8+ Shows' },
    { name: 'Pune', state: 'Maharashtra', count: '6+ Shows' },
    { name: 'Goa', state: 'Live Festivals', count: '5+ Shows' },
    { name: 'Chennai', state: 'Tamil Nadu', count: '7+ Shows' },
    { name: 'Kolkata', state: 'West Bengal', count: '5+ Shows' },
  ];

  const handleCitySelect = (cityName) => {
    setCitiesDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate(`/events?city=${encodeURIComponent(cityName)}`);
  };

  const isLinkActive = (item) => {
    if (item.key === 'movies') return location.pathname === '/events' && location.search.includes('type=MOVIE');
    if (item.key === 'concerts') return location.pathname === '/events' && location.search.includes('type=CONCERT');
    if (item.key === 'events') return location.pathname === '/events' && !location.search.includes('type=');
    if (item.key === 'dashboard') return location.pathname === '/dashboard';
    return false;
  };

  return (
    <header className="w-full pt-6 pb-4 relative z-50">
      <nav className="w-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity group"
        >
          <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
            <LuminaLogo className="w-6 h-6 text-white" />
          </motion.div>
          <span className="text-xl font-medium tracking-tight">LUMINA</span>
        </Link>

        {/* Interactive Desktop Navigation Links with Floating Pill Slider */}
        <div
          onMouseLeave={() => {
            setHoveredNav(null);
            setCitiesDropdownOpen(false);
          }}
          className="hidden md:flex items-center relative liquid-glass rounded-full px-2 py-1.5 border border-white/10 shadow-2xl backdrop-blur-2xl"
        >
          {navLinks.map((item) => {
            const active = isLinkActive(item);
            const isHovered = hoveredNav === item.key;

            if (item.isDropdown) {
              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => {
                    setHoveredNav(item.key);
                    setCitiesDropdownOpen(true);
                  }}
                >
                  <button
                    onClick={() => setCitiesDropdownOpen(!citiesDropdownOpen)}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                      citiesDropdownOpen || isHovered
                        ? 'text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        citiesDropdownOpen ? 'rotate-180 text-white' : 'text-white/50'
                      }`}
                    />
                  </button>

                  {/* Cities Floating Flyout Dropdown */}
                  <AnimatePresence>
                    {citiesDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-72 liquid-glass-strong rounded-3xl p-3 border border-white/15 shadow-2xl backdrop-blur-3xl z-50"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-3 py-1.5 flex items-center justify-between">
                          <span>Top Indian Cities</span>
                          <MapPin className="w-3 h-3 text-white/40" />
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-1">
                          {popularCities.map((city) => (
                            <button
                              key={city.name}
                              onClick={() => handleCitySelect(city.name)}
                              className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 text-left transition-all group cursor-pointer"
                            >
                              <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                                {city.name}
                              </div>
                              <div className="text-[9px] text-white/50">{city.state}</div>
                            </button>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/10 px-1">
                          <button
                            onClick={() => {
                              setCitiesDropdownOpen(false);
                              navigate('/events');
                            }}
                            className="w-full py-1.5 text-center text-[10px] uppercase font-bold tracking-wider text-white/60 hover:text-white transition-colors"
                          >
                            Explore All 15+ Cities →
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.to}
                onMouseEnter={() => {
                  setHoveredNav(item.key);
                  setCitiesDropdownOpen(false);
                }}
                className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  active ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
                }`}
              >
                {/* Floating Animated Pill Background */}
                {isHovered && (
                  <motion.div
                    layoutId="nav-pill-bg"
                    className="absolute inset-0 bg-white/15 rounded-full -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Active Indicator Dot */}
                {active && !isHovered && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white shadow-sm"
                  />
                )}

                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Role Portals */}
          {user?.role === 'ORGANISER' && (
            <Link
              to="/organiser"
              onMouseEnter={() => setHoveredNav('organiser')}
              className="relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-purple-300 hover:text-white transition-colors"
            >
              Studio
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onMouseEnter={() => setHoveredNav('admin')}
              className="relative z-10 px-3 py-1.5 rounded-full text-xs font-medium text-amber-300 hover:text-white transition-colors"
            >
              Admin
            </Link>
          )}
        </div>

        {/* Desktop Action Controls (User Profile / Auth + Book Tickets) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="liquid-glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer border border-white/10 shadow-lg"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span>{user?.full_name?.split(' ')[0]}</span>
                {user?.role !== 'CUSTOMER' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white/15 text-white/90">
                    {user?.role}
                  </span>
                )}
              </motion.button>

              {/* User Dropdown */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 liquid-glass-strong rounded-2xl p-2 shadow-2xl backdrop-blur-3xl border border-white/15 flex flex-col gap-1 z-50"
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>My Tickets Wallet</span>
                    </Link>

                    {user?.role === 'ORGANISER' && (
                      <Link
                        to="/organiser"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Organiser Studio</span>
                      </Link>
                    )}

                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:bg-amber-950/40 flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-white/10" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/40 flex items-center gap-2.5 transition-colors text-left w-full cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10"
            >
              Sign In
            </Link>
          )}

          {/* Book Tickets CTA */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBook}
            className="liquid-glass rounded-full px-5 py-2 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/15 transition-all cursor-pointer shadow-xl border border-white/15 group"
          >
            <span>Book Tickets</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="liquid-glass h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/10"
            >
              {user?.full_name?.charAt(0) || 'U'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="liquid-glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white border border-white/10"
            >
              Login
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="liquid-glass h-10 w-10 rounded-full flex items-center justify-center text-white border border-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-3 liquid-glass rounded-3xl p-6 flex flex-col gap-3 border border-white/15 shadow-2xl backdrop-blur-3xl"
          >
            <Link
              to="/events?type=MOVIE"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 flex items-center justify-between"
            >
              <span>Movies</span>
              <span className="text-[10px] text-white/40 font-mono">CINEMA</span>
            </Link>
            <Link
              to="/events?type=CONCERT"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 flex items-center justify-between"
            >
              <span>Concerts</span>
              <span className="text-[10px] text-white/40 font-mono">LIVE ARENA</span>
            </Link>
            <Link
              to="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1 flex items-center justify-between"
            >
              <span>All Events</span>
              <span className="text-[10px] text-white/40 font-mono">EXPLORE</span>
            </Link>

            {/* City Pills in Mobile */}
            <div className="py-2 border-y border-white/10">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-2">
                Filter By City
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Goa'].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCitySelect(c)}
                    className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-white/80 hover:bg-white/20"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1"
            >
              My Tickets Wallet
            </Link>

            {user?.role === 'ORGANISER' && (
              <Link
                to="/organiser"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-purple-300 py-1"
              >
                Organiser Studio
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-amber-300 py-1"
              >
                Admin Console
              </Link>
            )}

            {isAuthenticated && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="text-sm font-medium text-red-400 py-1 text-left"
              >
                Sign Out
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/events');
              }}
              className="mt-2 w-full liquid-glass rounded-2xl py-3 text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 border border-white/15"
            >
              <span>Book Tickets</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
