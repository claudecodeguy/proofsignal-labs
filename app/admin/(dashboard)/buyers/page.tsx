export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import BuyerDiscoveryModal from "./BuyerDiscoveryModal";

export const metadata: Metadata = { title: "Buyers" };

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  enriched: "Enriched",
  ready_for_outreach: "Ready for Outreach",
  sample_sent: "Sample Sent",
  engaged: "Engaged",
  pilot_discussion: "Pilot Discussion",
  pilot_active: "Pilot Active",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  suppressed: "Suppressed",
};

const STAGE_BADGE: Record<string, string> = {
  discovered: "badge-neutral",
  enriched: "badge-neutral",
  ready_for_outreach: "badge-teal",
  sample_sent: "badge-teal",
  engaged: "badge-approved",
  pilot_discussion: "badge-approved",
  pilot_active: "badge-approved",
  closed_won: "badge-approved",
  closed_lost: "badge-rejected",
  suppressed: "badge-rejected",
};

export default async function BuyersPage() {
  const [buyers, stageCounts, activeVertical] = await Promise.all([
    db.buyer.findMany({
      where: { isSuppressed: false },
      orderBy: { createdAt: "desc" },
      take: 200,
    }).catch(() => []),
    db.buyer.groupBy({
      by: ["stage"],
      _count: { id: true },
    }).catch(() => []),
    db.vertical.findFirst({ where: { key: "dental_msp_us" } }).catch(() => null),
  ]);

  const stageMap = Object.fromEntries(
    stageCounts.map((s) => [s.stage, s._count.id])
  );

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buyers</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {buyers.length} buyer records · dental_msp_us vertical
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BuyerDiscoveryModal verticalId={activeVertical?.id ?? ""} />
          <button className="btn-ghost text-xs">Import CSV</button>
          <button className="btn-primary text-xs px-4 py-2">+ Add Buyer</button>
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { stage: "Enriched", key: "enriched", color: "#6B6B7E" },
          { stage: "Ready for Outreach", key: "ready_for_outreach", color: "#1E7B7E" },
          { stage: "Sample Sent", key: "sample_sent", color: "#3D9FA3" },
          { stage: "Engaged", key: "engaged", color: "#1A6B45" },
          { stage: "Pilot / Won", key: "pilot_active", color: "#1A6B45" },
        ].map(({ stage, key, color }) => (
          <div key={stage} className="card p-3 text-center">
            <p className="font-mono text-xl font-semibold" style={{ color }}>
              {stageMap[key] ?? 0}
            </p>
            <p className="font-mono text-2xs text-ink-faint mt-1">{stage}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input type="text" placeholder="Search buyers…" className="form-input py-2 text-xs w-52" />
        <select className="form-select py-2 text-xs w-40">
          <option value="">All stages</option>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select className="form-select py-2 text-xs w-36">
          <option value="">All regions</option>
          <option value="TX">Texas</option>
          <option value="AZ">Arizona</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {buyers.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buyer Company</th>
                <th>Contact</th>
                <th>Territory</th>
                <th>Fit Score</th>
                <th>Stage</th>
                <th>Email</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((buyer) => (
                <tr key={buyer.id}>
                  <td>
                    <Link
                      href={`/admin/buyers/${buyer.id}`}
                      className="font-medium text-ink hover:text-teal transition-colors block"
                    >
                      {buyer.buyerCompanyName}
                    </Link>
                    <span className="font-mono text-2xs text-ink-faint">{buyer.domain}</span>
                  </td>
                  <td>
                    <div>
                      <p className="text-sm text-ink">{buyer.contactName ?? "—"}</p>
                      <p className="font-mono text-2xs text-ink-faint">{buyer.contactRole ?? ""}</p>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-muted">
                      {buyer.territoryFocus ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal"
                          style={{ width: `${buyer.buyerFitScore}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-semibold text-ink shrink-0">
                        {buyer.buyerFitScore}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={STAGE_BADGE[buyer.stage] ?? "badge-neutral"}>
                      {STAGE_LABELS[buyer.stage] ?? buyer.stage}
                    </span>
                  </td>
                  <td>
                    {buyer.contactEmailVerified ? (
                      <span className="badge-approved">Verified</span>
                    ) : buyer.contactEmail ? (
                      <span className="badge-borderline">Unverified</span>
                    ) : (
                      <span className="font-mono text-xs text-ink-faint">—</span>
                    )}
                  </td>
                  <td>
                    <span className="font-mono text-xs text-ink-faint">
                      {formatDate(buyer.createdAt.toISOString())}
                    </span>
                  </td>
                  <td>
                    <Link
                      href="/admin/outreach"
                      className="text-xs font-medium text-teal hover:text-teal-dark transition-colors"
                    >
                      Draft Outreach
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <p className="font-mono text-xs text-ink-faint">No buyers yet.</p>
            <p className="text-sm text-ink-muted mt-1">
              Add buyers manually or import a CSV to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
