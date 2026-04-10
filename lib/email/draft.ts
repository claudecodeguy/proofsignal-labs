/**
 * Email draft generator — uses Claude Haiku to write personalized outreach emails.
 *
 * Generates initial, follow-up, and breakup emails for a given buyer + lead set.
 * All generation happens server-side; drafts are saved to DB before sending.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createHmac } from "crypto";

function unsubscribeUrl(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "proofsignal-unsub-secret";
  const token = createHmac("sha256", secret).update(email.toLowerCase()).digest("hex");
  const base = process.env.NEXTAUTH_URL ?? "https://proofsignallabs.com";
  return `${base}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export interface LeadSummary {
  companyName: string;
  city: string | null;
  state: string | null;
  locationCount: number | null;
  whyNowReason: string | null;
  fitSignals: string[];
}

export interface BuyerContext {
  buyerCompanyName: string;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string;
  territoryFocus: string | null;
}

export interface DraftResult {
  subject: string;
  body: string;
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildInitialPrompt(buyer: BuyerContext, leads: LeadSummary[]): string {
  const senderName = process.env.SENDER_NAME ?? "ProofSignal Labs";
  const senderAddress = process.env.SENDER_ADDRESS ?? "Austin, TX";
  const unsub = unsubscribeUrl(buyer.contactEmail);

  const leadBlock = leads
    .map((l) => {
      const geo = [l.city, l.state].filter(Boolean).join(", ");
      const lines: string[] = [`- ${l.companyName} (${geo})`];
      if (l.locationCount && l.locationCount > 1) lines.push(`  - ${l.locationCount} locations`);
      if (l.fitSignals.length > 0) lines.push(`  - ${l.fitSignals[0]}`);
      if (l.whyNowReason) lines.push(`  - ${l.whyNowReason}`);
      return lines.join("\n");
    })
    .join("\n");

  const greeting = buyer.contactName ? `Hi ${buyer.contactName.split(" ")[0]},` : "Hi,";
  const territory = buyer.territoryFocus ? `focused on ${buyer.territoryFocus}` : "in your target market";

  return `Write a short, professional B2B cold outreach email from ${senderName} to a dental IT provider.

SENDER: ${senderName}, ${senderAddress}
RECIPIENT: ${buyer.contactName ?? "the team"} at ${buyer.buyerCompanyName} (${buyer.contactRole ?? "business development"})
PURPOSE: Offer verified dental clinic leads ${territory}

SAMPLE LEADS TO REFERENCE IN THE EMAIL BODY:
${leadBlock || "(no leads provided — write email without specific examples, offer to send sample)"}

RULES:
- Greeting: "${greeting}"
- 3 short paragraphs, plain and direct
- If leads are provided: include the lead list EXACTLY as formatted below, preserving the bullet structure. Write 1-2 sentences introducing the list, then paste the list as-is, then continue with the CTA paragraph.
- If no leads: mention we have verified dental clinic leads in their territory and offer a free sample batch
- Value prop: we pre-qualify dental clinics and surface why-now signals so they don't waste time on cold research
- CTA: ask them to reply if they want to see the full lead details, or ask for a 15-min call
- Sign off with: "Best,\\n${senderName} Team"
- NEVER use em dashes (— or --). Use commas or periods instead.
- NEVER use: DSO, MSSP, MSP, or other acronyms the reader might not know
- NEVER use: "delve", "leverage", "seamless", "cutting-edge", "revolutionize", or corporate jargon
- NEVER use emojis
- Tone: plain, direct, like a colleague passing along a tip — not a sales pitch
- Add this exact line at the very end, after the sign-off, on its own line: "To opt out: ${unsub}"

SUBJECT LINE RULES:
- 6-9 words, plain and specific
- Reference the territory or a specific signal, not generic claims
- No clickbait, no all-caps, no punctuation tricks
- Do not use acronyms
- Examples of good subjects: "Dental clinics in Dallas with open IT roles", "Three multi-location practices in your area"

Return ONLY valid JSON:
{
  "subject": "string",
  "body": "string (full email text, use \\n for line breaks)"
}`;
}

function buildFollowupPrompt(buyer: BuyerContext, originalSubject: string): string {
  const senderName = process.env.SENDER_NAME ?? "ProofSignal Labs";
  const greeting = buyer.contactName ? `Hi ${buyer.contactName.split(" ")[0]},` : "Hi,";
  const unsub = unsubscribeUrl(buyer.contactEmail);

  return `Write a short follow-up email for a B2B outreach sequence.

SENDER: ${senderName}
RECIPIENT: ${buyer.contactName ?? "the team"} at ${buyer.buyerCompanyName}
ORIGINAL EMAIL SUBJECT: ${originalSubject}
DAYS SINCE FIRST EMAIL: ~5

RULES:
- Greeting: "${greeting}"
- 2 paragraphs max, bump the original and add one new angle
- New angle: mention that dental clinic leads in their territory are time-sensitive
- CTA: "Worth a quick look?" or similar low-pressure ask
- Sign off: "Best,\\n${senderName} Team"
- Reference the previous email naturally without being needy
- NEVER use em dashes (— or --). Use commas or periods instead.
- Add this exact line at the very end, after the sign-off, on its own line: "To opt out: ${unsub}"

Return ONLY valid JSON:
{
  "subject": "Re: ${originalSubject}",
  "body": "string"
}`;
}

function buildBreakupPrompt(buyer: BuyerContext, originalSubject: string): string {
  const senderName = process.env.SENDER_NAME ?? "ProofSignal Labs";
  const greeting = buyer.contactName ? `Hi ${buyer.contactName.split(" ")[0]},` : "Hi,";
  const unsub = unsubscribeUrl(buyer.contactEmail);

  return `Write a final "breakup" email to close a cold outreach sequence.

SENDER: ${senderName}
RECIPIENT: ${buyer.contactName ?? "the team"} at ${buyer.buyerCompanyName}
ORIGINAL EMAIL SUBJECT: ${originalSubject}

RULES:
- Greeting: "${greeting}"
- 2 paragraphs, acknowledge they're busy, close gracefully
- Leave door open: "If dental clinic leads become relevant, feel free to reach out"
- No guilt-tripping, no desperation
- Sign off: "Best,\\n${senderName} Team"
- NEVER use em dashes (— or --). Use commas or periods instead.
- Add this exact line at the very end, after the sign-off, on its own line: "To opt out: ${unsub}"

Return ONLY valid JSON:
{
  "subject": "Closing the loop, ${buyer.buyerCompanyName}",
  "body": "string"
}`;
}

// ── Generator ──────────────────────────────────────────────────────────────────

async function callHaiku(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJson(raw: string): { subject: string; body: string } {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function generateInitialEmail(
  buyer: BuyerContext,
  leads: LeadSummary[]
): Promise<DraftResult> {
  const prompt = buildInitialPrompt(buyer, leads);
  const raw = await callHaiku(prompt);
  return parseJson(raw);
}

export async function generateFollowupEmail(
  buyer: BuyerContext,
  originalSubject: string
): Promise<DraftResult> {
  const prompt = buildFollowupPrompt(buyer, originalSubject);
  const raw = await callHaiku(prompt);
  return parseJson(raw);
}

export async function generateBreakupEmail(
  buyer: BuyerContext,
  originalSubject: string
): Promise<DraftResult> {
  const prompt = buildBreakupPrompt(buyer, originalSubject);
  const raw = await callHaiku(prompt);
  return parseJson(raw);
}
