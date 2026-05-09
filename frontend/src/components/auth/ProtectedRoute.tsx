import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth, type UserRole } from "../context/AuthContext"

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: UserRole }) => {
  const { user, isGuest } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (isGuest) return <>{children}</>
  if (role && user.role !== role) return <Navigate to={user.role === "parent" ? "/parent-dashboard" : "/doctor-dashboard"} replace />
  return <>{children}</>
}

export default ProtectedRoute
