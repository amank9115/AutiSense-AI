import { motion, AnimatePresence } from "framer-motion"

export type ToastItem = {
  id: string
  type: "success" | "error" | "info"
  message: string
}

const tone = {
  success: "border-emerald-300/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  error: "border-rose-300/60 bg-rose-500/10 text-rose-700 dark:text-rose-200",
  info: "border-sky-300/60 bg-sky-500/10 text-sky-700 dark:text-sky-200",
}

const ToastStack = ({ toasts }: { toasts: ToastItem[] }) => {
  return (
    <div className="pointer-events-none fixed top-6 right-6 z-[120] space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            className={`rounded-xl border px-4 py-2 text-xs font-medium backdrop-blur-xl ${tone[toast.type]}`}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastStack
