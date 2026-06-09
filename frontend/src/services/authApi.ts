import { fetchJson } from "../api/client"
import { User, UserRole } from "../store"

export type AuthRole = "parent" | "doctor";

export type AuthResponse = {
  access_token?: string;
  user?: User;
  message?: string;
  verificationToken?: string;
}

export const authApi = {
  login: async (email: string, pass: string) => {
    return fetchJson<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    })
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) => {
    return fetchJson<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        // Tell the backend what URL to use in the verification email
        baseUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      }),
    })
  },

  resendVerification: async (email: string) => {
    return fetchJson<{ message: string; verificationToken?: string }>("/api/v1/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  // Note: These would need backend implementation to match exactly
  loginWithGoogle: async (payload: { email: string; name?: string; role: UserRole }) => {
    return fetchJson<AuthResponse>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  forgotPassword: async (email: string) => {
    return fetchJson<{ message: string }>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  resetPassword: async (payload: { token: string; newPassword: string }) => {
    return fetchJson<{ message: string }>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
