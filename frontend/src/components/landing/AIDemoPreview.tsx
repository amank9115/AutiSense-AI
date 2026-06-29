"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import Section from "./Section";
import MeshGradientBg from "./MeshGradientBg";

type StepState = "idle" | "listening" | "analyzing" | "done";

const STEPS: { key: StepState; t: string }[] = [
  { key: "listening", t: "Listening" },
  { key: "analyzing", t: "Analyzing" },
  { key: "done", t: "Done" },
];

const ENGAGEMENT = [
  { t: "00:00", gaze: 32, affect: 24, speech: 18 },
  { t: "00:20", gaze: 48, affect: 38, speech: 26 },
  { t: "00:40", gaze: 64, affect: 52, speech: 41 },
  { t: "01:00", gaze: 72, affect: 58, speech: 60 },
  { t: "01:20", gaze: 84, affect: 71, speech: 78 },
  { t: "01:40", gaze: 90, affect: 80, speech: 86 },
  { t: "02:00", gaze: 95, affect: 88, speech: 94 },
];

export default function AIDemoPreview() {
  const [step, setStep] = useState<StepState>("idle");
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const sectionRef = useRef<HTMLElement | null>(null);

  // IntersectionObserver — pause auto-advance when section leaves viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-advance the demo after 800ms of idle so users see motion immediately.
  useEffect(() => {
    if (step === "idle" && isVisible) {
      const id = window.setTimeout(() => setStep("listening"), 800);
      return () => window.clearTimeout(id);
    }
  }, [step, isVisible]);

  // Listen → Analyze → Done progression
  useEffect(() => {
    if (step === "listening" && isVisible) {
      const id = window.setTimeout(() => setStep("analyzing"), 2400);
      return () => window.clearTimeout(id);
    }
    if (step === "analyzing" && isVisible) {
      const id = window.setTimeout(() => setStep("done"), 2000);
      return () => window.clearTimeout(id);
    }
    if (step === "done" && isVisible) {
      const id = window.setTimeout(() => setStep("idle"), 6000);
      return () => window.clearTimeout(id);
    }
  }, [step, isVisible]);

  return (
    <Section
      tone="dark"
      id="ai-demo"
      className="relative isolate"
      bgClass="bg-ink-950"
      ref={sectionRef}
    >
      {/* Soft mesh echo behind demo */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <MeshGradientBg intensity={0.45} withOrbs={false} />
        <div className="absolute inset-0 mouse-glow-dark" />
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-aurora-2 font-bold">
            See AutiSense AI live
          </p>
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tighter leading-[1.05]">
            See AutiSense AI <br />{" "}
            <span className="text-aurora italic font-display">in action</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed max-w-md">
            AutiSense maps 28+ behavioral signals across a brief, sensory-calibrated video session — and turns them into a clear, shareable report.
          </p>

          {/* State pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => {
              const activeIndex = STEPS.findIndex((x) => x.key === step);
              const isPast = i < activeIndex;
              const isActive = step === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  aria-pressed={isActive}
                  className={[
                    "group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-300",
                    isActive
                      ? "border-violet-400/60 bg-violet-500/15 text-white shadow-glow-violet"
                      : isPast
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20",
                  ].join(" ")}
                >
                  {isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isPast ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3.5 w-3.5" />
                  )}
                  {s.t}
                </button>
              );
            })}
          </div>

          {/* Status text */}
          <p className="mt-5 text-[13px] text-ink-400 max-w-md">
            <AnimatePresence mode="wait">
              <motion.span
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
              >
                {step === "idle" && "Tap any step to step through the live inference pipeline."}
                {step === "listening" && "Reading facial affect, gaze and vocal prosody in 12 ms slices."}
                {step === "analyzing" && "Comparing against population baseline + family priors."}
                {step === "done" && "Generated a personalized report — share securely or export PDF."}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>

        {/* Right demo card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7 relative"
        >
          <div className="absolute -inset-x-6 -inset-y-6 -z-10 rounded-[2rem] bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-cyan-400/20 blur-2xl opacity-60" />

          <div className="relative rounded-3xl glass-dark ring-1 ring-white/10 shadow-dark-card-lg overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">AutiSense · live</p>
              <span className="text-[11px] text-aurora-3 font-semibold">● running</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Chart */}
              <div className="md:col-span-3 p-5 border-b md:border-b-0 md:border-r border-white/5">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">Engagement</p>
                  <p className="text-[11px] text-ink-400 font-semibold">last 2 min</p>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ENGAGEMENT} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="engage-a" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="engage-b" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D946EF" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="#D946EF" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="engage-c" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 5" />
                      <XAxis dataKey="t" hide />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ stroke: "rgba(139,92,246,0.35)" }}
                        contentStyle={{
                          background: "rgba(11,12,19,0.96)",
                          border: "1px solid rgba(139,92,246,0.35)",
                          borderRadius: 10,
                          fontSize: 12,
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="gaze"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fill="url(#engage-a)"
                        isAnimationActive={step !== "idle"}
                      />
                      <Area
                        type="monotone"
                        dataKey="affect"
                        stroke="#D946EF"
                        strokeWidth={2}
                        fill="url(#engage-b)"
                        isAnimationActive={step !== "idle"}
                      />
                      <Area
                        type="monotone"
                        dataKey="speech"
                        stroke="#06B6D4"
                        strokeWidth={2}
                        fill="url(#engage-c)"
                        isAnimationActive={step !== "idle"}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Signal profile + match score */}
              <div className="md:col-span-2 p-5 flex flex-col gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold mb-3">Signal profile</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Eye contact", value: 86, color: "#8B5CF6" },
                      { label: "Speech flow", value: 91, color: "#06B6D4" },
                      { label: "Joint attention", value: 64, color: "#D946EF" },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-ink-300 font-medium">{m.label}</span>
                          <span className="text-white font-bold">{m.value}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${m.value}%`, background: m.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">Match</span>
                    <span className="ml-auto font-display font-extrabold text-3xl text-white tracking-tight">94.1%</span>
                  </div>
                  <p className="text-[12px] text-ink-300 leading-relaxed">
                    {step === "done"
                      ? "Report ready. Pipeline finished with 0.18σ noise floor — clinical-grade quality."
                      : "Computing exact match — the model needs a few more frames to converge."}
                  </p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <motion.span
                      key={step}
                      initial={{ width: "0%" }}
                      animate={{ width: step === "done" ? "94%" : step === "analyzing" ? "62%" : "28%" }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="block h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 p-4 flex items-center justify-between">
              <p className="text-[12px] text-ink-400 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Pipeline processed <span className="text-white font-semibold">{step === "done" ? "8,932" : step === "analyzing" ? "5,140" : "1,287"}</span> frames
              </p>
              <span className="text-[11px] text-ink-400 font-semibold">
                v2.0 · {step === "done" ? "ready" : "streaming"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
