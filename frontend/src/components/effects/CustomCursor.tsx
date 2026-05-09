import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

const interactiveSelector = "a,button,input,textarea,select,[data-cursor='interactive']"

const CustomCursor = () => {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(0)

  const smoothX = useSpring(x, { stiffness: 500, damping: 32, mass: 0.25 })
  const smoothY = useSpring(y, { stiffness: 500, damping: 32, mass: 0.25 })
  const smoothScale = useSpring(scale, { stiffness: 360, damping: 24 })
  const smoothOpacity = useSpring(opacity, { stiffness: 260, damping: 26 })
  const ringOpacity = useTransform(smoothScale, [1, 1.8], [0.25, 0.42])

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return

    let raf = 0
    let nx = -100
    let ny = -100

    const flush = () => {
      x.set(nx)
      y.set(ny)
      raf = 0
    }

    const onMove = (event: MouseEvent) => {
      nx = event.clientX - 11
      ny = event.clientY - 11
      opacity.set(1)
      if (!raf) raf = requestAnimationFrame(flush)
    }

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as Element | null
      scale.set(target?.closest(interactiveSelector) ? 1.8 : 1)
    }

    const onLeave = () => opacity.set(0)

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseover", onMouseOver, { passive: true })
    document.addEventListener("mouseleave", onLeave)

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("mouseleave", onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [opacity, scale, x, y])

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-[100] h-[22px] w-[22px] rounded-full border border-sky-400/70 bg-sky-300/20 will-change-transform dark:border-cyan-300/70 dark:bg-cyan-300/20"
      style={{
        x: smoothX,
        y: smoothY,
        scale: smoothScale,
        opacity: smoothOpacity,
        boxShadow: "0 0 24px rgba(56,189,248,0.35)",
      }}
    >
      <motion.div className="absolute inset-0 rounded-full bg-sky-400 dark:bg-cyan-300" style={{ opacity: ringOpacity }} />
    </motion.div>
  )
}

export default CustomCursor
