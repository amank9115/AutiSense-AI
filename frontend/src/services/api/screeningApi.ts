import { fetchJson } from "../../api/client"
import type { ChildProfileForm } from "../../context/ScreeningContext"

type SaveChildProfileResponse = {
  success: boolean
  profile: {
    id: string
    childName: string
    parentName: string
    parentEmail: string
    createdAt: string
  }
}

export const screeningApi = {
  saveChildProfile: async (profile: ChildProfileForm) => {
    return fetchJson<SaveChildProfileResponse>("/screening/child-profile", {
      method: "POST",
      body: JSON.stringify(profile),
    })
  },
}

