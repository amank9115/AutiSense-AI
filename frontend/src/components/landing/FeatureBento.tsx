"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  Sparkles,
  Users2,
  BadgeCheck,
  Lock,
  HeartPulse,
} from "lucide-react";
import { useSpotlight } from "@/hooks/useGsap";
import AuroraOrbSVG from "./illustrations/AuroraOrbSVG";
import BrainWaveSVG from "./illustrations/BrainWaveSVG";
import PrivacyShieldSVG from "./illustrations/PrivacyShieldSVG";
import ReportCardSVG from "./illustrations/ReportCardSVG";

/**
 * 6-tile feature grid with custom illustrations. Each tile gets the
 * spotlight cursor-follow glow + 3D tilt on hover + framer-motion
 * fade-in on scroll.
 */
export default function FeatureBento() {
  return (
    <section
      id="features"
      className="relative bg-surface py-20 sm:py-24"
      data-tone="light"
      aria-label="Platform features"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="mb-12 lg:mb-16 max-w-3xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-primary-accent font-semibold">
            Platform features
       </p>
          <h2 className="font-headline font-bold text-3xl sm:text-4xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
            Sensory-first diagnostic tools.
            <br className="hidden sm:block" />
            Built around real family needs.
       </h2>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-on-surface-variant leading-relaxed">
            Every screen is tested for visual vibration and cognitive load —
            a tactile sanctuary for neurodivergent users and the clinicians who serve them.
       </p>
     </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-5">
          {/* Tile 1 — Quiet Mode (col-span-3, big visual) */}
          <Tile span="md:col-span-3" bgClass="bg-gradient-to-br from-surface-container-high to-surface">
            <TileHeader
              icon={<Sparkles className="w-4 h-4" />}
              label="Quiet Mode"
              tone="violet"
            />
            <div className="flex-1 grid place-items-center py-2">
              <div className="scale-90 sm:scale-100">
                <AuroraOrbSVG className="w-44 h-44" />
             </div>
           </div>
            <TileFooter
              title="Sensory-safe by default"
              body="Calibrated motion, contrast, and audio pacing for every interactive surface."
            />
         </Tile>

          {/* Tile 2 — Realtime AI (col-span-3) */}
          <Tile span="md:col-span-3" bgClass="bg-gradient-to-br from-ink-900 to-ink-800 text-ink-100">
            <TileHeader
              icon={<Activity className="w-4 h-4" />}
              label="Realtime AI"
              tone="ink"
              invert
            />
            <div className="flex-1 grid place-items-center py-2">
              <div className="w-full max-w-xs">
                <BrainWaveSVG className="w-full" />
             </div>
           </div>
            <TileFooter
              title="94.1% signal match under 3s"
              body="AutiSense AI analyzes facial affect, gaze and prosody frame-by-frame — no questionnaire."
              invert
            />
         </Tile>

          {/* Tile 3 — Privacy (col-span-2) */}
          <Tile span="md:col-span-2" bgClass="bg-surface-container-low">
            <TileHeader
              icon={<Shield className="w-4 h-4" />}
              label="Privacy-first"
              tone="violet"
            />
            <div className="flex-1 grid place-items-center py-2">
              <PrivacyShieldSVG className="w-28 h-32" />
           </div>
            <TileFooter
              title="On-device by default"
              body="Raw video never leaves the device unless you share it. Encrypted at rest & in transit."
            />
         </Tile>

          {/* Tile 4 — Family insights (col-span-2) */}
          <Tile span="md:col-span-2" bgClass="bg-surface-container-low">
            <TileHeader
              icon={<HeartPulse className="w-4 h-4" />}
              label="Family insights"
              tone="mint"
            />
            <div className="flex-1 grid place-items-center py-2">
              <ReportCardSVG className="w-56 max-w-full" />
           </div>
            <TileFooter
              title="AI report cards, not scores"
              body="Plain-language breakdowns of receptive language, social reciprocity, and sensory profile."
            />
         </Tile>

          {/* Tile 5 — Specialist network (col-span-2) */}
          <Tile span="md:col-span-2" bgClass="bg-secondary text-on-secondary">
            <TileHeader
              icon={<Users2 className="w-4 h-4" />}
              label="Care network"
              tone="ink"
              invert
            />
            <div className="flex-1 grid place-items-center py-2">
              <AvatarCluster />
           </div>
            <TileFooter
              title="50+ vetted pediatric specialists"
              body="Direct, secure handoff to developmental pediatricians and child psychologists."
              invert
            />
         </Tile>

          {/* Tile 6 — Compliance (col-span-6) */}
          <Tile span="md:col-span-6" bgClass="bg-gradient-to-r from-surface-container-low to-surface">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center h-full">
              <div className="md:col-span-1 flex flex-col gap-3">
                <TileHeader
                  icon={<Lock className="w-4 h-4" />}
                  label="Compliance"
                  tone="violet"
                />
                <p className="font-headline font-bold text-xl text-on-surface leading-snug">
                  Clinical-grade security, audit-ready from day one.
             </p>
          </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <ComplianceBadge label="HIPAA" subtitle="Compliant" />
                <ComplianceBadge label="SOC 2" subtitle="Type II" />
                <ComplianceBadge label="GDPR" subtitle="Right to erasure" />
                <ComplianceBadge label="ISO 27001" subtitle="Certified" />
                <ComplianceBadge label="COPPA" subtitle="Under-13 safe" />
             </div>
        </div>
         </Tile>
      </div>
    </div>
 </section>
  );
}

// ──────────── sub-components ────────────

function Tile({
  span,
  bgClass,
  children,
}: {
  span: string;
  bgClass?: string;
  children: React.ReactNode;
}) {
  const ref = useSpotlight();
  const tileRef = useRef<HTMLDivElement | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      ref={(el) => {
        // useSpotlight returns a plain { current } ref; assign directly.
        if (el && ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        tileRef.current = el;
      }}
      onMouseMove={(e) => {
        const el = tileRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        el.style.setProperty("--rx", `${rx}deg`);
        el.style.setProperty("--ry", `${ry}deg`);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
      }}
      className={[
        "spotlight-card lift-3d group relative flex flex-col overflow-hidden rounded-3xl p-6 sm:p-8 border border-outline-variant/15 shadow-card min-h-[260px] sm:min-h-[300px]",
        bgClass ?? "",
        span,
      ].join(" ")}
    >
      {children}
   </motion.div>
  );
}

function TileHeader({
  icon,
  label,
  tone,
  invert,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "violet" | "mint" | "ink";
  invert?: boolean;
}) {
  const tones = {
    violet: "bg-violet-500/15 text-violet-600",
    mint: "bg-emerald-500/15 text-emerald-600",
    ink: "bg-white/10 text-white",
  };
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid h-7 w-7 place-items-center rounded-lg ${tones[tone]} ${
          invert ? "" : ""
        }`}
      >
        {icon}
     </span>
      <span
        className={`text-[10.5px] uppercase tracking-[0.2em] font-bold ${
          invert ? "text-ink-300" : "text-on-surface-muted"
        }`}
      >
        {label}
     </span>
   </div>
  );
}

function TileFooter({
  title,
  body,
  invert,
}: {
  title: string;
  body: string;
  invert?: boolean;
}) {
  return (
    <div className="mt-2">
      <h4
        className={`font-headline font-bold text-lg leading-tight mb-1 ${
          invert ? "text-white" : "text-on-surface"
        }`}
      >
        {title}
     </h4>
      <p
        className={`text-[13px] leading-relaxed ${
          invert ? "text-ink-300" : "text-on-surface-muted"
        }`}
      >
        {body}
     </p>
   </div>
  );
}

function ComplianceBadge({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 shadow-card hover:shadow-card-raised hover:-translate-y-0.5 transition-all duration-300">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15">
        <BadgeCheck className="h-4 w-4 text-primary-accent" />
     </span>
      <div className="leading-tight">
        <p className="font-headline font-bold text-[14.5px] text-on-surface">{label}</p>
        <p className="text-[11.5px] text-on-surface-muted">{subtitle}</p>
     </div>
   </div>
  );
}

function AvatarCluster() {
  const colors = ["#8B5CF6", "#EC4899", "#34D399", "#06B6D4", "#FBBF24"];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex -space-x-3">
        {colors.map((c, i) => (
          <div
            key={i}
            className="grid h-12 w-12 place-items-center rounded-full ring-2 ring-secondary font-bold text-white text-sm transition-transform duration-300 hover:translate-y-[-4px] hover:scale-110"
            style={{ background: c, zIndex: 10 - i }}
          >
            {["P", "M", "R", "S", "A"][i]}
         </div>
        ))}
        <div className="grid h-12 w-12 place-items-center rounded-full ring-2 ring-secondary bg-secondary-dim text-on-secondary font-bold text-sm">
          +
       </div>
     </div>
      <p className="text-[12px] font-semibold text-on-secondary/70 tracking-wide uppercase">
        Pediatrics · OT · SLP · Psych
     </p>
   </div>
  );
}
