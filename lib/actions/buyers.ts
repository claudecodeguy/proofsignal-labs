"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizeDomain, isValidDomain, normalizeState } from "@/lib/ingestion/normalize";
import { checkBuyerDuplicate } from "@/lib/ingestion/dedup";
import { importBuyersFromCsv } from "@/lib/ingestion/csv-import";
import { createDiscoveryRun } from "@/lib/jobs/discovery";

// ── Manual buyer entry ────────────────────────────────────────────────────────

const ManualBuyerSchema = z.object({
  buyerCompanyName: z.string().min(1, "Company name required"),
  domain: z.string().min(1, "Domain required"),
  city: z.string().optional(),
  state: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactRole: z.string().optional(),
  territoryFocus: z.string().optional(),
  verticalId: z.string().min(1),
});

export async function addBuyerManually(formData: FormData) {
  const parsed = ManualBuyerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;
  const normalized = normalizeDomain(data.domain);

  if (!isValidDomain(normalized)) {
    return { error: `Invalid domain: ${data.domain}` };
  }

  const dedup = await checkBuyerDuplicate(normalized, data.verticalId);
  if (dedup.isDuplicate) {
    return { error: `Buyer domain already exists (stage: ${dedup.existingStatus})` };
  }

  const buyer = await db.buyer.create({
    data: {
      verticalId: data.verticalId,
      buyerCompanyName: data.buyerCompanyName,
      domain: normalized,
      normalizedDomain: normalized,
      buyerCity: data.city || null,
      buyerState: data.state ? normalizeState(data.state) : null,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactRole: data.contactRole || null,
      territoryFocus: data.territoryFocus || null,
      discoverySource: "manual",
      stage: "discovered",
    },
  });

  revalidatePath("/admin/buyers");
  return { success: true, id: buyer.id };
}

// ── CSV import ────────────────────────────────────────────────────────────────

export async function importBuyersCsv(formData: FormData) {
  const file = formData.get("file") as File | null;
  const verticalId = formData.get("verticalId") as string;
  if (!file) return { error: "No file provided" };

  const csvContent = await file.text();
  const result = await importBuyersFromCsv(csvContent, verticalId);
  revalidatePath("/admin/buyers");
  return { success: true, result };
}

// ── Buyer discovery run ───────────────────────────────────────────────────────

export async function startBuyerDiscoveryRun(formData: FormData) {
  const verticalId = formData.get("verticalId") as string;
  const region = formData.get("region") as string;
  const keywords = formData.get("keywords") as string;
  const maxCompanies = parseInt(formData.get("maxCompanies") as string || "10", 10);
  const maxPages = parseInt(formData.get("maxPages") as string || "30", 10);

  if (!region) return { error: "Region required" };

  const kwList = keywords
    ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const runId = await createDiscoveryRun({
    verticalId,
    targetType: "buyer",
    region,
    keywords: kwList,
    maxCompanies,
    maxPages,
  });

  revalidatePath("/admin/buyers");
  return { success: true, runId };
}

// ── Stage update ──────────────────────────────────────────────────────────────

export async function updateBuyerStage(id: string, stage: string) {
  await db.buyer.update({ where: { id }, data: { stage } });
  revalidatePath("/admin/buyers");
  revalidatePath(`/admin/buyers/${id}`);
  return { success: true };
}

// ── Notes update ──────────────────────────────────────────────────────────────

export async function updateBuyerNotes(id: string, notes: string) {
  await db.buyer.update({ where: { id }, data: { notes } });
  revalidatePath(`/admin/buyers/${id}`);
  return { success: true };
}
