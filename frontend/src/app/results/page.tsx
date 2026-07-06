"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { screeningApi, ScreeningSession, DoctorProfile } from "@/services/api/screeningApi";
import { useAppStore } from "@/store";
import { logger } from "@/lib/logger";
import { Alert } from "@/components/ui/Alert";
import { EmptyState, Button } from "@/components/ui/StitchUI";

type RiskLevel = "low" | "medium" | "high" | "very_high";

function getStrengths(riskLevel: string): string[] {
  const level = riskLevel?.toLowerCase() as RiskLevel;
  const map: Record<RiskLevel, string[]> = {
    low: ["Strong eye contact patterns observed", "Responsive to social cues", "Good joint attention skills"],
    medium: ["Shows interest in environmental stimuli", "Demonstrates intentional communication", "Responds to familiar voices consistently"],
    high: ["Engages with preferred objects and routines", "Shows awareness of caregivers", "Demonstrates self-regulation strategies"],
    very_high: ["Maintains comfort in structured environments", "Shows recognition of familiar people", "Responds to sensory input in predictable ways"],
  };
  return map[level] ?? map.medium;
}

function getResources(riskLevel: string): Array<{ icon: string; title: string; desc: string }> {
  const level = riskLevel?.toLowerCase() as RiskLevel;
  const map: Record<RiskLevel, Array<{ icon: string; title: string; desc: string }>> = {
    low: [
      { icon: "emoji_people", title: "Nurturing Social Play", desc: "Activities to build on strong social foundations." },
      { icon: "child_care", title: "Communication Milestones", desc: "Age-appropriate language development guides." },
      { icon: "sports_esports", title: "Enrichment Through Play", desc: "Stimulating activities for typical development." },
    ],
    medium: [
      { icon: "support_agent", title: "Early Intervention Guide", desc: "Understanding when and how to seek support." },
      { icon: "psychology", title: "Sensory Strategies at Home", desc: "Practical techniques for everyday regulation." },
      { icon: "calendar_month", title: "Building Consistent Routines", desc: "How structure supports developmental growth." },
    ],
    high: [
      { icon: "health_and_safety", title: "Accessing Professional Support", desc: "How to connect with developmental specialists." },
      { icon: "family_history", title: "Parent Coping & Wellbeing", desc: "Resources for caregivers navigating this journey." },
      { icon: "school", title: "Inclusive Education Options", desc: "Understanding your child's educational rights." },
    ],
    very_high: [
      { icon: "medical_services", title: "Clinical Assessment Pathways", desc: "Next steps for comprehensive diagnostic evaluation." },
      { icon: "group", title: "Support Groups & Community", desc: "Connecting with families on similar journeys." },
      { icon: "volunteer_activism", title: "Therapeutic Interventions", desc: "Overview of ABA, OT, speech, and other therapies." },
    ],
  };
  return map[level] ?? map.medium;
}

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("sessionId");
  const mlResultsFromStore = useAppStore((state) => state.mlResults);
  const authToken = useAppStore((state) => state.token);
  const isAuthenticated = !!authToken && authToken !== "guest-token";

  const [session, setSession] = useState<(ScreeningSession & { results?: Record<string, unknown> }) | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [downloading, setDownloading] = useState(false);

  // Share with doctor state
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      screeningApi.getSessionDetails(sessionId)
        .then(setSession)
        .catch((err) => logger.error("ResultsPage", "Failed to fetch session", err))
        .finally(() => setLoading(false));
    }
    if (isAuthenticated) {
      screeningApi.getDoctors()
        .then(setDoctors)
        .catch(() => {/* non-fatal — hide doctor panel if unavailable */});
    }
  }, [sessionId, isAuthenticated]);

  const displayResults = session?.results ? {
    riskScore: session.results.riskScore as number,
    riskLabel: (session.results.riskLevel as string) ?? "low",
    modelVersion: (session.results.modelVersion as string) ?? "2.1.0",
    behaviors: (session.results.behaviors as Record<string, number>) ?? {},
    recommendations: (session.results.recommendations as string[]) ?? [],
  } : mlResultsFromStore ? {
    riskScore: mlResultsFromStore.riskScore,
    riskLabel: mlResultsFromStore.riskLabel ?? "low",
    modelVersion: mlResultsFromStore.modelVersion ?? "2.1.0",
    behaviors: (mlResultsFromStore.summary as unknown as Record<string, number>) ?? {},
    recommendations: mlResultsFromStore.recommendations ?? [],
  } : null;

  const riskLabel = displayResults?.riskLabel ?? "low";
  const strengths = getStrengths(riskLabel);
  const resources = getResources(riskLabel);

  const handleDownloadReport = async () => {
    if (!sessionId) {
      alert("Save this screening first to download a report.");
      return;
    }
    setDownloading(true);
    try {
      const blob = await screeningApi.generateReport(sessionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `screening-report-${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleShareWithDoctor = async () => {
    if (!sessionId || !selectedDoctorId) return;
    setSharing(true);
    setShareError(null);
    try {
      await screeningApi.shareWithDoctor(sessionId, selectedDoctorId);
      const doctor = doctors.find((d) => d.id === selectedDoctorId);
      setShareSuccess(`Report sent to ${doctor?.name ?? "the doctor"} successfully.`);
    } catch {
      setShareError("Failed to share report. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const MilestoneBar = ({ label, value, status }: { label: string; value: number; status: string }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="font-headline font-bold text-base text-on-surface">{label}</span>
        <span className="text-primary font-extrabold text-[10px] uppercase tracking-widest">{status}</span>
      </div>
      <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-secondary to-secondary-fixed-dim"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium animate-pulse">Analyzing results...</p>
        </div>
      </div>
    );
  }

  // No results to show — either the page was opened without a valid session, or the
  // fetch failed and there's nothing in the store. Never fabricate placeholder data.
  if (!displayResults) {
    return (
      <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center max-w-3xl mx-auto px-6 py-32 w-full">
          <EmptyState
            icon="science"
            title={sessionId ? "We couldn't load this screening" : "No screening results yet"}
            description={
              sessionId
                ? "This screening may still be processing, or the link may be invalid. Try again from your history."
                : "Run a quick screening to see your child's developmental insights here."
            }
            action={
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => router.push("/assessment")}>Start a screening</Button>
                <Button variant="outline" onClick={() => router.push("/dashboard/parent/history")}>
                  View history
                </Button>
              </div>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
        {/* Clinical disclaimer — prominent, always visible, never dismissible */}
        <Alert
          variant="warning"
          title="Preliminary screening — not a diagnosis"
          className="mb-10"
        >
          This AI-assisted screening highlights behavioral patterns to discuss with a professional. It does
          not diagnose autism or any condition. Always review these results with a qualified pediatrician or
          developmental specialist.
        </Alert>

        {/* Page header */}
        <div className="mb-12">
          <h2 className="font-headline font-extrabold text-4xl sm:text-6xl text-primary leading-tight mb-3 tracking-tighter">
            Discovery Results
          </h2>
          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl font-medium opacity-80">
            A detailed overview of {session?.child?.name ?? "your child"}&apos;s developmental screening.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Main column ── */}
          <div className="lg:col-span-8 space-y-8">

            {/* Risk summary card */}
            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-xl">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${
                  riskLabel === "low" ? "bg-secondary-container" :
                  riskLabel === "medium" ? "bg-tertiary-container" :
                  "bg-error/10"
                }`}>
                  <span className={`font-headline font-extrabold text-2xl ${
                    riskLabel === "low" ? "text-secondary" :
                    riskLabel === "medium" ? "text-tertiary" :
                    "text-error"
                  }`}>
                    {`${Math.round(displayResults.riskScore)}%`}
                  </span>
                </div>
                <div>
                  <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-block mb-2 shadow-sm">
                    Analysis Complete
                  </span>
                  <h3 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight capitalize">
                    {riskLabel.replace("_", " ")} Risk Level
                  </h3>
                  <p className="text-xs text-on-surface-muted mt-1">ML model v{displayResults.modelVersion}</p>
                </div>
              </div>
            </div>

            {/* AI Observation Summary */}
            <div className="bg-surface-container-lowest rounded-3xl p-8 border-t-4 border-primary shadow-lg">
              <h4 className="font-headline font-extrabold text-2xl mb-8 text-on-surface tracking-tight">
                AI Observation Summary
              </h4>
              <div className="space-y-8">
                <MilestoneBar
                  label="Eye Contact"
                  value={displayResults.behaviors.EyeContact ?? displayResults.behaviors.eye_contact ?? 0}
                  status={(displayResults.behaviors.EyeContact ?? displayResults.behaviors.eye_contact ?? 0) > 80 ? "Typical" : "Developing"}
                />
                <MilestoneBar
                  label="Joint Attention"
                  value={displayResults.behaviors.JointAttention ?? displayResults.behaviors.attention_span ?? 0}
                  status={(displayResults.behaviors.JointAttention ?? displayResults.behaviors.attention_span ?? 0) > 80 ? "Typical" : "Developing"}
                />
                <MilestoneBar
                  label="Facial Expression"
                  value={displayResults.behaviors.FacialExpression ?? displayResults.behaviors.emotion_signals ?? 0}
                  status={(displayResults.behaviors.FacialExpression ?? displayResults.behaviors.emotion_signals ?? 0) > 80 ? "Typical" : "Developing"}
                />
              </div>
              <div className="mt-6 p-4 bg-surface-container-low rounded-2xl flex items-start gap-3 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg shrink-0">info</span>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-70">
                  These results are based on AI observations. Always review with a qualified pediatrician or developmental specialist.
                </p>
              </div>
            </div>

            {/* Strengths & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-secondary-container/40 rounded-3xl p-8 border border-secondary/10 shadow-sm">
                <span className="material-symbols-outlined text-secondary text-4xl mb-4 block">lightbulb</span>
                <h5 className="font-headline font-bold text-xl mb-4 text-on-secondary-fixed">Key Strengths</h5>
                <ul className="space-y-3">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-on-secondary-container font-medium opacity-80">
                      <span className="material-symbols-outlined text-secondary text-sm mt-0.5 shrink-0">check_circle</span>
                      <span className="text-xs leading-relaxed">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-tertiary-container/40 rounded-3xl p-8 border border-tertiary/10 shadow-sm">
                <span className="material-symbols-outlined text-tertiary text-4xl mb-4 block">support_agent</span>
                <h5 className="font-headline font-bold text-xl mb-4 text-on-tertiary-fixed">Recommendations</h5>
                <ul className="space-y-3">
                  {(displayResults?.recommendations?.length ? displayResults.recommendations : [
                    "Consult a developmental pediatrician",
                    "Consider early intervention services",
                    "Monitor developmental milestones monthly",
                  ]).map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-on-tertiary-container font-medium opacity-80">
                      <span className="material-symbols-outlined text-tertiary text-sm mt-0.5 shrink-0">arrow_forward</span>
                      <span className="text-xs leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Sidebar column ── */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Next steps */}
            <div className="bg-primary text-on-primary rounded-3xl p-8 shadow-2xl border border-white/10">
              <h4 className="font-headline font-bold text-2xl mb-3 tracking-tight">Next Steps</h4>
              <p className="mb-6 opacity-80 leading-relaxed font-medium text-sm">
                Discuss these results with a certified child development specialist.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/professionals")}
                  className="bg-white text-primary font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-surface-bright transition-all shadow-lg active:scale-95 text-[10px] uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  Book Consultation
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={downloading || !sessionId}
                  className="bg-primary-dim text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-black/20 transition-all border border-white/20 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  {downloading ? "Generating…" : "Download PDF"}
                </button>
              </div>
              <div className="mt-6 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-tertiary-fixed text-sm">shield_with_heart</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">HIPAA Secured</span>
              </div>
            </div>

            {/* Share with Doctor */}
            <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">send</span>
                <h5 className="font-headline font-bold text-base text-on-surface">Share with a Doctor</h5>
              </div>

              {!sessionId ? (
                <p className="text-xs text-on-surface-muted">Complete a screening session first to share results.</p>
              ) : shareSuccess ? (
                <div className="flex items-start gap-2 bg-secondary-container/40 p-3 rounded-xl">
                  <span className="material-symbols-outlined text-secondary text-lg shrink-0">check_circle</span>
                  <p className="text-xs text-on-secondary-container font-medium">{shareSuccess}</p>
                </div>
              ) : (
                <>
                  {doctors.length === 0 ? (
                    <p className="text-xs text-on-surface-muted">No registered doctors available yet.</p>
                  ) : (
                    <>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm text-on-surface mb-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select a doctor…</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleShareWithDoctor}
                        disabled={!selectedDoctorId || sharing}
                        className="w-full bg-primary text-on-primary font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-sm">send</span>
                        {sharing ? "Sending…" : "Send Report"}
                      </button>
                      {shareError && (
                        <p className="text-xs text-error mt-2">{shareError}</p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Curated Resources */}
        <div className="mt-24 sm:mt-32">
          <h3 className="font-headline font-extrabold text-3xl sm:text-5xl mb-10 tracking-tighter text-primary">
            Curated Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((res, i) => (
              <div key={i} className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
                <span className="material-symbols-outlined text-primary text-4xl mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {res.icon}
                </span>
                <h4 className="font-headline font-bold text-lg mb-2 text-on-surface tracking-tight">{res.title}</h4>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed opacity-70">{res.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
