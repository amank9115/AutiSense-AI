"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui/StitchUI";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { screeningApi, ScreeningSession } from "@/services/api/screeningApi";
import { useProtectedData } from "@/hooks/useProtectedData";

type ApptStatus = "Upcoming" | "Completed" | "Cancelled";

function mapStatus(status: string): ApptStatus {
  switch (status) {
    case "pending":
    case "in_progress":
      return "Upcoming";
    case "completed":
      return "Completed";
    default:
      return "Cancelled";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const { data, loading, error } = useProtectedData<ScreeningSession[]>(async () => {
    const res = await screeningApi.getSessions(1, 50);
    return res.data;
  });

  const sessions = data ?? [];
  const upcoming = sessions.filter((s) => mapStatus(s.status) === "Upcoming");
  const past = sessions.filter((s) => mapStatus(s.status) !== "Upcoming");

  const avgRisk = (() => {
    const scored = sessions.filter((s) => s.riskScore !== null) as (ScreeningSession & { riskScore: number })[];
    if (scored.length === 0) return "—";
    const mean = scored.reduce((a, s) => a + s.riskScore, 0) / scored.length;
    return `${mean.toFixed(0)}%`;
  })();

  const getStatusColor = (status: ApptStatus) => {
    switch (status) {
      case "Upcoming":  return "bg-primary-container text-on-primary-container";
      case "Completed": return "bg-secondary-container text-on-secondary-container";
      case "Cancelled": return "bg-error-container text-on-error-container";
    }
  };

  const renderSessionCard = (session: ScreeningSession, isPast = false) => {
    const status = mapStatus(session.status);
    const [day, mon] = formatDate(session.createdAt).split(" ");
    return (
      <Card
        key={session.id}
        className={`p-5 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300 ${isPast ? "opacity-75" : ""}`}
      >
        <div className="flex items-start gap-4">
          {/* Date Block */}
          <div className="shrink-0 w-16 h-16 rounded-xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-md">
            <span className="text-[9px] font-bold uppercase opacity-70">{mon}</span>
            <span className="text-xl font-headline font-extrabold">{day}</span>
          </div>

          {/* Details */}
          <div className="grow min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-headline font-bold text-base text-on-surface">
                {session.child?.name ?? "Unknown Patient"}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mb-1">
              Session {session.id.slice(0, 8)}
            </p>
            <p className="text-xs text-on-surface-variant italic flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">assignment</span>
              Screening Session
              {session.riskLevel ? ` · ${session.riskLevel} risk` : ""}
            </p>
          </div>

          {/* Risk score */}
          <div className="shrink-0 text-right">
            <p className="font-bold text-sm text-primary">
              {session.riskScore !== null ? `${session.riskScore.toFixed(0)}%` : "--"}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-1 uppercase font-bold">Risk</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-outline-variant/10 flex gap-2">
          {status === "Upcoming" ? (
            <Button
              variant="primary"
              onClick={() => router.push(`/screening?childId=${session.childId}&sessionId=${session.id}`)}
              className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
            >
              Start Session
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push(`/results?sessionId=${session.id}`)}
              className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
            >
              View Results
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Appointments
          </h2>
          <p className="text-on-surface-muted text-lg">
            Manage your patient screening sessions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/professionals")}
          className="px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-5 border-none bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">event_available</span>
          <p className="text-3xl font-headline font-extrabold">{upcoming.length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Upcoming</p>
        </Card>
        <Card className="p-5 border-none bg-tertiary-container text-on-tertiary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">pending_actions</span>
          <p className="text-3xl font-headline font-extrabold">
            {sessions.filter((s) => s.status === "pending").length}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Pending</p>
        </Card>
        <Card className="p-5 border-none bg-secondary-container text-on-secondary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">task_alt</span>
          <p className="text-3xl font-headline font-extrabold">
            {sessions.filter((s) => s.status === "completed").length}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Completed</p>
        </Card>
        <Card className="p-5 border-none bg-surface-container text-on-surface">
          <span className="material-symbols-outlined text-2xl mb-2 block">monitoring</span>
          <p className="text-3xl font-headline font-extrabold">{avgRisk}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Avg Risk</p>
        </Card>
      </div>

      {error ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
          <p className="font-bold">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      ) : loading ? (
        <PatientListSkeleton rows={4} />
      ) : (
        <>
          {/* Upcoming */}
          <section className="mb-10">
            <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">upcoming</span>
              Upcoming Sessions
            </h3>
            {upcoming.length > 0 ? (
              <div className="space-y-4">
                {upcoming.map((s) => renderSessionCard(s))}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface-container-low rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
                  event_busy
                </span>
                <p className="text-on-surface-variant font-medium">No upcoming sessions</p>
              </div>
            )}
          </section>

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">history</span>
                Past Sessions
              </h3>
              <div className="space-y-4">
                {past.map((s) => renderSessionCard(s, true))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
