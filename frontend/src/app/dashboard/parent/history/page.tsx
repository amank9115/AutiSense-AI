"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import { Navbar, Footer } from "@/components/layout/Navigation";
import Image from "next/image";

interface SessionRecord {
  id: string;
  childName: string;
  date: string;
  duration: string;
  riskScore: number;
  riskLabel: string;
  status: "Reviewed" | "Pending" | "Escalated";
  summary: string;
}

const mockHistory: SessionRecord[] = [
  {
    id: "S-9841",
    childName: "Aarav Sharma",
    date: "May 28, 2026",
    duration: "~8 mins",
    riskScore: 0.24,
    riskLabel: "Low",
    status: "Reviewed",
    summary: "Good eye contact and social responsiveness observed. Sensory preferences include visual stimuli.",
  },
  {
    id: "S-9825",
    childName: "Aarav Sharma",
    date: "May 15, 2026",
    duration: "~10 mins",
    riskScore: 0.31,
    riskLabel: "Low",
    status: "Reviewed",
    summary: "Steady progress noted. Joint attention behaviors improving with structured prompts.",
  },
  {
    id: "S-9790",
    childName: "Mira Sharma",
    date: "Apr 30, 2026",
    duration: "~7 mins",
    riskScore: 0.18,
    riskLabel: "Low",
    status: "Reviewed",
    summary: "Excellent engagement with facial expression exercises. Name response within typical range.",
  },
  {
    id: "S-9705",
    childName: "Aarav Sharma",
    date: "Apr 15, 2026",
    duration: "~12 mins",
    riskScore: 0.42,
    riskLabel: "Moderate",
    status: "Reviewed",
    summary: "Some delay in joint attention noted. Recommend follow-up with occupational therapist.",
  },
  {
    id: "S-9620",
    childName: "Aarav Sharma",
    date: "Mar 28, 2026",
    duration: "~9 mins",
    riskScore: 0.15,
    riskLabel: "Low",
    status: "Reviewed",
    summary: "First screening session. Baseline established. Strong pattern recognition observed.",
  },
];

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [history] = useState<SessionRecord[]>(mockHistory);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Reviewed" | "Pending" | "Escalated">("All");

  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredHistory = history.filter((record) => {
    const matchesSearch =
      record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (score: number) => {
    if (score < 0.3) return "text-secondary";
    if (score < 0.6) return "text-tertiary";
    return "text-error";
  };

  const getStatusColor = (status: SessionRecord["status"]) => {
    switch (status) {
      case "Reviewed":
        return "bg-secondary-container text-on-secondary-container";
      case "Pending":
        return "bg-tertiary-container text-on-tertiary-container";
      case "Escalated":
        return "bg-error-container text-on-error-container";
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">
            Screening History
          </h1>
          <p className="text-on-surface-variant font-medium">
            Review past screening sessions and track developmental progress over time.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search by child name, session ID, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["All", "Reviewed", "Pending", "Escalated"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                  statusFilter === status
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-on-surface-variant mb-6 font-medium">
          Showing {filteredHistory.length} of {history.length} sessions
        </p>

        {/* Session Cards */}
        {filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((record) => (
              <Card
                key={record.id}
                className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/reports/${record.id}`)}
              >
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Risk Score Circle */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-20 h-20 rounded-full border-4 ${
                        record.riskScore < 0.3
                          ? "border-secondary text-secondary"
                          : record.riskScore < 0.6
                          ? "border-tertiary text-tertiary"
                          : "border-error text-error"
                      } flex flex-col items-center justify-center shadow-md`}
                    >
                      <span className="text-xs font-bold opacity-60">Risk</span>
                      <span className="text-2xl font-headline font-extrabold">
                        {(record.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-headline font-extrabold text-xl text-on-surface">
                        Session {record.id}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-surface-container-high text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                        {record.childName}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-4">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {record.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {record.duration}
                      </span>
                      <span className={`flex items-center gap-1.5 font-bold ${getRiskColor(record.riskScore)}`}>
                        <span className="material-symbols-outlined text-base">analytics</span>
                        {record.riskLabel} Risk
                      </span>
                    </div>

                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {record.summary}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 lg:ml-auto">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reports/${record.id}`);
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                history
              </span>
            </div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
              No Sessions Found
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              {searchTerm || statusFilter !== "All"
                ? "No sessions match your search criteria. Try adjusting your filters."
                : "No screening sessions have been recorded yet."}
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/screening")}
              className="px-8 py-4 rounded-xl font-bold"
            >
              Start First Screening
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}