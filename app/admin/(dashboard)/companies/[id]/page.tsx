export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateTime, statusBadgeClass } from "@/lib/utils";
import EditCompanyForm from "./EditCompanyForm";

export const metadata: Metadata = { title: "Company Detail" };

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await db.companyRaw.findUnique({
    where: { id },
    include: {
      evidenceItems: { orderBy: { confidence: "desc" } },
      validationLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      discoveryRun: { select: { region: true, status: true, createdAt: true } },
    },
  }).catch(() => null);

  if (!company) notFound();

  const score = company.confidenceScore;
  const scoreColor = score >= 90 ? "#1A6B45" : score >= 75 ? "#B07A10" : "#8B1E2F";
  const log = company.validationLogs[0];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/companies" className="font-mono text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors">
          ← Back to Companies
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-ink">{company.companyName}</h1>
            <span className={statusBadgeClass(company.validationStatus)}>{company.validationStatus}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-ink-muted">
            <span>{company.domain}</span>
            {company.city && <><span>·</span><span>{company.city}{company.state ? `, ${company.state}` : ""}</span></>}
            <span>·</span>
            <span>Discovered {formatDateTime(company.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EditCompanyForm company={{
            id: company.id,
            companyName: company.companyName,
            city: company.city,
            state: company.state,
            contactName: company.contactName,
            contactRole: company.contactRole,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            whyNowReason: company.whyNowReason,
            validationStatus: company.validationStatus,
            locationCountEstimate: company.locationCountEstimate,
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main detail */}
        <div className="xl:col-span-2 space-y-6">
          {/* Extracted fields */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Extracted Fields</h2>
            <div className="divide-y divide-border/60">
              {[
                { label: "company_name", value: company.companyName },
                { label: "domain", value: company.domain },
                { label: "homepage_url", value: company.homepageUrl ?? "—" },
                { label: "city", value: company.city ?? "—" },
                { label: "state", value: company.state ?? "—" },
                { label: "country", value: company.country },
                { label: "location_count_estimate", value: company.locationCountEstimate?.toString() ?? "—" },
                { label: "location_count_confidence", value: company.locationCountConfidence ?? "—" },
                { label: "matches_active_vertical", value: company.matchesActiveVertical ? "true" : "false" },
                { label: "vertical_match_confidence", value: company.verticalMatchConfidence.toString() },
                { label: "validation_status", value: company.validationStatus },
                { label: "contact_name", value: company.contactName ?? "—" },
                { label: "contact_role", value: company.contactRole ?? "—" },
                { label: "contact_email", value: company.contactEmail ?? "—" },
                { label: "contact_phone", value: company.contactPhone ?? "—" },
                { label: "why_now_reason", value: company.whyNowReason ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[220px_1fr] gap-3 py-2.5">
                  <span className="font-mono text-2xs text-ink-faint pt-0.5">{label}</span>
                  <span className="font-mono text-xs text-ink break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signals */}
          {(company.technologyClues.length > 0 || company.complianceClues.length > 0 ||
            company.growthSignals.length > 0 || company.fitSignals.length > 0 ||
            company.triggerSignals.length > 0) && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Signals</h2>
              <div className="space-y-3">
                {[
                  { label: "Technology", items: company.technologyClues },
                  { label: "Compliance", items: company.complianceClues },
                  { label: "Growth", items: company.growthSignals },
                  { label: "Fit", items: company.fitSignals },
                  { label: "Triggers", items: company.triggerSignals },
                ].filter(s => s.items.length > 0).map(({ label, items }) => (
                  <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-mono text-2xs text-ink-faint pt-0.5">{label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((item) => (
                        <span key={item} className="badge-neutral text-2xs">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence items */}
          {company.evidenceItems.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Evidence Items</h2>
              <div className="space-y-3">
                {company.evidenceItems.map((item) => (
                  <div key={item.id} className="evidence-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-mono text-2xs text-teal uppercase tracking-wider">
                        {item.fieldName.replace(/_/g, " ")}
                      </p>
                      <span className="font-mono text-2xs font-semibold shrink-0" style={{ color: scoreColor }}>
                        {item.confidence}%
                      </span>
                    </div>
                    <p className="text-sm text-ink leading-relaxed mb-2">&ldquo;{item.evidenceText}&rdquo;</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-2xs text-ink-faint truncate">{item.sourceUrl}</span>
                      <span className="badge-neutral shrink-0">{item.sourceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source URLs */}
          {company.sourceUrls.length > 0 && (
            <div className="card p-5">
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Source URLs</h2>
              <div className="space-y-2">
                {company.sourceUrls.map((url) => (
                  <div key={url} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-xs text-ink-muted hover:text-teal transition-colors truncate">
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Confidence Score</h3>
            <div className="text-center mb-4">
              <p className="font-mono text-4xl font-semibold" style={{ color: scoreColor }}>{score}</p>
              <p className="font-mono text-xs text-ink-faint mt-1">
                / 100 · {score >= 90 ? "High" : score >= 75 ? "Medium" : "Low"}
              </p>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden mb-1">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-ink-faint">Fit score</span>
                <span className="text-ink font-semibold">{company.fitScore}</span>
              </div>
            </div>
          </div>

          {(company.contactName || company.contactEmail) && (
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Contact</h3>
              <div className="space-y-1 text-xs">
                {company.contactName && <p className="text-sm font-semibold text-ink">{company.contactName}</p>}
                {company.contactRole && <p className="text-ink-muted">{company.contactRole}</p>}
                {company.contactEmail && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className={company.contactEmailVerified ? "badge-approved" : "badge-borderline"}>
                      {company.contactEmailVerified ? "Verified" : "Unverified"}
                    </span>
                    <span className="font-mono text-ink-muted">{company.contactEmail}</span>
                  </div>
                )}
                {company.contactPhone && (
                  <p className="font-mono text-ink-muted pt-1">{company.contactPhone}</p>
                )}
              </div>
            </div>
          )}

          {log && (
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Validation Log</h3>
              <div className="space-y-3 text-xs">
                <span className={statusBadgeClass(log.decision)}>{log.decision}</span>
                <p className="text-ink-muted leading-relaxed">{log.reasonSummary}</p>
                {log.modelUsed && (
                  <p className="font-mono text-2xs text-ink-faint">Model: {log.modelUsed}</p>
                )}
              </div>
            </div>
          )}

          {company.rejectionReason && (
            <div className="card p-5 border border-rejected/20">
              <h3 className="font-mono text-xs font-medium text-rejected uppercase tracking-wider mb-2">Rejection Reason</h3>
              <p className="text-xs text-ink-muted">{company.rejectionReason}</p>
            </div>
          )}

          {company.discoveryRun && (
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Discovery Run</h3>
              <div className="font-mono text-xs space-y-1">
                <p className="text-ink">{company.discoveryRun.region}</p>
                <p className="text-ink-faint">{formatDateTime(company.discoveryRun.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
