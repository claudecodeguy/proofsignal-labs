import type { Metadata } from "next";
import Link from "next/link";
import { REJECTION_REASONS, DASHBOARD_STATS } from "@/lib/mock-data";
import { getDashboardCounts } from "@/lib/queries/companies";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const [counts, runs, outreachStats, totalOutreach] = await Promise.all([
    getDashboardCounts(),
    db.discoveryRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }).catch(() => []),
    db.outreachMessage.aggregate({
      _count: { id: true },
      where: { status: "replied" },
    }).catch(() => ({ _count: { id: 0 } })),
    db.outreachMessage.count().catch(() => 0),
  ]);

  const s = {
    ...DASHBOARD_STATS,
    approvedLeads: counts.approvedLeads,
    borderlineLeads: counts.borderlineLeads,
    rejectedLeads: counts.rejectedLeads,
    outreachSent: totalOutreach || DASHBOARD_STATS.outreachSent,
    repliesReceived: outreachStats._count.id || DASHBOARD_STATS.repliesReceived,
  };

  const totalProcessed = s.approvedLeads + s.rejectedLeads + s.borderlineLeads;
  const approvalRate = totalProcessed > 0 ? Math.round((s.approvedLeads / totalProcessed) * 100) : 0;

  function statusBadge(status: string) {
    if (status === "completed") return "badge-approved";
    if (status === "running") return "badge-borderline";
    if (status === "failed") return "badge-rejected";
    return "badge-borderline";
  }

  return (
    <div className="p-8">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div className="flex items-center gap-3">
          <button className="btn-ghost text-xs">Export CSV</button>
        </div>
      </div>

      {/* Approval summary */}
      <div className="mb-8">
        <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Lead Generation Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Processed", value: totalProcessed.toLocaleString(), sub: "All runs" },
            { label: "Approved", value: s.approvedLeads, sub: `${approvalRate}% approval rate`, color: "#1A6B45" },
            { label: "Borderline", value: s.borderlineLeads, sub: "Needs adjudication", color: "#B07A10" },
            { label: "Rejected", value: s.rejectedLeads, sub: "Auto-rejected", color: "#8B1E2F" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="admin-stat-card">
              <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-2">{label}</p>
              <p className="font-mono text-2xl font-semibold" style={color ? { color } : { color: "#18182B" }}>
                {value}
              </p>
              <p className="font-mono text-xs text-ink-muted mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Rejection reasons */}
        <div className="card p-5">
          <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-5">Rejection Reasons</h2>
          {s.rejectedLeads > 0 ? (
            <div className="space-y-4">
              {REJECTION_REASONS.map(({ reason, count, pct }) => (
                <div key={reason}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-ink-muted">{reason}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-ink">{count}</span>
                      <span className="font-mono text-xs text-ink-faint w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rejected/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-faint py-4">No rejected leads yet.</p>
          )}
        </div>

        {/* Outreach summary */}
        <div className="card p-5">
          <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-5">Outreach Performance</h2>
          {s.outreachSent > 0 ? (
            <div className="space-y-4">
              {[
                { label: "Emails Sent", value: s.outreachSent, pct: 100, color: "#1E7B7E" },
                { label: "Replies Received", value: s.repliesReceived, pct: Math.round((s.repliesReceived / s.outreachSent) * 100), color: "#1A6B45" },
              ].map(({ label, value, pct, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-ink-muted">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-ink">{value}</span>
                      <span className="font-mono text-xs text-ink-faint w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-faint py-4">No outreach sent yet.</p>
          )}
        </div>
      </div>

      {/* Discovery runs from DB */}
      <div className="mb-8">
        <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Discovery Runs</h2>
        <div className="card overflow-hidden">
          {runs.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Type</th>
                  <th>Candidates</th>
                  <th>Approved</th>
                  <th>Borderline</th>
                  <th>Rejected</th>
                  <th>Pages</th>
                  <th>FC Credits</th>
                  <th>Haiku</th>
                  <th>Sonnet</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td className="font-medium">{run.region}</td>
                    <td><span className="font-mono text-xs text-teal">{run.targetType}</span></td>
                    <td className="font-mono text-xs">{run.candidatesFound}</td>
                    <td className="font-mono text-xs text-approved">{run.approved}</td>
                    <td className="font-mono text-xs text-borderline">{run.borderline}</td>
                    <td className="font-mono text-xs text-rejected">{run.rejected}</td>
                    <td className="font-mono text-xs">{run.pagesScraped.toLocaleString()}</td>
                    <td className="font-mono text-xs">{run.firecrawlCredits}</td>
                    <td className="font-mono text-xs">{run.haikuCalls}</td>
                    <td className="font-mono text-xs">{run.sonnetCalls}</td>
                    <td><span className={statusBadge(run.status)}>{run.status}</span></td>
                    <td className="font-mono text-xs text-ink-faint">
                      {run.startedAt ? formatDateTime(run.startedAt) : "—"}
                    </td>
                    <td>
                      <Link
                        href={
                          run.targetType === "buyer"
                            ? `/admin/buyers`
                            : `/admin/companies?runId=${run.id}`
                        }
                        className="text-xs font-medium text-teal hover:text-teal-dark transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center">
              <p className="font-mono text-xs text-ink-faint">No discovery runs yet.</p>
              <p className="text-sm text-ink-muted mt-1">Start a run from the dashboard overview.</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage reports — show actuals if runs exist, placeholders otherwise */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="card p-5">
          <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Firecrawl Usage</h2>
          {runs.length > 0 ? (
            <div className="space-y-3">
              {runs.slice(0, 5).map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0">
                  <div>
                    <p className="text-sm text-ink">{run.region} ({run.targetType})</p>
                    <p className="font-mono text-2xs text-ink-faint">
                      {run.startedAt ? formatDate(run.startedAt) : "—"}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {run.firecrawlCredits.toLocaleString()} credits
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 font-mono text-sm font-semibold">
                <span className="text-ink">Total used</span>
                <span className="text-teal">
                  {runs.reduce((a, r) => a + r.firecrawlCredits, 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-faint py-4">No usage data yet.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Model Usage</h2>
          {runs.length > 0 ? (
            <div className="space-y-3">
              <div className="pb-3 border-b border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink">Haiku 4.5</span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {runs.reduce((a, r) => a + r.haikuCalls, 0).toLocaleString()} calls
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink">Sonnet 4.6 (fallback)</span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {runs.reduce((a, r) => a + r.sonnetCalls, 0).toLocaleString()} calls
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-faint py-4">No model usage yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
