import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export default function ConcertAtmosphere() {
  const canvasRef = useRef(null);

  // 1. Floating Gold Sparks, Confetti & Concert Dust Particles (Canvas 60fps)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(Math.random() * 0.7 + 0.35),
      alpha: Math.random() * 0.75 + 0.25,
      color: Math.random() > 0.4 ? '#FFB347' : '#FFFFFF',
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // 2. Volumetric Sweeping Stage Light Beams
  const lightBeams = [
    { id: 1, origin: '43% 36%', rotate: [-36, 14, -36], duration: 5.6, delay: 0, color: 'rgba(255, 179, 71, 0.45)', width: '9px' },
    { id: 2, origin: '45% 36%', rotate: [-24, 26, -24], duration: 6.2, delay: 0.6, color: 'rgba(255, 255, 255, 0.55)', width: '6px' },
    { id: 3, origin: '47% 36%', rotate: [-14, 32, -14], duration: 4.8, delay: 1.2, color: 'rgba(155, 89, 255, 0.45)', width: '7px' },
    { id: 4, origin: '50% 36%', rotate: [-20, 20, -20], duration: 5.0, delay: 0.3, color: 'rgba(255, 220, 140, 0.6)', width: '12px' },
    { id: 5, origin: '53% 36%', rotate: [-32, 14, -32], duration: 5.8, delay: 0.9, color: 'rgba(155, 89, 255, 0.45)', width: '7px' },
    { id: 6, origin: '55% 36%', rotate: [-26, 24, -26], duration: 6.6, delay: 1.5, color: 'rgba(255, 255, 255, 0.55)', width: '6px' },
    { id: 7, origin: '57% 36%', rotate: [-12, 38, -12], duration: 5.4, delay: 0.4, color: 'rgba(255, 179, 71, 0.45)', width: '9px' },
    { id: 8, origin: '40% 36%', rotate: [-44, 6, -44], duration: 7.0, delay: 1.8, color: 'rgba(255, 106, 0, 0.4)', width: '10px' },
    { id: 9, origin: '60% 36%', rotate: [-6, 44, -6], duration: 6.8, delay: 2.1, color: 'rgba(255, 106, 0, 0.4)', width: '10px' },
    { id: 10, origin: '37% 36%', rotate: [-50, -6, -50], duration: 8.2, delay: 0.5, color: 'rgba(200, 230, 255, 0.35)', width: '7px' },
    { id: 11, origin: '63% 36%', rotate: [6, 50, 6], duration: 8.0, delay: 1.1, color: 'rgba(200, 230, 255, 0.35)', width: '7px' },
  ];

  // 3. Dynamic Animated Audience Smartphone Screens
  const phoneLights = [
    { id: 1, left: '11%', top: '66%', scale: 1.1, delay: 0.2, duration: 2.8, color: '#e0f2fe' },
    { id: 2, left: '18%', top: '70%', scale: 1.3, delay: 1.0, duration: 3.6, color: '#fed7aa' },
    { id: 3, left: '25%', top: '63%', scale: 0.9, delay: 0.6, duration: 3.2, color: '#ffffff' },
    { id: 4, left: '31%', top: '75%', scale: 1.2, delay: 1.8, duration: 4.1, color: '#f3e8ff' },
    { id: 5, left: '36%', top: '67%', scale: 1.0, delay: 0.3, duration: 3.4, color: '#e0f2fe' },
    { id: 6, left: '42%', top: '60%', scale: 0.8, delay: 1.4, duration: 2.9, color: '#fed7aa' },
    { id: 7, left: '46%', top: '68%', scale: 1.4, delay: 0.7, duration: 3.8, color: '#ffffff' },
    { id: 8, left: '50%', top: '62%', scale: 0.9, delay: 2.1, duration: 3.3, color: '#e0f2fe' },
    { id: 9, left: '54%', top: '72%', scale: 1.2, delay: 1.2, duration: 3.9, color: '#f3e8ff' },
    { id: 10, left: '60%', top: '65%', scale: 1.0, delay: 0.4, duration: 3.1, color: '#e0f2fe' },
    { id: 11, left: '67%', top: '71%', scale: 1.3, delay: 1.6, duration: 4.0, color: '#fed7aa' },
    { id: 12, left: '74%', top: '64%', scale: 0.9, delay: 0.8, duration: 3.5, color: '#ffffff' },
    { id: 13, left: '81%', top: '69%', scale: 1.1, delay: 1.9, duration: 4.2, color: '#e0f2fe' },
    { id: 14, left: '88%', top: '73%', scale: 1.2, delay: 1.3, duration: 3.0, color: '#f3e8ff' },
    { id: 15, left: '15%', top: '79%', scale: 1.4, delay: 0.5, duration: 4.3, color: '#e0f2fe' },
    { id: 16, left: '22%', top: '83%', scale: 1.1, delay: 1.7, duration: 3.1, color: '#ffffff' },
    { id: 17, left: '32%', top: '85%', scale: 1.5, delay: 0.2, duration: 4.5, color: '#fed7aa' },
    { id: 18, left: '39%', top: '81%', scale: 1.2, delay: 1.1, duration: 3.6, color: '#e0f2fe' },
    { id: 19, left: '56%', top: '84%', scale: 1.4, delay: 0.8, duration: 4.0, color: '#ffffff' },
    { id: 20, left: '63%', top: '80%', scale: 1.3, delay: 2.0, duration: 3.4, color: '#f3e8ff' },
    { id: 21, left: '73%', top: '83%', scale: 1.5, delay: 0.9, duration: 4.2, color: '#fed7aa' },
    { id: 22, left: '82%', top: '86%', scale: 1.2, delay: 0.6, duration: 3.7, color: '#e0f2fe' },
    { id: 23, left: '47%', top: '77%', scale: 1.6, delay: 1.5, duration: 3.8, color: '#ffffff' },
    { id: 24, left: '90%', top: '81%', scale: 1.0, delay: 0.4, duration: 3.2, color: '#f3e8ff' },
    { id: 25, left: '28%', top: '78%', scale: 1.3, delay: 1.3, duration: 3.7, color: '#e0f2fe' },
    { id: 26, left: '70%', top: '77%', scale: 1.4, delay: 0.3, duration: 3.9, color: '#ffffff' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-[0] bg-black">
      {/* =========================================================================
          LAYER 0: GENUINE LIVE CONCERT FESTIVAL BACKDROP (NO PLANET/SPACE)
          Photographic concert stage, massive real crowd, stage lights, trusses
         ========================================================================= */}
      <motion.div
        animate={{
          scale: [1, 1.03, 1],
          x: ['0%', '-0.4%', '0.4%', '0%'],
          y: ['0%', '-0.3%', '0.1%', '0%'],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 z-[0] w-full h-full"
      >
        <img
          src="/concert_live_hero.jpg"
          alt="Live Concert Crowd and Stage"
          className="w-full h-full object-cover object-center sm:object-[center_30%]"
        />
        {/* Subtle warm amber/orange stage glow pulse */}
        <motion.div
          animate={{
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent pointer-events-none"
        />
      </motion.div>

      {/* =========================================================================
          LAYER 1: VOLUMETRIC SWEEPING STAGE SEARCHLIGHT BEAMS
         ========================================================================= */}
      <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
        {lightBeams.map((beam) => (
          <motion.div
            key={beam.id}
            initial={{ rotate: beam.rotate[0], opacity: 0.2 }}
            animate={{
              rotate: beam.rotate,
              opacity: [0.25, 0.7, 0.25],
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
              top: '32%',
              left: '50%',
              width: beam.width,
              height: '150vh',
              background: `linear-gradient(to bottom, ${beam.color} 0%, rgba(255,255,255,0.45) 25%, rgba(255,179,71,0.08) 75%, transparent 100%)`,
              filter: 'blur(4px)',
              boxShadow: `0 0 35px ${beam.color}`,
              mixBlendMode: 'screen',
            }}
          />
        ))}
      </div>

      {/* =========================================================================
          LAYER 2: STAGE SCREEN & BLINDER PULSES (Beat-synced illumination)
         ========================================================================= */}
      <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
        {/* Central Stage Light Pulse */}
        <motion.div
          animate={{
            scale: [0.92, 1.15, 0.92],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1200px] h-[550px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255, 180, 75, 0.3) 0%, rgba(255, 106, 0, 0.16) 35%, rgba(155, 89, 255, 0.08) 60%, transparent 75%)',
            filter: 'blur(75px)',
          }}
        />

        {/* Stage Flame Jet Flares (Wings) */}
        <div className="w-full max-w-4xl flex justify-between px-12 absolute top-[35%] z-[2]">
          <motion.div
            animate={{
              scaleY: [0.3, 1.4, 0.2, 1.5, 0.3],
              opacity: [0.2, 0.95, 0.15, 0.9, 0.2],
            }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-28 bg-gradient-to-t from-amber-600 via-orange-400 to-transparent rounded-t-full blur-[2px] shadow-[0_0_35px_#ff6a00]"
          />
          <motion.div
            animate={{
              scaleY: [0.2, 1.5, 0.25, 1.3, 0.3],
              opacity: [0.25, 1.0, 0.2, 0.95, 0.25],
            }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="w-6 h-28 bg-gradient-to-t from-amber-600 via-orange-400 to-transparent rounded-t-full blur-[2px] shadow-[0_0_35px_#ff6a00]"
          />
        </div>
      </div>

      {/* =========================================================================
          LAYER 3: DRIFTING CONCERT SMOKE & HAZE
         ========================================================================= */}
      <motion.div
        animate={{
          x: ['-4%', '4%', '-4%'],
          opacity: [0.2, 0.45, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 46%, rgba(255, 190, 100, 0.22) 0%, rgba(155, 89, 255, 0.1) 40%, transparent 70%)',
          filter: 'blur(55px)',
        }}
      />

      {/* =========================================================================
          LAYER 4: FLOATING GOLD SPARKS & CONFETTI (CANVAS 60FPS)
         ========================================================================= */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[2] pointer-events-none" />

      {/* =========================================================================
          LAYER 5: GLOWING SMARTPHONE SCREENS IN THE AUDIENCE
         ========================================================================= */}
      <div className="absolute inset-x-0 bottom-0 top-[48%] z-[2] pointer-events-none">
        {phoneLights.map((phone) => (
          <motion.div
            key={phone.id}
            animate={{
              opacity: [0.25, 0.9, 0.35, 1.0, 0.25],
              scale: [phone.scale * 0.9, phone.scale * 1.25, phone.scale * 0.9],
              y: [0, -5, 0, -2, 0],
              rotate: [-2, 2, -1, 0, -2],
            }}
            transition={{
              duration: phone.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: phone.delay,
            }}
            style={{
              position: 'absolute',
              left: phone.left,
              top: phone.top,
              width: `${phone.scale * 4.5}px`,
              height: `${phone.scale * 7}px`,
              borderRadius: '1.5px',
              backgroundColor: phone.color,
              boxShadow: `0 0 12px 3px ${phone.color}, 0 0 24px 7px rgba(255, 179, 71, 0.6)`,
            }}
          />
        ))}
      </div>

      {/* =========================================================================
          LAYER 6: DARK CINEMATIC RADIAL VIGNETTE (100% UI TEXT READABILITY)
         ========================================================================= */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse at 50% 36%,
              rgba(0, 0, 0, 0.30) 0%,
              rgba(0, 0, 0, 0.05) 45%,
              rgba(0, 0, 0, 0.60) 100%
            ),
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.35) 0%,
              rgba(0, 0, 0, 0.08) 30%,
              rgba(0, 0, 0, 0.55) 70%,
              #000000 100%
            )
          `,
        }}
      />

      {/* Subtle Film Grain Texture */}
      <div className="absolute inset-0 z-[3] film-grain pointer-events-none opacity-25" />
    </div>
  );
}
