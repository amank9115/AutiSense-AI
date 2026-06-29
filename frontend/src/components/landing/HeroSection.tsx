"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { gsap, EASE, DURATION } from "@/lib/gsap";
import MeshGradientBg from "./MeshGradientBg";
import DashboardMockup from "./DashboardMockup";

/**
 * Hero section — dark, mesh-backed, with the dashboard mockup centered.
 *
 * Animation timeline (orchestrated here, no external hook):
 *  - eyebrow label slides down 24 → 0
 *  - mesh fades in
 *  - headline fades up 32 → 0
 *  - subtitle fades up 24 → 0
 *  - CTAs fade up + scale
 *  - dashboard mockup rises from y:60, rotate -8→0deg, scale 0.96→1
 *  - 3 floating cards rise + parallax-tied to mouse
 *  - bottom stem scales down y:1→0 (planned in plan doc)
 *
 * Reduced-motion: renders statically in final position.
 */
export default function HeroSection() {
  const rootRef = useRef<HTMLDivElement>(null);

  const runTimeline = () => {
    if (!rootRef.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(rootRef.current.querySelectorAll("[data-hero]"), {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        rotate: 0,
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: EASE.reveal, duration: DURATION.reveal },
      });
      tl.from("[data-hero='mesh']", { opacity: 0, scale: 1.08, duration: 1.6 })
        .from("[data-hero='heading']", { y: 32, opacity: 0, duration: 1.0 }, "-=0.9")
        .from("[data-hero='sub']", { y: 24, opacity: 0, duration: 0.8 }, "-=0.6")
        .from("[data-hero='cta'] > *", { y: 18, opacity: 0, stagger: 0.08, duration: 0.7 }, "-=0.5")
        .from("[data-hero='proof'] > *", { y: 14, opacity: 0, stagger: 0.06, duration: 0.6 }, "-=0.4")
        .from("[data-hero='mock']", { y: 60, opacity: 0, scale: 0.96, rotateX: 6, transformOrigin: "center bottom", duration: 1.1 }, "-=0.5");
    }, rootRef);

    return () => ctx.revert();
  };

  // Run on mount
  React.useEffect(() => {
    const cleanup = runTimeline();
    return cleanup;
  }, []);

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative isolate overflow-hidden pt-24 pb-12 lg:pt-32 lg:pb-24"
      data-tone="dark"
    >
      {/* Mesh bg */}
      <div data-hero="mesh" className="absolute inset-0 -z-10">
        <MeshGradientBg intensity={1} />
        {/* Mouse-tracking glow overlay */}
        <div className="absolute inset-0 mouse-glow-dark" />
     </div>

      {/* Top vignette to lift text contrast */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/40 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        {/* Headline */}
        <h1
          data-hero="heading"
          className="font-headline font-extrabold tracking-tighter leading-[0.95] text-center mx-auto mt-7 max-w-5xl text-3xl sm:text-5xl md:text-7xl lg:text-[88px] text-white"
        >
          Early signs.
          <br className="hidden sm:block" />{" "}
          <span className="text-aurora italic font-display">Clearer path</span>
      </h1>

        {/* Sub */}
        <p
          data-hero="sub"
          className="mx-auto mt-7 max-w-2xl text-center text-base sm:text-lg lg:text-xl text-ink-300 leading-relaxed"
        >
          AI-powered autism screening for children and teens — guided by{" "}
          <span className="font-semibold text-ink-100">AutiSense AI</span>, the
          sensory-first diagnostic co-pilot trusted by families worldwide.
      </p>

        {/* CTAs */}
        <div
          data-hero="cta"
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <div className="flex">
            <Link href="/begin-the-journey" className="btn-glow inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-headline font-bold text-[15px] focus-aurora group">
              Start free screening
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex">
            <Link href="/screening" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md px-6 py-3.5 font-headline font-semibold text-[14.5px] text-ink-100 hover:bg-white/[0.08] hover:border-white/25 transition-all duration-300">
              <PlayCircle className="h-4 w-4 text-violet-300" />
              Watch 90-sec demo
            </Link>
          </div>
      </div>

        {/* Trust row */}
        <div
          data-hero="proof"
          className="mt-8 flex flex-col items-center gap-4"
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 font-semibold">
            Trusted by families & pediatric specialists worldwide
        </p>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {[
              { icon: "✓", label: "HIPAA & SOC2 Type II" },
              { icon: "✓", label: "Evidence-based assessment" },
              { icon: "✓", label: "94.1% peer-reviewed accuracy" },
            ].map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-1.5 rounded-full glass-dark px-3 py-1.5 text-[11px] font-semibold text-ink-200"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {badge.icon}
            </span>
                {badge.label}
            </div>
            ))}
        </div>
      </div>

        {/* Partner strip — merged from TrustedByStrip */}
        <div
          data-hero="proof"
          className="mt-6 flex flex-col items-center gap-3"
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink-400 font-semibold">
            Backed by leading clinical institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {[
              { name: "Mayo Clinic", accent: "from-violet-500 to-fuchsia-500", glyph: "MC" },
              { name: "Stanford Pediatrics", accent: "from-sky-500 to-cyan-500", glyph: "SP" },
              { name: "AIIMS Delhi", accent: "from-emerald-500 to-teal-500", glyph: "AI" },
              { name: "Boston Children's", accent: "from-amber-500 to-orange-500", glyph: "BC" },
              { name: "King's College", accent: "from-pink-500 to-rose-500", glyph: "KC" },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 rounded-full glass-dark px-3 py-1.5 text-[11px] font-semibold text-ink-200"
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br ${p.accent} text-white text-[9px] font-bold`}>
                  {p.glyph}
                </span>
                {p.name}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup + floating cards */}
        <div
          data-hero="mock"
          className="relative mt-16 sm:mt-20 lg:mt-24 max-w-[1100px] mx-auto"
        >
          {/* Halo glow behind mockup */}
          <div
            aria-hidden="true"
            className="absolute -inset-x-12 -inset-y-10 -z-10 rounded-[3rem] opacity-80 blur-3xl"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 50%, rgba(139,92,246,0.35), rgba(56,189,248,0.18) 60%, transparent 80%)",
            }}
          />

          {/* Browser/device frame */}
          <div className="relative rounded-[1.6rem] ring-1 ring-white/10 shadow-dark-card-lg overflow-hidden glass-dark">
            {/* faint top highlight */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <DashboardMockup />
        </div>



          {/* Soft floor shadow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-12 blur-2xl opacity-60"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 0%, rgba(139,92,246,0.55), transparent 70%)",
            }}
          />
      </div>
    </div>

      {/* Hero → section transition: gradient fade to first light section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent via-ink-950/60 to-surface" />
  </section>
  );
}
