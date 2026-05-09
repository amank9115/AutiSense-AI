import { useEffect, useMemo, useState } from "react"

type LiveMetrics = {
  eyeContact: number
  attention: number
  emotionSignals: number
  gestureAnalysis: number
  confidence: number
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const hashSeed = (seed: string) => {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const buildSeededBaseline = (seed: string): LiveMetrics => {
  const hashed = hashSeed(seed || "manassaathi")
  const eyeContact = 62 + (hashed % 18)
  const attention = 64 + ((Math.floor(hashed / 7) % 18))
  const emotionSignals = 58 + ((Math.floor(hashed / 13) % 20))
  const gestureAnalysis = 60 + ((Math.floor(hashed / 17) % 18))
  const confidence = 80 + ((Math.floor(hashed / 23) % 12))

  return {
    eyeContact: clamp(eyeContact),
    attention: clamp(attention),
    emotionSignals: clamp(emotionSignals),
    gestureAnalysis: clamp(gestureAnalysis),
    confidence: clamp(confidence),
  }
}

export const useSimulatedMetrics = (seed: string) => {
  const [metrics, setMetrics] = useState<LiveMetrics>(() => buildSeededBaseline(seed))

  useEffect(() => {
    setMetrics(buildSeededBaseline(seed))
  }, [seed])

  const applyMlMetrics = (next: { eyeContact: number; attention: number; emotionSignals: number; gestureAnalysis: number; confidence?: number }) => {
    setMetrics((current) => ({
      eyeContact: clamp(next.eyeContact),
      attention: clamp(next.attention),
      emotionSignals: clamp(next.emotionSignals),
      gestureAnalysis: clamp(next.gestureAnalysis),
      confidence: clamp(next.confidence ?? current.confidence),
    }))
  }

  const riskSignal = useMemo(() => {
    const protective = (metrics.eyeContact + metrics.attention + metrics.emotionSignals + metrics.gestureAnalysis) / 4
    return Math.max(1, Math.min(99, 100 - Math.round(protective)))
  }, [metrics])

  return { metrics, riskSignal, applyMlMetrics }
}
