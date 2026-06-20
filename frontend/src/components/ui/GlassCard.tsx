import type { ReactNode } from "react"

type GlassCardProps = {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}

const GlassCard = ({ title, subtitle, children, className = "" }: GlassCardProps) => {
  return (
    <section
      className={`rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60 dark:shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_20px_60px_rgba(2,6,23,0.45)] ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}

export default GlassCard
