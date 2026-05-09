import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import AIAgentChat from "../components/chat/AIAgentChat"
import AttentionHeatmap from "../components/charts/AttentionHeatmap"
import SessionComparisonChart from "../components/charts/SessionComparisonChart"
import SessionReviewPanel from "../components/video/SessionReviewPanel"
import GlassCard from "../components/ui/GlassCard"
import { useScreening, type SessionRecording } from "../context/ScreeningContext"

const comparison = [
  { label: "Case A", attention: 66, engagement: 61 },
  { label: "Case B", attention: 72, engagement: 70 },
  { label: "Case C", attention: 58, engagement: 55 },
]

const recommendations = [
  "Prioritize elevated-risk cases for same-day review.",
  "Compare multi-session trend before final recommendation.",
  "Escalate severe-risk profiles to emergency workflow.",
]

type LiveMonitorItem = {
  childName: string
  location: string
  status: "Active" | "Stabilizing" | "Escalated"
  riskScore: number
}

const DoctorDashboardPage = () => {
  const { caseRecords, emergencyAlerts, recordings, updateRecordingNotes } = useScreening()
  const navigate = useNavigate()
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null)
  const [liveMonitor, setLiveMonitor] = useState<LiveMonitorItem[]>([])

  useEffect(() => {
    const rebuild = () => {
      const next = caseRecords.slice(0, 5).map((item) => {
        const nextRisk = Math.max(10, Math.min(95, item.riskScore + Math.round(Math.random() * 8 - 4)))
        const status: LiveMonitorItem["status"] = nextRisk >= 65 ? "Escalated" : nextRisk >= 40 ? "Active" : "Stabilizing"
        return {
          childName: item.profile.childName,
          location: `${item.profile.city}, ${item.profile.state}`,
          status,
          riskScore: nextRisk,
        }
      })
      setLiveMonitor(next)
    }

    rebuild()
    const timer = setInterval(rebuild, 3200)
    return () => clearInterval(timer)
  }, [caseRecords])

  const recentRecordings = useMemo(() => recordings.slice(0, 8), [recordings])

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Doctor Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Case management, screening intelligence, and emergency escalation overview.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Active Cases">
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{caseRecords.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300">Total cases available for review</p>
        </GlassCard>
        <GlassCard title="High Risk Alerts">
          <p className="text-2xl font-semibold text-rose-600 dark:text-rose-300">{caseRecords.filter((item) => item.riskScore >= 60).length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-300">Require immediate follow-up</p>
        </GlassCard>
        <GlassCard title="Average Risk Score">
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {Math.round(caseRecords.reduce((acc, item) => acc + item.riskScore, 0) / Math.max(1, caseRecords.length))}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-300">Across all listed sessions</p>
        </GlassCard>
      </div>

      <GlassCard title="Doctor Live Monitoring Panel">
        {liveMonitor.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No active screenings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-300">
                  <th className="px-3 py-2">Child Name</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {liveMonitor.map((item) => (
                  <tr key={`${item.childName}-${item.location}`} className="border-t border-slate-200/70 dark:border-slate-700">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{item.childName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.location}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.status}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.riskScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Screening Cases">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-300">
                <th className="px-3 py-2">Child</th>
                <th className="px-3 py-2">Parent</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Session History</th>
              </tr>
            </thead>
            <tbody>
              {caseRecords.map((item) => {
                const riskStyle = item.riskScore >= 60
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  : item.riskScore >= 35
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"

                const distanceKm = (2 + item.riskScore / 25).toFixed(1)

                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-slate-200/70 transition hover:bg-slate-100/60 dark:border-slate-700 dark:hover:bg-slate-800/40"
                    onClick={() => navigate(`/doctor/case/${item.id}`)}
                  >
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                      <p className="font-semibold">{item.profile.childName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{item.id}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{item.profile.parentName}</td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                      <p>{item.profile.city}, {item.profile.state}</p>
                      <p className="text-xs">Map preview | {distanceKm} km away</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskStyle}`}>{item.riskScore}%</span>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{item.sessionHistory.length} session(s)</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Session Recordings for Review">
          {recentRecordings.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No recordings available yet.</p>
          ) : (
            <div className="space-y-2">
              {recentRecordings.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedRecording(item)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white/75 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{item.childName} | {item.createdAt}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Risk {item.riskScore}% | {item.locationLabel} | Duration {item.durationSec}s</p>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <SessionReviewPanel recording={selectedRecording} onSaveNotes={updateRecordingNotes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Behavior Session Comparison">
          <SessionComparisonChart data={comparison} />
        </GlassCard>
        <GlassCard title="Attention Heatmap">
          <AttentionHeatmap />
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Doctor Recommendation List">
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {recommendations.map((item) => (
              <li key={item} className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-900/60">{item}</li>
            ))}
          </ul>
        </GlassCard>
        <AIAgentChat />
      </div>

      <GlassCard title="Emergency Alert Feed">
        {emergencyAlerts.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">No emergency alerts yet.</p>
        ) : (
          <div className="space-y-2">
            {emergencyAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-rose-200/70 bg-rose-50/70 p-3 text-xs dark:border-rose-500/30 dark:bg-rose-900/20">
                <p className="font-semibold text-rose-700 dark:text-rose-300">{alert.childName} | Risk {alert.riskScore}%</p>
                <p className="text-slate-700 dark:text-slate-200">Parent: {alert.parentName} ({alert.parentPhone})</p>
                <p className="text-slate-700 dark:text-slate-200">Emergency: {alert.emergencyContact}</p>
                <p className="text-slate-700 dark:text-slate-200">Location: {alert.city}, {alert.state}</p>
                <p className="text-slate-500 dark:text-slate-300">{alert.at}</p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </section>
  )
}

export default DoctorDashboardPage
