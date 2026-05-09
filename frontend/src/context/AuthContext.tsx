import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export type UserRole = "parent" | "doctor"

type User = {
  name: string
  role: UserRole
}

const AUTH_STORAGE_KEY = "manassaathi-auth-user"
const GUEST_STORAGE_KEY = "manassaathi-guest-mode"

type AuthContextValue = {
  user: User | null
  isGuest: boolean
  login: (name: string, role: UserRole) => void
  enterGuestMode: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as User
      if (parsed?.name && (parsed.role === "parent" || parsed.role === "doctor")) return parsed
      return null
    } catch {
      return null
    }
  })
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem(GUEST_STORAGE_KEY) === "true")

  const value = useMemo(
    () => ({
      user,
      isGuest,
      login: (name: string, role: UserRole) => {
        const nextUser = { name, role }
        setUser(nextUser)
        setIsGuest(false)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
        localStorage.removeItem(GUEST_STORAGE_KEY)
      },
      enterGuestMode: () => {
        setUser({ name: "Guest User", role: "parent" })
        setIsGuest(true)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ name: "Guest User", role: "parent" }))
        localStorage.setItem(GUEST_STORAGE_KEY, "true")
      },
      logout: () => {
        setUser(null)
        setIsGuest(false)
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(GUEST_STORAGE_KEY)
      },
    }),
    [isGuest, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
