"use client";

import RouteError from "@/components/common/RouteError";

export default function ParentDashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="This page hit a snag"
      homeHref="/dashboard/parent"
      homeLabel="Back to dashboard"
    />
  );
}
