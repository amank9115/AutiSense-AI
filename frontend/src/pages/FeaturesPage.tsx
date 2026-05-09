import { useMemo, useState } from "react"

import Container from "../components/common/Container"
import FeatureCard from "../components/common/FeatureCard"
import SectionHeader from "../components/common/SectionHeader"

const FeaturesPage = () => {
  const filters = [
    { id: "all", label: "All" },
    { id: "clinicians", label: "Clinicians" },
    { id: "caregivers", label: "Caregivers" },
    { id: "operations", label: "Operations" },
    { id: "ai", label: "AI & Trust" },
  ]

  const features = [
    {
      title: "Behavioral intelligence",
      description:
        "Multi-signal engine to detect attention, engagement, and sensory regulation markers.",
      accent: "sky",
      tags: ["ai", "clinicians"],
    },
    {
      title: "Emotion & attention analysis",
      description:
        "Context-aware analysis for emotional regulation and co-regulation patterns.",
      accent: "indigo",
      tags: ["ai", "clinicians"],
    },
    {
      title: "Explainable AI insights",
      description:
        "Plain-language summaries and evidence trails clinicians can audit.",
      accent: "emerald",
      tags: ["ai", "clinicians"],
    },
    {
      title: "Caregiver dashboards",
      description:
        "Progress tracking, routines, and supportive guidance without jargon.",
      accent: "violet",
      tags: ["caregivers"],
    },
    {
      title: "Clinician workbench",
      description:
        "Objective markers, confidence indicators, and cohort comparisons.",
      accent: "sky",
      tags: ["clinicians"],
    },
    {
      title: "Offline & low-bandwidth support",
      description:
        "Lightweight capture kits and sync pipelines for remote clinics.",
      accent: "indigo",
      tags: ["operations", "caregivers"],
    },
  ]

  const [activeFilter, setActiveFilter] = useState("all")

  const filteredFeatures = useMemo(() => {
    if (activeFilter === "all") {
      return features
    }
    return features.filter((feature) => feature.tags.includes(activeFilter))
  }, [activeFilter, features])

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-white py-16">
        <Container>
          <SectionHeader
            eyebrow="Platform Features"
            title="Built for precision, empathy, and scale."
            subtitle="Each capability is designed to surface meaningful signals without overwhelming clinicians or caregivers."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive = filter.id === activeFilter
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  aria-pressed={isActive}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {filteredFeatures.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <SectionHeader
            eyebrow="Care Intelligence Stack"
            title="Everything teams need to coordinate early intervention."
            subtitle="From intake to longitudinal care tracking, NEUROLYTIX-AI keeps teams aligned."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "Unified screening timeline",
                description:
                  "See caregiver notes, AI signals, and clinician decisions in one narrative timeline.",
              },
              {
                title: "Integrated care pathways",
                description:
                  "Recommended next steps tailored to local protocols and availability.",
              },
              {
                title: "Risk stratification dashboards",
                description:
                  "Segment cohorts by risk markers, geography, and care access needs.",
              },
              {
                title: "Secure collaboration",
                description:
                  "Role-based views for pediatricians, therapists, and care coordinators.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-3 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}

export default FeaturesPage
