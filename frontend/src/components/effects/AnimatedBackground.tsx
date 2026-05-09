import { useEffect, useRef } from "react"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  glow: number
}

const PARTICLE_COUNT = 52

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId = 0
    let width = 0
    let height = 0
    const pointer = { x: -9999, y: -9999 }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.6 + Math.random() * 2.5,
      glow: 0.2 + Math.random() * 0.45,
    }))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * window.devicePixelRatio)
      canvas.height = Math.floor(height * window.devicePixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    }

    const onMove = (event: MouseEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        const dx = pointer.x - p.x
        const dy = pointer.y - p.y
        const distSq = dx * dx + dy * dy

        if (distSq < 17000) {
          const force = 0.025
          p.vx += (dx / 200) * force
          p.vy += (dy / 200) * force
        }

        p.vx *= 0.985
        p.vy *= 0.985

        p.x += p.vx
        p.y += p.vy

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56, 189, 248, ${p.glow})`
        ctx.shadowBlur = 12
        ctx.shadowColor = "rgba(45, 212, 191, 0.55)"
        ctx.fill()
      }

      ctx.shadowBlur = 0
      animationId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseleave", onLeave)

    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.13),transparent_45%)]" />
    </div>
  )
}

export default AnimatedBackground
