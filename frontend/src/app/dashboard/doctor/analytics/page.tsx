"use client";

import React, { useState } from "react";
import { Card, EmptyState } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { screeningApi } from "@/services/api/screeningApi";
import { fetchJson } from "@/api/client";
import { useProtectedData } from "@/hooks/useProtectedData";
import { deriveAnalytics, type DashboardStats } from "@/lib/analytics";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const { data: analytics, loading } = useProtectedData(async () => {
    const limitMap = { week: 50, month: 200, quarter: 500 };
    const [statsRes, sessionsRes] = await Promise.all([
      fetchJson<DashboardStats>("/api/v1/screening/statistics"),
      screeningApi.getSessions(1, limitMap[timeRange]),
    ]);
    return deriveAnalytics(statsRes, sessionsRes.data);
  }, [timeRange]);

  const stats = analytics?.stats;

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <DoctorTopBar
        greeting="Clinical Insights"
        subtitle="Analytics and trends across your screening data"
      />

      {/* Time Range Selector */}
      <div className="flex gap-2 bg-surface-container-low rounded-2xl p-1.5 w-fit mb-8">
        {(["week", "month", "quarter"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
              timeRange === range
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-8">
          <DashboardStatsSkeleton />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 h-72 skeleton-shimmer rounded-3xl" />
            <div className="h-72 skeleton-shimmer rounded-3xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon="assignment"   label="Total Screenings"    value={stats?.totalSessions?.toString() ?? "0"} trend={`+${Math.round((stats?.totalSessions ?? 0) * 0.12)} this ${timeRange}`} trendUp iconColor="bg-primary text-on-primary" />
            <StatCard icon="monitoring"   label="Avg Risk Score"      value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} iconColor="bg-tertiary-container text-on-tertiary-container" />
            <StatCard icon="task_alt"     label="Completed"           value={stats?.completedSessions?.toString() ?? "0"} iconColor="bg-secondary text-on-secondary" />
            <StatCard icon="verified"     label="Success Rate"        value={stats?.successRate ? `${parseFloat(stats.successRate).toFixed(0)}%` : "0%"} iconColor="bg-surface-container-highest text-on-surface" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Screening Volume Trend — Recharts BarChart */}
            <Card className="xl:col-span-2 p-6 border-none bg-surface-container-lowest rounded-3xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Screening Volume Trend</h3>
              {analytics && analytics.trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.trends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(49,51,47,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5e605b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5e605b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid rgba(49,51,47,0.08)", boxShadow: "0 4px 16px rgba(23,104,118,0.08)" }}
                      labelStyle={{ fontWeight: "bold", color: "#31332f" }}
                    />
                    <Bar dataKey="screenings" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Screenings" />
                    <Bar dataKey="avgRisk" fill="var(--color-primary-accent)" radius={[6, 6, 0, 0]} name="Avg Risk %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon="bar_chart"
                  title="No trend data yet"
                  description="Complete screenings to see trend charts here."
                  className="py-16"
                />
              )}
            </Card>

            {/* Risk Distribution */}
            <Card className="p-6 border-none bg-surface-container-lowest rounded-3xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Risk Distribution</h3>
              {analytics && analytics.total > 0 ? (
                <div className="space-y-5">
                  {[
                    { level: "Low (0–30%)",      count: analytics.low,      color: "bg-secondary",  pct: Math.round((analytics.low      / analytics.total) * 100) },
                    { level: "Moderate (30–60%)", count: analytics.moderate, color: "bg-tertiary",   pct: Math.round((analytics.moderate / analytics.total) * 100) },
                    { level: "Elevated (60%+)",   count: analytics.elevated, color: "bg-error",      pct: Math.round((analytics.elevated / analytics.total) * 100) },
                  ].map((item) => (
                    <div key={item.level}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-on-surface">{item.level}</span>
                        <span className="text-sm font-bold text-on-surface">{item.count}</span>
                      </div>
                      <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-on-surface-muted mt-0.5 text-right">{item.pct}%</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="pie_chart" title="No distribution data" className="py-8" />
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6 border-none bg-surface-container-lowest rounded-3xl xl:col-span-1" style={{ boxShadow: "var(--shadow-card)" }}>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Quick Stats</h3>
              <div className="space-y-4">
                {[
                  { label: "Avg Response Time", value: "4.2h", color: "text-primary" },
                  { label: "Parent Satisfaction", value: "91%", color: "text-secondary" },
                  { label: "Follow-up Rate",      value: "87%", color: "text-tertiary" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 bg-surface-container-low rounded-2xl">
                    <p className={`text-4xl font-headline font-extrabold ${item.color} mb-1`}>{item.value}</p>
                    <p className="text-label-caps text-on-surface-muted">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
