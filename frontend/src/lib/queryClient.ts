import { QueryClient } from "@tanstack/react-query";

/**
 * Creates the app QueryClient. A factory (not a singleton) so each browser
 * session/test gets a clean cache, and so it can be instantiated lazily inside
 * a client component via useState.
 *
 * Defaults are tuned for a dashboard app that also ships as a Capacitor mobile
 * build: short staleness to keep data fresh, a couple of retries for flaky
 * mobile networks, and no refetch-on-focus to avoid surprising reloads.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30s — dashboards rarely change second-to-second
        gcTime: 5 * 60_000, // keep cache 5 min after a query goes unused
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
