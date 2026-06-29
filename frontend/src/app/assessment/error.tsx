"use client";

import RouteError from "@/components/common/RouteError";

export default function AssessmentError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} title="We couldn't load the screening intro" />;
}
