"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared fallback rendered by Next.js route-segment `error.tsx` files.
 * Logs the error and offers a `reset()` retry plus an escape link.
 */
export default function RouteError({
  error,
  reset,
  title,
  description,
  homeHref = "/",
  homeLabel = "Go to safety",
}: RouteErrorProps) {
  useEffect(() => {
    logger.error("RouteError", `Route render error${error.digest ? ` (${error.digest})` : ""}`, error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10">
        <span className="material-symbols-outlined text-3xl text-error" aria-hidden="true">error</span>
      </div>
      <h2 className="mb-2 font-headline text-2xl font-extrabold text-on-surface">
        {title ?? "Something went wrong"}
      </h2>
      <p className="mb-6 max-w-md text-sm text-on-surface-variant">
        {description ?? error.message ?? "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-on-primary transition-all hover:bg-primary-dim active:scale-95"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">refresh</span>
          Try again
        </button>
        <Link
          href={homeHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 px-6 py-3 font-bold text-primary transition-all hover:bg-primary-container/40"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
