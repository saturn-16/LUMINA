import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import ConcertAtmosphere from '../components/ConcertAtmosphere';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import Stats from '../components/Stats';
import Footer from '../components/Footer';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleBookClick = () => {
    navigate('/events');
  };

  const handleSearch = (query, city) => {
    const params = new URLSearchParams();
    if (query && query.trim()) params.append('query', query.trim());
    if (city && city.trim()) params.append('city', city.trim());
    navigate(`/events?${params.toString()}`);
  };

  const handleCategorySelect = (category) => {
    if (category === 'Movies') {
      navigate('/events?type=MOVIE');
    } else if (category === 'Concerts') {
      navigate('/events?type=CONCERT');
    } else {
      navigate('/events');
    }
  };

  return (
    <main className="relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white bg-black text-white">
      {/* 
        ========================================================================
        GENUINE LIVE CONCERT FESTIVAL BACKGROUND LAYER
        Photorealistic concert stage, dense crowd, moving lights, floating embers
        ========================================================================
      */}
      <ConcertAtmosphere />

      {/* Content Wrapper */}
      <div className="relative z-10 flex min-h-[115vh] w-full max-w-7xl flex-col px-5 pb-5 md:px-8 md:pb-8">
        {/* Minimal Luxury Navigation */}
        <Navbar onBookClick={handleBookClick} />

        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center pt-20 md:pt-28 pb-12 text-center w-full">
          {/* 1. Live Badge (Delay: 0.2s) */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="liquid-glass rounded-full px-4 py-1.5 inline-flex items-center gap-2 mb-8 shadow-xl cursor-pointer"
            onClick={() => navigate('/events')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] md:text-xs uppercase tracking-widest text-white/90 font-medium">
              LIVE EXPERIENCES ACROSS INDIA
            </span>
          </motion.div>

          {/* 2. Main Hero Heading (Delay: 0.45s) */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
            className="text-[3.7rem] sm:text-6xl md:text-8xl lg:text-[7.4rem] tracking-[-0.065em] leading-[0.86] text-white font-normal mb-8 max-w-5xl"
          >
            Your next <br />
            <span className="italic">unforgettable</span> <br />
            night.
          </motion.h1>

          {/* 3. Hero Description (Delay: 0.8s) */}
          <motion.p
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            className="text-sm md:text-base leading-relaxed text-white/75 max-w-xl text-center mb-10 px-2"
          >
            Discover movies, concerts and live experiences across India. Pick your city, find your moment, and book your seats without the noise.
          </motion.p>

          {/* 4. Main Search / Explore Bar (Delay: 1.05s) */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.05, ease: 'easeOut' }}
            className="w-full flex justify-center mb-6"
          >
            <SearchBar onSearch={handleSearch} />
          </motion.div>

          {/* 5. Category Pills (Delay: 1.25s) */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.25, ease: 'easeOut' }}
            className="mb-14"
          >
            <CategoryPills onSelectCategory={handleCategorySelect} />
          </motion.div>

          {/* 6. Statistics (Delay: 1.45s) */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 1.45, ease: 'easeOut' }}
            className="w-full flex justify-center cursor-pointer"
            onClick={() => navigate('/events')}
          >
            <Stats />
          </motion.div>
        </section>

        {/* Liquid Glass Footer */}
        <Footer />
      </div>
    </main>
  );
}
