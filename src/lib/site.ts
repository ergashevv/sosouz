/**
 * Public contact email (footer, terms, etc.).
 * Override with NEXT_PUBLIC_CONTACT_EMAIL when needed.
 */
export function getContactEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return 'info@soso.uz';
}

/** Passport / legal name shown on About (imprint). Override with NEXT_PUBLIC_SITE_OPERATOR_NAME. */
export function getSiteOperatorLegalName(): string {
  return process.env.NEXT_PUBLIC_SITE_OPERATOR_NAME?.trim() || 'Ergashev Pulot';
}

/** Public username (GitHub, etc.). Override with NEXT_PUBLIC_SITE_OPERATOR_HANDLE. */
export function getSiteOperatorHandle(): string {
  return process.env.NEXT_PUBLIC_SITE_OPERATOR_HANDLE?.trim() || 'edevzi';
}

/** Optional profile URL for the handle (e.g. GitHub). */
export function getSiteOperatorProfileUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_SITE_OPERATOR_PROFILE_URL?.trim();
  return u || null;
}

export const SITE_BRAND_NAME = 'SOSO';

const DEFAULT_LINKEDIN_PULAT = 'https://www.linkedin.com/in/edevz/';
const DEFAULT_LINKEDIN_AZAM =
  'https://www.linkedin.com/in/azamkhuja-vosiljonov-38524b23a/';

/** LinkedIn for the public team page; override with NEXT_PUBLIC_TEAM_LINKEDIN_PULAT. */
export function getTeamLinkedInPulat(): string | null {
  const u = process.env.NEXT_PUBLIC_TEAM_LINKEDIN_PULAT?.trim();
  if (u && /^https:\/\//i.test(u)) return u;
  return DEFAULT_LINKEDIN_PULAT;
}

/** LinkedIn for the public team page; override with NEXT_PUBLIC_TEAM_LINKEDIN_AZAM. */
export function getTeamLinkedInAzam(): string | null {
  const u = process.env.NEXT_PUBLIC_TEAM_LINKEDIN_AZAM?.trim();
  if (u && /^https:\/\//i.test(u)) return u;
  return DEFAULT_LINKEDIN_AZAM;
}

/**
 * Canonical site origin for metadata, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://soso.example.com).
 */
export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL;

  if (configured) {
    const trimmed = configured.trim().replace(/\/$/, "");
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
