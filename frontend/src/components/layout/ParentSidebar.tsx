"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store";
import GlobalSearch from "@/components/search/GlobalSearch";

const NAV_ITEMS = [
  { icon: "dashboard",      label: "Overview",     href: "/dashboard/parent" },
  { icon: "child_care",     label: "My Children",  href: "/dashboard/parent/children" },
  { icon: "calendar_month", label: "Appointments", href: "/dashboard/parent/appointments" },
  { icon: "history",        label: "History",      href: "/dashboard/parent/history" },
];

const MOBILE_ITEMS = [
  ...NAV_ITEMS,
  { icon: "account_circle", label: "Profile", href: "/dashboard/parent/profile" },
];

export function ParentSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  const isActive = (href: string) =>
    href === "/dashboard/parent" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-surface-container-low border-r border-outline-variant/10 transition-all duration-300 ease-in-out shrink-0 z-40 ${
          sidebarCollapsed ? "w-(--space-sidebar-collapsed)" : "w-(--space-sidebar)"
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-5 py-8 ${sidebarCollapsed ? "justify-center px-0" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-base shrink-0 shadow-md">
            M
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="font-headline font-bold text-primary text-base tracking-tight leading-none">MannSaathi</p>
              <p className="text-[9px] font-bold text-primary/50 uppercase tracking-[0.3em]">Parent Portal</p>
            </div>
          )}
        </div>

        {/* Search */}
        <div className={`px-3 mb-4 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
          {sidebarCollapsed ? (
            <button
              onClick={toggleSidebar}
              title="Search (expand sidebar)"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-on-surface-muted hover:text-on-surface hover:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          ) : (
            <GlobalSearch />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3.5 rounded-2xl transition-all duration-200 ${
                  sidebarCollapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5"
                } ${
                  active
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/15 font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-xl shrink-0">{item.icon}</span>
                {!sidebarCollapsed && (
                  <span className="text-xs font-extrabold uppercase tracking-widest whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div className="mt-auto border-t border-outline-variant/10 px-3 py-4 space-y-2">
          {/* User profile button */}
          <button
            onClick={() => router.push("/dashboard/parent/profile")}
            title={sidebarCollapsed ? user?.name ?? "Profile" : undefined}
            className={`w-full flex items-center gap-3 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all ${
              sidebarCollapsed ? "justify-center p-2.5" : "p-3"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-md shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden text-left">
                <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                <p className="text-[9px] font-bold text-on-surface-muted uppercase tracking-widest">
                  Parent / Caregiver
                </p>
              </div>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={() => { logout(); router.push("/"); }}
            title={sidebarCollapsed ? "Sign Out" : undefined}
            className={`w-full flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 text-error text-xs font-bold hover:bg-error/10 transition-all ${
              sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5"
            }`}
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            {!sidebarCollapsed && <span className="uppercase tracking-widest">Sign Out</span>}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center gap-2 rounded-xl text-on-surface-muted text-xs hover:text-on-surface hover:bg-surface-container transition-all ${
              sidebarCollapsed ? "justify-center p-2.5" : "px-4 py-2.5"
            }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-sm">
              {sidebarCollapsed ? "chevron_right" : "chevron_left"}
            </span>
            {!sidebarCollapsed && <span className="uppercase tracking-widest">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Parent dashboard navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-low border-t border-outline-variant/10 flex items-center justify-around px-2 py-2 safe-area-pb">
        {MOBILE_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              aria-label={item.label}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${
                active ? "text-primary" : "text-on-surface-muted hover:text-on-surface"
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
