"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton, PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import { screeningApi, ScreeningSession, ReportShare } from "@/services/api/screeningApi";
import { fetchJson } from "@/api/client";
import { useProtectedData } from "@/hooks/useProtectedData";
import { calculateAge } from "@/lib/date";
import type { DashboardStats } from "@/lib/analytics";

const PatientRow = ({
  name, id, age, status, date, sessionId,
}: {
  name: string; id: string; age: string; status: string; date: string; sessionId: string;
}) => {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/results?sessionId=${sessionId}`)}
      className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-all rounded-2xl cursor-pointer group border border-transparent hover:border-outline-variant/10"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
          <span className="material-symbols-outlined text-lg">child_care</span>
        </div>
        <div>
          <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors text-sm">{name}</h4>
          <div className="flex items-center gap-2 text-xs text-on-surface-muted">
            <span>{id}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span>{age}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-label-caps text-primary">{status}</p>
          <p className="text-xs text-on-surface-muted">{date}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-all">
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </div>
      </div>
    </div>
  );
};

interface DoctorDashboardData {
  sessions: ScreeningSession[];
  stats: DashboardStats;
  pendingReports: ReportShare[];
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { data, loading } = useProtectedData<DoctorDashboardData>(async () => {
    const [sessionsRes, statsRes, reportsRes] = await Promise.all([
      screeningApi.getSessions(1, 5),
      fetchJson<DashboardStats>("/api/v1/screening/statistics"),
      screeningApi.getReceivedReports(1, 5),
    ]);
    const allReports = (reportsRes as { data: ReportShare[] }).data ?? [];
    return {
      sessions: sessionsRes.data,
      stats: statsRes,
      pendingReports: allReports.filter((r) => r.status === "pending"),
    };
  });

  const sessions = data?.sessions ?? [];
  const stats = data?.stats ?? null;
  const pendingReports = data?.pendingReports ?? [];

  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const hasPendingSessions = pendingSessions.length > 0;
  const pendingCount = stats ? Math.max(0, stats.totalSessions - stats.completedSessions) : 0;

  return (
    <div className="p-6 lg:p-10 text-on-surface font-body antialiased">
      <DoctorTopBar
        subtitle={hasPendingSessions ? "You have pending screenings requiring your review." : "All caught up — no pending reviews."}
        pendingCount={pendingCount}
      />

      {loading ? (
        <div className="space-y-8">
          <DashboardStatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="h-6 w-36 skeleton-shimmer rounded-full" />
              <PatientListSkeleton rows={5} />
            </div>
            <div className="space-y-4">
              <div className="h-48 skeleton-shimmer rounded-3xl" />
              <div className="h-48 skeleton-shimmer rounded-3xl" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="assignment"      label="Total Screenings" value={stats?.totalSessions?.toString() ?? "0"}                             iconColor="bg-primary text-on-primary" />
            <StatCard icon="pending_actions" label="Completed"        value={stats?.completedSessions?.toString() ?? "0"}                         iconColor="bg-secondary text-on-secondary" />
            <StatCard icon="verified"        label="Avg Risk"         value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} iconColor="bg-tertiary-container text-on-tertiary-container" />
            <StatCard icon="schedule"        label="Success Rate"     value={stats?.successRate ? `${parseFloat(stats.successRate).toFixed(0)}%` : "0%"} iconColor="bg-surface-container-highest text-on-surface" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Patients */}
            <Card className="lg:col-span-2 p-6 lg:p-8 border-none bg-surface-container-lowest rounded-3xl" style={{ boxShadow: "var(--shadow-card-raised)" }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Recent Activity</h3>
                <button
                  onClick={() => router.push("/dashboard/doctor/patients")}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  View All
                </button>
              </div>
              <div className="space-y-1">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <PatientRow
                      key={session.id}
                      name={session.child?.name ?? "Unknown"}
                      id={session.id.slice(0, 8)}
                      age={session.child?.dateOfBirth ? calculateAge(session.child.dateOfBirth) : "N/A"}
                      status={session.status}
                      date={new Date(session.createdAt).toLocaleDateString()}
                      sessionId={session.id}
                    />
                  ))
                ) : (
                  <EmptyState
                    icon="person_search"
                    title="No recent activity"
                    description="Screening sessions will appear here once patients complete assessments."
                    action={
                      <button
                        onClick={() => router.push("/dashboard/doctor/patients")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View all patients
                      </button>
                    }
                  />
                )}
              </div>
            </Card>

            {/* Alerts + Roadmap */}
            <div className="space-y-6">
              {/* Clinical Alert — conditional on real data */}
              {hasPendingSessions ? (
                <Card className="p-6 border-none bg-primary text-on-primary rounded-3xl relative overflow-hidden" style={{ boxShadow: "var(--shadow-card-raised)" }}>
                  <div className="relative z-10">
                    <span className="material-symbols-outlined text-3xl text-white/60 mb-4 block">warning_amber</span>
                    <h4 className="font-headline font-bold text-lg mb-2 tracking-tight">Pending Reviews</h4>
                    <p className="text-white/80 text-sm leading-relaxed mb-6">
                      {sessions.filter((s) => s.status === "pending").length} screening{sessions.filter((s) => s.status === "pending").length !== 1 ? "s" : ""} awaiting your clinical review.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard/doctor/patients")}
                      className="w-full bg-white/10 border-white/20 text-white font-bold py-3 rounded-2xl hover:bg-white/20 text-xs uppercase tracking-widest"
                    >
                      Review Now
                    </Button>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                </Card>
              ) : (
                <div className="p-6 bg-success-container/20 border border-success/20 rounded-3xl">
                  <EmptyState
                    icon="check_circle"
                    title="All clear"
                    description="No pending reviews. Great work!"
                    className="py-6"
                  />
                </div>
              )}

              {/* Reports Awaiting Review */}
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-lg">folder_shared</span>
                  <h4 className="font-headline font-bold text-base text-on-surface">Reports Awaiting Review</h4>
                  {pendingReports.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-extrabold">
                      {pendingReports.length}
                    </span>
                  )}
                </div>
                {pendingReports.length === 0 ? (
                  <p className="text-xs text-on-surface-muted">No reports shared with you yet.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.slice(0, 3).map((share) => (
                      <div
                        key={share.id}
                        onClick={() => router.push(`/dashboard/doctor/reports/${share.id}`)}
                        className="flex items-center justify-between p-3 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all cursor-pointer group"
                      >
                        <div>
                          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {share.session?.child?.name ?? "Patient"}
                          </p>
                          <p className="text-[10px] text-on-surface-muted uppercase tracking-widest">
                            From {share.sharedBy?.name ?? "Parent"} · {new Date(share.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-lg transition-colors">chevron_right</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Session Summary — real data */}
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10" style={{ boxShadow: "var(--shadow-card)" }}>
                <h4 className="font-headline font-bold text-base text-on-surface mb-4">Session Summary</h4>
                <div className="space-y-4">
                  {[
                    { label: "Pending Review",   value: pendingSessions.length, icon: "pending_actions", color: "text-tertiary" },
                    { label: "Completed",        value: sessions.filter((s) => s.status === "completed").length, icon: "task_alt", color: "text-secondary" },
                    { label: "Total Loaded",     value: sessions.length, icon: "assignment", color: "text-primary" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg ${item.color}`}>{item.icon}</span>
                        <p className="font-semibold text-on-surface text-sm">{item.label}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-muted uppercase tracking-widest">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push("/dashboard/doctor/analytics")}
                  className="w-full mt-5 text-xs font-bold text-primary hover:underline uppercase tracking-widest text-center"
                >
                  View Clinical Insights
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
