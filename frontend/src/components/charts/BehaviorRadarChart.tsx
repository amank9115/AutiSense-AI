import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type BehaviorRadarChartProps = {
  eyeContact: number
  attention: number
  emotionStability: number
  gestureScore: number
  adaptability: number
}

const BehaviorRadarChart = ({
  eyeContact,
  attention,
  emotionStability,
  gestureScore,
  adaptability,
}: BehaviorRadarChartProps) => {
  const data = [
    { skill: "Eye", score: eyeContact },
    { skill: "Attention", score: attention },
    { skill: "Emotion", score: emotionStability },
    { skill: "Gesture", score: gestureScore },
    { skill: "Adapt", score: adaptability },
  ]

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(148,163,184,0.35)" />
          <PolarAngleAxis dataKey="skill" stroke="#bfdbfe" />
          <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default BehaviorRadarChart
