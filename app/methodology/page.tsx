import type { Metadata } from "next";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Methodology – How ProofSignal Labs Validates Dental Clinic Leads",
  description:
    "Learn how ProofSignal Labs discovers, validates, and scores dental clinic leads using public-source research, structured extraction, and a confidence engine.",
};

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[40px_1fr] gap-5 pb-10 border-b border-border last:border-0 last:pb-0">
      <div className="pt-0.5">
        <div className="w-8 h-8 rounded-full border border-teal/40 bg-teal-pale flex items-center justify-center">
          <span className="font-mono text-xs font-semibold text-teal">{number}</span>
        </div>
        <div className="mx-auto w-px h-full bg-border mt-3 last:hidden" />
      </div>
      <div>
        <h3 className="font-semibold text-base text-ink mb-2">{title}</h3>
        <div className="text-sm text-ink-muted leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero */}
      <section className="border-b border-border bg-canvas-subtle py-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="section-label mb-4">Methodology</p>
          <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-5">
            How we build a lead you can trust.
          </h1>
          <p className="text-lg text-ink-muted leading-relaxed mb-5">
            Every ProofSignal Labs lead is the output of a structured validation pipeline:
            candidate discovery, controlled source collection, structured extraction, automated
            validation, and confidence scoring. No hallucination. No invented fields. No guessing.
          </p>
          <p className="text-sm text-ink-muted leading-relaxed border-l-2 border-teal pl-4">
            We rely on approved public business pages and structured validation so buyers receive
            evidence-backed prospect packets rather than generic lists or unsupported contact data.
          </p>
        </div>
      </section>

      {/* Principle bar */}
      <section className="border-b border-border bg-ink py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-center">
            {[
              "Abstain before guessing",
              "Reject before approving",
              "Evidence before output",
            ].map((principle) => (
              <div key={principle} className="flex flex-col items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-light inline-block" />
                <span className="font-mono text-sm text-navy-text">{principle}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-10">
          <Step number="01" title="Candidate Discovery">
            <p>
              We discover dental clinic candidates through structured discovery jobs. Sources include
              dental directories, search-driven domain discovery, and curated source page ingestion.
              Each discovery run is scoped to a specific U.S. region — state, metro, or city — so
              results stay relevant and manageable.
            </p>
            <p>
              Discovery runs against the active vertical configuration, not hard-coded search logic.
              This ensures dental-specific patterns are applied consistently across every run.
            </p>
          </Step>

          <Step number="02" title="Source Collection">
            <p>
              For each candidate, we review a small, fixed set of approved public page types only.
              We do not run recursive site crawls. Page targets in Phase 1 include:
            </p>
            <ul className="list-none space-y-1 font-mono text-xs text-ink-muted">
              {["Homepage", "About", "Contact", "Locations", "Careers / Jobs", "Privacy / Patient Forms"].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-teal inline-block shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <p>
              The default cap is 4 approved pages per company. Borderline records may be escalated
              to 6 pages if key fields are missing and the run still has budget remaining. Page
              content is hashed so unchanged pages are not reprocessed unnecessarily.
            </p>
          </Step>

          <Step number="03" title="Structured Extraction">
            <p>
              Approved pages are analyzed through a structured extraction pipeline. Each field is
              extracted individually with a confidence rating attached. The system does not summarize
              or paraphrase freely — it extracts specific, attributable values from public sources.
            </p>
            <p>
              Evidence items are stored alongside each extracted field. Each evidence item records:
              the source URL, the page title, the matched text, the evidence type, and a per-field
              confidence score.
            </p>
            <div className="evidence-card text-xs font-mono text-ink-muted space-y-1">
              <p className="text-teal uppercase tracking-wider text-2xs mb-2">Evidence item format</p>
              <p><span className="text-ink-faint">field:</span> technology_clues</p>
              <p><span className="text-ink-faint">text:</span> "Experience with Dentrix or Eaglesoft preferred"</p>
              <p><span className="text-ink-faint">source:</span> /careers</p>
              <p><span className="text-ink-faint">type:</span> careers</p>
              <p><span className="text-ink-faint">confidence:</span> 91</p>
            </div>
          </Step>

          <Step number="04" title="Automated Validation">
            <p>
              Every candidate passes through our validation engine before a status is assigned.
              The engine applies hard rules and cross-check rules before scoring.
            </p>
            <p className="font-medium text-ink">Hard rejection rules:</p>
            <ul className="list-none space-y-1">
              {[
                "Domain is invalid or dead",
                "Geography is outside configured market",
                "Vertical classification is weak or unsupported",
                "No credible source URLs are present",
                "Contact email is missing or unverified",
                "Duplicate domain already exists in active window",
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2 font-mono text-xs text-ink-muted">
                  <span className="w-1 h-1 rounded-full bg-rejected inline-block shrink-0 mt-1.5" />
                  {rule}
                </li>
              ))}
            </ul>
            <p>
              Cross-check rules verify consistency across pages. Company name, location, and vertical
              classification must be supported by evidence from at least two sources — or one very
              strong, unambiguous signal.
            </p>
          </Step>

          <Step number="05" title="Confidence Scoring">
            <p>
              Every record receives a confidence score from 0 to 100. The score combines:
              source availability, source consistency, field completeness, contact quality,
              geography certainty, niche certainty, and trigger strength.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { range: "90–100", label: "Approved", color: "#1A6B45", bg: "#EBF5F0" },
                { range: "75–89", label: "Borderline", color: "#B07A10", bg: "#FDF6E8" },
                { range: "< 75", label: "Rejected", color: "#8B1E2F", bg: "#F9ECED" },
              ].map(({ range, label, color, bg }) => (
                <div
                  key={label}
                  className="rounded border p-3 text-center"
                  style={{ backgroundColor: bg, borderColor: `${color}40` }}
                >
                  <p className="font-mono text-lg font-semibold" style={{ color }}>{range}</p>
                  <p className="font-mono text-xs mt-1" style={{ color }}>{label}</p>
                </div>
              ))}
            </div>
            <p>
              Borderline records (75–89) receive an optional second-pass review using a
              higher-reasoning model if budget permits. If the record remains uncertain, it is
              automatically rejected.
            </p>
          </Step>

          <Step number="06" title="What Exclusivity Means">
            <p>
              An approved lead is made exclusive within a defined territory (state or metro) and
              niche (dental MSP) for a configured time window. The default is 180 days.
            </p>
            <p>
              During the exclusivity window, the lead will not appear in any other buyer&apos;s
              sample batch or pilot delivery for the same territory. After expiry, the record
              becomes available again unless renewed.
            </p>
          </Step>

          <Step number="07" title="What We Do Not Guarantee">
            <p>
              ProofSignal Labs validates using publicly available web evidence. We do not:
            </p>
            <ul className="list-none space-y-1">
              {[
                "Guarantee that a prospect will respond to outreach",
                "Guarantee revenue per clinic or deal value",
                "Verify proprietary internal IT configurations",
                "Confirm current MSP contract status through non-public means",
                "Provide legal advice on outreach compliance",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 font-mono text-xs text-ink-muted">
                  <span className="w-1 h-1 rounded-full bg-border-strong inline-block shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
            <p>
              Every approved lead reflects the best reading of public evidence available at the
              time of validation. If a field is uncertain, it is marked as such or excluded.
            </p>
          </Step>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-teal-pale py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-4">
            See the methodology in a real lead.
          </h2>
          <p className="text-ink-muted mb-6">
            Our sample lead packet shows every evidence item, source URL, and confidence score
            for an approved dental clinic prospect.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/sample-lead" className="btn-primary">View Sample Lead Packet</a>
            <a href="/contact" className="btn-secondary">Request Sample Batch</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
