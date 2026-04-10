/**
 * Deduplication logic. All deterministic — zero model calls.
 */

import { db } from "@/lib/db";
import { normalizeDomain } from "./normalize";

export interface DedupResult {
  isDuplicate: boolean;
  existingId?: string;
  existingStatus?: string;
}

/** Check if a domain already exists for a vertical */
export async function checkCompanyDuplicate(
  domain: string,
  verticalId: string
): Promise<DedupResult> {
  const normalized = normalizeDomain(domain);
  const existing = await db.companyRaw.findFirst({
    where: { normalizedDomain: normalized, verticalId },
    select: { id: true, validationStatus: true },
  });
  if (existing) {
    return { isDuplicate: true, existingId: existing.id, existingStatus: existing.validationStatus };
  }
  return { isDuplicate: false };
}

/** Check if a buyer domain already exists for a vertical */
export async function checkBuyerDuplicate(
  domain: string,
  verticalId: string
): Promise<DedupResult> {
  const normalized = normalizeDomain(domain);
  const existing = await db.buyer.findFirst({
    where: { normalizedDomain: normalized, verticalId },
    select: { id: true, stage: true },
  });
  if (existing) {
    return { isDuplicate: true, existingId: existing.id, existingStatus: existing.stage };
  }
  return { isDuplicate: false };
}

/** Check exclusivity conflict before export or outreach attachment */
export async function checkExclusivityConflict(
  leadId: string,
  territory: string,
  nicheKey: string
): Promise<{ hasConflict: boolean; lock?: { buyerCompanyName: string; expiresAt: Date } }> {
  const lock = await db.exclusivityLock.findFirst({
    where: {
      leadId,
      territory,
      nicheKey,
      active: true,
      expiresAt: { gt: new Date() },
    },
    select: { buyerCompanyName: true, expiresAt: true },
  });
  if (lock) return { hasConflict: true, lock };
  return { hasConflict: false };
}

/** Check if an email is suppressed */
export async function isEmailSuppressed(email: string): Promise<boolean> {
  const record = await db.suppressionRecord.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!record;
}
