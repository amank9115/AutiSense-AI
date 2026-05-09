// Dev: Vite proxies /api/v1 → http://127.0.0.1:4000 (no CORS, no IPv6 issues)
// Prod: set VITE_API_BASE_URL to the deployed backend URL
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })

export const getApiBaseUrl = () => API_BASE

export const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const payload = (await response.json()) as { message?: string }
      if (payload.message) {
        message = payload.message
      }
    } catch {
      // ignore parse error and use default message
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}
