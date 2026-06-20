import React from "react";

interface Step {
  icon: React.ReactNode;
  label: string;
}

interface ScreeningWorkflowSVGProps {
  steps: Step[];
  className?: string;
}

/**
 * Three connected circular icons with a flowing gradient line between them.
 * Used in HowItWorks and elsewhere as a workflow illustration. The traveler
 * dot animates left → right along the polyline.
 */
export default function ScreeningWorkflowSVG({ steps, className = "" }: ScreeningWorkflowSVGProps) {
  const W = 720;
  const H = 180;
  const pad = 60;
  const inner = W - pad * 2;
  const slot = inner / (steps.length - 1);

  const points = steps.map((_, i) => ({
    x: pad + i * slot,
    y: H / 2,
  }));

  // Smooth path through the three nodes
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Screening workflow"
    >
      <defs>
        <linearGradient id="flow-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.5" stopColor="#D946EF" />
          <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
        <filter id="flow-glow" x="-10%" y="-100%" width="120%" height="300%">
          <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>

      {/* Trail */}
      <path d={pathD} stroke="rgba(0,0,0,0.06)" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 8" />

      {/* Gradient path */}
      <path
        d={pathD}
        stroke="url(#flow-stroke)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
        filter="url(#flow-glow)"
      />
      <path d={pathD} stroke="url(#flow-stroke)" strokeWidth="2" strokeLinecap="round" />

      {/* Traveler */}
      <circle r="6" fill="#fff" stroke="#8B5CF6" strokeWidth="2">
        <animateMotion dur="6s" repeatCount="indefinite" path={pathD} />
    </circle>

      {/* Stations */}
      {points.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          {/* pulsing outer ring */}
          <circle r="36" fill="rgba(139,92,246,0.08)">
            <animate attributeName="r" values="28;40;28" dur="3.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3.6s" repeatCount="indefinite" />
      </circle>
          <circle r="30" fill="#fff" stroke="rgba(139,92,246,0.18)" strokeWidth="1" />
          <g transform="translate(-12 -12) scale(1)" color="#8B5CF6">
            {steps[i].icon}
         </g>
          <text
            y="62"
            textAnchor="middle"
            className="font-headline"
            style={{ fontSize: 13, fontWeight: 700, fill: "#31332F" }}
          >
            {steps[i].label}
         </text>
       </g>
      ))}
  </svg>
  );
}
