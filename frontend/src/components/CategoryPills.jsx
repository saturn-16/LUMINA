import React, { useState } from 'react';
import { motion } from 'motion/react';

const CATEGORIES = ['Movies', 'Concerts', 'Sports', 'Theatre', 'Festivals'];

export default function CategoryPills({ onSelectCategory }) {
  const [activeCat, setActiveCat] = useState('Movies');

  const handleClick = (cat) => {
    setActiveCat(cat);
    if (onSelectCategory) onSelectCategory(cat);
  };

  return (
    <div className="flex items-center justify-center gap-2.5 flex-wrap">
      {CATEGORIES.map((cat) => {
        const isSelected = activeCat === cat;
        return (
          <motion.button
            key={cat}
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleClick(cat)}
            className={`liquid-glass rounded-full px-4 py-1.5 text-xs md:text-sm font-medium transition-colors cursor-pointer ${
              isSelected
                ? 'text-white bg-white/10 shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
}
