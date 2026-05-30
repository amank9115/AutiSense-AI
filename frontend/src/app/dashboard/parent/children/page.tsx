"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card } from "@/components/ui/StitchUI";
import Image from "next/image";
import { Navbar, Footer } from "@/components/layout/Navigation";

interface Child {
  id: string;
  name: string;
  age: string;
  lastSession: string;
  status: "Active" | "Pending" | "Archived";
}

const mockChildren: Child[] = [
  {
    id: "CH-001",
    name: "Aarav Sharma",
    age: "4 years 3 months",
    lastSession: "May 28, 2026",
    status: "Active",
  },
  {
    id: "CH-002",
    name: "Mira Sharma",
    age: "2 years 8 months",
    lastSession: "May 15, 2026",
    status: "Active",
  },
];

export default function ChildrenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [children] = useState<Child[]>(mockChildren);

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
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
            onClick={() => router.push("/screening")}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Add Child
          </Button>
        </div>

        {/* Children Grid */}
        {children.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card
                key={child.id}
                className="p-8 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 group cursor-pointer"
                onClick={() => router.push(`/results`)}
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
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${
                          child.status === "Active"
                            ? "bg-secondary-container text-on-secondary-container"
                            : child.status === "Pending"
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {child.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-on-surface-variant">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">cake</span>
                        {child.age}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        Last session: {child.lastSession}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">badge</span>
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
                      router.push("/screening");
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                  >
                    New Screening
                  </Button>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/results");
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
      </main>

      <Footer />
    </div>
  );
}