import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FadingVideo from '../components/FadingVideo';
import BlurText from '../components/BlurText';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import { TicketIcon, GlobeIcon } from '../components/Icons';

const HERO_VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4';

const TRUST_TAGS = ['CINEMA', 'LIVE MUSIC', 'SPORTS', 'THEATRE', 'FESTIVALS'];

export default function Hero({ onSearch, onSelectCategory, onScrollToDiscover }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    if (onSelectCategory) onSelectCategory(cat);
    if (onScrollToDiscover) onScrollToDiscover();
  };

  const handleSearchSubmit = (query, city) => {
    if (onSearch) onSearch(query, city);
    if (onScrollToDiscover) onScrollToDiscover();
  };

  return (
    <section id="hero" className="h-screen overflow-hidden bg-black relative flex flex-col justify-between select-none">
      {/* Cinematic Background Video */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        <FadingVideo
          src={HERO_VIDEO_URL}
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: '120%', height: '120%' }}
        />
        {/* Dark cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-0" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/90 z-0" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 pb-8 px-4 text-center max-w-5xl mx-auto w-full">
        {/* Badge (Delay: 0.4s) */}
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="liquid-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-6 shadow-xl"
        >
          <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs font-medium text-white/90 font-body">
            Movies, concerts & unforgettable experiences across India
          </span>
        </motion.div>

        {/* Headline (Delay: 0.5s via BlurText) */}
        <div className="mb-4">
          <BlurText
            text="Your Next Experience Starts Here"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.88] tracking-[-3px] sm:tracking-[-4px] max-w-4xl"
          />
        </div>

        {/* Subtext (Delay: 0.8s) */}
        <motion.p
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
          className="text-sm md:text-base text-white/80 max-w-2xl font-body font-light leading-relaxed mb-8 px-2"
        >
          Discover movies and concerts across India. Choose your city, find your event, and get closer to the moments you don't want to miss.
        </motion.p>

        {/* Search / Discovery Bar (Delay: 1.0s) */}
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
          className="w-full flex justify-center mb-6"
        >
          <SearchBar onSearch={handleSearchSubmit} />
        </motion.div>

        {/* Category Pills (Delay: 1.15s) */}
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15, ease: 'easeOut' }}
          className="mb-8"
        >
          <CategoryPills
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryClick}
          />
        </motion.div>

        {/* Hero Stats Cards (Delay: 1.3s) */}
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease: 'easeOut' }}
          className="hidden sm:flex items-center justify-center gap-4"
        >
          {/* Card 1 */}
          <div className="liquid-glass p-4 sm:p-5 w-[190px] sm:w-[220px] rounded-[1.25rem] text-left shadow-xl">
            <div className="flex items-center justify-between text-white/70">
              <TicketIcon className="w-4 h-4" />
              <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Live</span>
            </div>
            <div className="text-3xl sm:text-4xl font-heading italic tracking-[-1px] leading-none mt-3 text-white">
              1000+
            </div>
            <div className="text-xs text-white/60 font-body mt-1">
              Events Across India
            </div>
          </div>

          {/* Card 2 */}
          <div className="liquid-glass p-4 sm:p-5 w-[190px] sm:w-[220px] rounded-[1.25rem] text-left shadow-xl">
            <div className="flex items-center justify-between text-white/70">
              <GlobeIcon className="w-4 h-4" />
              <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">Pan-India</span>
            </div>
            <div className="text-3xl sm:text-4xl font-heading italic tracking-[-1px] leading-none mt-3 text-white">
              50+
            </div>
            <div className="text-xs text-white/60 font-body mt-1">
              Cities & Growing
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Trust Bar (Delay: 1.4s) */}
      <motion.div
        initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
        animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }}
        className="relative z-10 pb-6 px-4 flex flex-col items-center gap-3"
      >
        <div className="liquid-glass rounded-full px-4 py-1 text-[11px] font-medium text-white/70 tracking-wide">
          Trusted for movies, concerts, and live experiences across India
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12 md:gap-16 flex-wrap opacity-60 hover:opacity-100 transition-opacity">
          {TRUST_TAGS.map((tag) => (
            <span
              key={tag}
              className="font-heading italic text-lg sm:text-2xl md:text-3xl tracking-tight text-white/70 select-none"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
