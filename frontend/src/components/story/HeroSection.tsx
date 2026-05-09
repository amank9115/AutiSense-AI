import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import Button from "../ui/Button"

const pulse = {
  initial: { opacity: 0.45, scale: 0.9 },
  animate: {
    opacity: [0.4, 0.85, 0.4],
    scale: [0.9, 1.04, 0.9],
    transition: { duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: [0.42, 0, 0.58, 1] as const },
  },
}

const HeroSection = () => {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-16 pb-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24">
      <div>
        <p className="mb-4 inline-flex rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs tracking-widest text-cyan-200 uppercase">
          Early Autism Screening Intelligence
        </p>
        <h1 className="text-4xl leading-tight font-semibold text-white sm:text-5xl">
          Neurolytix AI turns subtle behavior into actionable early-care insights.
        </h1>
        <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
          Secure, explainable AI workflows for parents and clinicians: capture behavior signals, track development, and collaborate faster with medically responsible guardrails.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/live-screening">
            <Button>Start Screening</Button>
          </Link>
          <Link to="/doctor">
            <Button variant="secondary">For Doctors</Button>
          </Link>
          <Link to="/parent">
            <Button variant="secondary">For Parents</Button>
          </Link>
        </div>
      </div>
      <motion.div
        className="relative mx-auto h-[360px] w-full max-w-[520px] rounded-3xl border border-cyan-200/20 bg-slate-900/70 p-5 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_60%)]" />
        <div className="relative h-full rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-300">
            <span>Live AI Session</span>
            <span>Latency: 124ms</span>
          </div>
          <div className="relative h-[72%] rounded-xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-800">
            <motion.div {...pulse} className="absolute top-[24%] left-[22%] h-10 w-10 rounded-full border border-cyan-300/60" />
            <motion.div {...pulse} className="absolute top-[30%] right-[24%] h-8 w-8 rounded-full border border-blue-300/60" />
            <div className="absolute right-4 bottom-4 left-4 rounded-lg border border-emerald-200/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
              Pattern detected: sustained eye engagement improved over prior session (+12%).
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">Eye Contact: 74%</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">Attention: 81%</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">Emotion Stability: 76%</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">Gesture Signal: 69%</div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default HeroSection
