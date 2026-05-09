import { useState } from "react"

import Container from "../components/common/Container"
import SectionHeader from "../components/common/SectionHeader"

const RoadmapPage = () => {
  const phases = [
    {
      phase: "Now",
      timeframe: "2026 H1",
      summary: "Focused on clinician trust and caregiver adoption.",
      items: [
        "Expanded multimodal screening",
        "Clinician calibration program",
        "Caregiver support ecosystem",
      ],
    },
    {
      phase: "Next",
      timeframe: "2026 H2",
      summary: "Deepen longitudinal insights and local care pathways.",
      items: [
        "Digital twin simulations for care scenarios",
        "Longitudinal outcome tracking",
        "Adaptive care pathway recommendations",
      ],
    },
    {
      phase: "Future",
      timeframe: "2027+",
      summary: "Scale global research and privacy-preserving intelligence.",
      items: [
        "Global research collaborations",
        "Federated learning for privacy",
        "Population health intelligence dashboards",
      ],
    },
  ]

  const [activePhase, setActivePhase] = useState(0)

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-sky-50 via-white to-blue-50 py-16">
        <Container>
          <SectionHeader
            eyebrow="Future Roadmap"
            title="Advancing care intelligence responsibly."
            subtitle="Our roadmap balances scientific rigor, ethical safeguards, and real-world healthcare impact."
          />
        </Container>
      </section>

      <section>
        <Container>
          <div className="flex flex-wrap gap-3">
            {phases.map((phase, index) => {
              const isActive = index === activePhase
              return (
                <button
                  key={phase.phase}
                  type="button"
                  onClick={() => setActivePhase(index)}
                  className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-pressed={isActive}
                >
                  {phase.phase}
                </button>
              )
            })}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.6fr_0.4fr]">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {phases[activePhase].phase} · {phases[activePhase].timeframe}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {phases[activePhase].summary}
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {phases[activePhase].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4">
              {phases.map((phase, index) => (
                <div
                  key={phase.phase}
                  className={`rounded-3xl border px-5 py-4 text-sm transition ${
                    index === activePhase
                      ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "border-slate-100 bg-white text-slate-600"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                    {phase.timeframe}
                  </p>
                  <p className="mt-2 font-semibold">{phase.phase}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default RoadmapPage

