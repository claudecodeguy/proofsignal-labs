/**
 * Discovery job scaffold.
 *
 * Phase 1B: Creates and manages DiscoveryRun records in the DB.
 * Phase 1C: Will add Firecrawl search/scrape calls here.
 *
 * Zero model calls in Phase 1B.
 */

import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain, normalizeState, domainToHomepageUrl } from "@/lib/ingestion/normalize";
import { checkCompanyDuplicate, checkBuyerDuplicate } from "@/lib/ingestion/dedup";

export interface DiscoveryJobInput {
  verticalId: string;
  targetType: "company" | "buyer";
  region: string;
  regionState?: string;
  regionCity?: string;
  keywords: string[];
  maxCompanies?: number;
  maxPages?: number;
  maxHaikuCalls?: number;
  maxSonnetCalls?: number;
  sonnetEnabled?: boolean;
}

/** Create a new discovery run record and return its ID. */
export async function createDiscoveryRun(input: DiscoveryJobInput): Promise<string> {
  const run = await db.discoveryRun.create({
    data: {
      verticalId: input.verticalId,
      targetType: input.targetType,
      region: input.region,
      regionState: input.regionState ?? null,
      regionCity: input.regionCity ?? null,
      keywords: input.keywords,
      status: "pending",
      maxCompanies: input.maxCompanies ?? 500,
      maxPages: input.maxPages ?? 2000,
      maxHaikuCalls: input.maxHaikuCalls ?? 2000,
      maxSonnetCalls: input.maxSonnetCalls ?? 100,
      sonnetEnabled: input.sonnetEnabled ?? true,
    },
  });
  return run.id;
}

/** Mark a run as started */
export async function startRun(runId: string) {
  await db.discoveryRun.update({
    where: { id: runId },
    data: { status: "running", startedAt: new Date() },
  });
}

/** Mark a run as completed with final counts */
export async function completeRun(
  runId: string,
  counts: {
    candidatesFound: number;
    approved: number;
    borderline: number;
    rejected: number;
    pagesScraped: number;
    firecrawlCredits: number;
    haikuCalls: number;
    sonnetCalls: number;
  }
) {
  await db.discoveryRun.update({
    where: { id: runId },
    data: { status: "completed", completedAt: new Date(), ...counts },
  });
}

/** Mark a run as failed */
export async function failRun(runId: string, errorMessage: string) {
  await db.discoveryRun.update({
    where: { id: runId },
    data: { status: "failed", completedAt: new Date(), errorMessage },
  });
}

/**
 * Ingest a single raw company candidate from discovery output.
 * Handles normalization and dedup. Returns null if duplicate or invalid.
 *
 * Phase 1C: This will be called after Firecrawl returns page data.
 * Phase 1B: Called directly with manually provided data (testing/CSV).
 */
export async function ingestCompanyCandidate(
  runId: string,
  verticalId: string,
  data: {
    companyName: string;
    domain: string;
    city?: string;
    state?: string;
    discoverySource?: string;
    sourceUrls?: string[];
    notes?: string;
  }
): Promise<{ id: string; isDuplicate: boolean } | null> {
  const normalized = normalizeDomain(data.domain);

  if (!isValidDomain(normalized)) return null;

  const dedup = await checkCompanyDuplicate(normalized, verticalId);
  if (dedup.isDuplicate) return { id: dedup.existingId!, isDuplicate: true };

  const company = await db.companyRaw.create({
    data: {
      verticalId,
      discoveryRunId: runId,
      companyName: data.companyName,
      domain: normalized,
      normalizedDomain: normalized,
      homepageUrl: domainToHomepageUrl(normalized),
      city: data.city ?? null,
      state: data.state ? normalizeState(data.state) : null,
      country: "US",
      discoverySource: data.discoverySource ?? "search",
      sourceUrls: data.sourceUrls ?? [],
      validationStatus: "pending",
    },
  });

  // Increment run candidate count
  await db.discoveryRun.update({
    where: { id: runId },
    data: { candidatesFound: { increment: 1 } },
  });

  return { id: company.id, isDuplicate: false };
}

/** Ingest a single raw buyer candidate */
export async function ingestBuyerCandidate(
  verticalId: string,
  data: {
    buyerCompanyName: string;
    domain: string;
    city?: string;
    state?: string;
    contactName?: string;
    contactEmail?: string;
    territoryFocus?: string;
    discoverySource?: string;
    sourceUrls?: string[];
  }
): Promise<{ id: string; isDuplicate: boolean } | null> {
  const normalized = normalizeDomain(data.domain);
  if (!isValidDomain(normalized)) return null;

  const dedup = await checkBuyerDuplicate(normalized, verticalId);
  if (dedup.isDuplicate) return { id: dedup.existingId!, isDuplicate: true };

  const buyer = await db.buyer.create({
    data: {
      verticalId,
      buyerCompanyName: data.buyerCompanyName,
      domain: normalized,
      normalizedDomain: normalized,
      buyerCity: data.city ?? null,
      buyerState: data.state ? normalizeState(data.state) : null,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail ?? null,
      territoryFocus: data.territoryFocus ?? null,
      discoverySource: data.discoverySource ?? "search",
      sourceUrls: data.sourceUrls ?? [],
      stage: "discovered",
    },
  });

  return { id: buyer.id, isDuplicate: false };
}
