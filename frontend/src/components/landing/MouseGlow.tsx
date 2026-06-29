"use client";

import { useEffect } from "react";

/**
 * Mounts a fixed, pointer-following radial light that overlays everything.
 *
 * Implementation: writes --mouse-x / --mouse-y to <html>, so any element
 * using `.mouse-glow-dark` / `.mouse-glow-mint` (defined in globals.css)
 * can render a 500–600px soft glow under the cursor.
 *
 * Skipped on touch devices (no hover cursor).
 */
export default function MouseGlow(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip on coarse pointers (touch)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;

    const apply = () => {
      // Lerp toward target for buttery motion at 60fps
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      document.documentElement.style.setProperty("--mouse-x", `${x}px`);
      document.documentElement.style.setProperty("--mouse-y", `${y}px`);
      raf = requestAnimationFrame(apply);
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(apply);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return null;
}
