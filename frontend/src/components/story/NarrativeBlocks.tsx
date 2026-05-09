import GlassCard from "../ui/GlassCard"

const sections = [
  {
    title: "Why Early Detection Matters",
    body: "Intervention windows are strongest in early developmental years. Consistent behavior tracking helps clinicians prioritize support earlier.",
  },
  {
    title: "Behavioral AI Explained",
    body: "The platform converts multimodal observations into interpretable indicators: attention continuity, social reciprocity, and adaptive responses.",
  },
  {
    title: "Ethics & Non-Diagnosis Policy",
    body: "Neurolytix AI is a decision-support product. It does not issue medical diagnoses and always surfaces confidence and uncertainty context.",
  },
  {
    title: "Platform Ecosystem",
    body: "Parents, clinicians, and care coordinators align through shared reports, timelines, and communication tools with role-based views.",
  },
]

const NarrativeBlocks = () => {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
      {sections.map((item) => (
        <GlassCard key={item.title} title={item.title}>
          <p className="text-sm leading-relaxed text-slate-300">{item.body}</p>
        </GlassCard>
      ))}
    </section>
  )
}

export default NarrativeBlocks
