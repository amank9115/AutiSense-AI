"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import GlobalSearch from "@/components/search/GlobalSearch";

interface DoctorTopBarProps {
  greeting?: string;
  subtitle?: string;
  pendingCount?: number;
}

export function DoctorTopBar({ greeting, subtitle, pendingCount = 0 }: DoctorTopBarProps) {
  const { user } = useAuth();
  const router = useRouter();

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
        <div className="w-56">
          <GlobalSearch />
        </div>
        <button
          onClick={() => router.push("/dashboard/doctor/patients?status=pending")}
          className="relative w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant/10"
          aria-label={pendingCount > 0 ? `${pendingCount} pending reviews` : "Notifications"}
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {pendingCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </header>
  );
}
