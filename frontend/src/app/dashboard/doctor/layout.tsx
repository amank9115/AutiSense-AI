import React from "react";
import { DoctorSidebar } from "@/components/layout/DoctorSidebar";

export default function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <DoctorSidebar />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}
