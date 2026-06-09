"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, EmptyState } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import Image from "next/image";
import { fetchJson } from "@/api/client";

const MilestoneCard = ({
  title, progress, color, icon,
}: {
  title: string; progress: string; color: string; icon: string;
}) => (
  <div
    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 hover:shadow-md transition-all duration-300 group"
    style={{ boxShadow: "var(--shadow-card)" }}
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4`}>
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <h4 className="font-headline font-bold text-base text-on-surface mb-3">{title}</h4>
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium text-on-surface-muted">
        <span>Progress</span>
        <span className="font-bold text-on-surface">{progress}</span>
      </div>
      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.includes("primary") ? "bg-primary" : color.includes("secondary") ? "bg-secondary" : color.includes("tertiary") ? "bg-tertiary" : "bg-on-surface-muted"}`}
          style={{ width: progress }}
        />
      </div>
    </div>
  </div>
);

const ResourceCard = ({
  title, category, img,
}: {
  title: string; category: string; img: string;
}) => (
  <div className="group cursor-pointer">
    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-low shadow-md border border-outline-variant/10 relative mb-4">
      <Image src={img} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute top-4 left-4">
        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-primary shadow-sm">
          {category}
        </span>
      </div>
    </div>
    <h4 className="font-headline font-bold text-base group-hover:text-primary transition-colors mb-1 tracking-tight">{title}</h4>
    <p className="text-xs text-on-surface-muted">5 min read · Expert Guide</p>
  </div>
);

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageRiskScore: number;
  successRate: string;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }

    const fetchStats = async () => {
      try {
        const data = await fetchJson<DashboardStats>("/api/v1/screening/statistics");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, router]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isFirstTime = stats?.totalSessions === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-10">

      {/* Welcome Hero */}
      <section className="bg-surface-container-low rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-outline-variant/10" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              Your Navigator Dashboard
            </span>
            <h2 className="font-headline font-extrabold text-3xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
              {getGreeting()},{" "}
              <span className="text-primary">{user?.name?.split(" ")[0]}.</span>
            </h2>
            <p className="text-on-surface-muted leading-relaxed">
              {isFirstTime
                ? "Welcome! Start your child's first screening to see insights here."
                : stats?.completedSessions && stats.completedSessions > 0
                ? "You have a new report available for review."
                : "Your dashboard is ready. Continue a screening or book an appointment."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                onClick={() => router.push(isFirstTime ? "/assessment" : "/results")}
                className="px-8 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-primary/15 hover:scale-[1.02] transition-all text-sm"
              >
                {isFirstTime ? "Start First Screening" : "View Latest Report"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/professionals")}
                className="px-8 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all text-sm"
              >
                Book Next Session
              </Button>
            </div>
          </div>

          {/* Inline stats — no rotation */}
          {!loading && (
            <div className="flex gap-4 shrink-0">
              <div className="bg-surface-container-lowest rounded-2xl p-5 text-center min-w-[110px] border border-outline-variant/10">
                <span className="material-symbols-outlined text-2xl text-primary block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
                <p className="font-headline font-extrabold text-2xl text-primary">{stats?.totalSessions ?? 0}</p>
                <p className="text-xs text-on-surface-muted mt-0.5">Screenings</p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 text-center min-w-[110px] border border-outline-variant/10">
                <span className="material-symbols-outlined text-2xl text-secondary block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                <p className="font-headline font-extrabold text-2xl text-secondary">
                  {stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(0)}%` : "—"}
                </p>
                <p className="text-xs text-on-surface-muted mt-0.5">Avg Risk</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/4 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      </section>

      {/* Stats Row */}
      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="assignment"      label="Total Screenings" value={stats?.totalSessions?.toString() ?? "0"}                              variant="compact" iconColor="bg-primary-container text-on-primary-container" />
          <StatCard icon="task_alt"        label="Completed"        value={stats?.completedSessions?.toString() ?? "0"}                          variant="compact" iconColor="bg-secondary-container text-on-secondary-container" />
          <StatCard icon="monitoring"      label="Avg Risk Score"   value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} variant="compact" iconColor="bg-tertiary-container text-on-tertiary-container" />
          <StatCard icon="verified"        label="Success Rate"     value={stats?.successRate ? `${parseFloat(stats.successRate).toFixed(0)}%` : "0%"} variant="compact" iconColor="bg-surface-container-highest text-on-surface" />
        </div>
      )}

      {/* Developmental Progress */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-xl text-on-surface">Developmental Progress</h3>
          <button
            onClick={() => router.push("/dashboard/parent/history")}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-widest"
          >
            Detail Roadmap
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MilestoneCard title="Communication" progress="68%" color="bg-primary-container text-on-primary-container"   icon="record_voice_over" />
          <MilestoneCard title="Sensory Focus" progress="84%" color="bg-secondary-container text-on-secondary-container" icon="visibility" />
          <MilestoneCard title="Social Play"   progress="42%" color="bg-tertiary-container text-on-tertiary-container"   icon="diversity_2" />
          <MilestoneCard title="Motor Skills"  progress="91%" color="bg-surface-container-highest text-on-surface"        icon="directions_run" />
        </div>
      </section>

      {/* Appointment CTA — conditional */}
      {stats && stats.completedSessions > 0 && (
        <section className="bg-secondary text-on-secondary rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden" style={{ boxShadow: "var(--shadow-card-raised)" }}>
          <div className="relative z-10 space-y-3 max-w-md">
            <h3 className="font-headline font-bold text-2xl lg:text-3xl tracking-tight">Your next visit is scheduled.</h3>
            <p className="text-on-secondary/80 text-sm">Thursday at 10:30 AM with Dr. Julianne Smith. Would you like to pre-fill the intake form?</p>
          </div>
          <div className="relative z-10 flex gap-3">
            <Button
              variant="primary"
              onClick={() => router.push("/dashboard/parent/appointments")}
              className="bg-white text-secondary hover:bg-surface-bright px-8 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-md transition-all text-sm"
            >
              Start Form
            </Button>
            <button
              onClick={() => router.push("/dashboard/parent/appointments")}
              className="bg-secondary-dim text-white border border-white/20 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest hover:bg-black/10 transition-all text-sm cursor-pointer"
            >
              Reschedule
            </button>
          </div>
          <div className="absolute -top-8 -left-8 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}

      {/* Handpicked Resources — below the fold */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-headline font-bold text-2xl text-on-surface">Handpicked Resources</h3>
          <p className="text-on-surface-muted text-sm">Based on your latest screening results.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <ResourceCard title="Managing Loud Environments" category="Sensory Tips" img="https://lh3.googleusercontent.com/aida-public/AB6AXuB6EFi9Bpyxu63kdK5PwQ949MoUtkGp7tKfWv70kLvDS2whfK3H-HK5Gd1_007MjK_-eIfYL0lm1NesG3KE--Y3OgcYuSTJHTC9fRyPE6kIjY-20Og2ic8dSIaC3Ydo3PoWzEf5CB4NkYXCb8vV9Ft6k54PYmkXehQyxuo2MU3OnwHwaE3xuSOKJjsD3QKfhAs5tjlpLkOK7P1erCdDkkQh-_nq54ijRTnxOGMN1LxCfM5zdyovjNlXyn_vdE_mFv5UWQ9rf7asMrQ" />
          <ResourceCard title="The Power of Routine Cards" category="Behavioral" img="https://lh3.googleusercontent.com/aida-public/AB6AXuBK0ZEi9DyHphi1q5F44iV4PvSQgenqKrKEBP_wrl037m3EvRRZ7NiWcGgRnzfKC4BC3wvtlgRjrBP0BObCg1UjaeAkkCC4r1P42ZwlwtCX_TDmTI0H_-RyWmfy_erxK6nriviCatR9YaJbjSMUN-Sb-CIuKkFV8eOOvJ7XCbtbUI__E8m_4r9XcpS373qFI5m0cOMN625Py0-YAANAd8crI3WzmLV2BB0XpoenBYmbmwoawyAQ2oolv8k_PhjCaCmQZ8mjSVi0QLY" />
          <ResourceCard title="Play-Based Language Games" category="Communication" img="https://lh3.googleusercontent.com/aida-public/AB6AXuAfFGuSXR_iodvByMIVAU1pCXe7mLfrsVNd_IV42vtLskk_amT6u70Y3A-P-Ev_MB7-x1oJFJf1hRjN1W-rngDOFYwFKtn1eGUivChKvHGP6WOrC2ZCzfc" />
        </div>
      </section>

    </div>
  );
}
