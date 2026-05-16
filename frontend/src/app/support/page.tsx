"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar, Footer } from "@/components/layout/Navigation";

const SupportPage = () => {
  return (
    <div className="bg-background min-h-screen text-on-surface font-body antialiased flex flex-col selection:bg-primary-container">
      <Navbar />

      <main className="pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <header className="mb-16">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-headline font-extrabold text-5xl md:text-6xl text-primary tracking-tight mb-6"
            >
              Explore Support
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-on-surface-variant leading-relaxed font-light"
            >
              A peaceful corner for caregivers and children. Find sensory resources, urgent guidance, and tools designed for your comfort.
            </motion.p>
          </div>
        </header>

        {/* Bento Grid: Main Resources */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
          {/* Sensory-Friendly Library */}
          <section className="md:col-span-8 bg-surface-container-low rounded-lg p-10 flex flex-col justify-between min-h-[400px] overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-3 bg-secondary-container rounded-full text-on-secondary-container">
                  <span className="material-symbols-outlined">library_books</span>
                </span>
                <h2 className="font-headline font-bold text-2xl text-on-surface">Sensory-Friendly Library</h2>
              </div>
              <p className="text-on-surface-variant text-lg max-w-md mb-8">Curated videos, audio soundscapes, and visual guides tailored for low-arousal learning and regulation.</p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-primary text-on-primary px-8 py-3 rounded-xl font-medium transition-transform active:scale-95 flex items-center gap-2">
                  Browse Collection
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-full hidden lg:block opacity-80 group-hover:scale-105 transition-transform duration-700">
              <img
                className="w-full h-full object-contain object-bottom"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNxN30eoktIixLq8gX4bf6VToReVg_qIhd-K8oqHD5CZD-JOfi3DLgjjN30-CxrmLGKVF10u_ODmFIhvqZlw9xLrJPftPbn2LR8wpKbozfuslHMXMPf1xoaXVTTymdLzK4evxBAyaq5aFkz0NTCUUSWQFTUpzU5Z5HXLljt35t3OD2xjy9MgQm7JFJdHmz4dJDocXhqHphTNWhccd0gqSkNAwnq3rH-YcTHZn05W7GkCF90Bg_IZO8heUhKTl-OZd_uq_gXzT2ICE"
                alt="Sensory-Friendly Library"
              />
            </div>
          </section>

          {/* Quick Navigation Tools */}
          <aside className="md:col-span-4 space-y-6">
            <div className="bg-tertiary-container/30 rounded-lg p-8 flex flex-col h-full border border-tertiary-container/20">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-4">Resource Tools</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl hover:bg-surface-bright transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-tertiary">filter_list</span>
                  <span className="font-medium">Filter by Need</span>
                  <span className="material-symbols-outlined ml-auto text-outline group-hover:text-tertiary transition-colors">chevron_right</span>
                </li>
                <li className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl hover:bg-surface-bright transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-tertiary">map</span>
                  <span className="font-medium">Local Services</span>
                  <span className="material-symbols-outlined ml-auto text-outline group-hover:text-tertiary transition-colors">chevron_right</span>
                </li>
                <li className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl hover:bg-surface-bright transition-colors cursor-pointer group">
                  <span className="material-symbols-outlined text-tertiary">download</span>
                  <span className="font-medium">Printable Aids</span>
                  <span className="material-symbols-outlined ml-auto text-outline group-hover:text-tertiary transition-colors">chevron_right</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Care-First Emergency Contacts */}
        <section className="bg-error-container/10 rounded-lg p-8 md:p-12 mb-16 border border-error-container/20">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-error text-3xl">emergency</span>
                <h2 className="font-headline font-bold text-3xl text-on-surface">Immediate Assistance</h2>
              </div>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl">
                If you are in a crisis or need urgent sensory intervention advice, these vetted contacts are available 24/7. We approach emergency support with gentle, non-judgmental care.
              </p>
            </div>
            <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-2 shadow-sm border border-outline-variant/10">
                <span className="text-sm font-label text-on-surface-variant uppercase tracking-wider">Sensory Crisis Line</span>
                <span className="text-2xl font-bold text-primary">1-800-CALM-NOW</span>
                <button className="mt-2 text-primary font-bold flex items-center gap-2 hover:underline">
                  Call Now <span className="material-symbols-outlined">call</span>
                </button>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col gap-2 shadow-sm border border-outline-variant/10">
                <span className="text-sm font-label text-on-surface-variant uppercase tracking-wider">Text Support</span>
                <span className="text-2xl font-bold text-primary">TEXT &quot;GENTLE&quot;</span>
                <button className="mt-2 text-primary font-bold flex items-center gap-2 hover:underline">
                  Open SMS <span className="material-symbols-outlined">chat</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Topic Categories */}
        <section className="mb-16">
          <h2 className="font-headline font-bold text-3xl text-on-surface mb-10">Common Support Areas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
            >
              <div className="h-64 rounded-lg bg-secondary-container/20 overflow-hidden mb-6 relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmPloZYtEjdSnb7937LLm0sG1xXtQKhJmepDUa995GNBoBvVxmO72S8H_XvW22YY1hMpPqUg1SqVAnd5fgNl8XqRTXKyYSa8-cokApgHBMQdzGI2IBHxqtK4clkp3sT0Gcpr737MvL2m03UIehjp95VQI2F-rZeJFlQqkII2sgHynpkbF1TbE6iChBt-6s3WDtAo2c_F06hUAFzq8UEvGA7W_Tkwz1oBpy5yP5jCQt67VNib5ZwtyBJ2BbgRO7VYniPbn7Mrsyk_o"
                  alt="Managing Meltdowns"
                />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2 group-hover:text-primary transition-colors">Managing Meltdowns</h3>
              <p className="text-on-surface-variant leading-relaxed">Step-by-step low-arousal techniques for de-escalation and recovery.</p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group cursor-pointer"
            >
              <div className="h-64 rounded-lg bg-tertiary-container/20 overflow-hidden mb-6 relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcuNy0jQ8L-2xQLJGStZ6cTFLTP99Wc95v9vH6329rdsHERbQIwXs-ohvzsM00Qi765kOUbzYXFz3aorlEPmmNuLEhcZHIEq9PRnqwnYA89czIZxivipYLzugs_mcxWWDhU5W9Oq-yL9t7U8Wl9U98taYxbyC0-jZrGueBJeL9o0rO_epnMa50kxfVIff7iVC6IVMDlV3PGYcsrgOlxzsAa_qkVFnE_CkM6RMlwtJneTAo0JzvbFWiYuAbAlWfYPOYEOjKOgQ7l4Q"
                  alt="School Advocacy"
                />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2 group-hover:text-primary transition-colors">School Advocacy</h3>
              <p className="text-on-surface-variant leading-relaxed">Templates and scripts for communicating your child&apos;s sensory needs to teachers.</p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group cursor-pointer"
            >
              <div className="h-64 rounded-lg bg-primary-container/20 overflow-hidden mb-6 relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGtqLCs0GO2GAvcb0qib-QSQmcyDQ0c2CMdaQbv0nszFYZ8489eIF62hnzmKCmiQzXwiL2rz4DCWuTnAK95SdVcxUk9Des8Q214BQ9lyk1dh50UYDhz_7_LvRHTJ01wccSNAv2cslptzPOTnaxFhBLCKUbs7Qg3QZ6L7dCbab1TS9_tn95_tdCAaLD5OlI0hu2BIWSdq3t9TjeIkcvva1GqCHvwJuBYUf6pfsMj_H0vBj4295UNRHDYulU1V2EtyFWF_6lwbhcwPY"
                  alt="Caregiver Respite"
                />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2 group-hover:text-primary transition-colors">Caregiver Respite</h3>
              <p className="text-on-surface-variant leading-relaxed">Micro-self-care practices that fit into your busy, demanding schedule.</p>
            </motion.div>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="max-w-4xl mx-auto bg-surface-container-highest rounded-full p-2 flex items-center shadow-lg mb-24">
          <div className="flex-1 px-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-outline">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-lg font-body placeholder:text-outline-variant"
              placeholder="Search for a specific resource or topic..."
              type="text"
            />
          </div>
          <button className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold transition-transform active:scale-95 shadow-md">
            Search
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SupportPage;
