import { useEffect, useState } from "react"

import { liveMetricSeed } from "../data/mockPlatformData"
import { simulateBehaviorFrame } from "../services/aiService"
import type { BehaviorMetric } from "../types/platform"

export const useLiveBehaviorMetrics = (isRunning: boolean, frameInterval = 1300) => {
  const [metrics, setMetrics] = useState<BehaviorMetric[]>(
    liveMetricSeed.map((metric) => ({ ...metric })),
  )

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const interval = window.setInterval(async () => {
      const nextFrame = await simulateBehaviorFrame()
      setMetrics(nextFrame)
    }, frameInterval)

    return () => {
      window.clearInterval(interval)
    }
  }, [frameInterval, isRunning])

  return metrics
}

