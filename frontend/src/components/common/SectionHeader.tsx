type SectionHeaderProps = {
  eyebrow: string
  title: string
  subtitle: string
  tone?: "light" | "dark"
}

const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  tone = "dark",
}: SectionHeaderProps) => {
  const eyebrowClass =
    tone === "light" ? "text-sky-200" : "text-sky-600"
  const titleClass =
    tone === "light" ? "text-white" : "text-slate-900"
  const subtitleClass =
    tone === "light" ? "text-slate-200" : "text-slate-600"

  return (
    <div className="max-w-3xl">
      <p
        className={`text-xs font-semibold uppercase tracking-[0.3em] ${eyebrowClass}`}
      >
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-3xl font-semibold sm:text-4xl ${titleClass}`}>
        {title}
      </h2>
      <p className={`mt-3 text-base leading-relaxed ${subtitleClass}`}>
        {subtitle}
      </p>
    </div>
  )
}

export default SectionHeader
