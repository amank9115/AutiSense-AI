"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui/StitchUI";
import { motion, useReducedMotion } from "framer-motion";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { screeningApi, ReportShare } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";
import { useQueryClient } from "@tanstack/react-query";

export default function ArchivePage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useProtectedQuery<ReportShare[]>(
    ["doctor", "reports", "reviewed"],
    async () => {
      const res = await screeningApi.getReceivedReports(1, 200, "reviewed");
      return (res as { data: ReportShare[] }).data ?? [];
    },
  );

  const archives = data ?? [];

  const filtered = archives.filter((r) => {
    const childName = (r.session?.child?.name ?? "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return childName.includes(term) || r.id.toLowerCase().includes(term);
  });

  const getRiskColor = (score: number | null) => {
    if (score === null) return "text-on-surface-variant";
    if (score < 30) return "text-secondary";
    if (score < 60) return "text-tertiary";
    return "text-error";
  };

  const handleRestore = async (share: ReportShare) => {
    const childName = share.session?.child?.name ?? "this patient";
    if (!confirm(`Reopen report for ${childName}? It will return to your pending queue.`)) return;
    setRestoringId(share.id);
    try {
      await screeningApi.reviewReport(share.id, share.doctorNotes ?? "", false, true);
      // Reopening moves the report back to pending — refresh archive + the
      // doctor dashboard/patients counts that depend on it.
      await queryClient.invalidateQueries({ queryKey: ["doctor"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore report.");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">Archive</h2>
          <p className="text-on-surface-muted text-lg">
            {loading ? "Loading archive…" : `${archives.length} reviewed report${archives.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input type="text" placeholder="Search by patient name or report ID…"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm shadow-inner" />
        </div>
      </div>

      {error ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
          <p className="font-bold">{error}</p>
          <Button variant="secondary" onClick={refetch} className="mt-4">Retry</Button>
        </div>
      ) : loading ? (
        <PatientListSkeleton rows={6} />
      ) : filtered.length > 0 ? (
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Patient</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest hidden lg:table-cell">Reviewed</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest hidden sm:table-cell">Risk Score</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Parent</th>
                  <th className="text-right px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => {
                  const session = record.session;
                  const riskScore =
                    (session?.results?.riskScore as number | undefined) ?? session?.riskScore ?? null;
                  return (
                    <motion.tr key={record.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                      transition={shouldReduceMotion ? undefined : { delay: Math.min(i * 0.05, 0.4) }}
                      className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-headline font-extrabold text-on-surface">{session?.child?.name ?? "Unknown"}</p>
                        <p className="text-[10px] text-on-surface-muted">{record.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-5 hidden lg:table-cell text-sm text-on-surface-variant">
                        {record.reviewedAt ? new Date(record.reviewedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-5 hidden sm:table-cell">
                        <span className={`text-lg font-headline font-extrabold ${getRiskColor(riskScore)}`}>
                          {riskScore !== null ? `${Math.round(riskScore)}%` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{record.sharedBy?.name ?? "—"}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline"
                            onClick={() => router.push(`/dashboard/doctor/reports/${record.id}`)}
                            className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest">
                            View
                          </Button>
                          <Button variant="primary"
                            disabled={restoringId === record.id}
                            onClick={() => handleRestore(record)}
                            className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest">
                            {restoringId === record.id ? "…" : "Reopen"}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 bg-surface-container-low rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6 block">archive</span>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">No Archived Reports</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {searchTerm ? "No reports match your search." : "Reports you mark as reviewed will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
