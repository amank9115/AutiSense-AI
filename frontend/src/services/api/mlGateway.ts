import { fetchJson } from "../../api/client"
import type { MlInferenceRequest, MlInferenceResponse } from "../../ai/inferenceContracts"

export const mlGateway = {
  runInference: async (payload: MlInferenceRequest): Promise<MlInferenceResponse> => {
    return fetchJson<MlInferenceResponse>("/ml/inference", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
