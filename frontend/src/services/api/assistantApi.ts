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
    const response = await fetchJson<{ message: string }>("/ai/chat/global-search", {
      method: "POST",
      body: JSON.stringify({ message: query }),
    })
    return {
      success: true,
      query,
      answer: response.message,
      model: "gpt-4-turbo",
      policy: "Heuristic Search"
    } as AssistantSearchResponse
  },
}

