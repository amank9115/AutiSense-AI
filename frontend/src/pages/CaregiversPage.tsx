import Accordion from "../components/common/Accordion"
import Container from "../components/common/Container"
import SectionHeader from "../components/common/SectionHeader"

const CaregiversPage = () => {
  const faqs = [
    {
      title: "Will this replace my child’s clinician?",
      content:
        "No. NEUROLYTIX-AI only surfaces signals and patterns. Care decisions remain with your clinician and care team.",
    },
    {
      title: "How is my child’s data protected?",
      content:
        "Data is minimized, encrypted, and reviewed with consent checkpoints. Families can review what is captured at any time.",
    },
    {
      title: "What if we have limited internet access?",
      content:
        "Offline-first capture flows sync when connectivity is available, ensuring continuity in low-bandwidth settings.",
    },
  ]

  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-white via-sky-50 to-blue-50 py-16">
        <Container>
          <SectionHeader
            eyebrow="For Caregivers"
            title="Support that feels human, not clinical."
            subtitle="NEUROLYTIX-AI empowers families with clarity, reassurance, and a sense of partnership."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              "Guided check-ins that are easy to understand",
              "Progress stories built around routines and strengths",
              "Clear next steps and supportive resources",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-900">{item}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Designed to reduce anxiety and promote confidence.
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <SectionHeader
            eyebrow="Caregiver Dashboard"
            title="A calm home base for understanding progress."
            subtitle="Simple visuals, milestone stories, and practical tips help families stay informed without overwhelm."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Weekly engagement summaries",
              "Emotion regulation highlights",
              "Personalized care suggestions",
              "Community and resource library",
              "Secure messaging with care teams",
              "Offline check-ins and reminders",
            ].map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-slate-100 bg-white p-5 text-sm text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container>
          <SectionHeader
            eyebrow="Caregiver Questions"
            title="Answers that keep families grounded."
            subtitle="We prioritize trust, clarity, and consent in every caregiver touchpoint."
          />
          <div className="mt-8 grid gap-4">
            <Accordion items={faqs} />
          </div>
        </Container>
      </section>
    </div>
  )
}

export default CaregiversPage

