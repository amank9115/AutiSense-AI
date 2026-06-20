export type BehaviorMetric = {
  label: string
  value: number
  trend: "up" | "down" | "stable"
  status: "healthy" | "watch" | "critical"
}

export type EmotionPoint = {
  time: string
  joy: number
  stress: number
  calm: number
}

export type HeatmapCell = {
  x: number
  y: number
  intensity: number
}

export type SessionSummary = {
  id: string
  date: string
  duration: string
  eyeContact: number
  attention: number
  gestureBalance: number
  emotionalRegulation: number
  riskLevel: "low" | "moderate" | "high"
}

export type ParentReport = {
  id: string
  week: string
  insight: string
  score: number
  action: string
}

export type TimelineMilestone = {
  id: string
  title: string
  detail: string
  week: string
  status: "completed" | "in-progress" | "scheduled"
}

export type Patient = {
  id: string
  name: string
  age: string
  guardian: string
  riskLevel: "low" | "moderate" | "high"
  lastSession: string
}

export type MessageThread = {
  id: string
  from: "parent" | "doctor"
  name: string
  message: string
  time: string
}

