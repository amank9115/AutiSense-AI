"use client";
import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";

export default function PrivacyPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-6 pt-32 pb-20 w-full">
        <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-on-surface-variant text-sm mb-10 opacity-60">Last updated: January 2025</p>
        <div className="space-y-8 text-on-surface-variant leading-relaxed">
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Data We Collect</h2>
            <p>We collect only the information necessary to provide our autism screening service, including account details, screening session data, and usage analytics. Video data captured during screening sessions is processed in real time and is not stored permanently on our servers.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">How We Use Your Data</h2>
            <p>Your data is used solely to generate screening reports, improve our AI models in an anonymised form, and provide support. We never sell personal data to third parties.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@mannsaathi.ai to make a request.</p>
          </section>
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">Contact</h2>
            <p>For any privacy concerns, reach us at <a href="mailto:privacy@mannsaathi.ai" className="text-primary font-bold hover:underline">privacy@mannsaathi.ai</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
