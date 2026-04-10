"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain, normalizeState, domainToHomepageUrl } from "@/lib/ingestion/normalize";
import { checkCompanyDuplicate } from "@/lib/ingestion/dedup";
import { importCompaniesFromCsv } from "@/lib/ingestion/csv-import";
import { createDiscoveryRun } from "@/lib/jobs/discovery";

// ── Manual company entry ──────────────────────────────────────────────────────

const ManualCompanySchema = z.object({
  companyName: z.string().min(1, "Company name required"),
  domain: z.string().min(1, "Domain required"),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  verticalId: z.string().min(1),
});

export async function addCompanyManually(formData: FormData) {
  const parsed = ManualCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { companyName, domain, city, state, verticalId } = parsed.data;
  const normalized = normalizeDomain(domain);

  if (!isValidDomain(normalized)) {
    return { error: `Invalid domain: ${domain}` };
  }

  const dedup = await checkCompanyDuplicate(normalized, verticalId);
  if (dedup.isDuplicate) {
    return { error: `Domain already exists (${dedup.existingStatus})` };
  }

  const company = await db.companyRaw.create({
    data: {
      verticalId,
      companyName,
      domain: normalized,
      normalizedDomain: normalized,
      homepageUrl: domainToHomepageUrl(normalized),
      city: city || null,
      state: state ? normalizeState(state) : null,
      country: "US",
      discoverySource: "manual",
      validationStatus: "pending",
    },
  });

  revalidatePath("/admin/companies");
  return { success: true, id: company.id };
}

// ── CSV import ────────────────────────────────────────────────────────────────

export async function importCompaniesCsv(formData: FormData) {
  const file = formData.get("file") as File | null;
  const verticalId = formData.get("verticalId") as string;

  if (!file) return { error: "No file provided" };
  if (!verticalId) return { error: "No vertical specified" };

  const csvContent = await file.text();
  const result = await importCompaniesFromCsv(csvContent, verticalId);

  revalidatePath("/admin/companies");
  return { success: true, result };
}

// ── Discovery run ─────────────────────────────────────────────────────────────

const DiscoveryRunSchema = z.object({
  verticalId: z.string().min(1),
  region: z.string().min(1, "Region required"),
  regionState: z.string().optional(),
  keywords: z.string().min(1, "At least one keyword required"),
  maxCompanies: z.coerce.number().int().positive().default(500),
  maxPages: z.coerce.number().int().positive().default(2000),
});

export async function startDiscoveryRun(formData: FormData) {
  const parsed = DiscoveryRunSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { verticalId, region, regionState, keywords, maxCompanies, maxPages } = parsed.data;
  const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);

  const runId = await createDiscoveryRun({
    verticalId,
    targetType: "company",
    region,
    regionState: regionState || undefined,
    keywords: keywordList,
    maxCompanies,
    maxPages,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/companies");
  return { success: true, runId };
}

// ── Status override ───────────────────────────────────────────────────────────

export async function overrideCompanyStatus(id: string, status: "approved" | "rejected") {
  await db.companyRaw.update({
    where: { id },
    data: { validationStatus: status },
  });
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${id}`);
  return { success: true };
}
