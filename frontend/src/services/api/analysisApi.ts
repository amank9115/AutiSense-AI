import { fetchJson } from "../../api/client"

export const analysisApi = {
  getLiveBehaviorTimeline: async () => {
    return fetchJson<Array<{ t: string; eyeContact: number; attention: number; emotionSignals: number; gestureAnalysis: number }>>(
      "/analysis/live-behavior",
    )
  },
  getEmotionTimeline: async () => {
    return fetchJson<Array<{ t: string; calm: number; stress: number; curious: number }>>("/analysis/emotion-timeline")
  },
  getWeeklyProgress: async () => {
    return fetchJson<Array<{ week: string; engagement: number; eyeContact: number; languageResponse: number }>>(
      "/analysis/weekly-progress",
    )
  },
  getChildProfiles: async () => {
    return fetchJson<Array<{ id: string; name: string; age: string; lastSession: string; riskLevel: string }>>(
      "/analysis/child-profiles",
    )
  },
  getSessionHistory: async () => {
    return fetchJson<Array<{ id: string; childName: string; date: string; duration: string; attentionAverage: number; riskScore: number; status: string }>>(
      "/analysis/session-history",
    )
  },
  getMessages: async () => {
    const rows = await fetchJson<Array<{ id: string; from: "parent" | "doctor"; name: string; message: string; at: string }>>(
      "/analysis/messages",
    )
    return rows.map((item) => ({
      ...item,
      from: (item.from === "parent" ? "Parent" : "Doctor") as "Parent" | "Doctor",
    }))
  },
}
