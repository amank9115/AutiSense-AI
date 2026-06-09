import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Minimal auth header */}
      <header className="shrink-0 px-6 py-4 border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-headline font-bold text-primary text-base tracking-tight">MannSaathi</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-on-surface-muted hover:text-on-surface transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to home
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Minimal auth footer */}
      <footer className="shrink-0 px-6 py-4 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Accessibility", href: "/accessibility" },
            { label: "Support", href: "/support" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-on-surface-muted hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
