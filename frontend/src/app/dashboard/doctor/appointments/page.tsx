"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, Button } from "@/components/ui/StitchUI";
import { motion } from "framer-motion";

interface Appointment {
  id: string;
  patientName: string;
  parentName: string;
  date: string;
  time: string;
  type: "Video Call" | "In-Person" | "Phone Call";
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled";
  reason: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "APT-001",
    patientName: "Leo Harrington",
    parentName: "Sarah Harrington",
    date: "June 5, 2026",
    time: "10:30 AM",
    type: "Video Call",
    status: "Scheduled",
    reason: "Follow-up on recent screening results",
  },
  {
    id: "APT-002",
    patientName: "Maya Sterling",
    parentName: "James Sterling",
    date: "June 5, 2026",
    time: "2:00 PM",
    type: "In-Person",
    status: "Scheduled",
    reason: "Initial consultation",
  },
  {
    id: "APT-003",
    patientName: "Ethan Brooks",
    parentName: "Maria Brooks",
    date: "June 2, 2026",
    time: "11:00 AM",
    type: "Video Call",
    status: "Scheduled",
    reason: "Escalated case review",
  },
  {
    id: "APT-004",
    patientName: "Noah Williams",
    parentName: "Lisa Williams",
    date: "June 8, 2026",
    time: "9:00 AM",
    type: "In-Person",
    status: "Scheduled",
    reason: "Routine follow-up",
  },
  {
    id: "APT-005",
    patientName: "Zara Patel",
    parentName: "Raj Patel",
    date: "June 10, 2026",
    time: "3:30 PM",
    type: "Phone Call",
    status: "Scheduled",
    reason: "Lab results discussion",
  },
  {
    id: "APT-006",
    patientName: "Ava Johnson",
    parentName: "David Johnson",
    date: "May 28, 2026",
    time: "10:00 AM",
    type: "Video Call",
    status: "Completed",
    reason: "Monthly progress review",
  },
];

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [dateFilter, setDateFilter] = useState<string>("all");

  if (!user) {
    router.push("/login");
    return null;
  }

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
      case "Scheduled":
        return "bg-primary-container text-on-primary-container";
      case "In Progress":
        return "bg-tertiary-container text-on-tertiary-container";
      case "Completed":
        return "bg-secondary-container text-on-secondary-container";
      case "Cancelled":
        return "bg-error-container text-on-error-container";
    }
  };

  const upcomingAppointments = appointments.filter((apt) => apt.status === "Scheduled" || apt.status === "In Progress");
  const pastAppointments = appointments.filter((apt) => apt.status === "Completed" || apt.status === "Cancelled");

  const renderAppointmentCard = (apt: Appointment, isPast: boolean = false) => (
    <Card
      key={apt.id}
      className={`p-5 border border-outline-variant/10 bg-surface-container-low hover:shadow-xl transition-all duration-300 ${isPast ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Date Block */}
        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary text-on-primary flex flex-col items-center justify-center shadow-md">
          <span className="text-[9px] font-bold uppercase opacity-70">
            {apt.date.split(" ")[0]}
          </span>
          <span className="text-xl font-headline font-extrabold">
            {apt.date.split(" ")[1].replace(",", "")}
          </span>
        </div>

        {/* Details */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-headline font-bold text-base text-on-surface">
              {apt.patientName}
            </h4>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${getStatusColor(apt.status)}`}>
              {apt.status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium mb-1">
            Parent: {apt.parentName}
          </p>
          <p className="text-xs text-on-surface-variant italic truncate">
            {apt.reason}
          </p>
        </div>

        {/* Time & Type */}
        <div className="flex-shrink-0 text-right">
          <p className="font-bold text-sm text-primary">{apt.time}</p>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-1">
            <span className="material-symbols-outlined text-sm">{getTypeIcon(apt.type)}</span>
            <span className="uppercase font-bold">{apt.type.replace(" Call", "")}</span>
          </div>
        </div>
      </div>

      {!isPast && (
        <div className="mt-4 pt-4 border-t border-outline-variant/10 flex gap-2">
          <Button
            variant="primary"
            onClick={() => alert(`Starting ${apt.type} with ${apt.patientName}...`)}
            className="flex-1 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
          >
            Start Session
          </Button>
          <Button
            variant="outline"
            onClick={() => alert("Reschedule functionality coming soon")}
            className="py-2 px-4 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
          >
            Reschedule
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">
            Appointments
          </h2>
          <p className="text-on-surface-muted text-lg">
            Manage your patient consultation schedule
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => alert("New appointment booking coming soon")}
          className="px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg"
        >
          <span className="material-symbols-outlined mr-2">add</span>
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-5 border-none bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">event_available</span>
          <p className="text-3xl font-headline font-extrabold">{upcomingAppointments.length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Upcoming</p>
        </Card>
        <Card className="p-5 border-none bg-tertiary-container text-on-tertiary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">videocam</span>
          <p className="text-3xl font-headline font-extrabold">
            {upcomingAppointments.filter((a) => a.type === "Video Call").length}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Video Calls</p>
        </Card>
        <Card className="p-5 border-none bg-secondary-container text-on-secondary-container">
          <span className="material-symbols-outlined text-2xl mb-2 block">account_circle</span>
          <p className="text-3xl font-headline font-extrabold">
            {upcomingAppointments.filter((a) => a.type === "In-Person").length}
          </p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">In-Person</p>
        </Card>
        <Card className="p-5 border-none bg-surface-container text-on-surface">
          <span className="material-symbols-outlined text-2xl mb-2 block">history</span>
          <p className="text-3xl font-headline font-extrabold">{pastAppointments.length}</p>
          <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">Completed</p>
        </Card>
      </div>

      {/* Upcoming */}
      <section className="mb-10">
        <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">upcoming</span>
          Upcoming Sessions
        </h3>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-4">
            {upcomingAppointments.map((apt) => renderAppointmentCard(apt))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface-container-low rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
              event_busy
            </span>
            <p className="text-on-surface-variant font-medium">No upcoming appointments</p>
          </div>
        )}
      </section>

      {/* Past */}
      {pastAppointments.length > 0 && (
        <section>
          <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">history</span>
            Past Sessions
          </h3>
          <div className="space-y-4">
            {pastAppointments.map((apt) => renderAppointmentCard(apt, true))}
          </div>
        </section>
      )}
    </div>
  );
}