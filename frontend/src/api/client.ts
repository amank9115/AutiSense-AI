"use client";

import { useAppStore } from "../store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

export const getApiBaseUrl = () => API_BASE

export const fetchJson = async <T>(path: string, init?: RequestInit, isRetry = false): Promise<T> => {
  // Get token from store
  const token = useAppStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };

  if (token && token !== 'guest-token') {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include", // Ensure cookies (refresh token) are sent and received
  })

  if (!response.ok) {
    // Never attempt token refresh on auth endpoints — it would count as
    // another failed attempt and trigger the brute-force lockout (HTTP 423).
    const isAuthEndpoint = path.includes('/auth/');

    if (response.status === 401 && !isRetry && !isAuthEndpoint) {
      // Attempt to refresh the token using HttpOnly cookie
      try {
        const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const refreshData = refreshJson?.data ?? refreshJson;
          if (refreshData.access_token) {
            const store = useAppStore.getState();
            if (store.user) {
              store.setAuth(store.user, refreshData.access_token);
              return fetchJson<T>(path, init, true);
            }
          }
        }
      } catch (err) {
        // Refresh failed, fall through to logout
      }

      // If refresh failed or user state missing, logout
      const store = useAppStore.getState();
      if (store.token && store.token !== 'guest-token') {
        store.logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
      }
    }

    let message = `Request failed (${response.status})`
    try {
      // Try parsing JSON first
      const payload = (await response.json()) as { message?: string | string[], error?: string | string[] }
      if (payload.message) {
        message = Array.isArray(payload.message) ? payload.message[0] : payload.message
      } else if (payload.error) {
        message = Array.isArray(payload.error) ? payload.error[0] : payload.error
      }
    } catch {
      // ignore parse error and use default message or try to parse text
      try {
        const text = await response.text();
        if (text) message = `Error ${response.status}: ${text.slice(0, 100)}`;
      } catch (e) {
        // give up
      }
    }
    throw new Error(message)
  }

  const json = await response.json();

  // Unwrap the global backend response envelope: { data, message, timestamp }
  // The TransformInterceptor wraps every successful response in this shape.
  if (
    json !== null &&
    typeof json === 'object' &&
    'data' in json &&
    'message' in json &&
    'timestamp' in json
  ) {
    return json.data as T;
  }

  return json as T;
}
