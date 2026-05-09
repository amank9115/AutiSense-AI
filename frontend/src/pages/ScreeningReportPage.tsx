import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useScreening } from "../context/ScreeningContext"
import { getApiBaseUrl } from "../api/client"

// ── Types ─────────────────────────────────────────────────────────────────────
type FeatureAverages = {
  eye_contact: number
  attention_span: number
  emotion_signals: number
  gesture_analysis: number
  confidence?: number
}

type AQScores = Record<string, number>

type SessionReportData = {
  risk_score: number
  risk_label: "low" | "moderate" | "high"
  feature_averages: FeatureAverages
  model_version: string
  aq_scores: AQScores
  recommendations: string[]
  child_name?: string
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  city?: string
  state?: string
  session_date?: string
  dataset?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const riskConfig = {
  high:     { color: "text-rose-600 dark:text-rose-300",     bg: "bg-rose-500/10 border-rose-300 dark:border-rose-600",   bar: "bg-rose-500",     label: "High Risk" },
  moderate: { color: "text-amber-600 dark:text-amber-300",   bg: "bg-amber-500/10 border-amber-300 dark:border-amber-600", bar: "bg-amber-400",    label: "Moderate Risk" },
  low:      { color: "text-emerald-600 dark:text-emerald-300",bg: "bg-emerald-500/10 border-emerald-300 dark:border-emerald-600", bar: "bg-emerald-500", label: "Low Risk" },
}

const AQ_LABELS: Record<string, string> = {
  A1_Score: "Responds when name called",
  A2_Score: "Social interaction ease",
  A3_Score: "Non-verbal communication",
  A4_Score: "Pointing gestures",
  A5_Score: "Pretend play behaviour",
  A6_Score: "Follows pointing gestures",
  A7_Score: "Maintains eye contact",
  A8_Score: "Repetitive / stimming behaviour",
  A9_Score: "Facial expression response",
  A10_Score: "Response to others' emotions",
}

function MetricBar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  const barColor = value >= 65 ? "bg-emerald-500" : value >= 40 ? "bg-amber-400" : "bg-rose-500"
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

function RiskGauge({ score, label }: { score: number; label: "low" | "moderate" | "high" }) {
  const cfg = riskConfig[label]
  const rotation = -90 + (score / 100) * 180

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-28 w-56">
        <svg viewBox="0 0 200 110" className="h-full w-full">
          {/* Background track */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
          {/* Low zone */}
          <path d="M 20 100 A 80 80 0 0 1 73 31" fill="none" stroke="#10b981" strokeWidth="16" strokeLinecap="round" opacity="0.7" />
          {/* Moderate zone */}
          <path d="M 73 31 A 80 80 0 0 1 127 31" fill="none" stroke="#f59e0b" strokeWidth="16" strokeLinecap="round" opacity="0.7" />
          {/* High zone */}
          <path d="M 127 31 A 80 80 0 0 1 180 100" fill="none" stroke="#f43f5e" strokeWidth="16" strokeLinecap="round" opacity="0.7" />
          {/* Needle */}
          <line
            x1="100" y1="100" x2="100" y2="28"
            stroke="#0f172a" strokeWidth="3" strokeLinecap="round"
            transform={`rotate(${rotation}, 100, 100)`}
            className="dark:stroke-slate-100"
          />
          <circle cx="100" cy="100" r="6" fill="#0f172a" className="dark:fill-slate-100" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className={`text-3xl font-bold ${cfg.color}`}>{score}%</span>
        </div>
      </div>
      <span className={`rounded-full border px-4 py-1 text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
const ScreeningReportPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { activeProfile } = useScreening()

  const [reportData, setReportData] = useState<SessionReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const hasLoaded = useRef(false)

  useEffect(() => {
    if (!sessionId || hasLoaded.current) return
    hasLoaded.current = true

    const fetchData = async () => {
      try {
        // Try to get data from Python ML service via Node proxy
        const API = getApiBaseUrl()
        const resp = await fetch(`${API}/ml/sessions/${encodeURIComponent(sessionId)}/py-data`)
        if (resp.ok) {
          const data = await resp.json()
          setReportData(data as SessionReportData)
        } else {
          setError("Session data not found. The ML service may be offline or the session expired.")
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load session data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [sessionId])

  const downloadPdf = async () => {
    if (!sessionId) return
    setPdfLoading(true)
    setPdfError(null)

    try {
      const API = getApiBaseUrl()
      const params = new URLSearchParams()
      if (activeProfile?.childName)  params.set("childName",  activeProfile.childName)
      if (activeProfile?.parentName) params.set("parentName", activeProfile.parentName)
      if (activeProfile?.parentEmail)params.set("parentEmail",activeProfile.parentEmail)
      if (activeProfile?.parentPhone)params.set("parentPhone",activeProfile.parentPhone)
      if (activeProfile?.city)       params.set("city",       activeProfile.city)
      if (activeProfile?.state)      params.set("state",      activeProfile.state)

      const resp = await fetch(`${API}/ml/sessions/${encodeURIComponent(sessionId)}/report?${params}`)
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}))
        throw new Error((payload as { message?: string }).message ?? `Server error ${resp.status}`)
      }

      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const childName = (activeProfile?.childName ?? reportData?.child_name ?? "Report").replace(/\s+/g, "_")
      a.download = `ManasSaathi_${childName}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : "PDF download failed.")
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Loading & error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading screening report…</p>
        </div>
      </section>
    )
  }

  if (error || !reportData) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-8 dark:border-rose-700 dark:bg-rose-900/20">
          <h1 className="text-xl font-semibold text-rose-700 dark:text-rose-300">Report Unavailable</h1>
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-200">{error ?? "Unknown error"}</p>
          <p className="mt-2 text-xs text-rose-500 dark:text-rose-300">
            Make sure the Python ML service is running:{" "}
            <code className="rounded bg-rose-100 px-1 dark:bg-rose-900">uvicorn app.main:app --port 8001</code>
          </p>
          <Link
            to="/live-screening"
            className="mt-4 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            ← Back to Screening
          </Link>
        </div>
      </section>
    )
  }

  const cfg = riskConfig[reportData.risk_label ?? "low"]
  const feat = reportData.feature_averages ?? {}

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-sky-600 dark:text-sky-300">ManasSaathi</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">Screening Report</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Session ID: <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">{sessionId}</code>
            {reportData.session_date && <> &nbsp;|&nbsp; {reportData.session_date}</>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            id="download-pdf-btn"
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
          >
            {pdfLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating PDF…
              </>
            ) : (
              <>📄 Download PDF Report</>
            )}
          </button>
          {pdfError && <p className="text-xs text-rose-500">{pdfError}</p>}
          <Link to="/doctor-dashboard" className="text-xs text-sky-600 underline dark:text-sky-300">
            Send to Doctor →
          </Link>
        </div>
      </header>

      {/* ── Child + Risk card ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Child Info */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">Child & Parent</p>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Child Name", reportData.child_name ?? activeProfile?.childName ?? "—"],
              ["Parent", reportData.parent_name ?? activeProfile?.parentName ?? "—"],
              ["Phone", reportData.parent_phone ?? activeProfile?.parentPhone ?? "—"],
              ["Email", reportData.parent_email ?? activeProfile?.parentEmail ?? "—"],
              ["Location", `${reportData.city ?? activeProfile?.city ?? "—"}, ${reportData.state ?? activeProfile?.state ?? "—"}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100 text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Risk Gauge */}
        <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 ${cfg.bg}`}>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Risk Assessment</p>
          <RiskGauge score={reportData.risk_score} label={reportData.risk_label} />
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Model: <span className="font-mono">{reportData.model_version}</span>
          </p>
          {reportData.dataset && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">Data: {reportData.dataset}</p>
          )}
        </div>
      </div>

      {/* ── Behavioral Metrics ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
          Behavioral Feature Analysis (MediaPipe CV)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricBar label="Eye Contact" value={feat.eye_contact ?? 0} hint="Gaze direction & iris tracking" />
          <MetricBar label="Attention Span" value={feat.attention_span ?? 0} hint="Head pose yaw/pitch estimation" />
          <MetricBar label="Emotion Signals" value={feat.emotion_signals ?? 0} hint="Facial expression ratio (MAR/EAR)" />
          <MetricBar label="Gesture Analysis" value={feat.gesture_analysis ?? 0} hint="Hand landmark proximity & movement" />
        </div>
      </div>

      {/* ── AQ-10 Mapping ── */}
      {reportData.aq_scores && Object.keys(reportData.aq_scores).length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
            AQ-10 Behavioral Indicator Mapping
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                  <th className="pb-2 pr-4">Q#</th>
                  <th className="pb-2 pr-4">Behavior Observed</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2">Concern</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(reportData.aq_scores)
                  .filter(([k]) => k.startsWith("A") && k.endsWith("_Score"))
                  .map(([key, val]) => {
                    const isConcern = Number(val) >= 0.5
                    return (
                      <tr key={key} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">{key.replace("_Score", "")}</td>
                        <td className="py-2 pr-4 text-slate-700 dark:text-slate-200">{AQ_LABELS[key] ?? key}</td>
                        <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{Number(val).toFixed(2)}</td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              isConcern
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {isConcern ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
          Recommendations & Next Steps
        </p>
        <ol className="space-y-3">
          {(reportData.recommendations ?? []).map((rec, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-200">{rec}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Parent Guidance ── */}
      <div className="rounded-2xl border border-sky-200/60 bg-sky-50/50 p-5 dark:border-sky-800/40 dark:bg-sky-900/10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-300">
          For Parents — What This Means
        </p>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <p>
            <strong>This is a screening tool, not a diagnosis.</strong> Like a thermometer reading, it tells you
            something may need attention — but a doctor makes the diagnosis.
          </p>
          <p>
            The AI analyzed your child's <strong>eye contact, attention, facial expressions, and hand movements</strong>{" "}
            through the camera using Google MediaPipe technology. It compared these patterns against the{" "}
            <strong>UCI ASD research dataset (292 children)</strong>.
          </p>
          <p>
            <strong>Resources in India:</strong> National Trust: <strong>1800-11-4515</strong> (toll-free) &nbsp;|&nbsp;
            Action for Autism: <strong>+91-11-4054-0991</strong> &nbsp;|&nbsp; NIMHANS: <strong>+91-80-4611-5900</strong>
          </p>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        ⚠ This report is for informational support only and does NOT constitute a medical diagnosis.
        Always consult a qualified developmental pediatrician for clinical evaluation.
        ManasSaathi uses open research data (UCI ASD Screening Dataset, ID 419).
      </p>

      {/* ── Actions ── */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/live-screening"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          ← New Screening
        </Link>
        <Link
          to="/doctor-dashboard"
          className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Send to Doctor Queue →
        </Link>
        <button
          onClick={downloadPdf}
          disabled={pdfLoading}
          className="rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pdfLoading ? "Generating…" : "📄 Download PDF"}
        </button>
      </div>
    </section>
  )
}

export default ScreeningReportPage
