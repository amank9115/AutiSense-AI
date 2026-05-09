import Container from "../components/common/Container"
import FeatureCard from "../components/common/FeatureCard"
import SectionHeader from "../components/common/SectionHeader"

const TechnologyPage = () => {
  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 py-16 text-white">
        <Container>
          <SectionHeader
            eyebrow="Technology & AI"
            title="Ethical, explainable AI designed for healthcare trust."
            subtitle="Our models are trained to surface patterns, not diagnoses. Every inference is paired with transparency artifacts, human review, and bias monitoring."
            tone="light"
          />
        </Container>
      </section>

      <section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "No-diagnosis policy",
                description:
                  "Outputs focus on risk context and care readiness, leaving diagnosis solely to clinicians.",
                accent: "sky",
              },
              {
                title: "Bias mitigation",
                description:
                  "Continuous parity checks across demographics and environmental contexts.",
                accent: "indigo",
              },
              {
                title: "Explainability & transparency",
                description:
                  "Signal-level attribution and clinician-friendly summaries for every insight.",
                accent: "emerald",
              },
            ].map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container>
          <div className="grid gap-8 py-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader
                eyebrow="Security & Governance"
                title="Built to align with clinical governance and public-sector standards."
                subtitle="NEUROLYTIX-AI includes audit logs, data minimization, and configurable retention policies."
              />
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>End-to-end encryption with regional data residency options.</li>
                <li>Model cards and calibration reports for every release.</li>
                <li>Explainability artifacts embedded in clinician views.</li>
                <li>Continuous monitoring for drift and performance decay.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                AI Architecture
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  Multimodal inference layer
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Signal attribution engine
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Cohort analytics & benchmarking
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Care pathway recommendation engine
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default TechnologyPage

