export const dynamic = "force-dynamic";

/**
 * POST /api/discovery/run
 *
 * Starts a discovery pipeline run in the background.
 * Returns the runId immediately; the run updates the DB as it progresses.
 *
 * Body: { runId: string }  (DiscoveryRun must already exist in DB)
 *
 * The UI creates the run record via the server action, then POSTs here to
 * trigger the actual pipeline execution asynchronously.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runDiscoveryPipeline } from "@/lib/pipeline/run";

export async function POST(req: NextRequest) {
  let body: { runId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { runId } = body;
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  // Verify run exists and is in pending state
  const run = await db.discoveryRun.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (run.status !== "pending") {
    return NextResponse.json(
      { error: `Run is already in status: ${run.status}` },
      { status: 409 }
    );
  }

  // Fire-and-forget: start the pipeline without awaiting it.
  // The run updates DB as it progresses; the client polls for status.
  runDiscoveryPipeline(runId).catch((err) => {
    console.error(`[api/discovery/run] Unhandled pipeline error for run ${runId}:`, err);
  });

  return NextResponse.json({ success: true, runId, status: "running" });
}

/**
 * GET /api/discovery/run?runId=xxx
 *
 * Polls the current status of a discovery run.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get("runId");

  if (!runId) {
    return NextResponse.json({ error: "runId query param required" }, { status: 400 });
  }

  const run = await db.discoveryRun.findUnique({ where: { id: runId } });
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json({
    runId: run.id,
    status: run.status,
    candidatesFound: run.candidatesFound,
    approved: run.approved,
    borderline: run.borderline,
    rejected: run.rejected,
    pagesScraped: run.pagesScraped,
    firecrawlCredits: run.firecrawlCredits,
    haikuCalls: run.haikuCalls,
    sonnetCalls: run.sonnetCalls,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    errorMessage: run.errorMessage,
  });
}
