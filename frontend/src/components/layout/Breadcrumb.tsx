"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  doctor: "Doctor",
  parent: "Parent",
  patients: "Patients",
  appointments: "Appointments",
  analytics: "Clinical Insights",
  archive: "Archive",
  profile: "Profile",
  children: "My Children",
  history: "History",
  add: "Add Child",
  settings: "Settings",
};

function labelForSegment(segment: string): string {
  // Dynamic segments like UUIDs → show "Details"
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Details";
  return SEGMENT_LABELS[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumb({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 2) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelForSegment(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="breadcrumb" className={`flex items-center gap-1 text-xs text-on-surface-muted ${className}`}>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />}
          {crumb.isLast ? (
            <span aria-current="page" className="text-on-surface font-medium">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-on-surface transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
