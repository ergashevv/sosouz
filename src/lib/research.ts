import { prisma } from "./prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@prisma/client";
import type { Language } from "@/lib/i18n";
import { getResearchTuitionOverride } from "@/lib/university-research-overrides";
import {
  clampResearchUrlToOfficial,
  collectOfficialBases,
  officialHomeUrl,
  urlMatchesOfficialBases,
} from "@/lib/official-url";

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const CACHE_TTL_DAYS = 14;
/** Min interval between Serper+Gemini runs for the same university+language (per DB row). */
const RESEARCH_REFRESH_COOLDOWN_MS =
  Number(process.env.RESEARCH_REFRESH_COOLDOWN_MS) > 0
    ? Number(process.env.RESEARCH_REFRESH_COOLDOWN_MS)
    : 6 * 60 * 60 * 1000;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export type PerformResearchOptions = {
  /** When true, bypass DB-only fast path and cooldown (for explicit refresh). */
  forceRefresh?: boolean;
};

function coerceLanguage(value: string | undefined): Language {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "en";
}

function toLocalizedCacheKey(university: string, lang: Language): string {
  return `${university}::${lang}`;
}

/** Apply curated tuition text on read so stale cache rows do not show withdrawn figures. */
function withTuitionOverride<T extends { tuition_fees?: string | null }>(
  uni: string,
  language: Language,
  row: T | null,
): T | null {
  if (!row) return row;
  const override = getResearchTuitionOverride(uni, language);
  if (!override) return row;
  return { ...row, tuition_fees: override };
}

interface ResearchSource {
  title: string;
  link: string;
  snippet: string;
}

interface ProgramLink {
  name: string;
  link: string;
}

export interface ResearchOutput {
  annual_tuition_usd: string;
  available_scholarships: { name: string; link: string }[];
  programs: ProgramLink[];
  admission_requirements: Record<string, string>;
  admission_deadline: string;
  detailed_overview: string;
  confidence_score: number;
}

function computeNextRefresh(ttlDays = CACHE_TTL_DAYS) {
  const next = new Date();
  next.setDate(next.getDate() + ttlDays);
  return next;
}

function hasMinimumDetails(details: unknown) {
  const payload = (details || {}) as {
    detailed_overview?: unknown;
    tuition_fees?: unknown;
    admission_deadline?: unknown;
    scholarships?: unknown;
    programs?: unknown;
  };

  return Boolean(
    payload.detailed_overview &&
      payload.tuition_fees &&
      payload.admission_deadline &&
      payload.scholarships &&
      Array.isArray(payload.programs) &&
      payload.programs.length > 0 &&
      payload.programs.some((program) => {
        if (!program || typeof program !== "object") return false;
        const candidate = program as { link?: unknown };
        return typeof candidate.link === "string" && candidate.link.trim().length > 0;
      }),
  );
}

function buildSourceLinks(rawResults: unknown): ResearchSource[] {
  const results = Array.isArray(rawResults) ? rawResults : [];
  const unique = new Set<string>();
  const sources: ResearchSource[] = [];

  for (const item of results) {
    if (sources.length >= 8) break;
    if (!item || typeof item !== "object") continue;

    const candidate = item as { title?: unknown; link?: unknown; snippet?: unknown };
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const link = typeof candidate.link === "string" ? candidate.link.trim() : "";
    const snippet = typeof candidate.snippet === "string" ? candidate.snippet.trim() : "";
    if (!link || unique.has(link)) continue;

    unique.add(link);
    sources.push({
      title: title || "Untitled source",
      link,
      snippet: snippet || "No snippet provided.",
    });
  }

  return sources;
}

function filterOrganicByOfficialHost(organic: unknown[], bases: string[]): unknown[] {
  if (!bases.length) return organic;
  return organic.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const link = (item as { link?: unknown }).link;
    if (typeof link !== "string" || !link.trim()) return false;
    return urlMatchesOfficialBases(link, bases);
  });
}

function clampResearchLinks(output: ResearchOutput, bases: string[], homeUrl: string): ResearchOutput {
  return {
    ...output,
    programs: output.programs.map((p) => ({
      ...p,
      link: clampResearchUrlToOfficial(p.link, bases, homeUrl),
    })),
    available_scholarships: output.available_scholarships.map((s) => ({
      ...s,
      link: clampResearchUrlToOfficial(s.link, bases, homeUrl),
    })),
  };
}

function extractJsonObject(input: string) {
  const cleaned = input.replace(/```json|```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return cleaned;
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function normalizeResearchOutput(
  raw: unknown,
  ctx: { university: string; homeUrl: string; bases: string[] },
): ResearchOutput {
  const safeRaw = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const linkFallback = ctx.homeUrl;

  const rawScholarships = Array.isArray(safeRaw.available_scholarships)
    ? safeRaw.available_scholarships
    : [];
  const scholarships = rawScholarships
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const link = typeof record.link === "string" ? record.link.trim() : "";
      if (!name) return null;

      return {
        name,
        link: link ? clampResearchUrlToOfficial(link, ctx.bases, linkFallback) : linkFallback,
      };
    })
    .filter((item): item is { name: string; link: string } => Boolean(item));

  const rawPrograms = Array.isArray(safeRaw.programs) ? safeRaw.programs : [];
  const programs = rawPrograms
    .map((program) => {
      if (typeof program === "string") {
        const name = program.trim();
        if (!name) return null;
        return {
          name,
          link: linkFallback,
        };
      }

      if (!program || typeof program !== "object") return null;
      const candidate = program as Record<string, unknown>;
      const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
      const link = typeof candidate.link === "string" ? candidate.link.trim() : "";
      if (!name) return null;

      return {
        name,
        link: link ? clampResearchUrlToOfficial(link, ctx.bases, linkFallback) : linkFallback,
      };
    })
    .filter((program): program is ProgramLink => Boolean(program))
    .slice(0, 12);

  const requirementsRaw =
    safeRaw.admission_requirements && typeof safeRaw.admission_requirements === "object"
      ? (safeRaw.admission_requirements as Record<string, unknown>)
      : {};
  const admissionRequirements = Object.entries(requirementsRaw).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (!key) return acc;
      const normalizedValue =
        typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : "";

      if (normalizedValue.trim()) {
        acc[key] = normalizedValue.trim();
      }

      return acc;
    },
    {},
  );

  const confidenceScore =
    typeof safeRaw.confidence_score === "number" && Number.isFinite(safeRaw.confidence_score)
      ? Math.max(0, Math.min(1, safeRaw.confidence_score))
      : 0.6;

  return {
    annual_tuition_usd:
      typeof safeRaw.annual_tuition_usd === "string" && safeRaw.annual_tuition_usd.trim()
        ? safeRaw.annual_tuition_usd.trim()
        : "$15,000 - $35,000 (Estimate)",
    available_scholarships:
      scholarships.length > 0
        ? scholarships
        : [{ name: "International Excellence Award", link: linkFallback }],
    programs:
      programs.length > 0
        ? programs
        : [
            {
              name: "Information not specified by official sources",
              link: linkFallback,
            },
          ],
    admission_requirements:
      Object.keys(admissionRequirements).length > 0
        ? admissionRequirements
        : { IELTS: "6.5+", GPA: "3.0+" },
    admission_deadline:
      typeof safeRaw.admission_deadline === "string" && safeRaw.admission_deadline.trim()
        ? safeRaw.admission_deadline.trim()
        : "Rolling Admissions",
    detailed_overview:
      typeof safeRaw.detailed_overview === "string" && safeRaw.detailed_overview.trim()
        ? safeRaw.detailed_overview.trim()
        : `${ctx.university} offers world-class education with a focus on student success and global leadership.`,
    confidence_score: confidenceScore,
  };
}

function isMissingColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  if (candidate.code === "P2022") return true;
  const msg = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("last_ai_refresh"));
}

/** Returns true if this request may call Serper/Gemini; false if another refresh is in-flight or in cooldown. */
async function tryClaimAiRefresh(cacheKey: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - RESEARCH_REFRESH_COOLDOWN_MS);
  try {
    const result = await prisma.universityDetails.updateMany({
      where: {
        university_name: cacheKey,
        OR: [{ last_ai_refresh_attempt_at: null }, { last_ai_refresh_attempt_at: { lt: cutoff } }],
      } as unknown as Prisma.UniversityDetailsWhereInput,
      data: { last_ai_refresh_attempt_at: new Date() } as unknown as Prisma.UniversityDetailsUpdateManyMutationInput,
    });
    return result.count > 0;
  } catch (error) {
    if (isMissingColumnError(error)) {
      return true;
    }
    console.error("tryClaimAiRefresh failed:", error);
    return true;
  }
}

/** Use `findFirst` (not `findUnique`) so lookups by name work even if the generated client’s unique constraints are out of sync with `schema.prisma`. */
async function findCachedDetails(cacheKey: string) {
  const fullSelect = {
    id: true,
    university_name: true,
    domain: true,
    country: true,
    tuition_fees: true,
    scholarships: true,
    admission_requirements: true,
    admission_deadline: true,
    detailed_overview: true,
    last_updated: true,
    programs: true,
    source_links: true,
    data_confidence: true,
    refresh_status: true,
    next_refresh_at: true,
    last_ai_refresh_attempt_at: true,
  };

  try {
    return await prisma.universityDetails.findFirst({
      where: { university_name: cacheKey },
      select: fullSelect,
    });
  } catch (error) {
    if (isMissingColumnError(error)) {
      return await prisma.universityDetails.findFirst({
        where: { university_name: cacheKey },
        select: {
          id: true,
          university_name: true,
          domain: true,
          country: true,
          tuition_fees: true,
          scholarships: true,
          admission_requirements: true,
          admission_deadline: true,
          detailed_overview: true,
          last_updated: true,
          programs: true,
          source_links: true,
          data_confidence: true,
          refresh_status: true,
          next_refresh_at: true,
        },
      });
    }
    throw error;
  }
}

type CachedResearchDetailsRow = NonNullable<Awaited<ReturnType<typeof findCachedDetails>>>;

/** Coalesce concurrent Serper+Gemini runs for the same cache key (single-flight). */
const researchInflight = new Map<string, Promise<CachedResearchDetailsRow | null>>();

async function generateWithGemini(prompt: string) {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const aiResult = await model.generateContent(prompt);
  return aiResult.response.text();
}

async function upsertLegacyResearch(
  cacheKey: string,
  country: string | undefined,
  domain: string | undefined,
  structuredData: ResearchOutput,
) {
  return prisma.universityDetails.upsert({
    where: { university_name: cacheKey },
    update: {
      tuition_fees: structuredData.annual_tuition_usd,
      scholarships: structuredData.available_scholarships,
      admission_requirements: structuredData.admission_requirements,
      admission_deadline: structuredData.admission_deadline,
      detailed_overview: structuredData.detailed_overview,
      domain: domain || null,
      country: country || null,
    },
    create: {
      university_name: cacheKey,
      tuition_fees: structuredData.annual_tuition_usd,
      scholarships: structuredData.available_scholarships,
      admission_requirements: structuredData.admission_requirements,
      admission_deadline: structuredData.admission_deadline,
      detailed_overview: structuredData.detailed_overview,
      domain: domain || null,
      country: country || null,
    },
  });
}

export async function performResearch(
  university: string,
  country?: string,
  domain?: string,
  lang: Language = "en",
  trust?: { domains?: string[] | null; web_pages?: string[] | null },
  options?: PerformResearchOptions,
) {
  const safeLang = coerceLanguage(lang);
  const cacheKey = toLocalizedCacheKey(university, safeLang);
  let cachedDetails: CachedResearchDetailsRow | null = null;
  try {
    cachedDetails = await findCachedDetails(cacheKey);
  } catch (error) {
    console.error("Cache lookup failed:", error);
  }

  if (cachedDetails && hasMinimumDetails(cachedDetails) && !options?.forceRefresh) {
    return withTuitionOverride(university, safeLang, cachedDetails);
  }

  if (!SERPER_API_KEY || !GEMINI_API_KEY) {
    if (cachedDetails && hasMinimumDetails(cachedDetails)) {
      return withTuitionOverride(university, safeLang, cachedDetails);
    }
    if (cachedDetails) return withTuitionOverride(university, safeLang, cachedDetails);
    console.error("Missing SERPER_API_KEY or GEMINI_API_KEY.");
    return null;
  }

  const needsRemoteFetch =
    !cachedDetails || !hasMinimumDetails(cachedDetails) || Boolean(options?.forceRefresh);

  if (!needsRemoteFetch) {
    return withTuitionOverride(university, safeLang, cachedDetails);
  }

  if (cachedDetails && !options?.forceRefresh) {
    const claimed = await tryClaimAiRefresh(cacheKey);
    if (!claimed) {
      return withTuitionOverride(university, safeLang, cachedDetails);
    }
  }

  const pending = researchInflight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const remoteTask = (async (): Promise<CachedResearchDetailsRow | null> => {
    try {
      const bases = collectOfficialBases({
        primaryDomain: domain || "",
        domains: trust?.domains,
        web_pages: trust?.web_pages,
      });
      const domainOnly =
        domain && domain !== "unknown"
          ? domain.replace(/^https?:\/\//i, "").split("/")[0].replace(/^www\./i, "")
          : "";
      const homeUrl =
        officialHomeUrl(bases, trust?.web_pages) ||
        (domainOnly ? `https://${domainOnly}/` : "");
      const safeHome =
        homeUrl ||
        (() => {
          const p = trust?.web_pages?.[0];
          if (!p) return "";
          try {
            return new URL(p).origin + "/";
          } catch {
            return "";
          }
        })();
      const linkClampFallback =
        safeHome ||
        (domainOnly ? `https://${domainOnly}/` : "") ||
        (bases[0] ? `https://${bases[0]}/` : "");

      if (!linkClampFallback.trim()) {
        throw new Error("performResearch: could not resolve official homepage for link validation");
      }

      const siteConstraint = domain && domain !== "unknown" ? ` site:${domain}` : "";
      const query =
        `Official tuition fees, scholarships, study programs, admission requirements, and deadlines ` +
        `for ${university} ${country || ""} 2026${siteConstraint}`;

      const serperResponse = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 8 }),
      });

      if (!serperResponse.ok) {
        throw new Error("Search provider error");
      }

      const serperData: unknown = await serperResponse.json();
      const searchResults =
        serperData && typeof serperData === "object" && Array.isArray((serperData as { organic?: unknown }).organic)
          ? (serperData as { organic: unknown[] }).organic
          : [];
      const organicForOfficial = filterOrganicByOfficialHost(searchResults, bases);
      const organicForGemini =
        organicForOfficial.length > 0 ? organicForOfficial : searchResults.slice(0, 8);
      const sourcesForStore = buildSourceLinks(
        organicForOfficial.length > 0 ? organicForOfficial : [],
      );
      const snippetSources = buildSourceLinks(organicForGemini.slice(0, 8));
      const snippetBlock = snippetSources
        .slice(0, 5)
        .map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}`)
        .join("\n\n");

      const officialHomeLine = safeHome
        ? `Official homepage (use this exact URL when a specific page URL is unknown): ${safeHome}`
        : "Official homepage: not available — keep confidence_score low.";

      const prompt = `You are a senior education analyst. Build a concise but complete university profile.

University: ${university}
Country: ${country || "unknown"}
Official domain: ${domain || "unknown"}
Target language for descriptive text: ${safeLang.toUpperCase()}

Use the provided sources first. If data is missing, make conservative estimates and label uncertainty through confidence_score.

Return ONLY valid JSON with this exact schema:
{
  "annual_tuition_usd": "string",
  "available_scholarships": [{ "name": "string", "link": "string" }],
  "programs": [{ "name": "string", "link": "string" }],
  "admission_requirements": { "requirement": "value" },
  "admission_deadline": "string",
  "detailed_overview": "string",
  "confidence_score": 0.0
}

Constraints:
- detailed_overview must be 4-5 sentences in ${safeLang.toUpperCase()}.
- Include 4-8 programs. Each program "link" MUST be copied exactly from a URL in Sources, OR ${officialHomeLine}
- Never invent pathnames or guess URLs. Wrong links break the site.
- Include 2-5 scholarships if available; each scholarship "link" MUST be a URL from Sources or the official homepage above.
- confidence_score must be between 0 and 1; lower it if you had to fall back to the homepage only.
- Do not use markdown.

Sources:
${snippetBlock || "No external snippets available."}`;

      const text = await generateWithGemini(prompt);
      const parsed = JSON.parse(extractJsonObject(text));
      const structuredRaw = normalizeResearchOutput(parsed, {
        university,
        homeUrl: linkClampFallback,
        bases,
      });
      const structuredData = clampResearchLinks(structuredRaw, bases, linkClampFallback);
      const tuitionForStorage =
        getResearchTuitionOverride(university, safeLang) ?? structuredData.annual_tuition_usd;

      try {
        return withTuitionOverride(
          university,
          safeLang,
          await prisma.universityDetails.upsert({
            where: { university_name: cacheKey },
            update: {
              tuition_fees: tuitionForStorage,
              scholarships: structuredData.available_scholarships,
              programs: structuredData.programs as unknown as Prisma.InputJsonValue,
              admission_requirements: structuredData.admission_requirements,
              admission_deadline: structuredData.admission_deadline,
              detailed_overview: structuredData.detailed_overview,
              source_links: sourcesForStore as unknown as Prisma.InputJsonValue,
              data_confidence: structuredData.confidence_score,
              refresh_status: "fresh",
              next_refresh_at: computeNextRefresh(),
              last_ai_refresh_attempt_at: null,
              domain: domain || null,
              country: country || null,
            } as unknown as Prisma.UniversityDetailsUpdateInput,
            create: {
              university_name: cacheKey,
              tuition_fees: tuitionForStorage,
              scholarships: structuredData.available_scholarships,
              programs: structuredData.programs as unknown as Prisma.InputJsonValue,
              admission_requirements: structuredData.admission_requirements,
              admission_deadline: structuredData.admission_deadline,
              detailed_overview: structuredData.detailed_overview,
              source_links: sourcesForStore as unknown as Prisma.InputJsonValue,
              data_confidence: structuredData.confidence_score,
              refresh_status: "fresh",
              next_refresh_at: computeNextRefresh(),
              last_ai_refresh_attempt_at: null,
              domain: domain || null,
              country: country || null,
            } as unknown as Prisma.UniversityDetailsCreateInput,
          }),
        );
      } catch (error) {
        if (isMissingColumnError(error)) {
          return withTuitionOverride(
            university,
            safeLang,
            await upsertLegacyResearch(cacheKey, country, domain, {
              ...structuredData,
              annual_tuition_usd: tuitionForStorage,
            }),
          );
        }
        throw error;
      }
    } catch (error) {
      console.error("Research logic error:", error);
      if (cachedDetails) {
        const debounceNext = new Date(Date.now() - RESEARCH_REFRESH_COOLDOWN_MS + 15 * 60 * 1000);
        try {
          await prisma.universityDetails.update({
            where: { university_name: cacheKey },
            data: {
              refresh_status: "stale",
              last_ai_refresh_attempt_at: debounceNext,
            } as unknown as Prisma.UniversityDetailsUpdateInput,
          });
        } catch (updateErr) {
          if (isMissingColumnError(updateErr)) {
            try {
              await prisma.universityDetails.update({
                where: { university_name: cacheKey },
                data: { refresh_status: "stale" },
              });
            } catch {
              /* ignore */
            }
          }
        }
        try {
          const again = await findCachedDetails(cacheKey);
          if (again) return withTuitionOverride(university, safeLang, again);
        } catch {
          /* ignore */
        }
        return withTuitionOverride(university, safeLang, cachedDetails);
      }
      return null;
    }
  })();

  researchInflight.set(cacheKey, remoteTask);
  void remoteTask.finally(() => researchInflight.delete(cacheKey));
  return remoteTask;
}
