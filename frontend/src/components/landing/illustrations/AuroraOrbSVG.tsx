import React from "react";

/**
 * Soft animated orb for the "Quiet Mode" tile. Two layered radial gradients
 * breathe in/out, and a low-opacity grain overlay keeps the surface tactile.
 */
export default function AuroraOrbSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ao-a" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
 </radialGradient>
        <radialGradient id="ao-b" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D946EF" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#EC4899" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
 </radialGradient>
        <filter id="ao-blur">
          <feGaussianBlur stdDeviation="20" />
 </filter>
     </defs>

      <g filter="url(#ao-blur)">
        <circle cx="100" cy="100" r="80" fill="url(#ao-a)">
          <animate attributeName="r" values="74;90;74" dur="6s" repeatCount="indefinite" />
      </circle>
        <circle cx="100" cy="100" r="64" fill="url(#ao-b)">
          <animate attributeName="r" values="58;78;58" dur="8s" repeatCount="indefinite" />
          <animate attributeName="cx" values="100;115;100;85;100" dur="14s" repeatCount="indefinite" />
      </circle>
     </g>

      {/* crisp core */}
      <circle cx="100" cy="100" r="46" fill="white" opacity="0.06" stroke="white" strokeOpacity="0.18" />
      <circle cx="100" cy="100" r="8" fill="white" opacity="0.7" />
</svg>
  );
}
