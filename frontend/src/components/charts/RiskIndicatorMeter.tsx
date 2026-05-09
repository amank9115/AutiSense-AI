type RiskIndicatorMeterProps = {
  score: number
}

const RiskIndicatorMeter = ({ score }: RiskIndicatorMeterProps) => {
  const normalized = Math.max(0, Math.min(100, score))
  const color = normalized < 30 ? "#34d399" : normalized < 60 ? "#fbbf24" : "#fb7185"

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
        <span>Composite Risk Indicator</span>
        <span className="font-semibold" style={{ color }}>
          {normalized}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div className="h-3 rounded-full transition-all" style={{ width: `${normalized}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 text-xs text-slate-400">AI support signal only. Clinical review required for decisions.</p>
    </div>
  )
}

export default RiskIndicatorMeter
