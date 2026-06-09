"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface DoctorTopBarProps {
  greeting?: string;
  subtitle?: string;
}

export function DoctorTopBar({ greeting, subtitle }: DoctorTopBarProps) {
  const { user } = useAuth();

  const getGreeting = () => {
    if (greeting) return greeting;
    const hour = new Date().getHours();
    const tod = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return `${tod}, ${user?.name?.split(" ")[0] ?? "Doctor"}.`;
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/10">
      <div>
        <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface tracking-tighter">
          {getGreeting()}
        </h2>
        {subtitle && (
          <p className="text-on-surface-muted font-medium text-sm mt-1">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <input
            type="search"
            placeholder="Search patients..."
            className="w-56 pl-9 pr-4 py-2.5 rounded-full bg-surface-container-low border border-outline-variant/20 text-sm font-body focus:ring-2 focus:ring-primary/20 focus:outline-none focus:bg-surface-container-lowest transition-all"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-base pointer-events-none">
            search
          </span>
        </div>
        <button
          onClick={() => alert("You have 4 pending screenings requiring your review.")}
          className="relative w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant/10"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
