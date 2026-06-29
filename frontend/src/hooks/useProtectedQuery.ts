"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { useAppStore } from "@/store";

export interface ProtectedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Drop-in successor to `useProtectedData`, backed by TanStack Query.
 *
 * Combines the dashboard auth guard with a cached query:
 * - Redirects to `/login` once mounted if there is no authenticated user
 *   (guards against the SSR hydration flash by waiting for `mounted`).
 * - Runs `queryFn` through `useQuery`, gaining caching, dedup, retries and
 *   background revalidation for free.
 *
 * Returns the same `{ data, loading, error }` shape the old hook exposed (plus
 * `refetch`) so call sites barely change.
 */
export function useProtectedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn" | "enabled"> & {
    enabled?: boolean;
  },
): ProtectedQueryResult<T> {
  const user = useAppStore((s) => s.user);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  const enabled = !!user && (options?.enabled ?? true);

  const query = useQuery<T, Error>({
    queryKey,
    queryFn,
    ...options,
    enabled,
  });

  // Treat pre-hydration and the redirect window as "loading" so pages keep
  // showing skeletons rather than flashing an empty/error state.
  const loading = !mounted || !user || query.isLoading;

  return {
    data: query.data ?? null,
    loading,
    error: query.error ? query.error.message : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
