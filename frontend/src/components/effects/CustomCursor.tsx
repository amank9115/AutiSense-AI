"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

/**
 * CustomCursor — Premium cursor replacement with magnetic and spotlight effects.
 *
 * Features:
 * - Inner dot (8px, solid primary)
 * - Outer ring (40px, outline, follows with spring delay)
 * - Scales up on [data-cursor="pointer"] elements
 * - Becomes a text bar on [data-cursor="text"]
 * - Hidden on touch devices
 * - Respects prefers-reduced-motion
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cursorState, setCursorState] = useState<"default" | "pointer" | "text" | "hidden">("default");

  useEffect(() => {
    // Don't show on touch devices or if reduced motion preferred
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      // Dot follows instantly
      gsap.to(dot, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: "power2.out",
      });

      // Ring follows with spring delay
      gsap.to(ring, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Detect cursor type from data attributes
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cursorEl = target.closest("[data-cursor]") as HTMLElement | null;

      if (cursorEl) {
        const type = cursorEl.getAttribute("data-cursor");
        if (type === "pointer" || type === "text" || type === "hidden") {
          setCursorState(type);
        }
      } else if (
        target.closest("a, button, [role='button'], input, textarea, select, label")
      ) {
        setCursorState("pointer");
      } else {
        setCursorState("default");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseover", handleElementHover);

    // Hide default cursor globally
    document.documentElement.style.cursor = "none";
    const styleEl = document.createElement("style");
    styleEl.id = "custom-cursor-style";
    styleEl.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.head.appendChild(styleEl);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseover", handleElementHover);
      document.documentElement.style.cursor = "";
      const existingStyle = document.getElementById("custom-cursor-style");
      if (existingStyle) existingStyle.remove();
    };
  }, [isVisible]);

  // Cursor state-based sizing
  const dotSize = cursorState === "pointer" ? 14 : cursorState === "text" ? 3 : 8;
  const dotHeight = cursorState === "text" ? 28 : dotSize;
  const ringSize = cursorState === "pointer" ? 50 : cursorState === "default" ? 40 : 0;

  if (!isVisible) return null;

  return (
    <>
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: dotSize,
          height: dotHeight,
          background: "rgba(91,161,176,1)",
          borderRadius: cursorState === "text" ? 2 : "50%",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(-50%, -50%)",
          mixBlendMode: "difference",
          transition: "width 0.3s, height 0.3s, border-radius 0.3s",
        }}
      />
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          border: `1.5px solid rgba(91,161,176,${cursorState === "pointer" ? 0.6 : 0.35})`,
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 99998,
          transform: "translate(-50%, -50%)",
          transition: "width 0.3s, height 0.3s, opacity 0.3s, border-color 0.3s",
          opacity: ringSize > 0 ? 1 : 0,
        }}
      />
    </>
  );
}
