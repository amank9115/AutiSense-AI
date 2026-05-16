"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/layout/Navigation";

const ServicesPage = () => {
  return (
    <div className="bg-background min-h-screen text-on-surface font-body antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />

      <main className="pt-24 pb-12 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative px-6 md:px-12 py-16 md:py-24 text-center">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary rounded-full blur-3xl opacity-10" />
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-headline text-5xl md:text-6xl font-extrabold text-primary tracking-tight mb-6"
            >
              Pathways to Peaceful Progress
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-body text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            >
              Designed for sensory comfort and professional precision, our services support neurodivergent individuals and their families through a low-arousal, tactile sanctuary.
            </motion.p>
          </div>
        </section>

        {/* Services Bento Grid */}
        <section className="px-6 md:px-12 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Clinical Assessments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 bg-surface-container-low rounded-xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center group transition-all duration-300"
            >
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                  <h2 className="font-headline font-bold text-2xl text-primary">Clinical Assessments</h2>
                </div>
                <p className="text-on-surface-variant leading-relaxed mb-6">
                  A comprehensive, multi-disciplinary approach to understanding unique neuro-types. We prioritize a calm environment to ensure accurate, stress-free observations for both children and adults.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Sensory Profile Analysis
                  </li>
                  <li className="flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    Diagnostic Clarity Reports
                  </li>
                </ul>
                <Link href="/assessment/camera">
                  <button className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
                    Explore Assessment Journey
                  </button>
                </Link>
              </div>
              <div className="w-full md:w-1/2 aspect-square rounded-lg overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuArelEYUXUTAmi9C60GxgPh2jEgLRHK1JamPEJ8H1quceOopigHw5lqZUgoq4ZOO40oltuP2VOhn-BxKXIjREd8P1N6pQdc4qcqzRVrP8l6e9fJeUwKlUt8TdJekGJ7WuvU7upheH98pTFqMlkIUoPLo7VbwFlqIJxcCdGiu3uJaiKgbwNTR-w5P4Ln3ULioq07bro_P3ogjWwwsSRNrGxut7A6p2ldWTDAqH23l5P1zvzlCRrQN-Yo3dy-RDcGPvF7E2RgoMYwAwU"
                  alt="Clinical Assessments"
                />
              </div>
            </motion.div>

            {/* Family Counseling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bg-secondary-container rounded-xl p-8 flex flex-col justify-between"
            >
              <div>
                <span className="material-symbols-outlined text-on-secondary-container text-4xl mb-4 block">family_restroom</span>
                <h2 className="font-headline text-2xl font-bold text-on-secondary-container mb-4">Family Counseling</h2>
                <p className="text-on-secondary-fixed-variant leading-relaxed">
                  Support systems for the whole family. We focus on communication strategies that respect sensory needs and emotional bandwidth.
                </p>
              </div>
              <div className="mt-8">
                <div className="w-full h-32 rounded-lg bg-surface/40 backdrop-blur-sm p-4 flex flex-col justify-center">
                  <p className="text-sm font-bold text-on-secondary-container">Next Available Session</p>
                  <p className="text-lg text-secondary">Tuesday, Oct 24th</p>
                </div>
                <button className="w-full mt-4 text-on-secondary-container font-bold underline text-left hover:text-primary transition-colors">
                  Book a consultation
                </button>
              </div>
            </motion.div>

            {/* Art Therapy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-5 bg-surface-container-high rounded-xl p-8 md:p-10"
            >
              <div className="aspect-video w-full rounded-lg overflow-hidden mb-6">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0UPgMr4Ur-sHJfMybhQEYjmur58-Wi4ixXqFcGr96w6YkyHc4RxFct2O3Rc-TFbAXYYOi813zwG7eX5F-cmngtjWSKAFMoxxOnuOCWnffEiqmvb-BrUfyr0uPndlTvJu6OrXh95jjspLR69eyXQbX6MMgkemMI2bRjlIptaKq9fPqSuHc0ILABQR23-_lrs8jXVnrGfolPtBIVRbFVGDhMed-EsdWKo-pNh7uCMCEOe39qcr2t1t3bo5AHf4h1NVnVwT7g1GXVwk"
                  alt="Art Therapy Workshops"
                />
              </div>
              <h2 className="font-headline text-2xl font-bold text-tertiary mb-3">Art Therapy Workshops</h2>
              <p className="text-on-surface-variant leading-relaxed mb-6">
                Non-verbal expression through tactile mediums. Explore clay, watercolors, and textiles in a low-stimulation studio setting.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-1 bg-surface-container-lowest text-on-surface-variant text-sm rounded-full">Saturdays</span>
                <span className="px-4 py-1 bg-surface-container-lowest text-on-surface-variant text-sm rounded-full">All Ages</span>
                <span className="px-4 py-1 bg-surface-container-lowest text-on-surface-variant text-sm rounded-full">Sensory-Friendly</span>
              </div>
            </motion.div>

            {/* Safety & Care */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-7 bg-white rounded-xl p-8 md:p-12 border-2 border-surface-container flex flex-col justify-center relative overflow-hidden"
            >
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary-container rounded-full blur-3xl opacity-20" />
              <div className="max-w-md relative z-10">
                <h2 className="font-headline text-3xl font-extrabold text-primary mb-4">Our Commitment to Care</h2>
                <p className="text-on-surface-variant text-lg mb-8">
                  Every session is held in a &quot;Tactile Sanctuary&quot;—where lighting is adjustable, noise is minimized, and textures are curated for maximum comfort.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-primary">100%</span>
                    <span className="text-sm text-on-surface-variant">Low-Arousal Spaces</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-primary">Trauma</span>
                    <span className="text-sm text-on-surface-variant">Informed Approach</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How We Work */}
        <section className="px-6 md:px-12 py-16 bg-surface-container-low">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline text-3xl font-bold text-center text-primary mb-12">How We Work</h2>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-surface rounded-lg p-6 flex gap-6 items-start"
              >
                <div className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-primary text-lg mb-1">Introductory Intake</h3>
                  <p className="text-on-surface-variant">A brief, low-pressure conversation to identify your needs and sensory preferences before you ever step foot in our center.</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-surface rounded-lg p-6 flex gap-6 items-start"
              >
                <div className="bg-secondary text-on-secondary w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-secondary text-lg mb-1">Tailored Session Design</h3>
                  <p className="text-on-surface-variant">We adjust the physical environment—lighting, weighted blankets, or quiet zones—specifically for your visit.</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-surface rounded-lg p-6 flex gap-6 items-start"
              >
                <div className="bg-tertiary text-on-tertiary w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-tertiary text-lg mb-1">Ongoing Collaboration</h3>
                  <p className="text-on-surface-variant">Regular check-ins to ensure our strategies evolve with your family&apos;s needs and energy levels.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;
