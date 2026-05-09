import Accordion from "../components/common/Accordion"
import Container from "../components/common/Container"
import SectionHeader from "../components/common/SectionHeader"

const CliniciansPage = () => {
  const faqs = [
    {
      title: "How are confidence scores calibrated?",
      content:
        "Scores are calibrated against cohort baselines, with clinician review loops and performance drift monitoring.",
    },
    {
      title: "Can I audit the AI outputs?",
      content:
        "Yes. Every insight includes explainability artifacts, contributing signals, and context notes.",
    },
    {
      title: "Does the platform integrate with local protocols?",
      content:
        "Care pathways can be configured to reflect local guidelines, available services, and escalation rules.",
    },
  ]

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 py-16 text-white">
        <Container>
          <SectionHeader
            eyebrow="For Clinicians"
            title="Decision support that respects clinical expertise."
            subtitle="Objective signals, explainable AI, and confidence indicators help clinicians act earlier and coordinate care."
            tone="light"
          />
        </Container>
      </section>

      <section>
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              "Objective behavioral insights with evidence trails",
              "Confidence indicators calibrated per cohort",
              "Longitudinal timelines for developmental trends",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-900">{item}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Designed to support faster, more confident decisions.
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container>
          <div className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader
                eyebrow="Clinical Workbench"
                title="A unified view for care coordination."
                subtitle="Merge caregiver narratives, AI signals, and specialist notes into one clinical story."
              />
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>Risk stratification and cohort comparison views.</li>
                <li>Explainability and evidence trails for each signal.</li>
                <li>Care pathway recommendations aligned to guidelines.</li>
                <li>Secure collaboration across multidisciplinary teams.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Sample Insights
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  Attention shifts detected in play-based session
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Co-regulation support recommended for new routines
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Sensory load threshold identified across contexts
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <SectionHeader
            eyebrow="Clinical FAQs"
            title="Answers for care teams and program leads."
            subtitle="Designed to support procurement, governance, and clinical confidence."
          />
          <div className="mt-8 grid gap-4">
            <Accordion items={faqs} />
          </div>
        </Container>
      </section>
    </div>
  )
}

export default CliniciansPage

