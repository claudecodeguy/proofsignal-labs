export const dynamic = "force-dynamic";

/**
 * POST /api/outreach/reply
 *
 * Inbound reply webhook — called by Postmark (or any email provider) when a
 * recipient replies to a sent outreach message.
 *
 * Postmark inbound webhook payload: https://postmarkapp.com/developer/webhooks/inbound-webhook
 *
 * To wire this up:
 * 1. In Postmark → Servers → your server → Settings → Inbound
 * 2. Set the webhook URL to: https://your-domain.com/api/outreach/reply
 * 3. Postmark will POST JSON for every inbound email to your reply-to address
 *
 * This route matches the reply to an OutreachMessage by the "To" address and
 * updates its status to "replied".
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PostmarkInboundPayload {
  FromFull?: { Email?: string; Name?: string };
  ToFull?: Array<{ Email?: string }>;
  Subject?: string;
  TextBody?: string;
  HtmlBody?: string;
  OriginalRecipient?: string;
}

export async function POST(req: NextRequest) {
  let payload: PostmarkInboundPayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = payload.FromFull?.Email?.toLowerCase();
  const textBody = payload.TextBody ?? payload.HtmlBody ?? "";

  if (!fromEmail) {
    return NextResponse.json({ error: "No sender email" }, { status: 400 });
  }

  // Find the most recent sent message to/from this buyer email
  const buyer = await db.buyer.findFirst({
    where: {
      contactEmail: {
        equals: fromEmail,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (!buyer) {
    console.log(`[reply-webhook] No buyer found for email: ${fromEmail}`);
    return NextResponse.json({ ok: true, matched: false });
  }

  // Find the latest sent message for this buyer
  const message = await db.outreachMessage.findFirst({
    where: {
      buyerId: buyer.id,
      status: "sent",
    },
    orderBy: { sentAt: "desc" },
  });

  if (!message) {
    console.log(`[reply-webhook] No sent message found for buyer: ${buyer.id}`);
    return NextResponse.json({ ok: true, matched: false });
  }

  // Mark as replied
  await db.outreachMessage.update({
    where: { id: message.id },
    data: {
      status: "replied",
      replyAt: new Date(),
      replyText: textBody.slice(0, 5000), // cap to avoid massive payloads
    },
  });

  console.log(`[reply-webhook] Marked message ${message.id} as replied from ${fromEmail}`);
  return NextResponse.json({ ok: true, matched: true, messageId: message.id });
}

/**
 * POST /api/outreach/reply/bounce
 * Postmark bounce webhook — marks a message as bounced and suppresses the email.
 */
export async function PUT(req: NextRequest) {
  let payload: { Email?: string; Type?: string };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = payload.Email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "No email" }, { status: 400 });

  // Add to suppression list
  await db.suppressionRecord.upsert({
    where: { email },
    update: { reason: "bounce" },
    create: { email, reason: "bounce" },
  });

  // Mark any sent messages as bounced
  const buyer = await db.buyer.findFirst({
    where: { contactEmail: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (buyer) {
    await db.outreachMessage.updateMany({
      where: { buyerId: buyer.id, status: "sent" },
      data: { status: "bounced" },
    });
  }

  return NextResponse.json({ ok: true });
}
