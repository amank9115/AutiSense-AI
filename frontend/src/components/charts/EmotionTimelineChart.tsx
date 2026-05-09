import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { EmotionPoint } from "../../types"

type EmotionTimelineChartProps = {
  data: EmotionPoint[]
}

const EmotionTimelineChart = ({ data }: EmotionTimelineChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
          <Line type="monotone" dataKey="calm" stroke="#22d3ee" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="curious" stroke="#818cf8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="stress" stroke="#fb7185" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default EmotionTimelineChart
