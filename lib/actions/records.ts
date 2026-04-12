"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

// ── Update Buyer ───────────────────────────────────────────────────────────────

export async function updateBuyer(id: string, formData: FormData) {
  const data = {
    buyerCompanyName: (formData.get("buyerCompanyName") as string)?.trim() || undefined,
    domain:           (formData.get("domain") as string)?.trim() || undefined,
    buyerCity:        (formData.get("buyerCity") as string)?.trim() || null,
    buyerState:       (formData.get("buyerState") as string)?.trim() || null,
    territoryFocus:   (formData.get("territoryFocus") as string)?.trim() || null,
    contactName:      (formData.get("contactName") as string)?.trim() || null,
    contactRole:      (formData.get("contactRole") as string)?.trim() || null,
    contactEmail:     (formData.get("contactEmail") as string)?.trim() || null,
    contactPhone:     (formData.get("contactPhone") as string)?.trim() || null,
    stage:            (formData.get("stage") as string)?.trim() || undefined,
    notes:            (formData.get("notes") as string)?.trim() || null,
    buyerServices:    (formData.get("buyerServices") as string)?.trim() || null,
  };

  // Remove undefined keys so Prisma doesn't overwrite with undefined
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  await db.buyer.update({ where: { id }, data: clean });
  revalidatePath(`/admin/buyers/${id}`);
  revalidatePath("/admin/buyers");
  return { success: true };
}

// ── Update Company ─────────────────────────────────────────────────────────────

export async function updateCompany(id: string, formData: FormData) {
  const data = {
    companyName:           (formData.get("companyName") as string)?.trim() || undefined,
    city:                  (formData.get("city") as string)?.trim() || null,
    state:                 (formData.get("state") as string)?.trim() || null,
    contactName:           (formData.get("contactName") as string)?.trim() || null,
    contactRole:           (formData.get("contactRole") as string)?.trim() || null,
    contactEmail:          (formData.get("contactEmail") as string)?.trim() || null,
    contactPhone:          (formData.get("contactPhone") as string)?.trim() || null,
    whyNowReason:          (formData.get("whyNowReason") as string)?.trim() || null,
    validationStatus:      (formData.get("validationStatus") as string)?.trim() || undefined,
    locationCountEstimate: formData.get("locationCountEstimate")
      ? parseInt(formData.get("locationCountEstimate") as string, 10) || null
      : undefined,
  };

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  await db.companyRaw.update({ where: { id }, data: clean });
  revalidatePath(`/admin/companies/${id}`);
  revalidatePath("/admin/companies");
  return { success: true };
}

// ── Update Lead ────────────────────────────────────────────────────────────────

export async function updateLead(id: string, formData: FormData) {
  const data = {
    companyName:   (formData.get("companyName") as string)?.trim() || undefined,
    city:          (formData.get("city") as string)?.trim() || null,
    state:         (formData.get("state") as string)?.trim() || null,
    contactName:   (formData.get("contactName") as string)?.trim() || null,
    contactRole:   (formData.get("contactRole") as string)?.trim() || null,
    contactEmail:  (formData.get("contactEmail") as string)?.trim() || null,
    whyNowReason:  (formData.get("whyNowReason") as string)?.trim() || null,
    status:        (formData.get("status") as string)?.trim() || undefined,
  };

  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  await db.lead.update({ where: { id }, data: clean });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  return { success: true };
}
