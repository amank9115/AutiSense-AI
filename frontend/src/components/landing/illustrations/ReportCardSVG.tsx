import React from "react";

interface ReportCardSVGProps {
  className?: string;
  /** Score 0–100. */
  score?: number;
  /** Show a confident/lukewarm ring. */
  state?: "positive" | "neutral" | "watch";
}

/**
 * Inline AI report-card visual. Shows a confidence ring + 4 metric bars.
 * Used as a static illustration in the bento grid (no animation required).
 */
export default function ReportCardSVG({
  className = "",
  score = 94,
  state = "positive",
}: ReportCardSVGProps) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);

  const ringColor =
    state === "positive"
      ? { from: "#34D399", to: "#06B6D4" }
      : state === "neutral"
        ? { from: "#FBBF24", to: "#8B5CF6" }
        : { from: "#F472B6", to: "#8B5CF6" };

  return (
    <svg viewBox="0 0 220 140" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rc-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ringColor.from} />
          <stop offset="1" stopColor={ringColor.to} />
   </linearGradient>
        <linearGradient id="rc-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
   </linearGradient>
 </defs>

      {/* Confidence ring */}
      <g transform="translate(46 70)">
        <circle r={r} stroke="rgba(0,0,0,0.06)" strokeWidth="6" fill="none" />
        <circle
          r={r}
          stroke="url(#rc-ring)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90)"
        />
        <text textAnchor="middle" y="2" style={{ fontSize: 14, fontWeight: 800, fill: "#31332F" }}>
          {score}%
    </text>
        <text textAnchor="middle" y="18" style={{ fontSize: 7.5, letterSpacing: 1.0, fontWeight: 700, fill: "#8A91A8" }}>
          CONFIDENCE
  </text>
     </g>

      {/* Bars */}
      <g transform="translate(98 28)">
        {[
          { label: "Eye Contact", value: 0.86 },
          { label: "Social Reciprocity", value: 0.72 },
          { label: "Speech Pattern", value: 0.91 },
          { label: "Sensory Response", value: 0.68 },
        ].map((row, i) => (
          <g key={row.label} transform={`translate(0 ${i * 22})`} textRendering="geometricPrecision">
            <text x="0" y="9" style={{ fontSize: 8.5, fontWeight: 600, fill: "#5A6079" }}>
              {row.label}
        </text>
            <rect x="0" y="13" width="108" height="4" rx="2" fill="rgba(0,0,0,0.06)" />
            <rect x="0" y="13" width={108 * row.value} height="4" rx="2" fill="url(#rc-bar)" />
      </g>
        ))}
    </g>

      {/* Decorative header bar */}
      <g transform="translate(14 14)">
        <rect width="72" height="6" rx="3" fill="rgba(0,0,0,0.06)" />
        <rect width="40" height="3" rx="1.5" y="10" fill="rgba(0,0,0,0.04)" />
    </g>
 </svg>
  );
}
