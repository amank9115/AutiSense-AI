import { motion } from "framer-motion"

type LiveMlPanelProps = {
  eyeContact: number
  attention: number
  emotionStability: number
  gestureDetection: number
}

const MetricRow = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/65">
    <p className="text-slate-500 dark:text-slate-300">{label}</p>
    <motion.p
      key={`${label}-${value}`}
      initial={{ opacity: 0.6, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm font-semibold text-slate-800 dark:text-slate-100"
    >
      {value}%
    </motion.p>
  </div>
)

const LiveMlPanel = ({ eyeContact, attention, emotionStability, gestureDetection }: LiveMlPanelProps) => {
  return (
    <aside className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/65">
      <p className="mb-2 text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">Live ML Panel</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <MetricRow label="Eye Contact Score" value={eyeContact} />
        <MetricRow label="Attention Score" value={attention} />
        <MetricRow label="Emotion Stability" value={emotionStability} />
        <MetricRow label="Gesture Detection" value={gestureDetection} />
      </div>
    </aside>
  )
}

export default LiveMlPanel
