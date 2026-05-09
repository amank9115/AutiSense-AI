import Container from "../components/common/Container"
import SectionHeader from "../components/common/SectionHeader"

const AboutPage = () => {
  return (
    <div className="space-y-16 pb-20">
      <section className="bg-slate-900 py-16 text-white">
        <Container>
          <SectionHeader
            eyebrow="About / Vision"
            title="A future where every child gets earlier, more compassionate support."
            subtitle="NEUROLYTIX-AI exists to reduce the delay between first concern and meaningful care by building trusted AI for clinicians and caregivers."
            tone="light"
          />
        </Container>
      </section>

      <section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader
                eyebrow="Our Mission"
                title="Elevate human expertise with responsible AI."
                subtitle="We work alongside clinicians, researchers, and government bodies to deliver ethical, transparent, and scalable early screening intelligence."
              />
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>Clinical rigor built into product development.</li>
                <li>Inclusive research partnerships and validation networks.</li>
                <li>Continuous caregiver feedback loops.</li>
                <li>Transparency as a product requirement, not a feature.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Long-Term Vision
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  Early screening intelligence in every pediatric workflow
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  AI tools that support, not replace, clinical judgment
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Global access to ethical care technology
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default AboutPage
