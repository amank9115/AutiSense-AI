"use client";

import dynamic from "next/dynamic";
import React from "react";
import { usePathname } from "next/navigation";
import MouseGlow from "@/components/landing/MouseGlow";

const SmoothScroll = dynamic(
  () => import("@/components/effects/SmoothScroll"),
  { ssr: false }
);
const CustomCursor = dynamic(
  () => import("@/components/effects/CustomCursor"),
  { ssr: false }
);

const MARKETING_ROUTES = [
  "/",
  "/assessment",
  "/services",
  "/begin-the-journey",
  "/community",
  "/professionals",
];

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMarketingPage = MARKETING_ROUTES.includes(pathname ?? "");

  return (
    <SmoothScroll>
      {isMarketingPage && <MouseGlow />}
      {children}
      {isMarketingPage && <CustomCursor />}
   </SmoothScroll>
  );
}
