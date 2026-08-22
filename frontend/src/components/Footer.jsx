import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LuminaLogo } from './Navbar';

function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Footer() {
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune'];

  const discoverLinks = [
    { label: 'Movies & Concerts', to: '/events' },
    { label: 'Live Experiences', to: '/events' },
    { label: 'Cities', to: '/events' },
    { label: 'Popular Events', to: '/events' },
    { label: 'Coming Soon', to: '/events' },
  ];

  const platformLinks = [
    { label: 'How It Works', to: '/' },
    { label: 'Seat Selection', to: '/events' },
    { label: 'My Tickets', to: '/dashboard' },
    { label: 'Waitlist System', to: '/dashboard' },
    { label: 'For Organisers', to: '/organiser' },
  ];

  const conciergeLinks = [
    { label: 'My Experience Wallet', to: '/dashboard' },
    { label: 'Live Event Support', to: '/dashboard' },
    { label: 'Organiser Studio', to: '/organiser' },
    { label: 'Admin Portal', to: '/admin' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: 0.4,
        ease: 'easeOut',
      }}
      className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-28 md:mt-48 shadow-2xl relative z-10 border border-white/10"
    >
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
        {/* First Column: Brand Info */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-white mb-4 hover:opacity-90 transition-opacity">
              <LuminaLogo className="w-6 h-6 text-white" />
              <span className="text-xl font-medium tracking-tight">LUMINA</span>
            </Link>

            <p className="text-sm leading-relaxed max-w-sm text-white/70 mb-6 font-normal">
              Lumina brings premium clarity to movies, concerts and live experiences across India — helping you find the moments worth showing up for.
            </p>

            {/* City Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {cities.map((city) => (
                <Link
                  key={city}
                  to={`/events?city=${city}`}
                  className="liquid-glass rounded-full px-3.5 py-1 text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Links Columns (3 Columns) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Column 1: Discover */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-semibold mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {discoverLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: The Platform */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-semibold mb-4">
              The Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Concierge */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-semibold mb-4">
              Concierge
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {conciergeLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Curation Attribution */}
        <p className="text-[11px] uppercase tracking-widest text-white/50 font-mono">
          Lumina • Digital Reservation Engine
        </p>

        {/* Right GitHub Repository Link */}
        <div>
          <a
            href="https://github.com/saturn-16/Ticket-Booking"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass border border-white/15 hover:bg-white/10 text-xs font-mono text-white/80 hover:text-white transition-all shadow-md group"
          >
            <GithubIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            <span>GitHub Repository</span>
            <span className="font-sans text-[10px] text-white/40 group-hover:text-white transition-colors">↗</span>
          </a>
        </div>
      </div>
    </motion.footer>
  );
}
