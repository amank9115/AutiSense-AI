"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/StitchUI";

interface InsightMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
}

interface ScreeningTrend {
  month: string;
  screenings: number;
  avgRisk: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push("/login");
    return null;
  }

  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  const insights: InsightMetric[] = [
    { label: "Total Screenings", value: "1,284", change: "+12%", trend: "up" },
    { label: "Avg Risk Score", value: "34%", change: "-5%", trend: "down" },
    { label: "Diagnostic Yield", value: "94%", change: "+2%", trend: "up" },
    { label: "Sessions This Week", value: "42", change: "+8", trend: "up" },
  ];

  const screeningTrends: ScreeningTrend[] = [
    { month: "Jan", screenings: 89, avgRisk: 42 },
    { month: "Feb", screenings: 112, avgRisk: 39 },
    { month: "Mar", screenings: 98, avgRisk: 41 },
    { month: "Apr", screenings: 145, avgRisk: 36 },
    { month: "May", screenings: 168, avgRisk: 34 },
    { month: "Jun", screenings: 124, avgRisk: 32 },
  ];

  const riskDistribution = [
    { level: "Low (0-30%)", count: 845, percentage: 66, color: "bg-secondary" },
    { level: "Moderate (30-60%)", count: 321, percentage: 25, color: "bg-tertiary" },
    { level: "Elevated (60%+)", count: 118, percentage: 9, color: "bg-error" },
  ];

  const topIndicators = [
    { indicator: "Eye Contact Difficulty", cases: 234, trend: "+15%" },
    { indicator: "Joint Attention Gaps", cases: 189, trend: "+8%" },
    { indicator: "Sensory Preferences", cases: 156, trend: "+22%" },
    { indicator: "Social Reciprocity", cases: 142, trend: "+5%" },
    { indicator: "Motor Stereotypies", cases: 98, trend: "-3%" },
  ];

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased lg:ml-80 p-6 lg:p-10 xl:p-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Clinical Insights
          </h2>
          <p className="text-on-surface-variant font-medium text-lg opacity-60">
            Analytics and trends across your screening data
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-surface-container-low rounded-2xl p-1.5">
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
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {insights.map((metric, i) => (
          <Card key={i} className="p-6 border-none bg-surface-container-low hover:bg-surface-container transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest opacity-60">
                {metric.label}
              </span>
              <span
                className={`material-symbols-outlined text-sm ${
                  metric.trend === "up"
                    ? "text-secondary"
                    : metric.trend === "down"
                    ? "text-secondary"
                    : "text-on-surface-variant"
                }`}
              >
                {metric.trend === "up" ? "trending_up" : metric.trend === "down" ? "trending_down" : "trending_flat"}
              </span>
            </div>
            <p className="text-4xl font-headline font-extrabold text-on-surface mb-2">
              {metric.value}
            </p>
            <span className={`text-xs font-bold ${
              metric.trend === "up" && metric.label !== "Avg Risk Score" ? "text-secondary" : "text-primary"
            }`}>
              {metric.change} vs last {timeRange}
            </span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Screening Trends */}
        <Card className="xl:col-span-2 p-8 border-none bg-surface-container-low">
          <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-6">
            Screening Volume Trend
          </h3>
          <div className="space-y-4">
            {screeningTrends.map((month, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="w-10 text-sm font-bold text-on-surface-variant">{month.month}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant">{month.screenings} screenings</span>
                    <span className="text-xs font-bold text-primary">Avg Risk: {month.avgRisk}%</span>
                  </div>
                  <div className="h-6 bg-surface-container-high rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-lg transition-all duration-700"
                      style={{ width: `${(month.screenings / 200) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-8 border-none bg-surface-container-low">
          <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-6">
            Risk Distribution
          </h3>
          <div className="space-y-5">
            {riskDistribution.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-on-surface">{item.level}</span>
                  <span className="text-sm font-extrabold text-on-surface">{item.count}</span>
                </div>
                <div className="h-4 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-surface-container-high rounded-2xl">
            <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mb-2">
              Key Finding
            </p>
            <p className="text-sm text-on-surface font-medium leading-relaxed">
              66% of screenings show low risk indicators. Early intervention correlation: 87%.
            </p>
          </div>
        </Card>

        {/* Top Indicators */}
        <Card className="xl:col-span-2 p-8 border-none bg-surface-container-low">
          <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-6">
            Most Common Indicators
          </h3>
          <div className="space-y-4">
            {topIndicators.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl">
                <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <div className="flex-grow">
                  <span className="font-bold text-on-surface">{item.indicator}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-headline font-extrabold text-on-surface">{item.cases}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block">cases</span>
                </div>
                <span className={`text-xs font-extrabold ${
                  item.trend.startsWith("+") ? "text-secondary" : item.trend.startsWith("-") ? "text-error" : "text-on-surface-variant"
                }`}>
                  {item.trend}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-8 border-none bg-white rounded-[3rem] shadow-2xl">
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">
            Quick Stats
          </h3>
          <div className="space-y-6">
            <div className="text-center p-4 bg-surface-container-low rounded-2xl">
              <p className="text-5xl font-headline font-extrabold text-primary mb-2">4.2h</p>
              <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Avg Response Time</p>
            </div>
            <div className="text-center p-4 bg-surface-container-low rounded-2xl">
              <p className="text-5xl font-headline font-extrabold text-secondary mb-2">91%</p>
              <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Parent Satisfaction</p>
            </div>
            <div className="text-center p-4 bg-surface-container-low rounded-2xl">
              <p className="text-5xl font-headline font-extrabold text-tertiary mb-2">87%</p>
              <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Follow-up Rate</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}