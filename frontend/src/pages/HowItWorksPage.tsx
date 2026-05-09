import { useState } from "react"

import Container from "../components/common/Container"
import FeatureCard from "../components/common/FeatureCard"
import SectionHeader from "../components/common/SectionHeader"

const HowItWorksPage = () => {
  const steps = [
    {
      title: "Caregiver narrative + consent",
      detail:
        "Caregivers capture routines, concerns, and context in a guided, trauma-informed flow that prioritizes consent and clarity.",
      signals: [
        "Caregiver story prompts",
        "Home context snapshot",
        "Consent checkpoints",
      ],
    },
    {
      title: "Clinician screening & triage",
      detail:
        "Clinicians combine structured intake with observational screening to set a trusted baseline and determine next-step pathways.",
      signals: [
        "Standardized screening grid",
        "Clinician observation notes",
        "Care urgency scoring",
      ],
    },
    {
      title: "AI signal interpretation",
      detail:
        "Our models evaluate attention, engagement, and co-regulation cues while surfacing explainable evidence for each signal.",
      signals: [
        "Attention rhythm analysis",
        "Co-regulation markers",
        "Explainability artifacts",
      ],
    },
    {
      title: "Care pathway recommendations",
      detail:
        "Care teams receive priority actions, local resource mapping, and follow-up cadences tailored to each family’s context.",
      signals: [
        "Care pathway map",
        "Resource availability",
        "Follow-up cadence",
      ],
    },
  ]

  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-sky-50 via-white to-blue-50 py-16">
        <Container>
          <SectionHeader
            eyebrow="How It Works"
            title="A step-by-step care intelligence flow built for clarity."
            subtitle="Every signal is traceable, every recommendation is explainable, and every decision stays in the hands of clinical teams."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Structured intake",
                description:
                  "Guided caregiver questionnaires, clinician observations, and environmental context capture early signals consistently.",
                accent: "sky",
              },
              {
                title: "Multimodal analysis",
                description:
                  "Video, audio, and interaction markers are analyzed with attention and engagement models designed for transparency.",
                accent: "indigo",
              },
              {
                title: "Explainable outputs",
                description:
                  "Clinicians receive insight summaries, confidence ranges, and supporting evidence for each signal.",
                accent: "emerald",
              },
            ].map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <SectionHeader
            eyebrow="Clinical Loop"
            title="Human oversight is embedded in every step."
            subtitle="NEUROLYTIX-AI does not replace clinicians. It amplifies their ability to see patterns early and coordinate long-term care."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.45fr_0.55fr]">
            <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {steps.map((step, index) => {
                const isActive = activeStep === index
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`min-w-[220px] rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition lg:min-w-0 ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-200"
                        : "border-slate-100 bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                      Step {index + 1}
                    </p>
                    <p className="mt-3 text-base">{step.title}</p>
                  </button>
                )
              })}
            </div>
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Active Step {activeStep + 1}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {steps[activeStep].title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {steps[activeStep].detail}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {steps[activeStep].signals.map((signal) => (
                  <div
                    key={signal}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700"
                  >
                    {signal}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default HowItWorksPage

