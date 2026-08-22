import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LuminaLogo } from './Navbar';
import {
  Layers,
  Cpu,
  ArrowUpRight,
  Code2,
} from 'lucide-react';

function GithubIcon({ className = 'w-3.5 h-3.5' }) {
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
  const techStack = [
    'FastAPI (Python 3.11)',
    'SQLAlchemy Async',
    'PostgreSQL / SQLite',
    'React 19 + Vite',
    'Tailwind CSS',
    'WebSockets',
  ];

  const systemFeatures = [
    { label: 'High-Concurrency Seat Holds (TTL)', to: '/events' },
    { label: 'Distributed Pessimistic Locking', to: '/events' },
    { label: 'Automated FIFO Waitlist Reallocation', to: '/dashboard' },
    { label: 'Real-Time WebSocket Seat Mesh', to: '/events' },
    { label: 'Cryptographic QR Entry Passes', to: '/dashboard' },
  ];

  const rolePortals = [
    { label: 'Customer Experience Wallet', to: '/dashboard' },
    { label: 'Live Events Discovery', to: '/events' },
    { label: 'Organiser Studio Portal', to: '/organiser' },
    { label: 'System Admin Console', to: '/admin' },
  ];

  const devResources = [
    {
      label: 'GitHub Repository',
      href: 'https://github.com/saturn-16/Ticket-Booking',
      external: true,
    },
    {
      label: 'FastAPI Interactive Docs',
      href: 'http://127.0.0.1:8000/docs',
      external: true,
    },
    {
      label: 'OpenAPI Specification',
      href: 'http://127.0.0.1:8000/openapi.json',
      external: true,
    },
    {
      label: 'Backend Health Check',
      href: 'http://127.0.0.1:8000/api/health',
      external: true,
    },
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-10">
        {/* First Column: Project Identity & Tech Stack */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <Link
              to="/"
              className="flex items-center gap-2.5 text-white mb-3 hover:opacity-90 transition-opacity"
            >
              <LuminaLogo className="w-6 h-6 text-white" />
              <span className="text-xl font-medium tracking-tight">LUMINA</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/15 text-white/90 border border-white/20 ml-1">
                Project v1.0
              </span>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-white/70 mb-5 font-normal">
              An open-source high-concurrency ticket reservation engine featuring distributed pessimistic locking, automated FIFO waitlist reallocations, and server-side QR passes.
            </p>

            {/* Tech Stack Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-white/80 bg-white/5 border border-white/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Links Columns (3 Columns) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Column 1: Core Architecture */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-white/60" />
              Architecture
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {systemFeatures.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Role Portals */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-white/60" />
              Role Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {rolePortals.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/40">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Dev & Source */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-white font-bold mb-4 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-white/60" />
              Repository & API
            </h4>
            <ul className="space-y-2.5 text-xs text-white/70 font-normal">
              {devResources.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-white/40 group-hover:text-white transition-colors" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Author Attribution */}
        <div className="flex items-center gap-2 text-[11px] text-white/60 font-mono">
          <span>Project by</span>
          <span className="font-bold text-white">Gaurav Kumar</span>
          <span className="text-white/20">•</span>
          <a
            href="https://github.com/saturn-16/Ticket-Booking"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1 underline underline-offset-4 decoration-white/20 hover:decoration-white"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>FastAPI Engine Operational</span>
        </div>
      </div>
    </motion.footer>
  );
}
