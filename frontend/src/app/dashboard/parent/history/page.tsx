"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import Image from "next/image";
import { screeningApi, ScreeningSession } from "@/services/api/screeningApi";

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIdFilter = searchParams?.get("childId");

  const [history, setHistory] = useState<ScreeningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await screeningApi.getSessions();
        let data = response.data;
        if (childIdFilter) {
          data = data.filter(s => s.childId === childIdFilter);
        }
        setHistory(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load screening history";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, router, childIdFilter]);

  if (!user) return null;

  const filteredHistory = history.filter((record) => {
    const matchesSearch =
      record.child?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || record.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (score: number | null) => {
    if (score === null) return "text-on-surface-variant";
    if (score < 30) return "text-secondary";
    if (score < 60) return "text-tertiary";
    return "text-error";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-secondary-container text-on-secondary-container";
      case "pending":
        return "bg-tertiary-container text-on-tertiary-container";
      case "failed":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container-high text-on-surface-variant";
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
          {loading ? "Loading sessions..." : `Showing ${filteredHistory.length} of ${history.length} sessions`}
        </p>

        {/* Session Cards */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant text-sm font-medium animate-pulse">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
            <p className="font-bold">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="space-y-4">
            {filteredHistory.map((record) => (
              <Card
                key={record.id}
                className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/results?sessionId=${record.id}`)}
              >
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  {/* Risk Score Circle */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-20 h-20 rounded-full border-4 ${
                        record.riskScore === null
                          ? "border-outline-variant text-on-surface-variant"
                          : record.riskScore < 30
                          ? "border-secondary text-secondary"
                          : record.riskScore < 60
                          ? "border-tertiary text-tertiary"
                          : "border-error text-error"
                      } flex flex-col items-center justify-center shadow-md`}
                    >
                      <span className="text-xs font-bold opacity-60">Risk</span>
                      <span className="text-2xl font-headline font-extrabold">
                        {record.riskScore !== null ? `${record.riskScore.toFixed(0)}%` : "--"}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-headline font-extrabold text-xl text-on-surface">
                        Session {record.id.slice(0, 8)}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-surface-container-high text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                        {record.child?.name || "Unknown"}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-4">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {new Date(record.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`flex items-center gap-1.5 font-bold ${getRiskColor(record.riskScore)}`}>
                        <span className="material-symbols-outlined text-base">analytics</span>
                        {record.riskLevel || "N/A"} Risk
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 lg:ml-auto">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/results?sessionId=${record.id}`);
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                    >
                      View Results
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
    </div>
  );
}