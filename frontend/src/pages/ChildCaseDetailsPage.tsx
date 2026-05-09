import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import GlassCard from "../components/ui/GlassCard"
import { useScreening } from "../context/ScreeningContext"

const ChildCaseDetailsPage = () => {
  const { caseId = "" } = useParams()
  const { caseRecords, updateDoctorNotes } = useScreening()

  const record = useMemo(() => caseRecords.find((item) => item.id === caseId), [caseRecords, caseId])
  const [notes, setNotes] = useState(record?.doctorNotes ?? "")

  if (!record) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
          <p className="text-sm text-slate-600 dark:text-slate-300">Case not found.</p>
          <Link to="/doctor-dashboard" className="mt-3 inline-block text-sm font-semibold text-sky-600 dark:text-sky-300">Back to dashboard</Link>
        </div>
      </section>
    )
  }

  const saveNotes = () => updateDoctorNotes(record.id, notes)

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-sky-600 uppercase dark:text-sky-300">Medical Case Details</p>
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">{record.profile.childName} ({record.id})</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Parent: {record.profile.parentName} | Risk Score: {record.riskScore}%</p>
        </div>
        <Link to="/doctor-dashboard" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">Back to Dashboard</Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Child Profile Information">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Age: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.age}</span></p>
            <p>DOB: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.dateOfBirth}</span></p>
            <p>Gender: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.gender}</span></p>
            <p>Address: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.homeAddress}</span></p>
            <p>City/State: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.city}, {record.profile.state}</span></p>
            <p>Emergency: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.emergencyContact}</span></p>
          </div>
        </GlassCard>

        <GlassCard title="Screening Metrics">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Eye Contact Score: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.metrics.eyeContactScore}%</span></p>
            <p>Attention Level: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.metrics.attentionLevel}%</span></p>
            <p>Emotion Pattern: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.metrics.emotionPattern}</span></p>
            <p>Indicators:</p>
            <ul className="list-disc pl-4 text-xs">
              {record.metrics.behaviorIndicators.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </GlassCard>

        <GlassCard title="Location + Distance">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>City: <span className="font-semibold text-slate-800 dark:text-slate-100">{record.profile.city}</span></p>
            <p>Distance from clinic (simulated): <span className="font-semibold text-emerald-600 dark:text-emerald-300">{(2 + record.riskScore / 25).toFixed(1)} km</span></p>
            <div className="rounded-xl border border-slate-200/70 bg-gradient-to-br from-sky-100 to-emerald-100 p-4 text-xs dark:border-slate-700 dark:from-sky-900/40 dark:to-emerald-900/30">
              Map Preview
              <p className="mt-1">Lat: {record.profile.location.lat ?? "N/A"} | Lng: {record.profile.location.lng ?? "N/A"}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Recorded Session Summary">
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{record.summary}</p>
          <div className="space-y-2 text-xs">
            {record.sessionHistory.map((session) => (
              <div key={session.id} className="rounded-lg border border-slate-200/70 bg-white/70 p-2 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="font-semibold text-slate-700 dark:text-slate-100">{session.id}</p>
                <p className="text-slate-500 dark:text-slate-300">{session.date} | {session.duration} | Risk {session.riskScore}%</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Doctor Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[160px] w-full rounded-xl border border-slate-300 bg-white/80 p-3 text-sm text-slate-700 outline-none focus:border-sky-400 dark:border-slate-600 dark:bg-slate-900/65 dark:text-slate-200"
            placeholder="Write observations and recommended next steps..."
          />
          <button onClick={saveNotes} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Save Notes</button>
        </GlassCard>
      </div>
    </section>
  )
}

export default ChildCaseDetailsPage
