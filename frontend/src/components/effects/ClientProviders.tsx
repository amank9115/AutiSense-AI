"use client";

import dynamic from "next/dynamic";
import React from "react";

const SmoothScroll = dynamic(
  () => import("@/components/effects/SmoothScroll"),
  { ssr: false }
);
const CustomCursor = dynamic(
  () => import("@/components/effects/CustomCursor"),
  { ssr: false }
);

/**
 * ClientProviders — Client-side wrapper for providers that need ssr:false.
 * Used in layout.tsx (Server Component) to wrap children with client-only effects.
 */
export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SmoothScroll>{children}</SmoothScroll>
      <CustomCursor />
    </>
  );
}
