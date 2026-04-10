"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import {
  generateInitialEmail,
  generateFollowupEmail,
  generateBreakupEmail,
  type BuyerContext,
  type LeadSummary,
} from "@/lib/email/draft";
import { isEmailSuppressed } from "@/lib/ingestion/dedup";

const SENDER_EMAIL = process.env.SENDER_EMAIL ?? "outreach@proofsignallabs.com";
const SENDER_NAME = process.env.SENDER_NAME ?? "ProofSignal Labs";

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

// ── Send a saved draft ─────────────────────────────────────────────────────────

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

  // Append unsubscribe link programmatically — never rely on the LLM to include it
  const secret = process.env.NEXTAUTH_SECRET ?? "proofsignal-unsub-secret";
  const { createHmac } = await import("crypto");
  const token = createHmac("sha256", secret).update(message.buyer.contactEmail.toLowerCase()).digest("hex");
  const base = process.env.NEXTAUTH_URL ?? "https://proofsignallabs.com";
  const unsubUrl = `${base}/api/unsubscribe?email=${encodeURIComponent(message.buyer.contactEmail)}&token=${token}`;
  const bodyWithUnsub = `${message.bodyText}\n\nTo opt out: ${unsubUrl}`;

  const result = await sendEmail({
    to: message.buyer.contactEmail,
    toName: message.buyer.contactName ?? undefined,
    subject: message.subject,
    textBody: bodyWithUnsub,
  });

  if (!result.success) {
    await db.outreachMessage.update({
      where: { id: messageId },
      data: { status: "draft", errorMessage: result.error },
    });
    return { error: result.error };
  }

  await db.outreachMessage.update({
    where: { id: messageId },
    data: { status: "sent", sentAt: new Date(), errorMessage: null },
  });

  revalidatePath("/admin/outreach");
  return { success: true };
}

// ── Log a reply manually ───────────────────────────────────────────────────────

export async function logReply(messageId: string, replyText: string) {
  await db.outreachMessage.update({
    where: { id: messageId },
    data: {
      status: "replied",
      replyAt: new Date(),
      replyText,
    },
  });
  revalidatePath("/admin/outreach");
  return { success: true };
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
