"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { Activity, Clock, FileCheck2, TrendingUp } from "lucide-react";

interface FloatingCardsProps {
  /** Container ref to receive mouse-move handler. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

interface CardSpec {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  /** Tailwind positioning at the base layout (lg+). */
  className: string;
  /** Parallax strength; smaller = more drift. */
  strength: number;
  /** Stagger delay on entrance. */
  delay: number;
}

/**
 * Three floating UI cards that orbit the dashboard mockup. Each card:
 * - Parallax-tied to mouse position (parallax strength differs per card)
 * - Has ambient float-soft animation (CSS keyframe)
 * - Fades in from y:+30 → 0 on entrance (GSAP)
 */
export default function FloatingCards({ triggerRef }: FloatingCardsProps) {
  const cards: CardSpec[] = [
    {
      label: "AutiSense AI",
      value: "94%",
      hint: "Match confidence",
      icon: <Activity className="w-4 h-4 text-violet-300" />,
      className: "left-[-2rem] top-12 lg:left-[-3rem] lg:top-6",
      strength: 0.6,
      delay: 0.05,
    },
    {
      label: "Avg. duration",
      value: "1m 58s",
      hint: "Under 2 min",
      icon: <Clock className="w-4 h-4 text-sky-300" />,
      className: "right-[-1rem] top-32 lg:right-[-3rem] lg:top-20",
      strength: 0.45,
      delay: 0.18,
    },
    {
      label: "Reports ready",
      value: "10,284",
      hint: "This season",
      icon: <FileCheck2 className="w-4 h-4 text-emerald-300" />,
      className: "right-[-2rem] bottom-12 lg:right-[-3rem] lg:bottom-6",
      strength: 0.3,
      delay: 0.3,
    },
  ];

  const refs = useRef<HTMLDivElement[]>([]);
  const xToRef = useRef<Array<(v: number) => void>>([]);
  const yToRef = useRef<Array<(v: number) => void>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Initialize quickTo per card
    refs.current.forEach((el, i) => {
      if (!el) return;
      const s = cards[i].strength;
      xToRef.current[i] = gsap.quickTo(el, "x", {
        duration: 0.9,
        ease: "power3.out",
      });
      yToRef.current[i] = gsap.quickTo(el, "y", {
        duration: 0.9,
        ease: "power3.out",
      });
      void s;
    });

    const root = triggerRef?.current ?? window;

    const onMove = (e: MouseEvent | { clientX: number; clientY: number }) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nx = (e.clientX / w - 0.5);
      const ny = (e.clientY / h - 0.5);
      refs.current.forEach((_, i) => {
        const s = cards[i].strength;
        xToRef.current[i]?.(nx * 40 * s);
        yToRef.current[i]?.(ny * 30 * s);
      });
    };

    if ("addEventListener" in root && root !== window) {
      (root as HTMLElement).addEventListener(
        "mousemove",
        onMove as (e: MouseEvent) => void,
        { passive: true },
      );
    } else {
      window.addEventListener(
        "mousemove",
        onMove as (e: MouseEvent) => void,
        { passive: true },
      );
    }

    return () => {
      if ("removeEventListener" in root && root !== window) {
        (root as HTMLElement).removeEventListener(
          "mousemove",
          onMove as (e: MouseEvent) => void,
        );
      } else {
        window.removeEventListener(
          "mousemove",
          onMove as (e: MouseEvent) => void,
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {cards.map((c, i) => (
        <div
          key={c.label}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          data-hero={`float-${i + 1}`}
          className={[
            "pointer-events-none absolute z-20",
            c.className,
            i % 2 === 0 ? "float-soft" : "float-soft-2",
          ].join(" ")}
          aria-hidden="true"
        >
          <div className="glass-dark rounded-2xl px-4 py-3 shadow-dark-card-lg min-w-[170px] ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="grid place-items-center w-7 h-7 rounded-lg bg-white/5 ring-1 ring-white/10">
                {c.icon}
             </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-ink-300 font-bold">
                {c.label}
             </span>
           </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                {c.value}
             </span>
              <span className="text-[10px] text-ink-400 font-semibold inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {c.hint}
             </span>
           </div>
         </div>
       </div>
      ))}
    </>
  );
}
