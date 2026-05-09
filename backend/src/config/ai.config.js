/**
 * AI & ML Service Configuration
 * ─────────────────────────────
 * Centralizes all AI-related environment variables.
 * Import this instead of reading process.env directly.
 */

export const aiConfig = {
  // Python ML Service
  pyMl: {
    enabled: process.env.PY_ML_ENABLED === "true",
    baseUrl: process.env.PY_ML_BASE_URL || "http://127.0.0.1:8001",
    timeoutMs: Number(process.env.PY_ML_TIMEOUT_MS || 2500),
  },

  // AI Engine (computer vision / behavior analysis)
  aiEngine: {
    enabled: process.env.AI_ENGINE_ENABLED === "true",
    baseUrl: process.env.AI_ENGINE_BASE_URL || "http://127.0.0.1:5000",
    timeoutMs: Number(process.env.AI_ENGINE_TIMEOUT_MS || 3500),
  },

  // Gemini AI (assistant chat)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  },
}
