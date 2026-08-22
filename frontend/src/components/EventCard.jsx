import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from './Icons';

export default function EventCard({
  category,
  title,
  date,
  time,
  venue,
  city,
  price,
  availability = 'AVAILABLE',
  imageUrl,
  onBook,
}) {
  const isSoldOut = availability === 'SOLD OUT';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="liquid-glass rounded-[1.25rem] overflow-hidden min-h-[420px] relative flex flex-col justify-between group cursor-pointer border border-white/5 hover:border-white/20 transition-all shadow-2xl"
      onClick={onBook}
    >
      {/* Background Cinematic Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-700 ease-out"
        />
        {/* Dark Cinematic Vignette & Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
      </div>

      {/* Top Badges */}
      <div className="relative z-10 p-5 flex items-center justify-between">
        <span className="liquid-glass rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-white/90">
          {category}
        </span>

        <span className="liquid-glass rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase text-white/70">
          {availability}
        </span>
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-10 p-6 flex flex-col justify-end">
        <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] leading-none text-white mb-2 group-hover:text-white/90 transition-colors">
          {title}
        </h3>

        <p className="text-sm text-white/80 font-body font-light mb-4 leading-relaxed">
          {date} · {time}
          <br />
          <span className="text-white/60">{venue}, {city}</span>
        </p>

        {/* Footer: Price & CTA */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm font-medium text-white/90">
            {price}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-body flex items-center gap-1.5 transition-all shadow-md ${
              isSoldOut
                ? 'liquid-glass-strong text-white hover:bg-white/10'
                : 'bg-white text-black hover:bg-white/90'
            }`}
          >
            <span>{isSoldOut ? 'Join Waitlist' : 'Book Tickets'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
