import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Menu, X, User, LogOut, Shield, LayoutDashboard, Film, Music } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleBook = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      navigate('/events');
    }
  };

  return (
    <header className="w-full pt-6 pb-4 relative z-50">
      <nav className="w-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
          <LuminaLogo className="w-6 h-6 text-white" />
          <span className="text-xl font-medium tracking-tight">LUMINA</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-sm text-white/80 font-normal">
          <Link to="/events?type=MOVIE" className="hover:text-white transition-colors">
            Movies
          </Link>
          <Link to="/events?type=CONCERT" className="hover:text-white transition-colors">
            Concerts
          </Link>
          <Link to="/events" className="hover:text-white transition-colors">
            Events
          </Link>
          <Link to="/events" className="hover:text-white transition-colors">
            Cities
          </Link>
          <Link to="/dashboard" className="hover:text-white transition-colors">
            My Tickets
          </Link>

          {/* Role Portals */}
          {user?.role === 'ORGANISER' && (
            <Link to="/organiser" className="text-purple-400 hover:text-purple-300 font-medium">
              Studio
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="text-amber-400 hover:text-amber-300 font-medium">
              Admin
            </Link>
          )}
        </div>

        {/* Desktop Action Controls (User Profile / Auth + Book Tickets) */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="liquid-glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer"
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
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 liquid-glass-strong rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl border border-white/10 flex flex-col gap-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>My Dashboard & Tickets</span>
                  </Link>

                  {user?.role === 'ORGANISER' && (
                    <Link
                      to="/organiser"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-950/40 flex items-center gap-2 transition-colors"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Organiser Studio</span>
                    </Link>
                  )}

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-amber-300 hover:bg-amber-950/40 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Console</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/40 flex items-center gap-2 transition-colors text-left w-full cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              Sign In
            </Link>
          )}

          {/* Book Tickets CTA */}
          <button
            onClick={handleBook}
            className="liquid-glass rounded-full px-5 py-2 text-sm font-medium text-white flex items-center gap-1.5 hover:bg-white/10 hover:scale-[1.02] transition-all cursor-pointer shadow-lg"
          >
            <span>Book Tickets</span>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="liquid-glass h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
            >
              {user?.full_name?.charAt(0) || 'U'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="liquid-glass rounded-full px-3 py-1.5 text-xs font-medium text-white"
            >
              Login
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="liquid-glass h-10 w-10 rounded-full flex items-center justify-center text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 liquid-glass rounded-2xl p-5 flex flex-col gap-3 border border-white/10 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            to="/events?type=MOVIE"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-white/90 hover:text-white py-1"
          >
            Movies
          </Link>
          <Link
            to="/events?type=CONCERT"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-white/90 hover:text-white py-1"
          >
            Concerts
          </Link>
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-white/90 hover:text-white py-1"
          >
            All Events
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-white/90 hover:text-white py-1"
          >
            My Tickets
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
            className="mt-2 w-full liquid-glass rounded-xl py-2.5 text-sm font-medium text-white flex items-center justify-center gap-2"
          >
            <span>Book Tickets</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
}
