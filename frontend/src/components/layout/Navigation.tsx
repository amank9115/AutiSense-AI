"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/store";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAppStore();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const getLinkClass = (href: string) => {
    const active = isActive(href);
    if (href === "/") {
      return active
        ? "text-primary-accent font-bold border-b-2 border-primary-accent cursor-pointer active:scale-95 transition-all duration-300"
        : "text-on-surface-variant font-medium hover:text-primary-accent transition-colors duration-300 cursor-pointer active:scale-95";
    }
    return active
      ? "text-primary-accent font-bold border-b-2 border-primary-accent transition-all duration-300"
      : "text-on-surface-variant font-medium hover:text-primary-accent transition-colors duration-300 cursor-pointer active:scale-95";
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-12 py-4 max-w-full mx-auto border-b border-outline-variant/20">
      <Link href="/" className="font-headline font-bold text-primary-accent text-xl tracking-tight cursor-pointer active:scale-95 transition-transform">
        MannSaathi
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex gap-6">
          <Link href="/" className={getLinkClass("/")}>
            Bloom
          </Link>
          <Link href="/assessment" className={getLinkClass("/assessment")}>
            Assessment
          </Link>
          <Link href="/services" className={getLinkClass("/services")}>
            Services
          </Link>
          <Link href="/community" className={getLinkClass("/community")}>
            Community
          </Link>
          <Link href="/support" className={getLinkClass("/support")}>
            Support
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href={`/dashboard/${user.role === 'doctor' ? 'doctor' : 'parent'}`}>
                <button className="text-on-surface-variant font-bold hover:text-primary-accent transition-colors">
                  Dashboard
                </button>
              </Link>
              <Link href="/profile">
                <button className="text-on-surface-variant font-bold hover:text-primary-accent transition-colors">
                  Profile
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-error/10 text-error px-6 py-2 rounded-full font-headline font-bold text-sm hover:bg-error/20 active:scale-95 transition-all shadow-sm"
              >
                Logout
              </button>
            </>
          ) : (
            pathname !== "/login" && pathname !== "/signup" && (
              <Link href="/login">
                <button className="bg-primary-accent text-on-primary px-8 py-2.5 rounded-full font-headline font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm">
                  Log In
                </button>
              </Link>
            )
          )}
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden ml-4 p-2">
          <span className="material-symbols-outlined text-primary-accent">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface/95 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-6 space-y-4 shadow-lg">
          <Link href="/" className={`block font-bold text-lg border-b-2 py-2 ${isActive("/") ? "text-primary-accent border-primary-accent" : "text-on-surface-variant"}`} onClick={() => setIsOpen(false)}>
            Bloom
          </Link>
          <Link href="/assessment" className={`block font-medium text-lg border-b-2 py-2 ${isActive("/assessment") ? "text-primary-accent border-primary-accent" : "text-on-surface-variant hover:text-primary-accent"}`} onClick={() => setIsOpen(false)}>
            Assessment
          </Link>
          <Link href="/services" className={`block font-medium text-lg border-b-2 py-2 ${isActive("/services") ? "text-primary-accent border-primary-accent" : "text-on-surface-variant hover:text-primary-accent"}`} onClick={() => setIsOpen(false)}>
            Services
          </Link>
          <Link href="/community" className={`block font-medium text-lg border-b-2 py-2 ${isActive("/community") ? "text-primary-accent border-primary-accent" : "text-on-surface-variant hover:text-primary-accent"}`} onClick={() => setIsOpen(false)}>
            Community
          </Link>
          <Link href="/support" className={`block font-medium text-lg border-b-2 py-2 ${isActive("/support") ? "text-primary-accent border-primary-accent" : "text-on-surface-variant hover:text-primary-accent"}`} onClick={() => setIsOpen(false)}>
            Support
          </Link>
          
          <div className="pt-4 border-t border-outline-variant/20">
            {user ? (
              <div className="space-y-4">
                <Link href={`/dashboard/${user.role === 'doctor' ? 'doctor' : 'parent'}`} onClick={() => setIsOpen(false)}>
                  <button className="w-full bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-headline font-bold text-sm">
                    Dashboard
                  </button>
                </Link>
                <Link href="/profile" onClick={() => setIsOpen(false)}>
                  <button className="w-full bg-primary-container text-on-primary-container px-6 py-3 rounded-full font-headline font-bold text-sm">
                    Profile
                  </button>
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="w-full bg-error/10 text-error px-6 py-3 rounded-full font-headline font-bold text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              pathname !== "/login" && pathname !== "/signup" && (
                <Link href="/login" className="block" onClick={() => setIsOpen(false)}>
                  <button className="w-full bg-primary-accent text-on-primary px-6 py-3 rounded-full font-headline font-bold text-sm">
                    Log In
                  </button>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-16 bg-surface-container-low border-t border-outline-variant/30 px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col gap-3 items-center md:items-start">
          <span className="font-headline font-bold text-primary-accent text-xl">MannSaathi</span>
          <p className="font-body text-sm text-on-surface-variant/70">© 2024 MannSaathi. All rights reserved. Built for sensory comfort.</p>
        </div>
        <div className="flex gap-10">
          <Link href="/privacy" className="text-on-surface-variant font-medium hover:text-primary-accent transition-colors duration-300 text-sm">Privacy Policy</Link>
          <Link href="/terms" className="text-on-surface-variant font-medium hover:text-primary-accent transition-colors duration-300 text-sm">Terms of Service</Link>
          <Link href="/accessibility" className="text-on-surface-variant font-medium hover:text-primary-accent transition-colors duration-300 text-sm">Accessibility Support</Link>
        </div>
      </div>
    </footer>
  );
};
