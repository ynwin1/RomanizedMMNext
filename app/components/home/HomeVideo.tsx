"use client";

import React, {useEffect, useRef} from "react";

export default function HomeVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (reducedMotion.matches) video.pause();
      else video.play().catch(() => { /* Autoplay may be blocked. */ });
    };
    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);
    return () => {
      reducedMotion.removeEventListener("change", syncMotion);
      video.pause();
    };
  }, []);

  return (
    <video ref={ref} autoPlay muted loop playsInline preload="metadata"
      aria-label="RomanizedMM music background video"
      className="aspect-video w-full bg-background object-cover lg:aspect-[4/3]">
      <source src="/RMBG.mp4" type="video/mp4" />
    </video>
  );
}
