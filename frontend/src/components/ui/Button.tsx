import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost"
}

const styleByVariant = {
  primary:
    "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_0_rgba(56,189,248,0.45)] hover:from-cyan-300 hover:to-blue-400 hover:shadow-[0_8px_26px_rgba(56,189,248,0.4)]",
  secondary:
    "border border-slate-300 bg-white/70 text-slate-700 hover:bg-white hover:shadow-[0_8px_20px_rgba(15,23,42,0.14)] dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800",
  ghost: "text-sky-600 hover:text-sky-500 hover:bg-sky-50/70 dark:text-cyan-200 dark:hover:bg-slate-800/60 dark:hover:text-cyan-100",
}

const Button = ({ children, className = "", variant = "primary", ...props }: ButtonProps) => {
  return (
    <button
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${styleByVariant[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
