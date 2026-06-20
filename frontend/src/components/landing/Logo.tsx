import React from "react";

interface LogoProps {
  /** Light = sits on dark hero. Dark = sits on light sections. */
  variant?: "light" | "dark";
  /** Show the wordmark alongside the icon. */
  showWordmark?: boolean;
  className?: string;
  iconSize?: number;
}

/**
 * MannSaathi brand mark — a stylized leaf+connection glyph inspired by
 * a child–parent bond. Variant controls whether text is rendered in ink-100
 * (on dark) or on-surface (on light). Pure SVG, zero asset weight.
 */
export default function Logo({
  variant = "light",
  showWordmark = true,
  className = "",
  iconSize = 28,
}: LogoProps) {
  const text = variant === "light" ? "text-ink-100" : "text-on-surface";
  const sub = variant === "light" ? "text-ink-400" : "text-on-surface-muted";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="lg-leaf" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8B5CF6" />
            <stop offset="0.55" stopColor="#D946EF" />
            <stop offset="1" stopColor="#06B6D4" />
         </linearGradient>
          <linearGradient id="lg-dot" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34D399" />
            <stop offset="1" stopColor="#38BDF8" />
         </linearGradient>
       </defs>
        <path
          d="M6 22C6 13 14 6 26 6C26 18 19 26 10 26C8.3 26 7 25 6 22Z"
          fill="url(#lg-leaf)"
          opacity="0.9"
        />
        <path
          d="M8 21C12 17 17 13 24 9"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="22" cy="22" r="3" fill="url(#lg-dot)" />
        <circle cx="22" cy="22" r="3" fill="white" opacity="0.18" />
     </svg>

      {showWordmark && (
        <div className="leading-tight">
          <p className={`font-headline font-bold text-[15px] tracking-tight ${text}`}>
            MannSaathi
         </p>
          <p className={`font-body text-[9px] font-medium uppercase tracking-[0.18em] mt-0.5 ${sub}`}>
            AutiSense&nbsp;AI
         </p>
       </div>
      )}
   </div>
  );
}
