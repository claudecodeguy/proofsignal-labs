/**
 * Domain and record normalization utilities.
 * All deterministic — zero model calls.
 */

/** Strip protocol, www, and trailing slashes. Returns lowercase normalized domain. */
export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  // Remove protocol
  d = d.replace(/^https?:\/\//i, "");
  // Remove www.
  d = d.replace(/^www\./i, "");
  // Remove trailing slash and path
  d = d.split("/")[0];
  // Remove port
  d = d.split(":")[0];
  return d;
}

/** Basic domain validity check — no model needed. */
export function isValidDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  // Must have at least one dot, no spaces, reasonable length
  if (!normalized || normalized.length < 4 || normalized.length > 253) return false;
  if (normalized.includes(" ")) return false;
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  return domainRegex.test(normalized);
}

/** Normalize a company name for display */
export function normalizeCompanyName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Normalize state abbreviation */
export function normalizeState(state: string): string {
  const s = state.trim().toUpperCase();
  const STATE_MAP: Record<string, string> = {
    ALABAMA: "AL", ALASKA: "AK", ARIZONA: "AZ", ARKANSAS: "AR",
    CALIFORNIA: "CA", COLORADO: "CO", CONNECTICUT: "CT", DELAWARE: "DE",
    FLORIDA: "FL", GEORGIA: "GA", HAWAII: "HI", IDAHO: "ID",
    ILLINOIS: "IL", INDIANA: "IN", IOWA: "IA", KANSAS: "KS",
    KENTUCKY: "KY", LOUISIANA: "LA", MAINE: "ME", MARYLAND: "MD",
    MASSACHUSETTS: "MA", MICHIGAN: "MI", MINNESOTA: "MN", MISSISSIPPI: "MS",
    MISSOURI: "MO", MONTANA: "MT", NEBRASKA: "NE", NEVADA: "NV",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM",
    "NEW YORK": "NY", "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND",
    OHIO: "OH", OKLAHOMA: "OK", OREGON: "OR", PENNSYLVANIA: "PA",
    "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD",
    TENNESSEE: "TN", TEXAS: "TX", UTAH: "UT", VERMONT: "VT",
    VIRGINIA: "VA", WASHINGTON: "WA", "WEST VIRGINIA": "WV",
    WISCONSIN: "WI", WYOMING: "WY",
  };
  return STATE_MAP[s] ?? (s.length === 2 ? s : "");
}

/** Parse a homepage URL from a domain */
export function domainToHomepageUrl(domain: string): string {
  const normalized = normalizeDomain(domain);
  return `https://${normalized}`;
}

/** Generate page URLs to scrape from a domain and page type list */
export function buildPageUrls(
  domain: string,
  pageTypes: string[]
): Array<{ url: string; pageType: string }> {
  const base = `https://${normalizeDomain(domain)}`;
  const PATH_MAP: Record<string, string> = {
    homepage: "",
    about: "/about",
    contact: "/contact",
    locations: "/locations",
    careers: "/careers",
    services: "/services",
    privacy: "/privacy-policy",
    "case-studies": "/case-studies",
  };
  return pageTypes.map((type) => ({
    url: `${base}${PATH_MAP[type] ?? `/${type}`}`,
    pageType: type,
  }));
}

/** Is this email from a disposable provider? Deterministic check. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com",
  "tempmail.com", "throwam.com", "yopmail.com", "sharklasers.com",
  "dispostable.com", "mailnull.com", "spamgourmet.com",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

/** Is this a likely personal / free email domain? */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "aol.com", "protonmail.com", "me.com",
]);

export function isFreeEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return FREE_EMAIL_DOMAINS.has(domain);
}

/** Score a contact email quality: "work" | "free" | "disposable" | "unknown" */
export function classifyEmail(email: string): "work" | "free" | "disposable" | "unknown" {
  if (!email || !email.includes("@")) return "unknown";
  if (isDisposableEmail(email)) return "disposable";
  if (isFreeEmail(email)) return "free";
  return "work";
}
