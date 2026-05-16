"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      <Navbar />

      <main className="pt-24 overflow-x-hidden flex-grow">
        {/* Hero Section: The Sprout */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 text-center max-w-7xl mx-auto">
          <div className="absolute inset-0 -z-10 flex justify-center items-center">
            <div className="organic-shape bg-secondary-container/20 w-[700px] h-[700px] blur-3xl opacity-40 animate-pulse" style={{ animationDuration: "8s" }} />
          </div>
          <h1 className="font-display font-extrabold text-primary text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-8 max-w-5xl leading-[1.1]">
            Early Signs. <span className="text-secondary italic">Clearer Path.</span>
          </h1>
          <div className="max-w-2xl mb-14">
            <p className="font-body text-on-surface-variant text-xl md:text-2xl leading-relaxed tracking-wide">
              AI-powered autism screening for children and teens with compassionate support.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/begin-the-journey">
              <button className="bg-primary-accent text-on-primary px-10 py-5 rounded-xl font-headline font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary-accent/10">
                Begin the Journey
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-secondary-container/50 text-on-secondary-container px-10 py-5 rounded-xl font-headline font-bold text-lg hover:bg-secondary-fixed-dim active:scale-95 transition-all backdrop-blur-sm">
                Try a Demo
              </button>
            </Link>
          </div>
          {/* Central Visual Anchor */}
          <div className="mt-20 w-px h-64 bg-gradient-to-b from-secondary/40 via-secondary/10 to-transparent" />
        </section>

        {/* The Bloom Experience: Service Reveal */}
        <section className="relative py-32 px-6 md:px-12 bg-gradient-to-b from-surface to-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
              {/* Left Branch: Clinical Rigor */}
              <div className="md:col-span-5 group">
                <div className="bloom-card bg-surface-container-lowest p-10 rounded-lg shadow-sm border-l-8 border-primary-accent relative overflow-hidden cursor-default">
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-container/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  <span className="material-symbols-outlined text-primary-accent text-4xl mb-6 block">clinical_notes</span>
                  <h3 className="font-headline font-bold text-3xl text-on-background mb-4">Clinical Rigor</h3>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed mb-8">
                    Evidence-based assessments delivered through a low-aroused interface that respects sensory processing needs.
                  </p>
                  <div className="w-full h-48 bg-gradient-to-br from-primary-container/30 to-secondary-container/30 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/30 text-6xl">analytics</span>
                  </div>
                </div>
              </div>

              {/* Center Stem Visual */}
              <div className="hidden md:flex md:col-span-2 justify-center relative h-full">
                <div className="w-px bg-secondary/20 h-full flex flex-col items-center justify-between py-24">
                  <div className="w-3 h-3 bg-primary-accent rounded-full shadow-[0_0_15px_rgba(91,161,176,0.4)]" />
                  <div className="w-5 h-5 bg-secondary rounded-full shadow-[0_0_20px_rgba(62,104,74,0.3)]" />
                  <div className="w-3 h-3 bg-tertiary rounded-full shadow-[0_0_15px_rgba(114,93,0,0.3)]" />
                </div>
              </div>

              {/* Right Branch: AI Insights */}
              <div className="md:col-span-5 group md:mt-48">
                <div className="bloom-card bg-surface-container-lowest p-10 rounded-lg shadow-sm border-r-8 border-secondary-dim relative overflow-hidden cursor-default">
                  <div className="absolute -left-12 -top-12 w-48 h-48 bg-secondary-container/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  <span className="material-symbols-outlined text-secondary text-4xl mb-6 block">psychology</span>
                  <h3 className="font-headline font-bold text-3xl text-on-background mb-4">AI Insights</h3>
                  <p className="font-body text-on-surface-variant text-lg leading-relaxed mb-8">
                    Gentle machine learning that maps progress patterns without the noise of traditional diagnostic tools.
                  </p>
                  <div className="w-full h-48 bg-gradient-to-br from-secondary-container/30 to-tertiary-container/30 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary/30 text-6xl">neurology</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Roots: Bottom Span */}
            <div className="mt-32 max-w-4xl mx-auto">
              <div className="community-shape bg-gradient-to-br from-tertiary-container/40 to-surface-container-high/60 p-16 text-center relative overflow-hidden group shadow-inner border border-tertiary-container/30">
                <div className="relative z-10">
                  <div className="animate-float inline-block">
                    <span className="material-symbols-outlined text-tertiary text-6xl mb-6 block">diversity_3</span>
                  </div>
                  <h3 className="font-display font-bold text-4xl text-on-tertiary-container mb-6">Community Connection</h3>
                  <p className="font-body text-on-tertiary-fixed-variant text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
                    Rooted in lived experience, our community spaces are built to prevent burnout and foster genuine, quiet connection.
                  </p>
                  <div className="flex justify-center gap-12">
                    <div className="flex flex-col items-center">
                      <span className="font-headline font-extrabold text-3xl text-tertiary">12k+</span>
                      <span className="text-on-surface-variant font-medium text-sm uppercase tracking-widest">Families</span>
                    </div>
                    <div className="w-px h-12 bg-tertiary/20" />
                    <div className="flex flex-col items-center">
                      <span className="font-headline font-extrabold text-3xl text-tertiary">50+</span>
                      <span className="text-on-surface-variant font-medium text-sm uppercase tracking-widest">Specialists</span>
                    </div>
                  </div>
                </div>
                {/* Decorative Orbs */}
                <div className="absolute top-4 left-4 w-12 h-12 bg-tertiary/10 rounded-full animate-float" style={{ animationDelay: "-1s" }} />
                <div className="absolute bottom-10 right-10 w-20 h-20 bg-primary-accent/5 rounded-full animate-float" style={{ animationDelay: "-2s" }} />
              </div>
            </div>
          </div>
        </section>

        {/* Bento Spotlight: Sensory Features */}
        <section className="py-32 px-6 md:px-12 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Quiet Mode Interface */}
              <div className="md:col-span-2 bg-gradient-to-br from-surface-container-high to-surface-container rounded-lg p-12 flex flex-col justify-between overflow-hidden relative group border border-outline-variant/30">
                <div className="relative z-10">
                  <h4 className="font-display font-bold text-3xl mb-4 text-primary">Quiet Mode Interface</h4>
                  <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">Every screen is tested for visual vibration and cognitive load, ensuring a &quot;Tactile Sanctuary&quot; for users.</p>
                </div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 group-hover:opacity-50 transition-opacity duration-700">
                  <div className="w-full h-full bg-gradient-to-br from-primary-container/20 to-secondary-container/20" />
                </div>
              </div>

              {/* Safety First */}
              <div className="bg-secondary text-on-secondary rounded-lg p-12 flex flex-col justify-center items-center text-center shadow-lg shadow-secondary/10">
                <span className="material-symbols-outlined text-6xl mb-6">verified_user</span>
                <h4 className="font-display font-bold text-2xl mb-4">Safety First</h4>
                <p className="text-on-secondary/80 leading-relaxed">Data privacy that exceeds clinical standards, handled with care.</p>
              </div>

              {/* Sleep Support */}
              <div className="bg-surface-container-highest rounded-lg p-12 group hover:bg-primary-container/20 transition-colors border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary-accent text-4xl mb-4 block">bedtime</span>
                <h4 className="font-display font-bold text-2xl mb-2">Sleep Support</h4>
                <p className="text-on-surface-variant leading-relaxed">Resources for sensory-informed nighttime routines.</p>
              </div>

              {/* Sustainable Support */}
              <div className="md:col-span-2 bg-gradient-to-r from-surface-container-low to-surface rounded-lg p-12 flex items-center gap-8 group border border-outline-variant/20">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-4xl">nest_eco_leaf</span>
                </div>
                <div>
                  <h4 className="font-display font-bold text-2xl mb-2 text-primary">Sustainable Support</h4>
                  <p className="text-on-surface-variant max-w-lg leading-relaxed">We don&apos;t just provide answers; we build the long-term infrastructure for your child&apos;s developmental ecosystem.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-6 text-center max-w-4xl mx-auto relative">
          <div className="absolute inset-0 -z-10 flex justify-center items-center opacity-30">
            <div className="organic-shape bg-primary-accent/10 w-full h-full blur-3xl" />
          </div>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-on-background mb-8 leading-tight tracking-tight">Ready to let your journey <span className="text-primary-accent">bloom</span>?</h2>
          <p className="text-on-surface-variant text-xl mb-12 max-w-2xl mx-auto">Join thousands of families who have found peace through our sensory-first navigator.</p>
          <Link href="/signup">
            <button className="bg-primary-accent text-on-primary px-14 py-6 rounded-full font-headline font-extrabold text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary-accent/20">
              Create Free Account
            </button>
          </Link>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .organic-shape {
          border-radius: 63% 37% 54% 46% / 45% 48% 52% 55%;
        }
        .community-shape {
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 70%;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .bloom-card {
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bloom-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
