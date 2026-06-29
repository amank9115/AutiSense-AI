"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card } from "@/components/ui/StitchUI";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CardGridSkeleton } from "@/components/ui/SkeletonLoader";
import { screeningApi, ChildProfile } from "@/services/api/screeningApi";
import { useProtectedQuery } from "@/hooks/useProtectedQuery";
import { calculateAge } from "@/lib/date";
import { logger } from "@/lib/logger";

type ChildrenData = {
  children: ChildProfile[];
  lastSessionMap: Record<string, string>;
};

export default function ChildrenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "age" | "recent">("name");

  const { data, loading, error } = useProtectedQuery<ChildrenData>(["children", "withSessions"], async () => {
    const [children, sessionsRes] = await Promise.all([
      screeningApi.getChildren(),
      screeningApi.getSessions(1, 100),
    ]);
    const lastSessionMap: Record<string, string> = {};
    sessionsRes.data.forEach((s) => {
      if (!lastSessionMap[s.childId] || s.createdAt > lastSessionMap[s.childId]) {
        lastSessionMap[s.childId] = s.createdAt;
      }
    });
    return { children, lastSessionMap };
  });

  const children = data?.children ?? [];
  const lastSessionMap = data?.lastSessionMap ?? {};

  const filteredChildren = children
    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "age")
        return new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime();
      const aDate = lastSessionMap[a.id] ?? "";
      const bDate = lastSessionMap[b.id] ?? "";
      return bDate.localeCompare(aDate);
    });

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb className="mb-6" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline font-extrabold text-3xl sm:text-4xl text-primary tracking-tight mb-2">
            My Children
          </h1>
          <p className="text-on-surface-variant font-medium">
            Manage your children&apos;s profiles and screening history.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push("/dashboard/parent/children/add")}
          className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          Add Child
        </Button>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by child name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl text-sm shadow-inner focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["name", "age", "recent"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                sortBy === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {key === "recent" ? "Recent" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Children Grid */}
      {loading ? (
        <CardGridSkeleton cols={2} cards={4} />
      ) : error ? (
        <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
          <p className="font-bold">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      ) : filteredChildren.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredChildren.map((child) => (
            <Card
              key={child.id}
              className="p-6 sm:p-8 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 group cursor-pointer"
              onClick={() => router.push(`/dashboard/parent/history?childId=${child.id}`)}
            >
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary-container flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                  <span className="material-symbols-outlined text-3xl sm:text-4xl text-primary">
                    child_care
                  </span>
                </div>
                <div className="grow min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface group-hover:text-primary transition-colors">
                        {child.name}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-secondary-container text-on-secondary-container">
                        Active
                      </span>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove ${child.name}'s profile? This cannot be undone.`)) {
                          // TODO: wire to API when endpoint is available
                          logger.warn("ChildrenPage", "Delete child not yet supported by API", child.id);
                          alert("Delete feature coming soon.");
                        }
                      }}
                      className="p-1.5 rounded-xl text-on-surface-muted hover:text-error hover:bg-error/10 transition-all shrink-0"
                      title="Remove child"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-sm text-on-surface-variant">
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">cake</span>
                      {calculateAge(child.dateOfBirth)}
                    </p>
                    {child.gender && (
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {child.gender}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">history</span>
                      {lastSessionMap[child.id]
                        ? `Last screening: ${new Date(lastSessionMap[child.id]).toLocaleDateString()}`
                        : "No screenings yet"}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Added: {new Date(child.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/10 flex gap-3">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/screening?childId=${child.id}`);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  New Screening
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: wire to /dashboard/parent/children/${child.id}/edit when available
                    alert("Edit feature coming soon.");
                  }}
                  className="py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-widest"
                  title="Edit child profile"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/parent/history?childId=${child.id}`);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  View Reports
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : children.length > 0 ? (
        /* Search returned no results */
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-30">
            search_off
          </span>
          <h3 className="font-headline font-bold text-xl text-on-surface mt-4 mb-2">No results found</h3>
          <p className="text-on-surface-variant text-sm">No children match &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">child_care</span>
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">No Children Added Yet</h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            Add your child&apos;s profile to start tracking their developmental progress and schedule screenings.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/dashboard/parent/children/add")}
            className="px-8 py-4 rounded-xl font-bold"
          >
            Add Your First Child
          </Button>
        </div>
      )}
    </div>
  );
}
