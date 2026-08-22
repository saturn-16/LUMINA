import React from 'react';
import Galaxy from './Galaxy';

export default function GalaxyBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050814]">
      {/* Interactive WebGL Galaxy Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.35}
          glowIntensity={0.45}
          saturation={0.7}
          hueShift={220}
          speed={0.7}
          twinkleIntensity={0.4}
          repulsionStrength={2.2}
          transparent={true}
        />
      </div>

      {/* Subtle Radial Gradient Vignette for Readability */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(5, 8, 20, 0.25) 0%, rgba(2, 4, 10, 0.75) 75%, #000000 100%)',
        }}
      />
    </div>
  );
}
