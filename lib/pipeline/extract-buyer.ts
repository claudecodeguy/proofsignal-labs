/**
 * Claude Haiku extraction for MSP/MSSP buyer sites.
 *
 * Extracts: company identity, territory, services, contact, fit signals.
 * Cheaper path than company extraction — buyers are added once and reused.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export interface BuyerExtraction {
  buyerCompanyName: string;
  domain: string;
  city: string | null;
  state: string | null;
  country: string;

  // Niche fit
  servesDentalClients: boolean;
  buyerNicheConfidence: number; // 0-100
  buyerServices: string | null; // short summary of their IT services
  territoryFocus: string | null; // e.g. "TX, OK, LA" or "Southeast US"

  // Contact
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;

  // Fit signals
  buyerFitScore: number; // 0-100 preliminary
  evidenceSnippets: Array<{
    fieldName: string;
    evidenceText: string;
    sourceUrl: string;
    pageType: string;
    confidence: number;
  }>;
}

function buildBuyerPrompt(
  domain: string,
  pageContents: Array<{ pageType: string; url: string; markdown: string }>
): string {
  const contentBlock = pageContents
    .filter((p) => p.markdown.length > 50)
    .map((p) => `## ${p.pageType.toUpperCase()} (${p.url})\n\n${p.markdown.slice(0, 3000)}`)
    .join("\n\n---\n\n");

  return `You are analyzing the website of a potential MSP or MSSP (Managed Service Provider / Managed Security Service Provider) to determine if they serve dental clinic clients and would be a good buyer for dental clinic leads.

DOMAIN: ${domain}

SCRAPED CONTENT:
${contentBlock}

Extract the following as JSON. Only include what you can actually find in the content.

Return ONLY valid JSON:
{
  "buyerCompanyName": string,
  "city": string or null,
  "state": string (2-letter US state) or null,
  "country": "US",
  "servesDentalClients": boolean,
  "buyerNicheConfidence": 0-100,
  "buyerServices": string or null (1-2 sentence summary of their IT/security services),
  "territoryFocus": string or null (e.g. "Texas", "TX, OK, LA", "Southeast US", "National"),
  "contactName": string or null,
  "contactRole": string or null,
  "contactEmail": string or null,
  "contactPhone": string or null,
  "buyerFitScore": 0-100,
  "evidenceSnippets": [
    {
      "fieldName": string,
      "evidenceText": string (exact quote),
      "sourceUrl": string,
      "pageType": string,
      "confidence": 0-100
    }
  ]
}

Scoring guidelines for buyerFitScore:
- 80-100: Explicitly mentions dental clients, healthcare IT, HIPAA compliance, dental software support (Dentrix, Eaglesoft, etc.)
- 60-79: General healthcare IT focus, HIPAA-ready, SMB MSP in dental-heavy region
- 40-59: General MSP with no healthcare mention but plausible fit
- 0-39: Wrong vertical (enterprise-only, consumer IT, staffing, etc.)

servesDentalClients: true only if they explicitly mention dental, dental software, or dental clinic clients.
territoryFocus: extract from "we serve X" language or office locations.
contactRole priority: owner, founder, CEO, business development, sales — in that order.
contactEmail: extract ANY email address visible in the content (info@, sales@, contact@, hello@, or personal). Prefer business emails over generic ones. If multiple, pick the most specific.
contactPhone: extract any US phone number visible in the content.`;
}

async function callHaiku(prompt: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function extractBuyerData(
  domain: string,
  pageContents: Array<{ pageType: string; url: string; markdown: string }>,
  runId: string
): Promise<BuyerExtraction | null> {
  const prompt = buildBuyerPrompt(domain, pageContents);

  try {
    const raw = await callHaiku(prompt);

    // Track Haiku usage
    await db.discoveryRun.update({
      where: { id: runId },
      data: { haikuCalls: { increment: 1 } },
    });

    const parsed = parseJson(raw) as Partial<BuyerExtraction>;

    return {
      buyerCompanyName: parsed.buyerCompanyName ?? domain,
      domain,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      country: parsed.country ?? "US",
      servesDentalClients: parsed.servesDentalClients ?? false,
      buyerNicheConfidence: parsed.buyerNicheConfidence ?? 0,
      buyerServices: parsed.buyerServices ?? null,
      territoryFocus: parsed.territoryFocus ?? null,
      contactName: parsed.contactName ?? null,
      contactRole: parsed.contactRole ?? null,
      contactEmail: parsed.contactEmail ?? null,
      contactPhone: parsed.contactPhone ?? null,
      buyerFitScore: parsed.buyerFitScore ?? 0,
      evidenceSnippets: parsed.evidenceSnippets ?? [],
    };
  } catch (err) {
    console.error("[extract-buyer] Haiku failed for", domain, err);
    return null;
  }
}
