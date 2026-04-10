export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Buyer Detail" };

const STAGE_LABELS: Record<string, string> = {
  discovered: "Discovered",
  enriched: "Enriched",
  ready_for_outreach: "Ready",
  sample_sent: "Sample Sent",
  engaged: "Engaged",
  pilot_discussion: "Pilot",
  pilot_active: "Pilot Active",
  closed_won: "Won",
  closed_lost: "Lost",
  suppressed: "Suppressed",
};

const STAGE_ORDER = [
  "discovered",
  "enriched",
  "ready_for_outreach",
  "sample_sent",
  "engaged",
  "pilot_discussion",
  "closed_won",
];

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const buyer = await db.buyer.findUnique({
    where: { id },
    include: {
      outreachMessages: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          subject: true,
          emailType: true,
          status: true,
          sentAt: true,
          replyAt: true,
          leadsAttached: { select: { leadId: true } },
        },
      },
      evidenceItems: {
        orderBy: { confidence: "desc" },
        take: 10,
      },
    },
  }).catch(() => null);

  if (!buyer) notFound();

  const activeStageIdx = STAGE_ORDER.indexOf(buyer.stage);

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/buyers" className="font-mono text-xs text-ink-muted hover:text-ink flex items-center gap-1.5 transition-colors">
          ← Back to Buyers
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-border mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-ink">{buyer.buyerCompanyName}</h1>
            <span className="badge-teal">{STAGE_LABELS[buyer.stage] ?? buyer.stage}</span>
            {buyer.servesActiveVertical && (
              <span className="badge-approved">Dental MSP</span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-ink-muted">
            <span>{buyer.domain}</span>
            {buyer.buyerCity && (
              <><span>·</span><span>{buyer.buyerCity}{buyer.buyerState ? `, ${buyer.buyerState}` : ""}</span></>
            )}
            <span>·</span>
            <span>Added {formatDate(buyer.createdAt.toISOString())}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/outreach" className="btn-primary text-xs px-4 py-2">
            Draft Outreach
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main */}
        <div className="xl:col-span-2 space-y-6">
          {/* Buyer profile */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Buyer Profile</h2>
            <div className="divide-y divide-border/60">
              {[
                { label: "company_name", value: buyer.buyerCompanyName },
                { label: "domain", value: buyer.domain },
                { label: "location", value: [buyer.buyerCity, buyer.buyerState].filter(Boolean).join(", ") || "—" },
                { label: "buyer_services", value: buyer.buyerServices ?? "—" },
                { label: "territory_focus", value: buyer.territoryFocus ?? "—" },
                { label: "serves_dental_clients", value: buyer.servesActiveVertical ? "Yes" : "No" },
                { label: "niche_confidence", value: `${buyer.buyerNicheConfidence}%` },
                { label: "buyer_fit_score", value: buyer.buyerFitScore.toString() },
                { label: "discovery_source", value: buyer.discoverySource },
                { label: "stage", value: buyer.stage },
              ].map(({ label, value }) => (
                <div key={label} className="grid grid-cols-[200px_1fr] gap-3 py-2.5">
                  <span className="font-mono text-2xs text-ink-faint pt-0.5">{label}</span>
                  <span className="font-mono text-xs text-ink break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline stage */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Pipeline Stage</h2>
            <div className="flex items-center gap-0 flex-wrap">
              {STAGE_ORDER.map((stageKey, i) => {
                const isActive = i === activeStageIdx;
                const isPast = i < activeStageIdx;
                return (
                  <div key={stageKey} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-2xs font-mono font-semibold
                        ${isActive ? "border-teal bg-teal text-white" : isPast ? "border-approved bg-approved/10 text-approved" : "border-border bg-surface text-ink-faint"}`}>
                        {isPast ? "✓" : i + 1}
                      </div>
                      <span className="font-mono text-2xs text-ink-faint mt-1.5 whitespace-nowrap">
                        {STAGE_LABELS[stageKey]}
                      </span>
                    </div>
                    {i < STAGE_ORDER.length - 1 && (
                      <div className={`h-px w-6 mx-1 mb-4 ${isPast || isActive ? "bg-teal" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outreach history */}
          <div>
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Outreach History</h2>
            {buyer.outreachMessages.length > 0 ? (
              <div className="space-y-3">
                {buyer.outreachMessages.map((msg) => (
                  <div key={msg.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{msg.subject}</p>
                        <p className="font-mono text-2xs text-ink-faint mt-0.5">
                          {msg.sentAt ? formatDateTime(msg.sentAt) : "Draft"} · {msg.emailType}
                        </p>
                      </div>
                      <span className={
                        msg.status === "replied" ? "badge-approved" :
                        msg.status === "sent" ? "badge-teal" :
                        msg.status === "bounced" ? "badge-rejected" : "badge-neutral"
                      }>
                        {msg.status}
                      </span>
                    </div>
                    {msg.leadsAttached.length > 0 && (
                      <p className="font-mono text-2xs text-ink-muted">
                        {msg.leadsAttached.length} lead{msg.leadsAttached.length !== 1 ? "s" : ""} attached
                      </p>
                    )}
                    {msg.replyAt && (
                      <p className="font-mono text-2xs text-approved mt-1">
                        Replied {formatDateTime(msg.replyAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <p className="text-sm text-ink-faint font-mono">No outreach sent yet.</p>
                <Link href="/admin/outreach" className="btn-primary text-xs mt-3 inline-block">
                  Draft First Outreach
                </Link>
              </div>
            )}
          </div>

          {/* Evidence items */}
          {buyer.evidenceItems.length > 0 && (
            <div>
              <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Evidence</h2>
              <div className="space-y-3">
                {buyer.evidenceItems.map((item) => (
                  <div key={item.id} className="evidence-card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="font-mono text-2xs text-teal uppercase tracking-wider">
                        {item.fieldName.replace(/_/g, " ")}
                      </p>
                      <span className="font-mono text-2xs font-semibold shrink-0 text-ink">{item.confidence}%</span>
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

          {/* Notes */}
          <div className="card p-5">
            <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Notes</h2>
            <textarea
              className="form-textarea w-full text-sm"
              rows={4}
              placeholder="Add notes about this buyer…"
              defaultValue={buyer.notes ?? ""}
            />
            <button className="btn-ghost text-xs mt-2">Save Note</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Key Contact</h3>
            {buyer.contactName || buyer.contactEmail ? (
              <div className="space-y-2">
                {buyer.contactName && <p className="font-semibold text-sm text-ink">{buyer.contactName}</p>}
                {buyer.contactRole && <p className="text-xs text-ink-muted">{buyer.contactRole}</p>}
                <div className="pt-2 space-y-1.5 font-mono text-xs">
                  {buyer.contactEmail && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={buyer.contactEmailVerified ? "badge-approved" : "badge-borderline"}>
                        {buyer.contactEmailVerified ? "Verified" : "Unverified"}
                      </span>
                      <span className="text-ink-muted break-all">{buyer.contactEmail}</span>
                    </div>
                  )}
                  {buyer.contactPhone && <p className="text-ink-muted">{buyer.contactPhone}</p>}
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-ink-faint">No contact extracted yet.</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Buyer Fit Score</h3>
            <div className="text-center mb-3">
              <p className="font-mono text-4xl font-semibold text-teal">{buyer.buyerFitScore}</p>
              <p className="font-mono text-xs text-ink-faint mt-1">/ 100</p>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-teal" style={{ width: `${buyer.buyerFitScore}%` }} />
            </div>
            <div className="mt-3 pt-3 border-t border-border font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-faint">Niche confidence</span>
                <span className="text-ink">{buyer.buyerNicheConfidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-faint">Dental MSP</span>
                <span className={buyer.servesActiveVertical ? "text-approved" : "text-ink-faint"}>
                  {buyer.servesActiveVertical ? "Yes" : "Unconfirmed"}
                </span>
              </div>
            </div>
          </div>

          {buyer.territoryFocus && (
            <div className="card p-5">
              <h3 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">Territory</h3>
              <p className="font-mono text-sm text-ink">{buyer.territoryFocus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
