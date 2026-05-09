import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useScreening } from "../../context/ScreeningContext"

type EmergencyPanelProps = {
  open: boolean
  onClose: () => void
}

const EmergencyPanel = ({ open, onClose }: EmergencyPanelProps) => {
  const { activeProfile } = useScreening()
  const [logs, setLogs] = useState<string[]>([])

  const send = (label: string) => {
    const at = new Date().toLocaleTimeString()
    setLogs((current) => [`${at}: ${label} sent`, ...current].slice(0, 4))
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          className="absolute top-16 right-0 z-50 w-80 rounded-2xl border border-rose-200/60 bg-white/95 p-4 shadow-2xl backdrop-blur-2xl dark:border-rose-400/20 dark:bg-slate-900/95"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
                className="h-2.5 w-2.5 rounded-full bg-rose-500"
              />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Emergency Actions</p>
            </div>
            <button onClick={onClose} className="text-xs text-slate-500 dark:text-slate-400">Close</button>
          </div>

          <div className="rounded-xl border border-slate-200/70 bg-white/75 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/65">
            <p className="font-semibold text-slate-700 dark:text-slate-100">Active Child</p>
            <p className="text-slate-500 dark:text-slate-300">{activeProfile ? `${activeProfile.childName} | ${activeProfile.city}, ${activeProfile.state}` : "No active screening session"}</p>
          </div>

          <div className="mt-3 grid gap-2">
            <button onClick={() => send(`Call emergency contact ${activeProfile?.emergencyContact ?? "N/A"}`)} className="rounded-lg bg-rose-500 px-3 py-2 text-[11px] font-semibold text-white">Call Emergency Contact</button>
            <button onClick={() => send("Notify doctor")} className="rounded-lg bg-sky-500 px-3 py-2 text-[11px] font-semibold text-white">Notify Doctor</button>
            <button onClick={() => send("Share current location")} className="rounded-lg bg-emerald-500 px-3 py-2 text-[11px] font-semibold text-white">Share Location</button>
          </div>

          {logs.length > 0 && (
            <div className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              {logs.map((log) => <p key={log}>{log}</p>)}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default EmergencyPanel
