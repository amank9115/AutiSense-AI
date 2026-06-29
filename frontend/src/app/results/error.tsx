"use client";

import RouteError from "@/components/common/RouteError";

export default function ResultsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="We couldn't load your results"
      description="Something went wrong loading this page. Your screening data is safe — please try again."
      homeHref="/dashboard/parent"
      homeLabel="Go to dashboard"
    />
  );
}
