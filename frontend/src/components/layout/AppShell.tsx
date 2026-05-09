import { Outlet } from "react-router-dom"
import DemoBanner from "../components/demo/DemoBanner"
import AnimatedBackground from "../components/effects/AnimatedBackground"
import CustomCursor from "../components/effects/CustomCursor"
import Footer from "../components/layout/Footer"
import GlassNavbar from "../components/layout/GlassNavbar"
import { useAuth } from "../context/AuthContext"

const AppShell = () => {
  const { isGuest } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-400">
      <AnimatedBackground />
      <CustomCursor />
      <GlassNavbar />
      {isGuest && <DemoBanner />}
      <main className="pt-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppShell
