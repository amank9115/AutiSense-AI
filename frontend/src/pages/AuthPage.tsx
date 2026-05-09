import { AnimatePresence, motion } from "framer-motion"
import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth, type UserRole } from "../context/AuthContext"

type Mode = "login" | "register"

const roleCopy: Record<UserRole, string> = {
  parent: "Family-first guidance and child progress intelligence.",
  doctor: "Clinical analytics and decision-support for case review.",
}

const AuthPage = () => {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  const [mode, setMode] = useState<Mode>(initialMode)
  const [role, setRole] = useState<UserRole>("parent")
  const [name, setName] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const title = useMemo(() => `${mode === "login" ? "Login" : "Register"} as ${role === "parent" ? "Parent" : "Doctor"}`, [mode, role])

  const submit = () => {
    const finalName = name.trim() || (role === "parent" ? "Parent User" : "Doctor User")
    login(finalName, role)
    navigate(role === "parent" ? "/parent-dashboard" : "/doctor-dashboard")
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-7 shadow-xl dark:border-slate-700 dark:bg-slate-900/70">
        <p className="text-xs tracking-[0.2em] text-sky-500 uppercase dark:text-sky-300">Secure Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-800 dark:text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{roleCopy[role]}</p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setRole("parent")}
            className={`rounded-xl px-4 py-2 text-sm ${role === "parent" ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            Parent
          </button>
          <button
            onClick={() => setRole("doctor")}
            className={`rounded-xl px-4 py-2 text-sm ${role === "doctor" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
          >
            Doctor
          </button>
        </div>

        <div className="mt-5 flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
          <button onClick={() => setMode("login")} className={`flex-1 rounded-lg py-2 text-sm ${mode === "login" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-500"}`}>Login</button>
          <button onClick={() => setMode("register")} className={`flex-1 rounded-lg py-2 text-sm ${mode === "register" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "text-slate-500"}`}>Register</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${mode}-${role}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={role === "parent" ? "Parent name" : "Doctor name"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
            <input
              type="email"
              placeholder={role === "parent" ? "parent@email.com" : "doctor@clinic.com"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
            {mode === "register" && (
              <input
                placeholder={role === "parent" ? "Child age (optional)" : "Medical ID (optional)"}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              />
            )}
            <button onClick={submit} className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white">
              {mode === "login" ? "Continue" : "Create account"}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="rounded-3xl border border-slate-200/70 bg-white/65 p-7 dark:border-slate-700 dark:bg-slate-900/55">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">First Impression Care Intelligence</h2>
        <div className="mt-5 grid gap-3">
          <div className="rounded-xl bg-sky-500/10 p-4 text-sm text-slate-600 dark:text-slate-200">Role-based secure journey</div>
          <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-slate-600 dark:text-slate-200">Clinic-grade dashboard after login</div>
          <div className="rounded-xl bg-indigo-500/10 p-4 text-sm text-slate-600 dark:text-slate-200">AI-assisted behavioral intelligence workflow</div>
        </div>
      </div>
    </section>
  )
}

export default AuthPage
