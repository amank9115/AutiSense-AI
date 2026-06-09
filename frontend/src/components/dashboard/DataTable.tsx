"use client";

import React from "react";
import { EmptyState } from "@/components/ui/StitchUI";
import { PatientListSkeleton } from "@/components/ui/SkeletonLoader";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  onRowClick,
  loading,
  emptyIcon = "inbox",
  emptyTitle = "No data found",
  emptyDescription,
  className = "",
}: DataTableProps<T>) {
  if (loading) return <PatientListSkeleton rows={5} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant/10">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`text-left text-label-caps text-on-surface-muted py-3 px-4 font-medium ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/5">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-surface-container-low" : ""}`}
            >
              {columns.map((col) => {
                const value = (row as Record<string, unknown>)[String(col.key)];
                return (
                  <td
                    key={String(col.key)}
                    className={`py-3 px-4 text-sm text-on-surface ${col.className ?? ""}`}
                  >
                    {col.render ? col.render(value, row) : String(value ?? "—")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
