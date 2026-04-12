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
 * Returns the campaign ID for a territory, creating one if it doesn't exist.
 * Campaign names are prefixed "PSL - " to keep them identifiable.
 */
export async function getOrCreateCampaign(territory: string): Promise<string> {
  const campaignName = `PSL - ${territory}`;

  // List existing campaigns (paginated, get first 100 — enough for all territories)
  const data = await apiFetch<{ data: InstantlyCampaign[]; total: number }>(
    "/campaigns?limit=100&skip=0"
  );

  const existing = data.data.find(
    (c) => c.name.toLowerCase() === campaignName.toLowerCase()
  );
  if (existing) return existing.id;

  // Create new campaign
  const created = await apiFetch<InstantlyCampaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: campaignName,
      campaign_schedule: {
        schedules: [
          {
            name: "Default",
            days: {
              monday: true,
              tuesday: true,
              wednesday: true,
              thursday: true,
              friday: true,
              saturday: false,
              sunday: false,
            },
            start_hour: "08:00",
            end_hour: "17:00",
            timezone: "America/Chicago",
          },
        ],
      },
    }),
  });

  return created.id;
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

// ── Account helpers (for Settings page) ───────────────────────────────────────

export interface InstantlyAccount {
  email: string;
  status: number;
  warmup_enabled: boolean;
}

export async function listSendingAccounts(): Promise<InstantlyAccount[]> {
  const data = await apiFetch<{ data: InstantlyAccount[] }>("/accounts?limit=100");
  return data.data ?? [];
}
