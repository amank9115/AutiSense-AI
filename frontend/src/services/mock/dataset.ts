import type {
  BehaviorSnapshot,
  ChildProfile,
  EmotionPoint,
  MessageThread,
  SessionSummary,
  WeeklyProgress,
} from "../../types"

export const behaviorTimeline: BehaviorSnapshot[] = [
  { timestamp: "00:15", eyeContact: 68, attention: 72, emotionStability: 70, gestureScore: 64, riskScore: 36 },
  { timestamp: "00:30", eyeContact: 71, attention: 74, emotionStability: 73, gestureScore: 67, riskScore: 33 },
  { timestamp: "00:45", eyeContact: 66, attention: 69, emotionStability: 65, gestureScore: 63, riskScore: 40 },
  { timestamp: "01:00", eyeContact: 74, attention: 79, emotionStability: 75, gestureScore: 70, riskScore: 29 },
  { timestamp: "01:15", eyeContact: 69, attention: 73, emotionStability: 72, gestureScore: 68, riskScore: 34 },
  { timestamp: "01:30", eyeContact: 76, attention: 81, emotionStability: 78, gestureScore: 73, riskScore: 24 },
]

export const emotionTimeline: EmotionPoint[] = [
  { time: "Min 1", calm: 68, curious: 20, stress: 12 },
  { time: "Min 2", calm: 66, curious: 24, stress: 10 },
  { time: "Min 3", calm: 61, curious: 27, stress: 12 },
  { time: "Min 4", calm: 70, curious: 21, stress: 9 },
  { time: "Min 5", calm: 72, curious: 18, stress: 10 },
]

export const weeklyProgress: WeeklyProgress[] = [
  { week: "W1", engagement: 54, communication: 48, adaptation: 50 },
  { week: "W2", engagement: 58, communication: 52, adaptation: 55 },
  { week: "W3", engagement: 62, communication: 57, adaptation: 59 },
  { week: "W4", engagement: 65, communication: 60, adaptation: 63 },
  { week: "W5", engagement: 68, communication: 64, adaptation: 66 },
]

export const childProfiles: ChildProfile[] = [
  { id: "C-184", name: "Aarav Sharma", age: "3y 8m", lastSession: "2 days ago", riskLevel: "Moderate" },
  { id: "C-126", name: "Mira Patel", age: "4y 1m", lastSession: "Yesterday", riskLevel: "Low" },
  { id: "C-207", name: "Vihaan Rao", age: "3y 4m", lastSession: "Today", riskLevel: "Elevated" },
]

export const sessionHistory: SessionSummary[] = [
  { id: "S-9821", childName: "Aarav Sharma", date: "Mar 05, 2026", duration: "12m", attentionAverage: 74, riskScore: 34, status: "Reviewed" },
  { id: "S-9836", childName: "Mira Patel", date: "Mar 06, 2026", duration: "10m", attentionAverage: 81, riskScore: 21, status: "Pending" },
  { id: "S-9840", childName: "Vihaan Rao", date: "Mar 07, 2026", duration: "14m", attentionAverage: 59, riskScore: 62, status: "Escalated" },
]

export const messages: MessageThread[] = [
  { id: "M1", from: "Parent", name: "Nisha Sharma", message: "Can you review Aarav's week 5 report today?", at: "09:10" },
  { id: "M2", from: "Doctor", name: "Dr. Mehta", message: "Reviewed. Recommend adding joint attention games this week.", at: "09:28" },
  { id: "M3", from: "Parent", name: "Rahul Rao", message: "Uploaded a new home session after speech exercises.", at: "10:02" },
]
