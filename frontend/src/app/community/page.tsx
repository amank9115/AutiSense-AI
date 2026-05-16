"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/layout/Navigation";

const CommunityPage = () => {
  return (
    <div className="bg-background min-h-screen text-on-surface font-body antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />

      <main className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-secondary/5 p-12 md:p-20 flex flex-col items-center text-center">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-secondary-container/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-tertiary-container/20 rounded-full blur-3xl" />
            <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-primary mb-6 tracking-tight max-w-3xl">
              A Safe Harbor for Your Family&apos;s Journey
            </h1>
            <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl leading-relaxed mb-10">
              Connect with a moderated community of parents and specialists dedicated to sensory-friendly growth and mutual support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="bg-primary text-on-primary px-10 py-4 rounded-xl font-semibold shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300">
                Join a Circle
              </button>
              <button className="bg-secondary-container text-on-secondary-container px-10 py-4 rounded-xl font-semibold hover:bg-secondary-fixed-dim transition-all duration-300">
                View Forums
              </button>
            </div>
          </div>
        </motion.section>

        {/* Bento Grid: Parent Circles & Quiet Forums */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20">
          {/* Parent Circles */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-7 bg-surface-container-low rounded-lg p-10 flex flex-col justify-between overflow-hidden relative group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-3 bg-secondary-container text-secondary rounded-full material-symbols-outlined">groups</span>
                <h2 className="font-headline text-2xl font-bold text-on-surface">Parent Circles</h2>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed mb-8 max-w-md">
                Intimate, curated groups organized by age milestones and sensory profiles. Find parents who truly understand your day-to-day.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-secondary font-medium">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Neuro-affirming Toddler Years
                </li>
                <li className="flex items-center gap-3 text-secondary font-medium">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Sensory Processing Support
                </li>
                <li className="flex items-center gap-3 text-secondary font-medium">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Homeschooling &amp; IEP Advocacy
                </li>
              </ul>
            </div>
            <div className="relative z-10 mt-auto">
              <button className="text-primary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                Explore all Circles <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-container/40 rounded-full opacity-60 group-hover:scale-110 transition-transform duration-700" />
          </motion.div>

          {/* Quiet Forums */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-5 bg-surface-container-highest rounded-lg p-10 flex flex-col overflow-hidden relative group"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-primary-container text-primary rounded-full material-symbols-outlined">forum</span>
              <h2 className="font-headline text-2xl font-bold text-on-surface">Quiet Forums</h2>
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Slow-paced, text-focused discussions with zero notifications or autoplay elements. Designed for peaceful engagement.
            </p>
            <div className="space-y-3">
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">Daily Small Wins</span>
                  <span className="text-sm text-on-surface-variant">12 new gentle thoughts</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-semibold text-primary">Sensory Toolkit</span>
                  <span className="text-sm text-on-surface-variant">4 active discussions</span>
                </div>
                <span className="material-symbols-outlined text-outline">chevron_right</span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Specialist Insights Section */}
        <section className="mb-20">
          <div className="bg-surface-container rounded-lg p-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-4">Specialist Insights</h2>
                <p className="text-on-surface-variant text-lg">Verified occupational therapists, speech pathologists, and psychologists share gentle guidance in a non-clinical, supportive format.</p>
              </div>
              <button className="bg-white text-secondary border border-secondary/20 px-6 py-3 rounded-full font-semibold hover:bg-secondary-container transition-all">
                Meet Our Specialists
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Specialist Card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-surface-container-lowest rounded-lg overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpceMteWGv9hwmoheAbY2m3k4nVR5QPc5t83HCZ1-pAUu0cJZ-wQfNv1IATNjhnBBuDXmAuNKCO6ibMk9zQ9nxxqy5xnLuKHtfdN-YBsmz3uOyAxHDamglEKURtxtAaLQBLVDJEhgAHdGZmjnUgDFwEDXSTgIIOeYtM-y8p-dv0TagL4OHM522RqJF46rywg38TQliIODKR3vQgi9Ci_uC1AlkNsKa0H0bGtPvdQvlmCuZ9GG-IZB4uriYO4qAAkJkHtsJynAtXII"
                    alt="Dr. Elena Brooks"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold tracking-widest text-secondary uppercase mb-2 block">Occupational Therapy</span>
                  <h3 className="font-headline text-xl font-bold mb-2">Morning Routines without the Meltdown</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Simple tactile cues to help children transition from sleep to start of the day.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-tertiary-container rounded-full flex items-center justify-center text-xs font-bold text-on-tertiary-container">EB</div>
                    <span className="text-xs font-medium text-on-surface">Dr. Elena Brooks</span>
                  </div>
                </div>
              </motion.div>

              {/* Specialist Card 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-surface-container-lowest rounded-lg overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfHU6SyHDy2etNeZEzPUzn9m00jkevvj9azsMBfXin3BCdIbsYa8Y7ZpAaXXRiociGMTBl_35a8d0OrwAzoEqFgAsdSCCluIWb25VyfOfnpQ-JcwInmvTJYV8Y1QomlPvolOQ3vEyq-zD0rGbMcBW_z6e6AL_S3KddVzgbLzmBm-47-Z_fBQxvCI4Nrf2CVFwi1rfQAbRylQ78zAVawGlo9-QqA81IWH_Q7jopj4LuoRoh5yHOwPCR3KVgQ4jUTsfBfho6ghFnVrA"
                    alt="Marcus Sterling"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold tracking-widest text-tertiary uppercase mb-2 block">Psychology</span>
                  <h3 className="font-headline text-xl font-bold mb-2">The Power of Co-Regulation</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Understanding how your calm becomes your child&apos;s calm during sensory overload.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center text-xs font-bold text-on-primary-container">MS</div>
                    <span className="text-xs font-medium text-on-surface">Marcus Sterling, M.A.</span>
                  </div>
                </div>
              </motion.div>

              {/* Specialist Card 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-surface-container-lowest rounded-lg overflow-hidden group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrMj-XhaCODpPzaGRHpyoy2FmHl4S9rDpsdZMg3paCND4dr3RCLEo4ds1Z1M_l5-1mrnOtW704_BP8ddXAOVDWcmkPM_KLL5zdPp11_ACCMJb9-l1eHJWJ-nGhQS_-jO1hZaC7tcseQHTsYot9WhB4kzJtDeJZaXqiFXVhaVCzUOMJY1Q2NEPbS96IsYzArslgA7PO-8TXFfm2Q-HDHsM9nNlKR5nuT6NApO-8Cx8f18sk92TBYF1GXJhKZgII6S5yyQMEJF5MwDQ"
                    alt="Amina Lowery"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs font-bold tracking-widest text-secondary uppercase mb-2 block">Speech &amp; Language</span>
                  <h3 className="font-headline text-xl font-bold mb-2">Non-Verbal Connection Points</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">Building shared joy through play-based interactions that don&apos;t require words.</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary-container rounded-full flex items-center justify-center text-xs font-bold text-on-secondary-container">AL</div>
                    <span className="text-xs font-medium text-on-surface">Amina Lowery, SLP</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Moderation Pledge */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center py-16 px-8 border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-5xl text-secondary mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <h2 className="font-headline text-2xl font-bold text-on-surface mb-4">Our Commitment to Safety</h2>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            MannSaathi is a strictly moderated space. Every specialist is background-verified, and our community guidelines are enforced by human moderators trained in neurodivergent-friendly communication. We prioritize kindness over conflict, always.
          </p>
          <div className="flex justify-center gap-8 text-sm font-semibold text-secondary">
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">lock</span> Encrypted &amp; Private</span>
            <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">person_check</span> Human Moderated</span>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
};

export default CommunityPage;
