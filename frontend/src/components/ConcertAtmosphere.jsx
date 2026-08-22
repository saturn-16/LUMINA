import React from 'react';
import { motion } from 'motion/react';

export default function ConcertAtmosphere() {
  const laserBeams = [
    { id: 1, origin: '20% 100%', initialRotate: -16, targetRotate: 12, duration: 5.2, delay: 0 },
    { id: 2, origin: '30% 100%', initialRotate: -10, targetRotate: 18, duration: 6.4, delay: 0.8 },
    { id: 3, origin: '45% 100%', initialRotate: -6, targetRotate: 6, duration: 4.8, delay: 0.3 },
    { id: 4, origin: '55% 100%', initialRotate: 8, targetRotate: -14, duration: 5.8, delay: 1.1 },
    { id: 5, origin: '70% 100%', initialRotate: 15, targetRotate: -10, duration: 6.8, delay: 0.5 },
    { id: 6, origin: '80% 100%', initialRotate: 20, targetRotate: -18, duration: 4.5, delay: 1.4 },
    { id: 7, origin: '50% 100%', initialRotate: -12, targetRotate: 14, duration: 6.0, delay: 0.2 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* 1. Moving Stage Laser Beams */}
      <div className="absolute inset-0 flex justify-center items-end opacity-75">
        {laserBeams.map((beam) => (
          <motion.div
            key={beam.id}
            initial={{
              rotate: beam.initialRotate,
              opacity: 0.15,
            }}
            animate={{
              rotate: [beam.initialRotate, beam.targetRotate, beam.initialRotate],
              opacity: [0.1, 0.38, 0.1],
            }}
            transition={{
              duration: beam.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: beam.delay,
            }}
            style={{
              transformOrigin: beam.origin,
              position: 'absolute',
              bottom: 0,
              left: `${beam.id * 12 + 5}%`,
              width: '2px',
              height: '140vh',
              background:
                'linear-gradient(to top, rgba(255,255,255,0.6) 0%, rgba(200,225,255,0.3) 40%, rgba(255,255,255,0.05) 80%, transparent 100%)',
              filter: 'blur(1.5px)',
              boxShadow: '0 0 15px rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* 2. Central Concert Stage Spotlight */}
      <motion.div
        animate={{
          scale: [0.85, 1.15, 0.85],
          opacity: [0.25, 0.55, 0.25],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(220,235,255,0.06) 45%, transparent 70%)',
          filter: 'blur(75px)',
        }}
      />

      {/* 3. Dark Concert Vignette Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at 50% 42%,
              rgba(255,255,255,0.08),
              transparent 30%
            ),
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.2),
              rgba(0,0,0,0.72) 72%,
              #000 100%
            )
          `,
        }}
      />

      {/* 4. Subtle Film Grain Atmosphere */}
      <div className="absolute inset-0 film-grain pointer-events-none opacity-40" />
    </div>
  );
}
