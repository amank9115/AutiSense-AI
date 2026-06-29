"use client";

import React from "react";
import { motion } from "framer-motion";
import { Camera, BrainCircuit, Stethoscope } from "lucide-react";

const STEPS = [
  {
    icon: <Camera className="h-6 w-6" />,
    label: "Capture",
    title: "10-min guided session",
    body:
      "A gentle, sensory-paced camera session walks you through 5 behavioral observation modules designed for ages 2–17.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    label: "Analyze",
    title: "AutiSense AI inference",
    body:
      "Our vision + audio model maps 28+ nuanced behavioral signals to a clear, compassionate report — no scores, just context.",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: <Stethoscope className="h-6 w-6" />,
    label: "Connect",
    title: "Specialist handoff",
    body:
      "Share results securely with a developmental pediatrician on the AutiSense care network, or export a PDF for your existing team.",
    accent: "from-cyan-500 to-sky-500",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-surface-container-low py-14 sm:py-18"
      data-tone="light"
      aria-label="How it works"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-primary-accent font-semibold">
            How it works
          </p>
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
            From first screening to clear insight —{" "}
            <span className="text-aurora italic font-display">in 3 steps</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-on-surface-variant leading-relaxed">
            Designed with neurodivergent families and pediatric specialists to keep the journey calm, transparent, and respected.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-5 sm:p-6 shadow-card hover:shadow-card-raised transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${step.accent} text-white shadow-md shadow-violet-500/20`}
              >
                {step.icon}
              </div>

              <h3 className="mt-5 font-headline font-bold text-xl text-on-surface tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] text-on-surface-muted leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
