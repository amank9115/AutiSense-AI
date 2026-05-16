"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CameraScreeningPage() {
  const router = useRouter();

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-primary-container flex items-center justify-center mx-auto shadow-xl">
            <span className="material-symbols-outlined text-primary text-4xl">videocam</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl lg:text-5xl text-primary tracking-tighter">
            Camera-Based Screening
          </h1>
          <p className="text-lg text-on-surface-variant leading-relaxed font-medium opacity-80 max-w-xl mx-auto">
            Our live camera screening uses AI to gently analyse your child&apos;s
            behavioural responses in real time. You will be guided step by step through
            five short modules.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => router.push("/screening")}
              className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-headline font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              Begin Live Screening
            </button>
            <Link href="/assessment">
              <button className="border-2 border-primary/20 text-primary px-10 py-4 rounded-2xl font-headline font-bold text-base hover:bg-primary-container/40 transition-all">
                Learn More First
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
