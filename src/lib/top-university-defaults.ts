/** Shared defaults for /top-university filters and /api/rankings query alignment. */

export const TOP_UNIVERSITY_DEFAULT_PAGE = 1;
export const TOP_UNIVERSITY_DEFAULT_TOP = 100;
/** Matches /api/rankings default pageSize and home preview list. */
export const TOP_UNIVERSITY_DEFAULT_PAGE_SIZE = 10;

export const TOP_UNIVERSITY_TOP_TIERS = [10, 20, 50, 100] as const;

export type TopUniversityTopTier = (typeof TOP_UNIVERSITY_TOP_TIERS)[number];

/** Map arbitrary UI / URL numbers onto allowed list sizes. */
export function normalizeTopTier(value: number): TopUniversityTopTier {
  const n = Number.isFinite(value) ? value : TOP_UNIVERSITY_DEFAULT_TOP;
  if (TOP_UNIVERSITY_TOP_TIERS.includes(n as TopUniversityTopTier)) {
    return n as TopUniversityTopTier;
  }
  if (n <= 10) return 10;
  if (n <= 20) return 20;
  if (n <= 50) return 50;
  return 100;
}

export function buildTopUniversityPath(args: {
  country?: string;
  region?: string;
  top?: number;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (args.country) params.set("country", args.country);
  if (args.region) params.set("region", args.region);
  params.set(
    "top",
    String(normalizeTopTier(args.top ?? TOP_UNIVERSITY_DEFAULT_TOP)),
  );
  params.set("page", String(Math.max(1, args.page ?? TOP_UNIVERSITY_DEFAULT_PAGE)));
  const q = params.toString();
  return q ? `/top-university?${q}` : "/top-university";
}
