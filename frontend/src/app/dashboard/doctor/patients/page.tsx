"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui/StitchUI";
import { motion, useReducedMotion } from "framer-motion";
import { screeningApi, DoctorPatient } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { CardGridSkeleton } from "@/components/ui/SkeletonLoader";
import { calculateAge } from "@/lib/date";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

const PAGE_SIZE = 12;

export default function PatientsPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Debounce search input 300ms
  useEffect(() => {
    const id = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [riskFilter, statusFilter]);

  const { data, loading } = useProtectedQuery<DoctorPatient[]>(
    ["doctor", "patients"],
    () => screeningApi.getDoctorPatients(),
  );
  const patients = data ?? [];

  const filtered = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      (p.parent.name ?? "").toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term);
    const pRisk = (p.latest.riskLevel ?? "none").toLowerCase();
    const pStatus = p.latest.status;
    const matchRisk   = riskFilter === "All"   || pRisk === riskFilter.toLowerCase();
    const matchStatus = statusFilter === "All" || pStatus === statusFilter;
    return matchSearch && matchRisk && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-4xl lg:text-5xl text-on-surface tracking-tighter mb-2">Patient List</h2>
          <p className="text-on-surface-muted text-lg">
            {loading ? "Loading patients…" : `${filtered.length} patient${filtered.length !== 1 ? "s" : ""} under your care`}
          </p>
          {!loading && filtered.length > PAGE_SIZE && (
            <p className="text-xs text-on-surface-variant mt-1">
              Page {page} of {totalPages}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low rounded-3xl p-5 mb-8 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full">
          <Input
            className="w-full pl-12 bg-surface-container-highest border-none rounded-2xl shadow-inner"
            placeholder="Search by name or parent…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner cursor-pointer">
            <option value="All">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Moderate Risk</option>
            <option value="high">Elevated Risk</option>
            <option value="very_high">High Risk</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner cursor-pointer">
            <option value="All">All Status</option>
            <option value="pending">Pending Review</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton cols={3} cards={6} />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginated.map((patient) => {
            const hasReport = !!patient.latest.shareId;

            return (
              <motion.div key={patient.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}>
                <Card className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 cursor-pointer group"
                  onClick={() => hasReport && router.push(`/dashboard/doctor/reports/${patient.latest.shareId}`)}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary font-headline font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform shrink-0">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="grow">
                      <h4 className="font-headline font-extrabold text-lg text-on-surface group-hover:text-primary transition-colors">
                        {patient.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                        <span>{patient.id.slice(0, 8)}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{calculateAge(patient.dateOfBirth)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Parent:</span>
                      <span className="font-bold text-on-surface">{patient.parent.name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Shared:</span>
                      <span className="font-bold text-on-surface">{new Date(patient.latest.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-4">
                    <RiskBadge level={patient.latest.riskLevel} />
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                      patient.latest.status === "reviewed"
                        ? "bg-secondary-container text-on-secondary-container"
                        : "bg-tertiary-container text-on-tertiary-container"
                    }`}>
                      {patient.latest.status === "reviewed" ? "Reviewed" : "Pending Review"}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/10 flex gap-3">
                    <Button variant="outline"
                      onClick={(e) => { e.stopPropagation(); if (hasReport) router.push(`/dashboard/doctor/reports/${patient.latest.shareId}`); }}
                      disabled={!hasReport}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                      title={hasReport ? "Review report" : "No report shared yet"}>
                      {hasReport ? "View Report" : "No Report"}
                    </Button>
                    <Button variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/doctor/appointments?childId=${patient.id}`);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest">
                      Schedule
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-container-low rounded-3xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6 block">person_search</span>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">No Patients Found</h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            {searchTerm || riskFilter !== "All" || statusFilter !== "All"
              ? "No patients match your filters."
              : "No reports have been shared with you yet. Parents share reports after completing screenings."}
          </p>
          {(searchTerm || riskFilter !== "All" || statusFilter !== "All") && (
            <Button variant="primary" onClick={() => { setSearchInput(""); setSearchTerm(""); setRiskFilter("All"); setStatusFilter("All"); }} className="px-8 py-4 rounded-2xl font-bold">
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                p === page
                  ? "bg-primary text-on-primary shadow-md"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface disabled:opacity-30 hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
