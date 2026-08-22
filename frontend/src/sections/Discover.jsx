import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FadingVideo from '../components/FadingVideo';
import EventCard from '../components/EventCard';
import { TicketIcon } from '../components/Icons';

const DISCOVER_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4';

const CATEGORIES = ['All', 'Movies', 'Concerts', 'Sports', 'Theatre', 'Events'];

const FEATURED_EVENTS = [
  {
    id: 1,
    category: 'MOVIE',
    categoryFilter: 'Movies',
    title: 'Interstellar',
    date: 'Sat, 29 Aug',
    time: '7:30 PM',
    venue: 'PVR ICON IMAX',
    city: 'Mumbai',
    price: 'From ₹249',
    availability: 'AVAILABLE',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    category: 'LIVE MUSIC',
    categoryFilter: 'Concerts',
    title: 'Arijit Singh Live',
    date: 'Sun, 13 Sep',
    time: '7:00 PM',
    venue: 'Jawaharlal Nehru Stadium',
    city: 'New Delhi',
    price: 'From ₹999',
    availability: 'SELLING FAST',
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    category: 'CONCERT',
    categoryFilter: 'Concerts',
    title: 'Echoes After Dark',
    date: 'Fri, 4 Sep',
    time: '8:00 PM',
    venue: 'Phoenix Arena',
    city: 'Bengaluru',
    price: 'From ₹799',
    availability: 'SOLD OUT',
    imageUrl:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function Discover({ onOpenMyTickets, onSelectEvent }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredEvents =
    activeCategory === 'All'
      ? FEATURED_EVENTS
      : FEATURED_EVENTS.filter((e) => e.categoryFilter === activeCategory);

  return (
    <section
      id="discover"
      className="min-h-screen overflow-hidden bg-black relative flex flex-col justify-between select-none py-16"
    >
      {/* Background Cinematic Video */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <FadingVideo
          src={DISCOVER_VIDEO_URL}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Dark cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black z-0" />
      </div>

      <div className="relative z-10 px-6 sm:px-12 lg:px-20 pt-16 pb-8 flex flex-col min-h-screen max-w-7xl mx-auto w-full justify-between">
        <div>
          {/* Header */}
          <div className="max-w-3xl mb-10">
            <motion.div
              initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
              whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-sm font-body text-white/80 mb-3"
            >
              // Discover
            </motion.div>

            <motion.h2
              initial={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
              whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="font-heading italic text-5xl sm:text-6xl md:text-7xl lg:text-[6rem] leading-[0.92] tracking-[-3px] text-white"
            >
              Find your next reason to go.
            </motion.h2>
          </div>

          {/* Liquid Glass Category Filter with Animated layoutId */}
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-5 py-2 rounded-full text-xs font-medium font-body transition-all shrink-0 cursor-pointer ${
                    isActive ? 'text-black font-semibold' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryPill"
                      className="absolute inset-0 rounded-full bg-white shadow-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {!isActive && <div className="absolute inset-0 rounded-full liquid-glass" />}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Featured Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ filter: 'blur(10px)', opacity: 0, y: 40 }}
                  whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.2 + idx * 0.15,
                    ease: 'easeOut',
                  }}
                >
                  <EventCard
                    category={event.category}
                    title={event.title}
                    date={event.date}
                    time={event.time}
                    venue={event.venue}
                    city={event.city}
                    price={event.price}
                    availability={event.availability}
                    imageUrl={event.imageUrl}
                    onBook={() => onSelectEvent && onSelectEvent(event)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Floating "My Tickets" Button (Bottom Right) */}
        <div className="mt-12 flex justify-end">
          <motion.button
            onClick={onOpenMyTickets}
            initial={{ filter: 'blur(10px)', opacity: 0, scale: 0.9 }}
            whileInView={{ filter: 'blur(0px)', opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            animate={{
              y: [0, -6, 0],
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 3,
                ease: 'easeInOut',
              },
              duration: 0.8,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="liquid-glass-strong rounded-full px-5 py-3 flex items-center gap-2.5 text-xs font-semibold text-white shadow-2xl border border-white/20 hover:border-white/40 transition-all cursor-pointer backdrop-blur-3xl"
          >
            <TicketIcon className="w-4 h-4 text-white" />
            <span>My Tickets</span>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
