import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import DraftPanel from "./DraftPanel";

export const metadata: Metadata = { title: "Outreach" };

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-neutral",
  sent: "badge-teal",
  replied: "badge-approved",
  bounced: "badge-rejected",
  unsubscribed: "badge-rejected",
};

const TYPE_LABEL: Record<string, string> = {
  initial: "Initial",
  followup: "Follow-up",
  breakup: "Breakup",
};

export default async function OutreachPage() {
  const [messages, buyers, approvedLeads, suppressedCount, repliedCount, sentCount] =
    await Promise.all([
      db.outreachMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          buyer: { select: { buyerCompanyName: true, contactName: true, contactEmail: true } },
          leadsAttached: { select: { leadId: true } },
        },
      }).catch(() => []),
      db.buyer.findMany({
        where: { isSuppressed: false, contactEmail: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          buyerCompanyName: true,
          contactName: true,
          contactEmail: true,
          contactRole: true,
          territoryFocus: true,
        },
      }).catch(() => []),
      db.lead.findMany({
        where: { status: "approved" },
        orderBy: { approvedAt: "desc" },
        take: 200,
        select: {
          id: true,
          companyName: true,
          city: true,
          state: true,
        },
      }).catch(() => []),
      db.suppressionRecord.count().catch(() => 0),
      db.outreachMessage.count({ where: { status: "replied" } }).catch(() => 0),
      db.outreachMessage.count({ where: { status: "sent" } }).catch(() => 0),
    ]);

  const totalSent = sentCount + repliedCount;
  const replyRate = totalSent > 0 ? Math.round((repliedCount / totalSent) * 100) : 0;

  return (
    <div className="p-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Outreach</h1>
          <p className="font-mono text-xs text-ink-faint mt-0.5">
            {messages.length} messages logged
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Sent", value: totalSent, sub: "Total messages" },
          { label: "Replied", value: repliedCount, sub: `${replyRate}% reply rate`, color: "#1A6B45" },
          { label: "Buyers", value: buyers.length, sub: "With contact email", color: "#1E7B7E" },
          { label: "Suppressed", value: suppressedCount, sub: "On suppression list" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="admin-stat-card">
            <p className="font-mono text-2xs text-ink-faint uppercase tracking-wider mb-2">{label}</p>
            <p className="font-mono text-2xl font-semibold text-ink" style={color ? { color } : {}}>
              {value}
            </p>
            <p className="font-mono text-xs text-ink-muted mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Message log */}
        <div className="xl:col-span-2">
          <h2 className="font-mono text-xs font-medium text-ink-faint uppercase tracking-wider mb-3">
            Message Log
          </h2>
          <div className="card overflow-hidden">
            {messages.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Leads</th>
                    <th>Status</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg.id}>
                      <td>
                        <p className="font-medium text-sm text-ink">{msg.buyer.buyerCompanyName}</p>
                        <p className="font-mono text-2xs text-ink-faint">
                          {msg.buyer.contactName ?? msg.buyer.contactEmail}
                        </p>
                      </td>
                      <td>
                        <span className="text-sm text-ink-muted line-clamp-1">{msg.subject}</span>
                      </td>
                      <td>
                        <span className="badge-neutral">
                          {TYPE_LABEL[msg.emailType] ?? msg.emailType}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-ink-muted">
                          {msg.leadsAttached.length > 0
                            ? `${msg.leadsAttached.length} attached`
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span className={STATUS_BADGE[msg.status] ?? "badge-neutral"}>
                          {msg.status}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-ink-faint">
                          {msg.sentAt ? formatDateTime(msg.sentAt) : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-14 text-center">
                <p className="font-mono text-xs text-ink-faint">No messages yet.</p>
                <p className="text-sm text-ink-muted mt-1">
                  Use the draft panel to generate and send your first outreach.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Draft panel — client component */}
        <DraftPanel
          buyers={buyers.map((b) => ({
            id: b.id,
            buyerCompanyName: b.buyerCompanyName,
            contactName: b.contactName,
            contactEmail: b.contactEmail,
            contactRole: b.contactRole,
            territoryFocus: b.territoryFocus,
          }))}
          approvedLeads={approvedLeads}
          suppressedCount={suppressedCount}
        />
      </div>
    </div>
  );
}
