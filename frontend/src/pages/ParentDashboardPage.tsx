import { useMemo, useState } from "react"
import AIAgentChat from "../components/chat/AIAgentChat"
import BehaviorRadarChart from "../components/charts/BehaviorRadarChart"
import EmotionTimelineChart from "../components/charts/EmotionTimelineChart"
import RiskIndicatorMeter from "../components/charts/RiskIndicatorMeter"
import WeeklyProgressChart from "../components/charts/WeeklyProgressChart"
import SessionReviewPanel from "../components/video/SessionReviewPanel"
import GlassCard from "../components/ui/GlassCard"
import { useScreening, type SessionRecording } from "../context/ScreeningContext"
import { emotionTimeline, weeklyProgress } from "../services/mock/dataset"

const doctorRecommendations = [
  {
    name: "Dr. Kavya Menon",
    rating: 4.9,
    location: "Indiranagar, 2.1 km",
    specialty: "Pediatric Neurodevelopment",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=180&q=80",
  },
  {
    name: "Dr. Arjun Bhat",
    rating: 4.8,
    location: "HSR Layout, 3.5 km",
    specialty: "Behavior Therapy Specialist",
    photo: "https://images.unsplash.com/photo-1612531385446-f7b6b1b8f5f2?auto=format&fit=crop&w=180&q=80",
  },
  {
    name: "Dr. Nidhi Rao",
    rating: 4.7,
    location: "Jayanagar, 4.2 km",
    specialty: "Child Psychiatry",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=180&q=80",
  },
]

const ParentDashboardPage = () => {
  const { recordings } = useScreening()
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null)

  const sortedRecordings = useMemo(() => recordings.slice(0, 8), [recordings])

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Parent Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Live screening, progress tracking, nearby specialists, and AI support in one place.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard title="Live Screening">
          <p className="text-sm text-slate-600 dark:text-slate-300">Run a camera-based session and get live behavioral overlays.</p>
          <a href="/child-profile" className="mt-3 inline-block rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-white">Start session</a>
        </GlassCard>
        <GlassCard title="Therapy Tracking">
          <p className="text-sm text-slate-600 dark:text-slate-300">4 sessions completed this week. Consistency score 82%.</p>
        </GlassCard>
        <GlassCard title="Progress Report">
          <RiskIndicatorMeter score={33} />
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Child Behavior Radar">
          <BehaviorRadarChart eyeContact={74} attention={76} emotionStability={71} gestureScore={67} adaptability={69} />
        </GlassCard>
        <GlassCard title="Emotion Timeline">
          <EmotionTimelineChart data={emotionTimeline} />
        </GlassCard>
      </div>

      <GlassCard title="Weekly Development">
        <WeeklyProgressChart data={weeklyProgress} />
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Session History">
          {sortedRecordings.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No recordings yet. Start a live screening and record a session.</p>
          ) : (
            <div className="space-y-2">
              {sortedRecordings.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedRecording(item)}
                  className="w-full rounded-xl border border-slate-200/70 bg-white/75 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{item.childName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{item.createdAt} | Risk {item.riskScore}% | Duration {item.durationSec}s</p>
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <SessionReviewPanel recording={selectedRecording} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Nearby Doctor Recommendations">
          <div className="space-y-3">
            {doctorRecommendations.map((doctor) => (
              <div key={doctor.name} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                <img src={doctor.photo} alt={doctor.name} className="h-14 w-14 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-100">{doctor.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-300">{doctor.specialty}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Rating {doctor.rating} | {doctor.location}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        <AIAgentChat />
      </div>
    </section>
  )
}

export default ParentDashboardPage
