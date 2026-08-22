import React, { useRef, useState, useEffect } from 'react';

export default function FadingVideo({ src, className = '', style = {} }) {
  const videoRef = useRef(null);
  const [opacity, setOpacity] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sources = Array.isArray(src) ? src : [src];
  const currentSrc = sources[currentIndex] || '';

  const fadeAnimationRef = useRef(null);

  const animateOpacity = (from, to, duration, onComplete) => {
    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentOpacity = from + (to - from) * progress;
      setOpacity(currentOpacity);

      if (progress < 1) {
        fadeAnimationRef.current = requestAnimationFrame(step);
      } else {
        if (onComplete) onComplete();
      }
    };

    fadeAnimationRef.current = requestAnimationFrame(step);
  };

  const handleLoadedData = () => {
    animateOpacity(0, 1, 500);
  };

  const isFadingOutRef = useRef(false);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || isNaN(video.duration)) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.55 && !isFadingOutRef.current) {
      isFadingOutRef.current = true;
      animateOpacity(1, 0, 550);
    }
  };

  const handleEnded = () => {
    isFadingOutRef.current = false;
    if (sources.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % sources.length);
    } else {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.play().catch(() => {});
        animateOpacity(0, 1, 500);
      }
    }
  };

  useEffect(() => {
    isFadingOutRef.current = false;
    const video = videoRef.current;
    if (video) {
      video.load();
      video.play().catch(() => {});
    }
  }, [currentIndex, currentSrc]);

  return (
    <video
      ref={videoRef}
      src={currentSrc}
      autoPlay
      muted
      playsInline
      preload="auto"
      onLoadedData={handleLoadedData}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      className={className}
      style={{
        ...style,
        opacity,
        transition: 'none',
      }}
    />
  );
}
