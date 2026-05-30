"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Input } from "@/components/ui/StitchUI";
import Image from "next/image";
import { motion } from "framer-motion";

interface Patient {
  id: string;
  name: string;
  age: string;
  parentName: string;
  riskLevel: "Low" | "Moderate" | "Elevated";
  lastSession: string;
  status: "Reviewed" | "Pending" | "Escalated";
  nextAppointment?: string;
}

const mockPatients: Patient[] = [
  {
    id: "PID-8291",
    name: "Leo Harrington",
    age: "4y 2m",
    parentName: "Sarah Harrington",
    riskLevel: "Moderate",
    lastSession: "May 28, 2026",
    status: "Pending",
    nextAppointment: "June 5, 2026",
  },
  {
    id: "PID-7734",
    name: "Maya Sterling",
    age: "3y 8m",
    parentName: "James Sterling",
    riskLevel: "Low",
    lastSession: "May 25, 2026",
    status: "Reviewed",
  },
  {
    id: "PID-9012",
    name: "Ethan Brooks",
    age: "5y 1m",
    parentName: "Maria Brooks",
    riskLevel: "Elevated",
    lastSession: "May 27, 2026",
    status: "Escalated",
    nextAppointment: "June 2, 2026",
  },
  {
    id: "PID-8456",
    name: "Zara Patel",
    age: "2y 11m",
    parentName: "Raj Patel",
    riskLevel: "Low",
    lastSession: "May 20, 2026",
    status: "Reviewed",
  },
  {
    id: "PID-8890",
    name: "Noah Williams",
    age: "4y 6m",
    parentName: "Lisa Williams",
    riskLevel: "Moderate",
    lastSession: "May 22, 2026",
    status: "Pending",
    nextAppointment: "June 8, 2026",
  },
  {
    id: "PID-9123",
    name: "Ava Johnson",
    age: "3y 3m",
    parentName: "David Johnson",
    riskLevel: "Low",
    lastSession: "May 18, 2026",
    status: "Reviewed",
  },
];

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [patients] = useState<Patient[]>(mockPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | "Low" | "Moderate" | "Elevated">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Reviewed" | "Pending" | "Escalated">("All");

  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === "All" || patient.riskLevel === riskFilter;
    const matchesStatus = statusFilter === "All" || patient.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const getRiskColor = (risk: Patient["riskLevel"]) => {
    switch (risk) {
      case "Low":
        return "bg-secondary-container text-on-secondary-container border-secondary/20";
      case "Moderate":
        return "bg-tertiary-container text-on-tertiary-container border-tertiary/20";
      case "Elevated":
        return "bg-error-container text-on-error-container border-error/20";
    }
  };

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "Reviewed":
        return "bg-secondary-container text-on-secondary-container";
      case "Pending":
        return "bg-tertiary-container text-on-tertiary-container";
      case "Escalated":
        return "bg-error-container text-on-error-container";
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased lg:ml-80 p-6 lg:p-10 xl:p-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Patient List
          </h2>
          <p className="text-on-surface-variant font-medium text-lg opacity-60">
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
          {filteredPatients.map((patient) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-2xl transition-all duration-500 cursor-pointer group"
                onClick={() => router.push(`/reports/${patient.id}`)}
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
                      <span>{patient.id}</span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant" />
                      <span>{patient.age}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Parent:</span>
                    <span className="font-bold text-on-surface">{patient.parentName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant font-medium">Last Session:</span>
                    <span className="font-bold text-on-surface">{patient.lastSession}</span>
                  </div>
                  {patient.nextAppointment && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant font-medium">Next Visit:</span>
                      <span className="font-bold text-primary">{patient.nextAppointment}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getRiskColor(patient.riskLevel)} border`}>
                    {patient.riskLevel} Risk
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(patient.status)}`}>
                    {patient.status}
                  </span>
                </div>

                <div className="mt-5 pt-4 border-t border-outline-variant/10 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/reports/${patient.id}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                  >
                    View Report
                  </Button>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Scheduling appointment with ${patient.parentName}...`);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest"
                  >
                    Schedule
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
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