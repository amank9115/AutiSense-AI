const AI_ENGINE_ENABLED = process.env.AI_ENGINE_ENABLED === "true"
const AI_ENGINE_BASE_URL = process.env.AI_ENGINE_BASE_URL || "http://127.0.0.1:5000"
const AI_ENGINE_TIMEOUT_MS = Number(process.env.AI_ENGINE_TIMEOUT_MS || 3500)

const requestJson = async (path, init = {}) => {
  if (!AI_ENGINE_ENABLED) {
    throw new Error("AI_ENGINE_ENABLED is false")
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_ENGINE_TIMEOUT_MS)

  try {
    const response = await fetch(`${AI_ENGINE_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    })

    if (!response.ok) {
      const raw = await response.text()
      throw new Error(`AI engine request failed (${response.status}): ${raw}`)
    }

    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export const isAiEngineEnabled = () => AI_ENGINE_ENABLED

export const aiEngineHealth = async () => requestJson("/health", { method: "GET" })
export const aiEngineAnalyzeFrame = async () => requestJson("/analyze-frame", { method: "GET" })
export const aiEngineDoctorCases = async () => requestJson("/doctor/cases", { method: "GET" })

export const aiEngineUploadVideoJson = async (payload) => {
  if (!AI_ENGINE_ENABLED) {
    throw new Error("AI_ENGINE_ENABLED is false")
  }

  const base64Input = String(payload?.videoBase64 || "")
  const fileName = String(payload?.fileName || `upload-${Date.now()}.webm`)
  const childName = String(payload?.childName || "Unknown Child")
  if (!base64Input) {
    throw new Error("videoBase64 is required for JSON upload.")
  }

  const raw = base64Input.includes(",") ? base64Input.split(",", 2)[1] : base64Input
  const bytes = Buffer.from(raw, "base64")
  const blob = new Blob([bytes], { type: "video/webm" })
  const formData = new FormData()
  formData.append("video", blob, fileName)
  formData.append("child_name", childName)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_ENGINE_TIMEOUT_MS * 3)
  try {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/upload-video`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    })
    if (!response.ok) {
      const rawText = await response.text()
      throw new Error(`AI engine upload failed (${response.status}): ${rawText}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

export const aiEngineUploadVideoStream = async ({ contentType, contentLength, body }) => {
  if (!AI_ENGINE_ENABLED) {
    throw new Error("AI_ENGINE_ENABLED is false")
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_ENGINE_TIMEOUT_MS * 3)
  try {
    const response = await fetch(`${AI_ENGINE_BASE_URL}/upload-video`, {
      method: "POST",
      headers: {
        ...(contentType ? { "content-type": contentType } : {}),
        ...(contentLength ? { "content-length": String(contentLength) } : {}),
      },
      body,
      duplex: "half",
      signal: controller.signal,
    })
    if (!response.ok) {
      const rawText = await response.text()
      throw new Error(`AI engine upload failed (${response.status}): ${rawText}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}
