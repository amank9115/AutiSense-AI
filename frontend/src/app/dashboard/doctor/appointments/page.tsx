"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/ui/StitchUI";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { appointmentsApi, Appointment } from "@/services/api/appointmentsApi";
import { screeningApi, DoctorPatient } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";
import { calculateAge } from "@/lib/date";

const STATUS_COLORS: Record<Appointment["status"], string> = {
  scheduled: "bg-primary-container text-on-primary-container",
  completed: "bg-secondary-container text-on-secondary-container",
  cancelled: "bg-error-container text-on-error-container",
};

export default function DoctorAppointmentsPage() {
  const searchParams = useSearchParams();
  const preselectedChildId = searchParams?.get("childId") ?? "";

  const [showForm, setShowForm] = useState(!!preselectedChildId);
  const [formData, setFormData] = useState({
    childId: preselectedChildId,
    scheduledAt: "",
    durationMins: "30",
    reason: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: apptData, loading: apptLoading, error: apptError, refetch: refetchAppts } =
    useProtectedQuery(["appointments", "list"], async () => {
      const res = await appointmentsApi.list(undefined, 1, 100);
      return res.data;
    });

  const { data: patients } = useProtectedQuery<DoctorPatient[]>(
    ["doctor", "patients"],
    () => screeningApi.getDoctorPatients(),
  );

  const appointments: Appointment[] = apptData ?? [];
  const now = new Date();
  const upcoming = appointments.filter((a) => a.status === "scheduled" && new Date(a.scheduledAt) >= now);
  const past     = appointments.filter((a) => a.status !== "scheduled" || new Date(a.scheduledAt) < now);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.childId) { setFormError("Please select a patient."); return; }
    if (!formData.scheduledAt) { setFormError("Please select a date and time."); return; }
    setSubmitting(true);
    try {
      await appointmentsApi.create({
        childId: formData.childId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        durationMins: parseInt(formData.durationMins) || 30,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
      });
      setShowForm(false);
      setFormData({ childId: "", scheduledAt: "", durationMins: "30", reason: "", notes: "" });
      refetchAppts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment["status"]) => {
    setUpdatingId(id);
    try {
      await appointmentsApi.update(id, { status });
      refetchAppts();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    setUpdatingId(id);
    try {
      await appointmentsApi.cancel(id);
      refetchAppts();
    } finally {
      setUpdatingId(null);
    }
  };

  const renderCard = (appt: Appointment, isPast = false) => {
    const d = new Date(appt.scheduledAt);
    const day = d.toLocaleDateString("en-IN", { day: "2-digit" });
    const mon = d.toLocaleDateString("en-IN", { month: "short" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return (
      <Card key={appt.id} className={`p-5 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300 ${isPast ? "opacity-75" : ""}`}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-md">
            <span className="text-[9px] font-bold uppercase opacity-70">{mon}</span>
            <span className="text-xl font-headline font-extrabold">{day}</span>
          </div>
          <div className="grow min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-headline font-bold text-base text-on-surface">{appt.child?.name ?? "Patient"}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${STATUS_COLORS[appt.status]}`}>
                {appt.status}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mb-0.5">
              {time} · {appt.durationMins} min
              {appt.reason ? ` · ${appt.reason}` : ""}
            </p>
            <p className="text-xs text-on-surface-variant">Parent: {appt.parent?.name ?? "—"}</p>
          </div>
        </div>

        {appt.status === "scheduled" && (
          <div className="mt-4 pt-4 border-t border-outline-variant/10 flex gap-2">
            <Button variant="primary"
              disabled={updatingId === appt.id}
              onClick={() => handleUpdateStatus(appt.id, "completed")}
              className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest">
              Mark Complete
            </Button>
            <Button variant="outline"
              disabled={updatingId === appt.id}
              onClick={() => handleCancel(appt.id)}
              className="py-2 px-4 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-error border-error/20">
              Cancel
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">Appointments</h2>
          <p className="text-on-surface-muted text-lg">Schedule and manage patient consultations</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm((s) => !s)}
          className="px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg">
          <span className="material-symbols-outlined mr-2">add</span>
          {showForm ? "Cancel" : "New Appointment"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="p-8 rounded-3xl mb-8 border border-outline-variant/10">
          <h3 className="font-headline font-bold text-xl text-on-surface mb-6">New Appointment</h3>
          {formError && <p className="text-sm text-error mb-4 font-bold">{formError}</p>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-on-surface-muted mb-2">Patient</label>
              <select value={formData.childId} onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner">
                <option value="">Select patient…</option>
                {(patients ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({calculateAge(p.dateOfBirth)})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-on-surface-muted mb-2">Date & Time</label>
              <input type="datetime-local" value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-on-surface-muted mb-2">Duration (minutes)</label>
              <select value={formData.durationMins} onChange={(e) => setFormData({ ...formData, durationMins: e.target.value })}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner">
                {[15,30,45,60,90].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-on-surface-muted mb-2">Reason (optional)</label>
              <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Initial consultation, follow-up…"
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner" />
            </div>
            <div className="md:col-span-2 flex gap-4 pt-2">
              <Button type="submit" variant="primary" disabled={submitting} className="px-10">
                {submitting ? "Scheduling…" : "Schedule Appointment"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="px-8">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card className="p-5 border-none bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">event_available</span>
          <p className="text-3xl font-headline font-extrabold">{upcoming.length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Upcoming</p>
        </Card>
        <Card className="p-5 border-none bg-secondary-container text-on-secondary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">task_alt</span>
          <p className="text-3xl font-headline font-extrabold">{appointments.filter((a) => a.status === "completed").length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Completed</p>
        </Card>
        <Card className="p-5 border-none bg-surface-container text-on-surface">
          <span className="material-symbols-outlined text-2xl mb-2 block">cancel</span>
          <p className="text-3xl font-headline font-extrabold">{appointments.filter((a) => a.status === "cancelled").length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Cancelled</p>
        </Card>
      </div>

      {apptError ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
          <p className="font-bold">{apptError}</p>
          <Button variant="secondary" onClick={refetchAppts} className="mt-4">Retry</Button>
        </div>
      ) : apptLoading ? (
        <PatientListSkeleton rows={4} />
      ) : (
        <>
          <section className="mb-10">
            <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">upcoming</span>
              Upcoming
            </h3>
            {upcoming.length > 0 ? (
              <div className="space-y-4">{upcoming.map((a) => renderCard(a))}</div>
            ) : (
              <div className="text-center py-12 bg-surface-container-low rounded-3xl">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">event_busy</span>
                <p className="text-on-surface-variant font-medium">No upcoming appointments</p>
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant">history</span>
                Past
              </h3>
              <div className="space-y-4">{past.map((a) => renderCard(a, true))}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
