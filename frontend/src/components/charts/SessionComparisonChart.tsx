import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type SessionComparisonChartProps = {
  data: { label: string; attention: number; engagement: number }[]
}

const SessionComparisonChart = ({ data }: SessionComparisonChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Legend />
          <Bar dataKey="attention" fill="#22d3ee" radius={[6, 6, 0, 0]} />
          <Bar dataKey="engagement" fill="#818cf8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SessionComparisonChart
