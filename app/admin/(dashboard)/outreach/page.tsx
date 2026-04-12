import type { Metadata } from "next";
import { db } from "@/lib/db";
import DraftPanel from "./DraftPanel";
import MessageLog from "./MessageLog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Outreach" };


export default async function OutreachPage() {
  const [messages, buyers, approvedLeads, suppressedCount, repliedCount, sentCount] =
    await Promise.all([
      db.outreachMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          subject: true,
          emailType: true,
          status: true,
          sentAt: true,
          replyText: true,
          instantlyLeadId: true,
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
          <MessageLog messages={messages.map((m) => ({
            id: m.id,
            buyerCompanyName: m.buyer.buyerCompanyName,
            contactName: m.buyer.contactName,
            contactEmail: m.buyer.contactEmail,
            subject: m.subject,
            emailType: m.emailType,
            leadsCount: m.leadsAttached.length,
            status: m.status,
            sentAt: m.sentAt?.toISOString() ?? null,
            replyText: m.replyText,
            instantlyLeadId: m.instantlyLeadId,
          }))} />
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
