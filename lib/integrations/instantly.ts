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

// Instantly campaign status codes
const STATUS_ACTIVE = 1;

/**
 * Pure function — selects the best campaign from a list for a given territory.
 * Exported for unit testing.
 *
 * Priority (highest first):
 *   1. Active campaign with exact name match
 *   2. Active campaign with "PSL -" prefix
 *   3. Any campaign with exact name match (non-active)
 *   4. Any campaign with "PSL -" prefix (non-active)
 *   5. null — caller should create a new one
 */
export function selectCampaign(
  campaigns: InstantlyCampaign[],
  territory: string
): InstantlyCampaign | null {
  const name = `PSL - ${territory}`.toLowerCase();

  // 1. Active + exact territory match — best possible
  const activeExact = campaigns.find((c) => c.status === STATUS_ACTIVE && c.name.toLowerCase() === name);
  if (activeExact) return activeExact;

  // 2. Non-active exact territory match — right territory, just needs activation
  const anyExact = campaigns.find((c) => c.name.toLowerCase() === name);
  if (anyExact) return anyExact;

  // 3. Active campaign from any PSL territory — fallback, still sends
  const activePrefix = campaigns.find((c) => c.status === STATUS_ACTIVE && c.name.toLowerCase().startsWith("psl -"));
  if (activePrefix) return activePrefix;

  // 4. Any PSL campaign — last resort before creating
  const anyPrefix = campaigns.find((c) => c.name.toLowerCase().startsWith("psl -"));
  if (anyPrefix) return anyPrefix;

  return null;
}

/**
 * Returns the campaign ID for a territory.
 *
 * Resolution order:
 *   1. INSTANTLY_CAMPAIGN_ID env var — fastest, most reliable, no API call needed
 *   2. Name matching via API — fallback if env var not set
 *
 * NEVER auto-creates campaigns. If none found, throws a clear error.
 * Set INSTANTLY_CAMPAIGN_ID in Vercel env vars to skip all name matching.
 */
export async function getOrCreateCampaign(territory: string): Promise<string> {
  // Env var always wins — skip API entirely
  const envId = process.env.INSTANTLY_CAMPAIGN_ID?.trim();
  if (envId) {
    console.log(`[instantly] Using campaign from env: ${envId}`);
    return envId;
  }

  // Fallback: find by name via API
  const raw = await apiFetch<InstantlyCampaign[] | { data: InstantlyCampaign[] }>(
    "/campaigns?limit=100&skip=0"
  );
  const all: InstantlyCampaign[] = Array.isArray(raw) ? raw : (raw.data ?? []);

  console.log(
    `[instantly] ${all.length} campaigns:`,
    all.map((c) => `${c.name} (${c.id}, status=${c.status})`)
  );

  const existing = selectCampaign(all, territory);
  if (existing) {
    console.log(`[instantly] Using campaign: ${existing.name} (${existing.id}, status=${existing.status})`);
    return existing.id;
  }

  throw new Error(
    `No Instantly campaign found for territory "${territory}". ` +
    `Set INSTANTLY_CAMPAIGN_ID env var to your campaign ID in Vercel and .env.local.`
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
  const payload = {
    campaign_id: params.campaignId,
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName ?? "",
    company_name: params.companyName,
    variables: {
      email_subject: params.emailSubject,
      email_body: params.emailBody,
    },
  };

  console.log(`[instantly] Adding lead ${params.email} to campaign ${params.campaignId}`);
  console.log(`[instantly] Payload:`, JSON.stringify(payload));

  const lead = await apiFetch<InstantlyLeadResponse>("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(`[instantly] Lead created:`, JSON.stringify(lead));
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
