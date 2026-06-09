"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import Link from "next/link";
import {
  useHeroTimeline,
  useFadeInOnScroll,
  useStaggerChildren,
  useCountUp,
  useSpotlight,
} from "@/hooks/useGsap";

export default function LandingPage() {
  // Purposeful animations only — magnetic hover and parallax removed
  const heroRef = useHeroTimeline();
  const howItWorksRef = useFadeInOnScroll({ y: 60 });
  const communityRef = useFadeInOnScroll({ y: 60 });
  const bentoRef = useStaggerChildren({ stagger: 0.1, y: 40 });
  const ctaRef = useFadeInOnScroll({ y: 50 });

  // Count-up refs for stats
  const familyCountRef = useCountUp(12000, { suffix: "+", duration: 2.5 });
  const specialistCountRef = useCountUp(50, { suffix: "+", duration: 2 });

  // Spotlight for bento cards (signature linear/vercel hover detail)
  const spotlightRef1 = useSpotlight();
  const spotlightRef2 = useSpotlight();
  const spotlightRef3 = useSpotlight();
  const spotlightRef4 = useSpotlight();

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="pt-20 overflow-x-hidden flex-grow">

        {/* ═══════════════════════════════════════════════════════════
            Section 1: Hero — GSAP timeline, clean background
        ═══════════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 text-center max-w-7xl mx-auto"
        >
          <h1
            data-hero="heading"
            className="font-display font-extrabold text-primary text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-8 max-w-5xl leading-[1.05]"
          >
            Early Signs.{" "}
            <span className="bg-gradient-to-r from-secondary via-primary-accent to-primary bg-clip-text text-transparent italic">
              Clearer Path.
            </span>
          </h1>

          <div data-hero="subtitle" className="max-w-2xl mb-12">
            <p className="font-body text-on-surface-variant text-xl md:text-2xl leading-relaxed">
              AI-powered autism screening for children and teens, with compassionate support at every step.
            </p>
          </div>

          <div data-hero="cta" className="flex flex-col sm:flex-row gap-4">
            <Link href="/begin-the-journey">
              <button className="bg-primary text-on-primary px-10 py-4 rounded-full font-headline font-bold text-base hover:bg-primary-dim hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/15">
                Begin the Journey
              </button>
            </Link>
            <Link href="/assessment">
              <button className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-full font-headline font-bold text-base hover:bg-secondary-fixed-dim active:scale-[0.98] transition-all">
                Try Assessment
              </button>
            </Link>
          </div>

          {/* Trust badges — replaces icon bar */}
          <div data-hero="proof" className="mt-14 flex flex-col items-center gap-4">
            <p className="text-label-caps text-on-surface-muted">Trusted by families &amp; clinicians</p>
            <div className="flex flex-wrap justify-center items-center gap-3">
              {[
                { icon: "science", label: "Evidence-Based Assessments" },
                { icon: "lock", label: "Privacy First" },
                { icon: "groups", label: "50+ Specialists" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low border border-outline-variant/20 text-on-surface-muted text-xs font-semibold"
                >
                  <span className="material-symbols-outlined text-sm text-primary-accent">{badge.icon}</span>
                  {badge.label}
                </div>
              ))}
            </div>
          </div>

          {/* Stem divider */}
          <div data-hero="stem" className="mt-10 w-px h-32 bg-gradient-to-b from-secondary/30 via-secondary/10 to-transparent" />
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Section 2: How It Works — 3-step numbered process
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-surface-container-low">
          <div ref={howItWorksRef} className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-label-caps text-primary-accent mb-3">Simple Process</p>
              <h2 className="font-headline font-bold text-3xl md:text-5xl text-on-surface tracking-tighter">
                From first screening to clear insight
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: "videocam",
                  title: "Complete a Screening",
                  description: "A 10-minute camera-based session guides you through 5 behavioral observation modules.",
                },
                {
                  step: "02",
                  icon: "psychology",
                  title: "Get AI Analysis",
                  description: "Our ML model maps the behavioral signals and generates a clear, compassionate report.",
                },
                {
                  step: "03",
                  icon: "groups",
                  title: "Connect with Specialists",
                  description: "Share your report with our vetted network of pediatric specialists who understand the journey.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/10 tonal-lift"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <span className="font-headline font-extrabold text-3xl text-primary/15 leading-none select-none">{item.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-2">{item.title}</h3>
                  <p className="text-on-surface-muted text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Section 3: Feature Bento — spotlight cards
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-surface">
          <div className="max-w-7xl mx-auto mb-12 text-center">
            <p className="text-label-caps text-primary-accent mb-3">Platform Features</p>
            <h2 className="font-headline font-bold text-3xl md:text-5xl text-on-surface tracking-tighter">
              Designed for sensory comfort
            </h2>
          </div>
          <div ref={bentoRef} className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div
                ref={spotlightRef1}
                className="spotlight-card md:col-span-2 bg-gradient-to-br from-surface-container-high to-surface-container rounded-2xl p-10 flex flex-col justify-between overflow-hidden relative border border-outline-variant/20 hover:border-primary/20 transition-colors duration-300"
              >
                <div className="relative z-10">
                  <h4 className="font-display font-bold text-2xl mb-3 text-primary">Quiet Mode Interface</h4>
                  <p className="text-on-surface-muted leading-relaxed max-w-md">
                    Every screen is tested for visual vibration and cognitive load — a tactile sanctuary for neurodivergent users.
                  </p>
                </div>
              </div>

              <div
                ref={spotlightRef2}
                className="spotlight-card bg-secondary text-on-secondary rounded-2xl p-10 flex flex-col justify-center items-center text-center shadow-lg shadow-secondary/10 hover:shadow-xl hover:shadow-secondary/15 transition-shadow duration-300"
              >
                <span className="material-symbols-outlined text-5xl mb-5">verified_user</span>
                <h4 className="font-display font-bold text-xl mb-3">Safety First</h4>
                <p className="text-on-secondary/80 text-sm leading-relaxed">Data privacy that exceeds clinical standards.</p>
              </div>

              <div
                ref={spotlightRef3}
                className="spotlight-card bg-surface-container-highest rounded-2xl p-10 border border-outline-variant/20 hover:bg-primary-container/20 hover:border-primary/20 transition-colors duration-300"
              >
                <span className="material-symbols-outlined text-primary-accent text-3xl mb-4 block">bedtime</span>
                <h4 className="font-display font-bold text-xl mb-2">Sleep Support</h4>
                <p className="text-on-surface-muted text-sm leading-relaxed">Resources for sensory-informed nighttime routines.</p>
              </div>

              <div
                ref={spotlightRef4}
                className="spotlight-card md:col-span-2 bg-gradient-to-r from-surface-container-low to-surface rounded-2xl p-10 flex items-center gap-8 border border-outline-variant/20 hover:border-primary/20 transition-colors duration-300"
              >
                <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-md shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-3xl">nest_eco_leaf</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-xl mb-2 text-primary">Sustainable Support</h4>
                  <p className="text-on-surface-muted max-w-lg text-sm leading-relaxed">
                    We build long-term infrastructure for your child&apos;s developmental ecosystem — not just answers.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Section 4: Social Proof / Stats — count-up
        ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 bg-surface-container-low">
          <div ref={communityRef} className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-tertiary-container/40 to-surface-container-high/60 rounded-3xl p-14 text-center border border-tertiary-container/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="material-symbols-outlined text-tertiary text-5xl mb-5 block">diversity_3</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-on-tertiary-container mb-4">Community Connection</h3>
              <p className="text-on-tertiary-fixed-variant text-lg leading-relaxed mb-10 max-w-xl mx-auto">
                Rooted in lived experience, our community spaces foster genuine, quiet connection and prevent burnout.
              </p>
              <div className="flex justify-center gap-16">
                <div className="flex flex-col items-center">
                  <span ref={familyCountRef} className="font-headline font-extrabold text-3xl text-tertiary">12,000+</span>
                  <span className="text-label-caps text-on-surface-muted mt-1">Families</span>
                </div>
                <div className="w-px h-10 bg-tertiary/20 self-center" />
                <div className="flex flex-col items-center">
                  <span ref={specialistCountRef} className="font-headline font-extrabold text-3xl text-tertiary">50+</span>
                  <span className="text-label-caps text-on-surface-muted mt-1">Specialists</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            Section 5: CTA — clean pill button
        ═══════════════════════════════════════════════════════════ */}
        <section ref={ctaRef} className="py-28 px-6 text-center max-w-4xl mx-auto">
          <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-on-surface mb-6 leading-tight tracking-tighter">
            Ready to let your journey{" "}
            <span className="text-primary-accent">bloom</span>?
          </h2>
          <p className="text-on-surface-muted text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of families who found clarity through our sensory-first navigator.
          </p>
          <Link href="/signup">
            <button className="bg-primary-accent text-on-primary px-14 py-5 rounded-full font-headline font-extrabold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary-accent/20 hover:shadow-2xl hover:shadow-primary-accent/30">
              Create Free Account
            </button>
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
