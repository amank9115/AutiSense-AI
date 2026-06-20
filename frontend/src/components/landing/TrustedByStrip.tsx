"use client";

import React from "react";
import { motion } from "framer-motion";

interface Partner {
  name: string;
  /** Two-letter monogram inside the chip. */
  glyph: string;
  accent: string;
}

/**
 * Light-themed "trusted by" strip. Five partner mono-pill chips with a
 * hover scale-lift + continuous marquee on mobile. Sits as the first
 * light section directly under the dark hero.
 */
export default function TrustedByStrip() {
  const partners: Partner[] = [
    { name: "Mayo Clinic Network", glyph: "MC", accent: "from-violet-500 to-fuchsia-500" },
    { name: "Stanford Pediatrics", glyph: "SP", accent: "from-sky-500 to-cyan-500" },
    { name: "AIIMS Delhi", glyph: "AI", accent: "from-emerald-500 to-teal-500" },
    { name: "Boston Children's", glyph: "BC", accent: "from-amber-500 to-orange-500" },
    { name: "King's College London", glyph: "KC", accent: "from-pink-500 to-rose-500" },
  ];

  return (
    <section
      className="relative w-full bg-surface py-10 sm:py-14"
      data-tone="light"
      aria-label="Trusted by partners"
    >
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-6 text-center text-[11px] uppercase tracking-[0.22em] text-on-surface-muted font-semibold">
          Backed by leading clinical & research institutions
       </p>

        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <motion.div
            className="flex gap-3 w-max"
            initial={{ x: 0 }}
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          >
            {[...partners, ...partners].map((p, i) => (
              <div
                key={i}
                className="group flex shrink-0 items-center gap-3 rounded-full border border-outline-variant/15 bg-surface-container-lowest px-4 py-2 shadow-[0_2px_8px_rgba(23,104,118,0.05)] transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.04]"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${p.accent} text-white text-[10px] font-bold tracking-wide`}
                >
                  {p.glyph}
               </span>
                <span className="text-[13px] font-semibold text-on-surface-variant whitespace-nowrap group-hover:text-on-surface transition-colors">
                  {p.name}
               </span>
             </div>
            ))}
         </motion.div>
       </div>
     </div>
   </section>
  );
}
