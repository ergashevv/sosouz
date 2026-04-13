/**
 * Hipolabs search + DB cache. Use only from server (API routes, server components, scripts).
 */
import type { Prisma } from "@prisma/client";
import type { University } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const HIPO_BASE_URL = "http://universities.hipolabs.com/search";

const CACHE_KEY_PREFIX = "hipo:v1:";

/** Default 7 days — Hipolabs data rarely changes intra-week. */
function cacheTtlMs(): number {
  const hours = Number(process.env.HIPO_SEARCH_CACHE_TTL_HOURS || 168);
  if (!Number.isFinite(hours) || hours <= 0) return 168 * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

export function buildHipoSearchCacheKey(country?: string, name?: string): string {
  const c = (country ?? "").trim().toLowerCase();
  const n = (name ?? "").trim().toLowerCase();
  return `${CACHE_KEY_PREFIX}${c}|${n}`;
}

function isFresh(lastUpdated: Date): boolean {
  return Date.now() - lastUpdated.getTime() < cacheTtlMs();
}

function parseUniversityList(data: unknown): University[] {
  if (!Array.isArray(data)) return [];
  const out: University[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const u = item as Record<string, unknown>;
    const name = typeof u.name === "string" ? u.name : "";
    const country = typeof u.country === "string" ? u.country : "";
    if (!name || !country) continue;
    out.push({
      name,
      country,
      alpha_two_code: typeof u.alpha_two_code === "string" ? u.alpha_two_code : "",
      web_pages: Array.isArray(u.web_pages) ? (u.web_pages as string[]) : [],
      domains: Array.isArray(u.domains) ? (u.domains as string[]) : [],
      state_province: u.state_province === null || typeof u.state_province === "string" ? u.state_province : null,
    });
  }
  return out;
}

async function fetchFromHipolabs(country: string, name: string): Promise<University[]> {
  const upstreamUrl = new URL(HIPO_BASE_URL);
  if (country) upstreamUrl.searchParams.set("country", country);
  if (name) upstreamUrl.searchParams.set("name", name);

  const upstreamResponse = await fetch(upstreamUrl.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!upstreamResponse.ok) {
    throw new Error(`Hipolabs HTTP ${upstreamResponse.status}`);
  }

  const data: unknown = await upstreamResponse.json();
  return parseUniversityList(data);
}

async function persistSearchAndCatalog(cacheKey: string, list: University[]): Promise<void> {
  const payload = list as unknown as Prisma.InputJsonValue;

  await prisma.searchCache.upsert({
    where: { query: cacheKey },
    create: { query: cacheKey, results: payload },
    update: { results: payload },
  });

  const chunkSize = 80;
  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    await prisma.$transaction(
      async (tx) => {
        for (const u of chunk) {
          await tx.universityCatalog.upsert({
            where: {
              name_country: { name: u.name, country: u.country },
            },
            create: {
              name: u.name,
              country: u.country,
              alpha_two_code: u.alpha_two_code,
              web_pages: u.web_pages,
              domains: u.domains,
              state_province: u.state_province,
            },
            update: {
              alpha_two_code: u.alpha_two_code,
              web_pages: u.web_pages,
              domains: u.domains,
              state_province: u.state_province,
            },
          });
        }
      },
      { timeout: 90_000 },
    );
  }
}

export type HipoSearchSource = "cache" | "hipolabs" | "cache_stale";

/**
 * Hipolabs search with DB cache + catalog upsert. On upstream failure, returns stale cache if present.
 */
export async function getHipoSearchResultsCached(params: {
  country?: string;
  name?: string;
}): Promise<{ data: University[]; source: HipoSearchSource }> {
  const country = (params.country ?? "").trim();
  const name = (params.name ?? "").trim();

  if (!country && !name) {
    return { data: [], source: "cache" };
  }

  const cacheKey = buildHipoSearchCacheKey(country || undefined, name || undefined);

  const cached = await prisma.searchCache.findUnique({ where: { query: cacheKey } });

  if (cached && isFresh(cached.last_updated)) {
    return { data: parseUniversityList(cached.results), source: "cache" };
  }

  try {
    const list = await fetchFromHipolabs(country, name);
    try {
      await persistSearchAndCatalog(cacheKey, list);
    } catch (persistErr) {
      console.error("[hipo-search] persist failed", persistErr);
    }
    return { data: list, source: "hipolabs" };
  } catch (err) {
    if (cached) {
      console.warn("[hipo-search] upstream failed, using stale cache", err);
      return { data: parseUniversityList(cached.results), source: "cache_stale" };
    }
    throw err;
  }
}

/**
 * Server-only: university profile resolution (cached; no direct Hipolabs when cache warm).
 */
export async function fetchUniversityByNameDirect(name: string): Promise<University | null> {
  const sanitized = name.trim().slice(0, 120);
  if (!sanitized) return null;

  try {
    const { data } = await getHipoSearchResultsCached({ name: sanitized });
    if (!data.length) return null;
    return data.find((u) => u.name === sanitized) || data[0] || null;
  } catch {
    return null;
  }
}
