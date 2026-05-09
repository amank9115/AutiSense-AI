const PY_ML_BASE_URL = process.env.PY_ML_BASE_URL ?? "http://127.0.0.1:8001"
const PY_ML_ENABLED = true // force enabled to use real data
const PY_ML_TIMEOUT_MS = Number(process.env.PY_ML_TIMEOUT_MS || 2500)

const withTimeout = async (url, payload) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PY_ML_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!response.ok) {
      const raw = await response.text()
      throw new Error(`Python ML request failed (${response.status}): ${raw}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

const mapFrameToPython = (frame, index = 0) => ({
  frame_index: Number(frame.frameIndex ?? index),
  eye_contact: Number(frame.eyeContact ?? 0),
  attention_span: Number(frame.attentionSpan ?? 0),
  emotion_signals: Number(frame.emotionSignals ?? 0),
  gesture_analysis: Number(frame.gestureAnalysis ?? 0),
  confidence: Number(frame.confidence ?? 70),
  image_base64: typeof frame.imageBase64 === "string" ? frame.imageBase64 : undefined,
})

const mapPythonToNode = (result) => ({
  modelVersion: String(result.model_version ?? "python-opencv-behavior-v1"),
  riskScore: Number(result.risk_score ?? 50),
  riskLabel: result.risk_label === "high" || result.risk_label === "moderate" ? result.risk_label : "low",
  featureAverages: {
    eyeContact: Number(result.feature_averages?.eye_contact ?? 0),
    attentionSpan: Number(result.feature_averages?.attention_span ?? 0),
    emotionSignals: Number(result.feature_averages?.emotion_signals ?? 0),
    gestureAnalysis: Number(result.feature_averages?.gesture_analysis ?? 0),
    confidence: Number(result.feature_averages?.confidence ?? 0),
  },
  aqScores: result.aq_scores ?? {},
  recommendations: Array.isArray(result.recommendations) ? result.recommendations.map(String) : [],
  policy: String(result.policy ?? "Screening support only. Not a medical diagnosis."),
  dataset: typeof result.dataset === "string" ? result.dataset : undefined,
  windowSize: Number(result.window_size ?? 0),
  sessionKey: typeof result.session_key === "string" ? result.session_key : undefined,
})

export const isPythonMlEnabled = () => PY_ML_ENABLED

export const scoreWithPythonWindow = async (frames, sessionKey, childInfo = null) => {
  if (!PY_ML_ENABLED) return null

  const payload = {
    session_key: sessionKey,
    frames: frames.map((frame, index) => mapFrameToPython(frame, index)),
    ...(childInfo ? {
      child_name: childInfo.childName,
      parent_name: childInfo.parentName,
      parent_email: childInfo.parentEmail,
      parent_phone: childInfo.parentPhone,
      city: childInfo.city,
      state: childInfo.state,
    } : {}),
  }

  const result = await withTimeout(`${PY_ML_BASE_URL}/predict/window`, payload)
  return mapPythonToNode(result)
}

export const scoreWithPythonLive = async (sessionKey, frame, childInfo = null) => {
  if (!PY_ML_ENABLED) return null

  const payload = {
    session_key: sessionKey,
    frame: mapFrameToPython(frame),
    ...(childInfo ? { child_info: childInfo } : {}),
  }

  const result = await withTimeout(`${PY_ML_BASE_URL}/predict/live`, payload)
  return mapPythonToNode(result)
}

/**
 * Requests the Python ML service to generate a PDF report and returns the raw bytes.
 * The Node server then pipes these bytes to the browser.
 */
export const generatePdfReport = async (sessionKey, childInfo = {}) => {
  if (!PY_ML_ENABLED) throw new Error("Python ML service is disabled. Set PY_ML_ENABLED=true in backend/.env")

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000) // allow 15s for PDF generation

  try {
    const response = await fetch(`${PY_ML_BASE_URL}/report/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_key: sessionKey,
        child_name: childInfo.childName,
        parent_name: childInfo.parentName,
        parent_email: childInfo.parentEmail,
        parent_phone: childInfo.parentPhone,
        city: childInfo.city,
        state: childInfo.state,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const raw = await response.text()
      throw new Error(`PDF generation failed (${response.status}): ${raw}`)
    }

    const contentDisposition = response.headers.get("Content-Disposition") ?? ""
    const arrayBuffer = await response.arrayBuffer()
    return { buffer: Buffer.from(arrayBuffer), contentDisposition }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetches stored session result data from Python ML service.
 */
export const getPySessionData = async (sessionKey) => {
  if (!PY_ML_ENABLED) return null

  try {
    const response = await fetch(`${PY_ML_BASE_URL}/report/session/${encodeURIComponent(sessionKey)}`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
