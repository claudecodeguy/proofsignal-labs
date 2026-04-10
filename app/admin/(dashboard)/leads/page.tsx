import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
  const [approved, borderline, companies] = await Promise.all([
    db.lead.findMany({
      where: { status: "approved" },
      orderBy: { approvedAt: "desc" },
      take: 200,
    }).catch(() => []),
    db.companyRaw.findMany({
      where: { validationStatus: "borderline" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        companyName: true,
        domain: true,
        city: true,
        state: true,
        confidenceScore: true,
        locationCountEstimate: true,
        contactName: true,
        contactEmail: true,
        createdAt: true,
      },
    }).catch(() => []),
    db.companyRaw.findMany({
      where: { validationStatus: "rejected" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        companyName: true,
        domain: true,
        city: true,
        state: true,
        confidenceScore: true,
        rejectionReason: true,
        createdAt: true,
      },
    }).catch(() => []),
  ]);

  const rejected = companies; // aliased above for clarity

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {approved.length} approved · {borderline.length} borderline · {rejected.length} rejected
          </p>
        </div>
      </div>

      {/* Tabs (visual only — sections scroll) */}
      <div className="border-b border-border mb-0">
        <div className="flex items-center gap-0">
          {[
            { label: "Approved", count: approved.length, href: "#approved" },
            { label: "Borderline", count: borderline.length, href: "#borderline" },
            { label: "Rejected", count: rejected.length, href: "#rejected" },
          ].map(({ label, count, href }, i) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                i === 0
                  ? "border-teal text-teal"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-border"
              }`}
            >
              {label}
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                i === 0 ? "bg-teal-pale text-teal" : "bg-canvas-subtle text-ink-faint"
              }`}>
                {count}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Approved leads */}
      <div id="approved" className="card overflow-hidden mb-8">
        {approved.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-canvas-subtle">
              <span className="font-mono text-xs text-ink-faint">
                {approved.length} approved lead{approved.length !== 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3">
                <button className="btn-ghost text-xs px-3 py-1.5">Attach to Outreach</button>
                <button className="btn-ghost text-xs px-3 py-1.5">Export Selected</button>
                <button className="btn-primary text-xs px-3 py-1.5">Export All CSV</button>
              </div>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th><input type="checkbox" className="rounded border-border" /></th>
                  <th>Company</th>
                  <th>Geography</th>
                  <th>Confidence</th>
                  <th>Locations</th>
                  <th>Contact</th>
                  <th>Approved</th>
                  <th>Exclusivity</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((lead) => (
                  <tr key={lead.id}>
                    <td><input type="checkbox" className="rounded border-border" /></td>
                    <td>
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-ink hover:text-teal transition-colors block"
                      >
                        {lead.companyName}
                      </Link>
                      <span className="font-mono text-2xs text-ink-faint">{lead.domain}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">
                        {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${lead.confidenceScore}%`,
                              backgroundColor:
                                lead.confidenceScore >= 90
                                  ? "#1A6B45"
                                  : lead.confidenceScore >= 75
                                  ? "#B07A10"
                                  : "#8B1E2F",
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-ink shrink-0">
                          {lead.confidenceScore}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">—</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">
                        {lead.contactName ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-faint">
                        {formatDate(lead.approvedAt.toISOString())}
                      </span>
                    </td>
                    <td>
                      <span className="badge-neutral">Available</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <div className="py-14 text-center">
            <p className="text-sm text-ink-faint font-mono">No approved leads yet.</p>
            <p className="text-sm text-ink-muted mt-1">Run a discovery to generate leads.</p>
          </div>
        )}
      </div>

      {/* Borderline */}
      <div id="borderline" className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-ink">Borderline — Needs Review</h2>
          <button className="btn-ghost text-xs px-3 py-1.5">Run Sonnet Adjudication</button>
        </div>
        <div className="card overflow-hidden">
          {borderline.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Geography</th>
                  <th>Confidence</th>
                  <th>Locations</th>
                  <th>Discovered</th>
                </tr>
              </thead>
              <tbody>
                {borderline.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/admin/companies/${c.id}`}
                        className="font-medium text-ink hover:text-teal transition-colors block"
                      >
                        {c.companyName}
                      </Link>
                      <span className="font-mono text-2xs text-ink-faint">{c.domain}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 w-28">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-borderline"
                            style={{ width: `${c.confidenceScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-ink shrink-0">
                          {c.confidenceScore}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">
                        {c.locationCountEstimate ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-faint">
                        {formatDate(c.createdAt.toISOString())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-14 text-center">
              <p className="text-sm text-ink-faint font-mono">No borderline records.</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejected */}
      <div id="rejected" className="mb-4">
        <h2 className="font-semibold text-sm text-ink mb-3">Rejected</h2>
        <div className="card overflow-hidden">
          {rejected.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Geography</th>
                  <th>Confidence</th>
                  <th>Reason</th>
                  <th>Discovered</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link
                        href={`/admin/companies/${c.id}`}
                        className="font-medium text-ink hover:text-teal transition-colors block"
                      >
                        {c.companyName}
                      </Link>
                      <span className="font-mono text-2xs text-ink-faint">{c.domain}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted">
                        {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink">{c.confidenceScore}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-muted truncate max-w-xs block">
                        {c.rejectionReason ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink-faint">
                        {formatDate(c.createdAt.toISOString())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-14 text-center">
              <p className="text-sm text-ink-faint font-mono">No rejected records.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
