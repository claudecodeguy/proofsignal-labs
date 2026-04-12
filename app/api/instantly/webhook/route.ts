export const dynamic = "force-dynamic";

/**
 * Instantly.ai webhook receiver.
 *
 * Set the webhook URL in Instantly dashboard → Settings → Integrations → Webhooks:
 *   https://proofsignallabs.com/api/instantly/webhook
 *
 * Events handled:
 *   - email_opened      → no DB change (just logs)
 *   - email_replied     → status = "replied", buyer stage = "engaged"
 *   - email_bounced     → status = "bounced", buyer suppressed
 *   - email_unsubscribed → status = "unsubscribed", email suppressed
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface InstantlyWebhookPayload {
  event_type:
    | "email_opened"
    | "email_replied"
    | "email_bounced"
    | "email_unsubscribed"
    | string;
  timestamp?: string;
  lead?: {
    id?: string;
    email?: string;
    campaign_id?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  };
  reply_text?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  let body: InstantlyWebhookPayload;

  try {
    body = (await req.json()) as InstantlyWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, lead, reply_text } = body;
  const leadId = lead?.id;
  const email = lead?.email?.toLowerCase();

  console.log(`[instantly-webhook] ${event_type} — lead ${leadId} (${email})`);

  // Find the outreach message by Instantly lead ID (primary) or email (fallback)
  let message = leadId
    ? await db.outreachMessage.findFirst({
        where: { instantlyLeadId: leadId },
        include: { buyer: true },
      })
    : null;

  if (!message && email) {
    message = await db.outreachMessage.findFirst({
      where: { buyer: { contactEmail: email }, status: { in: ["sent", "replied"] } },
      orderBy: { sentAt: "desc" },
      include: { buyer: true },
    });
  }

  if (!message) {
    // Not a tracked message — still acknowledge so Instantly doesn't retry
    console.warn(`[instantly-webhook] No matching message for lead ${leadId} / ${email}`);
    return NextResponse.json({ ok: true, matched: false });
  }

  switch (event_type) {
    case "email_opened":
      // Track opens but don't change status — leave as "sent"
      break;

    case "email_replied": {
      await db.outreachMessage.update({
        where: { id: message.id },
        data: {
          status: "replied",
          replyAt: new Date(),
          replyText: reply_text ?? "(reply received via Instantly)",
        },
      });
      // Move buyer stage to "engaged" if they're not already further along
      const stagesBeforeEngaged = ["discovered", "enriched", "ready_for_outreach", "sample_sent"];
      if (stagesBeforeEngaged.includes(message.buyer.stage)) {
        await db.buyer.update({
          where: { id: message.buyerId },
          data: { stage: "engaged" },
        });
      }
      break;
    }

    case "email_bounced": {
      await db.outreachMessage.update({
        where: { id: message.id },
        data: {
          status: "bounced",
          errorMessage: "Hard bounce reported by Instantly",
        },
      });
      if (email) {
        await db.suppressionRecord.upsert({
          where: { email },
          update: { reason: "bounce", suppressedAt: new Date() },
          create: { email, buyerId: message.buyerId, reason: "bounce" },
        });
        await db.buyer.update({
          where: { id: message.buyerId },
          data: { isSuppressed: true, suppressedAt: new Date(), suppressedReason: "bounce" },
        });
      }
      break;
    }

    case "email_unsubscribed": {
      await db.outreachMessage.update({
        where: { id: message.id },
        data: { status: "unsubscribed" },
      });
      if (email) {
        await db.suppressionRecord.upsert({
          where: { email },
          update: { reason: "unsubscribed", suppressedAt: new Date() },
          create: { email, buyerId: message.buyerId, reason: "unsubscribed" },
        });
        await db.buyer.update({
          where: { id: message.buyerId },
          data: { isSuppressed: true, suppressedAt: new Date(), suppressedReason: "unsubscribed" },
        });
      }
      break;
    }

    default:
      console.log(`[instantly-webhook] Unhandled event: ${event_type}`);
  }

  return NextResponse.json({ ok: true, matched: true, event: event_type });
}
