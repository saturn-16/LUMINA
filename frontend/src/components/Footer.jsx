import React from 'react';
import { motion } from 'motion/react';
import { LuminaLogo } from './Navbar';
import { Music2 } from 'lucide-react';
import { Facebook, Twitter, Youtube, Instagram } from './Icons';

export default function Footer() {
  const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune'];

  const discoverLinks = [
    'Movies & Concerts',
    'Live Experiences',
    'Cities',
    'Popular Events',
    'Coming Soon',
  ];

  const platformLinks = [
    'How It Works',
    'Seat Selection',
    'My Tickets',
    'Waitlist',
    'For Organisers',
  ];

  const conciergeLinks = [
    'Get in Touch',
    'Legal Privacy',
    'User Agreement',
    'Help Center',
    'Report Concern',
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
      className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-32 md:mt-64 shadow-2xl"
    >
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
        {/* First Column: Brand Info */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-white mb-4">
              <LuminaLogo className="w-6 h-6 text-white" />
              <span className="text-xl font-medium tracking-tight">LUMINA</span>
            </div>

            <p className="text-sm leading-relaxed max-w-sm text-white/70 mb-6">
              Lumina brings premium clarity to movies, concerts and live experiences across India — helping you find the moments worth showing up for.
            </p>

            {/* City Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {cities.map((city) => (
                <span
                  key={city}
                  className="liquid-glass rounded-full px-3 py-1 text-[11px] font-medium text-white/60"
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Links Columns (3 Columns) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Column 1: Discover */}
          <div>
            <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              {discoverLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: The Platform */}
          <div>
            <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
              The Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              {platformLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Concierge */}
          <div>
            <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">
              Concierge
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70">
              {conciergeLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        {/* Left Curation Attribution */}
        <p className="text-[10px] uppercase tracking-widest opacity-50">
          Curated by @GotInGeorgiG
        </p>

        {/* Right Social Links */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest opacity-50">
            Join the Journey:
          </span>
          <div className="flex items-center gap-3">
            <a href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white" aria-label="Music">
              <Music2 size={16} />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white" aria-label="Facebook">
              <Facebook size={16} />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white" aria-label="Twitter">
              <Twitter size={16} />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white" aria-label="YouTube">
              <Youtube size={16} />
            </a>
            <a href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white" aria-label="Instagram">
              <Instagram size={16} />
            </a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
