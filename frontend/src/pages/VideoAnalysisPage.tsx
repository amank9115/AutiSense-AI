import { useRef } from "react"
import GlassCard from "../components/ui/GlassCard"

const VideoAnalysisPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Recorded Video Analysis</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Playback-ready workspace with ML-ready overlays for face, gaze, and gesture detection hooks.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-950/90 dark:border-slate-700">
          <video ref={videoRef} controls className="h-[460px] w-full object-cover">
            <source src="" type="video/mp4" />
          </video>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-[20%] left-[24%] h-24 w-24 rounded-xl border border-cyan-300" />
            <div className="absolute top-[22%] right-[24%] h-20 w-20 rounded-xl border border-indigo-300" />
            <div className="absolute bottom-6 left-6 rounded-md bg-slate-950/80 px-3 py-2 text-xs text-cyan-100">
              Face detection placeholder | Gaze tracking placeholder | Gesture detection placeholder
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <GlassCard title="Frame-by-Frame Signals">
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>00:37 - gaze focus drift</li>
              <li>01:24 - imitation gesture response</li>
              <li>03:02 - attention recovery after prompt</li>
            </ul>
          </GlassCard>

          <GlassCard title="ML Integration Hooks">
            <code className="block rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-950/90 dark:text-slate-300">
              POST /api/v1/analysis/video-session{"\n"}
              GET /api/v1/analysis/session/:id/insights{"\n"}
              GET /api/v1/analysis/session/:id/frames
            </code>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}

export default VideoAnalysisPage
