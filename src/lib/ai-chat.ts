import "server-only";

import { Buffer } from "buffer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAdvisorRankingUniversities } from "@/lib/rankings";
import { canonicalCountryKey } from "@/lib/geoFilters";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

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
  listOrigin: "soso-country-ranking" | "soso-world-slice" | "hipolabs";
}> {
  const target = country.trim();
  if (!target) {
    return { universities: [], listOrigin: "hipolabs" };
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
    .map((message) => `${message.role === "assistant" ? "AI" : "User"}: ${message.content}`)
    .join("\n");
}

function buildSystemPrompt(
  language: "uz" | "ru" | "en",
  recommendationCountry: string,
  listOrigin: "soso-country-ranking" | "soso-world-slice" | "hipolabs",
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

  const universityList = platformUniversities.map((uni, index) => ({
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
        : "PLATFORM_UNIVERSITIES is from the Hipolabs open directory for this country (broad list, not a formal ranking). Do not treat list order as world rank.";

  return `You are SOSO AI Student Advisor.
Language: ${language.toUpperCase()}.

Main job:
- Help student choose university/program.
- Explain admissions and registration steps in practical order.
- If screenshot is provided, explain what to click next step-by-step.
- Keep answer concise, practical, and easy to follow.

Hard rules:
1) For university recommendations, ONLY use universities from PLATFORM_UNIVERSITIES.
2) If user asks universities outside the list, clearly say you can only recommend from platform data.
3) Prefer official links (website / ranking_source_url when present) and provided platform links.
4) Never invent fees, deadlines, or scholarship facts.
5) When national_rank or world_rank appear on a row, you may cite them as shown—do not extrapolate ranks for other schools.
6) End every answer with "Next steps" checklist (2-5 bullets).

Data note:
${originNote}

Current context:
${contextBlock}

Recommendation country (filter):
${recommendationCountry}
Canonical country key (for matching): ${canonicalCountryKey(recommendationCountry)}

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
  if (!GEMINI_API_KEY) {
    throw new Error("AI service is not configured.");
  }
  if (args.messages.length === 0) {
    throw new Error("Conversation is empty.");
  }

  const { universities: platformUniversities, listOrigin } = await resolvePlatformUniversities(
    args.recommendationCountry,
  );
  const systemPrompt = buildSystemPrompt(
    args.language,
    args.recommendationCountry,
    listOrigin,
    platformUniversities,
    args.context,
  );
  const conversationLog = buildConversationLog(args.messages.slice(-20));
  const screenshot =
    typeof args.screenshotDataUrl === "string" ? parseDataUrl(args.screenshotDataUrl) : null;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const parts: Array<
    | { text: string }
    | {
        inlineData: {
          mimeType: string;
          data: string;
        };
      }
  > = [{ text: `${systemPrompt}\nConversation:\n${conversationLog}` }];

  if (screenshot) {
    parts.push({
      text: "Screenshot is attached. Explain where to click and why.",
    });
    parts.push({
      inlineData: {
        mimeType: screenshot.mimeType,
        data: screenshot.base64,
      },
    });
  }

  const response = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 900,
    },
  });

  const text = response.response.text().trim();
  if (!text) {
    throw new Error("AI returned empty response.");
  }
  return text;
}
