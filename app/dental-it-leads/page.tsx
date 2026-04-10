import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Dental IT Leads for MSPs and MSSPs – ProofSignal Labs",
  description:
    "ProofSignal Labs delivers exclusive, validated dental clinic leads for dental-focused MSPs and MSSPs. US market. Evidence-backed. Confidence scored.",
};

export default function DentalITLeadsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero */}
      <section className="border-b border-border grid-texture py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-5">
              <span className="badge-teal">Dental MSP / MSSP</span>
              <span className="font-mono text-xs text-ink-faint">·</span>
              <span className="badge-neutral">United States</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl text-ink leading-tight mb-5">
              Dental clinic leads built for dental-focused IT providers.
            </h1>
            <p className="text-lg text-ink-muted leading-relaxed mb-8">
              ProofSignal Labs delivers exclusive dental clinic prospects validated specifically for
              MSPs and MSSPs that serve the dental market. Not generic leads. Not raw contact lists.
              Structured, evidence-backed, and ready to work.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">Request Dental Leads</Link>
              <Link href="/sample-lead" className="btn-secondary">View Sample Lead Packet</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">
          <div>
            <p className="section-label mb-3">Who This Is For</p>
            <h2 className="section-title mb-5">Built for dental-focused IT providers.</h2>
            <p className="section-body mb-6">
              If your MSP or MSSP specializes in—or is actively targeting—dental practices,
              ProofSignal Labs gives you a direct line to verified, in-market dental clinics
              rather than generic IT lead lists that include every industry.
            </p>
            <p className="text-sm text-ink-muted leading-relaxed">
              Our buyer side currently serves dental-focused MSPs and MSSPs operating in the
              U.S. market. Each buyer receives leads exclusive to their territory so you&apos;re
              not competing with the same data as every other provider.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "Dental-Focused MSPs",
                body: "Managed service providers that specialize in dental practices, offering support for practice management software, HIPAA compliance, and clinic networking.",
                fit: "Primary",
              },
              {
                title: "Dental-Focused MSSPs",
                body: "Security-focused providers offering HIPAA risk assessments, endpoint protection, and cybersecurity programs tailored to the dental environment.",
                fit: "Primary",
              },
              {
                title: "General MSPs Targeting Dental",
                body: "Generalist MSPs actively building a dental vertical, looking for a pipeline of validated dental clinic prospects in a new geography.",
                fit: "Strong",
              },
            ].map(({ title, body, fit }) => (
              <div key={title} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-sm text-ink">{title}</h3>
                  <span className={fit === "Primary" ? "badge-approved" : "badge-teal"}>{fit} fit</span>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes dental leads valuable */}
      <section className="bg-canvas-subtle border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="section-label mb-3">The Dental Opportunity</p>
            <h2 className="section-title mb-4">Why dental clinics are high-value IT targets.</h2>
            <p className="section-body max-w-xl mx-auto">
              Dental practices operate regulated, technology-dependent environments with specific
              compliance requirements and clear signals of IT need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "HIPAA Mandates IT Discipline",
                body: "Every dental practice handling PHI must maintain HIPAA-compliant data handling. Many lack the internal expertise to do it properly — creating a clear, defensible reason to call.",
              },
              {
                title: "Practice Software Creates Dependency",
                body: "Dentrix, Eaglesoft, and Carestream create deep IT integration needs: backup, uptime, patching, and staff access management all require ongoing support.",
              },
              {
                title: "Multi-Location = Complex IT",
                body: "Growing dental groups with 2+ locations face unified networking, consistent EHR access, and coordinated compliance — all pain points a dental MSP solves immediately.",
              },
              {
                title: "Active Growth = Right Now",
                body: "Practices hiring, expanding, or opening new locations have active operational stress. This is the best time to introduce managed IT — before complexity overwhelms them.",
              },
              {
                title: "Low Internal IT Capacity",
                body: "Most dental practices have zero full-time IT staff. The owner is the decision maker and the IT manager. That's an immediate conversation to have.",
              },
              {
                title: "Long Client Retention",
                body: "Dental practices that switch to an MSP tend to stay. Deep software integrations, compliance accountability, and staff relationships make churn expensive for the clinic.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="card-hover p-5">
                <h3 className="font-semibold text-sm text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <div>
            <p className="section-label mb-3">What You Receive</p>
            <h2 className="section-title mb-5">A structured lead packet, not a row in a spreadsheet.</h2>
            <p className="section-body mb-6">
              Each dental clinic lead includes the information you need to have a credible first
              conversation — not just a name and phone number.
            </p>

            <ul className="space-y-3">
              {[
                "Practice name, domain, and confirmed geography",
                "Confirmed location count with source evidence",
                "Practice software identification (Dentrix, Eaglesoft, etc.)",
                "HIPAA portal and compliance signals",
                "Active growth triggers (hiring, expansion, new locations)",
                "Preferred contact role (owner / practice administrator first)",
                "Verified work email and phone",
                "Why-now reason grounded in public evidence",
                "Confidence score (0–100) with scoring breakdown",
                "All source URLs so you can review what we saw",
                "Exclusivity lock per territory and niche",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-teal shrink-0 mt-0.5">
                    <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Geographic focus */}
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Phase 1 Geographic Coverage</p>
              <div className="card p-5 space-y-4">
                <p className="text-sm text-ink-muted">
                  Phase 1 focuses on the U.S. market, region by region. We run targeted discovery
                  against specific states and metros to ensure quality before expanding coverage.
                </p>
                <div className="space-y-2">
                  {[
                    { region: "Texas", status: "Active", leads: "214 approved leads" },
                    { region: "Arizona", status: "Active", leads: "52 approved leads" },
                    { region: "Florida", status: "Upcoming", leads: "Run scheduled" },
                    { region: "California", status: "Planned", leads: "Q3 2026" },
                  ].map(({ region, status, leads }) => (
                    <div key={region} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-ink">{region}</span>
                        <span className="font-mono text-2xs text-ink-faint ml-3">{leads}</span>
                      </div>
                      <span className={
                        status === "Active" ? "badge-approved" :
                        status === "Upcoming" ? "badge-borderline" :
                        "badge-neutral"
                      }>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-5">
              <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Pricing Model</p>
              <div className="space-y-2 text-sm text-ink-muted">
                <p>ProofSignal Labs operates on a batch pricing model.</p>
                <ul className="space-y-1.5 text-sm">
                  {[
                    "Sample batch (3–5 leads): Free to qualified buyers",
                    "Pilot batch (10–25 leads): Per-lead pricing",
                    "Ongoing delivery: Monthly batch subscription",
                    "All leads exclusive to your territory",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-teal inline-block shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-ink-faint pt-1 font-mono">
                  Contact us to discuss pricing for your territory and volume.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Start with a free sample batch.
          </h2>
          <p className="text-navy-text mb-8 max-w-md mx-auto">
            Tell us your territory and MSP focus. We&apos;ll send 3–5 validated dental clinic
            leads from your market within 48 hours, at no charge.
          </p>
          <Link href="/contact" className="btn-primary text-base px-6 py-3">
            Request Free Sample Batch
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
