import { fetchJson } from "../../api/client"
import type { ChildProfileForm } from "../../context/ScreeningContext"

export type ChildProfile = {
  id: string
  name: string
  dateOfBirth: string
  gender: string
  medicalNotes: string
  createdAt: string
}

export type ScreeningSession = {
  id: string
  childId: string
  status: string
  riskScore: number | null
  riskLevel: string | null
  createdAt: string
  completedAt: string | null
  child?: {
    name: string
    dateOfBirth?: string
  }
}

export const screeningApi = {
  saveChildProfile: async (profile: ChildProfileForm) => {
    return fetchJson<ChildProfile>("/api/v1/users/me/children", {
      method: "POST",
      body: JSON.stringify({
        name: profile.childName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        medicalNotes: profile.medicalNotes,
      }),
    })
  },

  getChildren: async () => {
    return fetchJson<ChildProfile[]>("/api/v1/users/me/children")
  },

  getSessions: async (page = 1, limit = 20) => {
    return fetchJson<{
      data: ScreeningSession[]
      pagination: { total: number; page: number; limit: number; pages: number }
    }>(`/api/v1/screening/sessions?page=${page}&limit=${limit}`)
  },

  createSession: async (childId: string, metadata?: Record<string, unknown>) => {
    return fetchJson<ScreeningSession>("/api/v1/screening/sessions", {
      method: "POST",
      body: JSON.stringify({ childId, metadata }),
    })
  },

  saveResults: async (sessionId: string, results: Record<string, unknown>) => {
    return fetchJson<Record<string, unknown>>(`/api/v1/screening/sessions/${sessionId}/results`, {
      method: "POST",
      body: JSON.stringify(results),
    })
  },

  getSessionDetails: async (sessionId: string) => {
    return fetchJson<ScreeningSession & { results?: Record<string, unknown>; analysisData?: Record<string, unknown>; report?: Record<string, unknown> }>(`/api/v1/screening/sessions/${sessionId}`)
  },
}

