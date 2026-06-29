"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import MouseGlow from "@/components/landing/MouseGlow";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { makeQueryClient } from "@/lib/queryClient";
import { useAppStore } from "@/store";

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
  const accessibility = useAppStore((state) => state.accessibility);
  // Lazily create one QueryClient per browser session (kept stable across renders).
  const [queryClient] = useState(makeQueryClient);

  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (accessibility.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    if (accessibility.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    root.classList.remove("font-large", "font-xlarge");
    if (accessibility.fontSize === "large") {
      root.classList.add("font-large");
    } else if (accessibility.fontSize === "xlarge") {
      root.classList.add("font-xlarge");
    }
  }, [accessibility]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SmoothScroll>
          {isMarketingPage && <MouseGlow />}
          {children}
          {isMarketingPage && <CustomCursor />}
        </SmoothScroll>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
