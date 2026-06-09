"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card } from "@/components/ui/StitchUI";
import Image from "next/image";
import { screeningApi, ChildProfile } from "@/services/api/screeningApi";

export default function ChildrenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchChildren = async () => {
      try {
        const data = await screeningApi.getChildren();
        setChildren(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load children profiles";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user, router]);

  if (!user) return null;

  const calculateAge = (dob: string) => {
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}y ${months}m`;
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">
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

        {/* Children Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant text-sm font-medium animate-pulse">Loading profiles...</p>
          </div>
        ) : error ? (
          <div className="bg-error/10 border border-error/20 text-error p-6 rounded-2xl text-center">
            <p className="font-bold">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        ) : children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card
                key={child.id}
                className="p-8 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 group cursor-pointer"
                onClick={() => router.push(`/dashboard/parent/history?childId=${child.id}`)}
              >
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-4xl text-primary">
                      child_care
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-headline font-extrabold text-2xl text-on-surface group-hover:text-primary transition-colors">
                        {child.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-secondary-container text-on-secondary-container`}
                      >
                        Active
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-on-surface-variant">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">cake</span>
                        {calculateAge(child.dateOfBirth)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Added: {new Date(child.createdAt).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-2 text-[10px] opacity-40">
                        <span className="material-symbols-outlined text-[10px]">badge</span>
                        {child.id}
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
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                child_care
              </span>
            </div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
              No Children Added Yet
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              Add your child&apos;s profile to start tracking their developmental progress and
              schedule screenings.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push("/screening")}
              className="px-8 py-4 rounded-xl font-bold"
            >
              Add Your First Child
            </Button>
          </div>
        )}
    </div>
  );
}