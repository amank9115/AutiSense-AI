"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Within the first 10 minutes of using MannSaathi, my husband and I felt like we finally had a framework to talk with our pediatrician. The report read like a conversation, not a verdict.",
    name: "Aanya M.",
    role: "Parent of 4-yr-old · Mumbai",
    initials: "AM",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    quote:
      "I evaluate 30+ cases a week. AutiSense doesn't try to replace clinical judgment — it gives me an exhaustive summary so I can focus on the family in front of me.",
    name: "Dr. Sahana Rao",
    role: "Developmental pediatrician · AIIMS Delhi",
    initials: "SR",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    quote:
      "Our sensory clinic piloted MannSaathi with eight families. Six said it was the first assessment experience where their child completed the session voluntarily.",
    name: "Marcus Lin",
    role: "OT lead · Boston Sensory Co.",
    initials: "ML",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative bg-surface py-20 sm:py-24"
      data-tone="light"
      aria-label="User testimonials"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-12 lg:mb-16 max-w-3xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-primary-accent font-semibold">
            Voices from the journey
         </p>
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
            Real families. Real pediatricians.{" "}
            <span className="text-on-surface-variant italic font-display">
              No fear-based messaging.
           </span>
         </h2>
       </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex flex-col rounded-3xl border border-outline-variant/15 bg-surface-container-low p-7 shadow-card hover:shadow-card-raised transition-all duration-300 hover:-translate-y-1"
            >
              {/* decorative gradient aura */}
              <div className="pointer-events-none absolute -top-px -right-px h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-gradient-to-br from-violet-500/40 to-cyan-400/20" />

              {/* Quote glyph */}
              <Quote className="h-5 w-5 text-primary-accent opacity-70" />
              <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-on-surface-variant">
                &ldquo;{t.quote}&rdquo;
             </blockquote>

              <div className="mt-5 flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-amber-400" />
                ))}
             </div>

              <figcaption className="mt-5 flex items-center gap-3 pt-5 border-t border-outline-variant/15">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-white font-bold text-sm shadow-md`}
                >
                  {t.initials}
               </span>
                <div className="leading-tight">
                  <p className="font-headline font-bold text-[14.5px] text-on-surface">
                    {t.name}
                 </p>
                  <p className="text-[12px] text-on-surface-muted">
                    {t.role}
                 </p>
               </div>
             </figcaption>
           </motion.figure>
          ))}
       </div>
     </div>
   </section>
  );
}
