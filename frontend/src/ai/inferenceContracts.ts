export type MlInferenceRequest = {
  sessionId: string
  source: "live-camera" | "uploaded-video"
  framesPerSecond: number
}

export type MlInferenceResponse = {
  sessionId: string
  status: "queued" | "running" | "complete"
  explanation: string[]
}
