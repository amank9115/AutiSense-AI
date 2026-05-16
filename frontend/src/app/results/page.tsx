"use client";

import React from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Card, Button } from "@/components/ui/StitchUI";
import Image from "next/image";

import { useAppStore } from "@/store";

const MilestoneProgress = ({ label, status, progress, color }: { label: string, status: string, progress: string, color: string }) => (
  <div className="space-y-4">
    <div className="flex justify-between mb-1 items-end">
      <label className="font-headline font-bold text-lg text-on-surface">{label}</label>
      <span className="text-primary font-extrabold text-xs uppercase tracking-widest">{status}</span>
    </div>
    <div className="w-full bg-surface-container-highest h-4 rounded-full overflow-hidden shadow-inner">
      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: progress }}></div>
    </div>
  </div>
);

export default function ResultsPage() {
  const mlResults = useAppStore((state) => state.mlResults);

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-20">
          <h2 className="font-headline font-extrabold text-4xl sm:text-5xl lg:text-8xl text-primary leading-tight mb-4 sm:mb-6 tracking-tighter">Discovery Results</h2>
          <p className="text-base sm:text-lg lg:text-xl text-on-surface-variant max-w-2xl leading-relaxed font-medium opacity-80">A detailed overview of your child&apos;s sensory profile and developmental milestones.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">
          {/* Main Results Column */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-12">

            {/* Explorer Profile Card */}
            <div className="bg-surface-container-low rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row gap-8 sm:gap-12 items-center overflow-hidden relative shadow-2xl border border-outline-variant/5">
              <div className="w-full md:w-1/3 max-w-[200px] md:max-w-none aspect-square rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shadow-xl border-4 border-white/20 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXpxb1GGff2XImHpeE_qhQOQYmphYx5QGdsv84MkBrdPmyORFbp5wPn81q_f79U1Y1e6XIsKHgzndTok7PPZMRNgl4FyZt-7TRRo-Ci_-ROYtGIuMX3pv_Qf0XIofxQSUG3fVRHMRMPl48_B0CklL5S42S9PlyAjnO8FvhLo8xf4Ke1G_MJqojEY993MdA8XSnO44bdTYfHBFTVfAR_hYoeNgkBymfO0HRI0a6rH4Wd5YTJTkBJnvvYztSBYWVnh6wZ_frlGhOvF0"
                  alt="Unique Explorer"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="md:w-2/3 relative z-10 text-center md:text-left">
                <span className="bg-tertiary-container text-on-tertiary-container px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3 sm:mb-4 inline-block shadow-sm">
                  {mlResults ? "Analysis Complete" : "Profile Identified"}
                </span>
                <h3 className="font-headline font-extrabold text-2xl sm:text-3xl lg:text-4xl text-on-surface mb-3 sm:mb-4 tracking-tight">
                  {mlResults ? mlResults.riskLabel : "The Thoughtful Observer"}
                </h3>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-on-surface-variant italic font-body border-l-4 border-primary/20 pl-4 sm:pl-6 opacity-80">
                  {mlResults ? `"Based on ML v${mlResults.modelVersion}, the overall risk score is ${(mlResults.riskScore * 100).toFixed(0)}%."` : `"Your child finds deep meaning in quiet details and prefers structured environments."`}
                </p>
              </div>
              <div className="absolute -top-12 -right-12 w-48 sm:w-64 h-48 sm:h-64 bg-secondary-container opacity-20 rounded-full blur-3xl"></div>
            </div>

            {/* Developmental Milestones */}
            <div className="bg-surface-container-lowest rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border-t-8 border-primary relative overflow-hidden">
              <h4 className="font-headline font-extrabold text-2xl sm:text-3xl mb-8 sm:mb-12 text-on-surface tracking-tight">AI Observation Summary</h4>
              <div className="space-y-8 sm:space-y-12">
                {mlResults ? (
                  <>
                    <MilestoneProgress label="Eye Contact" status={mlResults.summary.EyeContact > 80 ? "Typical" : "Developing"} progress={`${mlResults.summary.EyeContact}%`} color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                    <MilestoneProgress label="Joint Attention" status={mlResults.summary.JointAttention > 80 ? "Typical" : "Developing"} progress={`${mlResults.summary.JointAttention}%`} color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                    <MilestoneProgress label="Facial Expression" status={mlResults.summary.FacialExpression > 80 ? "Typical" : "Developing"} progress={`${mlResults.summary.FacialExpression}%`} color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                  </>
                ) : (
                  <>
                    <MilestoneProgress label="Sensory Modulation" status="High Focus" progress="82%" color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                    <MilestoneProgress label="Social Communication" status="Developing" progress="65%" color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                    <MilestoneProgress label="Motor Planning" status="Emergent" progress="45%" color="bg-gradient-to-r from-secondary to-secondary-fixed-dim" />
                  </>
                )}
              </div>
              <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-surface-container-low rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-4 border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">info</span>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed opacity-60">These results are based on clinical AI observations. Review with your pediatrician.</p>
              </div>
            </div>

            {/* Strengths & Support Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="bg-secondary-container/40 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-secondary/10 shadow-sm">
                <span className="material-symbols-outlined text-secondary text-4xl sm:text-5xl mb-4 sm:mb-6 block">lightbulb</span>
                <h5 className="font-headline font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-on-secondary-fixed">Key Strengths</h5>
                <ul className="space-y-3 sm:space-y-4 text-on-secondary-container font-medium opacity-80">
                  {[
                    "Exceptional attention to visual detail",
                    "Strong memory for patterns",
                    "Calm in predictable settings"
                  ].map((s, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-secondary text-sm mt-1">check_circle</span>
                      <span className="font-body text-xs sm:text-sm uppercase tracking-wide">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-tertiary-container/40 rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-tertiary/10 shadow-sm">
                <span className="material-symbols-outlined text-tertiary text-4xl sm:text-5xl mb-4 sm:mb-6 block">support_agent</span>
                <h5 className="font-headline font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-on-tertiary-fixed">Recommendations</h5>
                <ul className="space-y-3 sm:space-y-4 text-on-tertiary-container font-medium opacity-80">
                  {(mlResults ? mlResults.recommendations : [
                    "Transitioning between activities",
                    "Managing auditory stimuli",
                    "Initiating social interactions"
                  ]).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3">
                      <span className="material-symbols-outlined text-tertiary text-sm mt-1">error_outline</span>
                      <span className="font-body text-xs sm:text-sm uppercase tracking-wide">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-8 sm:space-y-12">
            {/* Sticky Next Steps */}
            <div className="bg-primary text-on-primary rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl sticky top-32 border border-white/10">
              <h4 className="font-headline font-bold text-2xl sm:text-3xl mb-4 sm:mb-6 tracking-tight">Next Steps</h4>
              <p className="mb-8 sm:mb-10 opacity-80 leading-relaxed font-medium text-sm sm:text-base lg:text-lg">Discuss these results with a certified child development specialist.</p>
              <div className="flex flex-col gap-3 sm:gap-4">
                <button className="bg-white text-primary font-extrabold py-4 sm:py-5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-surface-bright transition-all shadow-lg active:scale-95 text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg sm:text-xl">calendar_month</span>
                  Book Consultation
                </button>
                <button className="bg-primary-dim text-white font-extrabold py-4 sm:py-5 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-3 hover:bg-black/20 transition-all border border-white/20 active:scale-95 text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg sm:text-xl">download</span>
                  Download Report
                </button>
              </div>
              <div className="mt-8 sm:mt-10 flex items-center gap-3 sm:gap-4 bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                <span className="material-symbols-outlined text-tertiary-fixed">shield_with_heart</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">HIPAA Secured</span>
              </div>
            </div>

            {/* Expert Recommendation */}
            <div className="bg-surface-container-high rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-outline-variant/10 shadow-sm">
              <h5 className="font-headline font-bold text-base sm:text-lg mb-4 sm:mb-6 text-on-surface uppercase tracking-widest opacity-40">Recommended Expert</h5>
              <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full overflow-hidden border-2 border-primary/20 relative">
                  <Image src="https://lh3.googleusercontent.com/aida-public/AB6AXuALVyW70yo3izlVQ2BQGcBonXRFLBz5II35OWUchu1yeKTTJQSBDUVqPrkvK4a76ZoTfYx4wzpQKlxat9cm-0r6nl1wSuNyZpWgfGC_he_CurbkloHDrmz1xLHL61tGgkvMdtwxcex5Afr5RHG3g2LI7wVKr1uH41uFKFeQ5X1PIWrlUrTlKYI00_KinP3bYSIkpYwPmwanDGnZojt8stGuPngHO5cdu21vISS7uVLzQCnZl-VM9q-DV-qn0igql71PljXeruLR50E" alt="Dr. Sarah Chen" fill className="object-cover" />
                </div>
                <div>
                  <h6 className="font-extrabold text-on-surface text-sm sm:text-base">Dr. Sarah Chen</h6>
                  <p className="text-[10px] text-on-surface-variant font-extrabold uppercase tracking-widest opacity-60">Pediatric OT</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mb-4 sm:mb-6 font-medium leading-relaxed opacity-60">Specializes in sensory processing support.</p>
              <a className="text-primary font-extrabold text-[10px] flex items-center gap-2 hover:underline uppercase tracking-widest" href="#">
                View Profile
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </aside>
        </div>

        {/* Curated Resources */}
        <div className="mt-24 sm:mt-32 lg:mt-40">
          <h3 className="font-headline font-extrabold text-3xl sm:text-4xl lg:text-6xl mb-10 sm:mb-16 tracking-tighter text-primary">Curated Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
            {[
              { title: "Building a Home Sensory Haven", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfFGuSXR_iodvByMIVAU1pCXe7mLfrsVNd_IV42vtLskk_amT6u70Y3A-P-Ev_BR5ZQoFd_doA4lgiEVzeuRBjLeuYvKyAln4uAewDH5rmBgBYwRpYuLxrao52Befg5p-qcKaHP_pyoLSDCIsYYtYb_3FcdXhmkMPiucpQbDnfBRdWvtQOeqlcyanIOCivtPKH8ygmlNTvCc2g4Gf_-HgNETCd-ctufHlZx1244Frp_y2xw9ArXrvi9cPzjIDDVQLPtXD5sMh9aRo", desc: "Simple adjustments for a low-arousal environment." },
              { title: "The Art of Gentle Transitions", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6EFi9Bpyxu63kdK5PwQ949MoUtkGp7tKfWv70kLvDS2whfK3H-HK5Gd1_007MjK_-eIfYL0lm1NesG3KE--Y3OgcYuSTJHTC9fRyPE6kIjY-20Og2ic8dSIaC3Ydo3PoWzEf5CB4NkYXCb8vV9Ft6k54PYmkXehQyxuo2MU3OnwHwaE3xuSOKJjsD3QKfhAs5tjlpLkOK7P1erCdDkkQh-_nq54ijRTnxOGMN1LxCfM5zdyovjNlXyn_vdE_mFv5UWQ9rf7asMrQ", desc: "Moving between activities without overwhelm." },
              { title: "Sensory Snacks for Daily Life", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBK0ZEi9DyHphi1q5F44iV4PvSQgenqKrKEBP_wrl037m3EvRRZ7NiWcGgRnzfKC4BC3wvtlgRjrBP0BObCg1UjaeAkkCC4r1P42ZwlwtCX_TDmTI0H_-RyWmfy_erxK6nriviCatR9YaJbjSMUN-Sb-CIuKkFV8eOOvJ7XCbtbUI__E8m_4r9XcpS373qFI5m0cOMN625Py0-YAANAd8crI3WzmLV2BB0XpoenBYmbmwoawyAQ2oolv8k_PhjCaCmQZ8mjSVi0QLY", desc: "Quick activities to regulate throughout the day." }
            ].map((res, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-video rounded-2xl sm:rounded-3xl overflow-hidden mb-4 sm:mb-6 bg-surface-container-highest relative shadow-lg border border-outline-variant/5">
                  <Image src={res.img} alt={res.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h4 className="font-headline font-bold text-lg sm:text-xl lg:text-2xl group-hover:text-primary transition-colors mb-2 sm:mb-3 tracking-tight">{res.title}</h4>
                <p className="text-xs sm:text-sm text-on-surface-variant font-medium leading-relaxed opacity-60">{res.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
