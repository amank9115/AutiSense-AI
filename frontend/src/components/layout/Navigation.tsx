"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/",           label: "Home"       },
    { href: "/assessment", label: "Assessment"  },
    { href: "/services",   label: "Services"    },
    { href: "/community",  label: "Community"   },
    { href: "/support",    label: "Support"     },
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
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ease-out
        bg-surface/[0.97] backdrop-blur-xl border-b border-outline-variant/25
        ${scrolled ? "shadow-[0_2px_20px_rgba(49,51,47,0.08)]" : "shadow-none"}`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 h-[70px] flex items-center justify-between gap-4">

        {/* ── Brand ── */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
          aria-label="MannSaathi home"
        >
          {/* mix-blend-multiply erases the white PNG background on the light navbar */}
          <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden
            transition-all duration-300
            group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20">
            <Image
              src="/logo.png"
              alt="MannSaathi logo"
              fill
              sizes="56px"
              className="object-contain mix-blend-multiply"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-headline font-bold text-[15.5px] tracking-tight text-on-surface">
              MannSaathi
            </span>
            <span className="font-body text-[9px] font-semibold tracking-[0.18em] uppercase text-primary/70 mt-[3px]">
              Companion of the Mind
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          className="hidden md:flex items-center gap-0.5 flex-1 justify-center"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200
                ${isActive(link.href)
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                }`}
            >
              {link.label}
              {/* Sliding underline pill */}
              <span
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-[3px] rounded-full bg-primary
                  transition-all duration-300 ease-out
                  ${isActive(link.href) ? "w-4 opacity-100" : "w-0 opacity-0"}`}
              />
            </Link>
          ))}
        </nav>

        {/* ── Desktop CTAs ── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link href={`/dashboard/${user.role === "doctor" ? "doctor" : "parent"}`}>
                <button className="text-[13px] font-semibold px-4 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all">
                  Dashboard
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-lg text-error/70 hover:text-error hover:bg-error/8 transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>logout</span>
                Sign out
              </button>
            </>
          ) : (
            pathname !== "/login" && pathname !== "/signup" && (
              <>
                <Link href="/login">
                  <button className="text-[13px] font-semibold px-4 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all">
                    Sign in
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="px-5 py-2.5 rounded-xl text-[13px] font-bold
                    bg-primary text-on-primary
                    hover:bg-primary-dim
                    active:scale-[0.97]
                    shadow-sm shadow-primary/25
                    transition-all duration-200">
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
          className="md:hidden p-2.5 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span className="material-symbols-outlined text-xl">
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <div className="md:hidden border-t border-outline-variant/15 bg-surface/98 backdrop-blur-xl shadow-xl">
          <nav className="px-4 pt-3 pb-2 space-y-0.5" aria-label="Mobile navigation">
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

          <div className="px-4 pb-4 pt-2 border-t border-outline-variant/10 mt-1">
            {user ? (
              <div className="space-y-2">
                <Link
                  href={`/dashboard/${user.role === "doctor" ? "doctor" : "parent"}`}
                  onClick={() => setIsOpen(false)}
                >
                  <button className="w-full text-left bg-primary-container text-primary px-4 py-3 rounded-xl font-bold text-sm">
                    Go to Dashboard
                  </button>
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full text-left bg-error/8 text-error px-4 py-3 rounded-xl font-bold text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              pathname !== "/login" && pathname !== "/signup" && (
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                    <button className="w-full text-left border border-outline-variant/30 text-on-surface-variant px-4 py-3 rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link href="/signup" className="block" onClick={() => setIsOpen(false)}>
                    <button className="w-full text-left bg-primary text-on-primary px-4 py-3 rounded-xl font-bold text-sm shadow-md shadow-primary/15">
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
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden group-hover:scale-110 transition-transform">
                <Image src="/logo.png" alt="MannSaathi logo" fill sizes="48px" className="object-contain mix-blend-multiply" />
              </div>
              <div className="leading-tight">
                <span className="font-headline font-bold text-on-surface text-[15px] tracking-tight block">MannSaathi</span>
                <span className="font-body text-[9px] text-primary/70 font-semibold uppercase tracking-[0.18em] block mt-0.5">Companion of the Mind</span>
              </div>
            </Link>
            <p className="text-xs text-on-surface-muted leading-relaxed max-w-50">
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
