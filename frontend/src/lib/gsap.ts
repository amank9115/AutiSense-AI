"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins once
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Default easing presets for the MannSaathi design language
export const EASE = {
  /** Soft, organic ease — default for most reveals */
  reveal: "power3.out",
  /** Bouncy spring — for CTAs and interactive elements */
  spring: "elastic.out(1, 0.5)",
  /** Smooth decelerate — for scroll-driven parallax */
  smooth: "power2.out",
  /** Snappy — for micro-interactions */
  snap: "power4.out",
  /** Gentle — for background elements */
  gentle: "sine.inOut",
} as const;

// Default durations
export const DURATION = {
  fast: 0.4,
  normal: 0.8,
  slow: 1.2,
  reveal: 1.0,
  stagger: 0.06,
} as const;

export { gsap, ScrollTrigger };
