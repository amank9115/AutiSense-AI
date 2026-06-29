"use client";

import React from "react";
import { Card, EmptyState, Button } from "@/components/ui/StitchUI";
import { DashboardStatsSkeleton } from "@/components/ui/SkeletonLoader";
import { StatCard } from "@/components/dashboard/StatCard";
import { DoctorTopBar } from "@/components/layout/DoctorTopBar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { screeningApi, DoctorStatistics } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function AnalyticsPage() {
  const { data: stats, loading, error } = useProtectedQuery<DoctorStatistics>(
    ["doctor", "statistics"],
    () => screeningApi.getDoctorStatistics(),
  );

  const distTotal = (stats?.riskDistribution.low ?? 0) +
    (stats?.riskDistribution.moderate ?? 0) +
    (stats?.riskDistribution.high ?? 0);

  const pct = (n: number) => distTotal > 0 ? Math.round((n / distTotal) * 100) : 0;

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      <DoctorTopBar
        greeting="Clinical Insights"
        subtitle="Analytics across reports shared with you"
      />

      {error ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl">
          <p className="font-bold">Failed to load analytics</p>
          <p className="text-sm mt-1 opacity-80">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      ) : loading ? (
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
            <StatCard icon="folder_shared"   label="Total Reports"   value={stats?.totalReports?.toString() ?? "0"}           iconColor="bg-primary text-on-primary" />
            <StatCard icon="monitoring"      label="Avg Risk Score"  value={stats?.averageRiskScore ? `${stats.averageRiskScore.toFixed(1)}%` : "0%"} iconColor="bg-tertiary-container text-on-tertiary-container" />
            <StatCard icon="task_alt"        label="Reviewed"        value={stats?.reviewedReports?.toString() ?? "0"}         iconColor="bg-secondary text-on-secondary" />
            <StatCard icon="verified"        label="Review Rate"     value={stats?.reviewRate != null ? `${Math.round(stats.reviewRate)}%` : "0%"} iconColor="bg-surface-container-highest text-on-surface" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Monthly Trend */}
            <Card className="xl:col-span-2 p-6 border-none bg-surface-container-lowest rounded-3xl shadow-card">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Report Volume Trend (Last 6 Months)</h3>
              {stats?.monthlyTrend && stats.monthlyTrend.some((b) => b.count > 0) ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(49,51,47,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5e605b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5e605b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid rgba(49,51,47,0.08)", boxShadow: "0 4px 16px rgba(23,104,118,0.08)" }}
                      labelStyle={{ fontWeight: "bold", color: "#31332f" }}
                    />
                    <Bar dataKey="count"   fill="var(--color-primary)"        radius={[6,6,0,0]} name="Reports" />
                    <Bar dataKey="avgRisk" fill="var(--color-primary-accent)"  radius={[6,6,0,0]} name="Avg Risk %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="bar_chart" title="No trend data yet" description="Complete report reviews to see trend charts here." className="py-16" />
              )}
            </Card>

            {/* Risk Distribution */}
            <Card className="p-6 border-none bg-surface-container-lowest rounded-3xl shadow-card">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Risk Distribution</h3>
              {distTotal > 0 ? (
                <div className="space-y-5">
                  {[
                    { level: "Low (0–30%)",      count: stats?.riskDistribution.low ?? 0,      color: "bg-secondary", pct: pct(stats?.riskDistribution.low ?? 0) },
                    { level: "Moderate (30–60%)", count: stats?.riskDistribution.moderate ?? 0, color: "bg-tertiary",  pct: pct(stats?.riskDistribution.moderate ?? 0) },
                    { level: "Elevated (60%+)",   count: stats?.riskDistribution.high ?? 0,     color: "bg-error",     pct: pct(stats?.riskDistribution.high ?? 0) },
                  ].map((item) => (
                    <div key={item.level}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-on-surface">{item.level}</span>
                        <span className="text-sm font-bold text-on-surface">{item.count}</span>
                      </div>
                      <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
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
            <Card className="p-6 border-none bg-surface-container-lowest rounded-3xl xl:col-span-1 shadow-card">
              <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Quick Stats</h3>
              <div className="space-y-4">
                {[
                  { label: "Low Risk Cases",     value: `${pct(stats?.riskDistribution.low ?? 0)}%`,     color: "text-secondary" },
                  { label: "Elevated Risk Cases", value: `${pct(stats?.riskDistribution.high ?? 0)}%`,    color: "text-error" },
                  { label: "Total Patients",      value: String(stats?.totalPatients ?? 0),               color: "text-primary" },
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
