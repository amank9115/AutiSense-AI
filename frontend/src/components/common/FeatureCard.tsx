type FeatureCardProps = {
  title: string
  description: string
  accent?: string
}

const accentMap: Record<string, string> = {
  sky: "from-sky-500/10 via-sky-500/5 to-transparent",
  indigo: "from-indigo-500/10 via-indigo-500/5 to-transparent",
  emerald: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  violet: "from-violet-500/10 via-violet-500/5 to-transparent",
}

const FeatureCard = ({ title, description, accent = "sky" }: FeatureCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`pointer-events-none absolute inset-0 bg-linear-to-br ${accentMap[accent]} opacity-0 transition group-hover:opacity-100`}
      />
      <div className="relative">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
    </div>
  )
}

export default FeatureCard

