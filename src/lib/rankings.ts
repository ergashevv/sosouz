import "server-only";

import { Prisma } from "@prisma/client";
import { canonicalCountryKey, countryFilterMatches, foldGeoLabel } from "@/lib/geoFilters";
import { prisma } from "@/lib/prisma";
import {
  generateAzureChatCompletionText,
  getAzureOpenAIDeploymentByPurpose,
  isAzureOpenAiConfigured,
} from "@/lib/azure-openai";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

const SERPER_SEARCH_ENDPOINT = "https://google.serper.dev/search";
const HIPO_BASE_URL = "http://universities.hipolabs.com/search";
const CACHE_NAMESPACE = "rankings:serper-azure";

/** World snapshot size; used for country/region “top N” lists (ordered within that geo by global rank in this list). */
/** Keep moderate: very large lists often return truncated/invalid JSON from the model. */
export const WORLD_RANKING_ENTRY_COUNT = 400;

/** Max universities stored per country (matches UI “top” cap of 100). */
export const COUNTRY_RANKING_ENTRY_COUNT = 100;

/** LLM extraction requests this many rows per call (then merged + saved to DB). */
const COUNTRY_RANKING_BATCH_SIZE = Math.min(
  25,
  Math.max(5, Number(process.env.COUNTRY_RANKING_BATCH_SIZE || 10)),
);

/** HTTP `/api/rankings?country=` runs this many batches before responding; rest finishes in background. */
export const COUNTRY_RANKING_API_PREFETCH_BATCHES = Math.min(
  10,
  Math.max(1, Number(process.env.COUNTRY_RANKING_API_PREFETCH_BATCHES || 2)),
);
const TRUSTED_DOMAINS = [
  "timeshighereducation.com",
  "topuniversities.com",
  "shanghairanking.com",
  "usnews.com",
  "wikipedia.org",
];

/** Cap HTML→text excerpts sent to LLM (large pages blow input token budgets). */
const SOURCE_EXCERPT_MAX_CHARS = Math.min(
  24_000,
  Math.max(4000, Number(process.env.RANKING_SOURCE_EXCERPT_MAX_CHARS || 7000)),
);

const countryRankingBuildLocks = new Map<string, Promise<RankingSnapshotLoadResult | null>>();

function sleepMs(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

type CoreRankingDataset = "world-top-100" | "south-korea-top-10";
type RankingDataset = CoreRankingDataset | "country-top";

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
}

interface RankingEntry {
  rank: number;
  university_name: string;
  country: string;
  region: string | null;
  state_province: string | null;
  official_website: string | null;
  source_url: string | null;
  source_title: string | null;
  confidence: number;
}

interface RankingSnapshotPayload {
  dataset: RankingDataset;
  /** Canonical geo key when dataset is country-top (e.g. "australia"). */
  country_key?: string;
  /** Next 1-based national rank to fetch (incremental build); absent = legacy snapshot. */
  country_fetch_next_rank?: number;
  year: number;
  month_snapshot: string;
  generated_at: string;
  source_strategy: "serper+azure";
  entries: RankingEntry[];
}

function normalizeMonthSnapshot(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toCacheKey(dataset: CoreRankingDataset, monthSnapshot: string, year: number) {
  return `${CACHE_NAMESPACE}:${dataset}:${year}:${monthSnapshot}`;
}

function toLatestCacheKey(dataset: CoreRankingDataset, year: number) {
  return `${CACHE_NAMESPACE}:${dataset}:${year}:latest`;
}

function getDomain(urlString: string) {
  try {
    return new URL(urlString).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isTrustedSource(urlString: string) {
  const hostname = getDomain(urlString);
  if (!hostname) return false;
  return TRUSTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function scoreTrustedSource(urlString: string) {
  const hostname = getDomain(urlString);
  const index = TRUSTED_DOMAINS.findIndex(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
  return index === -1 ? 999 : index;
}

function extractJson(input: string) {
  const cleaned = input.replace(/```json|```/g, "").trim();
  const firstBracket = cleaned.indexOf("{");
  const lastBracket = cleaned.lastIndexOf("}");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    return cleaned;
  }
  return cleaned.slice(firstBracket, lastBracket + 1);
}

function stripHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchWeb(query: string, num = 10): Promise<SerperOrganicResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY is missing.");
  }

  const response = await fetch(SERPER_SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num }),
  });

  if (!response.ok) {
    throw new Error(`Serper request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  const organic =
    payload && typeof payload === "object" && Array.isArray((payload as { organic?: unknown }).organic)
      ? (payload as { organic: unknown[] }).organic
      : [];

  return organic
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const link = typeof item.link === "string" ? item.link.trim() : "";
      const snippet = typeof item.snippet === "string" ? item.snippet.trim() : "";
      return { title, link, snippet };
    })
    .filter((item) => item.link && isTrustedSource(item.link))
    .sort((a, b) => scoreTrustedSource(a.link) - scoreTrustedSource(b.link));
}

async function fetchSourceExcerpt(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SOSO-RankingBot/1.0)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  const html = await response.text();
  const text = stripHtmlToText(html);
  return text.slice(0, SOURCE_EXCERPT_MAX_CHARS);
}

async function extractRankingsWithLlm(args: {
  dataset: "world-top-100" | "south-korea-top-10";
  year: number;
  sources: Array<{ title: string; link: string; snippet: string; excerpt: string }>;
}): Promise<RankingEntry[]> {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("Azure OpenAI is not configured.");
  }

  const targetCount = args.dataset === "world-top-100" ? WORLD_RANKING_ENTRY_COUNT : 10;
  const datasetLabel =
    args.dataset === "world-top-100"
      ? `world top ${WORLD_RANKING_ENTRY_COUNT} universities`
      : "South Korea top 10";

  const sourceBlock = args.sources
    .map(
      (source, index) =>
        `# Source ${index + 1}\nTitle: ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}\nExcerpt: ${source.excerpt || "No excerpt available."}`,
    )
    .join("\n\n");

  const prompt = `You are a strict data extraction assistant.
Task: Build ${datasetLabel} university ranking for year ${args.year} from sources below.

Return ONLY valid JSON in this schema:
{
  "entries": [
    {
      "rank": 1,
      "university_name": "string",
      "country": "string",
      "region": "string or null",
      "official_website": "https://... or null",
      "source_url": "https://...",
      "source_title": "string",
      "confidence": 0.0
    }
  ]
}

Rules:
- Return exactly ${targetCount} entries.
- rank must be unique and sequential from 1 to ${targetCount}.
- For dataset ${args.dataset}, country should match ranking context.
- For "country" use standard English names only (e.g. "Brazil" not "Brasil", "Germany" not "Deutschland", "South Korea") so downstream filters match.
- Prefer official university website for official_website.
- confidence must be between 0 and 1.
- Do not include markdown or explanations.

Sources:
${sourceBlock}`;

  const text = await generateAzureChatCompletionText({
    messages: [{ role: "user", content: prompt }],
    deployment: getAzureOpenAIDeploymentByPurpose("reasoning"),
    temperature: 0.1,
    maxTokens: 3000,
    responseFormat: "json_object",
  });
  const parsed = JSON.parse(extractJson(text)) as { entries?: unknown[] };
  const rows = Array.isArray(parsed.entries) ? parsed.entries : [];

  const normalized: RankingEntry[] = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const record = row as Record<string, unknown>;
      const rank =
        typeof record.rank === "number" && Number.isFinite(record.rank)
          ? Math.trunc(record.rank)
          : Number.NaN;
      const universityName =
        typeof record.university_name === "string" ? record.university_name.trim() : "";
      const country = typeof record.country === "string" ? record.country.trim() : "";
      const region =
        typeof record.region === "string" && record.region.trim() ? record.region.trim() : null;
      const officialWebsite =
        typeof record.official_website === "string" && record.official_website.trim()
          ? record.official_website.trim()
          : null;
      const sourceUrl =
        typeof record.source_url === "string" && record.source_url.trim()
          ? record.source_url.trim()
          : null;
      const sourceTitle =
        typeof record.source_title === "string" && record.source_title.trim()
          ? record.source_title.trim()
          : null;
      const confidence =
        typeof record.confidence === "number" && Number.isFinite(record.confidence)
          ? Math.max(0, Math.min(1, record.confidence))
          : 0.6;

      if (!Number.isFinite(rank) || rank < 1 || rank > targetCount) return null;
      if (!universityName || !country) return null;

      const entry: RankingEntry = {
        rank,
        university_name: universityName,
        country,
        region,
        state_province: null,
        official_website: officialWebsite,
        source_url: sourceUrl,
        source_title: sourceTitle,
        confidence,
      };

      return entry;
    })
    .filter((item): item is RankingEntry => item !== null)
    .sort((a, b) => a.rank - b.rank);

  const uniqueByRank = new Map<number, RankingEntry>();
  for (const row of normalized) {
    if (!uniqueByRank.has(row.rank)) {
      uniqueByRank.set(row.rank, row);
    }
  }

  return Array.from(uniqueByRank.values()).sort((a, b) => a.rank - b.rank);
}

function countryBatchRowToEntry(
  record: Record<string, unknown>,
  rankOverride: number | null,
): RankingEntry | null {
  const rank =
    rankOverride != null
      ? rankOverride
      : typeof record.rank === "number" && Number.isFinite(record.rank)
        ? Math.trunc(record.rank)
        : Number.NaN;
  const universityName =
    typeof record.university_name === "string" ? record.university_name.trim() : "";
  const country = typeof record.country === "string" ? record.country.trim() : "";
  const region =
    typeof record.region === "string" && record.region.trim() ? record.region.trim() : null;
  const officialWebsite =
    typeof record.official_website === "string" && record.official_website.trim()
      ? record.official_website.trim()
      : null;
  const sourceUrl =
    typeof record.source_url === "string" && record.source_url.trim()
      ? record.source_url.trim()
      : null;
  const sourceTitle =
    typeof record.source_title === "string" && record.source_title.trim()
      ? record.source_title.trim()
      : null;
  const confidence =
    typeof record.confidence === "number" && Number.isFinite(record.confidence)
      ? Math.max(0, Math.min(1, record.confidence))
      : 0.6;

  if (!Number.isFinite(rank) || !universityName || !country) return null;

  return {
    rank,
    university_name: universityName,
    country,
    region,
    state_province: null,
    official_website: officialWebsite,
    source_url: sourceUrl,
    source_title: sourceTitle,
    confidence,
  };
}

/** Prefer exact ranks; if model returns wrong/missing ranks, repair from JSON order (same response). */
function normalizeCountryBatchFromParsedRows(
  rows: unknown[],
  rankStart: number,
  rankEnd: number,
): RankingEntry[] {
  const batchSize = rankEnd - rankStart + 1;
  const strictKeys = new Map<number, RankingEntry>();
  const looseInOrder: RankingEntry[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const rankRaw =
      typeof record.rank === "number" && Number.isFinite(record.rank)
        ? Math.trunc(record.rank)
        : Number.NaN;

    const universityName =
      typeof record.university_name === "string" ? record.university_name.trim() : "";
    const country = typeof record.country === "string" ? record.country.trim() : "";
    if (!universityName || !country) continue;

    const entryLoose = countryBatchRowToEntry(record, Number.isFinite(rankRaw) ? rankRaw : rankStart);
    if (entryLoose) {
      looseInOrder.push(entryLoose);
    }

    if (Number.isFinite(rankRaw) && rankRaw >= rankStart && rankRaw <= rankEnd) {
      const entry = countryBatchRowToEntry(record, rankRaw);
      if (entry && !strictKeys.has(rankRaw)) {
        strictKeys.set(rankRaw, entry);
      }
    }
  }

  if (strictKeys.size > 0) {
    return Array.from(strictKeys.values()).sort((a, b) => a.rank - b.rank);
  }

  const seen = new Set<string>();
  const repaired: RankingEntry[] = [];
  for (const e of looseInOrder) {
    const k = foldGeoLabel(e.university_name);
    if (seen.has(k)) continue;
    seen.add(k);
    repaired.push(e);
    if (repaired.length >= batchSize) break;
  }

  return repaired.map((e, i) => ({
    ...e,
    rank: rankStart + i,
  }));
}

async function extractCountryRankingsBatchWithLlm(args: {
  countryEnglish: string;
  year: number;
  rankStart: number;
  rankEnd: number;
  sources: Array<{ title: string; link: string; snippet: string; excerpt: string }>;
}): Promise<RankingEntry[]> {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("Azure OpenAI is not configured.");
  }

  const { countryEnglish, year, rankStart, rankEnd, sources } = args;
  const batchSize = rankEnd - rankStart + 1;
  const sourceBlock = sources
    .map(
      (source, index) =>
        `# Source ${index + 1}\nTitle: ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}\nExcerpt: ${source.excerpt || "No excerpt available."}`,
    )
    .join("\n\n");

  const buildStrictPrompt = () => `You are a strict data extraction assistant.
Task: List universities ranked at positions ${rankStart} through ${rankEnd} (inclusive) in the NATIONAL / DOMESTIC university ranking for ${countryEnglish} only (NOT world ranking). Year ${year}. There must be exactly ${batchSize} positions; return one university per position.

Return ONLY valid JSON in this schema:
{
  "entries": [
    {
      "rank": ${rankStart},
      "university_name": "string",
      "country": "string",
      "region": "string or null",
      "official_website": "https://... or null",
      "source_url": "https://...",
      "source_title": "string",
      "confidence": 0.0
    }
  ]
}

Rules:
- Return exactly ${batchSize} entries with ranks ${rankStart}, ${rankStart + 1}, ... ${rankEnd} — each rank once.
- Every entry must be in ${countryEnglish}; use the same standard English country name for all rows (e.g. "Australia", "Hong Kong", "South Korea").
- Prefer official university website for official_website.
- confidence must be between 0 and 1.
- Do not include markdown or explanations.

Sources:
${sourceBlock}`;

  const buildSoftPrompt = () => `You extract university data from sources. For ${countryEnglish} (year ${year}), list ${batchSize} distinct well-known universities that would typically appear in the NATIONAL ranking around positions ${rankStart}-${rankEnd} (not global/world ranking). Use sources below.

Return ONLY valid JSON:
{"entries":[{"rank":${rankStart},"university_name":"","country":"","region":null,"official_website":null,"source_url":"","source_title":"","confidence":0.8}]}

Rules: Exactly ${batchSize} entries. rank must run from ${rankStart} to ${rankEnd} once each. Country name in English. No markdown.

Sources:
${sourceBlock}`;

  const run = async (prompt: string) => {
    const text = await generateAzureChatCompletionText({
      messages: [{ role: "user", content: prompt }],
      deployment: getAzureOpenAIDeploymentByPurpose("reasoning"),
      temperature: 0.1,
      maxTokens: 2400,
      responseFormat: "json_object",
    });
    const parsed = JSON.parse(extractJson(text)) as { entries?: unknown[] };
    const rows = Array.isArray(parsed.entries) ? parsed.entries : [];
    return normalizeCountryBatchFromParsedRows(rows, rankStart, rankEnd);
  };

  const outStrict = await run(buildStrictPrompt());
  if (outStrict.length > 0) {
    return outStrict;
  }
  await sleepMs(900);
  return run(buildSoftPrompt());
}

function getNextCountryFetchRank(snapshot: RankingSnapshotPayload | null | undefined, targetCount: number) {
  if (!snapshot || snapshot.entries.length === 0) {
    return 1;
  }
  if (
    snapshot.country_fetch_next_rank != null &&
    snapshot.country_fetch_next_rank >= 1 &&
    snapshot.country_fetch_next_rank <= targetCount + 1
  ) {
    return snapshot.country_fetch_next_rank;
  }
  if (snapshot.entries.length >= targetCount) {
    return targetCount + 1;
  }
  return snapshot.entries.length + 1;
}

function mergeCountryRankingBatches(
  previous: RankingEntry[],
  batchMatched: RankingEntry[],
  displayCountry: string,
): RankingEntry[] {
  const seen = new Set(previous.map((e) => foldGeoLabel(e.university_name)));
  const out = previous.map((e) => ({ ...e }));
  for (const row of batchMatched.sort((a, b) => a.rank - b.rank)) {
    const key = foldGeoLabel(row.university_name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...row,
      country: displayCountry,
    });
  }
  return out.map((e, i) => ({ ...e, rank: i + 1 }));
}

function toCountryCacheKey(countrySlug: string, year: number, monthOrLatest: string) {
  return `${CACHE_NAMESPACE}:country:${countrySlug}:${year}:${monthOrLatest}`;
}

/** Rankings often label HK/Macau universities as "China"; recover rows by name when the filter is a small territory. */
function entryMatchesCountryOrTerritory(entry: RankingEntry, filterLabel: string): boolean {
  if (countryFilterMatches(entry.country, filterLabel)) return true;

  const want = canonicalCountryKey(filterLabel);
  const name = foldGeoLabel(entry.university_name);

  if (want === canonicalCountryKey("Hong Kong")) {
    return (
      name.includes("hong kong") ||
      name.includes("hku ") ||
      name.includes(" hkust") ||
      name.startsWith("hkust") ||
      name.includes("cuhk") ||
      name.includes("chinese university of hong kong") ||
      name.includes("hong kong polytechnic") ||
      name.includes("polytechnic university of hong kong") ||
      name.includes("polyu") ||
      name.includes("city university of hong kong") ||
      name.includes("lingnan university") ||
      name.includes("hong kong baptist") ||
      name.includes("baptist university hong kong") ||
      name.includes("education university of hong kong") ||
      name.includes("hang seng university") ||
      name.includes("open university of hong kong")
    );
  }

  if (want === canonicalCountryKey("Macao")) {
    return name.includes("macau") || name.includes("macao") || name.includes("university of macau");
  }

  return false;
}

async function enrichWithHipo(entry: RankingEntry): Promise<RankingEntry> {
  const searchUrl = new URL(HIPO_BASE_URL);
  searchUrl.searchParams.set("name", entry.university_name);
  if (entry.country) {
    searchUrl.searchParams.set("country", entry.country);
  }

  const response = await fetch(searchUrl.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!response.ok) return entry;
  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) return entry;

  const first = payload.find((item) => item && typeof item === "object") as
    | Record<string, unknown>
    | undefined;
  if (!first) return entry;

  const webPages = Array.isArray(first.web_pages)
    ? first.web_pages.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const stateProvince =
    typeof first.state_province === "string" && first.state_province.trim()
      ? first.state_province.trim()
      : null;
  const country =
    typeof first.country === "string" && first.country.trim() ? first.country.trim() : entry.country;

  return {
    ...entry,
    country,
    state_province: stateProvince,
    official_website: entry.official_website || webPages[0] || null,
  };
}

export function isCountryRankingSnapshotComplete(
  snapshot: RankingSnapshotPayload,
  targetCount: number = COUNTRY_RANKING_ENTRY_COUNT,
): boolean {
  if (snapshot.dataset !== "country-top") return true;
  const next = getNextCountryFetchRank(snapshot, targetCount);
  return next > targetCount || snapshot.entries.length >= targetCount;
}

async function buildCountryRankingSnapshot(
  filterCountryLabel: string,
  year: number,
  targetCount: number,
  existingSnapshot: RankingSnapshotPayload | null,
  options?: { maxBatches?: number },
): Promise<RankingSnapshotPayload> {
  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY is missing.");
  }

  const countrySlug = canonicalCountryKey(filterCountryLabel);
  const label = filterCountryLabel.trim();

  const reuseMeta =
    existingSnapshot?.dataset === "country-top" &&
    existingSnapshot.country_key === countrySlug &&
    existingSnapshot.year === year;

  const monthSnapshot = reuseMeta
    ? existingSnapshot.month_snapshot
    : normalizeMonthSnapshot();

  let merged: RankingEntry[] =
    reuseMeta ? existingSnapshot.entries.map((e) => ({ ...e })) : [];

  let nextRank = getNextCountryFetchRank(existingSnapshot ?? undefined, targetCount);

  if (nextRank > targetCount) {
    if (merged.length < 1) {
      throw new Error(`Country ranking for ${label} is empty.`);
    }
    return {
      dataset: "country-top",
      country_key: countrySlug,
      country_fetch_next_rank: targetCount + 1,
      year,
      month_snapshot: monthSnapshot,
      generated_at: existingSnapshot?.generated_at ?? new Date().toISOString(),
      source_strategy: "serper+azure",
      entries: merged.slice(0, targetCount),
    };
  }

  const query = `best top ${targetCount} universities in ${label} ${year} national ranking site:timeshighereducation.com OR site:topuniversities.com OR site:usnews.com`;

  const searchResults = await searchWeb(query, 12);
  const selectedSources = searchResults.slice(0, 5);
  if (selectedSources.length === 0) {
    throw new Error(`No trusted sources found for country ranking (${label}).`);
  }

  const sourcesWithExcerpts = await Promise.all(
    selectedSources.map(async (item) => ({
      ...item,
      excerpt: await fetchSourceExcerpt(item.link),
    })),
  );

  let lastPayload: RankingSnapshotPayload | null = null;
  let consecutiveEmptyBatches = 0;
  const maxBatches = options?.maxBatches;
  let batchIterations = 0;
  let stoppedForBatchLimit = false;

  while (nextRank <= targetCount && merged.length < targetCount) {
    if (maxBatches != null && batchIterations >= maxBatches) {
      stoppedForBatchLimit = true;
      break;
    }
    batchIterations += 1;

    const rankEnd = Math.min(nextRank + COUNTRY_RANKING_BATCH_SIZE - 1, targetCount);
    const batchRaw = await extractCountryRankingsBatchWithLlm({
      countryEnglish: label,
      year,
      rankStart: nextRank,
      rankEnd,
      sources: sourcesWithExcerpts,
    });

    if (batchRaw.length === 0) {
      consecutiveEmptyBatches += 1;
      if (consecutiveEmptyBatches > 8) {
        throw new Error(
          `Country ranking stalled for ${label}: too many empty batches near ranks ${nextRank}-${rankEnd}.`,
        );
      }
      nextRank = rankEnd + 1;
      lastPayload = {
        dataset: "country-top",
        country_key: countrySlug,
        country_fetch_next_rank: nextRank,
        year,
        month_snapshot: monthSnapshot,
        generated_at: new Date().toISOString(),
        source_strategy: "serper+azure",
        entries: merged.slice(0, targetCount),
      };
      await saveCountryRanking(lastPayload);
      continue;
    }

    consecutiveEmptyBatches = 0;

    const enriched = await Promise.all(batchRaw.map((entry) => enrichWithHipo(entry)));
    const matched = enriched
      .filter((entry) => entryMatchesCountryOrTerritory(entry, label))
      .sort((a, b) => a.rank - b.rank);

    merged = mergeCountryRankingBatches(merged, matched, label);
    nextRank = rankEnd + 1;

    lastPayload = {
      dataset: "country-top",
      country_key: countrySlug,
      country_fetch_next_rank: nextRank,
      year,
      month_snapshot: monthSnapshot,
      generated_at: new Date().toISOString(),
      source_strategy: "serper+azure",
      entries: merged.slice(0, targetCount),
    };
    await saveCountryRanking(lastPayload);

    if (merged.length >= targetCount) {
      const done: RankingSnapshotPayload = {
        ...lastPayload,
        country_fetch_next_rank: targetCount + 1,
        entries: merged.slice(0, targetCount),
      };
      await saveCountryRanking(done);
      return done;
    }
  }

  if (merged.length < 1) {
    throw new Error(
      `Incomplete country ranking for ${label}: no rows matched (check country/territory labels in sources).`,
    );
  }

  if (!lastPayload) {
    throw new Error(`Country ranking build produced no batches for ${label}.`);
  }

  if (
    !stoppedForBatchLimit &&
    lastPayload.country_fetch_next_rank !== targetCount + 1
  ) {
    const finished: RankingSnapshotPayload = {
      ...lastPayload,
      country_fetch_next_rank: targetCount + 1,
      entries: merged.slice(0, targetCount),
    };
    await saveCountryRanking(finished);
    return finished;
  }

  return lastPayload;
}

async function saveCountryRanking(snapshot: RankingSnapshotPayload) {
  if (!snapshot.country_key) {
    throw new Error("Country snapshot missing country_key.");
  }
  const slug = snapshot.country_key;
  const monthKey = toCountryCacheKey(slug, snapshot.year, snapshot.month_snapshot);
  const latestKey = toCountryCacheKey(slug, snapshot.year, "latest");
  const results = snapshot as unknown as Prisma.InputJsonValue;

  await prisma.searchCache.upsert({
    where: { query: monthKey },
    update: { results },
    create: { query: monthKey, results },
  });

  await prisma.searchCache.upsert({
    where: { query: latestKey },
    update: { results },
    create: { query: latestKey, results },
  });

  return { monthKey, latestKey };
}

async function findCountryRankingCacheRow(countrySlug: string, year: number, monthSnapshot?: string) {
  const query = monthSnapshot
    ? toCountryCacheKey(countrySlug, year, monthSnapshot)
    : toCountryCacheKey(countrySlug, year, "latest");
  const row = await prisma.searchCache.findUnique({ where: { query } });
  if (!row) return null;
  return { row, query, year };
}

async function getCountryRankingSnapshotFromCache(args: {
  countrySlug: string;
  year?: number;
  monthSnapshot?: string;
}): Promise<RankingSnapshotLoadResult | null> {
  const requestedYear = args.year ?? new Date().getUTCFullYear();

  if (args.monthSnapshot) {
    const hit = await findCountryRankingCacheRow(args.countrySlug, requestedYear, args.monthSnapshot);
    if (!hit) return null;
    return {
      snapshot: hit.row.results as unknown as RankingSnapshotPayload,
      storedAt: hit.row.last_updated,
      resolvedKeyYear: hit.year,
      usedPriorYearKey: false,
    };
  }

  const primary = await findCountryRankingCacheRow(args.countrySlug, requestedYear);
  if (primary) {
    return {
      snapshot: primary.row.results as unknown as RankingSnapshotPayload,
      storedAt: primary.row.last_updated,
      resolvedKeyYear: primary.year,
      usedPriorYearKey: false,
    };
  }

  const fallbackYear = requestedYear - 1;
  const fallback = await findCountryRankingCacheRow(args.countrySlug, fallbackYear);
  if (!fallback) return null;

  return {
    snapshot: fallback.row.results as unknown as RankingSnapshotPayload,
    storedAt: fallback.row.last_updated,
    resolvedKeyYear: fallback.year,
    usedPriorYearKey: true,
  };
}

/** One row for SOSO AI advisor prompts (read from cache only). */
export interface AdvisorRankingUniversityRow {
  rank: number;
  university_name: string;
  country: string;
  official_website: string | null;
  world_rank?: number;
  source_url: string | null;
}

export type AdvisorUniversityListSource = "country-cache" | "world-cache";

function pickWorldRank(entry: RankingEntry): number | undefined {
  const raw = entry as RankingEntry & { world_rank?: unknown };
  return typeof raw.world_rank === "number" && Number.isFinite(raw.world_rank)
    ? raw.world_rank
    : undefined;
}

/**
 * Read-only: universities from SOSO ranking snapshots for a country (no live Serper/LLM call).
 * Prefers national cache when present; otherwise slices the world snapshot by country.
 */
export async function getAdvisorRankingUniversities(args: {
  filterCountry: string;
  year?: number;
  monthSnapshot?: string;
}): Promise<{
  rows: AdvisorRankingUniversityRow[];
  source: AdvisorUniversityListSource | null;
}> {
  const label = args.filterCountry.trim();
  if (!label) {
    return { rows: [], source: null };
  }

  const slug = canonicalCountryKey(label);
  const year = args.year ?? new Date().getUTCFullYear();

  const countryHit = await getCountryRankingSnapshotFromCache({
    countrySlug: slug,
    year,
    monthSnapshot: args.monthSnapshot,
  });

  if (countryHit && countryHit.snapshot.entries.length > 0) {
    return {
      source: "country-cache",
      rows: countryHit.snapshot.entries.map((e) => ({
        rank: e.rank,
        university_name: e.university_name,
        country: e.country,
        official_website: e.official_website,
        world_rank: pickWorldRank(e),
        source_url: e.source_url,
      })),
    };
  }

  const world = await getRankingSnapshot({
    dataset: "world-top-100",
    year: args.year,
    monthSnapshot: args.monthSnapshot,
  });

  if (!world) {
    return { rows: [], source: null };
  }

  const filtered = world.snapshot.entries
    .filter((e) => countryFilterMatches(e.country, label))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, Math.min(100, WORLD_RANKING_ENTRY_COUNT));

  if (filtered.length === 0) {
    return { rows: [], source: null };
  }

  return {
    source: "world-cache",
    rows: filtered.map((e) => ({
      rank: e.rank,
      university_name: e.university_name,
      country: e.country,
      official_website: e.official_website,
      world_rank: pickWorldRank(e),
      source_url: e.source_url,
    })),
  };
}

/**
 * Diverse global pool for AI advisor when no single country filter is set (not USA/UK-only).
 */
export async function getWorldwideAdvisorPoolUniversities(args?: {
  year?: number;
  monthSnapshot?: string;
  limit?: number;
}): Promise<{
  rows: AdvisorRankingUniversityRow[];
  source: AdvisorUniversityListSource | null;
}> {
  const world = await getRankingSnapshot({
    dataset: "world-top-100",
    year: args?.year ?? new Date().getUTCFullYear(),
    monthSnapshot: args?.monthSnapshot,
  });
  if (!world || world.snapshot.entries.length === 0) {
    return { rows: [], source: null };
  }

  const cap = Math.min(args?.limit ?? 60, world.snapshot.entries.length, WORLD_RANKING_ENTRY_COUNT);

  return {
    source: "world-cache",
    rows: world.snapshot.entries.slice(0, cap).map((e) => ({
      rank: e.rank,
      university_name: e.university_name,
      country: e.country,
      official_website: e.official_website,
      world_rank: pickWorldRank(e),
      source_url: e.source_url,
    })),
  };
}

/**
 * Returns a country-national ranking from cache, or builds and caches it (Serper + Azure OpenAI).
 */
export async function ensureCountryRankingSnapshot(args: {
  filterCountry: string;
  year: number;
  monthSnapshot?: string;
  /** Limit LLM+Hipo batch rounds (undefined = run until full 100). */
  maxBatches?: number;
}): Promise<RankingSnapshotLoadResult | null> {
  const slug = canonicalCountryKey(args.filterCountry);
  const lockKey = `${slug}:${args.year}:${args.monthSnapshot ?? "__latest__"}`;

  const runEnsure = async (): Promise<RankingSnapshotLoadResult | null> => {
    const cached = await getCountryRankingSnapshotFromCache({
      countrySlug: slug,
      year: args.year,
      monthSnapshot: args.monthSnapshot,
    });

    const full = COUNTRY_RANKING_ENTRY_COUNT;

    if (cached) {
      const next = getNextCountryFetchRank(cached.snapshot, full);
      if (next > full || cached.snapshot.entries.length >= full) {
        return cached;
      }
    }

    if (!SERPER_API_KEY || !isAzureOpenAiConfigured()) {
      return cached && cached.snapshot.entries.length >= 1 ? cached : null;
    }

    const current = await getCountryRankingSnapshotFromCache({
      countrySlug: slug,
      year: args.year,
      monthSnapshot: args.monthSnapshot,
    });
    if (current) {
      const nextAfterWait = getNextCountryFetchRank(current.snapshot, full);
      if (nextAfterWait > full || current.snapshot.entries.length >= full) {
        return current;
      }
    }

    const existing =
      current?.snapshot?.dataset === "country-top" && current.snapshot.country_key === slug
        ? current.snapshot
        : null;

    await buildCountryRankingSnapshot(args.filterCountry, args.year, full, existing, {
      maxBatches: args.maxBatches,
    });

    return getCountryRankingSnapshotFromCache({
      countrySlug: slug,
      year: args.year,
      monthSnapshot: args.monthSnapshot,
    });
  };

  const pending = countryRankingBuildLocks.get(lockKey);
  if (pending) return pending;

  const task = runEnsure();
  countryRankingBuildLocks.set(lockKey, task);
  void task.finally(() => {
    countryRankingBuildLocks.delete(lockKey);
  });
  return task;
}

async function buildSnapshot(dataset: CoreRankingDataset, year: number): Promise<RankingSnapshotPayload> {
  const monthSnapshot = normalizeMonthSnapshot();
  const query =
    dataset === "world-top-100"
      ? `world university ranking top ${WORLD_RANKING_ENTRY_COUNT} ${year} site:timeshighereducation.com OR site:topuniversities.com OR site:usnews.com`
      : `south korea top 10 university ranking ${year} site:timeshighereducation.com OR site:topuniversities.com`;

  const searchResults = await searchWeb(query, 12);
  const selectedSources = searchResults.slice(0, 5);
  if (selectedSources.length === 0) {
    throw new Error(`No trusted sources found for ${dataset}.`);
  }

  const sourcesWithExcerpts = await Promise.all(
    selectedSources.map(async (item) => ({
      ...item,
      excerpt: await fetchSourceExcerpt(item.link),
    })),
  );

  const extracted = await extractRankingsWithLlm({
    dataset,
    year,
    sources: sourcesWithExcerpts,
  });
  const targetCount = dataset === "world-top-100" ? WORLD_RANKING_ENTRY_COUNT : 10;
  if (extracted.length < targetCount) {
    throw new Error(
      `Incomplete ranking extraction for ${dataset}: expected ${targetCount}, got ${extracted.length}.`,
    );
  }
  const enriched = await Promise.all(extracted.map((entry) => enrichWithHipo(entry)));

  return {
    dataset,
    year,
    month_snapshot: monthSnapshot,
    generated_at: new Date().toISOString(),
    source_strategy: "serper+azure",
    entries: enriched.sort((a, b) => a.rank - b.rank),
  };
}

async function saveSnapshot(snapshot: RankingSnapshotPayload) {
  if (snapshot.dataset === "country-top") {
    throw new Error("Use saveCountryRanking for country snapshots.");
  }
  const monthKey = toCacheKey(snapshot.dataset, snapshot.month_snapshot, snapshot.year);
  const latestKey = toLatestCacheKey(snapshot.dataset, snapshot.year);
  const results = snapshot as unknown as Prisma.InputJsonValue;

  await prisma.searchCache.upsert({
    where: { query: monthKey },
    update: { results },
    create: { query: monthKey, results },
  });

  await prisma.searchCache.upsert({
    where: { query: latestKey },
    update: { results },
    create: { query: latestKey, results },
  });

  return { monthKey, latestKey };
}

export async function syncMonthlyRankings(targetYear = new Date().getUTCFullYear()) {
  if (!SERPER_API_KEY || !isAzureOpenAiConfigured()) {
    throw new Error("SERPER_API_KEY or Azure OpenAI configuration is missing.");
  }

  const [worldSnapshot, koreaSnapshot] = await Promise.all([
    buildSnapshot("world-top-100", targetYear),
    buildSnapshot("south-korea-top-10", targetYear),
  ]);

  const [worldCache, koreaCache] = await Promise.all([
    saveSnapshot(worldSnapshot),
    saveSnapshot(koreaSnapshot),
  ]);

  return {
    month_snapshot: normalizeMonthSnapshot(),
    world: {
      ...worldCache,
      count: worldSnapshot.entries.length,
    },
    south_korea: {
      ...koreaCache,
      count: koreaSnapshot.entries.length,
    },
  };
}

export type RankingSnapshotLoadResult = {
  snapshot: RankingSnapshotPayload;
  storedAt: Date;
  /** Calendar year used for the cache key (may differ from snapshot.year inside JSON). */
  resolvedKeyYear: number;
  /** True when the requested calendar year had no row but the previous year did. */
  usedPriorYearKey: boolean;
};

async function findRankingCacheRow(dataset: CoreRankingDataset, year: number, monthSnapshot?: string) {
  const query = monthSnapshot
    ? toCacheKey(dataset, monthSnapshot, year)
    : toLatestCacheKey(dataset, year);
  const row = await prisma.searchCache.findUnique({ where: { query } });
  if (!row) return null;
  return { row, query, year };
}

/** Reads only from `search_cache` — never calls Serper or Azure OpenAI. */
export async function getRankingSnapshot(args: {
  dataset: CoreRankingDataset;
  year?: number;
  monthSnapshot?: string;
}): Promise<RankingSnapshotLoadResult | null> {
  const requestedYear = args.year ?? new Date().getUTCFullYear();

  if (args.monthSnapshot) {
    const hit = await findRankingCacheRow(args.dataset, requestedYear, args.monthSnapshot);
    if (!hit) return null;
    return {
      snapshot: hit.row.results as unknown as RankingSnapshotPayload,
      storedAt: hit.row.last_updated,
      resolvedKeyYear: hit.year,
      usedPriorYearKey: false,
    };
  }

  const primary = await findRankingCacheRow(args.dataset, requestedYear);
  if (primary) {
    return {
      snapshot: primary.row.results as unknown as RankingSnapshotPayload,
      storedAt: primary.row.last_updated,
      resolvedKeyYear: primary.year,
      usedPriorYearKey: false,
    };
  }

  const fallbackYear = requestedYear - 1;
  const fallback = await findRankingCacheRow(args.dataset, fallbackYear);
  if (!fallback) return null;

  return {
    snapshot: fallback.row.results as unknown as RankingSnapshotPayload,
    storedAt: fallback.row.last_updated,
    resolvedKeyYear: fallback.year,
    usedPriorYearKey: true,
  };
}

export async function hasMonthlySnapshots(year = new Date().getUTCFullYear()) {
  const month = normalizeMonthSnapshot();
  const [world, korea] = await Promise.all([
    prisma.searchCache.findUnique({
      where: {
        query: toCacheKey("world-top-100", month, year),
      },
      select: { id: true },
    }),
    prisma.searchCache.findUnique({
      where: {
        query: toCacheKey("south-korea-top-10", month, year),
      },
      select: { id: true },
    }),
  ]);

  return Boolean(world && korea);
}
