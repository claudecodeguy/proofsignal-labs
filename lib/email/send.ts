/**
 * Email sender — SMTP via Nodemailer (configured for Postmark).
 *
 * Reads SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS from env.
 * Works with any SMTP provider; just swap credentials.
 */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.postmarkapp.com",
  port: parseInt(process.env.SMTP_PORT ?? "587", 10),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
});

export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  replyTo?: string;
  messageId?: string; // for threading
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const FROM_NAME = process.env.SENDER_NAME ?? "ProofSignal Labs";
const FROM_EMAIL = process.env.SENDER_EMAIL ?? "outreach@proofsignallabs.com";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: input.toName ? `"${input.toName}" <${input.to}>` : input.to,
      subject: input.subject,
      text: input.textBody,
      // Plain text only — no HTML. HTML triggers Gmail Promotions tab.
      replyTo: input.replyTo ?? FROM_EMAIL,
      ...(input.messageId ? { references: input.messageId, inReplyTo: input.messageId } : {}),
      headers: {
        "X-PM-Message-Stream": "outbound",
      },
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Send failed:", msg);
    return { success: false, error: msg };
  }
}

/** Minimal plain-text → HTML for clients that need HTML */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = escaped
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#18182B;max-width:600px;margin:0 auto;padding:24px">${paragraphs}</body></html>`;
}

/** Verify SMTP credentials are configured (cheap check for settings page) */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  // Don't attempt if credentials are placeholder values
  if (
    !process.env.SMTP_USER ||
    process.env.SMTP_USER === "your-postmark-api-token"
  ) {
    return { ok: false, error: "SMTP credentials not configured" };
  }
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
