import type { Metadata } from "next";
import Link from "next/link";
import { LEAD_DETAIL } from "@/lib/mock-data";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Lead Detail" };

export default function LeadDetailPage() {
  const lead = LEAD_DETAIL;
  const score = lead.confidenceScore;
  const scoreColor = score >= 90 ? "#1A6B45" : score >= 75 ? "#B07A10" : "#8B1E2F";

  return (
    <div className="p-8">
      {/* Back */}
      <div className="mb-6">
        <Link href="/admin/leads" className="font-mono text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors">
          ← Back to Leads
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-ink">{lead.companyName}</h1>
            <span className="badge-approved">Approved</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-ink-muted">
            <span>{lead.domain}</span>
            <span>·</span>
            <span>{lead.city}, {lead.state}</span>
            <span>·</span>
            <span>Approved {formatDate(lead.approvedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-xs">Attach to Outreach</button>
          <button className="btn-secondary text-xs">Export Packet</button>
          <button className="btn-danger text-xs">Override → Reject</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main */}
        <div className="xl:col-span-2 space-y-6">
          {/* Signals */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Fit Signals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lead.fitSignals.map((sig) => (
                <div key={sig} className="flex items-start gap-2 text-sm text-ink-muted">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-teal shrink-0 mt-0.5">
                    <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {sig}
                </div>
              ))}
            </div>
          </div>

          {/* Why now */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Why-Now Trigger</h2>
            <p className="text-sm text-ink leading-relaxed">{lead.whyNowReason}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {lead.triggerSignals.map((t) => (
                <span key={t} className="badge-borderline">{t}</span>
              ))}
            </div>
          </div>

          {/* Technology & compliance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Technology Clues</h2>
              <ul className="space-y-2">
                {lead.technologyClues.map((c) => (
                  <li key={c} className="text-sm text-ink-muted flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-teal inline-block shrink-0 mt-1.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Compliance Clues</h2>
              <ul className="space-y-2">
                {lead.complianceClues.map((c) => (
                  <li key={c} className="text-sm text-ink-muted flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-approved inline-block shrink-0 mt-1.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Growth signals */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Growth Signals</h2>
            <ul className="space-y-2">
              {lead.growthSignals.map((g) => (
                <li key={g} className="text-sm text-ink-muted flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-borderline inline-block shrink-0 mt-1.5" />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Evidence items */}
          <div>
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Evidence Items</h2>
            <div className="space-y-3">
              {lead.evidenceItems.map((item) => {
                const c = item.confidence >= 90 ? "#1A6B45" : "#B07A10";
                return (
                  <div key={item.fieldName} className="evidence-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-mono text-2xs text-teal uppercase tracking-wider">
                        {item.fieldName.replace(/_/g, " ")}
                      </p>
                      <span className="font-mono text-2xs font-semibold shrink-0" style={{ color: c }}>
                        {item.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed mb-2">&ldquo;{item.evidenceText}&rdquo;</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-2xs text-ink-faint truncate">{item.sourceUrl}</span>
                      <span className="badge-neutral shrink-0">{item.sourceType}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source URLs */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Source Pages</h2>
            <div className="space-y-2">
              {lead.sourceUrls.map((url) => (
                <div key={url} className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                  <span className="w-1 h-1 rounded-full bg-teal-light shrink-0" />
                  {url}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Confidence */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Confidence Score</h3>
            <div className="text-center mb-4">
              <p className="font-mono text-4xl font-semibold" style={{ color: scoreColor }}>{score}</p>
              <p className="font-mono text-xs text-ink-faint mt-1">/ 100 · High Confidence</p>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
            <div className="flex items-center justify-between font-mono text-2xs text-ink-faint">
              <span>Rejected &lt;75</span>
              <span>Approved ≥90</span>
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-sm text-ink">{lead.contact.name}</p>
                <p className="text-xs text-ink-muted">{lead.contact.role}</p>
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="badge-approved">Verified</span>
                  <span className="text-ink-muted">work email</span>
                </div>
                <p className="text-ink-muted">{lead.contact.email}</p>
                <p className="text-ink-muted">{lead.contact.phone}</p>
              </div>
            </div>
          </div>

          {/* Exclusivity */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Exclusivity</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-approved" />
              <span className="text-sm font-medium text-ink">Available</span>
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-3 font-mono text-xs text-ink-muted text-sm">
              <span className="text-ink-faint">Territory</span>
              <span>{lead.exclusivity.territory}</span>
              <span className="text-ink-faint">Niche</span>
              <span>{lead.exclusivity.niche}</span>
              <span className="text-ink-faint">Lock window</span>
              <span>{lead.exclusivity.lockWindowDays} days</span>
            </div>
            <button className="btn-primary w-full justify-center text-xs mt-4">
              Create Exclusivity Lock
            </button>
          </div>

          {/* Validation log */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Validation Log</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-ink-faint font-mono mb-1">Decision</p>
                <span className="badge-approved">{lead.validationLog.decision}</span>
              </div>
              <div>
                <p className="text-ink-faint font-mono mb-1">Reason</p>
                <p className="text-ink-muted leading-relaxed">{lead.validationLog.reasonSummary}</p>
              </div>
              <div>
                <p className="text-ink-faint font-mono mb-1.5">Supporting evidence</p>
                <ul className="space-y-1">
                  {lead.validationLog.topSupportingEvidence.map((e) => (
                    <li key={e} className="flex items-start gap-1.5 text-ink-muted">
                      <span className="text-approved">✓</span> {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Discovery */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Discovery</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-ink-faint">Discovered</span>
                <span className="text-ink-muted">{formatDateTime(lead.discoveredAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Approved</span>
                <span className="text-ink-muted">{formatDateTime(lead.approvedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Vertical</span>
                <span className="text-teal">dental_msp_us</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
