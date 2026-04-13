import "server-only";

import { Buffer } from "buffer";
import { getAdvisorRankingUniversities, getWorldwideAdvisorPoolUniversities } from "@/lib/rankings";
import { canonicalCountryKey } from "@/lib/geoFilters";
import {
  generateAzureChatCompletionText,
  getAzureOpenAIDeploymentByPurpose,
  isAzureOpenAiConfigured,
} from "@/lib/azure-openai";

const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const ADVISOR_MAX_PROMPT_UNIVERSITIES = Math.min(
  60,
  Math.max(10, Number(process.env.ADVISOR_MAX_PROMPT_UNIVERSITIES || 30)),
);
const ADVISOR_MAX_MESSAGE_CHARS = Math.min(
  1600,
  Math.max(300, Number(process.env.ADVISOR_MAX_MESSAGE_CHARS || 700)),
);

export type AdvisorRole = "user" | "assistant";

export interface AdvisorMessage {
  role: AdvisorRole;
  content: string;
}

export interface AdvisorLink {
  title: string;
  url: string;
}

export interface AdvisorContext {
  name?: string;
  country?: string;
  domain?: string;
  officialWebsite?: string | null;
  programs?: string[];
  links?: AdvisorLink[];
  /** National / list position when opened from rankings UI */
  nationalRank?: number;
  worldRank?: number;
  rankingSourceUrl?: string | null;
}

type UiLanguage = "uz" | "ru" | "en";

function extractErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const statusValue = (error as { status?: unknown; statusCode?: unknown }).status;
  if (typeof statusValue === "number" && Number.isFinite(statusValue)) return statusValue;
  const statusCodeValue = (error as { status?: unknown; statusCode?: unknown }).statusCode;
  if (typeof statusCodeValue === "number" && Number.isFinite(statusCodeValue)) return statusCodeValue;
  return null;
}

function getLocalizedBusyMessage(language: UiLanguage): string {
  if (language === "ru") {
    return "Сервис ИИ временно перегружен. Пожалуйста, попробуйте снова через 10-20 секунд.";
  }
  if (language === "en") {
    return "AI service is temporarily busy. Please try again in 10-20 seconds.";
  }
  return "AI xizmati hozir band. Iltimos, 10-20 soniyadan keyin yana urinib ko'ring.";
}

function getLocalizedTemporaryErrorMessage(language: UiLanguage): string {
  if (language === "ru") {
    return "Временная ошибка AI сервиса. Попробуйте еще раз немного позже.";
  }
  if (language === "en") {
    return "Temporary AI service error. Please try again shortly.";
  }
  return "AI xizmatida vaqtinchalik xatolik. Birozdan keyin qayta urinib ko'ring.";
}

function getLocalizedGenericErrorMessage(language: UiLanguage): string {
  if (language === "ru") {
    return "Не удалось получить ответ AI. Попробуйте снова.";
  }
  if (language === "en") {
    return "Could not get AI response. Please try again.";
  }
  return "AI javobini olishda muammo bo'ldi. Qayta urinib ko'ring.";
}

function getLocalizedConfigErrorMessage(language: UiLanguage): string {
  if (language === "ru") {
    return "AI servisda konfiguratsiya xatosi bor (model yoki API kalit). Iltimos, admin bilan tekshiring.";
  }
  if (language === "en") {
    return "AI service has a configuration issue (model or API key). Please contact admin.";
  }
  return "AI xizmatida sozlama xatosi bor (model yoki API key). Iltimos, admin bilan tekshiring.";
}

function isModelNotFoundError(normalizedMessage: string): boolean {
  return (
    normalizedMessage.includes("model") &&
    (normalizedMessage.includes("not found") ||
      normalizedMessage.includes("unknown model") ||
      normalizedMessage.includes("is not supported") ||
      normalizedMessage.includes("unsupported model") ||
      normalizedMessage.includes("does not exist"))
  );
}

function isAuthOrConfigError(normalizedMessage: string): boolean {
  return (
    normalizedMessage.includes("api key") ||
    normalizedMessage.includes("permission denied") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("invalid argument") ||
    isModelNotFoundError(normalizedMessage)
  );
}

export function toUserFacingAiError(
  error: unknown,
  language: UiLanguage = "uz",
): { status: number; message: string } {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();
  const status = extractErrorStatus(error);

  if (
    status === 503 ||
    normalized.includes("503") ||
    normalized.includes("service unavailable") ||
    normalized.includes("high demand") ||
    normalized.includes("overloaded")
  ) {
    return { status: 503, message: getLocalizedBusyMessage(language) };
  }

  if (status === 429 || normalized.includes("429") || normalized.includes("rate limit")) {
    return { status: 429, message: getLocalizedBusyMessage(language) };
  }

  if (status && status >= 500) {
    return { status: 503, message: getLocalizedTemporaryErrorMessage(language) };
  }

  if (normalized.includes("ai service is not configured")) {
    if (language === "ru") return { status: 500, message: "AI сервис еще не настроен на сервере." };
    if (language === "en") return { status: 500, message: "AI service is not configured on the server yet." };
    return { status: 500, message: "AI xizmati serverda hali sozlanmagan." };
  }

  if (isAuthOrConfigError(normalized)) {
    return { status: 500, message: getLocalizedConfigErrorMessage(language) };
  }

  return { status: 500, message: getLocalizedGenericErrorMessage(language) };
}

interface PlatformUniversity {
  name: string;
  country: string;
  website: string | null;
  national_rank?: number;
  world_rank?: number;
  ranking_source_url?: string | null;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2];
  const byteLength = Buffer.byteLength(base64, "base64");
  if (byteLength > MAX_SCREENSHOT_BYTES) return null;

  return { mimeType, base64 };
}

async function fetchHipoUniversities(country: string): Promise<PlatformUniversity[]> {
  const target = country.trim();
  if (!target) return [];

  const url = new URL("http://universities.hipolabs.com/search");
  url.searchParams.set("country", target);

  let response: Response;
  try {
    response = await fetch(url.toString(), { next: { revalidate: 3600 } });
  } catch {
    return [];
  }
  if (!response.ok) return [];

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const name = typeof item.name === "string" ? item.name.trim() : "";
      const webPages = Array.isArray(item.web_pages) ? item.web_pages : [];
      const website = webPages.find((entry): entry is string => typeof entry === "string") || null;
      return {
        name,
        country: typeof item.country === "string" ? item.country : target,
        website,
      };
    })
    .filter((item) => item.name)
    .slice(0, 80);
}

async function resolvePlatformUniversities(country: string): Promise<{
  universities: PlatformUniversity[];
  listOrigin: "soso-country-ranking" | "soso-world-slice" | "hipolabs" | "global-world-pool";
}> {
  const target = country.trim();
  if (!target) {
    try {
      const pool = await getWorldwideAdvisorPoolUniversities({ limit: ADVISOR_MAX_PROMPT_UNIVERSITIES });
      if (pool.rows.length > 0) {
        return {
          listOrigin: "global-world-pool",
          universities: pool.rows.map((row) => ({
            name: row.university_name,
            country: row.country,
            website: row.official_website,
            national_rank: row.rank,
            world_rank: row.world_rank,
            ranking_source_url: row.source_url,
          })),
        };
      }
    } catch {
      // Ranking cache may be empty on fresh deploys.
    }
    return { universities: [], listOrigin: "global-world-pool" };
  }

  try {
    const ranking = await getAdvisorRankingUniversities({ filterCountry: target });
    if (ranking.rows.length > 0) {
      const listOrigin = ranking.source === "country-cache" ? "soso-country-ranking" : "soso-world-slice";
      return {
        listOrigin,
        universities: ranking.rows.slice(0, 80).map((row) => ({
          name: row.university_name,
          country: row.country,
          website: row.official_website,
          national_rank: row.rank,
          world_rank: row.world_rank,
          ranking_source_url: row.source_url,
        })),
      };
    }
  } catch {
    // Degrade gracefully: ranking cache can be unavailable transiently.
  }

  return {
    listOrigin: "hipolabs",
    universities: await fetchHipoUniversities(target),
  };
}

function domainFromWebsite(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function buildConversationLog(messages: AdvisorMessage[]) {
  return messages
    .map((message) => {
      const clipped = message.content.length > ADVISOR_MAX_MESSAGE_CHARS
        ? `${message.content.slice(0, ADVISOR_MAX_MESSAGE_CHARS)}...`
        : message.content;
      return `${message.role === "assistant" ? "AI" : "User"}: ${clipped}`;
    })
    .join("\n");
}

function buildSystemPrompt(
  language: "uz" | "ru" | "en",
  recommendationCountry: string,
  listOrigin: "soso-country-ranking" | "soso-world-slice" | "hipolabs" | "global-world-pool",
  platformUniversities: PlatformUniversity[],
  context?: AdvisorContext,
) {
  const resolvedDomain =
    context?.domain ||
    domainFromWebsite(context?.officialWebsite ?? null) ||
    "unknown";

  const contextBlock = JSON.stringify(
    {
      focused_university: context?.name
        ? {
            name: context.name,
            country: context.country || recommendationCountry,
            domain: resolvedDomain,
            official_website: context.officialWebsite || null,
            national_rank: context.nationalRank ?? null,
            world_rank: context.worldRank ?? null,
            ranking_source_url: context.rankingSourceUrl || null,
            top_programs: context.programs || [],
          }
        : null,
      platform_links: context?.links || [],
    },
    null,
    2,
  );

  const universityList = platformUniversities
    .slice(0, ADVISOR_MAX_PROMPT_UNIVERSITIES)
    .map((uni, index) => ({
    index: index + 1,
    name: uni.name,
    country: uni.country,
    website: uni.website,
    national_rank: uni.national_rank ?? null,
    world_rank: uni.world_rank ?? null,
    ranking_source_url: uni.ranking_source_url ?? null,
  }));

  const originNote =
    listOrigin === "soso-country-ranking"
      ? "PLATFORM_UNIVERSITIES is from SOSO national ranking cache (trusted list for this country). Prefer higher-ranked options when they fit the student's goals. Ranks are informational only—do not invent extra ranking claims."
      : listOrigin === "soso-world-slice"
        ? "PLATFORM_UNIVERSITIES is the intersection of SOSO world ranking data with this country (may be shorter than a full national list)."
        : listOrigin === "global-world-pool"
          ? "PLATFORM_UNIVERSITIES is a global sample from SOSO world ranking cache (many countries; not USA/UK-only). Use for comparisons only."
          : "PLATFORM_UNIVERSITIES is from the Hipolabs open directory for this country (broad list, not a formal ranking). Do not treat list order as world rank.";

  const effectiveCountry = recommendationCountry.trim()
    ? recommendationCountry.trim()
    : "Worldwide (no single-country filter)";
  const canonicalLine = recommendationCountry.trim()
    ? canonicalCountryKey(recommendationCountry)
    : "(none — global comparison list)";

  return `You are SOSO AI Student Advisor.
Language: ${language.toUpperCase()}.

Main job:
- Help student choose university/program.
- Explain admissions and registration steps in practical order.
- If screenshot is provided, explain what to click next step-by-step.
- Keep answer concise, practical, and easy to follow.

Hard rules:
1) Use two response modes:
   - GENERAL mode: greetings, "who are you", how admissions works, how to choose countries/programs, visa/checklist questions.
   - RECOMMENDATION mode: when user asks to recommend/compare/list specific universities or programs.
2) In GENERAL mode, do NOT force country-filtered recommendations and do NOT mention a specific country unless user asked for it.
3) If focused_university is present in Current context, it is the PRIMARY subject: answer about that university (any country). PLATFORM_UNIVERSITIES is supplementary for comparisons; never refuse to discuss the focused university because it is "not in the list".
4) In RECOMMENDATION mode, prefer universities from PLATFORM_UNIVERSITIES for comparisons, but if the user names a specific university (especially when it matches focused_university), answer about that institution. Do NOT default to USA/UK-only advice when the student asked about another country.
5) If a named university is not in PLATFORM_UNIVERSITIES, still give practical guidance (official site, documents, typical steps) and say data is not in the current batch—do not only tell the user to "change country" unless they are explicitly using a country filter in the UI.
6) Prefer official links (website / ranking_source_url when present) and provided platform links.
7) Never invent fees, deadlines, or scholarship facts.
8) When national_rank or world_rank appear on a row, you may cite them as shown—do not extrapolate ranks for other schools.
9) End every answer with "Next steps" checklist (2-5 bullets).
10) Add a "Sources used" block with 2-5 links from the provided data. If you lack links, explicitly say "No official source link found in current data".
11) Add a one-line "Trust note" reminding the student to verify deadlines/fees on official websites before applying.

Data note:
${originNote}
${universityList.length === 0 ? "\nPLATFORM_UNIVERSITIES is empty (ranking cache may not be synced yet). Use focused_university and general guidance; do not refuse non-US/UK questions.\n" : ""}

Current context:
${contextBlock}

Recommendation country (filter):
${effectiveCountry}
Canonical country key (for matching): ${canonicalLine}

PLATFORM_UNIVERSITIES:
${JSON.stringify(universityList, null, 2)}
`;
}

export async function generateAdvisorReply(args: {
  language: "uz" | "ru" | "en";
  recommendationCountry: string;
  messages: AdvisorMessage[];
  screenshotDataUrl?: string;
  context?: AdvisorContext;
}) {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("AI service is not configured.");
  }
  if (args.messages.length === 0) {
    throw new Error("Conversation is empty.");
  }

  const countryForList =
    (args.context?.country?.trim()) ||
    (args.recommendationCountry.trim()) ||
    "";

  const { universities: platformUniversities, listOrigin } =
    await resolvePlatformUniversities(countryForList);

  const systemPrompt = buildSystemPrompt(
    args.language,
    countryForList,
    listOrigin,
    platformUniversities,
    args.context,
  );
  const conversationLog = buildConversationLog(args.messages.slice(-20));
  const screenshot =
    typeof args.screenshotDataUrl === "string" ? parseDataUrl(args.screenshotDataUrl) : null;

  const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: `Conversation:\n${conversationLog}` },
  ];

  if (screenshot) {
    userContent.push({
      type: "text",
      text: "Screenshot is attached. Explain where to click and why.",
    });
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${screenshot.mimeType};base64,${screenshot.base64}`,
      },
    });
  }

  const text = await generateAzureChatCompletionText({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    deployment: getAzureOpenAIDeploymentByPurpose("chat_fast"),
    temperature: 0.35,
    maxTokens: 900,
  });
  if (!text) {
    throw new Error("AI returned empty response.");
  }
  return text.trim();
}
