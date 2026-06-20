"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import HeroSection from "@/components/landing/HeroSection";
import TrustedByStrip from "@/components/landing/TrustedByStrip";
import StatsBand from "@/components/landing/StatsBand";
import FeatureBento from "@/components/landing/FeatureBento";
import HowItWorks from "@/components/landing/HowItWorks";
import AIDemoPreview from "@/components/landing/AIDemoPreview";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";

/**
 * MannSaathi landing page (v2).
 *
 * Layout composition (light → dark hybrid):
 *   <HeroSection/>           dark  — mesh + headline + mockup + floating cards
 *   <TrustedByStrip/>        light — institutions marquee
 *   <StatsBand/>             light — 4 count-ups
 *   <FeatureBento/>          light — 6 feature tiles w/ mini visuals
 *   <HowItWorks/>            light — 3-step workflow with connector
 *   <AIDemoPreview/>         dark  — interactive AI report card
 *   <Testimonials/>          light — 3 testimonial cards
 *   <FAQ/>                   light — accordion
 *   <CTASection/>            dark  — final conversion w/ glow + gradient border
 */
export default function LandingPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="overflow-x-hidden flex-grow">
        <HeroSection />
        <TrustedByStrip />
        <StatsBand />
        <FeatureBento />
        <HowItWorks />
        <AIDemoPreview />
        <Testimonials />
        <FAQ />
        <CTASection />
     </main>

      <Footer />
   </div>
  );
}
