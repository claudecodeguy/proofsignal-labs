import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 90 ? "#1A6B45" : score >= 75 ? "#B07A10" : "#8B1E2F";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs font-semibold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function SampleLeadCard() {
  return (
    <div className="card overflow-hidden shadow-panel">
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1">Sample Lead Packet</p>
            <h3 className="font-semibold text-sm text-ink">Bright Smiles Family Dentistry</h3>
            <p className="font-mono text-xs text-ink-muted mt-0.5">brightsmilesdentistry.com</p>
          </div>
          <span className="badge-approved">Approved</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-muted">
          <span className="font-mono">Austin, TX</span>
          <span className="text-border">·</span>
          <span className="font-mono">3 locations</span>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-border/60 bg-canvas-subtle">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-2xs text-ink-faint uppercase tracking-wider">Confidence Score</span>
          <span className="font-mono text-xs font-semibold text-approved">94 / 100</span>
        </div>
        <ConfidenceBar score={94} />
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {[
          { label: "Practice Software", value: "Dentrix (confirmed)" },
          { label: "HIPAA Portal", value: "Active" },
          { label: "Why Now", value: "3rd location opening + 2 open roles" },
          { label: "Contact", value: "Dr. Patricia Nguyen, Owner" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="font-mono text-2xs text-ink-faint uppercase tracking-wider shrink-0 pt-0.5">{label}</span>
            <span className="text-xs text-ink text-right">{value}</span>
          </div>
        ))}
      </div>

      <div className="px-5 pb-5">
        <div className="evidence-card text-xs text-ink-muted leading-relaxed">
          <p className="font-mono text-2xs text-teal uppercase tracking-wider mb-1.5">Evidence Snippet</p>
          "Careers page lists requirement: 'Experience with Dentrix or Eaglesoft preferred.' Footer banner: 'Now open in Round Rock — accepting new patients!'"
          <p className="font-mono text-2xs text-ink-faint mt-2">
            source: brightsmilesdentistry.com/careers
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden grid-texture">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal/4 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-teal/3 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-up">
              <div className="flex items-center gap-2 mb-6">
                <span className="section-label">For Dental MSPs &amp; MSSPs</span>
                <span className="font-mono text-xs text-ink-faint">·</span>
                <span className="badge-teal">US Market</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl md:text-[52px] text-ink leading-[1.08] tracking-tight mb-6">
                Dental clinic leads that arrive with{" "}
                <em className="not-italic text-teal">evidence.</em>
              </h1>

              <p className="text-lg text-ink-muted leading-relaxed mb-8 max-w-lg">
                ProofSignal Labs discovers, validates, and packages exclusive dental clinic
                prospects for dental-focused MSPs. Every lead includes source evidence,
                a confidence score, a verified work contact, and a clear reason to reach out — now.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <Link href="/contact" className="btn-primary">
                  Request Sample Batch
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href="/sample-lead" className="btn-secondary">
                  See a Real Sample Lead
                </Link>
              </div>

              {/* Credibility bar */}
              <div className="flex flex-wrap items-center gap-5">
                {[
                  ["Exclusive by territory", "#1E7B7E"],
                  ["Verified work contacts", "#1A6B45"],
                  ["Source-backed fields", "#18182B"],
                  ["Replacement policy", "#18182B"],
                ].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color as string }} />
                    <span className="font-mono text-xs text-ink-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-up delay-200">
              <SampleLeadCard />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="ruled-line" />
      </div>

      {/* ── Why it's different ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Why It&apos;s Different</p>
          <h2 className="section-title">Not a list. A qualified prospect.</h2>
          <p className="section-body mt-4 max-w-xl mx-auto">
            Unqualified contact lists give you names. ProofSignal Labs gives you validated
            prospects with the evidence to start a real conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 10L8 15L17 5" stroke="#1E7B7E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
              label: "Evidence-Backed",
              title: "Every field has a source",
              body:
                "Location count, practice software, HIPAA signals — each field is extracted from a specific public page with the source URL stored alongside it. You see exactly what we saw.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" stroke="#1E7B7E" strokeWidth="1.5" />
                  <rect x="11" y="3" width="6" height="6" rx="1" stroke="#1E7B7E" strokeWidth="1.5" />
                  <rect x="3" y="11" width="6" height="6" rx="1" stroke="#1E7B7E" strokeWidth="1.5" />
                  <path d="M14 11V17M11 14H17" stroke="#1E7B7E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
              label: "Confidence-Scored",
              title: "No guessing. No hallucination.",
              body:
                "A structured confidence score (0–100) is generated for every record. Leads below threshold are automatically rejected. Borderline records receive a second-pass review.",
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7" stroke="#1E7B7E" strokeWidth="1.5" />
                  <path d="M10 6V10L13 12" stroke="#1E7B7E" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
              label: "Exclusive Delivery",
              title: "Locked per territory, per niche",
              body:
                "Every approved lead is locked to your territory and niche for the active exclusivity window. It will not be resold to a competing MSP in your market during that period.",
            },
          ].map(({ icon, label, title, body }) => (
            <div key={label} className="card p-6 group hover:shadow-card-hover transition-shadow">
              <div className="w-9 h-9 rounded border border-teal/20 bg-teal-pale flex items-center justify-center mb-4">
                {icon}
              </div>
              <p className="font-mono text-xs text-teal uppercase tracking-wider mb-2">{label}</p>
              <h3 className="font-semibold text-base text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you receive ── */}
      <section className="bg-canvas-subtle border-y border-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-label mb-3">What You Receive</p>
              <h2 className="section-title mb-5">
                A lead packet, not a spreadsheet row.
              </h2>
              <p className="section-body mb-8">
                Each approved lead includes a structured packet: practice snapshot, geography,
                technology signals, compliance signals, growth triggers, a verified work contact,
                and evidence snippets linked back to their source pages.
              </p>
              <Link href="/sample-lead" className="btn-secondary">
                View full sample lead packet
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5H11M7.5 3L11 6.5L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="card divide-y divide-border overflow-hidden">
              {[
                { label: "Company", value: "Bright Smiles Family Dentistry" },
                { label: "Geography", value: "Austin, TX · 3 locations" },
                { label: "Practice Software", value: "Dentrix (page evidence)" },
                { label: "HIPAA Signal", value: "Patient portal confirmed" },
                { label: "Why Now", value: "3rd location + active hiring" },
                { label: "Contact", value: "Dr. Patricia Nguyen, Owner" },
                { label: "Email", value: "Verified work email" },
                { label: "Confidence", value: "94 / 100 — Approved" },
                { label: "Exclusivity", value: "Available · TX · 180 days" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono text-2xs text-ink-faint uppercase tracking-wider">{label}</span>
                  <span className="text-sm text-ink font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="section-label mb-3">Process</p>
          <h2 className="section-title">Three steps from discovery to your inbox.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-border" />

          {[
            {
              step: "01",
              title: "Discover & Validate",
              body:
                "We discover dental clinic candidates from approved public sources. Each candidate is reviewed from public business pages, extracted into structured fields, and run through our confidence engine. Weak records are automatically rejected.",
            },
            {
              step: "02",
              title: "Package with Evidence",
              body:
                "Approved records become structured lead packets. Every field has a source. Technology signals, compliance indicators, and growth triggers are documented, scored, and linked to the pages where we found them.",
            },
            {
              step: "03",
              title: "Deliver Exclusively",
              body:
                "You receive a sample batch for your territory. If you move forward, leads are locked exclusively to your market for the agreed window. Not resold to competing providers.",
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="relative">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-teal flex items-center justify-center mb-5 relative z-10">
                <span className="font-mono text-xs font-semibold text-teal">{step}</span>
              </div>
              <h3 className="font-semibold text-base text-ink mb-2">{title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust section ── */}
      <section className="bg-ink py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-mono text-xs font-medium tracking-widest text-teal-light uppercase mb-4">
                Operating Principle
              </p>
              <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight mb-6">
                We abstain before we guess.
              </h2>
              <p className="text-navy-text leading-relaxed mb-6">
                If the evidence isn&apos;t there, the record is rejected. Our system never
                invents missing fields, fills gaps with inference, or assigns a confidence
                score the data doesn&apos;t support. Every approved lead earned its score.
              </p>
              <Link href="/methodology" className="inline-flex items-center gap-2 text-sm font-medium text-teal-light hover:text-white transition-colors">
                Read our methodology
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5H11M7.5 3L11 6.5L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { metric: "≥90", label: "Score to auto-approve" },
                { metric: "4", label: "Source pages reviewed per record" },
                { metric: "0", label: "Invented fields" },
                { metric: "180d", label: "Default exclusivity window" },
              ].map(({ metric, label }) => (
                <div key={label} className="bg-navy-light border border-navy-border rounded p-5">
                  <p className="font-mono text-3xl font-semibold text-teal-light mb-1">{metric}</p>
                  <p className="text-sm text-navy-text">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Replacement assurance ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card p-6 border-l-2 border-teal">
            <p className="font-mono text-xs text-teal uppercase tracking-wider mb-3">Replacement Policy</p>
            <h3 className="font-semibold text-base text-ink mb-2">Material errors are replaced at no charge.</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Every lead includes the source URLs and evidence items we used to qualify it.
              If you identify a material data error in a delivered lead, contact us and we will
              review it and replace it at no charge.
            </p>
          </div>
          <div className="card p-6 border-l-2 border-approved">
            <p className="font-mono text-xs text-approved uppercase tracking-wider mb-3">Exclusivity Policy</p>
            <h3 className="font-semibold text-base text-ink mb-2">Your territory, your leads.</h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Approved leads are locked by territory and niche for the active exclusivity window
              and are not resold to competing MSPs in that market during the lock period.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pilot results placeholder ── */}
      <section className="bg-canvas-subtle border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="section-label mb-3">Early Results</p>
            <h2 className="section-title mb-3">Pilot performance.</h2>
            <p className="section-body max-w-md mx-auto">
              As founding-buyer pilots begin, we will publish early operating results here:
              verification rates, positive replies, meetings booked, and replacement rates.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Leads Delivered", value: "—" },
              { label: "Verified Contact Rate", value: "—" },
              { label: "Positive Reply Rate", value: "—" },
              { label: "Meetings Booked", value: "—" },
              { label: "Replacement Rate", value: "—" },
            ].map(({ label, value }) => (
              <div key={label} className="card p-5 text-center">
                <p className="font-mono text-2xl font-semibold text-ink-faint mb-1">{value}</p>
                <p className="font-mono text-2xs text-ink-faint">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials placeholder ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <p className="section-label mb-3">Buyer Feedback</p>
          <h2 className="section-title mb-3">What buyers say.</h2>
          <p className="section-body max-w-md mx-auto">
            Early buyer feedback will appear here as pilot batches are delivered.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Dental-focused MSP · Southwest U.S.",
            "Dental-focused MSSP · Texas",
            "MSP building dental vertical · Southeast U.S.",
          ].map((label) => (
            <div key={label} className="card p-6 flex flex-col gap-4">
              <div className="flex-1 min-h-[80px] flex items-center justify-center border border-dashed border-border rounded">
                <p className="font-mono text-xs text-ink-faint text-center px-4">Testimonial coming soon</p>
              </div>
              <p className="font-mono text-2xs text-ink-faint">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Case study placeholder ── */}
      <section className="bg-canvas-subtle border-y border-border py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div>
              <p className="section-label mb-3">Case Studies</p>
              <h2 className="section-title mb-3">Founding-buyer outcomes.</h2>
              <p className="section-body">
                Case studies will be published here as pilot engagements conclude.
                Each will include buyer type, territory, what was delivered, and early results.
              </p>
            </div>
            <div className="lg:col-span-2 card p-6 flex items-center justify-center min-h-[160px] border border-dashed border-border">
              <p className="font-mono text-xs text-ink-faint text-center">
                First case study in progress — publishing after pilot batch conclusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <p className="section-label mb-3">FAQ</p>
            <h2 className="section-title">Common questions.</h2>
          </div>

          <div className="lg:col-span-2 space-y-0 divide-y divide-border">
            {[
              {
                q: "How is this different from a list broker or ZoomInfo?",
                a: "ZoomInfo is a broad contact database — it gives you contacts, not dental clinic analysis. List brokers deliver raw contact data with no validation of fit. ProofSignal Labs is a vertical lead intelligence product: every lead includes evidence of why each clinic is a fit for IT services, a confidence score, and a verified work contact. It's a qualified prospect, not a database row.",
              },
              {
                q: "Are leads really exclusive?",
                a: "Yes. Every approved lead is locked to your territory and niche for a configurable window (default 180 days). We do not sell the same lead to competing MSPs in your market during that period.",
              },
              {
                q: "What does a sample batch look like?",
                a: "A sample batch is typically 3–5 approved lead packets from your target region. Each includes the full lead: company snapshot, verified contact, evidence items with source URLs, confidence score, and a why-now trigger reason.",
              },
              {
                q: "What geographies do you cover?",
                a: "Phase 1 focuses on the U.S. market, region by region. We run discovery against specific states or metros at a time so we can validate quality before expanding coverage.",
              },
              {
                q: "What if a lead turns out to be wrong?",
                a: "Every lead includes the source URLs and evidence items we used to score it. If you identify a material error, contact us and we will review it and replace it at no charge.",
              },
              {
                q: "Do you guarantee meetings or revenue?",
                a: "No. We validate using publicly available evidence and deliver qualified prospects — not guarantees. What we can promise is that every approved lead passed our confidence threshold, includes source-backed fields, and comes with a verified work contact.",
              },
            ].map(({ q, a }) => (
              <details key={q} className="group py-5 cursor-pointer">
                <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-ink list-none select-none">
                  {q}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                  >
                    <path d="M3 6L8 11L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="mt-3 text-sm text-ink-muted leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-teal-pale border-y border-teal/20 py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="section-label mb-4">Get Started</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink leading-tight mb-5">
            Tell us your territory. See real leads.
          </h2>
          <p className="text-ink-muted mb-8 max-w-md mx-auto">
            We&apos;ll prepare 3–5 approved, evidence-backed dental clinic prospects from your
            market. No obligation. No generic list.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn-primary">
              Request Free Sample Batch
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/methodology" className="btn-secondary">
              Read Our Methodology
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
