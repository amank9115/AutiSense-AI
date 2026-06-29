"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton, PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import { screeningApi, ReportShare, DoctorStatistics } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";

interface DoctorDashboardData {
  stats: DoctorStatistics;
  pendingReports: ReportShare[];
  recentReports: ReportShare[];
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { data, loading } = useProtectedQuery<DoctorDashboardData>(["doctor", "dashboard"], async () => {
    const [statsRes, reportsRes] = await Promise.all([
      screeningApi.getDoctorStatistics(),
      screeningApi.getReceivedReports(1, 10),
    ]);
    const allReports = (reportsRes as { data: ReportShare[] }).data ?? [];
    return {
      stats: statsRes,
      pendingReports: allReports.filter((r) => r.status === "pending"),
      recentReports: allReports.slice(0, 5),
    };
  });

  const stats = data?.stats ?? null;
  const pendingReports = data?.pendingReports ?? [];
  const recentReports = data?.recentReports ?? [];
  const pendingCount = stats?.pendingReviews ?? 0;

  return (
    <div className="p-6 lg:p-10 text-on-surface font-body antialiased">
      <DoctorTopBar
        subtitle={pendingCount > 0 ? `${pendingCount} report${pendingCount !== 1 ? "s" : ""} awaiting your review.` : "All reports reviewed — great work!"}
        pendingCount={pendingCount}
      />

      {loading ? (
        <div className="space-y-8">
          <DashboardStatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 space-y-4 shadow-card">
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
          {/* Stat cards sourced from doctor-scoped statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon="folder_shared"   label="Total Reports"    value={stats?.totalReports?.toString() ?? "0"}           iconColor="bg-primary text-on-primary" />
            <StatCard icon="pending_actions" label="Pending Reviews"  value={stats?.pendingReviews?.toString() ?? "0"}          iconColor="bg-tertiary-container text-on-tertiary-container" />
            <StatCard icon="group"           label="Patients"         value={stats?.totalPatients?.toString() ?? "0"}           iconColor="bg-secondary text-on-secondary" />
            <StatCard icon="monitoring"      label="Avg Risk"         value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} iconColor="bg-surface-container-highest text-on-surface" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Reports */}
            <Card className="lg:col-span-2 p-6 lg:p-8 border-none bg-surface-container-lowest rounded-3xl shadow-card-raised">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline font-bold text-xl text-on-surface">Recent Reports</h3>
                <button
                  onClick={() => router.push("/dashboard/doctor/patients")}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  View Patients
                </button>
              </div>
              <div className="space-y-1">
                {recentReports.length > 0 ? (
                  recentReports.map((share) => (
                    <div
                      key={share.id}
                      onClick={() => router.push(`/dashboard/doctor/reports/${share.id}`)}
                      className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-all rounded-2xl cursor-pointer group border border-transparent hover:border-outline-variant/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold shrink-0">
                          {share.session?.child?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
                            {share.session?.child?.name ?? "Patient"}
                          </h4>
                          <p className="text-xs text-on-surface-muted">
                            From {share.sharedBy?.name ?? "Parent"} · {new Date(share.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                          share.status === "reviewed"
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-tertiary-container text-on-tertiary-container"
                        }`}>
                          {share.status}
                        </span>
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-base transition-colors">chevron_right</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon="folder_shared"
                    title="No reports yet"
                    description="Reports shared by parents will appear here."
                    action={
                      <button
                        onClick={() => router.push("/dashboard/doctor/patients")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View patients
                      </button>
                    }
                  />
                )}
              </div>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pending alert */}
              {pendingReports.length > 0 ? (
                <Card className="p-6 border-none bg-primary text-on-primary rounded-3xl relative overflow-hidden shadow-card-raised">
                  <div className="relative z-10">
                    <span className="material-symbols-outlined text-3xl text-white/60 mb-4 block">pending_actions</span>
                    <h4 className="font-headline font-bold text-lg mb-2 tracking-tight">Reports to Review</h4>
                    <p className="text-white/80 text-sm leading-relaxed mb-6">
                      {pendingReports.length} report{pendingReports.length !== 1 ? "s" : ""} awaiting your clinical notes.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/dashboard/doctor/reports/${pendingReports[0].id}`)}
                      className="w-full bg-white/10 border-white/20 text-white font-bold py-3 rounded-2xl hover:bg-white/20 text-xs uppercase tracking-widest"
                    >
                      Review Next
                    </Button>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                </Card>
              ) : (
                <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-3xl">
                  <EmptyState icon="check_circle" title="All clear" description="No pending reports. Great work!" className="py-6" />
                </div>
              )}

              {/* Summary stats */}
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-card">
                <h4 className="font-headline font-bold text-base text-on-surface mb-4">Overview</h4>
                <div className="space-y-4">
                  {[
                    { label: "Pending Reviews", value: stats?.pendingReviews ?? 0,  icon: "pending_actions", color: "text-tertiary" },
                    { label: "Reviewed",        value: stats?.reviewedReports ?? 0,  icon: "task_alt",       color: "text-secondary" },
                    { label: "Review Rate",     value: `${Math.round(stats?.reviewRate ?? 0)}%`, icon: "verified", color: "text-primary" },
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
