import { motion } from "framer-motion"

type GuestDemoButtonProps = {
  onClick: () => void
  className?: string
}

const GuestDemoButton = ({ onClick, className = "" }: GuestDemoButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`rounded-xl border border-emerald-300/70 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:border-emerald-400/40 dark:text-emerald-300 ${className}`}
    >
      Try Demo as Guest
    </motion.button>
  )
}

export default GuestDemoButton
