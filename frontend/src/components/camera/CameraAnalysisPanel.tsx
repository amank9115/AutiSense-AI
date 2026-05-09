import { useEffect, useMemo, useRef, useState } from "react"

import { useCameraStream } from "../../hooks/useCameraStream"
import { runCameraMlScreening, type CameraMlFrame } from "../../services/aiService"
import type { BehaviorMetric } from "../../types/platform"

const metricTone: Record<string, string> = {
  healthy: "text-emerald-300",
  watch: "text-amber-300",
  critical: "text-rose-300",
}

const initialMetrics: BehaviorMetric[] = [
  { label: "Eye Contact", value: 0, trend: "stable", status: "watch" },
  { label: "Attention Span", value: 0, trend: "stable", status: "watch" },
  { label: "Emotion Signals", value: 0, trend: "stable", status: "watch" },
  { label: "Gesture Balance", value: 0, trend: "stable", status: "watch" },
]

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const getTrend = (prev: number, next: number): BehaviorMetric["trend"] => {
  if (next - prev > 2) return "up"
  if (prev - next > 2) return "down"
  return "stable"
}

const toStatus = (value: number): BehaviorMetric["status"] => {
  if (value >= 75) return "healthy"
  if (value >= 50) return "watch"
  return "critical"
}

const buildMetrics = (nextFrame: CameraMlFrame, prevMetrics: BehaviorMetric[]): BehaviorMetric[] => {
  const map = {
    "Eye Contact": nextFrame.eyeContact,
    "Attention Span": nextFrame.attentionSpan,
    "Emotion Signals": nextFrame.emotionSignals,
    "Gesture Balance": nextFrame.gestureAnalysis,
  } as const

  return prevMetrics.map((metric) => {
    const nextValue = Math.round(map[metric.label as keyof typeof map])
    return {
      ...metric,
      value: nextValue,
      trend: getTrend(metric.value, nextValue),
      status: toStatus(nextValue),
    }
  })
}

const extractFrameSignals = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  previousLumaRef: React.MutableRefObject<Float32Array | null>,
): CameraMlFrame | null => {
  if (!video.videoWidth || !video.videoHeight) {
    return null
  }

  const width = 72
  const height = 54
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) {
    return null
  }

  context.drawImage(video, 0, 0, width, height)
  const image = context.getImageData(0, 0, width, height)

  let sumLuma = 0
  let sumSqLuma = 0
  let centerLuma = 0
  let centerPixels = 0
  const luma = new Float32Array(width * height)

  const centerX0 = Math.floor(width * 0.3)
  const centerX1 = Math.floor(width * 0.7)
  const centerY0 = Math.floor(height * 0.25)
  const centerY1 = Math.floor(height * 0.75)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const r = image.data[i]
      const g = image.data[i + 1]
      const b = image.data[i + 2]

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
      const idx = y * width + x
      luma[idx] = lum

      sumLuma += lum
      sumSqLuma += lum * lum

      if (x >= centerX0 && x <= centerX1 && y >= centerY0 && y <= centerY1) {
        centerLuma += lum
        centerPixels += 1
      }
    }
  }

  const pixelCount = width * height
  const avgLuma = sumLuma / pixelCount
  const centerAvg = centerPixels > 0 ? centerLuma / centerPixels : avgLuma
  const variance = Math.max(0, sumSqLuma / pixelCount - avgLuma * avgLuma)
  const stdDev = Math.sqrt(variance)

  let motion = 0
  const previousLuma = previousLumaRef.current
  if (previousLuma) {
    for (let i = 0; i < luma.length; i += 1) {
      motion += Math.abs(luma[i] - previousLuma[i])
    }
    motion /= luma.length
  }
  previousLumaRef.current = luma

  const centerFocus = clamp(50 + (centerAvg - avgLuma) * 1.8)

  const gestureAnalysis = clamp(15 + motion * 1.35)
  const eyeContact = clamp(72 + centerFocus * 0.2 - motion * 0.55 - Math.abs(centerAvg - avgLuma) * 0.25)
  const attentionSpan = clamp(68 + centerFocus * 0.28 - motion * 0.62)
  const emotionSignals = clamp(38 + stdDev * 0.9 - motion * 0.3)

  const confidence = clamp(
    40 + (avgLuma >= 25 && avgLuma <= 225 ? 20 : 5) + (stdDev >= 18 ? 18 : 8) - motion * 0.08,
  )

  return {
    eyeContact: Math.round(eyeContact),
    attentionSpan: Math.round(attentionSpan),
    emotionSignals: Math.round(emotionSignals),
    gestureAnalysis: Math.round(gestureAnalysis),
    confidence: Math.round(confidence),
  }
}

const CameraAnalysisPanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const previousLumaRef = useRef<Float32Array | null>(null)

  const { stream, startCamera, stopCamera, isActive, error } = useCameraStream()

  const [metrics, setMetrics] = useState<BehaviorMetric[]>(initialMetrics)
  const [cameraFrames, setCameraFrames] = useState<CameraMlFrame[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [autoMlEnabled, setAutoMlEnabled] = useState(true)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [mlSummary, setMlSummary] = useState<null | {
    sessionId: string
    modelVersion: string
    riskScore: number
    riskLabel: string
    frameCount: number
    datasetScore?: number
  }>(null)

  useEffect(() => {
    if (!videoRef.current || !stream) {
      return
    }
    videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (!isActive || !videoRef.current) {
      previousLumaRef.current = null
      return
    }

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas")
    }

    const interval = window.setInterval(() => {
      const nextFrame = extractFrameSignals(
        videoRef.current as HTMLVideoElement,
        analysisCanvasRef.current as HTMLCanvasElement,
        previousLumaRef,
      )
      if (!nextFrame) {
        return
      }

      setMetrics((prev) => buildMetrics(nextFrame, prev))
      setCameraFrames((prev) => [...prev.slice(-29), nextFrame])
    }, 900)

    return () => {
      window.clearInterval(interval)
    }
  }, [isActive])

  const latestConfidence = useMemo(() => {
    const last = cameraFrames[cameraFrames.length - 1]
    return last?.confidence ?? 0
  }, [cameraFrames])

  const handleRunMl = async () => {
    if (!cameraFrames.length) {
      setAnalysisError("No camera frames captured yet. Start camera and wait 3-4 seconds.")
      return
    }

    setAnalysisError(null)
    setIsAnalyzing(true)
    try {
      const result = await runCameraMlScreening(cameraFrames)
      setMlSummary({
        sessionId: result.sessionId,
        modelVersion: result.modelVersion,
        riskScore: result.riskScore,
        riskLabel: result.riskLabel,
        frameCount: cameraFrames.length,
        datasetScore: result.datasetContext?.estimatedResultScore,
      })
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "ML analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (!autoMlEnabled || !isActive) {
      return
    }

    const interval = window.setInterval(() => {
      if (isAnalyzing || cameraFrames.length < 6) {
        return
      }
      void handleRunMl()
    }, 10000)

    return () => {
      window.clearInterval(interval)
    }
  }, [autoMlEnabled, cameraFrames.length, isActive, isAnalyzing])

  return (
    <div className="rounded-[2rem] border border-white/20 bg-slate-950/70 p-4 shadow-2xl shadow-cyan-950/35 backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Live Behavior Analysis</p>
          <p className="mt-1 text-sm text-slate-300">Frame-based camera signals integrated with ML screening endpoint.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:bg-cyan-300"
          >
            Start Camera
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => void handleRunMl()}
            disabled={isAnalyzing || !isActive}
            className="rounded-full border border-cyan-300/50 bg-cyan-300/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-300/30 disabled:opacity-60"
          >
            {isAnalyzing ? "Analyzing" : "Run ML"}
          </button>
          <button
            type="button"
            onClick={() => setAutoMlEnabled((prev) => !prev)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              autoMlEnabled
                ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/25"
                : "border-white/30 bg-white/5 text-slate-200 hover:bg-white/10"
            }`}
          >
            Auto ML {autoMlEnabled ? "On" : "Off"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-100/20 bg-slate-900">
          <video ref={videoRef} autoPlay muted playsInline className="h-[300px] w-full object-cover sm:h-[360px]" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-cyan-300/80" />
            <div className="absolute right-10 top-16 h-20 w-20 rounded-2xl border border-teal-300/70" />
            <div className="absolute bottom-8 left-1/2 h-10 w-44 -translate-x-1/2 rounded-lg border border-emerald-300/80" />
            <div className="absolute inset-x-0 top-1/2 border-t border-cyan-100/30" />
            <div className="absolute inset-y-0 left-1/2 border-l border-cyan-100/30" />
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{metric.label}</span>
                <span className={metricTone[metric.status]}>{metric.status}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-700">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-300 to-teal-300"
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">{metric.value}% | Trend: {metric.trend}</p>
            </div>
          ))}

          <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-xs text-slate-300">
            <p>Captured Frames: {cameraFrames.length}</p>
            <p>Current Confidence: {latestConfidence}%</p>
            <p>Auto ML Interval: 10s ({autoMlEnabled ? "enabled" : "disabled"})</p>
          </div>

          {mlSummary ? (
            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4 text-xs text-cyan-100">
              <p>Session: {mlSummary.sessionId}</p>
              <p>Model: {mlSummary.modelVersion}</p>
              <p>Risk: {mlSummary.riskScore}% ({mlSummary.riskLabel})</p>
              <p>Frames analyzed: {mlSummary.frameCount}</p>
              {typeof mlSummary.datasetScore === "number" ? <p>Dataset score bucket: {mlSummary.datasetScore}/10</p> : null}
            </div>
          ) : null}

          {analysisError ? <p className="text-sm text-rose-300">{analysisError}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </div>
    </div>
  )
}

export default CameraAnalysisPanel
