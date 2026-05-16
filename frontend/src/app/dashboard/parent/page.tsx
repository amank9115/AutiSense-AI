"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card } from "@/components/ui/StitchUI";
import Image from "next/image";

const MilestoneCard = ({ title, progress, color, icon }: { title: string, progress: string, color: string, icon: string }) => (
  <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm hover:shadow-xl transition-all duration-500 group">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg transform group-hover:-rotate-6 transition-transform`}>
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <h4 className="font-headline font-extrabold text-xl text-on-surface mb-6 tracking-tight">{title}</h4>
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-40">
        <span>Progress</span>
        <span>{progress}</span>
      </div>
      <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full rounded-full ${color.replace('container', 'dim')}`} style={{ width: progress }}></div>
      </div>
    </div>
  </div>
);

const ResourceCard = ({ title, category, img }: { title: string, category: string, img: string }) => (
  <div className="group cursor-pointer">
    <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-6 bg-surface-container-low shadow-xl border-4 border-white relative">
      <Image src={img} alt={title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute top-6 left-6">
        <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-primary shadow-lg">{category}</span>
      </div>
    </div>
    <h4 className="font-headline font-bold text-2xl group-hover:text-primary transition-colors mb-2 tracking-tighter leading-tight">{title}</h4>
    <p className="text-sm text-on-surface-variant font-medium opacity-60">5 min read • Expert Guide</p>
  </div>
);

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      {/* Custom Header with User Profile */}
      <header className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative rounded-3xl border border-sky-100/70 bg-gradient-to-r from-white/85 via-sky-50/75 to-emerald-50/70 px-3 py-2.5 backdrop-blur-2xl shadow-[0_16px_44px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-lg">
                M
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">MannSaathi</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Parent Portal</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden items-center gap-1.5 md:flex">
              {[
                { icon: "dashboard", label: "Dashboard", href: "/dashboard/parent" },
                { icon: "child_care", label: "My Children", href: "/dashboard/parent/children" },
                { icon: "calendar_month", label: "Appointments", href: "/dashboard/parent/appointments" },
                { icon: "history", label: "History", href: "/dashboard/parent/history" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.href ? router.push(item.href) : null}
                  className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white/80 hover:text-sky-700"
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>

            {/* User Profile Button */}
            <button
              onClick={() => router.push("/dashboard/parent/profile")}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5 19C6.4 15.8 9 14.4 12 14.4C15 14.4 17.6 15.8 19 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {user.name}
                          </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[1440px] mx-auto w-full px-8 pt-8 pb-24 space-y-24">

        {/* Welcome Hero */}
        <section className="bg-surface-container-low rounded-[4rem] p-12 lg:p-20 relative overflow-hidden shadow-2xl border border-white/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-center lg:text-left">
              <span className="bg-secondary-container text-on-secondary-container px-5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm">Your Navigator Dashboard</span>
              <h2 className="font-headline font-extrabold text-5xl lg:text-7xl text-primary tracking-tighter leading-[0.9]">{getGreeting()}, <span className="text-secondary italic">{user.name?.split(' ')[0]}.</span></h2>
              <p className="text-xl text-on-surface-variant leading-relaxed font-medium opacity-80">
                You have one new report available for review from Dr. Smith.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                <Button
                variant="primary"
                onClick={() => router.push("/results")}
                className="px-10 py-5 rounded-2xl font-extrabold uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all text-xs"
              >
                  View Latest Report
                </Button>
                <Button
                variant="outline"
                onClick={() => router.push("/professionals")}
                className="px-10 py-5 rounded-2xl font-extrabold uppercase tracking-widest hover:bg-surface-container-high transition-all border-2 text-xs"
              >
                  Book Next Session
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 text-center space-y-3 transform -rotate-2 hover:rotate-0 transition-transform">
                <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <p className="text-4xl font-headline font-extrabold text-primary">12</p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant opacity-60">Milestones Met</p>
              </div>
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 text-center space-y-3 transform rotate-3 hover:rotate-0 transition-transform mt-8">
                <span className="material-symbols-outlined text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                <p className="text-4xl font-headline font-extrabold text-secondary">84%</p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant opacity-60">Engagement Score</p>
              </div>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        </section>

        {/* Milestone Grid */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <h3 className="font-headline font-extrabold text-4xl text-on-surface tracking-tighter">Developmental Progress</h3>
            <button className="text-xs font-extrabold text-primary uppercase tracking-widest hover:underline flex items-center gap-2">View Detail Roadmap <span className="material-symbols-outlined text-sm">arrow_forward</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MilestoneCard title="Communication" progress="68%" color="bg-primary-container text-on-primary-container" icon="record_voice_over" />
            <MilestoneCard title="Sensory Focus" progress="84%" color="bg-secondary-container text-on-secondary-container" icon="visibility" />
            <MilestoneCard title="Social Play" progress="42%" color="bg-tertiary-container text-on-tertiary-container" icon="diversity_2" />
            <MilestoneCard title="Motor Skills" progress="91%" color="bg-surface-container-highest text-on-surface" icon="directions_run" />
          </div>
        </section>

        {/* Resources Bento */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
            <h3 className="font-headline font-extrabold text-4xl lg:text-6xl text-primary tracking-tighter">Handpicked Resources</h3>
            <p className="text-on-surface-variant text-lg font-medium opacity-60">Based on your latest screening results and shared goals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ResourceCard title="Managing Loud Environments" category="Sensory Tips" img="https://lh3.googleusercontent.com/aida-public/AB6AXuB6EFi9Bpyxu63kdK5PwQ949MoUtkGp7tKfWv70kLvDS2whfK3H-HK5Gd1_007MjK_-eIfYL0lm1NesG3KE--Y3OgcYuSTJHTC9fRyPE6kIjY-20Og2ic8dSIaC3Ydo3PoWzEf5CB4NkYXCb8vV9Ft6k54PYmkXehQyxuo2MU3OnwHwaE3xuSOKJjsD3QKfhAs5tjlpLkOK7P1erCdDkkQh-_nq54ijRTnxOGMN1LxCfM5zdyovjNlXyn_vdE_mFv5UWQ9rf7asMrQ" />
            <ResourceCard title="The Power of Routine Cards" category="Behavioral" img="https://lh3.googleusercontent.com/aida-public/AB6AXuBK0ZEi9DyHphi1q5F44iV4PvSQgenqKrKEBP_wrl037m3EvRRZ7NiWcGgRnzfKC4BC3wvtlgRjrBP0BObCg1UjaeAkkCC4r1P42ZwlwtCX_TDmTI0H_-RyWmfy_erxK6nriviCatR9YaJbjSMUN-Sb-CIuKkFV8eOOvJ7XCbtbUI__E8m_4r9XcpS373qFI5m0cOMN625Py0-YAANAd8crI3WzmLV2BB0XpoenBYmbmwoawyAQ2oolv8k_PhjCaCmQZ8mjSVi0QLY" />
            <ResourceCard title="Play-Based Language Games" category="Communication" img="https://lh3.googleusercontent.com/aida-public/AB6AXuAfFGuSXR_iodvByMIVAU1pCXe7mLfrsVNd_IV42vtLskk_amT6u70Y3A-P-Ev_BR5ZQoFd_doA4lgiEVzeuRBjLeuYvKyAln4uAewDH5rmBgBYwRpYuLxrao52Befg5p-qcKaHP_pyoLSDCIsYYtYb_3FcdXhmkMPiucpQbDnfBRdWvtQOeqlcyanIOCivtPKH8ygmlNTvCc2g4Gf_-HgNETCd-ctufHlZx1244Frp_y2xw9ArXrvi9cPzjIDDVQLPtXD5sMh9aRo" />
          </div>
        </section>

        {/* Appointment CTA */}
        <section className="bg-secondary text-on-secondary rounded-[4rem] p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-xl text-center lg:text-left">
            <h3 className="font-headline font-extrabold text-4xl lg:text-6xl tracking-tighter leading-[0.9]">Your next visit is scheduled.</h3>
            <p className="text-on-secondary/80 font-medium text-lg">Thursday at 10:30 AM with Dr. Julianne Smith. Would you like to pre-fill the intake form?</p>
          </div>
          <div className="relative z-10 flex gap-4 w-full lg:w-auto">
            <Button variant="primary" className="bg-white text-secondary hover:bg-surface-bright flex-1 lg:flex-none px-12 py-6 rounded-[2rem] font-extrabold uppercase tracking-widest shadow-2xl transition-all">Start Form</Button>
            <button className="bg-secondary-dim text-white border border-white/20 px-8 py-6 rounded-[2rem] font-extrabold uppercase tracking-widest hover:bg-black/10 transition-all">Reschedule</button>
          </div>
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        </section>
      </main>
    </div>
  );
}
