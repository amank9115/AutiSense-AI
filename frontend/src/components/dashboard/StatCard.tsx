"use client";

import React from "react";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  iconColor?: string;
  variant?: "full" | "compact";
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp,
  iconColor = "bg-primary-container text-on-primary-container",
  variant = "full",
}: StatCardProps) {
  if (variant === "compact") {
    return (
      <div
        className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div>
          <p className="text-label-caps text-on-surface-muted">{label}</p>
          <p className="font-headline font-extrabold text-2xl text-on-surface tracking-tighter">{value}</p>
          {trend && (
            <p className={`text-xs font-medium mt-0.5 ${trendUp !== undefined ? (trendUp ? "text-success" : "text-error") : "text-on-surface-muted"}`}>
              {trend}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-surface-container-lowest rounded-2xl p-6 relative overflow-hidden group hover:bg-surface-container-low transition-colors duration-300"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className={`w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <p className="text-label-caps text-on-surface-muted mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-headline font-extrabold text-3xl text-on-surface tracking-tighter">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trendUp !== undefined ? (trendUp ? "text-success" : "text-error") : "text-on-surface-muted"}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/4 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
    </div>
  );
}
