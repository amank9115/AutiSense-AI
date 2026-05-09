import { motion } from "framer-motion"
import GlassCard from "../ui/GlassCard"

const storySteps = [
  {
    title: "Problem",
    text: "Early signals are often subtle, inconsistent, and easy to miss across home and clinic environments.",
  },
  {
    title: "Technology",
    text: "Behavioral AI models transform gaze, affect, and interaction patterns into explainable, longitudinal markers.",
  },
  {
    title: "Solution",
    text: "A parent-clinician platform that supports secure screening sessions, AI summaries, and collaborative care planning.",
  },
  {
    title: "Impact",
    text: "Faster triage, earlier intervention opportunities, and better continuity from home observation to professional assessment.",
  },
]

const StoryFlowSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs tracking-[0.2em] text-cyan-200 uppercase">Narrative Flow</p>
        <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">From concern to confident clinical conversation.</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {storySteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <GlassCard title={`${index + 1}. ${step.title}`}>
              <p className="text-sm text-slate-300">{step.text}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default StoryFlowSection
