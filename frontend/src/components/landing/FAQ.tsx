"use client";

import React, { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const FAQS = [
  {
    q: "Is MannSaathi a diagnostic tool?",
    a: "No. MannSaathi flags developmental patterns and helps you prepare for a clinical conversation — it does not replace a formal diagnosis. All reports include prominent framing to make this clear and we never auto-route results to insurance or health records without your explicit consent.",
  },
  {
    q: "How accurate is the AI?",
    a: "AutiSense AI achieves 94.1% signal-match accuracy across the curated M-CHAT-R/F-aligned assessment set, with 0.18σ signal noise on consumer webcams. We publish methodology and quarterly fairness audits — including age, gender, and skin-tone subgroup breakdowns — on our public model card.",
  },
  {
    q: "Where does my child's video go?",
    a: "By default, video is processed on-device using a quantized TFLite model. Nothing leaves your device until you choose to upload. When you do upload, it is end-to-end encrypted, stored in HIPAA-compliant infra, and you can permanently delete everything from your account with a single tap.",
  },
  {
    q: "What ages does MannSaathi support?",
    a: "The screening protocol is calibrated for ages 2 through 17, with separate early-childhood, child, and adolescent modules. We are validating a 18–24 month extension cohort with partner clinics and expect to roll it out in Q3 2026.",
  },
  {
    q: "Can I share results with my pediatrician?",
    a: "Yes — every report exports to a clinician-shareable PDF with the original signal timeline attached. You can also send a private link that expires in 7 days, or invite your doctor directly into your secure MannSaathi account.",
  },
  {
    q: "Do you offer human specialist review?",
    a: "Yes. After every completed screening you can book a 20-minute consult with a vetted developmental pediatrician from the AutiSense care network. Consults are billed separately, with sliding-scale pricing for low-income families.",
  },
];

function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-outline-variant/15"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="group flex w-full items-center justify-between gap-6 py-5 text-left focus-aurora rounded-md"
      >
        <span className="font-headline font-semibold text-[16.5px] sm:text-[17.5px] text-on-surface group-hover:text-primary transition-colors">
          {q}
       </span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
            open
              ? "bg-primary text-on-primary border-primary rotate-180"
              : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 group-hover:border-primary/30"
          }`}
        >
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
       </span>
     </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-[14.5px] leading-relaxed text-on-surface-muted">
              {a}
           </p>
         </motion.div>
        )}
     </AnimatePresence>
  </motion.div>
  );
}

export default function FAQ() {
  return (
    <section
      id="faq"
      className="relative bg-surface-container-low py-20 sm:py-24"
      data-tone="light"
      aria-label="Frequently asked questions"
    >
      <div className="mx-auto max-w-3xl px-6 sm:px-8 lg:px-10">
        <div className="text-center mb-12">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-primary-accent font-semibold">
            Questions, answered
         </p>
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
            Everything you might want to ask
         </h2>
       </div>

        <div className="rounded-3xl border border-outline-variant/15 bg-surface-container-lowest px-6 sm:px-8 shadow-card">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} idx={i} />
          ))}
       </div>
     </div>
   </section>
  );
}
