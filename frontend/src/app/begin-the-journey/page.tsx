"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const screeningSteps = [
  {
    icon: "videocam",
    title: "1. Capture Behavior",
    description: "Record a short video of your child's natural interactions, or use our live camera feature during an activity.",
    color: "bg-primary-container",
    textColor: "text-on-primary-container",
  },
  {
    icon: "psychology",
    title: "2. AI Analysis",
    description: "Our AI model analyzes facial expressions, eye contact patterns, and behavioral cues using evidence-based indicators.",
    color: "bg-secondary-container",
    textColor: "text-on-secondary-container",
  },
  {
    icon: "edit_note",
    title: "3. Questionnaire",
    description: "Answer simple, intuitive questions about daily behaviors. No medical jargon required.",
    color: "bg-tertiary-container",
    textColor: "text-on-tertiary-container",
  },
  {
    icon: "analytics",
    title: "4. Pattern Recognition",
    description: "The system identifies patterns related to attention, emotion recognition, and social engagement.",
    color: "bg-primary-container",
    textColor: "text-on-primary-container",
  },
  {
    icon: "summarize",
    title: "5. Generate Report",
    description: "Receive a comprehensive screening report with visual charts and clear indicators.",
    color: "bg-secondary-container",
    textColor: "text-on-secondary-container",
  },
  {
    icon: "group",
    title: "6. Share with Professionals",
    description: "Easily share your report with doctors, therapists, or specialists for follow-up care.",
    color: "bg-tertiary-container",
    textColor: "text-on-tertiary-container",
  },
];

const BeginTheJourneyPage = () => {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Require logged-in user (no guest mode)
  useEffect(() => {
    if (!user || isGuest) {
      router.push("/login");
    }
  }, [user, isGuest, router]);

  if (!user || isGuest) {
    return null;
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-fixed rounded-full text-label-md font-medium"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
                A Soft Start to Support
              </motion.div>
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.1]">
                Begin the Journey <br />
                <span className="text-primary">with Peace of Mind.</span>
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed max-w-2xl font-body">
                Welcome to a sanctuary designed for your family. Our &apos;Gentle Flow&apos; screening process is crafted to be low-aroused, supportive, and entirely at your own pace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-dim transition-all active:scale-95 shadow-sm"
                >
                  How it Works
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, rotate: 3 }}
                animate={{ opacity: 1, rotate: 3 }}
                transition={{ delay: 0.3 }}
                className="w-full aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-sm"
              >
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBp5q2EaDn3rBiX5A65T9cIVimufSiZih-rKy0bbfb_Y7YLMiGL_F5d1Z_VYFk5Rd2Z9VMSYUokkeD98VyCDG_pEEoMAKkMpqKIPJwHy_IAe34vGV8i81pFWQwVRuubHyu1zaHPt0bHZQycP33DTmQTx9zxpYpu_7XyO78okh8oSsakSbWErtPaBlX7fyxEmI9O-7fgJpzmqYHasUOy4zx3UJe_fcgjs6Xi6emjXLfp-6O2QCUSVVqsuThOrSGjJZ-dJ_V82xt1O1A"
                  alt="A tranquil digital illustration of a parent and a young child sitting together in a cozy, sun-drenched living room"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-6 -left-6 bg-tertiary-container p-6 rounded-lg shadow-xl -rotate-6 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-tertiary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  <div>
                    <p className="text-on-tertiary-container font-bold text-lg leading-tight">100% Sensory Safe</p>
                    <p className="text-on-tertiary-container/80 text-sm">Designed for neurodiversity</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Step-by-Step Flow */}
          <section className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-headline text-3xl font-bold text-on-surface">MannSaathi Experience</h2>
              <p className="text-on-surface-variant max-w-xl mx-auto">We&apos;ve removed the stress from screening. Your journey follows three simple, supportive phases.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-surface-container-low p-10 rounded-lg space-y-6 group hover:bg-surface-container transition-colors"
              >
                <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>energy_savings_leaf</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface">1. Mindful Setup</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">Create a profile in a quiet environment. We help you choose the best time and lighting for your child&apos;s comfort.</p>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-gradient-to-r from-secondary to-secondary-fixed-dim rounded-full" />
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-surface-container-low p-10 rounded-lg space-y-6 group hover:bg-surface-container transition-colors"
              >
                <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface">2. Observation</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">Answer intuitive, image-based questions about your child&apos;s daily interactions. No jargon, just clarity.</p>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-primary to-primary-container rounded-full" />
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-surface-container-low p-10 rounded-lg space-y-6 group hover:bg-surface-container transition-colors"
              >
                <div className="w-16 h-16 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface">3. Gentle Insights</h3>
                <p className="text-on-surface-variant leading-relaxed font-body">Receive a compassionate roadmap and actionable resources tailored to your family&apos;s unique profile.</p>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-tertiary to-tertiary-fixed rounded-full" />
                </div>
              </motion.div>
            </div>
          </section>

          {/* Testimonial */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 p-12 bg-secondary/5 rounded-xl border-l-8 border-secondary flex flex-col md:flex-row items-center gap-12"
          >
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-secondary-container overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP2owu_CKz_vQ9h9u6OFJ5GRAGwQ8w1XgAGVMuYiij2q55i6IfmlO28b-RztDrxfsGz_XZcAk5vcCWnB_KfYWOG7JGOF30UH-KXeCvK38K3LB_lsRDmNLhTgqYgl0_YISxZXXElFraCoWbbBLvBTTEP7cZC3KoUcc-Hgz5JlMIEfgqZ0SSxq_xRAloEKNa2lqsc7hBDVPD851XS__wyB0QfxzMLZqMVd00hKM8rdlr35OuGfcNMqD0HkpdTQ3MZ_TENJNtXLsd58M"
                  alt="Sarah Jenkins portrait"
                />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xl italic text-on-surface font-body leading-relaxed">
                &quot;As a parent of an autistic child, most forms feel like an interrogation. MannSaathi felt like a conversation with a friend who truly understands our world.&quot;
              </p>
              <div>
                <p className="font-bold text-secondary">Sarah Jenkins</p>
                <p className="text-sm text-on-surface-variant">Early Intervention Specialist &amp; Parent</p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />

      {/* How It Works Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative bg-surface rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-surface z-10 p-8 pb-6 border-b border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline text-3xl font-bold text-primary">How MannSaathi Works</h2>
                    <p className="text-on-surface-variant mt-2">A gentle, AI-powered screening process in 6 simple steps</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">close</span>
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="p-8 space-y-6">
                {screeningSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6 items-start"
                  >
                    <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-3xl ${step.textColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="font-headline text-xl font-bold text-on-surface mb-2">{step.title}</h3>
                      <p className="text-on-surface-variant leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="p-8 pt-0">
                <button
                  onClick={() => {
                    if (user && !isGuest) {
                      router.push("/screening");
                      setShowModal(false);
                    } else {
                      router.push("/login");
                    }
                  }}
                  className="w-full bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-primary-dim transition-all active:scale-95 shadow-sm"
                >
                  Start My Screening
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeginTheJourneyPage;
