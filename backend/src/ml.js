import { mlDatasetModel } from "./data/mlDataset.js"

const sigmoid = (x) => 1 / (1 + Math.exp(-x))

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const scoreCameraScreening = (frames) => {
  const eye = mean(frames.map((frame) => frame.eyeContact))
  const attention = mean(frames.map((frame) => frame.attentionSpan))
  const emotion = mean(frames.map((frame) => frame.emotionSignals))
  const gesture = mean(frames.map((frame) => frame.gestureAnalysis))

  // Simple logistic model baseline for MVP screening support.
  const linear =
    -4.2 +
    0.036 * (100 - eye) +
    0.042 * (100 - attention) +
    0.028 * (100 - emotion) +
    0.031 * (100 - gesture)

  const logisticProbability = sigmoid(linear)

  // Map camera behavior signals to an estimated AQ-10 result score (0-10)
  // then use dataset-derived ASD probability by score.
  const weightedSignal = 0.32 * eye + 0.34 * attention + 0.2 * emotion + 0.14 * gesture
  const estimatedResultScore = clamp(Math.round((100 - weightedSignal) / 10), 0, 10)
  const datasetProbability =
    mlDatasetModel.scoreProbability[estimatedResultScore] ?? mlDatasetModel.prevalence

  // Blend dataset estimate and signal dynamics.
  const probability = clamp(0.62 * datasetProbability + 0.38 * logisticProbability, 0.01, 0.99)
  const riskScore = Math.round(probability * 100)

  const riskLabel = riskScore >= 65 ? "high" : riskScore >= 35 ? "moderate" : "low"

  const recommendations = [
    "Continue structured turn-taking play and eye-contact prompting.",
    "Review noisy segments with clinician before drawing conclusions.",
    "Repeat session within 7-14 days for trend stability.",
  ]

  return {
    riskScore,
    riskLabel,
    modelVersion: "camera-screening-logistic-v1",
    featureAverages: {
      eyeContact: Math.round(eye),
      attentionSpan: Math.round(attention),
      emotionSignals: Math.round(emotion),
      gestureAnalysis: Math.round(gesture),
    },
    recommendations,
    datasetContext: {
      loaded: mlDatasetModel.loaded,
      rows: mlDatasetModel.rows,
      estimatedResultScore,
      prevalence: Number(mlDatasetModel.prevalence.toFixed(3)),
    },
  }
}
