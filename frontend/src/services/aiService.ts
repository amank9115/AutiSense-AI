import { fetchJson, wait } from "../api/client"
import { liveMetricSeed } from "../data/mockPlatformData"
import type { BehaviorMetric } from "../types/platform"

const clamp = (value: number) => Math.min(100, Math.max(0, value))

export const simulateBehaviorFrame = async (): Promise<BehaviorMetric[]> => {
  await wait(180)

  return liveMetricSeed.map((metric) => {
    const jitter = Math.round((Math.random() - 0.5) * 8)
    const nextValue = clamp(metric.value + jitter)

    return {
      label: metric.label,
      value: nextValue,
      trend: jitter > 1 ? "up" : jitter < -1 ? "down" : "stable",
      status: nextValue > 75 ? "healthy" : nextValue > 50 ? "watch" : "critical",
    }
  })
}

export const uploadBehaviorVideo = async (fileName: string) => {
  await wait(900)
  return {
    id: `upload-${Date.now()}`,
    fileName,
    status: "queued",
  }
}

export const runScreeningSession = async () => {
  await wait(1200)
  return {
    sessionId: `session-${Date.now()}`,
    modelVersion: "behavior-transformer-v0.9.4",
    policy: "Signal support only. Not a diagnostic output.",
  }
}

export type CameraMlFrame = {
  eyeContact: number
  attentionSpan: number
  emotionSignals: number
  gestureAnalysis: number
  confidence: number
  imageBase64?: string
}

export type CameraMlResult = {
  success: boolean
  sessionId: string
  status: string
  modelVersion: string
  riskScore: number
  riskLabel: "low" | "moderate" | "high"
  featureAverages: {
    eyeContact: number
    attentionSpan: number
    emotionSignals: number
    gestureAnalysis: number
  }
  recommendations: string[]
  datasetContext?: {
    loaded: boolean
    rows: number
    estimatedResultScore: number
    prevalence: number
  }
  policy: string
}

export type LiveCameraMlPayload = {
  sessionKey: string
  frame: CameraMlFrame & { frameIndex?: number }
}

export type LiveCameraMlResult = {
  success: boolean
  sessionKey: string
  modelVersion: string
  riskScore: number
  riskLabel: "low" | "moderate" | "high"
  featureAverages: {
    eyeContact: number
    attentionSpan: number
    emotionSignals: number
    gestureAnalysis: number
  }
  windowSize: number
  recommendations: string[]
  policy: string
}

export const runCameraMlScreening = async (frames: CameraMlFrame[], userId?: string, childInfo?: any) => {
  return fetchJson<CameraMlResult>("/ml/camera-screening", {
    method: "POST",
    body: JSON.stringify({ frames, userId, childInfo }),
  })
}

export const runLiveCameraInference = async (payload: LiveCameraMlPayload) => {
  return fetchJson<LiveCameraMlResult>("/ml/live-inference", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
