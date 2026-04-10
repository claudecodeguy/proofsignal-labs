import type { Metadata } from "next";
import Link from "next/link";
import { DASHBOARD_STATS, DISCOVERY_RUNS } from "@/lib/mock-data";
import { getDashboardCounts } from "@/lib/queries/companies";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import NewRunModal from "./components/NewRunModal";

export const metadata: Metadata = { title: "Overview" };

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="admin-stat-card">
      <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-2">{label}</p>
      <p className="font-mono text-2xl font-semibold text-ink" style={color ? { color } : {}}>
        {value}
      </p>
      {sub && <p className="font-mono text-xs text-ink-muted mt-1">{sub}</p>}
    </div>
  );
}

function UsageBar({
  label,
  used,
  budget,
  color,
}: {
  label: string;
  used: number;
  budget: number;
  color: string;
}) {
  const pct = Math.round((used / budget) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-xs text-ink-muted">{label}</span>
        <span className="font-mono text-xs font-medium text-ink">
          {used.toLocaleString()} <span className="text-ink-faint font-normal">/ {budget.toLocaleString()}</span>
        </span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="font-mono text-2xs text-ink-faint mt-1">{pct}% of budget used</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const [counts, lastRunDb, outreachStats, activeVertical] = await Promise.all([
    getDashboardCounts(),
    db.discoveryRun.findFirst({ orderBy: { createdAt: "desc" } }).catch(() => null),
    db.outreachMessage.aggregate({
      _count: { id: true },
      where: { status: "replied" },
    }).catch(() => ({ _count: { id: 0 } })),
    db.vertical.findFirst({ where: { key: "dental_msp_us" } }).catch(() => null),
  ]);

  const totalOutreach = await db.outreachMessage.count().catch(() => 0);
  const replyCount = outreachStats._count.id;

  const s = {
    ...DASHBOARD_STATS,
    totalCompanies: counts.totalCompanies,
    approvedLeads: counts.approvedLeads,
    borderlineLeads: counts.borderlineLeads,
    rejectedLeads: counts.rejectedLeads,
    totalBuyers: counts.totalBuyers,
    activeExclusivityLocks: counts.activeExclusivityLocks,
    outreachSent: totalOutreach,
    repliesReceived: replyCount,
  };

  const lastRun = lastRunDb ?? DISCOVERY_RUNS[0];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            Active vertical: <span className="text-teal">dental_msp_us</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/companies" className="btn-ghost text-xs">
            View Companies
          </Link>
          <NewRunModal verticalId={activeVertical?.id ?? ""} />
        </div>
      </div>

      {/* Lead pipeline stats */}
      <div className="mb-8">
        <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Lead Pipeline</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Companies" value={s.totalCompanies.toLocaleString()} sub="In raw candidate pool" />
          <StatCard label="Approved Leads" value={s.approvedLeads} sub="Ready to deliver" color="#1A6B45" />
          <StatCard label="Borderline" value={s.borderlineLeads} sub="Needs adjudication" color="#B07A10" />
          <StatCard label="Rejected" value={s.rejectedLeads} sub="Auto-rejected" color="#8B1E2F" />
        </div>
      </div>

      {/* Buyer pipeline stats */}
      <div className="mb-8">
        <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Buyer Pipeline</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Buyers" value={s.totalBuyers} sub="In buyer CRM" />
          <StatCard label="Outreach Sent" value={s.outreachSent} sub="Emails sent" />
          <StatCard label="Replies" value={s.repliesReceived} sub={`${Math.round((s.repliesReceived / s.outreachSent) * 100)}% reply rate`} color="#1E7B7E" />
          <StatCard label="Exclusivity Locks" value={s.activeExclusivityLocks} sub="Active locks" />
        </div>
      </div>

      {/* Usage section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-5">
          <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-5">Firecrawl Usage</p>
          <UsageBar
            label="Credits used this period"
            used={s.firecrawlUsage.used}
            budget={s.firecrawlUsage.budget}
            color="#1E7B7E"
          />
        </div>
        <div className="card p-5">
          <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-5">Model Usage</p>
          <div className="space-y-4">
            <UsageBar
              label="Haiku 4.5 calls"
              used={s.modelUsage.haiku.calls}
              budget={s.modelUsage.haiku.budget}
              color="#1E7B7E"
            />
            <UsageBar
              label="Sonnet 4.6 calls (fallback)"
              used={s.modelUsage.sonnet.calls}
              budget={s.modelUsage.sonnet.budget}
              color="#B07A10"
            />
          </div>
        </div>
      </div>

      {/* Recent discovery run */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider">Last Discovery Run</p>
          <Link href="/admin/reports" className="text-xs font-medium text-teal hover:text-teal-dark transition-colors">
            View all runs →
          </Link>
        </div>
        {lastRunDb ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 mb-5">
              {[
                { label: "Region", value: lastRunDb.region },
                { label: "Candidates Found", value: lastRunDb.candidatesFound.toString() },
                { label: "Approved", value: lastRunDb.approved.toString() },
                { label: "Rejected", value: lastRunDb.rejected.toString() },
                { label: "Pages Scraped", value: lastRunDb.pagesScraped.toLocaleString() },
                { label: "Firecrawl Credits", value: lastRunDb.firecrawlCredits.toLocaleString() },
                { label: "Haiku Calls", value: lastRunDb.haikuCalls.toLocaleString() },
                { label: "Sonnet Calls", value: lastRunDb.sonnetCalls.toString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-mono text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <span className={lastRunDb.status === "completed" ? "badge-approved" : "badge-borderline"}>
                  {lastRunDb.status}
                </span>
                <span className="font-mono text-xs text-ink-faint">dental_msp_us</span>
              </div>
              <span className="font-mono text-xs text-ink-faint">
                {lastRunDb.completedAt ? formatDateTime(lastRunDb.completedAt) : "In progress"}
              </span>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="font-mono text-xs text-ink-faint">No discovery runs yet.</p>
            <p className="text-sm text-ink-muted mt-1">Click <strong>+ New Discovery Run</strong> to get started.</p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Run Discovery", href: "/admin/companies", icon: "⊕" },
          { label: "Review Borderline", href: "/admin/leads", icon: "◎" },
          { label: "Draft Outreach", href: "/admin/outreach", icon: "✉" },
          { label: "Export Leads", href: "/admin/leads", icon: "↓" },
        ].map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className="card p-4 text-center hover:shadow-card-hover transition-shadow group"
          >
            <div className="font-mono text-xl text-teal mb-2 group-hover:scale-110 transition-transform inline-block">{icon}</div>
            <p className="text-sm font-medium text-ink">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
