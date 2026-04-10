/**
 * Firecrawl wrapper — search for candidate companies and scrape their pages.
 *
 * Search: Given a query string, returns a list of candidate URLs + metadata.
 * Scrape: Given a URL, returns cleaned markdown content for extraction.
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY ?? "",
}) as any;

export interface SearchResult {
  url: string;
  title: string;
  description: string;
  domain: string;
}

export interface ScrapeResult {
  url: string;
  markdown: string;
  success: boolean;
  error?: string;
}

/**
 * Search for dental clinic candidates in a region.
 */
export async function searchCompanyCandidates(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    const response = await firecrawl.search(query, { limit });

    // SDK returns results under `web` or `data` depending on version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = (response as any).web ?? (response as any).data ?? [];
    if (!items.length) return [];

    return items
      .filter((r: any) => r.url)
      .map((r: any) => {
        const rawUrl = r.url ?? "";
        let domain = "";
        try {
          domain = new URL(rawUrl).hostname.replace(/^www\./, "");
        } catch {
          domain = rawUrl;
        }
        // metadata field or top-level title/description
        const title = r.metadata?.title ?? r.title ?? "";
        const description = r.metadata?.description ?? r.description ?? "";
        return { url: rawUrl, title, description, domain };
      });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Re-throw billing/auth errors so the run fails visibly instead of silently
    if (msg.includes("402") || msg.includes("401") || msg.includes("credits") || msg.includes("Insufficient")) {
      throw new Error(`Firecrawl error: ${msg}`);
    }
    console.error("[firecrawl] search error:", msg);
    return [];
  }
}

/**
 * Scrape a single URL and return its markdown content.
 */
export async function scrapePage(url: string): Promise<ScrapeResult> {
  try {
    const response = await firecrawl.scrape(url, {
      formats: ["markdown"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markdown = (response as any).markdown ?? "";
    if (!markdown) {
      return { url, markdown: "", success: false, error: "No markdown returned" };
    }

    return { url, markdown, success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { url, markdown: "", success: false, error: msg };
  }
}

/**
 * Scrape multiple pages concurrently (up to concurrency limit).
 */
export async function scrapeCompanyPages(
  urls: Array<{ url: string; pageType: string }>,
  concurrency: number = 3
): Promise<Array<{ pageType: string; result: ScrapeResult }>> {
  const results: Array<{ pageType: string; result: ScrapeResult }> = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      batch.map(({ url, pageType }) =>
        scrapePage(url).then((result) => ({ pageType, result }))
      )
    );
    for (const s of settled) {
      if (s.status === "fulfilled") results.push(s.value);
    }
  }

  return results;
}

/**
 * Increment scrape counters on a DiscoveryRun.
 */
export async function trackScrapeUsage(
  runId: string,
  pagesScraped: number,
  creditsUsed: number
) {
  await db.discoveryRun.update({
    where: { id: runId },
    data: {
      pagesScraped: { increment: pagesScraped },
      firecrawlCredits: { increment: creditsUsed },
    },
  });
}
