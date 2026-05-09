import { Link } from "react-router-dom"
import AIAgentChat from "../components/chat/AIAgentChat"
import WeeklyProgressChart from "../components/charts/WeeklyProgressChart"
import DemoBanner from "../components/demo/DemoBanner"
import GlassCard from "../components/ui/GlassCard"
import { weeklyProgress } from "../services/mock/dataset"

const DemoDashboardPage = () => {
  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <DemoBanner />

      <header>
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Guest Demo Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Explore AI screening, analytics, chat assistant, and role dashboards with simulated demo data.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard title="Try Screening">
          <p className="text-sm text-slate-600 dark:text-slate-300">Open live screening with AI overlays and session recording.</p>
          <Link to="/child-profile" className="mt-3 inline-block rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white">Open Screening</Link>
        </GlassCard>
        <GlassCard title="Parent View">
          <p className="text-sm text-slate-600 dark:text-slate-300">Check progress charts and session history.</p>
          <Link to="/parent-dashboard" className="mt-3 inline-block rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white">Open Parent Dashboard</Link>
        </GlassCard>
        <GlassCard title="Doctor View">
          <p className="text-sm text-slate-600 dark:text-slate-300">Review cases, alerts, and session recordings.</p>
          <Link to="/doctor-dashboard" className="mt-3 inline-block rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white">Open Doctor Dashboard</Link>
        </GlassCard>
        <GlassCard title="Create Account">
          <p className="text-sm text-slate-600 dark:text-slate-300">Switch to a real account anytime.</p>
          <Link to="/login?mode=register" className="mt-3 inline-block rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">Register</Link>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Demo Progress Analytics">
          <WeeklyProgressChart data={weeklyProgress} />
        </GlassCard>
        <AIAgentChat />
      </div>
    </section>
  )
}

export default DemoDashboardPage
