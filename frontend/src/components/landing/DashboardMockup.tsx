"use client";

import React from "react";

/**
 * Inline SaaS dashboard preview rendered as a static SVG composition.
 * - Browser chrome with three dots, URL pill
 * - Left sidebar with 4 nav rows
 * - Center: title + area-chart series (manually drawn SVG, NOT recharts)
 * - Right rail: 2 stat cards (accuracy ring + weekly engagement bars)
 *
 * Pure-SVG = no JS runtime cost, scales infinitely, sharp at any DPR.
 */
export default function DashboardMockup() {
  // Sample data series for the area chart
  const points = [12, 18, 14, 22, 26, 21, 30, 28, 36, 33, 40, 47];
  const maxY = 50;
  const w = 360;
  const h = 130;
  const stepX = w / (points.length - 1);

  const linePath = points
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (v / maxY) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath =
    `M 0 ${h} ` +
    points
      .map((v, i) => {
        const x = i * stepX;
        const y = h - (v / maxY) * h;
        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") +
    ` L ${w} ${h} Z`;

  // Right rail bars
  const bars = [40, 55, 30, 72, 48, 85, 60];

  return (
    <svg
      viewBox="0 0 1080 660"
      className="block h-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MannSaathi screening dashboard preview"
    >
      <defs>
        {/* Aurora accent gradient */}
        <linearGradient id="dm-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#D946EF" />
          <stop offset="1" stopColor="#06B6D4" />
 </linearGradient>
        <linearGradient id="dm-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
 </linearGradient>
        <linearGradient id="dm-frame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A1D29" />
          <stop offset="1" stopColor="#0B0C13" />
 </linearGradient>
        <linearGradient id="dm-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A1D29" />
          <stop offset="1" stopColor="#11131C" />
 </linearGradient>
        <linearGradient id="dm-bar-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8B5CF6" stopOpacity="0.6" />
          <stop offset="1" stopColor="#06B6D4" stopOpacity="0.95" />
 </linearGradient>
        <linearGradient id="dm-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#06B6D4" />
 </linearGradient>

        <filter id="dm-soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feGaussianBlur stdDeviation="6" />
          <feOffset dy="6" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6" />
         </feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
       </filter>
     </defs>

      {/* Outer frame */}
      <rect x="0" y="0" width="1080" height="660" rx="22" fill="url(#dm-frame)" />

      {/* Browser chrome */}
      <rect x="0" y="0" width="1080" height="44" rx="22" fill="#0E1019" />
      <rect x="0" y="22" width="1080" height="22" fill="#0E1019" />
      <g transform="translate(20 22)">
        <circle cx="0" cy="0" r="6" fill="#F87171" />
        <circle cx="20" cy="0" r="6" fill="#FBBF24" />
        <circle cx="40" cy="0" r="6" fill="#34D399" />
     </g>
      {/* URL pill */}
      <rect x="120" y="10" width="520" height="24" rx="12" fill="#1A1D29" />
      <g transform="translate(134 22)">
        <rect x="0" y="-6" width="10" height="10" rx="2" fill="#34D399" />
        <rect x="18" y="-3" width="180" height="4" rx="2" fill="#5A6079" />
     </g>

      <line x1="0" y1="44" x2="1080" y2="44" stroke="rgba(255,255,255,0.05)" />

      {/* Sidebar */}
      <g transform="translate(0 44)">
        <rect x="0" y="0" width="200" height="616" fill="#0B0C13" />
        <line x1="200" y1="0" x2="200" y2="616" stroke="rgba(255,255,255,0.05)" />

        {/* Brand row */}
        <g transform="translate(20 28)">
          <rect width="28" height="28" rx="8" fill="url(#dm-line)" />
          <rect x="38" y="6" width="80" height="6" rx="3" fill="#E5E8F0" />
          <rect x="38" y="17" width="50" height="4" rx="2" fill="#5A6079" />
       </g>

        {/* Nav rows */}
        <g transform="translate(20 88)">
          {[
            { label: "Overview", active: true },
            { label: "Screenings", active: false },
            { label: "Reports", active: false },
            { label: "Specialists", active: false },
            { label: "Settings", active: false },
          ].map((row, i) => (
            <g key={row.label} transform={`translate(0 ${i * 38})`}>
              {row.active && (
                <rect x="-4" y="0" width="168" height="30" rx="10" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.35)" />
              )}
              <rect x="6" y="9" width="12" height="12" rx="3" fill={row.active ? "#8B5CF6" : "#5A6079"} opacity={row.active ? 1 : 0.6} />
              <rect x="26" y="12" width={row.label.length * 6.5} height="6" rx="3" fill={row.active ? "#E5E8F0" : "#C5CAD8"} />
           </g>
          ))}
       </g>

        {/* Profile card */}
        <g transform="translate(20 540)">
          <rect width="160" height="56" rx="14" fill="#11131C" stroke="rgba(255,255,255,0.06)" />
          <circle cx="22" cy="28" r="14" fill="url(#dm-line)" />
          <text x="22" y="32" textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: "#fff" }}>A</text>
          <rect x="44" y="18" width="86" height="6" rx="3" fill="#C5CAD8" />
          <rect x="44" y="30" width="60" height="4" rx="2" fill="#5A6079" />
       </g>
     </g>

      {/* Main workspace */}
      <g transform="translate(220 64)">
        {/* Title row */}
        <rect x="0" y="0" width="220" height="14" rx="4" fill="#E5E8F0" />
        <rect x="0" y="22" width="320" height="8" rx="3" fill="#5A6079" opacity="0.6" />

        {/* Action buttons */}
        <g transform="translate(620 0)">
          <rect width="84" height="34" rx="10" fill="#11131C" stroke="rgba(255,255,255,0.08)" />
          <rect x="14" y="14" width="40" height="6" rx="3" fill="#C5CAD8" />
          <rect x="92" y="0" width="148" height="34" rx="10" fill="url(#dm-line)" />
          <rect x="106" y="14" width="60" height="6" rx="3" fill="#fff" opacity="0.9" />
          <rect x="174" y="11" width="14" height="12" rx="3" fill="#fff" opacity="0.6" />
       </g>

        {/* Stat row */}
        <g transform="translate(0 56)">
          {[
            { label: "Screenings", delta: "+12.4%", value: "1,284", color: "#8B5CF6" },
            { label: "Avg. accuracy", delta: "+0.8%", value: "94.1%", color: "#34D399" },
            { label: "Avg. duration", delta: "−14s", value: "1m 58s", color: "#06B6D4" },
          ].map((stat, i) => (
            <g key={stat.label} transform={`translate(${i * 270} 0)`}>
              <rect width="250" height="86" rx="16" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />
              <rect x="20" y="20" width={stat.label.length * 7} height="6" rx="3" fill="#8A91A8" />
              <text x="20" y="58" style={{ fontSize: 24, fontWeight: 800, fill: "#fff" }}>{stat.value}</text>
              <rect x="20" y="68" width="48" height="4" rx="2" fill={stat.color} opacity="0.8" />
              <text x="74" y="74" style={{ fontSize: 10, fontWeight: 700, fill: stat.color }}>{stat.delta}</text>
           </g>
          ))}
       </g>

        {/* Big chart card */}
        <g transform="translate(0 162)">
          <rect width="540" height="290" rx="18" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />

          <rect x="20" y="22" width="180" height="9" rx="4" fill="#E5E8F0" />
          <rect x="20" y="38" width="240" height="6" rx="3" fill="#5A6079" />

          {/* legend pills */}
          <g transform="translate(380 22)">
            <rect width="60" height="22" rx="11" fill="rgba(139,92,246,0.18)" />
            <circle cx="11" cy="11" r="4" fill="#8B5CF6" />
            <rect x="20" y="8" width="32" height="6" rx="3" fill="#C5CAD8" />

            <rect x="68" y="0" width="74" height="22" rx="11" fill="rgba(6,182,212,0.16)" />
            <circle cx="79" cy="11" r="4" fill="#06B6D4" />
            <rect x="88" y="8" width="44" height="6" rx="3" fill="#C5CAD8" />
         </g>

          {/* Y-axis grid */}
          <line x1="40" y1="80" x2="520" y2="80" stroke="rgba(255,255,255,0.05)" />
          <line x1="40" y1="130" x2="520" y2="130" stroke="rgba(255,255,255,0.05)" />
          <line x1="40" y1="180" x2="520" y2="180" stroke="rgba(255,255,255,0.05)" />
          <line x1="40" y1="230" x2="520" y2="230" stroke="rgba(255,255,255,0.05)" />

          {/* Area + line — translated to chart frame (40, 80) */}
          <g transform="translate(40 80)">
            <path d={areaPath} fill="url(#dm-area)" />
            <path d={linePath} fill="none" stroke="url(#dm-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* highlight last point */}
            <circle cx={w} cy={h - (points[points.length - 1] / maxY) * h} r="6" fill="#fff" stroke="#8B5CF6" strokeWidth="2.5" />
         </g>

          {/* X-axis labels */}
          <g transform="translate(40 250)">
            {["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"].map((lbl, i) => (
              <text key={lbl} x={i * (stepX)} y="0" textAnchor="middle" style={{ fontSize: 9, fill: "#5A6079", fontWeight: 600 }}>{lbl}</text>
            ))}
         </g>
       </g>

        {/* Lower tile row */}
        <g transform="translate(0 470)">
          {/* AI Report tile */}
          <g>
            <rect width="350" height="118" rx="18" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />
            {/* ring */}
            <g transform="translate(56 60)">
              <circle r="32" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
              <circle r="32" stroke="url(#dm-ring)" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray={2 * Math.PI * 32} strokeDashoffset={2 * Math.PI * 32 * (1 - 0.94)} transform="rotate(-90)" />
              <text textAnchor="middle" y="2" style={{ fontSize: 16, fontWeight: 800, fill: "#fff" }}>94%</text>
              <text textAnchor="middle" y="16" style={{ fontSize: 7, letterSpacing: 1, fontWeight: 700, fill: "#8A91A8" }}>MATCH</text>
           </g>
            <text x="106" y="36" style={{ fontSize: 13, fontWeight: 800, fill: "#fff" }}>Receptive language</text>
            <rect x="106" y="46" width="120" height="6" rx="3" fill="rgba(255,255,255,0.06)" />
            <rect x="106" y="46" width="92" height="6" rx="3" fill="url(#dm-line)" />
            <text x="106" y="76" style={{ fontSize: 11, fontWeight: 700, fill: "#34D399" }}>Strong signal</text>
            <rect x="106" y="86" width="220" height="20" rx="10" fill="rgba(52,211,153,0.12)" />
            <rect x="116" y="93" width="80" height="6" rx="3" fill="#34D399" />
         </g>

          {/* Weekly engagement tile */}
          <g transform="translate(370 0)">
            <rect width="170" height="118" rx="18" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />
            <text x="18" y="28" style={{ fontSize: 12, fontWeight: 800, fill: "#fff" }}>Weekly engagement</text>
            <g transform="translate(18 50)">
              {bars.map((b, i) => (
                <rect key={i} x={i * 20} y={60 - b} width="12" height={b} rx="3" fill="url(#dm-bar-grad)" />
              ))}
           </g>
         </g>
       </g>
     </g>

      {/* Right rail */}
      <g transform="translate(820 56)">
        {/* Profile chip */}
        <rect width="240" height="44" rx="22" fill="#11131C" stroke="rgba(255,255,255,0.06)" />
        <circle cx="22" cy="22" r="14" fill="url(#dm-line)" />
        <rect x="44" y="11" width="80" height="6" rx="3" fill="#C5CAD8" />
        <rect x="44" y="23" width="52" height="4" rx="2" fill="#5A6079" />
        <circle cx="216" cy="22" r="9" fill="rgba(52,211,153,0.16)" />
        <circle cx="216" cy="22" r="4" fill="#34D399" />

        {/* Recommendation card */}
        <g transform="translate(0 64)">
          <rect width="240" height="170" rx="18" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />
          <text x="20" y="28" style={{ fontSize: 11, letterSpacing: 1.4, fill: "#8A91A8", fontWeight: 700 }}>AUTISENSE AI</text>
          <text x="20" y="56" style={{ fontSize: 16, fontWeight: 800, fill: "#fff" }}>Recommended next step</text>
          <text x="20" y="78" style={{ fontSize: 11, fill: "#C5CAD8", fontWeight: 500 }}>Book a 20-min consult with</text>
          <text x="20" y="94" style={{ fontSize: 11, fill: "#C5CAD8", fontWeight: 500 }}>Dr. Mehta (Pediatrics</text>

          <rect x="20" y="116" width="200" height="34" rx="12" fill="url(#dm-line)" />
          <text x="120" y="138" textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: "#fff" }}>Schedule consult</text>
       </g>

        {/* Sub metric */}
        <g transform="translate(0 254)">
          <rect width="240" height="100" rx="18" fill="url(#dm-card)" stroke="rgba(255,255,255,0.05)" />
          <text x="20" y="28" style={{ fontSize: 11, letterSpacing: 1.4, fill: "#8A91A8", fontWeight: 700 }}>AVG. SIGNAL NOISE</text>
          <text x="20" y="62" style={{ fontSize: 26, fontWeight: 800, fill: "#fff" }}>0.18σ</text>
          <text x="20" y="84" style={{ fontSize: 10, fill: "#34D399", fontWeight: 700 }}>Excellent frame quality</text>
       </g>

        {/* Specialist avatars */}
        <g transform="translate(0 374)">
          <text x="0" y="14" style={{ fontSize: 11, letterSpacing: 1.4, fill: "#8A91A8", fontWeight: 700 }}>YOUR CARE TEAM</text>
          {["#8B5CF6", "#EC4899", "#34D399", "#FBBF24"].map((c, i) => (
            <g key={i} transform={`translate(${i * 36} 32)`}>
              <circle r="16" fill={c} stroke="#0B0C13" strokeWidth="3" />
              <text textAnchor="middle" y="4" style={{ fontSize: 11, fill: "#fff", fontWeight: 800 }}>{["P", "M", "R", "S"][i]}</text>
           </g>
          ))}
       </g>
     </g>

     {/* Top edge light bar */}
      <rect x="0" y="0" width="1080" height="2" fill="rgba(255,255,255,0.18)" />
   </svg>
  );
}
