"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { appointmentsApi } from "@/services/api/appointmentsApi";
import type { Appointment } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";

type FilterStatus = "All" | "Upcoming" | "Completed" | "Cancelled";

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.toLocaleDateString("en-US", { day: "2-digit" }),
    year: d.getFullYear().toString(),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

function toFilterStatus(appt: Appointment): FilterStatus {
  if (appt.status === "cancelled") return "Cancelled";
  if (appt.status === "completed") return "Completed";
  const isPast = new Date(appt.scheduledAt) < new Date();
  return isPast ? "Completed" : "Upcoming";
}

const STATUS_COLORS: Record<FilterStatus, string> = {
  All:       "",
  Upcoming:  "bg-primary-container text-on-primary-container",
  Completed: "bg-secondary-container text-on-secondary-container",
  Cancelled: "bg-error-container text-on-error-container",
};

export default function AppointmentsPage() {
  useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("All");

  const { data, loading, error, refetch } = useProtectedQuery(["appointments", "list"], async () => {
    const res = await appointmentsApi.list(undefined, 1, 100);
    return res.data;
  });

  const appointments: Appointment[] = data ?? [];

  const filtered = appointments.filter((apt) => {
    if (filter === "All") return true;
    return toFilterStatus(apt) === filter;
  });

  const getStatusLabel = (appt: Appointment): FilterStatus => toFilterStatus(appt);

  const upcomingCount  = appointments.filter((a) => toFilterStatus(a) === "Upcoming").length;
  const completedCount = appointments.filter((a) => toFilterStatus(a) === "Completed").length;
  const cancelledCount = appointments.filter((a) => toFilterStatus(a) === "Cancelled").length;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb className="mb-6" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">
            Appointments
          </h1>
          <p className="text-on-surface-variant font-medium">
            Schedule and manage your upcoming consultations.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/professionals")}
          className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Book Appointment
        </Button>
      </div>

      {/* Summary counts */}
      {!loading && appointments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Upcoming",  count: upcomingCount,  icon: "event_available", color: "bg-primary-container text-on-primary-container" },
            { label: "Completed", count: completedCount, icon: "task_alt",         color: "bg-secondary-container text-on-secondary-container" },
            { label: "Cancelled", count: cancelledCount, icon: "cancel",           color: "bg-surface-container text-on-surface" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color} flex items-center gap-3`}>
              <span className="material-symbols-outlined text-2xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-headline font-extrabold">{s.count}</p>
                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {(["All", "Upcoming", "Completed", "Cancelled"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest transition-all ${
              filter === status
                ? "bg-primary text-on-primary shadow-lg"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center mb-6">
          <p className="font-bold">Failed to load appointments</p>
          <p className="text-sm mt-1 opacity-80">{error}</p>
          <Button variant="secondary" onClick={refetch} className="mt-4">
            Retry
          </Button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <PatientListSkeleton rows={4} />
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const { month, day, year, time } = formatDate(apt.scheduledAt);
            const statusLabel = getStatusLabel(apt);
            const doctorName = apt.doctor?.name ?? "Doctor";
            const specialty  = apt.doctor?.specialization ?? null;
            const childName  = apt.child?.name ?? "Child";

            return (
              <Card
                key={apt.id}
                className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Date Block */}
                  <div className="shrink-0 w-20 h-20 rounded-2xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[10px] font-bold uppercase">{month}</span>
                    <span className="text-2xl font-headline font-extrabold">{day}</span>
                    <span className="text-[10px] font-bold opacity-70">{year}</span>
                  </div>

                  {/* Details */}
                  <div className="grow">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-headline font-extrabold text-xl text-on-surface">
                        {doctorName}
                      </h3>
                      {specialty && (
                        <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase tracking-widest">
                          {specialty}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${STATUS_COLORS[statusLabel]}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {time} · {apt.durationMins} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">child_care</span>
                        {childName}
                      </span>
                    </div>

                    {apt.reason && (
                      <p className="text-sm text-on-surface-variant bg-surface-container-highest rounded-xl p-3 italic">
                        {apt.reason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:items-end">
                    {statusLabel === "Upcoming" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/parent/appointments")}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                      >
                        View Details
                      </Button>
                    )}
                    {statusLabel === "Completed" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/parent/history")}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                      >
                        View History
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : !error ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              calendar_month
            </span>
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
            No {filter !== "All" ? filter : ""} Appointments
          </h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            {filter === "Upcoming" || filter === "All"
              ? "You don't have any upcoming appointments. Book one with a specialist."
              : "No appointments found with this status."}
          </p>
          {(filter === "Upcoming" || filter === "All") && (
            <Button
              variant="primary"
              onClick={() => router.push("/professionals")}
              className="px-8 py-4 rounded-xl font-bold"
            >
              Find a Specialist
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
