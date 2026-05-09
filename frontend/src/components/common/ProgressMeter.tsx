import { useEffect, useState } from "react"

type ProgressMeterProps = {
  label: string
  value: number
  note: string
}

const ProgressMeter = ({ label, value, note }: ProgressMeterProps) => {
  const [activeValue, setActiveValue] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => setActiveValue(value), 120)
    return () => clearTimeout(timeout)
  }, [value])

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-sky-500 via-blue-600 to-indigo-600 transition-all duration-700"
          style={{ width: `${activeValue}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-slate-600">{note}</p>
    </div>
  )
}

export default ProgressMeter
