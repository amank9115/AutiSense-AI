type StatCardProps = {
  label: string
  value: string
  detail: string
}

const StatCard = ({ label, value, detail }: StatCardProps) => {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  )
}

export default StatCard
