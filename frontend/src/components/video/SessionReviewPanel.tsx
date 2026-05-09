import { useEffect, useState } from "react"
import type { SessionRecording } from "../../context/ScreeningContext"

type SessionReviewPanelProps = {
  recording: SessionRecording | null
  onSaveNotes?: (recordingId: string, notes: string) => void
}

const SessionReviewPanel = ({ recording, onSaveNotes }: SessionReviewPanelProps) => {
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setNotes(recording?.doctorReviewNotes ?? "")
  }, [recording])

  if (!recording) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/65 dark:text-slate-300">
        Select a recording to open Session Review.
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/65">
      <p className="text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">Session Review</p>
      <video src={recording.videoUrl} controls className="h-56 w-full rounded-xl bg-slate-950 object-contain" />

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-950/55">Child: <span className="font-semibold">{recording.childName}</span></div>
        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-950/55">Risk: <span className="font-semibold">{recording.riskScore}%</span></div>
        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-950/55">Eye Contact: <span className="font-semibold">{recording.metrics.eyeContact}%</span></div>
        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-950/55">Attention: <span className="font-semibold">{recording.metrics.attention}%</span></div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Doctor notes..."
        className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white/80 p-3 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/65 dark:text-slate-200"
      />
      {onSaveNotes && (
        <button onClick={() => onSaveNotes(recording.id, notes)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          Save Review Notes
        </button>
      )}
    </div>
  )
}

export default SessionReviewPanel
