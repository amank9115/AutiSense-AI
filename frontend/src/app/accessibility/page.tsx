"use client";
import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import AccessibilitySettings from "@/components/common/AccessibilitySettings";

export default function AccessibilityPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-6 pt-32 pb-20 w-full">
        <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-4">Accessibility Support</h1>
        <p className="text-on-surface-variant text-sm mb-10 opacity-60">MannSaathi is designed with sensory-first principles.</p>

        {/* Live, working controls — these apply instantly across the app and persist. */}
        <section className="mb-12">
          <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Personalise your experience</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            These settings take effect immediately and are remembered on this device.
          </p>
          <AccessibilitySettings />
        </section>

        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Our Commitment</h2>
            <p>Every screen in MannSaathi is tested for visual vibration, cognitive load, and sensory comfort. We aim to meet WCAG 2.1 AA standards across the platform.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Features</h2>
            <p>Use the controls above for high-contrast text, reduced motion, and larger text sizes. We also support full keyboard navigation, screen-reader compatibility, and a low-stimulation interface designed for neurodivergent users and caregivers.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Report an Issue</h2>
            <p>If you encounter an accessibility barrier, please contact us at <a href="mailto:accessibility@mannsaathi.ai" className="text-primary font-bold hover:underline">accessibility@mannsaathi.ai</a> and we will prioritise a fix.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
