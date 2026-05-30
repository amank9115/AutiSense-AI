"use client";

import React from "react";

/**
 * Native scroll - no smooth scroll library interfering.
 * Uses the browser's native scrolling for best performance.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
