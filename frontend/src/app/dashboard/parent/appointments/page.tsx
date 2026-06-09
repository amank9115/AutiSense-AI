"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: "Video Call" | "In-Person" | "Phone Call";
  status: "Upcoming" | "Completed" | "Cancelled";
  notes?: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "APT-001",
    doctor: "Dr. Elena Rodriguez",
    specialty: "Pediatrician",
    date: "June 5, 2026",
    time: "10:30 AM",
    type: "Video Call",
    status: "Upcoming",
    notes: "Follow-up discussion on recent screening results",
  },
  {
    id: "APT-002",
    doctor: "Dr. Sarah Jenkins",
    specialty: "Child Psychologist",
    date: "June 12, 2026",
    time: "2:00 PM",
    type: "In-Person",
    status: "Upcoming",
    notes: "Initial consultation to discuss developmental milestones",
  },
  {
    id: "APT-003",
    doctor: "Dr. Linda Chaves",
    specialty: "Sensory Expert",
    date: "May 20, 2026",
    time: "11:00 AM",
    type: "Video Call",
    status: "Completed",
    notes: "Sensory profile assessment completed",
  },
  {
    id: "APT-004",
    doctor: "Marcus Thorne, MS",
    specialty: "Occupational Therapist",
    date: "May 15, 2026",
    time: "9:00 AM",
    type: "In-Person",
    status: "Completed",
    notes: "Motor skills development session",
  },
];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [filter, setFilter] = useState<"All" | "Upcoming" | "Completed" | "Cancelled">("All");

  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredAppointments = appointments.filter(
    (apt) => filter === "All" || apt.status === filter
  );

  const getTypeIcon = (type: Appointment["type"]) => {
    switch (type) {
      case "Video Call":
        return "videocam";
      case "In-Person":
        return "account_circle";
      case "Phone Call":
        return "call";
    }
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "Upcoming":
        return "bg-primary-container text-on-primary-container";
      case "Completed":
        return "bg-secondary-container text-on-secondary-container";
      case "Cancelled":
        return "bg-error-container text-on-error-container";
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-headline font-extrabold text-4xl text-primary tracking-tight mb-2">
              Appointments
            </h1>
            <p className="text-on-surface-variant font-medium">
              Schedule and manage your upcoming consultations.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push("/professionals")}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Book Appointment
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["All", "Upcoming", "Completed", "Cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest transition-all ${
                filter === status
                  ? "bg-primary text-on-primary shadow-lg"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <Card
                key={apt.id}
                className="p-6 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Date Block */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[10px] font-bold uppercase">
                      {apt.date.split(" ")[0]}
                    </span>
                    <span className="text-2xl font-headline font-extrabold">
                      {apt.date.split(" ")[1].replace(",", "")}
                    </span>
                    <span className="text-[10px] font-bold opacity-70">
                      {apt.date.split(" ")[2]}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-headline font-extrabold text-xl text-on-surface">
                        {apt.doctor}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-extrabold uppercase tracking-widest">
                        {apt.specialty}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {apt.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base">{getTypeIcon(apt.type)}</span>
                        {apt.type}
                      </span>
                    </div>

                    {apt.notes && (
                      <p className="text-sm text-on-surface-variant bg-surface-container-highest rounded-xl p-3 italic">
                        {apt.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 sm:items-end">
                    {apt.status === "Upcoming" && (
                      <>
                        <Button
                          variant="primary"
                          onClick={() => alert(`Joining ${apt.type} with ${apt.doctor}...`)}
                          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                        >
                          Join Call
                        </Button>
                        <button
                          onClick={() => alert("Reschedule functionality coming soon")}
                          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                        >
                          Reschedule
                        </button>
                      </>
                    )}
                    {apt.status === "Completed" && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/results")}
                        className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest"
                      >
                        View Summary
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">
                calendar_month
              </span>
            </div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-4">
              No {filter !== "All" ? filter : ""} Appointments
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              {filter === "Upcoming"
                ? "You don't have any upcoming appointments. Book one with a specialist."
                : "No appointments found with this status."}
            </p>
            {filter === "Upcoming" && (
              <Button
                variant="primary"
                onClick={() => router.push("/professionals")}
                className="px-8 py-4 rounded-xl font-bold"
              >
                Find a Specialist
              </Button>
            )}
          </div>
        )}
    </div>
  );
}