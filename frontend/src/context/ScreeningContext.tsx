import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type ChildProfileForm = {
  childName: string
  age: string
  dateOfBirth: string
  gender: "Male" | "Female" | "Other" | "Prefer not to say"
  parentName: string
  parentPhone: string
  parentEmail: string
  homeAddress: string
  city: string
  state: string
  emergencyContact: string
  medicalNotes: string
  location: {
    lat: number | null
    lng: number | null
    capturedAt: string | null
  }
}

export type ChildCaseRecord = {
  id: string
  profile: ChildProfileForm
  riskScore: number
  sessionHistory: { id: string; date: string; duration: string; riskScore: number }[]
  metrics: {
    eyeContactScore: number
    attentionLevel: number
    emotionPattern: string
    behaviorIndicators: string[]
  }
  summary: string
  doctorNotes: string
}

export type EmergencyAlert = {
  id: string
  at: string
  childName: string
  parentName: string
  parentPhone: string
  emergencyContact: string
  city: string
  state: string
  riskScore: number
}

export type SessionRecording = {
  id: string
  caseId: string
  childName: string
  parentName: string
  createdAt: string
  riskScore: number
  durationSec: number
  videoUrl: string
  locationLabel: string
  metrics: {
    eyeContact: number
    attention: number
    emotionStability: number
    gestureDetection: number
  }
  doctorReviewNotes: string
}

type ScreeningContextValue = {
  activeProfile: ChildProfileForm | null
  saveProfile: (profile: ChildProfileForm) => void
  caseRecords: ChildCaseRecord[]
  emergencyAlerts: EmergencyAlert[]
  recordings: SessionRecording[]
  raiseEmergencyAlert: (riskScore: number) => void
  addRecordingForActiveProfile: (payload: {
    riskScore: number
    durationSec: number
    videoUrl: string
    metrics: SessionRecording["metrics"]
  }) => SessionRecording | null
  updateRecordingNotes: (recordingId: string, notes: string) => void
  updateDoctorNotes: (caseId: string, notes: string) => void
  addSessionForActiveProfile: (payload: { riskScore: number; riskLabel: string; featureAverages: any; recommendations?: string[] }) => string | null
}

const initialCases: ChildCaseRecord[] = []

const ScreeningContext = createContext<ScreeningContextValue | null>(null)

export const ScreeningProvider = ({ children }: { children: ReactNode }) => {
  const [activeProfile, setActiveProfile] = useState<ChildProfileForm | null>(null)
  const [caseRecords, setCaseRecords] = useState<ChildCaseRecord[]>(initialCases)
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([])
  const [recordings, setRecordings] = useState<SessionRecording[]>([])

  const value = useMemo<ScreeningContextValue>(
    () => ({
      activeProfile,
      saveProfile: (profile) => setActiveProfile(profile),
      caseRecords,
      emergencyAlerts,
      recordings,
      raiseEmergencyAlert: (riskScore) => {
        if (!activeProfile) return
        const now = new Date()
        const alert: EmergencyAlert = {
          id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
          at: now.toLocaleString(),
          childName: activeProfile.childName,
          parentName: activeProfile.parentName,
          parentPhone: activeProfile.parentPhone,
          emergencyContact: activeProfile.emergencyContact,
          city: activeProfile.city,
          state: activeProfile.state,
          riskScore,
        }
        setEmergencyAlerts((current) => [alert, ...current].slice(0, 20))
      },
      addRecordingForActiveProfile: ({ riskScore, durationSec, videoUrl, metrics }) => {
        if (!activeProfile) return null
        const now = new Date()
        const record: SessionRecording = {
          id: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
          caseId: `CASE-${Math.floor(100 + Math.random() * 900)}`,
          childName: activeProfile.childName,
          parentName: activeProfile.parentName,
          createdAt: now.toLocaleString(),
          riskScore,
          durationSec,
          videoUrl,
          locationLabel: `${activeProfile.city}, ${activeProfile.state}`,
          metrics,
          doctorReviewNotes: "",
        }
        setRecordings((current) => [record, ...current])
        return record
      },
      updateRecordingNotes: (recordingId, notes) => {
        setRecordings((current) => current.map((item) => (item.id === recordingId ? { ...item, doctorReviewNotes: notes } : item)))
      },
      updateDoctorNotes: (caseId, notes) => {
        setCaseRecords((current) => current.map((item) => (item.id === caseId ? { ...item, doctorNotes: notes } : item)))
      },
      addSessionForActiveProfile: (payload) => {
        if (!activeProfile) return null

        const sessionId = `S-${Math.floor(1000 + Math.random() * 9000)}`
        const caseId = `CASE-${Math.floor(100 + Math.random() * 900)}`
        const now = new Date()
        const date = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })

        const record: ChildCaseRecord = {
          id: caseId,
          profile: activeProfile,
          riskScore: payload.riskScore,
          sessionHistory: [{ id: sessionId, date, duration: "11m", riskScore: payload.riskScore }],
          metrics: {
            eyeContactScore: payload.featureAverages?.eyeContact ?? 0,
            attentionLevel: payload.featureAverages?.attentionSpan ?? 0,
            emotionPattern: `${payload.featureAverages?.emotionSignals ?? 0}% stable`,
            behaviorIndicators: payload.recommendations && payload.recommendations.length > 0 ? payload.recommendations.slice(0, 2) : [payload.riskLabel === "high" ? "Elevated risk pattern detected" : "Typical screening pattern"],
          },
          summary: payload.riskLabel === "high" ? "High risk detected by ML screening. Review recommended." : "Session captured within normal variance.",
          doctorNotes: "",
        }

        setCaseRecords((current) => [record, ...current])
        return caseId
      },
    }),
    [activeProfile, caseRecords, emergencyAlerts, recordings],
  )

  return <ScreeningContext.Provider value={value}>{children}</ScreeningContext.Provider>
}

export const useScreening = () => {
  const context = useContext(ScreeningContext)
  if (!context) throw new Error("useScreening must be used inside ScreeningProvider")
  return context
}
