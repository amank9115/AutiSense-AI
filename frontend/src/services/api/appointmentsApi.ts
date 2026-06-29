import { fetchJson } from "../../api/client"
import type { Appointment } from "./screeningApi"

export type { Appointment }

export type CreateAppointmentInput = {
  childId: string
  scheduledAt: string
  durationMins?: number
  reason?: string
  notes?: string
}

export type UpdateAppointmentInput = {
  scheduledAt?: string
  durationMins?: number
  reason?: string
  notes?: string
  status?: "scheduled" | "completed" | "cancelled"
}

export const appointmentsApi = {
  create: async (data: CreateAppointmentInput) => {
    return fetchJson<Appointment>("/api/v1/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  list: async (status?: "scheduled" | "completed" | "cancelled", page = 1, limit = 50) => {
    const q = status ? `&status=${status}` : ""
    return fetchJson<{
      data: Appointment[]
      pagination: { total: number; page: number; limit: number; pages: number }
    }>(`/api/v1/appointments?page=${page}&limit=${limit}${q}`)
  },

  update: async (id: string, data: UpdateAppointmentInput) => {
    return fetchJson<Appointment>(`/api/v1/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  cancel: async (id: string) => {
    return fetchJson<Appointment>(`/api/v1/appointments/${id}`, {
      method: "DELETE",
    })
  },
}
