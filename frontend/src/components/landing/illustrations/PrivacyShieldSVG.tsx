import React from "react";

/**
 * Animated check-mark shield: shield outline draws on a stroke-dasharray,
 * check-mark draws second. Designed for the Privacy-First feature tile.
 */
export default function PrivacyShieldSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Privacy shield"
    >
      <defs>
        <linearGradient id="ps-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5CF6" stopOpacity="0.18" />
          <stop offset="1" stopColor="#06B6D4" stopOpacity="0.18" />
  </linearGradient>
        <linearGradient id="ps-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#06B6D4" />
  </linearGradient>
    </defs>

      {/* shield fill */}
      <path
        d="M60 8 L108 28 V70 C108 100 86 122 60 132 C34 122 12 100 12 70 V28 Z"
        fill="url(#ps-fill)"
      />

      {/* shield outline — draws across */}
      <path
        d="M60 8 L108 28 V70 C108 100 86 122 60 132 C34 122 12 100 12 70 V28 Z"
        fill="none"
        stroke="url(#ps-stroke)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray="360"
        strokeDashoffset="360"
        style={{ animation: "ps-draw 2.4s ease-out infinite" }}
      />

      {/* check mark — draws second */}
      <path
        d="M40 72 L54 86 L82 56"
        fill="none"
        stroke="url(#ps-stroke)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="80"
        strokeDashoffset="80"
        style={{ animation: "ps-check 2.4s ease-in-out 0.4s infinite" }}
      />

      <style
  dangerouslySetInnerHTML={{
    __html: `
        @keyframes ps-draw {
          0%   { stroke-dashoffset: 360; }
          55%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ps-check {
          0%, 30%   { stroke-dashoffset: 80; }
          60%, 90%  { stroke-dashoffset: 0; }
          100%      { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `,
  }}
/>
  </svg>
  );
}
