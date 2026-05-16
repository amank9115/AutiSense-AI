"use client";
import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";

export default function TermsPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-6 pt-32 pb-20 w-full">
        <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-4">Terms of Service</h1>
        <p className="text-on-surface-variant text-sm mb-10 opacity-60">Last updated: January 2025</p>
        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Acceptance of Terms</h2>
            <p>By using MannSaathi, you agree to these terms. Our platform provides screening support tools and is not a substitute for professional medical diagnosis.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Use of the Platform</h2>
            <p>You agree to use MannSaathi only for its intended purpose of child developmental screening. You must not attempt to reverse-engineer our AI models, share account credentials, or misuse the platform in any way that could harm other users.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Medical Disclaimer</h2>
            <p>MannSaathi screening results are informational only and do not constitute a clinical diagnosis. Always consult a qualified healthcare professional for a formal assessment.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Contact</h2>
            <p>For terms-related queries, contact <a href="mailto:legal@mannsaathi.ai" className="text-primary font-bold hover:underline">legal@mannsaathi.ai</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
