import React from "react";

interface BrainWaveSVGProps {
  className?: string;
  /** Width/height in px. */
  size?: number;
  /** Trigger animation again on key change. */
  seed?: string;
}

/**
 * Animated brainwave / engagement line SVG. Used inside AI Demo and feature
 * tiles. Path uses stroke-dasharray + dashoffset to draw across.
 */
export default function BrainWaveSVG({ className = "", size = 220 }: BrainWaveSVGProps) {
  // Path uses cubic curves to resemble a heartbeat / brainwave.
  const path =
    "M 0 60 C 20 60 32 30 50 30 S 80 90 100 60 S 130 30 150 60 S 180 95 200 50 S 240 10 260 50 S 290 90 310 50 S 350 10 380 50";

  return (
    <svg
      viewBox="0 0 380 100"
      width="100%"
      height={size * (100 / 380)}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Brainwave activity"
    >
      <defs>
        <linearGradient id="bw-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#D946EF" />
          <stop offset="1" stopColor="#06B6D4" />
       </linearGradient>
        <filter id="bw-glow" x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation="4" />
       </filter>
     </defs>

      {/* baseline grid */}
      <line x1="0" y1="60" x2="380" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />

      {/* glow layer */}
      <path
        d={path}
        fill="none"
        stroke="url(#bw-stroke)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.5"
        filter="url(#bw-glow)"
      />

      {/* crisp animated line — dasharray 800 to play the wipe once + repeat */}
      <path
        d={path}
        fill="none"
        stroke="url(#bw-stroke)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="800"
        strokeDashoffset="800"
        style={{ animation: "bw-draw 4.5s ease-in-out infinite" }}
      />

      <style
  dangerouslySetInnerHTML={{
    __html: `
        @keyframes bw-draw {
          0%   { stroke-dashoffset: 800; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -800; }
        }
        @media (prefers-reduced-motion: reduce) {
          path[style*="bw-draw"] { animation: none; stroke-dashoffset: 0; }
        }
      `,
  }}
/>
   </svg>
  );
}
