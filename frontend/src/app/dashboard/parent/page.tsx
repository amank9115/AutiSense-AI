"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton, ParentDashboardSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { fetchJson } from "@/api/client";
import { useProtectedData } from "@/hooks/useProtectedData";
import type { DashboardStats } from "@/lib/analytics";

const MilestoneCard = ({
  title, progress, color, icon,
}: {
  title: string; progress: string; color: string; icon: string;
}) => (
  <div
    className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 hover:shadow-md transition-all duration-300"
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
          className={`h-full rounded-full transition-all duration-700 ${
            color.includes("primary")
              ? "bg-primary"
              : color.includes("secondary")
              ? "bg-secondary"
              : color.includes("tertiary")
              ? "bg-tertiary"
              : "bg-on-surface-muted"
          }`}
          style={{ width: progress }}
        />
      </div>
    </div>
  </div>
);

type ResourceEntry = {
  title: string;
  category: string;
  icon: string;
  relevance: "high" | "medium" | "low";
};

const RESOURCE_CATALOG: ResourceEntry[] = [
  { title: "Managing Sensory Sensitivity",   category: "Sensory Tips",    icon: "hearing",           relevance: "high"   },
  { title: "Routine & Predictability",       category: "Behavioral",      icon: "event_repeat",      relevance: "high"   },
  { title: "Building Communication Skills",  category: "Communication",   icon: "record_voice_over", relevance: "medium" },
  { title: "Family Caregiver Self-Care",     category: "Wellbeing",       icon: "favorite",          relevance: "medium" },
  { title: "Play-Based Social Connection",   category: "Social",          icon: "diversity_2",       relevance: "low"    },
  { title: "Motor Skills Activities",        category: "Motor",           icon: "directions_run",    relevance: "low"    },
];

function pickResources(avgRisk: number | null | undefined): ResourceEntry[] {
  if (avgRisk === null || avgRisk === undefined) return RESOURCE_CATALOG.slice(0, 3);
  const tier: ResourceEntry["relevance"] = avgRisk > 60 ? "high" : avgRisk > 30 ? "medium" : "low";
  const prioritized = [
    ...RESOURCE_CATALOG.filter((r) => r.relevance === tier),
    ...RESOURCE_CATALOG.filter((r) => r.relevance !== tier),
  ];
  return prioritized.slice(0, 3);
}

const ResourceCard = ({ title, category, icon }: { title: string; category: string; icon: string }) => (
  <div className="group cursor-pointer p-6 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:shadow-md transition-all hover:bg-surface-container">
    <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
      <span className="material-symbols-outlined text-2xl text-primary">{icon}</span>
    </div>
    <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-2 block">{category}</span>
    <h4 className="font-headline font-bold text-base text-on-surface group-hover:text-primary transition-colors">
      {title}
    </h4>
    <p className="text-xs text-on-surface-muted mt-1">5 min read · Expert Guide</p>
  </div>
);

export default function ParentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: stats, loading } = useProtectedData<DashboardStats>(() =>
    fetchJson<DashboardStats>("/api/v1/screening/statistics"),
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const isFirstTime = stats?.totalSessions === 0;
  const resources = pickResources(stats?.averageRiskScore);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-10">

      {/* Welcome Hero */}
      {loading ? (
        <ParentDashboardSkeleton />
      ) : (
        <section
          className="bg-surface-container-low rounded-3xl p-8 lg:p-12 relative overflow-hidden border border-outline-variant/10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <span className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                Your Navigator Dashboard
              </span>
              <h2 className="font-headline font-extrabold text-2xl sm:text-3xl lg:text-5xl text-on-surface tracking-tighter leading-tight">
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

            {/* Inline stats — hidden on xs, shown sm+ */}
            <div className="hidden sm:flex gap-4 shrink-0">
              <div className="bg-surface-container-lowest rounded-2xl p-5 text-center min-w-27.5 border border-outline-variant/10">
                <span
                  className="material-symbols-outlined text-2xl text-primary block mb-1"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  assignment
                </span>
                <p className="font-headline font-extrabold text-2xl text-primary">
                  {stats?.totalSessions ?? 0}
                </p>
                <p className="text-xs text-on-surface-muted mt-0.5">Screenings</p>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-5 text-center min-w-27.5 border border-outline-variant/10">
                <span
                  className="material-symbols-outlined text-2xl text-secondary block mb-1"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  analytics
                </span>
                <p className="font-headline font-extrabold text-2xl text-secondary">
                  {stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(0)}%` : "—"}
                </p>
                <p className="text-xs text-on-surface-muted mt-0.5">Avg Risk</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/4 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
        </section>
      )}

      {/* Stats Row */}
      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="assignment"  label="Total Screenings" value={stats?.totalSessions?.toString() ?? "0"}                                    variant="compact" iconColor="bg-primary-container text-on-primary-container" />
          <StatCard icon="task_alt"    label="Completed"        value={stats?.completedSessions?.toString() ?? "0"}                                variant="compact" iconColor="bg-secondary-container text-on-secondary-container" />
          <StatCard icon="monitoring"  label="Avg Risk Score"   value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"}   variant="compact" iconColor="bg-tertiary-container text-on-tertiary-container" />
          <StatCard icon="verified"    label="Success Rate"     value={stats?.successRate ? `${parseFloat(stats.successRate).toFixed(0)}%` : "0%"} variant="compact" iconColor="bg-surface-container-highest text-on-surface" />
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
          <MilestoneCard title="Communication" progress="68%" color="bg-primary-container text-on-primary-container"    icon="record_voice_over" />
          <MilestoneCard title="Sensory Focus" progress="84%" color="bg-secondary-container text-on-secondary-container" icon="visibility" />
          <MilestoneCard title="Social Play"   progress="42%" color="bg-tertiary-container text-on-tertiary-container"   icon="diversity_2" />
          <MilestoneCard title="Motor Skills"  progress="91%" color="bg-surface-container-highest text-on-surface"       icon="directions_run" />
        </div>
      </section>

      {/* Appointment CTA — conditional */}
      {stats && stats.completedSessions > 0 && (
        <section
          className="bg-secondary text-on-secondary rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
          style={{ boxShadow: "var(--shadow-card-raised)" }}
        >
          <div className="relative z-10 space-y-3 max-w-md">
            <h3 className="font-headline font-bold text-2xl lg:text-3xl tracking-tight">
              Your next visit is scheduled.
            </h3>
            <p className="text-on-secondary/80 text-sm">
              Thursday at 10:30 AM with Dr. Julianne Smith. Would you like to pre-fill the intake form?
            </p>
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

      {/* Personalised Resources */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="font-headline font-bold text-2xl text-on-surface">Handpicked Resources</h3>
          <p className="text-on-surface-muted text-sm">
            {stats?.averageRiskScore
              ? "Tailored to your child's latest screening results."
              : "Based on your dashboard activity."}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <ResourceCard key={r.title} title={r.title} category={r.category} icon={r.icon} />
          ))}
        </div>
      </section>

    </div>
  );
}
