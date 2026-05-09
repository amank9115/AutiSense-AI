import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import GuestDemoButton from "../components/guest/GuestDemoButton"
import { useAuth } from "../context/AuthContext"

const story = [
  { id: "problem", title: "The Problem", phrase: "Early signs are easy to miss.", image: "/illustrations/problem.png" },
  { id: "technology", title: "AI Technology", phrase: "AI reads behavior patterns in minutes.", image: "/illustrations/technology.png" },
  { id: "features", title: "Platform Features", phrase: "Live screening, reports, and shared care.", image: "/illustrations/features.png" },
  { id: "impact", title: "Impact", phrase: "Detect early. Support better.", image: "/illustrations/impact.png" },
]

const highlights = [
  { label: "Faster Insight", value: "2-5 min analysis", detail: "Quick preliminary behavioral pattern summary." },
  { label: "Care Collaboration", value: "Parent + Doctor view", detail: "Shared reports and discussion-ready outputs." },
  { label: "Actionable Metrics", value: "Attention & emotion", detail: "Readable indicators for follow-up planning." },
]

const steps = [
  { title: "Upload or Live Screen", detail: "Start with camera or recorded child interaction video." },
  { title: "AI Behavioral Analysis", detail: "Models evaluate facial, eye-contact, and response cues." },
  { title: "Report and Follow-Up", detail: "Review scores, trends, and take guided next steps." },
]

const LandingPage = () => {
  const { user, enterGuestMode } = useAuth()
  const navigate = useNavigate()
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const smoothX = useSpring(cursorX, { stiffness: 120, damping: 20 })
  const smoothY = useSpring(cursorY, { stiffness: 120, damping: 20 })
  const glow = useMotionTemplate`radial-gradient(220px circle at ${smoothX}px ${smoothY}px, rgba(14,165,233,0.2), transparent 70%)`

  const [heroMetrics, setHeroMetrics] = useState({ eyeContact: 74, attention: 81, emotion: 76 })

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroMetrics((current) => ({
        eyeContact: Math.max(60, Math.min(92, current.eyeContact + Math.round(Math.random() * 8 - 4))),
        attention: Math.max(62, Math.min(94, current.attention + Math.round(Math.random() * 8 - 4))),
        emotion: Math.max(58, Math.min(90, current.emotion + Math.round(Math.random() * 8 - 4))),
      }))
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  const startScreening = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    if (user) {
      navigate("/live-screening")
      return
    }
    navigate("/login")
  }

  const startGuestDemo = () => {
    enterGuestMode()
    navigate("/demo")
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <header
        id="hero"
        className="grid items-center gap-8 pt-16 pb-14 lg:grid-cols-[1.08fr_0.92fr]"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          cursorX.set(event.clientX - rect.left)
          cursorY.set(event.clientY - rect.top)
        }}
      >
        <div className="relative">
          <motion.div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl opacity-80" style={{ background: glow }} />
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-0 dark:opacity-100 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <p className="text-xs tracking-[0.28em] text-sky-600 uppercase dark:text-sky-300">MANASSAATHI AI</p>
          <h1 className="mt-3 text-5xl leading-tight font-semibold text-slate-900 dark:text-slate-100 sm:text-6xl">
            AI Powered Early
            <br />
            Autism Screening
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">AI-powered early autism screening for parents and doctors.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={startScreening}
              whileHover={{ scale: 1.03, boxShadow: "0 14px 28px rgba(14,165,233,0.32)" }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Start Screening
              <span className="transition-transform group-hover:translate-x-1">{"->"}</span>
            </motion.button>
            <GuestDemoButton onClick={startGuestDemo} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/55">
              <p className="text-xs text-slate-500 dark:text-slate-300">AI Brain Scan</p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-100">Neural signal sync active</p>
            </motion.div>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 4.7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/55">
              <p className="text-xs text-slate-500 dark:text-slate-300">Live Detection</p>
              <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-100">Metrics update every 2s</p>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-5 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/55">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 26, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full border border-cyan-400/40" />
          <motion.div animate={{ scale: [1, 1.06, 1], opacity: [0.45, 0.85, 0.45] }} transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY }} className="pointer-events-none absolute right-4 top-4 h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />

          <motion.img src="/illustrations/hero.png" alt="AI assisted autism screening" loading="lazy" animate={{ y: [0, -8, 0] }} transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} className="h-64 w-full rounded-2xl border border-slate-200/70 bg-slate-50 object-contain p-2 dark:border-slate-700/70 dark:bg-slate-900/60" />

          <div className="pointer-events-none absolute left-[40%] top-[43%] h-16 w-16 rounded-full bg-cyan-400/20 blur-xl" />
          <div className="pointer-events-none absolute left-[48%] top-[47%] h-12 w-12 rounded-full bg-emerald-400/20 blur-xl" />
          <div className="pointer-events-none absolute left-[58%] top-[54%] h-20 w-20 rounded-full bg-indigo-400/20 blur-xl" />
        </motion.div>
      </header>

      <div className="space-y-10">
        {story.map((section, index) => (
          <motion.article key={section.id} id={section.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} transition={{ delay: index * 0.05, duration: 0.5 }} className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 backdrop-blur-xl md:grid-cols-[1fr_0.45fr] dark:border-slate-700 dark:bg-slate-900/55">
            <div className="p-8">
              <p className="text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">{section.title}</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100 sm:text-4xl">{section.phrase}</h2>
            </div>
            <div className="flex items-center justify-center p-4">
              <div className="w-full max-w-lg overflow-hidden rounded-2xl shadow-lg">
                <img src={section.image} alt={section.title} loading="lazy" className="h-52 w-full bg-slate-50 object-contain p-2 md:h-full dark:bg-slate-900/60" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} className="mt-12 rounded-3xl border border-slate-200/80 bg-white/85 p-8 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">Key Benefits</p>
        <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Built for real-world early screening workflows.</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs tracking-[0.16em] text-sky-600 uppercase dark:text-sky-300">{item.label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} className="mt-10 rounded-3xl border border-slate-200/80 bg-white/85 p-8 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">How It Works</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">STEP {index + 1}</p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{step.detail}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.45 }} className="mt-12 rounded-3xl border border-slate-200/80 bg-white/85 p-8 text-center backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs tracking-[0.2em] text-sky-600 uppercase dark:text-sky-300">Next Step</p>
        <h3 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">Start your early screening journey today.</h3>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
            <GuestDemoButton onClick={startGuestDemo} />
        </div>
      </motion.section>
    </section>
  )
}

export default LandingPage
