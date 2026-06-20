"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export interface ProtectedDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Combines the auth guard + data-fetch pattern repeated across dashboard pages.
 *
 * - Redirects to `/login` when there is no authenticated user.
 * - Runs `fetcher` once the user is present and tracks loading/error state.
 *
 * The fetcher is invoked with the current deps re-evaluated; pass any external
 * values it depends on via `deps` (same contract as a useEffect dependency list).
 */
export function useProtectedData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): ProtectedDataState<T> {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router, ...deps]);

  return { data, loading, error };
}
