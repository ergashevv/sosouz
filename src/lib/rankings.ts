import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SERPER_SEARCH_ENDPOINT = "https://google.serper.dev/search";
const HIPO_BASE_URL = "http://universities.hipolabs.com/search";
const CACHE_NAMESPACE = "rankings:serper-gemini";
const TRUSTED_DOMAINS = [
  "timeshighereducation.com",
  "topuniversities.com",
  "shanghairanking.com",
  "usnews.com",
  "wikipedia.org",
];

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

type RankingDataset = "world-top-100" | "south-korea-top-10";

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
  year: number;
  month_snapshot: string;
  generated_at: string;
  source_strategy: "serper+gemini";
  entries: RankingEntry[];
}

function normalizeMonthSnapshot(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toCacheKey(dataset: RankingDataset, monthSnapshot: string, year: number) {
  return `${CACHE_NAMESPACE}:${dataset}:${year}:${monthSnapshot}`;
}

function toLatestCacheKey(dataset: RankingDataset, year: number) {
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
  return text.slice(0, 18000);
}

async function extractRankingsWithGemini(args: {
  dataset: RankingDataset;
  year: number;
  sources: Array<{ title: string; link: string; snippet: string; excerpt: string }>;
}): Promise<RankingEntry[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const targetCount = args.dataset === "world-top-100" ? 100 : 10;
  const datasetLabel = args.dataset === "world-top-100" ? "world top 100" : "South Korea top 10";

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
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
- Prefer official university website for official_website.
- confidence must be between 0 and 1.
- Do not include markdown or explanations.

Sources:
${sourceBlock}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
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

async function buildSnapshot(dataset: RankingDataset, year: number): Promise<RankingSnapshotPayload> {
  const monthSnapshot = normalizeMonthSnapshot();
  const query =
    dataset === "world-top-100"
      ? `world top 100 university ranking ${year} site:timeshighereducation.com OR site:topuniversities.com`
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

  const extracted = await extractRankingsWithGemini({
    dataset,
    year,
    sources: sourcesWithExcerpts,
  });
  const targetCount = dataset === "world-top-100" ? 100 : 10;
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
    source_strategy: "serper+gemini",
    entries: enriched.sort((a, b) => a.rank - b.rank),
  };
}

async function saveSnapshot(snapshot: RankingSnapshotPayload) {
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
  if (!SERPER_API_KEY || !GEMINI_API_KEY) {
    throw new Error("SERPER_API_KEY or GEMINI_API_KEY is missing.");
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

export async function getRankingSnapshot(args: {
  dataset: RankingDataset;
  year?: number;
  monthSnapshot?: string;
}) {
  const year = args.year || new Date().getUTCFullYear();
  const query = args.monthSnapshot
    ? toCacheKey(args.dataset, args.monthSnapshot, year)
    : toLatestCacheKey(args.dataset, year);

  const row = await prisma.searchCache.findUnique({ where: { query } });
  if (!row) return null;

  return row.results as unknown as RankingSnapshotPayload;
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
