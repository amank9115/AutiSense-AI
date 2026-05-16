"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  { icon: "psychology", title: "AI-Powered Analysis", description: "Advanced ML models analyze facial expressions, eye contact, and behavioral patterns in real-time.", borderColor: "border-t-primary", iconColor: "text-primary", bg: "from-primary/8 to-transparent" },
  { icon: "videocam",   title: "Live Camera Screening", description: "Capture and analyze your child's natural interactions through our secure camera interface.", borderColor: "border-t-secondary", iconColor: "text-secondary", bg: "from-secondary/8 to-transparent" },
  { icon: "summarize",  title: "Comprehensive Report", description: "Receive detailed reports with visual insights, ready to share with healthcare providers.", borderColor: "border-t-tertiary", iconColor: "text-tertiary", bg: "from-tertiary/8 to-transparent" },
  { icon: "security",   title: "Privacy First", description: "Your data is encrypted and secure. Only you and authorized doctors can access the results.", borderColor: "border-t-primary-accent", iconColor: "text-primary-accent", bg: "from-primary-accent/8 to-transparent" },
];

const steps = [
  { number: "01", icon: "videocam",    title: "Enable Camera",       description: "Grant camera access to begin real-time AI behavioral analysis" },
  { number: "02", icon: "psychology",  title: "Complete 5 Modules",  description: "Guide your child through our gentle, non-invasive screening modules" },
  { number: "03", icon: "summarize",   title: "Get Your Report",     description: "Receive a comprehensive report to share with your healthcare provider" },
];

export default function AssessmentIntroPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 sm:pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">

          {/* ── Hero ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20 pt-8">

            {/* Left: Text + CTA */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 bg-primary-container/60 text-on-primary-container px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-primary/10">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                AI-Powered Behavioral Screening
              </span>
              <h1 className="font-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Understand Your Child&apos;s{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Development
                </span>
              </h1>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-8 max-w-xl">
                Our AI-powered screening helps identify potential autism indicators through gentle, non-invasive behavioral analysis — in the comfort of your home.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/screening">
                  <button className="group bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                    Begin Screening
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </Link>
                <Link href="/services">
                  <button className="px-8 py-4 rounded-2xl font-bold text-primary border-2 border-primary/20 hover:bg-primary-container/40 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">info</span>
                    Learn More
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Animated AI Camera Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative w-80 h-80">
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl animate-ai-breathe" />
                {/* Card */}
                <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(23,104,118,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(23,104,118,0.6) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
                  {/* Scan line */}
                  <div className="animate-scan-line bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
                  {/* Top bar */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                      <span className="text-white/80 text-xs font-bold uppercase tracking-widest">LIVE</span>
                    </div>
                    <span className="text-white/50 text-xs font-mono">ML v2.1</span>
                  </div>
                  {/* Face detection corners */}
                  <div className="absolute inset-12 animate-subtle-shift z-10">
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary" />
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Face Detected
                    </div>
                  </div>
                  {/* Center icon */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                    </div>
                    <p className="text-white/60 text-xs font-medium">AI Analysis Active</p>
                  </div>
                  {/* Status dots */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
                    {[{ label: "Facial", on: true }, { label: "Gaze", on: true }, { label: "Engage", on: false }].map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full flex-1 justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${d.on ? 'bg-secondary animate-pulse' : 'bg-white/30'}`} />
                        <span className="text-white/70 text-xs font-medium">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── 3-Step Journey ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-16">
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-center mb-4">
              How It <span className="text-primary">Works</span>
            </h2>
            <p className="text-center text-on-surface-variant mb-12 max-w-md mx-auto">Three simple steps to an actionable behavioral insight report</p>

            <div className="flex flex-col sm:flex-row items-stretch gap-0">
              {steps.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex-1 flex flex-col items-center text-center px-6 pb-6 sm:pb-0">
                    <div className="relative mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-surface border-2 border-primary rounded-full flex items-center justify-center">
                        <span className="text-primary text-[10px] font-black">{i + 1}</span>
                      </div>
                    </div>
                    <h3 className="font-headline font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{step.description}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden sm:flex items-center justify-center w-8 flex-shrink-0 mt-8">
                      <div className="relative w-full h-0.5 bg-gradient-to-r from-primary/30 to-secondary/30">
                        <span className="material-symbols-outlined text-primary/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface text-base">chevron_right</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* ── Feature Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i + 0.4 }}
                className={`group bg-gradient-to-b ${f.bg} p-6 rounded-2xl border-t-4 ${f.borderColor} border border-outline-variant/10 shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 backdrop-blur-sm`}
              >
                <span className={`material-symbols-outlined text-3xl ${f.iconColor} mb-4 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                <h3 className="font-headline font-bold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Parent / Disclaimer Banner ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-primary-container/30 to-secondary-container/20 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border border-primary/10"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg mb-2">For Parents</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Designed to be gentle and non-invasive. You&apos;ll guide your child through simple activities while our AI quietly observes and analyzes behavioral patterns.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-tertiary-container flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg mb-2">Important Note</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  This is a preliminary screening tool, not a clinical diagnosis. Results should always be reviewed with a qualified healthcare professional.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
