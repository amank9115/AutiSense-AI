"use client";

import React from "react"
import DemoBanner from "../demo/DemoBanner"
import AnimatedBackground from "../effects/AnimatedBackground"
import CustomCursor from "../effects/CustomCursor"
import Footer from "./Footer"
import GlassNavbar from "./GlassNavbar"
import { useAuth } from "../../context/AuthContext"

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { isGuest } = useAuth()

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-400">
      <AnimatedBackground />
      <CustomCursor />
      <GlassNavbar />
      {isGuest && <DemoBanner />}
      <main className="pt-4">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default AppShell
