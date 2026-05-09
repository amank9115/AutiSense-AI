import { fetchJson } from "../api/client"

export type AuthRole = "parent" | "doctor"

type AuthUser = {
  id: string
  name: string
  role: AuthRole
  email: string
}

export const authApi = {
  loginWithPassword: async (email: string, password: string, role: AuthRole, name?: string) => {
    return fetchJson<{ success: boolean; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role, name }),
    })
  },
  loginWithGoogle: async (payload: { email: string; name?: string; role: AuthRole }) => {
    return fetchJson<{ success: boolean; user: AuthUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  registerUser: async (payload: {
    name: string
    email: string
    phone: string
    password: string
    confirmPassword: string
    role: AuthRole
  }) => {
    return fetchJson<{ success: boolean; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
  forgotPassword: async (payload: { email: string; role: AuthRole; newPassword: string; confirmPassword: string }) => {
    return fetchJson<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
