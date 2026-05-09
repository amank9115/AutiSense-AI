import {
  type EmotionPoint,
  type HeatmapCell,
  type MessageThread,
  type ParentReport,
  type Patient,
  type SessionSummary,
  type TimelineMilestone,
} from "../types/platform"

export const liveMetricSeed = [
  { label: "Eye Contact", value: 74, trend: "up", status: "watch" },
  { label: "Attention Span", value: 68, trend: "up", status: "watch" },
  { label: "Emotion Signals", value: 79, trend: "stable", status: "healthy" },
  { label: "Gesture Balance", value: 64, trend: "down", status: "watch" },
] as const

export const emotionTimeline: EmotionPoint[] = [
  { time: "00:00", joy: 55, stress: 35, calm: 52 },
  { time: "00:30", joy: 62, stress: 31, calm: 56 },
  { time: "01:00", joy: 65, stress: 28, calm: 60 },
  { time: "01:30", joy: 60, stress: 30, calm: 58 },
  { time: "02:00", joy: 68, stress: 24, calm: 63 },
  { time: "02:30", joy: 64, stress: 26, calm: 61 },
]

export const behaviorRadar = [
  { metric: "Social Reciprocity", score: 72 },
  { metric: "Joint Attention", score: 66 },
  { metric: "Emotional Adaptation", score: 78 },
  { metric: "Gesture Frequency", score: 61 },
  { metric: "Response Latency", score: 70 },
  { metric: "Sensory Regulation", score: 74 },
]

export const attentionHeatmap: HeatmapCell[] = Array.from({ length: 36 }).map((_, index) => {
  const x = index % 6
  const y = Math.floor(index / 6)
  const base = (x + y) % 3
  return {
    x,
    y,
    intensity: Math.max(20, 82 - y * 8 - base * 7 + x * 3),
  }
})

export const sessionComparison = [
  { name: "Session A", attention: 58, eyeContact: 60, regulation: 62 },
  { name: "Session B", attention: 66, eyeContact: 63, regulation: 70 },
  { name: "Session C", attention: 73, eyeContact: 71, regulation: 75 },
  { name: "Session D", attention: 78, eyeContact: 74, regulation: 79 },
]

export const parentWeeklyReports: ParentReport[] = [
  {
    id: "r-1",
    week: "Week 8",
    insight: "Improved gaze consistency during guided play activities.",
    score: 74,
    action: "Continue face-to-face mirroring games for 12 minutes daily.",
  },
  {
    id: "r-2",
    week: "Week 9",
    insight: "Attention dips appear after 6 minutes in high-noise settings.",
    score: 68,
    action: "Use low-distraction play setup with shorter breaks.",
  },
  {
    id: "r-3",
    week: "Week 10",
    insight: "Emotion recovery time improved after sensory prompting.",
    score: 79,
    action: "Maintain current sensory calming sequence before sessions.",
  },
]

export const progressTimeline: TimelineMilestone[] = [
  {
    id: "t1",
    title: "Baseline Screening",
    detail: "Initial behavior signal map generated with clinician review.",
    week: "Week 1",
    status: "completed",
  },
  {
    id: "t2",
    title: "Guided Home Routines",
    detail: "Parent coaching pack deployed for attention and turn-taking.",
    week: "Week 4",
    status: "completed",
  },
  {
    id: "t3",
    title: "Clinic Follow-up Session",
    detail: "Progress comparison with explainable AI trend markers.",
    week: "Week 8",
    status: "in-progress",
  },
  {
    id: "t4",
    title: "Integrated Care Plan",
    detail: "Joint doctor-parent roadmap for the next 90 days.",
    week: "Week 12",
    status: "scheduled",
  },
]

export const patientList: Patient[] = [
  {
    id: "P-102",
    name: "Aria N.",
    age: "3y 8m",
    guardian: "Nina N.",
    riskLevel: "moderate",
    lastSession: "2026-03-01",
  },
  {
    id: "P-164",
    name: "Rahul M.",
    age: "4y 2m",
    guardian: "Meera M.",
    riskLevel: "low",
    lastSession: "2026-03-03",
  },
  {
    id: "P-211",
    name: "Theo L.",
    age: "2y 11m",
    guardian: "Sofia L.",
    riskLevel: "high",
    lastSession: "2026-03-02",
  },
]

export const clinicianSessions: SessionSummary[] = [
  {
    id: "S-201",
    date: "2026-03-01",
    duration: "12m",
    eyeContact: 71,
    attention: 68,
    gestureBalance: 64,
    emotionalRegulation: 76,
    riskLevel: "moderate",
  },
  {
    id: "S-202",
    date: "2026-03-03",
    duration: "10m",
    eyeContact: 77,
    attention: 72,
    gestureBalance: 69,
    emotionalRegulation: 80,
    riskLevel: "low",
  },
  {
    id: "S-203",
    date: "2026-03-05",
    duration: "14m",
    eyeContact: 56,
    attention: 52,
    gestureBalance: 48,
    emotionalRegulation: 58,
    riskLevel: "high",
  },
]

export const collaborationMessages: MessageThread[] = [
  {
    id: "m1",
    from: "parent",
    name: "Nina N.",
    message: "Uploaded the latest play session. Can you review gaze shifts?",
    time: "10:24",
  },
  {
    id: "m2",
    from: "doctor",
    name: "Dr. Elena Ramos",
    message: "Reviewed. Progress is visible. Please continue turn-taking exercise.",
    time: "10:41",
  },
  {
    id: "m3",
    from: "parent",
    name: "Nina N.",
    message: "Sharing weekly routine logs now. Thank you.",
    time: "10:48",
  },
]

