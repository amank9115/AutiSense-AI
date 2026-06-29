"use client";

import React from "react";

interface RiskStyle {
  className: string;
  label: string;
}

// Keyed by the backend riskLevel string (case-insensitive). "medium" and
// "moderate" are treated the same; unknown/empty levels fall back to neutral.
const RISK_STYLES: Record<string, RiskStyle> = {
  low: { className: "bg-secondary-container text-on-secondary-container border-secondary/20", label: "Low Risk" },
  medium: { className: "bg-tertiary-container text-on-tertiary-container border-tertiary/20", label: "Moderate Risk" },
  moderate: { className: "bg-tertiary-container text-on-tertiary-container border-tertiary/20", label: "Moderate Risk" },
  high: { className: "bg-error-container text-on-error-container border-error/20", label: "Elevated Risk" },
  very_high: { className: "bg-error-container text-on-error-container border-error/20", label: "High Risk" },
};

const FALLBACK: RiskStyle = {
  className: "bg-surface-container-highest text-on-surface-variant border-outline-variant/10",
  label: "No Assessment",
};

interface RiskBadgeProps {
  /** Backend risk level, e.g. "low" | "medium" | "high" | "very_high". */
  level?: string | null;
  /** Override the derived label (e.g. to show a score). */
  label?: string;
  className?: string;
}

/**
 * Color-coded risk pill, shared across results, patient lists and reports so
 * risk is communicated consistently. Token-based for light/dark + high-contrast.
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, label, className = "" }) => {
  const style = RISK_STYLES[(level ?? "").toLowerCase()] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest ${style.className} ${className}`}
    >
      {label ?? style.label}
    </span>
  );
};
