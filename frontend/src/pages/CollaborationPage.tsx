import { useEffect, useState } from "react"
import GlassCard from "../components/ui/GlassCard"
import { analysisApi } from "../services/api/analysisApi"
import type { MessageThread } from "../types"

const CollaborationPage = () => {
  const [threads, setThreads] = useState<MessageThread[]>([])

  useEffect(() => {
    const load = async () => {
      const data = await analysisApi.getMessages()
      setThreads(data)
    }
    void load()
  }, [])

  return (
    <section className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold text-white">Parent-Doctor Collaboration Hub</h1>
        <p className="mt-2 text-sm text-slate-300">Share reports, review screening sessions, and coordinate next-step recommendations.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard title="Secure Messaging (UI)">
          <div className="space-y-2">
            {threads.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-sm">
                <p className="text-slate-200">
                  <strong>{item.name}</strong> ({item.from})
                </p>
                <p className="text-slate-300">{item.message}</p>
                <p className="text-xs text-slate-400">{item.at}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-xl border border-white/15 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
              placeholder="Type message to clinician..."
            />
            <button className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">Send</button>
          </div>
        </GlassCard>

        <GlassCard title="Report Exchange">
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-3">Parent upload package: Week-5-home-session.mp4 + behavior summary.</div>
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-3">Doctor review status: In progress, expected by end-of-day.</div>
            <div className="rounded-lg border border-white/10 bg-slate-900/70 p-3">Action: Follow-up consult suggested for Mar 09, 2026.</div>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

export default CollaborationPage
