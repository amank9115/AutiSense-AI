import { motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import Button from "../ui/Button"

export type CameraLiveMetrics = {
  eyeContact: number
  attention: number
  emotionSignals: number
  gestureAnalysis: number
  confidence: number
  imageBase64?: string
}

type CameraPreviewProps = {
  onReady?: () => void
  onLiveMetrics?: (metrics: CameraLiveMetrics) => void
  metrics?: {
    eyeContact: number
    attention: number
    emotionSignals: number
    gestureAnalysis: number
  }
  onRecordingComplete?: (payload: { videoUrl: string; durationSec: number }) => void
}

type FaceBoundingBox = { x: number; y: number; width: number; height: number }
type FaceDetectionResult = { boundingBox?: FaceBoundingBox }
type FaceDetectorLike = { detect: (source: HTMLCanvasElement) => Promise<FaceDetectionResult[]> }

type FaceDetectorCtor = new () => FaceDetectorLike

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const CameraPreview = ({ onReady, onLiveMetrics, metrics, onRecordingComplete }: CameraPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const recordingStartRef = useRef<number>(0)
  const previousSampleRef = useRef<number[] | null>(null)
  const detectorRef = useRef<FaceDetectorLike | null>(null)
  const isAnalyzingRef = useRef(false)
  const smoothedRef = useRef<CameraLiveMetrics>({
    eyeContact: 72,
    attention: 74,
    emotionSignals: 69,
    gestureAnalysis: 61,
    confidence: 70,
  })
  const sampleTickRef = useRef(0)

  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const resolvedMetrics = useMemo(
    () => ({
      eyeContact: metrics?.eyeContact ?? 73,
      attention: metrics?.attention ?? 79,
      emotionSignals: metrics?.emotionSignals ?? 71,
      gestureAnalysis: metrics?.gestureAnalysis ?? 68,
    }),
    [metrics],
  )

  const runAnalysis = async () => {
    if (isAnalyzingRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return

    isAnalyzingRef.current = true

    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = frame.data
      const sampleStep = 32
      const sample: number[] = []
      let luminanceTotal = 0

      for (let index = 0; index < data.length; index += sampleStep) {
        const lum = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114
        luminanceTotal += lum
        sample.push(lum)
      }

      const brightness = sample.length > 0 ? luminanceTotal / sample.length : 0
      let motion = 0
      if (previousSampleRef.current && previousSampleRef.current.length === sample.length) {
        let diff = 0
        for (let idx = 0; idx < sample.length; idx += 1) {
          diff += Math.abs(sample[idx] - previousSampleRef.current[idx])
        }
        motion = sample.length > 0 ? (diff / sample.length / 255) * 100 : 0
      }
      previousSampleRef.current = sample

      let faceCenteredScore = 0
      let faceSizeScore = 0
      let confidence = 54

      if (!detectorRef.current && "FaceDetector" in window) {
        const FaceDetectorImpl = (window as unknown as { FaceDetector?: FaceDetectorCtor }).FaceDetector
        if (FaceDetectorImpl) detectorRef.current = new FaceDetectorImpl()
      }

      if (detectorRef.current) {
        const faces = await detectorRef.current.detect(canvas)
        const box = faces?.[0]?.boundingBox
        if (box) {
          const centerX = box.x + box.width / 2
          const centerY = box.y + box.height / 2
          const nx = Math.abs(centerX - canvas.width / 2) / (canvas.width / 2)
          const ny = Math.abs(centerY - canvas.height / 2) / (canvas.height / 2)
          faceCenteredScore = clamp(100 - (nx * 65 + ny * 35))
          const areaRatio = (box.width * box.height) / (canvas.width * canvas.height)
          faceSizeScore = clamp(areaRatio * 700)
          confidence = clamp(70 + Math.min(25, faceSizeScore / 4))
        }
      }

      const eyeContact = detectorRef.current ? clamp(faceCenteredScore * 0.75 + faceSizeScore * 0.25) : clamp(78 - motion * 0.85)
      const attention = clamp(eyeContact * 0.6 + (100 - motion) * 0.4)
      const emotionSignals = clamp(72 - Math.abs(motion - 12) * 1.6 + (brightness > 40 ? 6 : -6))
      const gestureAnalysis = clamp(20 + motion * 1.5)

      const alpha = 0.38
      const prev = smoothedRef.current
      const next: CameraLiveMetrics = {
        eyeContact: clamp(prev.eyeContact * (1 - alpha) + eyeContact * alpha),
        attention: clamp(prev.attention * (1 - alpha) + attention * alpha),
        emotionSignals: clamp(prev.emotionSignals * (1 - alpha) + emotionSignals * alpha),
        gestureAnalysis: clamp(prev.gestureAnalysis * (1 - alpha) + gestureAnalysis * alpha),
        confidence: clamp(prev.confidence * (1 - alpha) + confidence * alpha),
      }

      sampleTickRef.current += 1
      if (sampleTickRef.current % 3 === 0) {
        next.imageBase64 = canvas.toDataURL("image/jpeg", 0.5)
      }

      smoothedRef.current = next
      onLiveMetrics?.(next)
    } finally {
      isAnalyzingRef.current = false
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        onReady?.()
      }
      setError(null)
    } catch {
      setError("Camera access was denied or unavailable on this device.")
    }
  }

  const startRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    if (!stream) {
      setError("Start camera before recording.")
      return
    }

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      setRecordingUrl(url)
      const duration = Math.max(1, Math.round((Date.now() - recordingStartRef.current) / 1000))
      setRecordingDuration(duration)
      onRecordingComplete?.({ videoUrl: url, durationSec: duration })
      setIsRecording(false)
    }

    mediaRecorderRef.current = recorder
    recordingStartRef.current = Date.now()
    recorder.start(300)
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  useEffect(() => {
    if (!isStreaming) return

    const timer = window.setInterval(() => {
      void runAnalysis()
    }, 900)

    return () => window.clearInterval(timer)
  }, [isStreaming])

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach((track) => track.stop())
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    }
  }, [recordingUrl])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-950/90 dark:border-slate-700">
      <video ref={videoRef} autoPlay playsInline muted className="h-[360px] w-full object-cover sm:h-[440px]" />
      <canvas ref={canvasRef} className="hidden" />

      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <p className="mb-3 text-sm text-slate-200">Enable camera for live behavior signal analysis.</p>
            <Button onClick={startCamera}>Grant Camera Access</Button>
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 8, 0], y: [0, -4, 0] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="absolute left-[36%] top-[24%] h-32 w-28 rounded-xl border-2 border-cyan-300/80"
        />

        <div className="absolute left-[45%] top-[40%] h-20 w-20 rounded-full bg-cyan-400/20 blur-xl" />
        <div className="absolute left-[56%] top-[50%] h-16 w-16 rounded-full bg-emerald-400/20 blur-xl" />
        <div className="absolute left-[38%] top-[56%] h-14 w-14 rounded-full bg-indigo-400/20 blur-xl" />

        <div className="absolute bottom-4 left-4 rounded-md bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
          Face signal | Eye contact {resolvedMetrics.eyeContact}% | Attention {resolvedMetrics.attention}%
        </div>
      </div>

      {isStreaming && (
        <div className="absolute right-3 top-3 flex gap-2">
          {!isRecording ? (
            <Button onClick={startRecording} className="shadow-[0_0_18px_rgba(14,165,233,0.38)]">
              Start Recording
            </Button>
          ) : (
            <Button onClick={stopRecording} className="bg-rose-500 text-white hover:bg-rose-400">
              Stop Recording
            </Button>
          )}
        </div>
      )}

      {recordingUrl && (
        <div className="border-t border-slate-700/70 bg-slate-900/80 p-3">
          <p className="mb-2 text-xs text-cyan-200">Recorded Preview ({recordingDuration}s)</p>
          <video src={recordingUrl} controls className="h-44 w-full rounded-xl bg-slate-950 object-contain" />
        </div>
      )}
    </div>
  )
}

export default CameraPreview
