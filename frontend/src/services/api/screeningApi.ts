import { fetchJson, getApiBaseUrl } from "../../api/client"
import { useAppStore } from "../../store"
import type { ChildProfileForm } from "../../context/ScreeningContext"

// Enhanced ML error handling
const withMLErrorHandling = async <T>(fetchPromise: Promise<T>, operation: string): Promise<T> => {
  try {
    return await fetchPromise
  } catch (error) {
    console.error(`ML Operation failed: ${operation}`, error)
    
    // Check if this is a network error vs ML service error
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        throw new Error(`ML service unreachable. Please check if the ML service is running on port 8001.`)
      }
      
      // Check for specific ML service errors
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        throw new Error(`ML processing failed. The ML service encountered an internal error.`)
      }
    }
    
    // Re-throw with enhanced context
    throw new Error(`ML ${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export type DoctorProfile = {
  id: string
  name: string
  email: string
}

export type ReportShare = {
  id: string
  sessionId: string
  doctorId: string
  status: "pending" | "reviewed"
  doctorNotes: string | null
  reviewedAt: string | null
  createdAt: string
  session?: ScreeningSession & {
    results?: Record<string, unknown>
    analysisData?: Record<string, unknown>
  }
  sharedBy?: { id: string; name: string; email: string }
}

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

  getDoctors: async () => {
    return fetchJson<DoctorProfile[]>("/api/v1/users/doctors")
  },

  shareWithDoctor: async (sessionId: string, doctorId: string) => {
    return fetchJson<ReportShare>(`/api/v1/screening/sessions/${sessionId}/share`, {
      method: "POST",
      body: JSON.stringify({ doctorId }),
    })
  },

  getReceivedReports: async (page = 1, limit = 10) => {
    return fetchJson<{
      data: ReportShare[]
      pagination: { total: number; page: number; limit: number; pages: number }
    }>(`/api/v1/screening/reports/received?page=${page}&limit=${limit}`)
  },

  getReportShare: async (shareId: string) => {
    return fetchJson<ReportShare>(`/api/v1/screening/reports/${shareId}`)
  },

  reviewReport: async (shareId: string, notes: string, markReviewed = false) => {
    return fetchJson<ReportShare>(`/api/v1/screening/reports/${shareId}/review`, {
      method: "PUT",
      body: JSON.stringify({ notes, markReviewed }),
    })
  },

  // Generates the PDF report on the ML service and returns it as a Blob so the
  // caller can trigger a browser download. The backend streams raw PDF bytes,
  // so we use fetch directly rather than the JSON helper.
  generateReport: async (sessionId: string): Promise<Blob> => {
    return withMLErrorHandling(
      (async () => {
        const token = useAppStore.getState().token
        const headers: Record<string, string> = {}
        if (token && token !== "guest-token") {
          headers["Authorization"] = `Bearer ${token}`
        }
        const response = await fetch(
          `${getApiBaseUrl()}/ml/report/${sessionId}`,
          { method: "POST", headers, credentials: "include" },
        )
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`)
        }
        return response.blob()
      })(),
      "PDF report generation",
    )
  },
}

