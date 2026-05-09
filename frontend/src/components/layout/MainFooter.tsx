const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
              <span className="text-sm font-semibold">N</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                NEUROLYTIX-AI
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Care Intelligence
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Early neurodevelopment screening intelligence, built with empathy
            and transparency. We surface signals, empower clinicians, and
            support caregivers without replacing human judgment.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Platform
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Behavioral Signal Engine</li>
            <li>Explainable AI Reports</li>
            <li>Care Pathway Orchestration</li>
            <li>Offline Screening Kits</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trust
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Ethical AI Council</li>
            <li>No-Diagnosis Policy</li>
            <li>Bias & Drift Monitoring</li>
            <li>Clinical Validation Network</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Partnerships: hello@neurolytix.ai</li>
            <li>Care Programs: care@neurolytix.ai</li>
            <li>Research: research@neurolytix.ai</li>
            <li>Clinical Support: support@neurolytix.ai</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <p>(c) 2026 NEUROLYTIX-AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Privacy & Ethics</span>
            <span>Security</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

