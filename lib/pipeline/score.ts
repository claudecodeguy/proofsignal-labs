/**
 * Deterministic scoring for dental clinic candidates.
 *
 * Scores are computed from extracted signals BEFORE Claude adjudication.
 * This gives the adjudication prompt a calibrated starting point and
 * lets us gate Sonnet usage to genuinely borderline cases.
 *
 * All logic here is deterministic — zero model calls.
 */

import type { CompanyExtraction } from "./extract";

// ── Weights ────────────────────────────────────────────────────────────────────

const WEIGHTS = {
  // Vertical match (is it actually a dental clinic?)
  isDentalClinic: 25,
  multiLocation: 20,
  techClues: 15,         // per signal, up to cap
  complianceClues: 10,   // per signal, up to cap
  growthSignals: 10,     // per signal, up to cap
  fitSignals: 10,        // per signal, up to cap
  triggerSignals: 5,     // per signal, up to cap
  whyNow: 5,
} as const;

const CAPS = {
  techClues: 15,
  complianceClues: 10,
  growthSignals: 10,
  fitSignals: 10,
  triggerSignals: 5,
} as const;

// Per-signal values (diminishing returns)
function signalScore(signals: string[], perSignal: number, cap: number): number {
  return Math.min(signals.length * perSignal, cap);
}

/**
 * Compute a preliminary fit score (0-100) from extraction data.
 * Called before model adjudication to set the baseline.
 */
export function computeFitScore(extraction: CompanyExtraction): number {
  let score = 0;

  // Core vertical match
  if (extraction.isDentalClinic) {
    score += WEIGHTS.isDentalClinic;
  } else {
    // Not a dental clinic — hard penalty
    return Math.min(score + 5, 20);
  }

  // Multi-location bonus
  if (extraction.hasMultiLocation) {
    score += WEIGHTS.multiLocation;
  } else if ((extraction.locationCountEstimate ?? 0) > 1) {
    score += WEIGHTS.multiLocation;
  } else if ((extraction.locationCountEstimate ?? 0) === 1) {
    score += 5; // single location gets a small score
  }

  // Signal contributions
  score += signalScore(extraction.technologyClues, 5, CAPS.techClues);
  score += signalScore(extraction.complianceClues, 3, CAPS.complianceClues);
  score += signalScore(extraction.growthSignals, 4, CAPS.growthSignals);
  score += signalScore(extraction.fitSignals, 3, CAPS.fitSignals);
  score += signalScore(extraction.triggerSignals, 2, CAPS.triggerSignals);

  // Why-now bonus
  if (extraction.whyNowReason) score += WEIGHTS.whyNow;

  // Penalty: likely in-house IT (they may not need an MSP)
  if (extraction.likelyManagedInHouse) score -= 10;

  // Bonus: known patient mgmt software (signals professional operation)
  if (extraction.patientMgmtSoftware) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Compute a confidence score (0-100) — how sure are we about our assessment?
 * Based on volume of evidence found, not signal quality.
 */
export function computeConfidenceScore(extraction: CompanyExtraction): number {
  let score = 0;

  // Evidence volume
  const evidenceCount = extraction.evidenceSnippets.length;
  score += Math.min(evidenceCount * 5, 30);

  // Contact completeness
  if (extraction.contactName) score += 10;
  if (extraction.contactEmail) score += 15;
  if (extraction.contactRole) score += 10;

  // Location clarity
  if (extraction.city && extraction.state) score += 10;
  if (extraction.locationCountConfidence === "high") score += 10;
  if (extraction.locationCountConfidence === "medium") score += 5;

  // Vertical confidence propagation
  score += Math.round(extraction.verticalMatchConfidence * 0.15);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Fast deterministic classification (no model).
 * Used as fallback or pre-filter before model adjudication.
 */
export function deterministicClassify(
  fitScore: number,
  confidenceScore: number,
  isDentalClinic: boolean
): "approved" | "borderline" | "rejected" {
  if (!isDentalClinic) return "rejected";
  if (fitScore >= 65 && confidenceScore >= 60) return "approved";
  if (fitScore < 25 || confidenceScore < 20) return "rejected";
  return "borderline";
}

/**
 * Build the verticalPayload JSON blob for dental_msp_us.
 * Stored in companyRaw.verticalPayload for vertical-specific UI.
 */
export function buildDentalPayload(extraction: CompanyExtraction): string {
  return JSON.stringify({
    patientMgmtSoftware: extraction.patientMgmtSoftware,
    hasMultiLocation: extraction.hasMultiLocation,
    recentExpansion: extraction.recentExpansion,
    likelyManagedInHouse: extraction.likelyManagedInHouse,
    locationCountEstimate: extraction.locationCountEstimate,
    locationCountConfidence: extraction.locationCountConfidence,
  });
}
