import { motion } from "framer-motion"
import type { AuthRole } from "../../services/authApi"

const RoleToggle = ({ value, onChange }: { value: AuthRole; onChange: (role: AuthRole) => void }) => {
  const tabs: { key: AuthRole; label: string }[] = [
    { key: "parent", label: "Parent" },
    { key: "doctor", label: "Doctor" },
  ]

  return (
    <div className="relative grid grid-cols-2 rounded-xl border border-slate-200/80 bg-white/60 p-1 dark:border-slate-700 dark:bg-slate-900/55">
      {tabs.map((tab) => {
        const active = value === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative z-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "text-white dark:text-slate-900" : "text-slate-600 hover:text-slate-700 dark:text-slate-300"
            }`}
          >
            {active && (
              <motion.span
                layoutId="role-pill"
                className={`absolute inset-0 -z-10 rounded-lg ${tab.key === "parent" ? "bg-sky-500" : "bg-emerald-500"}`}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default RoleToggle
