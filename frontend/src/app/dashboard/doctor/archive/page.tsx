"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import { motion, useReducedMotion } from "framer-motion";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";
import { screeningApi, ScreeningSession } from "@/services/api/screeningApi";
import { useProtectedData } from "@/hooks/useProtectedData";

const FILTERS = ["All", "archived", "failed"] as const;
type FilterValue = typeof FILTERS[number];

const FILTER_LABELS: Record<FilterValue, string> = {
  All: "All",
  archived: "Archived",
  failed: "Failed",
};

export default function ArchivePage() {
  const { user } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterValue>("All");

  const { data, loading, error } = useProtectedData<ScreeningSession[]>(async () => {
    const res = await screeningApi.getSessions(1, 200);
    return res.data.filter((s) => s.status === "archived" || s.status === "failed");
  });

  const archives = data ?? [];

  const filteredArchives = archives.filter((record) => {
    const name = record.child?.name?.toLowerCase() ?? "";
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    if (status === "archived") return "bg-tertiary-container text-on-tertiary-container";
    if (status === "failed") return "bg-error-container text-on-error-container";
    return "bg-surface-container-high text-on-surface-variant";
  };

  const getRiskColor = (score: number | null) => {
    if (score === null) return "text-on-surface-variant";
    if (score < 30) return "text-secondary";
    if (score < 60) return "text-tertiary";
    return "text-error";
  };

  if (!user) return null;

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Archive
          </h2>
          <p className="text-on-surface-muted text-lg">
            {loading ? "Loading archive..." : `${archives.length} archived session records`}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search by patient name or session ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm shadow-inner"
          />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                statusFilter === status
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {FILTER_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Archives Table */}
      {error ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
          <p className="font-bold">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      ) : loading ? (
        <PatientListSkeleton rows={6} />
      ) : filteredArchives.length > 0 ? (
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Patient</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest hidden lg:table-cell">Archived</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest hidden sm:table-cell">Final Risk</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="text-right px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchives.map((record, i) => (
                  <motion.tr
                    key={record.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? undefined : { delay: Math.min(i * 0.05, 0.4) }}
                    className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-headline font-extrabold text-on-surface">{record.child?.name ?? "Unknown Patient"}</p>
                        <p className="text-[10px] text-on-surface-muted">{record.id.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className="text-sm text-on-surface-variant">
                        {new Date(record.completedAt ?? record.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-headline font-extrabold ${getRiskColor(record.riskScore)}`}>
                          {record.riskScore !== null ? `${record.riskScore.toFixed(0)}%` : "--"}
                        </span>
                        {record.riskLevel && (
                          <span className={`text-xs font-bold ${getRiskColor(record.riskScore)}`}>
                            {record.riskLevel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/results?sessionId=${record.id}`)}
                          className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            if (confirm(`Restore session for ${record.child?.name ?? "this patient"}? This will reactivate the record.`)) {
                              // TODO: wire to a restore endpoint when the backend supports it
                              console.warn("Restore not yet supported by API:", record.id);
                              alert("Restore feature coming soon.");
                            }
                          }}
                          className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                        >
                          Restore
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 bg-surface-container-low rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6 block">
            archive
          </span>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
            No Archived Sessions Found
          </h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {searchTerm || statusFilter !== "All"
              ? "No archived records match your search criteria."
              : "No sessions have been archived yet."}
          </p>
        </div>
      )}
    </div>
  );
}
