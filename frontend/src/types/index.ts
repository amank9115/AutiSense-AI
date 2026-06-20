export type BehaviorSnapshot = {
  timestamp: string
  eyeContact: number
  attention: number
  emotionStability: number
  gestureScore: number
  riskScore: number
}

export type EmotionPoint = {
  time: string
  calm: number
  curious: number
  stress: number
}

export type WeeklyProgress = {
  week: string
  engagement: number
  communication: number
  adaptation: number
}

export type ChildProfile = {
  id: string
  name: string
  age: string
  lastSession: string
  riskLevel: "Low" | "Moderate" | "Elevated"
}

export type SessionSummary = {
  id: string
  childName: string
  date: string
  duration: string
  attentionAverage: number
  riskScore: number
  status: "Reviewed" | "Pending" | "Escalated"
}

export type MessageThread = {
  id: string
  from: "Parent" | "Doctor"
  name: string
  message: string
  at: string
}
