"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();
  const [inHero, setInHero] = useState(pathname === "/");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      // Past hero region (or any scroll on non-landing routes) → opaque
      setInHero(y < 80);
      setScrolled(y > 16 || vh < y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Re-evaluate inHero when route changes (only landing has a transparent hero region)
  useEffect(() => {
    setInHero(window.scrollY < 80);
  }, [pathname]);

  const isLanding = pathname === "/";
  // Show transparent + light text when over the dark hero on landing.
  const overHero = isLanding && inHero && !scrolled;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/assessment", label: "Assessment" },
    { href: "/services", label: "Services" },
    { href: "/community", label: "Community" },
    { href: "/support", label: "Support" },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6 lg:px-8">
      {/* Floating pill container */}
      <div
        className={`mx-auto max-w-6xl relative rounded-[1.25rem] border transition-all duration-500 ${
          overHero
            ? "border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_4px_30px_rgba(139,92,246,0.10)]"
            : scrolled
              ? "border-outline-variant/25 bg-surface/92 shadow-[0_8px_40px_rgba(23,104,118,0.11),inset_0_1px_0_rgba(255,255,255,0.8)]"
              : "border-outline-variant/15 bg-surface/80 shadow-[0_4px_20px_rgba(23,104,118,0.06),inset_0_1px_0_rgba(255,255,255,0.6)]"
        } backdrop-blur-2xl px-3 py-2`}
      >
        {/* Subtle inner colour wash */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/12 via-transparent to-secondary-container/8" />
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-accent/30 to-transparent" />
        </div>

        <div className="relative flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="MannSaathi home"
          >
            {/* Icon mark */}
            <div className="w-8 h-8 rounded-[0.6rem] bg-gradient-to-br from-primary to-primary-accent flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M10 3C10 3 6 5.5 6 9.2C6 11.5 7.5 13.4 9.2 14.2V17.5H10.8V14.2C12.5 13.4 14 11.5 14 9.2C14 5.5 10 3 10 3Z" fill="rgba(255,255,255,0.92)" />
                <path d="M8 9.5C8 9.5 7.2 7.8 8.2 6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            {/* Wordmark */}
            <div className="leading-none">
              <span className="font-headline font-bold text-primary text-[15px] tracking-tight block">
                MannSaathi
              </span>
              <span className="font-body text-[9px] font-medium text-on-surface-variant/50 uppercase tracking-[0.18em] block mt-0.5">
                AI Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links inside a pill tray ── */}
          <nav
            className="hidden md:flex items-center gap-0.5 bg-surface-container-low/70 border border-outline-variant/15 rounded-full px-2 py-1.5"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-cursor="pointer"
                className={`nav-underline px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-primary-container text-primary font-bold shadow-sm active"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <Link href={`/dashboard/${user.role === "doctor" ? "doctor" : "parent"}`}>
                  <button className="text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    Dashboard
                  </button>
                </Link>
                <div className="w-px h-4 bg-outline-variant/35" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-error/75 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>logout</span>
                  Sign out
                </button>
              </>
            ) : (
              pathname !== "/login" && pathname !== "/signup" && (
                <>
                  <Link href="/login">
                    <button className="text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors">
                      Sign in
                    </button>
                  </Link>
                  <div className="w-px h-4 bg-outline-variant/35" />
                  <Link href="/signup">
                    <button className="bg-primary text-on-primary px-5 py-2 rounded-full text-[13px] font-bold hover:bg-primary-dim active:scale-95 transition-all shadow-md shadow-primary/15">
                      Get Started
                    </button>
                  </Link>
                </>
              )
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-surface-container-high transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="material-symbols-outlined text-primary-accent text-xl">
              {isOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {isOpen && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 rounded-2xl border border-outline-variant/20 bg-surface/96 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <nav className="px-3 pt-3 pb-1 space-y-0.5" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-primary-container text-primary font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="px-3 pb-3 pt-2 border-t border-outline-variant/15 mt-1">
            {user ? (
              <div className="space-y-2">
                <Link
                  href={`/dashboard/${user.role === "doctor" ? "doctor" : "parent"}`}
                  onClick={() => setIsOpen(false)}
                >
                  <button className="w-full text-left bg-primary-container text-primary px-4 py-3 rounded-xl font-bold text-[14px]">
                    Go to Dashboard
                  </button>
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full text-left bg-error/8 text-error px-4 py-3 rounded-xl font-bold text-[14px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              pathname !== "/login" && pathname !== "/signup" && (
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                    <button className="w-full text-left border border-outline-variant/30 text-on-surface-variant px-4 py-3 rounded-xl font-semibold text-[14px] hover:bg-surface-container-high transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/signup" className="block" onClick={() => setIsOpen(false)}>
                    <button className="w-full text-left bg-primary text-on-primary px-4 py-3 rounded-xl font-bold text-[14px] shadow-md shadow-primary/15">
                      Get Started — it&apos;s free
                    </button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const Footer: React.FC = () => {
  const columns = [
    {
      heading: "Product",
      links: [
        { href: "/assessment", label: "Assessment" },
        { href: "/screening", label: "Live Screening" },
        { href: "/begin-the-journey", label: "Get Started" },
        { href: "/services", label: "Services" },
      ],
    },
    {
      heading: "Community",
      links: [
        { href: "/community", label: "Community Hub" },
        { href: "/professionals", label: "For Professionals" },
        { href: "/support", label: "Support" },
      ],
    },
    {
      heading: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/accessibility", label: "Accessibility" },
      ],
    },
  ];

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/15">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                M
              </div>
              <span className="font-headline font-bold text-primary text-base tracking-tight">MannSaathi</span>
            </Link>
            <p className="text-xs text-on-surface-muted leading-relaxed max-w-[200px]">
              AI-powered autism screening built for sensory comfort and neurodivergent accessibility.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
              <span className="material-symbols-outlined text-sm text-secondary">favorite</span>
              <span>Built for sensory comfort</span>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h5 className="text-label-caps text-on-surface mb-4">{col.heading}</h5>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-on-surface-muted hover:text-on-surface transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-on-surface-muted">© 2026 MannSaathi. All rights reserved.</p>
          <p className="text-xs text-on-surface-muted">
            Supporting neurodivergent families worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};
