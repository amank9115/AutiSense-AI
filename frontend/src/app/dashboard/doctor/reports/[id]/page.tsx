"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProtectedData } from "@/hooks/useProtectedData";
import { screeningApi, ReportShare } from "@/services/api/screeningApi";
import { EmptyState } from "@/components/ui/StitchUI";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import { calculateAge } from "@/lib/date";

const DomainBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <span className="text-xs font-extrabold text-on-surface-variant uppercase tracking-widest opacity-70">{label}</span>
      <span className={`font-headline font-extrabold text-lg ${color}`}>{Math.round(value)}%</span>
    </div>
    <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color.replace("text-", "bg-")}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

export default function DoctorReportPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params?.id as string;

  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<"saved" | "error" | null>(null);

  const { data: share, loading, error } = useProtectedData<ReportShare>(
    () => screeningApi.getReportShare(shareId),
    [shareId],
  );

  // Initialise notes from loaded data (only once)
  const [notesInitialised, setNotesInitialised] = useState(false);
  if (share && !notesInitialised) {
    setNotes(share.doctorNotes ?? "");
    setNotesInitialised(true);
  }

  const handleMarkReviewed = useCallback(async () => {
    if (!shareId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await screeningApi.reviewReport(shareId, notes ?? "", true);
      setSaveMsg("saved");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
    }
  }, [shareId, notes]);

  const handleSaveNotes = useCallback(async () => {
    if (!shareId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await screeningApi.reviewReport(shareId, notes ?? "", false);
      setSaveMsg("saved");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
    }
  }, [shareId, notes]);

  // Derive display data
  const session = share?.session as any;
  const results = session?.results as any;
  const child = session?.child;
  const behaviors: Record<string, number> = results?.behaviors ?? {};

  if (loading) {
    return (
      <div className="p-10">
        <div className="space-y-4">
          <div className="h-8 w-64 skeleton-shimmer rounded-2xl" />
          <div className="h-48 skeleton-shimmer rounded-3xl" />
          <div className="h-96 skeleton-shimmer rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="p-10">
        <EmptyState
          icon="error_outline"
          title="Report not found"
          description="This report doesn't exist or you don't have access to it."
          action={
            <button
              onClick={() => router.push("/dashboard/doctor")}
              className="text-xs font-bold text-primary hover:underline"
            >
              Back to Dashboard
            </button>
          }
        />
      </div>
    );
  }

  const riskScore = results?.riskScore ?? session?.riskScore ?? 0;
  const riskLevel = (results?.riskLevel ?? session?.riskLevel ?? "low") as string;
  const confidence = results?.confidence ?? null;
  const modelVersion = results?.modelVersion ?? "—";
  const recommendations: string[] = results?.recommendations ?? [];

  const riskColor =
    riskLevel === "low" ? "text-secondary" :
    riskLevel === "medium" ? "text-tertiary" :
    "text-error";

  return (
    <div className="p-6 lg:p-10 text-on-surface font-body antialiased">
      <DoctorTopBar subtitle="Clinical report review" pendingCount={0} />

      {/* Patient header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center text-primary font-headline font-extrabold text-3xl shadow-lg shrink-0">
            {child?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="font-headline font-extrabold text-4xl text-primary tracking-tighter mb-1">
              {child?.name ?? "Unknown Patient"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-muted font-bold uppercase tracking-widest">
              {child?.dateOfBirth && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  {calculateAge(child.dateOfBirth)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                {session?.completedAt
                  ? new Date(session.completedAt).toLocaleDateString()
                  : new Date(share.createdAt).toLocaleDateString()}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                share.status === "reviewed"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-tertiary-container text-on-tertiary-container"
              }`}>
                {share.status === "reviewed" ? "Reviewed" : "Pending Review"}
              </span>
            </div>
            <p className="text-xs text-on-surface-muted mt-1">
              Shared by {share.sharedBy?.name ?? "parent"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/doctor")}
            className="flex items-center gap-2 px-5 py-3 bg-surface-container-low rounded-2xl text-[10px] font-extrabold uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back
          </button>
          <button
            onClick={() => screeningApi.generateReport(session?.id).then((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `report-${child?.name ?? "patient"}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            })}
            className="flex items-center gap-2 px-5 py-3 bg-surface-container-low rounded-2xl text-[10px] font-extrabold uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-all border border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export PDF
          </button>
        </div>
      </section>

      {/* Main bento grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Symptom Analysis */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Symptom Analysis</h3>
            <span className="text-[10px] font-extrabold text-on-surface-muted uppercase tracking-widest opacity-60">Core Developmental Domains</span>
          </div>
          {Object.keys(behaviors).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {Object.entries(behaviors).map(([key, val]) => {
                const colors = ["text-secondary", "text-tertiary", "text-primary", "text-secondary-dim"];
                const idx = Object.keys(behaviors).indexOf(key);
                return (
                  <DomainBar
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1").trim()}
                    value={typeof val === "number" ? val : 0}
                    color={colors[idx % colors.length]}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState icon="bar_chart" title="No behavioral data" description="Behavior metrics were not captured in this session." />
          )}
        </div>

        {/* AI Insights */}
        <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-center">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
              <h3 className="font-headline text-2xl font-extrabold tracking-tight">AI Insights</h3>
            </div>
            {[
              { label: "Risk Score", value: `${Math.round(riskScore)}%`, sub: riskLevel.replace("_", " "), color: riskColor.replace("text-", "") },
              ...(confidence !== null ? [{ label: "Confidence", value: `${Math.round(confidence * 100)}%`, sub: "Model certainty" }] : []),
              { label: "Model Version", value: modelVersion, sub: "ML pipeline" },
            ].map((item) => (
              <div key={item.label} className="bg-on-primary/10 p-5 rounded-2xl border border-on-primary/10">
                <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60 mb-1">{item.label}</p>
                <p className="text-2xl font-headline font-extrabold text-white">{item.value}</p>
                <p className="text-xs text-white/70 mt-1 capitalize">{item.sub}</p>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ML Recommendations */}
        {recommendations.length > 0 && (
          <div className="col-span-12 bg-surface-container rounded-3xl p-8 border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary text-2xl">recommend</span>
              <h3 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">ML Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                  <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">arrow_forward</span>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Notes */}
        <div className="col-span-12 bg-white dark:bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 shadow-lg">
          <h3 className="font-headline text-2xl font-extrabold text-primary mb-8 tracking-tight">Clinical Notes</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mb-3 opacity-60">
                Internal Clinical Notes
              </label>
              <textarea
                value={notes ?? ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter clinical findings, observations, and recommended next steps…"
                rows={6}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-3xl px-6 py-5 text-on-surface font-body leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/30 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant/10">
              <div className="flex items-center gap-3">
                {saveMsg === "saved" && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Saved
                  </span>
                )}
                {saveMsg === "error" && (
                  <span className="text-xs font-bold text-error">Failed to save. Try again.</span>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-8 py-4 bg-surface-container-high text-on-surface font-extrabold rounded-2xl hover:bg-surface-variant transition-all text-[10px] uppercase tracking-widest disabled:opacity-40"
                >
                  Save Notes
                </button>
                <button
                  onClick={handleMarkReviewed}
                  disabled={saving || share.status === "reviewed"}
                  className="flex-1 sm:flex-none px-10 py-4 bg-gradient-to-br from-primary to-primary/80 text-on-primary font-extrabold rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {share.status === "reviewed" ? "Already Reviewed ✓" : saving ? "Saving…" : "Mark as Reviewed"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
