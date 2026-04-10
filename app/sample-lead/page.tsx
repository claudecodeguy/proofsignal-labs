import type { Metadata } from "next";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Sample Lead Packet – ProofSignal Labs",
  description:
    "See exactly what a ProofSignal Labs dental clinic lead packet includes: company snapshot, evidence items, confidence score, contact, and exclusivity status.",
};

function EvidenceCard({
  fieldName,
  evidenceText,
  sourceUrl,
  sourceType,
  confidence,
}: {
  fieldName: string;
  evidenceText: string;
  sourceUrl: string;
  sourceType: string;
  confidence: number;
}) {
  const color = confidence >= 90 ? "#1A6B45" : confidence >= 75 ? "#B07A10" : "#8B1E2F";
  return (
    <div className="evidence-card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-mono text-2xs text-teal uppercase tracking-wider">{fieldName.replace(/_/g, " ")}</p>
        <span className="font-mono text-2xs font-semibold shrink-0" style={{ color }}>
          {confidence}%
        </span>
      </div>
      <p className="text-sm text-ink leading-relaxed mb-3">
        &ldquo;{evidenceText}&rdquo;
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-2xs text-ink-faint truncate">{sourceUrl}</span>
        <span className="badge-neutral shrink-0">{sourceType}</span>
      </div>
    </div>
  );
}

function ConfidenceGauge({ score }: { score: number }) {
  const color = score >= 90 ? "#1A6B45" : "#B07A10";
  const label = score >= 90 ? "High Confidence — Approved" : "Moderate — Borderline";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs text-ink-faint uppercase tracking-wider">Confidence Score</p>
        <p className="font-mono text-2xl font-semibold" style={{ color }}>{score}<span className="text-sm text-ink-faint font-normal">/100</span></p>
      </div>
      <div className="w-full h-2 bg-border rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-mono text-ink-faint">
        <span>0</span>
        <span style={{ color }} className="font-medium">{label}</span>
        <span>100</span>
      </div>
    </div>
  );
}

export default function SampleLeadPage() {
  const evidenceItems = [
    {
      fieldName: "vertical_match",
      evidenceText:
        "Family and cosmetic dental services are the primary offering. Navigation includes 'New Patients,' 'Services,' and 'Book Online' — consistent with active dental practice.",
      sourceUrl: "brightsmilesdentistry.com",
      sourceType: "homepage",
      confidence: 98,
    },
    {
      fieldName: "location_count",
      evidenceText:
        "Footer states: 'Serving Austin, Cedar Park, and Round Rock.' Location selector confirms three clinic addresses.",
      sourceUrl: "brightsmilesdentistry.com/locations",
      sourceType: "locations",
      confidence: 97,
    },
    {
      fieldName: "technology_clues",
      evidenceText:
        "Careers page lists job requirement: 'Experience with Dentrix or Eaglesoft preferred.' Patient portal labeled 'Secure Patient Login (HIPAA Compliant).'",
      sourceUrl: "brightsmilesdentistry.com/careers",
      sourceType: "careers",
      confidence: 91,
    },
    {
      fieldName: "growth_signals",
      evidenceText:
        "Two active listings for Front Desk Coordinator roles. Footer banner: 'Now open in Round Rock — accepting new patients!'",
      sourceUrl: "brightsmilesdentistry.com/careers",
      sourceType: "careers",
      confidence: 95,
    },
    {
      fieldName: "contact_verification",
      evidenceText:
        "About page lists Dr. Patricia Nguyen as founder and lead dentist with direct contact email. Email verified against practice domain — not catch-all.",
      sourceUrl: "brightsmilesdentistry.com/about",
      sourceType: "about",
      confidence: 88,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Header */}
      <section className="border-b border-border bg-canvas-subtle py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="section-label mb-3">Sample Lead Packet</p>
              <h1 className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                Bright Smiles Family Dentistry
              </h1>
              <p className="font-mono text-sm text-ink-muted mt-2">brightsmilesdentistry.com</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge-approved text-sm px-3 py-1">Approved</span>
              <span className="badge-teal">Dental MSP</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company snapshot */}
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Company Snapshot</h2>
              <div className="card divide-y divide-border overflow-hidden">
                {[
                  { label: "Company Name", value: "Bright Smiles Family Dentistry" },
                  { label: "Domain", value: "brightsmilesdentistry.com" },
                  { label: "Geography", value: "Austin, TX · United States" },
                  { label: "Location Count", value: "3 confirmed locations" },
                  { label: "Vertical", value: "Dental Clinic" },
                  { label: "Practice Software", value: "Dentrix (evidence confirmed)" },
                  { label: "HIPAA Portal", value: "Active — Secure Patient Login" },
                ].map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-2 px-5 py-3.5">
                    <span className="font-mono text-2xs text-ink-faint uppercase tracking-wider self-center">{label}</span>
                    <span className="text-sm text-ink font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fit reason */}
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Fit Reason</h2>
              <div className="card p-5">
                <p className="text-sm text-ink-muted leading-relaxed mb-4">
                  Multi-location dental group running Dentrix practice management software with an active
                  HIPAA-compliant patient portal. No managed IT vendor is referenced anywhere on site,
                  suggesting a self-managed or underserved IT environment typical of growing DSO-adjacent
                  practices.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "3 confirmed locations",
                    "Dentrix stack",
                    "Active HIPAA portal",
                    "No IT vendor found",
                    "Multi-location ops",
                  ].map((tag) => (
                    <span key={tag} className="badge-teal">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Why now */}
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Why-Now Trigger</h2>
              <div className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded border border-borderline-border bg-borderline-bg flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="5.5" stroke="#B07A10" strokeWidth="1.2" />
                      <path d="M7 4V7L9 9" stroke="#B07A10" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink mb-1">Active expansion + hiring surge</p>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      Practice is opening a third location with two active front-desk job listings.
                      Rapid growth at multi-location practices creates immediate IT coordination challenges:
                      unified network management, consistent HIPAA compliance across sites, centralized
                      EHR access, and staff onboarding workflows. The timing is now.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence items */}
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Evidence Items</h2>
              <div className="space-y-3">
                {evidenceItems.map((item) => (
                  <EvidenceCard key={item.fieldName} {...item} />
                ))}
              </div>
            </div>

            {/* Source URLs */}
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Source Pages Scraped</h2>
              <div className="card p-5 space-y-2">
                {[
                  "brightsmilesdentistry.com",
                  "brightsmilesdentistry.com/about",
                  "brightsmilesdentistry.com/locations",
                  "brightsmilesdentistry.com/careers",
                ].map((url) => (
                  <div key={url} className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-teal shrink-0">
                      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M3 6H9M6 3C6 3 8 4.5 8 6S6 9 6 9M6 3C6 3 4 4.5 4 6S6 9 6 9" stroke="currentColor" strokeWidth="0.8" />
                    </svg>
                    {url}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <ConfidenceGauge score={94} />

            {/* Contact */}
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-sm text-ink">Dr. Patricia Nguyen</p>
                  <p className="text-xs text-ink-muted">Practice Owner / Dentist</p>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="badge-approved">Verified</span>
                    <span className="text-ink-muted">Work email</span>
                  </div>
                  <p className="text-ink-muted">pnguyen@brightsmilesdentistry.com</p>
                  <p className="text-ink-muted">(512) 555-0182</p>
                </div>
              </div>
            </div>

            {/* Exclusivity */}
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Exclusivity</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-approved"></span>
                  <span className="text-ink font-medium">Available</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-ink-muted">
                  <span className="text-ink-faint">Territory</span><span>Texas (state)</span>
                  <span className="text-ink-faint">Niche</span><span>Dental MSP</span>
                  <span className="text-ink-faint">Lock window</span><span>180 days</span>
                </div>
                <p className="text-ink-muted text-2xs leading-relaxed pt-1">
                  Once sold, this lead is locked to your territory for 180 days and will not appear
                  in any competing buyer&apos;s batch.
                </p>
              </div>
            </div>

            {/* Validation log */}
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Validation Summary</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    "3 confirmed locations",
                    "Dentrix reference",
                    "Verified owner email",
                    "HIPAA portal active",
                  ].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-approved-bg text-approved border border-approved-border text-2xs font-mono">
                      <span>✓</span> {item}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["No IT vendor found on site"].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-pale text-teal border border-teal/20 text-2xs font-mono">
                      <span>—</span> {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded border border-teal/30 bg-teal-pale p-5 text-center">
              <p className="text-sm font-semibold text-ink mb-1">Get leads like this</p>
              <p className="text-xs text-ink-muted mb-4">Request a free sample batch for your territory.</p>
              <a href="/contact" className="btn-primary w-full justify-center text-xs">
                Request Sample Batch
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-canvas-subtle py-6">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs text-ink-faint text-center">
            This is a representative sample. All company details, contact information, and evidence are illustrative.
            Actual leads contain verified, current data from public web sources.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
