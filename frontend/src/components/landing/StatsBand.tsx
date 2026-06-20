"use client";

import React from "react";
import { useCountUp } from "@/hooks/useGsap";
import { motion } from "framer-motion";

interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  hint: string;
  decimals?: number;
}

const STATS: Stat[] = [
  {
    value: 95,
    suffix: "%",
    label: "Screening accuracy",
    hint: "Validated against DSM-5-TR standards",
    decimals: 0,
  },
  {
    value: 10,
    suffix: "K+",
    label: "Assessments delivered",
    hint: "Across 14 countries",
  },
  {
    value: 2,
    suffix: " min",
    prefix: "<",
    label: "Time to first result",
    hint: "Camera-based, no questionnaire",
  },
  {
    value: 50,
    suffix: "+",
    label: "Pediatric specialists",
    hint: "On the AutiSense care network",
  },
];

function CountUpStat({ stat, index }: { stat: Stat; index: number }) {
  const ref = useCountUp(stat.value, {
    duration: 2.2 + index * 0.1,
    suffix: stat.suffix ?? "",
    prefix: stat.prefix ?? "",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col gap-2 rounded-2xl border border-outline-variant/15 bg-gradient-to-br from-surface-container-lowest to-surface-container-low p-6 shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-card-raised"
    >
      {/* Corner glow on hover */}
      <div className="pointer-events-none absolute -top-px -right-px h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <span
        ref={ref}
        className="font-display font-extrabold text-5xl lg:text-6xl tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary-accent to-aurora-2"
        data-stat={stat.label}
      >
        0
    </span>
      <span className="text-[14.5px] font-bold text-on-surface">{stat.label}</span>
      <span className="text-[11.5px] text-on-surface-muted leading-relaxed">
        {stat.hint}
    </span>
  </motion.div>
  );
}

/**
 * Four key metrics that count up when scrolled into view.
 * Cards lift on hover and layer a tiny violet corner glow.
 */
export default function StatsBand() {
  return (
    <section
      className="relative bg-surface py-16 sm:py-20"
      data-tone="light"
      aria-label="Key platform metrics"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-primary-accent font-semibold">
            Built for impact
        </p>
          <h2 className="font-headline font-bold text-2xl sm:text-3xl lg:text-4xl text-on-surface tracking-tight">
            Numbers that families & clinicians can trust
        </h2>
      </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, i) => (
            <CountUpStat key={stat.label} stat={stat} index={i} />
          ))}
      </div>
    </div>
  </section>
  );
}
