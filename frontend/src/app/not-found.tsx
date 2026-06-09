import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import Link from "next/link";

export const dynamic = "force-static";

export default function NotFound() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <div className="max-w-xl mx-auto space-y-8">
          <h1 className="font-headline font-extrabold text-8xl text-primary tracking-tighter opacity-20">
            404
          </h1>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
            Page Not Found
          </h2>
          <p className="text-lg text-on-surface-variant leading-relaxed font-medium opacity-70">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/">
              <button className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-headline font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20">
                Go Home
              </button>
            </Link>
            <Link href="/login">
              <button className="border-2 border-primary/20 text-primary px-10 py-4 rounded-2xl font-headline font-bold text-base hover:bg-primary-container/40 transition-all">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
