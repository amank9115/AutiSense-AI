import { fetchJson } from "../../api/client"

type AssistantSearchResponse = {
  success: boolean
  query: string
  answer: string
  model: string
  policy: string
}

export const assistantApi = {
  search: async (query: string) => {
    return fetchJson<AssistantSearchResponse>("/assistant/search", {
      method: "POST",
      body: JSON.stringify({ query }),
    })
  },
}

