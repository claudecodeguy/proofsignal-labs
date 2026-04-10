/**
 * CSV import for company and buyer records.
 * Validates, normalizes, and deduplicates each row.
 * Zero model calls.
 */

import { parse } from "csv-parse/sync";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain, normalizeCompanyName, normalizeState } from "./normalize";
import { checkCompanyDuplicate, checkBuyerDuplicate } from "./dedup";

// ── Schemas ──────────────────────────────────────────────────────────────────

const CompanyRowSchema = z.object({
  company_name: z.string().min(1),
  domain: z.string().min(1),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  source_label: z.string().optional().default("csv_import"),
});

const BuyerRowSchema = z.object({
  company_name: z.string().min(1),
  domain: z.string().min(1),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  contact_name: z.string().optional().default(""),
  contact_email: z.string().optional().default(""),
  territory: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  source_label: z.string().optional().default("csv_import"),
});

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};

// ── Company Import ────────────────────────────────────────────────────────────

export async function importCompaniesFromCsv(
  csvContent: string,
  verticalId: string,
  runId?: string
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  let rows: unknown[];
  try {
    rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    result.errors.push({ row: 0, reason: "Failed to parse CSV" });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-indexed, +1 for header
    const parsed = CompanyRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({ row: rowNum, reason: parsed.error.issues[0].message });
      result.skipped++;
      continue;
    }

    const row = parsed.data;
    const normalized = normalizeDomain(row.domain);

    if (!isValidDomain(normalized)) {
      result.errors.push({ row: rowNum, reason: `Invalid domain: ${row.domain}` });
      result.skipped++;
      continue;
    }

    const dedup = await checkCompanyDuplicate(normalized, verticalId);
    if (dedup.isDuplicate) {
      result.errors.push({ row: rowNum, reason: `Duplicate domain: ${normalized} (existing: ${dedup.existingId})` });
      result.skipped++;
      continue;
    }

    await db.companyRaw.create({
      data: {
        verticalId,
        discoveryRunId: runId ?? null,
        companyName: normalizeCompanyName(row.company_name),
        domain: normalized,
        normalizedDomain: normalized,
        homepageUrl: `https://${normalized}`,
        city: row.city || null,
        state: row.state ? normalizeState(row.state) : null,
        country: "US",
        discoverySource: row.source_label as string,
        validationStatus: "pending",
      },
    });

    result.imported++;
  }

  return result;
}

// ── Buyer Import ──────────────────────────────────────────────────────────────

export async function importBuyersFromCsv(
  csvContent: string,
  verticalId: string
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  let rows: unknown[];
  try {
    rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    result.errors.push({ row: 0, reason: "Failed to parse CSV" });
    return result;
  }

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const parsed = BuyerRowSchema.safeParse(rows[i]);
    if (!parsed.success) {
      result.errors.push({ row: rowNum, reason: parsed.error.issues[0].message });
      result.skipped++;
      continue;
    }

    const row = parsed.data;
    const normalized = normalizeDomain(row.domain);

    if (!isValidDomain(normalized)) {
      result.errors.push({ row: rowNum, reason: `Invalid domain: ${row.domain}` });
      result.skipped++;
      continue;
    }

    const dedup = await checkBuyerDuplicate(normalized, verticalId);
    if (dedup.isDuplicate) {
      result.errors.push({ row: rowNum, reason: `Duplicate buyer domain: ${normalized}` });
      result.skipped++;
      continue;
    }

    await db.buyer.create({
      data: {
        verticalId,
        buyerCompanyName: normalizeCompanyName(row.company_name),
        domain: normalized,
        normalizedDomain: normalized,
        buyerCity: row.city || null,
        buyerState: row.state ? normalizeState(row.state) : null,
        contactName: row.contact_name || null,
        contactEmail: row.contact_email || null,
        territoryFocus: row.territory || null,
        notes: row.notes || null,
        discoverySource: "csv_import",
        stage: "discovered",
      },
    });

    result.imported++;
  }

  return result;
}
