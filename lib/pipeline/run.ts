/**
 * Discovery pipeline orchestrator.
 *
 * Given a DiscoveryRun ID, this module:
 * 1. Loads run config + vertical config from DB
 * 2. Generates search queries for the region × keyword matrix
 * 3. For each candidate URL:
 *    a. Dedup check
 *    b. Scrape pages via Firecrawl
 *    c. Extract signals via Claude Haiku
 *    d. Score deterministically
 *    e. Adjudicate via Claude (Haiku → Sonnet escalation for borderline)
 *    f. Save company + evidence + validation log to DB
 * 4. Marks run as completed (or failed on error)
 *
 * Designed to run as a fire-and-forget background process from the API route.
 * Progress is visible by reading the DiscoveryRun record from the DB.
 */

import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain, normalizeState, domainToHomepageUrl, buildPageUrls } from "@/lib/ingestion/normalize";
import { checkCompanyDuplicate, checkBuyerDuplicate } from "@/lib/ingestion/dedup";
import { searchCompanyCandidates, scrapeCompanyPages, trackScrapeUsage } from "./firecrawl";
import { extractCompanyData, adjudicateCompany } from "./extract";
import { extractBuyerData } from "./extract-buyer";
import { computeFitScore, computeConfidenceScore, deterministicClassify, buildDentalPayload } from "./score";
import { startRun, completeRun, failRun } from "@/lib/jobs/discovery";

// ── Constants ──────────────────────────────────────────────────────────────────

const PAGE_TARGETS = ["homepage", "about", "contact", "locations"] as const;

// How many candidates to process per search query result
const CANDIDATES_PER_QUERY = 10;

// Pause between candidates (ms) to avoid rate limits
const CANDIDATE_DELAY_MS = 500;

// ── Helpers ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildBuyerSearchQueries(region: string, keywords: string[], maxBuyers: number): string[] {
  const defaultKeywords = [
    "dental MSP managed services",
    "dental IT support provider",
    "dental MSSP cybersecurity",
    "healthcare IT managed services dental",
    "dental practice IT support",
  ];

  const kwList = keywords.length > 0 ? keywords : defaultKeywords;
  const queriesNeeded = Math.max(1, Math.ceil(maxBuyers / CANDIDATES_PER_QUERY));
  return kwList.slice(0, queriesNeeded).map((kw) => `${kw} ${region}`);
}

function buildSearchQueries(region: string, keywords: string[], maxCompanies: number): string[] {
  const defaultKeywords = [
    "dental clinic",
    "dental group",
    "dental practice",
    "family dentistry",
    "dental associates",
  ];

  const kwList = keywords.length > 0 ? keywords : defaultKeywords;

  // Each search returns ~10 results. Limit number of queries to avoid
  // wasting credits — only run as many queries as needed to fill the budget.
  const queriesNeeded = Math.max(1, Math.ceil(maxCompanies / CANDIDATES_PER_QUERY));
  return kwList.slice(0, queriesNeeded).map((kw) => `${kw} ${region}`);
}

// ── Buyer pipeline ─────────────────────────────────────────────────────────────

async function runBuyerPipeline(runId: string, run: { verticalId: string; region: string; keywords: string[]; maxCompanies: number; maxPages: number }): Promise<void> {
  const queries = buildBuyerSearchQueries(run.region, run.keywords, run.maxCompanies);
  const seenDomains = new Set<string>();

  for (const query of queries) {
    const currentRun = await db.discoveryRun.findUnique({ where: { id: runId } });
    if (!currentRun || currentRun.status === "cancelled") break;
    if (currentRun.candidatesFound >= currentRun.maxCompanies) break;
    if (currentRun.pagesScraped >= currentRun.maxPages) break;

    console.log(`[pipeline/buyer] Searching: "${query}"`);
    const searchResults = await searchCompanyCandidates(query, CANDIDATES_PER_QUERY);

    for (const candidate of searchResults) {
      const currentRun2 = await db.discoveryRun.findUnique({ where: { id: runId } });
      if (!currentRun2 || currentRun2.candidatesFound >= currentRun2.maxCompanies) break;

      const normalized = normalizeDomain(candidate.domain);
      if (!isValidDomain(normalized)) continue;
      if (seenDomains.has(normalized)) continue;
      seenDomains.add(normalized);

      // Dedup check
      const dedup = await checkBuyerDuplicate(normalized, run.verticalId);
      if (dedup.isDuplicate) {
        console.log(`[pipeline/buyer] Skipping duplicate buyer: ${normalized}`);
        continue;
      }

      // Scrape homepage + about + services + contact (contact page has emails/phone)
      const pageUrlList = buildPageUrls(normalized, ["homepage", "about", "services", "contact"]);
      const scrapeResults = await scrapeCompanyPages(pageUrlList, 4);
      await trackScrapeUsage(runId, pageUrlList.length, pageUrlList.length);

      const pageContents = scrapeResults
        .filter((r) => r.result.success && r.result.markdown.length > 100)
        .map((r) => ({ pageType: r.pageType, url: r.result.url, markdown: r.result.markdown }));

      if (pageContents.length === 0) {
        await sleep(CANDIDATE_DELAY_MS);
        continue;
      }

      // Extract buyer data
      const extraction = await extractBuyerData(normalized, pageContents, runId);
      if (!extraction) {
        await sleep(CANDIDATE_DELAY_MS);
        continue;
      }

      // Skip if clearly not an MSP (very low fit score)
      if (extraction.buyerFitScore < 30) {
        console.log(`[pipeline/buyer] Skipping low-fit buyer: ${normalized} (score: ${extraction.buyerFitScore})`);
        await sleep(CANDIDATE_DELAY_MS);
        continue;
      }

      const state = extraction.state ? normalizeState(extraction.state) : null;

      // Save buyer
      const buyer = await db.buyer.create({
        data: {
          verticalId: run.verticalId,
          buyerCompanyName: extraction.buyerCompanyName,
          domain: normalized,
          normalizedDomain: normalized,
          buyerCity: extraction.city,
          buyerState: state,
          buyerCountry: "US",
          servesActiveVertical: extraction.servesDentalClients,
          buyerNicheConfidence: extraction.buyerNicheConfidence,
          buyerServices: extraction.buyerServices,
          territoryFocus: extraction.territoryFocus,
          buyerFitScore: extraction.buyerFitScore,
          contactName: extraction.contactName,
          contactRole: extraction.contactRole,
          contactEmail: extraction.contactEmail,
          contactPhone: extraction.contactPhone,
          discoverySource: "search",
          sourceUrls: [candidate.url],
          stage: "discovered",
        },
      });

      // Save evidence
      if (extraction.evidenceSnippets.length > 0) {
        await db.evidenceItem.createMany({
          data: extraction.evidenceSnippets.map((e) => ({
            buyerId: buyer.id,
            fieldName: e.fieldName,
            evidenceText: e.evidenceText,
            sourceUrl: e.sourceUrl,
            pageTitle: null,
            sourceType: e.pageType,
            confidence: e.confidence,
          })),
        });
      }

      await db.discoveryRun.update({
        where: { id: runId },
        data: {
          candidatesFound: { increment: 1 },
          approved: { increment: 1 }, // buyers don't have approve/reject — count as found
        },
      });

      console.log(`[pipeline/buyer] Saved buyer: ${extraction.buyerCompanyName} (${normalized}) score=${extraction.buyerFitScore}`);
      await sleep(CANDIDATE_DELAY_MS);
    }
  }
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

export async function runDiscoveryPipeline(runId: string): Promise<void> {
  let run;

  try {
    run = await db.discoveryRun.findUniqueOrThrow({ where: { id: runId } });
  } catch {
    console.error(`[pipeline] Run ${runId} not found`);
    return;
  }

  await startRun(runId);

  const counts = {
    candidatesFound: 0,
    approved: 0,
    borderline: 0,
    rejected: 0,
    pagesScraped: 0,
    firecrawlCredits: 0,
    haikuCalls: 0,
    sonnetCalls: 0,
  };

  try {
    // Branch on targetType
    if (run.targetType === "buyer") {
      await runBuyerPipeline(runId, run);
      const finalRun = await db.discoveryRun.findUnique({ where: { id: runId } });
      await completeRun(runId, {
        candidatesFound: finalRun?.candidatesFound ?? 0,
        approved: finalRun?.approved ?? 0,
        borderline: 0,
        rejected: 0,
        pagesScraped: finalRun?.pagesScraped ?? 0,
        firecrawlCredits: finalRun?.firecrawlCredits ?? 0,
        haikuCalls: finalRun?.haikuCalls ?? 0,
        sonnetCalls: finalRun?.sonnetCalls ?? 0,
      });
      console.log(`[pipeline] Buyer run ${runId} completed.`);
      return;
    }

    const queries = buildSearchQueries(run.region, run.keywords, run.maxCompanies);
    const seenDomains = new Set<string>();

    for (const query of queries) {
      // Check budget
      const currentRun = await db.discoveryRun.findUnique({ where: { id: runId } });
      if (!currentRun || currentRun.status === "cancelled") {
        console.log(`[pipeline] Run ${runId} cancelled`);
        break;
      }
      if (currentRun.candidatesFound >= currentRun.maxCompanies) {
        console.log(`[pipeline] Run ${runId} hit maxCompanies limit`);
        break;
      }
      if (currentRun.pagesScraped >= currentRun.maxPages) {
        console.log(`[pipeline] Run ${runId} hit maxPages limit`);
        break;
      }

      console.log(`[pipeline] Searching: "${query}"`);
      const searchResults = await searchCompanyCandidates(query, CANDIDATES_PER_QUERY);

      for (const candidate of searchResults) {
        // Budget check
        if (counts.candidatesFound >= run.maxCompanies) break;
        if (counts.pagesScraped >= run.maxPages) break;

        const normalized = normalizeDomain(candidate.domain);
        if (!isValidDomain(normalized)) continue;
        if (seenDomains.has(normalized)) continue;
        seenDomains.add(normalized);

        // DB dedup
        const dedup = await checkCompanyDuplicate(normalized, run.verticalId);
        if (dedup.isDuplicate) {
          console.log(`[pipeline] Skipping duplicate: ${normalized}`);
          continue;
        }

        counts.candidatesFound++;

        // Build page URLs to scrape
        const pageUrlList = buildPageUrls(normalized, [...PAGE_TARGETS]);
        const pageCount = pageUrlList.length;

        // Scrape pages
        const scrapeResults = await scrapeCompanyPages(pageUrlList, 3);
        counts.pagesScraped += pageCount;
        counts.firecrawlCredits += pageCount; // 1 credit per page (approximate)

        // Track scrape usage in DB
        await trackScrapeUsage(runId, pageCount, pageCount);

        // Build content for extraction
        const pageContents = scrapeResults
          .filter((r) => r.result.success && r.result.markdown.length > 100)
          .map((r) => ({
            pageType: r.pageType,
            url: r.result.url,
            markdown: r.result.markdown,
          }));

        if (pageContents.length === 0) {
          // No usable content — save as pending with minimal data
          await db.companyRaw.create({
            data: {
              verticalId: run.verticalId,
              discoveryRunId: runId,
              companyName: candidate.title || normalized,
              domain: normalized,
              normalizedDomain: normalized,
              homepageUrl: domainToHomepageUrl(normalized),
              validationStatus: "pending",
              discoverySource: "search",
              sourceUrls: [candidate.url],
            },
          });
          await db.discoveryRun.update({
            where: { id: runId },
            data: { candidatesFound: { increment: 1 } },
          });
          await sleep(CANDIDATE_DELAY_MS);
          continue;
        }

        // Extract structured data
        const extraction = await extractCompanyData(
          candidate.title || normalized,
          normalized,
          pageContents,
          runId
        );

        if (!extraction) {
          await sleep(CANDIDATE_DELAY_MS);
          continue;
        }

        // Score
        const fitScore = computeFitScore(extraction);
        const confidenceScore = computeConfidenceScore(extraction);

        // Quick reject before Sonnet (save credits)
        const quickDecision = deterministicClassify(fitScore, confidenceScore, extraction.isDentalClinic);
        if (quickDecision === "rejected" && fitScore < 15) {
          // Hard reject — skip model adjudication entirely
          const state = extraction.state ? normalizeState(extraction.state) : null;
          await db.companyRaw.create({
            data: {
              verticalId: run.verticalId,
              discoveryRunId: runId,
              companyName: extraction.companyName,
              domain: normalized,
              normalizedDomain: normalized,
              homepageUrl: domainToHomepageUrl(normalized),
              city: extraction.city,
              state,
              validationStatus: "rejected",
              rejectionReason: "Auto-rejected: score below threshold",
              fitScore,
              confidenceScore,
              discoverySource: "search",
              sourceUrls: [candidate.url],
              verticalPayload: buildDentalPayload(extraction),
            },
          });
          counts.rejected++;
          await db.discoveryRun.update({
            where: { id: runId },
            data: {
              candidatesFound: { increment: 1 },
              rejected: { increment: 1 },
            },
          });
          await sleep(CANDIDATE_DELAY_MS);
          continue;
        }

        // Model adjudication
        const adjudication = await adjudicateCompany(
          extraction,
          fitScore,
          runId,
          run.sonnetEnabled
        );

        const finalStatus = adjudication.decision;
        const state = extraction.state ? normalizeState(extraction.state) : null;

        // Save company to DB
        const company = await db.companyRaw.create({
          data: {
            verticalId: run.verticalId,
            discoveryRunId: runId,
            companyName: extraction.companyName,
            domain: normalized,
            normalizedDomain: normalized,
            homepageUrl: domainToHomepageUrl(normalized),
            city: extraction.city,
            state,
            country: "US",
            matchesActiveVertical: extraction.isDentalClinic,
            verticalMatchConfidence: extraction.verticalMatchConfidence,
            locationCountEstimate: extraction.locationCountEstimate,
            locationCountConfidence: extraction.locationCountConfidence ?? null,
            contactName: extraction.contactName,
            contactRole: extraction.contactRole,
            contactEmail: extraction.contactEmail,
            contactPhone: extraction.contactPhone,
            technologyClues: extraction.technologyClues,
            complianceClues: extraction.complianceClues,
            growthSignals: extraction.growthSignals,
            fitSignals: extraction.fitSignals,
            triggerSignals: extraction.triggerSignals,
            whyNowReason: extraction.whyNowReason,
            fitScore: adjudication.fitScore,
            confidenceScore: adjudication.confidenceScore,
            validationStatus: finalStatus,
            rejectionReason: finalStatus === "rejected" ? adjudication.reasonSummary : null,
            discoverySource: "search",
            sourceUrls: [candidate.url],
            verticalPayload: buildDentalPayload(extraction),
          },
        });

        // Save evidence items
        if (extraction.evidenceSnippets.length > 0) {
          await db.evidenceItem.createMany({
            data: extraction.evidenceSnippets.map((e) => ({
              companyId: company.id,
              fieldName: e.fieldName,
              evidenceText: e.evidenceText,
              sourceUrl: e.sourceUrl,
              pageTitle: null,
              sourceType: e.pageType,
              confidence: e.confidence,
            })),
          });
        }

        // Save validation log
        await db.validationLog.create({
          data: {
            companyId: company.id,
            decision: finalStatus,
            reasonSummary: adjudication.reasonSummary,
            topSupportingEvidence: adjudication.topSupportingEvidence,
            topMissingEvidence: adjudication.topMissingEvidence,
            modelUsed: adjudication.modelUsed,
            rawModelOutput: null,
          },
        });

        // If approved, promote to Lead
        if (finalStatus === "approved") {
          await db.lead.create({
            data: {
              companyId: company.id,
              status: "approved",
              fitScore: adjudication.fitScore,
              confidenceScore: adjudication.confidenceScore,
              validationSummary: adjudication.reasonSummary,
              companyName: extraction.companyName,
              domain: normalized,
              city: extraction.city,
              state,
              contactName: extraction.contactName,
              contactRole: extraction.contactRole,
              contactEmail: extraction.contactEmail,
              whyNowReason: extraction.whyNowReason,
            },
          });
          counts.approved++;
        } else if (finalStatus === "borderline") {
          counts.borderline++;
        } else {
          counts.rejected++;
        }

        // Update run counters
        const counterUpdate: Record<string, unknown> = {
          candidatesFound: { increment: 1 },
        };
        if (finalStatus === "approved") counterUpdate.approved = { increment: 1 };
        if (finalStatus === "borderline") counterUpdate.borderline = { increment: 1 };
        if (finalStatus === "rejected") counterUpdate.rejected = { increment: 1 };

        await db.discoveryRun.update({ where: { id: runId }, data: counterUpdate });

        await sleep(CANDIDATE_DELAY_MS);
      }
    }

    // Read final counters from DB (more accurate than local tracking)
    const finalRun = await db.discoveryRun.findUnique({ where: { id: runId } });
    await completeRun(runId, {
      candidatesFound: finalRun?.candidatesFound ?? counts.candidatesFound,
      approved: finalRun?.approved ?? counts.approved,
      borderline: finalRun?.borderline ?? counts.borderline,
      rejected: finalRun?.rejected ?? counts.rejected,
      pagesScraped: finalRun?.pagesScraped ?? counts.pagesScraped,
      firecrawlCredits: finalRun?.firecrawlCredits ?? counts.firecrawlCredits,
      haikuCalls: finalRun?.haikuCalls ?? counts.haikuCalls,
      sonnetCalls: finalRun?.sonnetCalls ?? counts.sonnetCalls,
    });

    console.log(`[pipeline] Run ${runId} completed.`, counts);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] Run ${runId} failed:`, msg);
    await failRun(runId, msg);
  }
}
