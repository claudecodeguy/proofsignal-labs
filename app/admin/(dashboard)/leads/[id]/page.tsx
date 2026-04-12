export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import EditLeadForm from "./EditLeadForm";

export const metadata: Metadata = { title: "Lead Detail" };

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      company: {
        select: {
          fitSignals: true,
          technologyClues: true,
          complianceClues: true,
          growthSignals: true,
          triggerSignals: true,
          sourceUrls: true,
          locationCountEstimate: true,
        },
      },
      evidenceItems: { orderBy: { confidence: "desc" }, take: 10 },
      validationLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      exclusivityLocks: { where: { active: true }, take: 1 },
    },
  }).catch(() => null);

  if (!lead) notFound();

  const score = lead.confidenceScore;
  const scoreColor = score >= 90 ? "#1A6B45" : score >= 75 ? "#B07A10" : "#8B1E2F";
  const log = lead.validationLogs[0];
  const lock = lead.exclusivityLocks[0];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/leads" className="font-mono text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors">
          ← Back to Leads
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-ink">{lead.companyName}</h1>
            <span className={lead.status === "approved" ? "badge-approved" : "badge-rejected"}>{lead.status}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-ink-muted">
            <span>{lead.domain}</span>
            {lead.city && <><span>·</span><span>{lead.city}{lead.state ? `, ${lead.state}` : ""}</span></>}
            <span>·</span>
            <span>Approved {formatDate(lead.approvedAt.toISOString())}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EditLeadForm lead={{
            id: lead.id,
            companyName: lead.companyName,
            city: lead.city,
            state: lead.state,
            contactName: lead.contactName,
            contactRole: lead.contactRole,
            contactEmail: lead.contactEmail,
            whyNowReason: lead.whyNowReason,
            status: lead.status,
          }} />
          <Link href="/admin/outreach" className="btn-primary text-xs px-4 py-2">
            Draft Outreach
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main */}
        <div className="xl:col-span-2 space-y-6">

          {/* Fit signals */}
          {lead.company.fitSignals.length > 0 && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Fit Signals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lead.company.fitSignals.map((sig) => (
                  <div key={sig} className="flex items-start gap-2 text-sm text-ink-muted">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-teal shrink-0 mt-0.5">
                      <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why now */}
          {lead.whyNowReason && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Why-Now Trigger</h2>
              <p className="text-sm text-ink leading-relaxed">{lead.whyNowReason}</p>
              {lead.company.triggerSignals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {lead.company.triggerSignals.map((t) => (
                    <span key={t} className="badge-borderline">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Technology & compliance */}
          {(lead.company.technologyClues.length > 0 || lead.company.complianceClues.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {lead.company.technologyClues.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Technology Clues</h2>
                  <ul className="space-y-2">
                    {lead.company.technologyClues.map((c) => (
                      <li key={c} className="text-sm text-ink-muted flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-teal inline-block shrink-0 mt-1.5" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lead.company.complianceClues.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Compliance Clues</h2>
                  <ul className="space-y-2">
                    {lead.company.complianceClues.map((c) => (
                      <li key={c} className="text-sm text-ink-muted flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-approved inline-block shrink-0 mt-1.5" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Growth signals */}
          {lead.company.growthSignals.length > 0 && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Growth Signals</h2>
              <ul className="space-y-2">
                {lead.company.growthSignals.map((g) => (
                  <li key={g} className="text-sm text-ink-muted flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-borderline inline-block shrink-0 mt-1.5" />{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence items */}
          {lead.evidenceItems.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Evidence Items</h2>
              <div className="space-y-3">
                {lead.evidenceItems.map((item) => {
                  const c = item.confidence >= 90 ? "#1A6B45" : "#B07A10";
                  return (
                    <div key={item.id} className="evidence-card">
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
          )}

          {/* Source URLs */}
          {lead.company.sourceUrls.length > 0 && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Source Pages Reviewed</h2>
              <div className="space-y-2">
                {lead.company.sourceUrls.map((url) => (
                  <div key={url} className="flex items-center gap-2 font-mono text-xs text-ink-muted">
                    <span className="w-1 h-1 rounded-full bg-teal shrink-0" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-teal truncate">{url}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Confidence score */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Confidence Score</h3>
            <div className="text-center mb-4">
              <p className="font-mono text-4xl font-semibold" style={{ color: scoreColor }}>{score}</p>
              <p className="font-mono text-xs text-ink-faint mt-1">/ 100</p>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
            <div className="flex items-center justify-between font-mono text-2xs text-ink-faint mt-1">
              <span>Rejected &lt;75</span>
              <span>Approved ≥90</span>
            </div>
          </div>

          {/* Contact */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Contact</h3>
            {lead.contactName || lead.contactEmail ? (
              <div className="space-y-2">
                {lead.contactName && <p className="font-semibold text-sm text-ink">{lead.contactName}</p>}
                {lead.contactRole && <p className="text-xs text-ink-muted">{lead.contactRole}</p>}
                <div className="pt-2 space-y-1.5 font-mono text-xs">
                  {lead.contactEmail && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={lead.contactEmailVerified ? "badge-approved" : "badge-borderline"}>
                        {lead.contactEmailVerified ? "Verified" : "Unverified"}
                      </span>
                      <span className="text-ink-muted break-all">{lead.contactEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-ink-faint">No contact extracted.</p>
            )}
          </div>

          {/* Exclusivity */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Exclusivity</h3>
            {lock ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-rejected" />
                  <span className="text-sm font-medium text-ink">Locked</span>
                </div>
                <p className="font-mono text-xs text-ink-muted">Locked to {lock.buyerCompanyName}</p>
                <p className="font-mono text-xs text-ink-faint mt-1">Expires {formatDate(lock.expiresAt.toISOString())}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-approved" />
                <span className="text-sm font-medium text-ink">Available</span>
              </div>
            )}
          </div>

          {/* Validation log */}
          {log && (
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Validation Log</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-ink-faint font-mono mb-1">Decision</p>
                  <span className={log.decision === "approved" ? "badge-approved" : log.decision === "borderline" ? "badge-borderline" : "badge-rejected"}>
                    {log.decision}
                  </span>
                </div>
                <div>
                  <p className="text-ink-faint font-mono mb-1">Reason</p>
                  <p className="text-ink-muted leading-relaxed">{log.reasonSummary}</p>
                </div>
                {log.topSupportingEvidence.length > 0 && (
                  <div>
                    <p className="text-ink-faint font-mono mb-1.5">Supporting evidence</p>
                    <ul className="space-y-1">
                      {log.topSupportingEvidence.map((e) => (
                        <li key={e} className="flex items-start gap-1.5 text-ink-muted">
                          <span className="text-approved">✓</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discovery */}
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Discovery</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-ink-faint">Approved</span>
                <span className="text-ink-muted">{formatDateTime(lead.approvedAt)}</span>
              </div>
              {lead.company.locationCountEstimate && (
                <div className="flex justify-between">
                  <span className="text-ink-faint">Locations</span>
                  <span className="text-ink">{lead.company.locationCountEstimate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
