import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../context/ThemeContext"
import BrandLogo from "../branding/BrandLogo"
import EmergencyPanel from "../emergency/EmergencyPanel"
import GlobalSearch from "../search/GlobalSearch"

const navItems = [
  { id: "hero", label: "Home" },
  { id: "problem", label: "Problem" },
  { id: "technology", label: "Technology" },
  { id: "features", label: "Features" },
  { id: "impact", label: "Impact" },
]

const GlassNavbar = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const goToSection = (id: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${id}`)
      return
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl border border-sky-100/70 bg-gradient-to-r from-white/85 via-sky-50/75 to-emerald-50/70 px-3 py-2.5 backdrop-blur-2xl shadow-[0_16px_44px_rgba(15,23,42,0.16)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-[0_14px_44px_rgba(2,6,23,0.62)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.16),transparent_35%),radial-gradient(circle_at_86%_80%,rgba(16,185,129,0.16),transparent_35%)]" />

        <div className="relative flex items-center justify-between gap-4">
          <Link to="/" className="mr-3 shrink-0">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => goToSection(item.id)}
                className="rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white/80 hover:text-sky-700 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 dark:hover:text-sky-300"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="relative flex items-center gap-2">
            <GlobalSearch />
            <button onClick={() => setEmergencyOpen((current) => !current)} className="rounded-xl border border-rose-300/80 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:scale-105 dark:border-rose-400/50 dark:text-rose-300">SOS</button>
            <button onClick={toggleTheme} className="rounded-xl border border-slate-300/80 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-800 transition hover:scale-105 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100">{theme === "dark" ? "Light" : "Dark"}</button>

            {!user ? (
              <>
                <button onClick={() => navigate("/login")} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-300 bg-white/70 text-slate-800 transition hover:scale-105 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-700" title="Login" aria-label="Go to login page">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" /><path d="M5 19C6.4 15.8 9 14.4 12 14.4C15 14.4 17.6 15.8 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
              </>
            ) : (
              <>
                <span className="hidden text-xs text-slate-700 sm:inline dark:text-slate-200">{user.name}</span>
                <button onClick={() => { logout(); navigate("/") }} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-100">Logout</button>
              </>
            )}
            <EmergencyPanel open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default GlassNavbar
