"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import { motion } from "framer-motion";

interface ArchivedRecord {
  id: string;
  patientName: string;
  parentName: string;
  archivedDate: string;
  reason: string;
  finalRiskScore: number;
  finalRiskLabel: string;
  status: "Archived - Completed" | "Archived - Transferred" | "Archived - Inactive";
}

const mockArchives: ArchivedRecord[] = [
  {
    id: "ARCH-001",
    patientName: "Sophie Chen",
    parentName: "Emily Chen",
    archivedDate: "May 15, 2026",
    reason: "Care transferred to Dr. Williams",
    finalRiskScore: 0.18,
    finalRiskLabel: "Low",
    status: "Archived - Transferred",
  },
  {
    id: "ARCH-002",
    patientName: "Liam Patel",
    parentName: "Anita Patel",
    archivedDate: "Apr 28, 2026",
    reason: "No activity for 90+ days",
    finalRiskScore: 0.31,
    finalRiskLabel: "Low",
    status: "Archived - Inactive",
  },
  {
    id: "ARCH-003",
    patientName: "Emma Rodriguez",
    parentName: "Carlos Rodriguez",
    archivedDate: "Apr 10, 2026",
    reason: "Treatment completed successfully",
    finalRiskScore: 0.12,
    finalRiskLabel: "Low",
    status: "Archived - Completed",
  },
  {
    id: "ARCH-004",
    patientName: "Oliver Kim",
    parentName: "Jennifer Kim",
    archivedDate: "Mar 25, 2026",
    reason: "Care transferred to specialist clinic",
    finalRiskScore: 0.45,
    finalRiskLabel: "Moderate",
    status: "Archived - Transferred",
  },
  {
    id: "ARCH-005",
    patientName: "Isabella Torres",
    parentName: "Maria Torres",
    archivedDate: "Mar 15, 2026",
    reason: "Family relocated",
    finalRiskScore: 0.22,
    finalRiskLabel: "Low",
    status: "Archived - Transferred",
  },
];

export default function ArchivePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [archives] = useState<ArchivedRecord[]>(mockArchives);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Completed" | "Transferred" | "Inactive">("All");

  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredArchives = archives.filter((record) => {
    const matchesSearch =
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status.includes(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ArchivedRecord["status"]) => {
    if (status.includes("Completed")) return "bg-secondary-container text-on-secondary-container";
    if (status.includes("Transferred")) return "bg-tertiary-container text-on-tertiary-container";
    return "bg-surface-container-high text-on-surface-variant";
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "text-secondary";
    if (score < 0.6) return "text-tertiary";
    return "text-error";
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased lg:ml-80 p-6 lg:p-10 xl:p-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Archive
          </h2>
          <p className="text-on-surface-variant font-medium text-lg opacity-60">
            {archives.length} archived patient records
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
            placeholder="Search by name or archive ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm shadow-inner"
          />
        </div>

        <div className="flex gap-2">
          {(["All", "Completed", "Transferred", "Inactive"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                statusFilter === status
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Archives Table */}
      {filteredArchives.length > 0 ? (
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Patient</th>
                  <th className="text-left px-6 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest hidden md:table-cell">Parent</th>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-outline-variant/10 hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-headline font-extrabold text-on-surface">{record.patientName}</p>
                        <p className="text-[10px] text-on-surface-variant opacity-60">{record.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <span className="font-medium text-on-surface">{record.parentName}</span>
                    </td>
                    <td className="px-6 py-5 hidden lg:table-cell">
                      <span className="text-sm text-on-surface-variant">{record.archivedDate}</span>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-headline font-extrabold ${getRiskColor(record.finalRiskScore)}`}>
                          {(record.finalRiskScore * 100).toFixed(0)}%
                        </span>
                        <span className={`text-xs font-bold ${
                          record.finalRiskLabel === "Low" ? "text-secondary" : record.finalRiskLabel === "Moderate" ? "text-tertiary" : "text-error"
                        }`}>
                          {record.finalRiskLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${getStatusColor(record.status)}`}>
                        {record.status.replace("Archived - ", "")}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/reports/${record.id}`)}
                          className="py-2 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                        >
                          View
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => alert(`Reactivating record for ${record.patientName}...`)}
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
            No Archives Found
          </h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            {searchTerm || statusFilter !== "All"
              ? "No archived records match your search criteria."
              : "No patient records have been archived yet."}
          </p>
        </div>
      )}
    </div>
  );
}