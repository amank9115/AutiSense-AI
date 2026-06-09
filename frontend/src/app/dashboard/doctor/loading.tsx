import React from "react";
import { DashboardStatsSkeleton, PatientListSkeleton } from "@/components/ui/SkeletonLoader";

export default function DoctorDashboardLoading() {
  return (
    <div className="p-6 lg:p-10 space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 skeleton-shimmer rounded-full" />
        <div className="h-4 w-72 skeleton-shimmer rounded-full" />
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-8 space-y-4">
          <div className="h-6 w-36 skeleton-shimmer rounded-full" />
          <PatientListSkeleton rows={5} />
        </div>
        <div className="space-y-4">
          <div className="h-48 skeleton-shimmer rounded-3xl" />
          <div className="h-48 skeleton-shimmer rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
