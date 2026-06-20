"use client";

import React, { useMemo } from "react";

interface MeshGradientBgProps {
  /** Scrim darkness; 0 = invisible, 1 = darker overlay on top of mesh. */
  intensity?: number;
  /** Disable the orbital orbs (faster paint on low-end devices). */
  withOrbs?: boolean;
  className?: string;
}

/**
 * Full-bleed animated SVG mesh-gradient background used behind dark sections.
 *
 * - Five large procedurally placed radial gradients (aurora stops) with
 *   long-period <animate> translations to feel like an aurora.
 * - Vignette and grain layered on top.
 * - prefers-reduced-motion renders the t=0 frame statically.
 */
export default function MeshGradientBg({
  intensity = 1,
  withOrbs = true,
  className = "",
}: MeshGradientBgProps) {
  // Build orb path data only once (referenced by <animateMotion>).
  const orb1Path = "M 200,300 C 380,140 740,140 880,360 S 1320,640 1480,420";
  const orb2Path = "M 1700,500 C 1500,720 1100,820 900,640 S 380,420 220,560";
  const orb3Path = "M 480,820 C 700,940 1100,920 1340,720 S 1620,320 1740,200";

  const blobSeed = useMemo(
    () =>
      [
        { id: "blob-a", cx: 280, cy: 220, r: 520, c1: "#6366F1", c2: "#8B5CF6" },
        { id: "blob-b", cx: 1640, cy: 360, r: 580, c1: "#EC4899", c2: "#8B5CF6" },
        { id: "blob-c", cx: 1080, cy: 760, r: 560, c1: "#06B6D4", c2: "#6366F1" },
        { id: "blob-d", cx: 540, cy: 880, r: 420, c1: "#D946EF", c2: "#6366F1" },
        { id: "blob-e", cx: 1380, cy: 120, r: 380, c1: "#8B5CF6", c2: "#EC4899" },
      ] as const,
    [],
  );

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-0 overflow-hidden ${className}`}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Aurora radial gradient stops */}
          {blobSeed.map((b) => (
            <radialGradient
              key={`${b.id}-grad`}
              id={`${b.id}-grad`}
              cx="50%"
              cy="50%"
              r="50%"
              fx="50%"
              fy="50%"
            >
              <stop offset="0%" stopColor={b.c1} stopOpacity="0.85" />
              <stop offset="55%" stopColor={b.c2} stopOpacity="0.45" />
              <stop offset="100%" stopColor={b.c1} stopOpacity="0" />
          </radialGradient>
          ))}

          {/* Soft orb halos */}
          <radialGradient id="orb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
          <radialGradient id="orb-halo-mint" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </radialGradient>

          {/* Film grain */}
          <filter id="grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 0 1
                      0 0 0 0.55 0"
            />
        </filter>

          {/* Mesh vignette */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
            <stop offset="60%" stopColor="#0B0C13" stopOpacity="0" />
            <stop offset="100%" stopColor="#06070B" stopOpacity="0.9" />
        </radialGradient>

          {/* Clip to preserveAspectRatio slice */}
          <clipPath id="mesh-clip">
            <rect x="0" y="0" width="1920" height="1080" />
        </clipPath>
      </defs>

        {/* Ink base */}
        <rect x="0" y="0" width="1920" height="1080" fill="#06070B" />
        <rect x="0" y="0" width="1920" height="1080" fill="#0B0C13" />

        {/* Mesh blobs (animated SVG-native) */}
        <g clipPath="url(#mesh-clip)" style={{ mixBlendMode: "screen" }}>
          {blobSeed.map((b, i) => (
            <circle
              key={b.id}
              cx={b.cx}
              cy={b.cy}
              r={b.r}
              fill={`url(#${b.id}-grad)`}
              opacity={0.85 - i * 0.05}
            >
              <animate
                attributeName="cx"
                values={`${b.cx};${b.cx + (i % 2 === 0 ? 120 : -160)};${b.cx}`}
                dur={`${18 + i * 4}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
              />
              <animate
                attributeName="cy"
                values={`${b.cy};${b.cy + (i % 2 === 0 ? -90 : 110)};${b.cy}`}
                dur={`${22 + i * 3}s`}
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
              />
          </circle>
          ))}
      </g>

        {/* Orbital light orbs — small radial halos that travel along paths. */}
        {withOrbs && (
          <g style={{ mixBlendMode: "screen" }} opacity="0.95">
            <circle r="6" fill="url(#orb-halo)">
              <animateMotion dur="22s" repeatCount="indefinite" path={orb1Path} rotate="auto" />
           </circle>
            <circle r="5" fill="url(#orb-halo-mint)">
              <animateMotion dur="28s" repeatCount="indefinite" path={orb2Path} rotate="auto" />
           </circle>
            <circle r="4" fill="url(#orb-halo)">
              <animateMotion dur="34s" repeatCount="indefinite" path={orb3Path} rotate="auto" />
           </circle>
        </g>
        )}

        {/* Film grain — very subtle */}
        <rect
          x="0"
          y="0"
          width="1920"
          height="1080"
          filter="url(#grain)"
          opacity={0.05 * intensity}
        />

        {/* Vignette */}
        <rect
          x="0"
          y="0"
          width="1920"
          height="1080"
          fill="url(#vignette)"
          opacity={Math.min(1, 0.65 * intensity)}
        />
    </svg>
  </div>
  );
}
