"use client";

import React from "react";
import { Skeleton } from "./StitchUI";

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <Skeleton variant="line" width="40%" height="12px" />
            <Skeleton variant="circle" width="32px" height="32px" />
          </div>
          <Skeleton variant="line" width="55%" height="28px" className="rounded-lg" />
          <Skeleton variant="line" width="70%" height="10px" />
        </div>
      ))}
    </div>
  );
}

export function PatientListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container-lowest">
          <Skeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="line" width="35%" height="13px" />
            <Skeleton variant="line" width="55%" height="10px" />
          </div>
          <Skeleton variant="line" width="60px" height="22px" className="rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cols = 3, cards = 6 }: { cols?: number; cards?: number }) {
  const colClass = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-card">
          <Skeleton variant="card" height="160px" className="rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton variant="line" width="60%" height="14px" />
            <Skeleton variant="line" width="85%" height="11px" />
            <Skeleton variant="line" width="45%" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ParentDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4 shadow-card">
        <Skeleton variant="line" width="30%" height="16px" />
        <Skeleton variant="line" width="50%" height="28px" className="rounded-lg" />
        <div className="flex gap-3 pt-2">
          <Skeleton variant="line" width="140px" height="44px" className="rounded-full" />
          <Skeleton variant="line" width="140px" height="44px" className="rounded-full" />
        </div>
      </div>
      <DashboardStatsSkeleton />
      <CardGridSkeleton cols={2} cards={4} />
    </div>
  );
}
