"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import Image from "next/image";

const StatCard = ({ icon, label, value, trend, color }: { icon: string, label: string, value: string, trend: string, color: string }) => (
  <Card className="p-8 border-none bg-surface-container-low hover:bg-surface-container transition-all duration-500 shadow-xl group overflow-hidden relative">
    <div className="relative z-10">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest opacity-60 mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
        <h3 className="text-4xl font-headline font-extrabold text-on-surface tracking-tighter">{value}</h3>
        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{trend}</span>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-3xl"></div>
  </Card>
);

const PatientRow = ({ name, id, age, status, date, img }: { name: string, id: string, age: string, status: string, date: string, img: string }) => (
  <div className="flex items-center justify-between p-6 hover:bg-surface-container-highest/30 transition-all rounded-2xl cursor-pointer group border border-transparent hover:border-outline-variant/10">
    <div className="flex items-center gap-6">
      <div className="w-14 h-14 rounded-full relative overflow-hidden shadow-md border-2 border-white group-hover:scale-105 transition-transform">
        <Image src={img} alt={name} fill className="object-cover" />
      </div>
      <div>
        <h4 className="font-headline font-extrabold text-on-surface text-lg group-hover:text-primary transition-colors">{name}</h4>
        <div className="flex items-center gap-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
          <span>{id}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
          <span>{age}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-10">
      <div className="text-right hidden md:block">
        <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">{status}</p>
        <p className="text-xs font-bold text-on-surface-variant opacity-60">{date}</p>
      </div>
      <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
        <span className="material-symbols-outlined text-xl">chevron_right</span>
      </button>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex">
      {/* Sidebar */}
      <aside className="w-80 h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 p-8 flex flex-col z-50">
        <div className="mb-12 px-2">
          <h1 className="font-headline font-bold text-primary text-2xl tracking-tight leading-none mb-1">MannSaathi</h1>
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.3em] opacity-40">Provider Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: "dashboard", label: "Overview", active: true },
            { icon: "group", label: "Patient List" },
            { icon: "calendar_month", label: "Appointments" },
            { icon: "analytics", label: "Clinical Insights" },
            { icon: "folder_shared", label: "Archive" },
          ].map((item, i) => (
            <button key={i} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${item.active ? "bg-primary text-on-primary shadow-2xl shadow-primary/20 font-bold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-extrabold text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-outline-variant/10">
          <button
            onClick={() => router.push("/dashboard/doctor/profile")}
            className="w-full bg-surface-container p-4 rounded-3xl flex items-center gap-4 shadow-inner hover:bg-surface-container-high transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-extrabold text-on-surface truncate">{user.name}</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Healthcare Provider</p>
            </div>
                      </button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-10 lg:p-16">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
            <h2 className="font-headline font-extrabold text-5xl text-on-surface tracking-tighter mb-2">{getGreeting()}, {user.name?.split(' ')[0]}.</h2>
            <p className="text-on-surface-variant font-medium text-lg opacity-60">You have 4 screenings pending review today.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Input className="w-72 pl-12 bg-surface-container-low border-none rounded-full shadow-inner" placeholder="Search patients..." />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            </div>
            <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant shadow-sm border border-outline-variant/5"><span className="material-symbols-outlined">notifications</span></button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
          <StatCard icon="assignment" label="Total Screenings" value="1,284" trend="+12% this month" color="bg-primary text-on-primary" />
          <StatCard icon="pending_actions" label="Pending Review" value="4" trend="Action required" color="bg-secondary text-on-secondary" />
          <StatCard icon="verified" label="Diagnostic Yield" value="94%" trend="Clinical high" color="bg-tertiary-container text-on-tertiary-container" />
          <StatCard icon="schedule" label="Avg. Response" value="4.2h" trend="-15% latency" color="bg-surface-container-highest text-on-surface" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          {/* Recent Patients */}
          <Card className="xl:col-span-2 p-10 border-none bg-white rounded-[3rem] shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Recent Activity</h3>
              <button className="text-[10px] font-extrabold text-secondary uppercase tracking-[0.2em] hover:underline">View All Patients</button>
            </div>
            <div className="space-y-4">
              <PatientRow name="Leo Harrington" id="PID-8291" age="4y 2m" status="Report Generated" date="Oct 24, 2023" img="https://lh3.googleusercontent.com/aida-public/AB6AXuC4hA10WbTxc8TNA9o1o7cke0TvhBXlZtjUF31PmM8oEswZND8L8mm8Hm4mnbgBk5p0CZrO3Zm03fez2ChRd-gLjNrN8OKyL8HJQsroHnTqkKj5H9GJ-iHXWcLrxHEaRyFiSzEb2bWia5qdUunacS6Dwhuw_LeqPSwXtAHyWLF5-_A5uUrd9Ffsrq_pWT_SjUfRHgG65LfbdmqUgcjEOxi6EG1vM3n7ycosgyD2Dm41Vf3Jd0W4neKTdPBo3_EPorSsUSf7XIrMKYI" />
              <PatientRow name="Maya Sterling" id="PID-7734" age="3y 8m" status="Pending Analysis" date="Oct 23, 2023" img="https://lh3.googleusercontent.com/aida-public/AB6AXuAy8o_u0vA5I1O3v0_u-0y-v0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0" />
              <PatientRow name="Ethan Brooks" id="PID-9012" age="5y 1m" status="In Progress" date="Oct 23, 2023" img="https://lh3.googleusercontent.com/aida-public/AB6AXuCSJEdQeHDL-E7ePoYImpgB1mJrH1zyYce9iLrcCsy15qCyGmsfFrOSlulTr2XVEcWGz0kwtRFFrHCwPw1jcZPRLTlSzM8l26DAOJ2Ssx6ovP4k0wBvjNlryGeMwqdbRJpvP5IzlWRH2nr9athKecMvgDQiRl7BorHxZGRklr_TibkN4SvHLFl6_cEVm25FDEY7j6-JXjtust5fiTKfca0VDsa7S4dJi6enzwOG35Edkp0L17dHb1kCuxinOMrxV2Ev1pgw-TTPhOc" />
            </div>
          </Card>

          {/* Clinical Alerts */}
          <div className="space-y-12">
            <Card className="p-10 border-none bg-primary text-on-primary rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-white/50 text-4xl mb-6">warning_amber</span>
                <h4 className="font-headline font-bold text-2xl mb-4 tracking-tight leading-snug">Symptom Cluster Detected</h4>
                <p className="text-white/80 font-medium leading-relaxed mb-8">System detected a high-frequency hand-flapping cluster in 3 new screenings this morning.</p>
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white font-extrabold py-4 rounded-2xl hover:bg-white/20 uppercase tracking-widest text-[10px]">Review Cluster</Button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            </Card>

            <div className="bg-surface-container-low rounded-[3rem] p-10 border border-outline-variant/10 shadow-sm relative overflow-hidden">
              <h4 className="font-headline font-extrabold text-xl text-primary mb-6 tracking-tight">Clinical Roadmap</h4>
              <div className="space-y-6">
                {[
                  { label: "Quarterly Audit", date: "Oct 30", status: "Upcoming" },
                  { label: "Staff Training", date: "Nov 02", status: "Mandatory" },
                  { label: "Policy Update", date: "Nov 15", status: "Review" }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center group cursor-pointer">
                    <div>
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">{item.label}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">{item.date}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-surface-container-highest text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant opacity-60 group-hover:opacity-100 transition-opacity">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
