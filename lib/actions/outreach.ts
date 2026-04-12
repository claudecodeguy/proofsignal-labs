"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  generateInitialEmail,
  generateFollowupEmail,
  generateBreakupEmail,
  type BuyerContext,
  type LeadSummary,
} from "@/lib/email/draft";
import { isEmailSuppressed } from "@/lib/ingestion/dedup";
import { getOrCreateCampaign, addLeadToCampaign, getLeadStatus, getLeadReplies } from "@/lib/integrations/instantly";

const SENDER_EMAIL = process.env.SENDER_EMAIL ?? "outreach@proofsignallabs.com";
const SENDER_NAME  = process.env.SENDER_NAME  ?? "ProofSignal Labs";

// ── Generate a draft (no send) ─────────────────────────────────────────────────

export async function generateDraft(formData: FormData) {
  const buyerId = formData.get("buyerId") as string;
  const emailType = (formData.get("emailType") as string) ?? "initial";
  const leadIds = formData.getAll("leadIds") as string[];
  const originalSubject = formData.get("originalSubject") as string | null;

  if (!buyerId) return { error: "Buyer required" };

  const buyer = await db.buyer.findUnique({ where: { id: buyerId } });
  if (!buyer) return { error: "Buyer not found" };
  if (!buyer.contactEmail) return { error: "Buyer has no contact email" };

  // Check suppression
  const suppressed = await isEmailSuppressed(buyer.contactEmail);
  if (suppressed) return { error: `${buyer.contactEmail} is suppressed` };

  const buyerCtx: BuyerContext = {
    buyerCompanyName: buyer.buyerCompanyName,
    contactName: buyer.contactName,
    contactRole: buyer.contactRole,
    contactEmail: buyer.contactEmail,
    territoryFocus: buyer.territoryFocus,
  };

  let draft: { subject: string; body: string };

  if (emailType === "followup") {
    if (!originalSubject) return { error: "originalSubject required for follow-up" };
    draft = await generateFollowupEmail(buyerCtx, originalSubject);
  } else if (emailType === "breakup") {
    if (!originalSubject) return { error: "originalSubject required for breakup" };
    draft = await generateBreakupEmail(buyerCtx, originalSubject);
  } else {
    // Initial outreach — load leads
    let leadSummaries: LeadSummary[] = [];
    if (leadIds.length > 0) {
      const leads = await db.lead.findMany({
        where: { id: { in: leadIds }, status: "approved" },
        select: {
          companyName: true,
          city: true,
          state: true,
          whyNowReason: true,
          company: {
            select: {
              locationCountEstimate: true,
              fitSignals: true,
            },
          },
        },
      });
      leadSummaries = leads.map((l) => ({
        companyName: l.companyName,
        city: l.city,
        state: l.state,
        locationCount: l.company.locationCountEstimate,
        whyNowReason: l.whyNowReason,
        fitSignals: l.company.fitSignals,
      }));
    }
    draft = await generateInitialEmail(buyerCtx, leadSummaries);
  }

  // Save as draft in DB
  const message = await db.outreachMessage.create({
    data: {
      buyerId,
      subject: draft.subject,
      bodyText: draft.body,
      emailType,
      senderEmail: SENDER_EMAIL,
      senderName: SENDER_NAME,
      status: "draft",
      ...(leadIds.length > 0
        ? {
            leadsAttached: {
              create: leadIds.map((leadId) => ({ leadId })),
            },
          }
        : {}),
    },
  });

  revalidatePath("/admin/outreach");
  return { success: true, messageId: message.id, subject: draft.subject, body: draft.body };
}

// ── Send a saved draft via Instantly ──────────────────────────────────────────

export async function sendDraft(messageId: string) {
  const message = await db.outreachMessage.findUnique({
    where: { id: messageId },
    include: { buyer: true },
  });

  if (!message) return { error: "Message not found" };
  if (message.status !== "draft") return { error: "Only draft messages can be sent" };
  if (!message.buyer.contactEmail) return { error: "Buyer has no contact email" };

  // Suppression check
  const suppressed = await isEmailSuppressed(message.buyer.contactEmail);
  if (suppressed) {
    await db.outreachMessage.update({
      where: { id: messageId },
      data: { status: "bounced", errorMessage: "Email is suppressed" },
    });
    return { error: "Email is on suppression list" };
  }

  // Append unsubscribe link — Instantly will also add its own, but include ours too
  const secret = process.env.NEXTAUTH_SECRET ?? "proofsignal-unsub-secret";
  const { createHmac } = await import("crypto");
  const token = createHmac("sha256", secret)
    .update(message.buyer.contactEmail.toLowerCase())
    .digest("hex");
  const base = process.env.NEXTAUTH_URL ?? "https://proofsignallabs.com";
  const unsubUrl = `${base}/api/unsubscribe?email=${encodeURIComponent(
    message.buyer.contactEmail
  )}&token=${token}`;
  const bodyWithUnsub = `${message.bodyText}\n\nTo opt out: ${unsubUrl}`;

  // Determine territory for campaign routing
  const territory =
    message.buyer.territoryFocus?.split(",")[0].trim() ||
    message.buyer.buyerState ||
    "General";

  try {
    // Get or create the territory campaign
    const campaignId = await getOrCreateCampaign(territory);

    // Parse buyer first/last name
    const nameParts = (message.buyer.contactName ?? "").trim().split(" ");
    const firstName = nameParts[0] || message.buyer.buyerCompanyName;
    const lastName = nameParts.slice(1).join(" ") || undefined;

    // Push lead to Instantly — variables fill the campaign template
    const instantlyLeadId = await addLeadToCampaign({
      campaignId,
      email: message.buyer.contactEmail,
      firstName,
      lastName,
      companyName: message.buyer.buyerCompanyName,
      emailSubject: message.subject,
      emailBody: bodyWithUnsub,
    });

    await db.outreachMessage.update({
      where: { id: messageId },
      data: {
        status: "sent",
        sentAt: new Date(),
        errorMessage: null,
        instantlyLeadId,
        instantlyCampaignId: campaignId,
      },
    });

    revalidatePath("/admin/outreach");
    return { success: true, via: "instantly", campaignId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[instantly] Push failed:", msg);
    await db.outreachMessage.update({
      where: { id: messageId },
      data: { errorMessage: msg },
    });
    return { error: msg };
  }
}

// ── Log a reply manually ───────────────────────────────────────────────────────

export async function logReply(messageId: string, replyText: string) {
  const message = await db.outreachMessage.findUnique({
    where: { id: messageId },
    select: { buyerId: true, buyer: { select: { stage: true } } },
  });

  await db.outreachMessage.update({
    where: { id: messageId },
    data: { status: "replied", replyAt: new Date(), replyText },
  });

  // Advance buyer stage to engaged
  if (message) {
    const stagesBeforeEngaged = ["discovered", "enriched", "ready_for_outreach", "sample_sent"];
    if (stagesBeforeEngaged.includes(message.buyer.stage)) {
      await db.buyer.update({
        where: { id: message.buyerId },
        data: { stage: "engaged" },
      });
    }
  }

  revalidatePath("/admin/outreach");
  return { success: true };
}

// ── Sync statuses from Instantly ──────────────────────────────────────────────

export async function syncFromInstantly() {
  // Only sync messages that were sent via Instantly and haven't replied/bounced yet
  const sentMessages = await db.outreachMessage.findMany({
    where: {
      status: "sent",
      instantlyLeadId: { not: null },
    },
    select: {
      id: true,
      instantlyLeadId: true,
      instantlyCampaignId: true,
      buyerId: true,
      buyer: { select: { contactEmail: true, stage: true } },
    },
  });

  if (sentMessages.length === 0) return { success: true, updated: 0 };

  let updated = 0;

  for (const msg of sentMessages) {
    if (!msg.instantlyLeadId) continue;

    const lead = await getLeadStatus(msg.instantlyLeadId);
    if (!lead) continue;

    // status -1 = unsubscribed, 4 = bounced
    if (lead.status === -1) {
      await db.outreachMessage.update({
        where: { id: msg.id },
        data: { status: "unsubscribed" },
      });
      if (msg.buyer.contactEmail) {
        await db.suppressionRecord.upsert({
          where: { email: msg.buyer.contactEmail.toLowerCase() },
          update: { reason: "unsubscribed", suppressedAt: new Date() },
          create: { email: msg.buyer.contactEmail.toLowerCase(), buyerId: msg.buyerId, reason: "unsubscribed" },
        });
      }
      updated++;
      continue;
    }

    if (lead.status === 4) {
      await db.outreachMessage.update({
        where: { id: msg.id },
        data: { status: "bounced", errorMessage: "Hard bounce via Instantly" },
      });
      if (msg.buyer.contactEmail) {
        await db.suppressionRecord.upsert({
          where: { email: msg.buyer.contactEmail.toLowerCase() },
          update: { reason: "bounce", suppressedAt: new Date() },
          create: { email: msg.buyer.contactEmail.toLowerCase(), buyerId: msg.buyerId, reason: "bounce" },
        });
      }
      updated++;
      continue;
    }

    // Check for replies via unibox
    if (msg.instantlyCampaignId && msg.buyer.contactEmail) {
      const replies = await getLeadReplies(msg.instantlyCampaignId, msg.buyer.contactEmail);
      if (replies.length > 0) {
        const latest = replies[0];
        await db.outreachMessage.update({
          where: { id: msg.id },
          data: {
            status: "replied",
            replyAt: new Date(latest.timestamp),
            replyText: latest.body?.slice(0, 2000) ?? "(reply received via Instantly)",
          },
        });
        const stagesBeforeEngaged = ["discovered", "enriched", "ready_for_outreach", "sample_sent"];
        if (stagesBeforeEngaged.includes(msg.buyer.stage)) {
          await db.buyer.update({
            where: { id: msg.buyerId },
            data: { stage: "engaged" },
          });
        }
        updated++;
      }
    }
  }

  revalidatePath("/admin/outreach");
  return { success: true, updated, total: sentMessages.length };
}

// ── Suppress a contact ────────────────────────────────────────────────────────

export async function suppressContact(formData: FormData) {
  const email = formData.get("email") as string;
  const buyerId = formData.get("buyerId") as string | null;
  const reason = (formData.get("reason") as string) ?? "manual";

  if (!email) return { error: "Email required" };

  // Upsert suppression record
  await db.suppressionRecord.upsert({
    where: { email },
    update: { reason, suppressedAt: new Date() },
    create: {
      email,
      buyerId: buyerId || null,
      reason,
    },
  });

  // Mark any sent/draft messages for this email
  if (buyerId) {
    await db.outreachMessage.updateMany({
      where: { buyerId, status: { in: ["draft", "sent"] } },
      data: { status: "unsubscribed" },
    });
  }

  revalidatePath("/admin/outreach");
  return { success: true };
}

// ── Delete a draft ─────────────────────────────────────────────────────────────

export async function deleteDraft(messageId: string) {
  await db.outreachMessage.delete({ where: { id: messageId, status: "draft" } });
  revalidatePath("/admin/outreach");
  return { success: true };
}
