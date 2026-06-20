type RiskMeterProps = {
  value: number
}

const RiskMeter = ({ value }: RiskMeterProps) => {
  const normalized = Math.max(0, Math.min(100, value))

  return (
    <div className="rounded-3xl border border-white/20 bg-slate-950/60 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
        Risk Indicator
      </p>
      <div className="mt-6 h-3 rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500"
          style={{ width: `${normalized}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
        <span>Low</span>
        <span className="font-semibold text-white">{normalized}%</span>
        <span>High</span>
      </div>
    </div>
  )
}

export default RiskMeter

