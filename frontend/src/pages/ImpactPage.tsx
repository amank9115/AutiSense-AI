import Container from "../components/common/Container"
import ProgressMeter from "../components/common/ProgressMeter"
import SectionHeader from "../components/common/SectionHeader"
import StatCard from "../components/common/StatCard"

const ImpactPage = () => {
  return (
    <div className="space-y-16 pb-20">
      <section className="bg-linear-to-br from-white via-sky-50 to-blue-50 py-16">
        <Container>
          <SectionHeader
            eyebrow="Impact & Social Value"
            title="Early insights change the arc of care."
            subtitle="Our platform focuses on equitable access, earlier intervention, and long-term developmental support."
          />
        </Container>
      </section>

      <section>
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Early intervention"
              value="Up to 6 months"
              detail="Faster access to support services in pilot regions."
            />
            <StatCard
              label="Low-resource reach"
              value="60%"
              detail="Deployment footprint in low-bandwidth clinics."
            />
            <StatCard
              label="Caregiver trust"
              value="92%"
              detail="Reported higher confidence in care decisions."
            />
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <SectionHeader
            eyebrow="Impact Signals"
            title="Measuring trust, access, and follow-through."
            subtitle="We track outcomes that matter to families and care teams, not just model performance."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <ProgressMeter
              label="Care plan follow-through"
              value={84}
              note="Families report higher confidence completing recommended next steps."
            />
            <ProgressMeter
              label="Equity reach"
              value={67}
              note="Growth in screenings supported at low-bandwidth community clinics."
            />
            <ProgressMeter
              label="Clinician confidence"
              value={91}
              note="Clinician alignment on AI insights during pilot reviews."
            />
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container>
          <div className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <SectionHeader
                eyebrow="Social Commitments"
                title="Equitable care, everywhere."
                subtitle="We partner with health systems and governments to deploy ethical AI in underserved communities."
              />
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li>Offline-first screening kits for remote clinics.</li>
                <li>Local language support for caregiver workflows.</li>
                <li>Community training for frontline health workers.</li>
                <li>Privacy-respecting data minimization practices.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Care Pathway Outcomes
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-white px-4 py-3">
                  Earlier therapy enrollment for high-risk cohorts
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Improved care coordination between pediatrics and therapy
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  Reduced caregiver stress through clearer guidance
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  )
}

export default ImpactPage

