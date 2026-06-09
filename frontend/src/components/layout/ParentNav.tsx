"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { icon: "dashboard",    label: "Dashboard",   href: "/dashboard/parent" },
  { icon: "child_care",   label: "My Children", href: "/dashboard/parent/children" },
  { icon: "calendar_month", label: "Appointments", href: "/dashboard/parent/appointments" },
  { icon: "history",      label: "History",     href: "/dashboard/parent/history" },
];

export function ParentNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/dashboard/parent" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Desktop top nav */}
      <header className="hidden md:block sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-md">
              M
            </div>
            <span className="font-headline font-bold text-primary text-base tracking-tight">MannSaathi</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1" aria-label="Parent dashboard navigation">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? "bg-primary-container text-on-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push("/dashboard/parent/profile")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline-variant/20 bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <span className="hidden lg:block max-w-[120px] truncate">{user?.name}</span>
            </button>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-error/20 bg-error/5 text-error text-xs font-bold hover:bg-error/10 transition-all"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden lg:block uppercase tracking-wider">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 flex items-center justify-around px-2 py-2 safe-area-pb"
        aria-label="Parent dashboard navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-primary" : "text-on-surface-muted"
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
