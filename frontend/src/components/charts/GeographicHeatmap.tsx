"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RegionData {
  region: string;
  value: number;
  lat?: number;
  lng?: number;
}

interface GeographicHeatmapProps {
  data: RegionData[];
  metric: "screenings" | "riskScore" | "age";
  title?: string;
}

// Simplified India region map with approximate positions
const REGIONS = [
  { id: "maharashtra", name: "Maharashtra", x: 35, y: 55, path: "M35,55 L45,50 L50,60 L45,70 L35,65 Z" },
  { id: "karnataka", name: "Karnataka", x: 30, y: 68, path: "M30,68 L40,65 L45,75 L35,80 L25,75 Z" },
  { id: "tamilnadu", name: "Tamil Nadu", x: 38, y: 82, path: "M38,82 L48,78 L52,88 L42,92 L35,88 Z" },
  { id: "delhi", name: "Delhi", x: 42, y: 28, path: "M42,28 L47,26 L49,32 L44,34 L40,32 Z" },
  { id: "gujarat", name: "Gujarat", x: 22, y: 38, path: "M22,38 L32,35 L35,48 L25,52 L18,45 Z" },
  { id: "rajasthan", name: "Rajasthan", x: 32, y: 30, path: "M32,30 L48,28 L50,42 L35,48 L28,40 Z" },
  { id: "up", name: "Uttar Pradesh", x: 48, y: 35, path: "M48,35 L60,32 L62,45 L52,50 L46,42 Z" },
  { id: "bengal", name: "West Bengal", x: 68, y: 45, path: "M68,45 L75,42 L78,55 L70,60 L65,52 Z" },
  { id: "kerala", name: "Kerala", x: 30, y: 85, path: "M30,85 L35,82 L36,92 L28,94 L26,88 Z" },
  { id: "punjab", name: "Punjab", x: 40, y: 20, path: "M40,20 L48,18 L50,26 L42,28 L38,24 Z" },
];

/**
 * Geographic heatmap component for visualizing regional data
 */
const GeographicHeatmap: React.FC<GeographicHeatmapProps> = ({
  data,
  metric,
  title,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [animatedData, setAnimatedData] = useState<RegionData[]>([]);

  useEffect(() => {
    // Animate data values
    const timer = setTimeout(() => setAnimatedData(data), 100);
    return () => clearTimeout(timer);
  }, [data]);

  const getValueForRegion = (regionId: string): number => {
    const regionData = animatedData.find(
      (d) => d.region.toLowerCase().replace(" ", "") === regionId
    );
    return regionData?.value || 0;
  };

  const getColor = (value: number): string => {
    // Color scale based on metric
    if (metric === "riskScore") {
      if (value >= 70) return "#ef4444"; // high risk - red
      if (value >= 40) return "#f59e0b"; // moderate - amber
      return "#22c55e"; // low - green
    }

    // For screenings count
    const maxValue = Math.max(...animatedData.map((d) => d.value), 1);
    const intensity = value / maxValue;

    if (intensity >= 0.7) return "#176876"; // primary dark
    if (intensity >= 0.4) return "#5BA1B0"; // primary accent
    if (intensity > 0) return "#a7eefe"; // primary container
    return "#e5e8f0"; // neutral
  };

  const getMetricLabel = (): string => {
    switch (metric) {
      case "screenings":
        return "Total Screenings";
      case "riskScore":
        return "Avg Risk Score";
      case "age":
        return "Avg Age (months)";
      default:
        return "Value";
    }
  };

  const maxValue = Math.max(...animatedData.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface p-5">
      {title && (
        <h3 className="font-semibold text-on-surface mb-4">{title}</h3>
      )}

      <div className="relative w-full aspect-[3/4] max-h-[400px]">
        {/* Map container */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
        >
          {/* Background */}
          <rect x="0" y="0" width="100" height="100" fill="#f8fafc" rx="8" />

          {/* Region paths */}
          {REGIONS.map((region) => {
            const value = getValueForRegion(region.id);
            const color = getColor(value);
            const isHovered = hoveredRegion === region.id;

            return (
              <motion.path
                key={region.id}
                d={region.path}
                fill={color}
                stroke={isHovered ? "#0f172a" : "#cbd5e1"}
                strokeWidth={isHovered ? 1.5 : 0.5}
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                whileHover={{ scale: 1.02 }}
                style={{
                  transformOrigin: `${region.x}% ${region.y}%`,
                  cursor: "pointer",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            );
          })}

          {/* Region labels */}
          {REGIONS.map((region) => (
            <text
              key={`label-${region.id}`}
              x={region.x}
              y={region.y}
              textAnchor="middle"
              className="text-[3px] fill-slate-600 pointer-events-none"
            >
              {region.name.split(" ")[0]}
            </text>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredRegion && (
          <div className="absolute bottom-4 left-4 bg-surface-container-high rounded-lg p-3 shadow-lg border border-outline-variant/20">
            <p className="font-semibold text-sm text-on-surface">
              {REGIONS.find((r) => r.id === hoveredRegion)?.name}
            </p>
            <p className="text-xs text-on-surface-muted mt-1">
              {getMetricLabel()}: {getValueForRegion(hoveredRegion)}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(maxValue) }} />
          <span className="text-xs text-on-surface-muted">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(maxValue * 0.5) }} />
          <span className="text-xs text-on-surface-muted">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(0) }} />
          <span className="text-xs text-on-surface-muted">Low</span>
        </div>
      </div>

      {/* Top regions table */}
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <h4 className="text-sm font-medium text-on-surface-variant mb-2">
          Top Regions
        </h4>
        <div className="space-y-2">
          {animatedData
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map((region, i) => (
              <div
                key={region.region}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-muted w-4">
                    {i + 1}.
                  </span>
                  <span className="text-sm text-on-surface">
                    {region.region}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary">
                  {region.value}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GeographicHeatmap;
