"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/StitchUI";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { screeningApi, ChildProfile } from "@/services/api/screeningApi";

interface PatientRecord extends ChildProfile {
  screeningSessions?: {
    id: string;
    status: string;
    createdAt: string;
    results?: {
      riskLevel: string;
    };
  }[];
  parent?: {
    name: string;
  };
}

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchPatients = async () => {
      try {
        const data = await screeningApi.getChildren();
        setPatients(data as unknown as PatientRecord[]);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user, router]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-on-surface-variant text-sm font-medium animate-pulse">Loading patients...</p>
        </div>
      </div>
    );
  }

  const filteredPatients = patients.filter((patient) => {
    const latestSession = patient.screeningSessions?.[0];
    const riskLevel = latestSession?.results?.riskLevel || "Low";
    const status = latestSession?.status || "Reviewed";

    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.parent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === "All" || riskLevel.toLowerCase() === riskFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesRisk && matchesStatus;
  });

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

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-secondary-container text-on-secondary-container border-secondary/20";
      case "moderate":
      case "medium":
        return "bg-tertiary-container text-on-tertiary-container border-tertiary/20";
      case "elevated":
      case "high":
      case "very_high":
        return "bg-error-container text-on-error-container border-error/20";
      default:
        return "bg-surface-container-highest text-on-surface-variant border-outline-variant/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "reviewed":
      case "completed":
        return "bg-secondary-container text-on-secondary-container";
      case "pending":
      case "in_progress":
        return "bg-tertiary-container text-on-tertiary-container";
      case "escalated":
      case "failed":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container-highest text-on-surface-variant";
    }
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Patient List
          </h2>
          <p className="text-on-surface-muted text-lg">
            {filteredPatients.length} patients registered under your care
          </p>
        </div>
        <Button
          variant="primary"
          className="px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <span className="material-symbols-outlined mr-2">person_add</span>
          Add Patient
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-low rounded-3xl p-6 mb-8 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full">
          <Input
            className="w-full pl-12 bg-surface-container-highest border-none rounded-2xl shadow-inner"
            placeholder="Search by name, patient ID, or parent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner cursor-pointer"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="Elevated">Elevated Risk</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm font-bold shadow-inner cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Pending">Pending</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Patient Grid */}
      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => {
            const latestSession = patient.screeningSessions?.[0];
            const riskLevel = latestSession?.results?.riskLevel || "N/A";
            const status = latestSession?.status || "None";
            const lastSessionDate = latestSession ? new Date(latestSession.createdAt).toLocaleDateString() : "Never";

            return (
              <motion.div
                key={patient.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              >
                <Card
                  className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 cursor-pointer group"
                  onClick={() => latestSession && router.push(`/results?sessionId=${latestSession.id}`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-2xl text-primary">
                        child_care
                      </span>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-headline font-extrabold text-lg text-on-surface group-hover:text-primary transition-colors">
                        {patient.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
                        <span>{patient.id.slice(0, 8)}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{calculateAge(patient.dateOfBirth)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Parent:</span>
                      <span className="font-bold text-on-surface">{patient.parent?.name || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Last Session:</span>
                      <span className="font-bold text-on-surface">{lastSessionDate}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getRiskColor(riskLevel)} border`}>
                      {riskLevel} Risk
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mt-5 pt-4 border-t border-outline-variant/10 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (latestSession) router.push(`/results?sessionId=${latestSession.id}`);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                      disabled={!latestSession}
                    >
                      View Report
                    </Button>
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Scheduling appointment with ${patient.parent?.name || "Parent"}...`);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                    >
                      Schedule
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              person_search
            </span>
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
            No Patients Found
          </h3>
          <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
            No patients match your search criteria. Try adjusting your filters.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              setSearchTerm("");
              setRiskFilter("All");
              setStatusFilter("All");
            }}
            className="px-8 py-4 rounded-2xl font-bold"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}