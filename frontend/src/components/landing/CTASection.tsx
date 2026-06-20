"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Stethoscope } from "lucide-react";
import Section from "./Section";
import MeshGradientBg from "./MeshGradientBg";

export default function CTASection() {
  return (
    <Section
      tone="dark"
      id="cta"
      bgClass="bg-ink-950"
      className="relative isolate"
      padX="wide"
    >
      {/* Mesh echo */}
      <div className="absolute inset-0 -z-10 opacity-80">
        <MeshGradientBg intensity={0.85} withOrbs={true} />
        <div className="absolute inset-0 mouse-glow-dark" />
    </div>
      <div className="pointer-events-none absolute inset-0 -z-10 scan-grid scan-grid-mask opacity-25" />

      <div className="relative mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="gradient-border relative overflow-hidden rounded-[2rem] glass-dark px-8 sm:px-12 lg:px-16 py-12 sm:py-16 text-center"
        >
          {/* inner soft halo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(139,92,246,0.20), transparent 70%)",
            }}
          />

          <p className="text-[11px] uppercase tracking-[0.22em] text-aurora-3 font-bold mb-4">
            Get started in 2 minutes
 </p>

          <h2 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-6xl text-white tracking-tighter leading-[1.05]">
            Ready to take the next step
            <br className="hidden sm:block" />{" "}
            with{" "}
            <span className="text-aurora italic font-display">
              AutiSense AI
          </span>
            ?
 </h2>

          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-ink-300 leading-relaxed">
            Join 12,000+ families who found clearer next steps through a sensory-first diagnostic co-pilot they can actually trust.
 </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/begin-the-journey" className="group">
              <button className="btn-glow inline-flex items-center gap-2 rounded-full px-8 py-4 font-headline font-bold text-[15.5px] focus-aurora">
                Create free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
            <Link href="/professionals">
              <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md px-7 py-4 font-headline font-semibold text-[14.5px] text-ink-100 transition-all duration-300">
                <Stethoscope className="h-4 w-4 text-cyan-300" />
                Talk to a specialist
            </button>
          </Link>
       </div>

          <p className="mt-7 text-[12px] text-ink-400">
            14-day money-back guarantee · No credit card required for first screening
  </p>
       </motion.div>
    </div>
  </Section>
  );
}
