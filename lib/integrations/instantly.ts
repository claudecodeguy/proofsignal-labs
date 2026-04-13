/**
 * Instantly.ai API v2 integration.
 *
 * Strategy: one campaign per territory (e.g. "PSL - Texas", "PSL - DFW").
 * Claude generates the first email; body + subject are passed as lead variables
 * so the campaign template substitutes them in at send time.
 *
 * Required Instantly setup (one-time, done in the Instantly dashboard):
 *   - Add mike@proofsignallabs.com as a sending account
 *   - Campaign email template subject:  {{email_subject}}
 *   - Campaign email template body:     {{email_body}}
 */

const BASE_URL = "https://api.instantly.ai/api/v2";

function headers(): HeadersInit {
  const key = process.env.INSTANTLY_API_KEY ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Instantly API ${res.status} at ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface InstantlyCampaign {
  id: string;
  name: string;
  status: number; // 1=active, 2=paused, 3=completed
}

interface InstantlyLeadResponse {
  id: string;
  email: string;
  campaign_id: string;
  status: number;
}

// ── Campaign helpers ───────────────────────────────────────────────────────────

/**
 * Returns the campaign ID for a territory.
 *
 * Resolution order:
 *   1. INSTANTLY_CAMPAIGN_ID env var — hardcoded override, always wins
 *   2. Exact name match: "PSL - <territory>"
 *   3. Any active campaign whose name starts with "PSL -"
 *   4. Any active campaign (first in list)
 *   Never creates a new campaign — avoids accidental draft creation.
 */
export async function getOrCreateCampaign(territory: string): Promise<string> {
  // Hardcoded override — safest, no name-matching needed
  const envId = process.env.INSTANTLY_CAMPAIGN_ID?.trim();
  if (envId) return envId;

  const campaignName = `PSL - ${territory}`;

  // List existing campaigns — handle both array and {data:[]} response shapes
  const raw = await apiFetch<InstantlyCampaign[] | { data: InstantlyCampaign[] }>(
    "/campaigns?limit=100&skip=0"
  );
  const all: InstantlyCampaign[] = Array.isArray(raw) ? raw : (raw.data ?? []);

  console.log(`[instantly] ${all.length} campaigns found:`, all.map((c) => `${c.name} (${c.id}, status=${c.status})`));

  // Only consider active campaigns (status 1)
  const active = all.filter((c) => c.status === 1);

  const existing =
    active.find((c) => c.name.toLowerCase() === campaignName.toLowerCase()) ??
    active.find((c) => c.name.toLowerCase().startsWith("psl -")) ??
    active[0];

  if (existing) {
    console.log(`[instantly] Using campaign: ${existing.name} (${existing.id})`);
    return existing.id;
  }

  throw new Error(
    `No active Instantly campaign found for territory "${territory}". ` +
    `Set INSTANTLY_CAMPAIGN_ID env var to your campaign ID, or activate a "PSL -" campaign in Instantly.`
  );
}

// ── Lead helpers ───────────────────────────────────────────────────────────────

export interface AddLeadParams {
  campaignId: string;
  email: string;
  firstName: string;
  lastName?: string;
  companyName: string;
  /** Claude-generated subject — maps to {{email_subject}} in campaign template */
  emailSubject: string;
  /** Claude-generated body — maps to {{email_body}} in campaign template */
  emailBody: string;
}

/**
 * Adds a lead to an Instantly campaign with personalized email variables.
 * Returns the Instantly lead ID.
 */
export async function addLeadToCampaign(
  params: AddLeadParams
): Promise<string> {
  const lead = await apiFetch<InstantlyLeadResponse>("/leads", {
    method: "POST",
    body: JSON.stringify({
      campaign_id: params.campaignId,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName ?? "",
      company_name: params.companyName,
      variables: {
        email_subject: params.emailSubject,
        email_body: params.emailBody,
      },
    }),
  });

  return lead.id;
}

// ── Lead status check ─────────────────────────────────────────────────────────

interface InstantlyLeadDetail {
  id: string;
  email: string;
  campaign_id: string;
  /** 1=active, 2=completed, 3=paused, -1=unsubscribed, 4=bounced */
  status: number;
}

export async function getLeadStatus(leadId: string): Promise<InstantlyLeadDetail | null> {
  try {
    return await apiFetch<InstantlyLeadDetail>(`/leads/${leadId}`);
  } catch {
    return null;
  }
}

// ── Unibox: check for replies ──────────────────────────────────────────────────

interface UniboxEmail {
  id: string;
  from_address: string;
  subject: string;
  body: string;
  timestamp: string;
  lead_id?: string;
}

export async function getLeadReplies(campaignId: string, leadEmail: string): Promise<UniboxEmail[]> {
  try {
    const data = await apiFetch<{ data: UniboxEmail[] }>(
      `/unibox/emails?campaign_id=${encodeURIComponent(campaignId)}&email=${encodeURIComponent(leadEmail)}&limit=10`
    );
    return data.data ?? [];
  } catch {
    return [];
  }
}

// ── Account helpers (for Settings page) ───────────────────────────────────────

export interface InstantlyAccount {
  email: string;
  status: number;
  warmup_enabled: boolean;
}

export async function listSendingAccounts(): Promise<InstantlyAccount[]> {
  const raw = await apiFetch<InstantlyAccount[] | { data: InstantlyAccount[] }>("/accounts?limit=100");
  return Array.isArray(raw) ? raw : (raw.data ?? []);
}
