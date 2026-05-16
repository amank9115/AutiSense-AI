"use client";

import React from "react";
import { Button, Input } from "@/components/ui/StitchUI";
import Image from "next/image";

const DomainBar = ({ label, value, color, desc }: { label: string, value: string, color: string, desc: string }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <span className="text-sm font-extrabold text-on-surface uppercase tracking-tight opacity-70">{label}</span>
      <span className={`text-xl font-headline font-extrabold ${color.split(' ')[1]}`}>{value}</span>
    </div>
    <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: value }}></div>
    </div>
    <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">{desc}</p>
  </div>
);

const AIStatCard = ({ label, value, sub, desc }: { label: string, value: string, sub: string, desc: string }) => (
  <div className="bg-on-primary/10 backdrop-blur-md p-6 rounded-2xl border border-on-primary/10 shadow-lg">
    <p className="text-[10px] font-extrabold text-white uppercase tracking-widest opacity-60 mb-3">{label}</p>
    <div className="flex items-baseline gap-2 mb-4">
      <span className="text-3xl font-headline font-extrabold text-white">{value}</span>
      <span className="text-[10px] font-bold text-white/80 uppercase">{sub}</span>
    </div>
    <p className="text-xs text-white/90 leading-snug font-medium">{desc}</p>
  </div>
);

const ParentInputCard = ({ icon, label, question, answer, desc, color }: { icon: string, label: string, question: string, answer: string, desc: string, color: string }) => (
  <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
    <div className={`flex items-center gap-2 mb-4 ${color}`}>
      <span className="material-symbols-outlined text-sm">{icon}</span>
      <span className="text-[10px] font-extrabold uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-on-surface font-bold mb-4 leading-tight">{question}</p>
    <div className="flex items-center gap-3">
      <span className={`${color.replace('text-', 'bg-').replace(' ', '-container/20 ')} px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest`}>{answer}</span>
      <span className="text-[10px] text-on-surface-variant font-bold italic opacity-60">{desc}</span>
    </div>
  </div>
);

export default function PatientReportPage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased">
      {/* Provider Sidebar */}
      <aside className="h-screen w-72 fixed left-0 top-0 bg-surface-container-low flex flex-col p-6 space-y-4 z-50 border-r border-outline-variant/10">
        <div className="mb-10 px-2">
          <h1 className="font-headline font-bold text-primary text-2xl tracking-tight">MannSaathi</h1>
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest opacity-60">Provider Portal</p>
        </div>
        <nav className="flex-1 space-y-2">
          {["dashboard", "folder_shared", "assignment_add", "assessment", "settings"].map((icon, i) => (
            <a key={i} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${icon === "assessment" ? "bg-secondary-container text-on-secondary-container font-bold" : "text-on-surface-variant hover:bg-surface-container-high"}`} href="#">
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-bold uppercase tracking-widest text-[10px]">
                {icon === "dashboard" ? "Dashboard" : 
                 icon === "folder_shared" ? "Patient Records" :
                 icon === "assignment_add" ? "Screening Tools" :
                 icon === "assessment" ? "Reports" : "Settings"}
              </span>
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-outline-variant/10">
          <div className="flex items-center gap-3 p-3 bg-surface-container rounded-2xl">
            <div className="w-10 h-10 rounded-full relative overflow-hidden shadow-sm">
              <Image 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxwTWgcXEa19ylwZbLx90N-3_MiW2dCDAmkg7impxULJRL9ydQ5hof6agoUrS-MM27UuRY7d8IGv3-W_9e29CHA_Rl7OwR6Rzapfm7tzTnqHfv2N5YrDYRbFoca-AgCWVLvCd5p9b54Cc_mTfVrdmMw5ARACkRFEtG473yi0hcjbe4VvgR22_ucFDu7_DZw7JitfRINKvWrQCVzZZ4MMoEQ_f5EhC0pX96DIU3IVLg79afZAoz3esyRaALr30KqtPpMz_QPoY0Tpg" 
                alt="Dr. Smith"
                fill
                className="object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-extrabold truncate">Dr. Julianne Smith</p>
              <p className="text-[10px] font-bold text-on-surface-variant opacity-60 uppercase tracking-widest">Specialist</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="ml-72">
        <header className="flex justify-between items-center h-20 px-10 bg-surface/80 backdrop-blur-xl sticky top-0 z-40 border-b border-outline-variant/10">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant">search</span>
              <Input className="w-full pl-12 bg-surface-container-low border-none rounded-full shadow-inner" placeholder="Search reports or patients..." />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">notifications</span></button>
            <button className="text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined">help_outline</span></button>
            <Button variant="primary" className="px-6 py-2.5 rounded-full font-extrabold text-[10px] uppercase tracking-widest shadow-lg">New Screening</Button>
          </div>
        </header>

        <main className="p-10 max-w-[1200px] mx-auto space-y-12">
          {/* Patient Header */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center border-4 border-white shadow-2xl relative overflow-hidden">
                <Image 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4hA10WbTxc8TNA9o1o7cke0TvhBXlZtjUF31PmM8oEswZND8L8mm8Hm4mnbgBk5p0CZrO3Zm03fez2ChRd-gLjNrN8OKyL8HJQsroHnTqkKj5H9GJ-iHXWcLrxHEaRyFiSzEb2bWia5qdUunacS6Dwhuw_LeqPSwXtAHyWLF5-_A5uUrd9Ffsrq_pWT_SjUfRHgG65LfbdmqUgcjEOxi6EG1vM3n7ycosgyD2Dm41Vf3Jd0W4neKTdPBo3_EPorSsUSf7XIrMKYI" 
                  alt="Leo Harrington"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="font-headline text-5xl font-extrabold text-primary tracking-tighter mb-2">Leo Harrington</h2>
                <div className="flex items-center gap-4 text-on-surface-variant font-bold text-xs uppercase tracking-widest opacity-80">
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">calendar_today</span> 4 Years, 2 Months</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-outline-variant opacity-40"></span>
                  <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">event</span> Screened Oct 24, 2023</span>
                  <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full shadow-sm">Completed</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-low rounded-2xl font-extrabold text-[10px] uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-all shadow-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-lg">download</span> Export PDF
              </button>
              <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-low rounded-2xl font-extrabold text-[10px] uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-all shadow-sm border border-outline-variant/10">
                <span className="material-symbols-outlined text-lg">share</span> Share Report
              </button>
            </div>
          </section>

          {/* Main Bento Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Symptom Analysis */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-3xl p-10 border border-outline-variant/10 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <h3 className="font-headline text-3xl font-extrabold text-primary tracking-tight">Symptom Analysis</h3>
                <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Core Developmental Domains</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                <DomainBar label="Social Communication" value="72%" color="bg-gradient-to-r from-secondary to-secondary-fixed-dim text-secondary" desc="Demonstrates partial eye contact; limited use of gestures for communication." />
                <DomainBar label="Behavioral Patterns" value="45%" color="bg-gradient-to-r from-tertiary to-tertiary-fixed-dim text-tertiary" desc="Repetitive hand movements observed during high-engagement tasks." />
                <DomainBar label="Sensory Sensitivity" value="88%" color="bg-gradient-to-r from-primary to-primary-fixed-dim text-primary" desc="High reactivity to sudden auditory stimuli and bright overhead lighting." />
                <DomainBar label="Joint Attention" value="61%" color="bg-gradient-to-r from-secondary-dim to-secondary-fixed text-secondary-dim" desc="Follows point but rarely initiates shared interest with the provider." />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            </div>

            {/* AI Observations */}
            <div className="col-span-12 lg:col-span-4 bg-primary text-on-primary rounded-3xl p-10 relative overflow-hidden shadow-2xl flex flex-col justify-center">
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                  <h3 className="font-headline text-3xl font-extrabold tracking-tight">AI Insights</h3>
                </div>
                <div className="space-y-6">
                  <AIStatCard label="Eye Contact Duration" value="12.4s" sub="Avg. Interaction" desc="Below developmental norm for 4-year-olds (Target: 18s+)." />
                  <AIStatCard label="Facial Mirroring" value="Low" sub="Engagement Score" desc="Minimal mirroring of provider's positive affective expressions." />
                </div>
                <div className="pt-8 border-t border-white/10">
                  <p className="text-xs italic opacity-80 font-medium leading-relaxed">&quot;Visual fixation patterns suggest high focus on mechanical objects vs. human faces.&quot;</p>
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl rotate-45"></div>
            </div>

            {/* Parent Input Summary */}
            <div className="col-span-12 bg-surface-container rounded-3xl p-10 border border-outline-variant/10 shadow-inner">
              <div className="flex items-center gap-4 mb-10">
                <span className="material-symbols-outlined text-secondary text-3xl">family_history</span>
                <h3 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Parental Input Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ParentInputCard icon="home" label="Home Environment" question="Does Leo respond to his name consistently?" answer="Rarely" desc="Observed daily" color="text-secondary" />
                <ParentInputCard icon="toys" label="Play Habits" question="Does he engage in imaginative roleplay?" answer="Sometimes" desc="Blocks only" color="text-tertiary" />
                <ParentInputCard icon="health_and_safety" label="Clinical Concerns" question="What is your primary concern right now?" answer="Transitions" desc="Activity Shifts" color="text-primary" />
              </div>
            </div>

            {/* Clinical Recommendations */}
            <div className="col-span-12 bg-white rounded-3xl p-12 border border-surface-variant shadow-2xl relative overflow-hidden">
              <h3 className="font-headline text-3xl font-extrabold text-primary mb-10 tracking-tight">Clinical Recommendations</h3>
              <div className="space-y-10 relative z-10">
                <div className="relative group">
                  <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-[0.2em] mb-4 ml-6 opacity-60">Internal Clinical Notes</label>
                  <textarea 
                    className="w-full bg-surface-container-low border-none rounded-3xl p-8 text-on-surface font-body leading-relaxed focus:ring-4 focus:ring-primary/5 transition-all shadow-inner placeholder:text-on-surface-variant/30" 
                    placeholder="Type clinical findings and path forward here..." 
                    rows={5}
                  ></textarea>
                  <div className="absolute bottom-6 right-8 text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Autosaved at 6:42 PM</div>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-10 border-t border-surface-variant/50">
                  <div className="flex items-center gap-6 bg-surface-container-low/50 p-6 rounded-2xl border border-outline-variant/10 pr-12 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-tertiary-container flex items-center justify-center shadow-lg transform -rotate-3">
                      <span className="material-symbols-outlined text-on-tertiary-container text-3xl">lightbulb</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">Suggested Referral</p>
                      <p className="text-lg font-bold text-on-surface leading-tight">Occupational Therapy</p>
                      <p className="text-xs text-on-surface-variant font-medium opacity-60">Sensory Integration Focus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full lg:w-auto">
                    <button className="flex-1 lg:flex-none px-10 py-5 bg-surface-container-high text-on-surface font-extrabold rounded-2xl hover:bg-surface-variant transition-all uppercase tracking-widest text-xs shadow-md">
                      Save Draft
                    </button>
                    <button className="flex-1 lg:flex-none px-14 py-5 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-extrabold rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs">
                      Finalize Report
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>
          </div>
          
          <footer className="mt-20 text-center space-y-4 pb-12">
            <p className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-[0.3em] opacity-40">© 2023 MannSaathi</p>
            <p className="text-xs font-bold text-on-surface-variant opacity-30 italic">AI-Assisted Developmental Screening. For professional clinical use only.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
