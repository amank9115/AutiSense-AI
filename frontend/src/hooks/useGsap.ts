"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, EASE, DURATION } from "@/lib/gsap";

// ──────────────────────────────────────────────────────────────
// Check reduced motion preference
// ──────────────────────────────────────────────────────────────
const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// ──────────────────────────────────────────────────────────────
// 1. useFadeInOnScroll — Fade + slide up when element enters viewport
// ──────────────────────────────────────────────────────────────
export function useFadeInOnScroll(
  options: {
    y?: number;
    x?: number;
    duration?: number;
    delay?: number;
    ease?: string;
    start?: string;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, x: 0 });
      return;
    }

    const {
      y = 60,
      x = 0,
      duration = DURATION.reveal,
      delay = 0,
      ease = EASE.reveal,
      start = "top 85%",
    } = options;

    gsap.set(el, { opacity: 0, y, x });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, x: 0, duration, delay, ease });
      },
      once: true,
    });

    return () => {
      trigger.kill();
    };
  }, [options]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 2. useStaggerChildren — Stagger-animate direct children
// ──────────────────────────────────────────────────────────────
export function useStaggerChildren(
  options: {
    y?: number;
    stagger?: number;
    duration?: number;
    ease?: string;
    start?: string;
    childSelector?: string;
  } = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;

    if (prefersReducedMotion()) {
      gsap.set(container.querySelectorAll(":scope > *"), { opacity: 1, y: 0 });
      return;
    }

    const {
      y = 50,
      stagger = DURATION.stagger,
      duration = DURATION.normal,
      ease = EASE.reveal,
      start = "top 85%",
      childSelector = ":scope > *",
    } = options;

    const children = container.querySelectorAll(childSelector);
    gsap.set(children, { opacity: 0, y });

    const trigger = ScrollTrigger.create({
      trigger: container,
      start,
      onEnter: () => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease,
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
    };
  }, [options]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 3. useTextReveal — Split text into words and reveal with stagger
// ──────────────────────────────────────────────────────────────
export function useTextReveal(
  options: {
    stagger?: number;
    duration?: number;
    y?: number;
    delay?: number;
    start?: string;
  } = {}
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;
    const {
      stagger = 0.035,
      duration = 0.8,
      y = 40,
      delay = 0,
      start = "top 85%",
    } = options;

    // Split text into words
    const text = el.textContent || "";
    const words = text.split(/\s+/).filter(Boolean);

    // Replace content with wrapped words
    el.innerHTML = words
      .map(
        (word) =>
          `<span style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:4px;"><span class="gsap-word" style="display:inline-block;transform:translateY(${y}px);opacity:0;">${word}</span></span>`
      )
      .join(
        '<span style="display:inline-block;width:0.3em;"></span>'
      );

    const wordEls = el.querySelectorAll(".gsap-word");

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      onEnter: () => {
        gsap.to(wordEls, {
          y: 0,
          opacity: 1,
          duration,
          stagger,
          delay,
          ease: EASE.reveal,
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
      // Restore original text on cleanup
      el.textContent = text;
    };
  }, [options]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 4. useParallax — Parallax Y-shift on scroll
// ──────────────────────────────────────────────────────────────
export function useParallax(speed: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;

    const trigger = gsap.to(el, {
      y: () => speed * 100,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      trigger.scrollTrigger?.kill();
    };
  }, [speed]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 5. useCountUp — Animate numbers from 0 → target on scroll
// ──────────────────────────────────────────────────────────────
export function useCountUp(
  target: number,
  options: {
    duration?: number;
    suffix?: string;
    prefix?: string;
    start?: string;
  } = {}
) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const { duration = 2, suffix = "", prefix = "", start = "top 85%" } = options;

    if (prefersReducedMotion()) {
      el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      return;
    }

    el.textContent = `${prefix}0${suffix}`;

    const obj = { val: 0 };

    const trigger = ScrollTrigger.create({
      trigger: el,
      start,
      onEnter: () => {
        gsap.to(obj, {
          val: target,
          duration,
          ease: EASE.smooth,
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(obj.val).toLocaleString()}${suffix}`;
          },
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
    };
  }, [target, options]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 6. useMagneticHover — Button pulls toward cursor
// ──────────────────────────────────────────────────────────────
export function useMagneticHover(strength: number = 0.3) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      gsap.to(el, {
        x: dx * strength,
        y: dy * strength,
        duration: 0.4,
        ease: EASE.smooth,
      });
    };

    const handleLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
      });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength]);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 7. useSpotlight — Radial gradient glow follows cursor on card
// ──────────────────────────────────────────────────────────────
export function useSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;

    const el = ref.current;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);
      el.style.setProperty("--spotlight-opacity", "1");
    };

    const handleLeave = () => {
      el.style.setProperty("--spotlight-opacity", "0");
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return ref;
}

// ──────────────────────────────────────────────────────────────
// 8. useHeroTimeline — Orchestrated hero entrance sequence
// ──────────────────────────────────────────────────────────────
export function useHeroTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (prefersReducedMotion()) {
      const heroes = containerRef.current.querySelectorAll("[data-hero]");
      gsap.set(heroes, { opacity: 1, y: 0, x: 0, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: EASE.reveal, duration: DURATION.reveal },
      });

      tl.from("[data-hero='heading']", {
        y: 80,
        opacity: 0,
        duration: 1.2,
      })
        .from(
          "[data-hero='subtitle']",
          { y: 40, opacity: 0, duration: 0.8 },
          "-=0.6"
        )
        .from(
          "[data-hero='cta']",
          {
            y: 30,
            opacity: 0,
            scale: 0.95,
            stagger: 0.12,
            duration: 0.7,
          },
          "-=0.4"
        )
        .from(
          "[data-hero='proof']",
          { y: 20, opacity: 0, duration: 0.6 },
          "-=0.2"
        )
        .from(
          "[data-hero='stem']",
          {
            scaleY: 0,
            transformOrigin: "top center",
            duration: 1.2,
            ease: EASE.gentle,
          },
          "-=0.4"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return containerRef;
}
