import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const datasetPath = path.resolve(__dirname, "../ml-data/Autism_Data.arff")

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const safeSplit = (line) =>
  line
    .split(",")
    .map((part) => part.trim().replace(/^'/, "").replace(/'$/, ""))

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const buildModel = () => {
  if (!fs.existsSync(datasetPath)) {
    return {
      loaded: false,
      reason: "Dataset file not found",
      rows: 0,
      prevalence: 0.38,
      scoreProbability: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i, 0.38])),
    }
  }

  const raw = fs.readFileSync(datasetPath, "utf8")
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const headerIndex = lines.findIndex((line) => line.toLowerCase().startsWith("a1_score"))
  if (headerIndex < 0) {
    return {
      loaded: false,
      reason: "Dataset header not found",
      rows: 0,
      prevalence: 0.38,
      scoreProbability: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i, 0.38])),
    }
  }

  const dataLines = lines.slice(headerIndex + 1)
  let total = 0
  let positive = 0

  const bucket = new Map()
  for (let score = 0; score <= 10; score += 1) {
    bucket.set(score, { total: 0, yes: 0 })
  }

  for (const line of dataLines) {
    const cols = safeSplit(line)
    if (cols.length < 21) {
      continue
    }

    const score = toNumber(cols[17])
    const classLabel = String(cols[20] ?? "").toUpperCase()
    if (score === null) {
      continue
    }

    const boundedScore = clamp(Math.round(score), 0, 10)
    const row = bucket.get(boundedScore)
    if (!row) {
      continue
    }

    row.total += 1
    total += 1
    if (classLabel === "YES") {
      row.yes += 1
      positive += 1
    }
  }

  const prevalence = total > 0 ? positive / total : 0.38
  const scoreProbability = {}
  for (let score = 0; score <= 10; score += 1) {
    const row = bucket.get(score) ?? { total: 0, yes: 0 }
    // Laplace smoothing to prevent zero-probability buckets.
    scoreProbability[score] = (row.yes + 1) / (row.total + 2)
  }

  return {
    loaded: true,
    reason: "ok",
    rows: total,
    prevalence,
    scoreProbability,
  }
}

export const mlDatasetModel = buildModel()
