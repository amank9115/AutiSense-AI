import React from "react";
import { ParentNav } from "@/components/layout/ParentNav";

export default function ParentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <ParentNav />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
