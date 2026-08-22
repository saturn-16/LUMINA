import React from 'react';
import { motion } from 'motion/react';

export default function ConcertAtmosphere() {
  // Stage light beams configuration (angles, origin, durations, colors)
  const stageBeams = [
    { id: 1, origin: '44% 42%', rotate: [-24, 8, -24], duration: 5.4, delay: 0, color: 'rgba(255, 210, 150, 0.35)', width: '3px' },
    { id: 2, origin: '46% 42%', rotate: [-16, 18, -16], duration: 6.2, delay: 0.6, color: 'rgba(255, 255, 255, 0.4)', width: '2.5px' },
    { id: 3, origin: '48% 42%', rotate: [-8, 22, -8], duration: 4.8, delay: 1.2, color: 'rgba(210, 230, 255, 0.35)', width: '2px' },
    { id: 4, origin: '50% 42%', rotate: [-14, 14, -14], duration: 5.0, delay: 0.3, color: 'rgba(255, 230, 180, 0.45)', width: '4px' },
    { id: 5, origin: '52% 42%', rotate: [-22, 10, -22], duration: 5.6, delay: 0.9, color: 'rgba(210, 230, 255, 0.35)', width: '2px' },
    { id: 6, origin: '54% 42%', rotate: [-18, 16, -18], duration: 6.6, delay: 1.5, color: 'rgba(255, 255, 255, 0.4)', width: '2.5px' },
    { id: 7, origin: '56% 42%', rotate: [-10, 24, -10], duration: 5.2, delay: 0.4, color: 'rgba(255, 210, 150, 0.35)', width: '3px' },
    { id: 8, origin: '42% 42%', rotate: [-30, 2, -30], duration: 7.0, delay: 1.8, color: 'rgba(255, 240, 200, 0.25)', width: '3.5px' },
    { id: 9, origin: '58% 42%', rotate: [-2, 30, -2], duration: 6.8, delay: 2.1, color: 'rgba(255, 240, 200, 0.25)', width: '3.5px' },
  ];

  // Distant smartphone screen positions throughout the audience
  const phoneLights = [
    { id: 1, left: '14%', top: '64%', scale: 1, delay: 0.2, duration: 3.2 },
    { id: 2, left: '22%', top: '68%', scale: 1.2, delay: 1.1, duration: 4.1 },
    { id: 3, left: '28%', top: '61%', scale: 0.8, delay: 0.7, duration: 3.6 },
    { id: 4, left: '33%', top: '72%', scale: 1.1, delay: 1.9, duration: 4.5 },
    { id: 5, left: '38%', top: '65%', scale: 0.9, delay: 0.4, duration: 3.8 },
    { id: 6, left: '44%', top: '58%', scale: 0.7, delay: 1.5, duration: 3.3 },
    { id: 7, left: '48%', top: '66%', scale: 1.3, delay: 0.8, duration: 4.0 },
    { id: 8, left: '52%', top: '60%', scale: 0.8, delay: 2.2, duration: 3.7 },
    { id: 9, left: '56%', top: '70%', scale: 1.1, delay: 1.3, duration: 4.3 },
    { id: 10, left: '62%', top: '63%', scale: 0.9, delay: 0.5, duration: 3.5 },
    { id: 11, left: '67%', top: '69%', scale: 1.2, delay: 1.7, duration: 4.2 },
    { id: 12, left: '74%', top: '62%', scale: 0.8, delay: 0.9, duration: 3.9 },
    { id: 13, left: '81%', top: '67%', scale: 1.0, delay: 2.0, duration: 4.4 },
    { id: 14, left: '88%', top: '71%', scale: 1.1, delay: 1.4, duration: 3.4 },
    { id: 15, left: '18%', top: '77%', scale: 1.3, delay: 0.6, duration: 4.6 },
    { id: 16, left: '25%', top: '80%', scale: 1.0, delay: 1.8, duration: 3.1 },
    { id: 17, left: '35%', top: '83%', scale: 1.4, delay: 0.3, duration: 4.8 },
    { id: 18, left: '42%', top: '79%', scale: 1.1, delay: 1.2, duration: 3.9 },
    { id: 19, left: '58%', top: '82%', scale: 1.3, delay: 0.9, duration: 4.2 },
    { id: 20, left: '65%', top: '78%', scale: 1.2, delay: 2.1, duration: 3.7 },
    { id: 21, left: '76%', top: '81%', scale: 1.4, delay: 1.0, duration: 4.5 },
    { id: 22, left: '84%', top: '84%', scale: 1.1, delay: 0.7, duration: 3.8 },
    { id: 23, left: '49%', top: '75%', scale: 1.5, delay: 1.6, duration: 4.0 },
    { id: 24, left: '92%', top: '79%', scale: 0.9, delay: 0.5, duration: 3.6 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-[1]">
      {/* =========================================================================
          LAYER 1 (z-[1]): DISTANT STAGE, LED SCREENS, RIGGING & STAGE GLOW
         ========================================================================= */}
      <div className="absolute inset-0 z-[1] flex justify-center items-center">
        {/* Central Stage Structure */}
        <div className="absolute top-[34%] sm:top-[36%] w-full max-w-4xl px-4 flex flex-col items-center opacity-85">
          {/* Stage Roof Truss & Top Light Bar */}
          <div className="w-[320px] sm:w-[480px] md:w-[620px] h-[6px] bg-white/30 rounded-full blur-[0.5px] shadow-[0_0_20px_rgba(255,220,150,0.8)] relative">
            {/* Array of Stage Blinders / Par Cans */}
            <div className="absolute -top-1 inset-x-4 flex justify-between">
              {[...Array(12)].map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(255,200,120,0.9)] animate-pulse"
                  style={{ animationDuration: `${2.5 + (i % 3) * 0.7}s`, animationDelay: `${(i % 5) * 0.4}s` }}
                />
              ))}
            </div>
          </div>

          {/* LED Screens & Line Arrays Layout */}
          <div className="w-full flex items-center justify-center gap-3 sm:gap-6 mt-2 relative">
            {/* Left Speaker Tower (Line Array) */}
            <div className="hidden sm:flex flex-col gap-1 w-3 opacity-60">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-2.5 bg-black border border-white/20 rounded-[1px]" />
              ))}
            </div>

            {/* Left Side IMAG Screen */}
            <div className="w-16 sm:w-28 md:w-36 h-20 sm:h-32 md:h-40 rounded-lg bg-gradient-to-b from-amber-500/20 via-black/80 to-purple-900/30 border border-white/15 overflow-hidden relative shadow-[0_0_25px_rgba(255,160,50,0.2)]">
              {/* Dynamic Abstract Screen Visualizer */}
              <motion.div
                animate={{ opacity: [0.4, 0.8, 0.5], scaleY: [0.8, 1.2, 0.9] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/40 via-purple-600/20 to-transparent blur-sm"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Main Center Stage Screen */}
            <div className="w-48 sm:w-80 md:w-[420px] h-24 sm:h-36 md:h-48 rounded-xl bg-gradient-to-b from-amber-600/30 via-slate-950 to-black border border-white/20 overflow-hidden relative shadow-[0_0_40px_rgba(255,180,80,0.35)]">
              {/* Concert Visual Animation on Screen */}
              <motion.div
                animate={{
                  opacity: [0.6, 0.9, 0.6],
                  scale: [1, 1.08, 1],
                  filter: ['blur(4px)', 'blur(2px)', 'blur(4px)'],
                }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 via-white/10 to-indigo-600/30"
              />
              {/* Stage Silhouette of Performer */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-14 bg-black/90 rounded-t-full blur-[1px] opacity-80" />
              {/* Stage Floor Glow Bar */}
              <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_15px_#ffbf69]" />
            </div>

            {/* Right Side IMAG Screen */}
            <div className="w-16 sm:w-28 md:w-36 h-20 sm:h-32 md:h-40 rounded-lg bg-gradient-to-b from-amber-500/20 via-black/80 to-purple-900/30 border border-white/15 overflow-hidden relative shadow-[0_0_25px_rgba(255,160,50,0.2)]">
              <motion.div
                animate={{ opacity: [0.5, 0.85, 0.4], scaleY: [0.9, 1.15, 0.85] }}
                transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/40 via-purple-600/20 to-transparent blur-sm"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Right Speaker Tower (Line Array) */}
            <div className="hidden sm:flex flex-col gap-1 w-3 opacity-60">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-2.5 bg-black border border-white/20 rounded-[1px]" />
              ))}
            </div>
          </div>
        </div>

        {/* Central Massive Concert Stage Radial Glow & Volume Fog */}
        <motion.div
          animate={{
            scale: [0.9, 1.12, 0.9],
            opacity: [0.35, 0.65, 0.35],
          }}
          transition={{ duration: 5.0, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1100px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255, 190, 100, 0.22) 0%, rgba(220, 160, 255, 0.08) 40%, rgba(0, 0, 0, 0) 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* =========================================================================
          LAYER 2 (z-[1] / z-[2]): MOVING STAGE LIGHT BEAMS & LASERS
         ========================================================================= */}
      <div className="absolute inset-0 z-[1] flex justify-center items-center pointer-events-none">
        {stageBeams.map((beam) => (
          <motion.div
            key={beam.id}
            initial={{ rotate: beam.rotate[0], opacity: 0.2 }}
            animate={{
              rotate: beam.rotate,
              opacity: [0.15, 0.45, 0.15],
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
              top: '42%',
              left: '50%',
              width: beam.width,
              height: '140vh',
              background: `linear-gradient(to bottom, ${beam.color} 0%, rgba(255,255,255,0.15) 30%, rgba(255,200,120,0.04) 75%, transparent 100%)`,
              filter: 'blur(2.5px)',
              boxShadow: `0 0 20px ${beam.color}`,
            }}
          />
        ))}
      </div>

      {/* =========================================================================
          LAYER 3 (z-[2]): MID-DISTANCE DENSE AUDIENCE & PHONE LIGHTS
         ========================================================================= */}
      <div className="absolute inset-x-0 bottom-0 top-[52%] z-[2] pointer-events-none">
        {/* Mid-distance Audience Silhouette Wave */}
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-12 w-full h-64 sm:h-80 opacity-90 text-black fill-current drop-shadow-[0_-5px_15px_rgba(255,180,80,0.15)]"
        >
          <path d="M0,192 C40,185 80,170 120,180 C160,190 200,165 240,175 C280,185 320,160 360,170 C400,180 440,155 480,165 C520,175 560,150 600,160 C640,170 680,145 720,155 C760,165 800,140 840,150 C880,160 920,145 960,155 C1000,165 1040,150 1080,160 C1120,170 1160,145 1200,155 C1240,165 1280,150 1320,160 C1360,170 1400,180 1440,175 L1440,320 L0,320 Z" />
        </svg>

        {/* Backlit Rim Lighting on Mid Crowd */}
        <div
          className="absolute inset-x-0 bottom-24 h-28 opacity-45 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 200, 120, 0.35) 0%, rgba(180, 140, 255, 0.1) 45%, transparent 75%)',
            filter: 'blur(15px)',
          }}
        />

        {/* Glowing Audience Smartphone Screens */}
        {phoneLights.map((phone) => (
          <motion.div
            key={phone.id}
            animate={{
              opacity: [0.2, 0.75, 0.25],
              scale: [phone.scale * 0.9, phone.scale * 1.15, phone.scale * 0.9],
              y: [0, -3, 0],
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
              width: `${phone.scale * 4}px`,
              height: `${phone.scale * 6}px`,
              borderRadius: '1px',
              backgroundColor: 'rgba(235, 245, 255, 0.95)',
              boxShadow: '0 0 8px 2px rgba(200, 230, 255, 0.8), 0 0 16px 4px rgba(255, 200, 100, 0.4)',
            }}
          />
        ))}
      </div>

      {/* =========================================================================
          LAYER 4 (z-[3]): DENSE FOREGROUND SILHOUETTE CROWD (RAISED HANDS & PHONES)
         ========================================================================= */}
      <div className="absolute inset-x-0 bottom-0 z-[3] pointer-events-none flex flex-col justify-end">
        {/* Atmospheric Backlit Rim Light on Foreground Crowd */}
        <div
          className="w-full h-32 opacity-60"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,1) 30%, rgba(255, 190, 110, 0.15) 75%, transparent 100%)',
          }}
        />

        {/* High-detail Foreground Crowd Silhouettes with Raised Hands & Phones */}
        <svg
          viewBox="0 0 1920 480"
          preserveAspectRatio="xMidYMax slice"
          className="w-full h-56 sm:h-72 md:h-96 text-black fill-current drop-shadow-[0_-4px_12px_rgba(0,0,0,0.9)]"
        >
          {/* Detailed Heads, Shoulders, Raised Hands, and Phones Silhouette */}
          <path d="M0,480 L0,280 C20,270 35,250 50,255 C65,260 75,275 90,270 C105,265 110,240 125,245 C140,250 145,280 160,275 C175,270 180,210 190,195 C195,185 205,185 210,200 C215,220 220,260 235,265 C250,270 260,250 275,255 C290,260 300,280 315,275 C330,270 340,230 355,235 C370,240 375,265 390,270 C405,275 415,215 425,190 C430,175 440,175 445,195 C450,225 460,265 475,270 C490,275 500,250 515,255 C530,260 540,240 555,245 C570,250 580,280 595,275 C610,270 615,180 625,160 C630,150 640,150 645,165 C650,195 660,260 675,265 C690,270 700,240 715,245 C730,250 740,225 750,200 C755,185 765,185 770,205 C775,235 785,270 800,275 C815,280 825,255 840,260 C855,265 865,245 880,250 C895,255 905,210 915,185 C920,170 930,170 935,190 C940,220 950,265 965,270 C980,275 990,245 1005,250 C1020,255 1030,230 1045,235 C1060,240 1070,270 1085,275 C1100,280 1105,195 1115,170 C1120,155 1130,155 1135,175 C1140,210 1150,265 1165,270 C1180,275 1190,245 1205,250 C1220,255 1230,220 1245,225 C1260,230 1270,260 1285,265 C1300,270 1310,185 1320,160 C1325,145 1335,145 1340,165 C1345,200 1355,265 1370,270 C1385,275 1395,240 1410,245 C1425,250 1435,270 1450,275 C1465,280 1475,225 1485,200 C1490,185 1500,185 1505,205 C1510,235 1520,270 1535,275 C1550,280 1560,250 1575,255 C1590,260 1600,235 1615,240 C1630,245 1640,275 1655,275 C1670,275 1680,215 1690,190 C1695,175 1705,175 1710,195 C1715,225 1725,265 1740,270 C1755,275 1765,245 1780,250 C1795,255 1805,280 1820,275 C1835,270 1845,230 1860,235 C1875,240 1890,270 1920,275 L1920,480 Z" />
        </svg>

        {/* Foreground Solid Black Base for Flawless Contrast */}
        <div className="w-full h-8 sm:h-16 bg-black" />
      </div>

      {/* =========================================================================
          LAYER 5 (z-[3]): DARK CINEMATIC VIGNETTE OVERLAY
         ========================================================================= */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at 50% 40%,
              rgba(255, 230, 180, 0.05) 0%,
              transparent 45%
            ),
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.35) 0%,
              rgba(0, 0, 0, 0.15) 35%,
              rgba(0, 0, 0, 0.65) 70%,
              #000000 100%
            )
          `,
        }}
      />

      {/* Subtle Cinematic Film Grain Texture */}
      <div className="absolute inset-0 z-[3] film-grain pointer-events-none opacity-30" />
    </div>
  );
}
