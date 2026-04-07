/**
 * Restrict outbound links to the university's registered domains / website hostnames
 * so we don't send users to third-party or hallucinated paths that often 404.
 */

export function stripLeadingWww(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

/** True if `hostname` equals `base` or is a subdomain of `base` (e.g. courses.ox.ac.uk vs ox.ac.uk). */
export function hostUnderBase(hostname: string, base: string): boolean {
  const h = stripLeadingWww(hostname || "");
  const b = stripLeadingWww(base || "");
  if (!h || !b) return false;
  return h === b || h.endsWith(`.${b}`);
}

export function tryParseHostname(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
}

/** Base domain labels from API: `domains[]` plus hostnames from `web_pages[]`. */
export function collectOfficialBases(args: {
  primaryDomain: string;
  domains?: string[] | null;
  web_pages?: string[] | null;
}): string[] {
  const out = new Set<string>();
  const add = (raw: string | null | undefined) => {
    const s = raw?.trim();
    if (!s || s === "unknown") return;
    const host = tryParseHostname(s.includes("://") ? s : `https://${s}`);
    if (host) out.add(stripLeadingWww(host));
  };

  add(args.primaryDomain);
  if (Array.isArray(args.domains)) {
    for (const d of args.domains) add(d);
  }
  if (Array.isArray(args.web_pages)) {
    for (const p of args.web_pages) {
      try {
        const h = new URL(p).hostname;
        if (h) out.add(stripLeadingWww(h));
      } catch {
        /* skip */
      }
    }
  }

  return Array.from(out);
}

export function urlMatchesOfficialBases(url: string, bases: string[] | null | undefined): boolean {
  const list = bases ?? [];
  if (!list.length) return false;
  const host = tryParseHostname(url);
  if (!host) return false;
  return list.some((base) => hostUnderBase(host, base));
}

/** First usable origin from `web_pages`, else `https://{firstBase}/`. */
export function officialHomeUrl(bases: string[] | null | undefined, web_pages?: string[] | null): string {
  if (Array.isArray(web_pages)) {
    for (const p of web_pages) {
      try {
        const u = new URL(p);
        return `${u.origin}/`;
      } catch {
        /* next */
      }
    }
  }
  const list = bases ?? [];
  const b = list[0];
  if (b) return `https://${b}/`;
  return "";
}

/** Lenient: if `bases` is empty, keep any valid absolute URL (e.g. legacy rows / odd API data). */
export function clampHttpUrlToOfficial(
  raw: string | null | undefined,
  bases: string[] | null | undefined,
  fallbackHome: string,
): string {
  const list = bases ?? [];
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return fallbackHome;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    new URL(withProto);
  } catch {
    return fallbackHome;
  }
  if (list.length === 0) return withProto;
  return urlMatchesOfficialBases(withProto, list) ? withProto : fallbackHome;
}

/** Strict: used when saving research — unknown host without bases list becomes homepage only. */
export function clampResearchUrlToOfficial(
  raw: string | null | undefined,
  bases: string[] | null | undefined,
  fallbackHome: string,
): string {
  const list = bases ?? [];
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return fallbackHome;
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    new URL(withProto);
  } catch {
    return fallbackHome;
  }
  if (list.length === 0) return fallbackHome;
  return urlMatchesOfficialBases(withProto, list) ? withProto : fallbackHome;
}
