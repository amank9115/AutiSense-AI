"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, EmptyState } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton, PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import { screeningApi, ScreeningSession } from "@/services/api/screeningApi";
import { fetchJson } from "@/api/client";

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

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageRiskScore: number;
  successRate: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }

    const fetchData = async () => {
      try {
        const [sessionsRes, statsRes] = await Promise.all([
          screeningApi.getSessions(1, 5),
          fetchJson<DashboardStats>("/api/v1/screening/statistics"),
        ]);
        setSessions(sessionsRes.data);
        setStats(statsRes);
      } catch (err) {
        console.error("Failed to fetch doctor dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    return `${years}y ${months}m`;
  };

  const hasPendingSessions = sessions.some((s) => s.status === "pending");

  return (
    <div className="p-6 lg:p-10 text-on-surface font-body antialiased">
      <DoctorTopBar subtitle="You have pending screenings requiring your review." />

      {loading ? (
        <div className="space-y-8">
          <DashboardStatsSkeleton />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-8 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
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
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon="assignment"      label="Total Screenings" value={stats?.totalSessions?.toString() ?? "0"}                             iconColor="bg-primary text-on-primary" />
            <StatCard icon="pending_actions" label="Completed"        value={stats?.completedSessions?.toString() ?? "0"}                         iconColor="bg-secondary text-on-secondary" />
            <StatCard icon="verified"        label="Avg Risk"         value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} iconColor="bg-tertiary-container text-on-tertiary-container" />
            <StatCard icon="schedule"        label="Success Rate"     value={stats?.successRate ? `${parseFloat(stats.successRate).toFixed(0)}%` : "0%"} iconColor="bg-surface-container-highest text-on-surface" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Recent Patients */}
            <Card className="xl:col-span-2 p-6 lg:p-8 border-none bg-surface-container-lowest rounded-3xl" style={{ boxShadow: "var(--shadow-card-raised)" }}>
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

              {/* Clinical Roadmap */}
              <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10" style={{ boxShadow: "var(--shadow-card)" }}>
                <h4 className="font-headline font-bold text-base text-on-surface mb-4">
                  Clinical Roadmap
                  <span className="ml-2 text-[9px] font-bold bg-surface-container-highest text-on-surface-muted px-2 py-0.5 rounded-full uppercase tracking-wider align-middle">Demo</span>
                </h4>
                <div className="space-y-4">
                  {[
                    { label: "Quarterly Audit",  date: "Oct 30", status: "Upcoming" },
                    { label: "Staff Training",   date: "Nov 02", status: "Mandatory" },
                    { label: "Policy Update",    date: "Nov 15", status: "Review" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{item.label}</p>
                        <p className="text-xs text-on-surface-muted">{item.date}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface-muted uppercase tracking-widest">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
