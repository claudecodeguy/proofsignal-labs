/**
 * Claude extraction layer.
 *
 * Haiku 4.5 handles structured extraction from scraped markdown (cheap + fast).
 * Sonnet 4.6 handles borderline adjudication only (escalation path).
 *
 * All prompts are dental_msp_us–scoped for Phase 1C.
 * Future: load prompts from VerticalConfig in DB.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CompanyExtraction {
  companyName: string;
  domain: string;
  city: string | null;
  state: string | null;
  country: string;

  // Vertical classification
  isDentalClinic: boolean;
  verticalMatchConfidence: number; // 0-100
  locationCountEstimate: number | null;
  locationCountConfidence: "high" | "medium" | "low" | null;

  // Contact
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  contactPhone: string | null;

  // Signals
  technologyClues: string[];
  complianceClues: string[];
  growthSignals: string[];
  fitSignals: string[];
  triggerSignals: string[];
  whyNowReason: string | null;

  // Dental-specific
  patientMgmtSoftware: string | null; // e.g. "Dentrix", "Eaglesoft"
  hasMultiLocation: boolean;
  recentExpansion: boolean;
  likelyManagedInHouse: boolean;

  // Evidence snippets for each signal (maps fieldName → source text)
  evidenceSnippets: Array<{
    fieldName: string;
    evidenceText: string;
    sourceUrl: string;
    pageType: string;
    confidence: number;
  }>;
}

export interface AdjudicationResult {
  decision: "approved" | "borderline" | "rejected";
  fitScore: number; // 0-100
  confidenceScore: number; // 0-100
  reasonSummary: string;
  topSupportingEvidence: string[];
  topMissingEvidence: string[];
  modelUsed: "haiku" | "sonnet" | "deterministic";
}

// ── Extraction prompt ──────────────────────────────────────────────────────────

function buildExtractionPrompt(
  companyName: string,
  domain: string,
  pageContents: Array<{ pageType: string; url: string; markdown: string }>
): string {
  const contentBlock = pageContents
    .filter((p) => p.markdown.length > 50)
    .map((p) => `## ${p.pageType.toUpperCase()} (${p.url})\n\n${p.markdown.slice(0, 3000)}`)
    .join("\n\n---\n\n");

  return `You are an expert at analyzing dental clinic websites to determine if they are good targets for dental IT/MSP outreach.

COMPANY: ${companyName}
DOMAIN: ${domain}

SCRAPED CONTENT:
${contentBlock}

Extract the following information as JSON. Be precise and evidence-based. Only include things you can actually find in the content.

Return ONLY valid JSON with this exact structure:
{
  "isDentalClinic": boolean,
  "verticalMatchConfidence": 0-100,
  "city": string or null,
  "state": string (2-letter US state code) or null,
  "country": "US",
  "locationCountEstimate": number or null,
  "locationCountConfidence": "high" | "medium" | "low" | null,
  "contactName": string or null,
  "contactRole": string or null,
  "contactEmail": string or null,
  "contactPhone": string or null,
  "technologyClues": [string],
  "complianceClues": [string],
  "growthSignals": [string],
  "fitSignals": [string],
  "triggerSignals": [string],
  "whyNowReason": string or null,
  "patientMgmtSoftware": string or null,
  "hasMultiLocation": boolean,
  "recentExpansion": boolean,
  "likelyManagedInHouse": boolean,
  "evidenceSnippets": [
    {
      "fieldName": string,
      "evidenceText": string (exact quote from content),
      "sourceUrl": string,
      "pageType": string,
      "confidence": 0-100
    }
  ]
}

Guidelines:
- isDentalClinic: true only if this is clearly a dental practice/group providing patient care
- verticalMatchConfidence: confidence that this is a dental clinic (not a dental supplier, lab, school, etc.)
- technologyClues: any mention of software, hardware, IT systems, EMR/PMS, security, cloud, etc.
- complianceClues: HIPAA mentions, PHI, compliance policies, security audits, certifications
- growthSignals: hiring ads, new locations announced, recent acquisitions, expansion language
- fitSignals: multi-location, large patient volume, complex IT needs, enterprise-adjacent
- triggerSignals: "currently looking for", leadership change, new systems rollout, post-acquisition
- whyNowReason: 1-sentence compelling reason to reach out NOW (or null)
- patientMgmtSoftware: extract brand name if mentioned (Dentrix, Eaglesoft, Curve, Open Dental, etc.)
- likelyManagedInHouse: if they mention their own IT staff or "in-house" IT
- evidenceSnippets: include 3-8 key snippets that justify your signal classifications`;
}

// ── Adjudication prompt ────────────────────────────────────────────────────────

function buildAdjudicationPrompt(
  extraction: CompanyExtraction,
  fitScore: number
): string {
  return `You are a senior analyst reviewing a dental clinic lead for MSP/MSSP outreach potential.

COMPANY: ${extraction.companyName} (${extraction.domain})
LOCATION: ${extraction.city ?? "unknown"}, ${extraction.state ?? "unknown"}
LOCATION COUNT: ${extraction.locationCountEstimate ?? "unknown"} (${extraction.locationCountConfidence ?? "unknown"} confidence)
FIT SCORE: ${fitScore}/100
MULTI-LOCATION: ${extraction.hasMultiLocation}
PATIENT MGMT SOFTWARE: ${extraction.patientMgmtSoftware ?? "unknown"}
LIKELY IN-HOUSE IT: ${extraction.likelyManagedInHouse}

SIGNALS FOUND:
Technology: ${extraction.technologyClues.join(", ") || "none"}
Compliance: ${extraction.complianceClues.join(", ") || "none"}
Growth: ${extraction.growthSignals.join(", ") || "none"}
Fit: ${extraction.fitSignals.join(", ") || "none"}
Triggers: ${extraction.triggerSignals.join(", ") || "none"}
Why Now: ${extraction.whyNowReason ?? "none"}

Make a final classification decision: approved, borderline, or rejected.

Return ONLY valid JSON:
{
  "decision": "approved" | "borderline" | "rejected",
  "fitScore": 0-100,
  "confidenceScore": 0-100,
  "reasonSummary": "2-3 sentence explanation",
  "topSupportingEvidence": [string, string, string],
  "topMissingEvidence": [string, string]
}

Decision criteria:
- approved (fitScore >= 65, confidenceScore >= 60): Clear dental clinic, 2+ locations or strong IT signals, no blockers
- borderline (fitScore 40-64 OR confidenceScore 40-59): Potentially good fit but missing key data or ambiguous signals
- rejected (fitScore < 40 OR clearly not a dental clinic): Wrong vertical, single solo practice with no signals, competitor, etc.`;
}

// ── Claude calls ───────────────────────────────────────────────────────────────

async function callHaiku(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

async function callSonnet(prompt: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

function parseJsonFromResponse(text: string): unknown {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return JSON.parse(cleaned);
}

// ── Tracking ───────────────────────────────────────────────────────────────────

export async function trackModelUsage(
  runId: string,
  model: "haiku" | "sonnet",
  calls: number = 1
) {
  if (model === "haiku") {
    await db.discoveryRun.update({
      where: { id: runId },
      data: { haikuCalls: { increment: calls } },
    });
  } else {
    await db.discoveryRun.update({
      where: { id: runId },
      data: { sonnetCalls: { increment: calls } },
    });
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Extract structured company data from scraped page contents.
 * Uses Claude Haiku 4.5 — cheap and fast.
 */
export async function extractCompanyData(
  companyName: string,
  domain: string,
  pageContents: Array<{ pageType: string; url: string; markdown: string }>,
  runId: string
): Promise<CompanyExtraction | null> {
  const prompt = buildExtractionPrompt(companyName, domain, pageContents);

  try {
    const raw = await callHaiku(prompt);
    await trackModelUsage(runId, "haiku");

    const parsed = parseJsonFromResponse(raw) as Partial<CompanyExtraction>;

    return {
      companyName,
      domain,
      city: parsed.city ?? null,
      state: parsed.state ?? null,
      country: parsed.country ?? "US",
      isDentalClinic: parsed.isDentalClinic ?? false,
      verticalMatchConfidence: parsed.verticalMatchConfidence ?? 0,
      locationCountEstimate: parsed.locationCountEstimate ?? null,
      locationCountConfidence: parsed.locationCountConfidence ?? null,
      contactName: parsed.contactName ?? null,
      contactRole: parsed.contactRole ?? null,
      contactEmail: parsed.contactEmail ?? null,
      contactPhone: parsed.contactPhone ?? null,
      technologyClues: parsed.technologyClues ?? [],
      complianceClues: parsed.complianceClues ?? [],
      growthSignals: parsed.growthSignals ?? [],
      fitSignals: parsed.fitSignals ?? [],
      triggerSignals: parsed.triggerSignals ?? [],
      whyNowReason: parsed.whyNowReason ?? null,
      patientMgmtSoftware: parsed.patientMgmtSoftware ?? null,
      hasMultiLocation: parsed.hasMultiLocation ?? false,
      recentExpansion: parsed.recentExpansion ?? false,
      likelyManagedInHouse: parsed.likelyManagedInHouse ?? false,
      evidenceSnippets: parsed.evidenceSnippets ?? [],
    };
  } catch (err) {
    console.error("[extract] Haiku extraction failed for", domain, err);
    return null;
  }
}

/**
 * Adjudicate a company extraction with Haiku (fast path).
 * If score is in borderline range and Sonnet is enabled, escalates to Sonnet.
 */
export async function adjudicateCompany(
  extraction: CompanyExtraction,
  preliminaryFitScore: number,
  runId: string,
  sonnetEnabled: boolean = true
): Promise<AdjudicationResult> {
  const prompt = buildAdjudicationPrompt(extraction, preliminaryFitScore);

  // First try Haiku
  try {
    const raw = await callHaiku(prompt);
    await trackModelUsage(runId, "haiku");
    const parsed = parseJsonFromResponse(raw) as Partial<AdjudicationResult>;

    const result: AdjudicationResult = {
      decision: parsed.decision ?? "rejected",
      fitScore: parsed.fitScore ?? preliminaryFitScore,
      confidenceScore: parsed.confidenceScore ?? 0,
      reasonSummary: parsed.reasonSummary ?? "",
      topSupportingEvidence: parsed.topSupportingEvidence ?? [],
      topMissingEvidence: parsed.topMissingEvidence ?? [],
      modelUsed: "haiku",
    };

    // Escalate borderline cases to Sonnet if enabled
    if (result.decision === "borderline" && sonnetEnabled) {
      try {
        const sonnetRaw = await callSonnet(prompt);
        await trackModelUsage(runId, "sonnet");
        const sonnetParsed = parseJsonFromResponse(sonnetRaw) as Partial<AdjudicationResult>;

        return {
          decision: sonnetParsed.decision ?? result.decision,
          fitScore: sonnetParsed.fitScore ?? result.fitScore,
          confidenceScore: sonnetParsed.confidenceScore ?? result.confidenceScore,
          reasonSummary: sonnetParsed.reasonSummary ?? result.reasonSummary,
          topSupportingEvidence: sonnetParsed.topSupportingEvidence ?? result.topSupportingEvidence,
          topMissingEvidence: sonnetParsed.topMissingEvidence ?? result.topMissingEvidence,
          modelUsed: "sonnet",
        };
      } catch (err) {
        console.error("[extract] Sonnet escalation failed, using Haiku result:", err);
        return result;
      }
    }

    return result;
  } catch (err) {
    console.error("[extract] Haiku adjudication failed for", extraction.domain, err);
    // Deterministic fallback
    return {
      decision: "borderline",
      fitScore: preliminaryFitScore,
      confidenceScore: 30,
      reasonSummary: "Automated adjudication failed — needs manual review.",
      topSupportingEvidence: [],
      topMissingEvidence: ["Adjudication failed — review scraped content manually"],
      modelUsed: "deterministic",
    };
  }
}
