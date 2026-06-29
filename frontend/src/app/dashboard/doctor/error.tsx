"use client";

import RouteError from "@/components/common/RouteError";

export default function DoctorDashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="This page hit a snag"
      homeHref="/dashboard/doctor"
      homeLabel="Back to dashboard"
    />
  );
}
