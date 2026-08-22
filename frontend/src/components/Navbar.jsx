import React, { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';

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

  const navLinks = ['Movies', 'Concerts', 'Events', 'Cities', 'My Tickets'];

  return (
    <header className="w-full pt-6 pb-4">
      <nav className="w-full flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity">
          <LuminaLogo className="w-6 h-6 text-white" />
          <span className="text-xl font-medium tracking-tight">LUMINA</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-white/80 font-normal">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Desktop Book Tickets CTA */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onBookClick}
            className="liquid-glass rounded-full px-5 py-2 text-sm font-medium text-white flex items-center gap-1.5 hover:bg-white/10 hover:scale-[1.02] transition-all cursor-pointer shadow-lg"
          >
            <span>Book Tickets</span>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="liquid-glass h-11 w-11 rounded-full flex items-center justify-center text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 liquid-glass rounded-2xl p-5 flex flex-col gap-4 border border-white/10 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-white/90 hover:text-white py-1"
            >
              {link}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              if (onBookClick) onBookClick();
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
