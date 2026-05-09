import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { WeeklyProgress } from "../../types"

type WeeklyProgressChartProps = {
  data: WeeklyProgress[]
}

const WeeklyProgressChart = ({ data }: WeeklyProgressChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Area type="monotone" dataKey="engagement" stroke="#22d3ee" fill="#22d3ee33" />
          <Area type="monotone" dataKey="communication" stroke="#818cf8" fill="#818cf833" />
          <Area type="monotone" dataKey="adaptation" stroke="#34d399" fill="#34d39933" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyProgressChart
