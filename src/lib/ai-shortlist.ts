import "server-only";

import { resolvePlatformUniversities, type PlatformUniversity } from "@/lib/ai-chat";
import {
  generateAzureChatCompletionText,
  getAzureOpenAIDeploymentByPurpose,
  isAzureOpenAiConfigured,
} from "@/lib/azure-openai";
import { canonicalCountryKey } from "@/lib/geoFilters";
import type { AiShortlistPick, AiShortlistResult } from "@/types/ai-shortlist";

export type { AiShortlistPick, AiShortlistResult } from "@/types/ai-shortlist";

type RawPickRow = {
  index?: number;
  name?: string;
  country?: string;
  website?: string | null;
  reason?: string;
  fit_score?: number;
  next_step?: string;
};

function parseShortlistJson(raw: string): {
  summary?: string;
  trust_note?: string;
  picks?: RawPickRow[];
} {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as { summary?: string; trust_note?: string; picks?: RawPickRow[] };
  } catch {
    return {};
  }
}

function clampInt(n: unknown, min: number, max: number): number | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalizeOptionalWebsite(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = t.startsWith("http://") || t.startsWith("https://") ? new URL(t) : new URL(`https://${t}`);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch {
    return null;
  }
  return null;
}

function buildSystemPromptCatalog(maxIndex: number, lang: string): string {
  return `You are SOSO AI Match — a structured shortlist assistant for study-abroad planning.
Output MUST be a single JSON object only (no markdown).
Schema:
{
  "summary": string (2-4 sentences in ${lang}, practical),
  "trust_note": string (one line: verify deadlines/fees on official sites),
  "picks": [ { "index": number, "reason": string, "fit_score": number, "next_step": string } ]
}

Rules:
- picks: 3 to 5 items. The platform list has ${maxIndex} universities (indices 1..${maxIndex}).
- index MUST refer to the provided numbered list only. Never invent indices.
- fit_score: integer 1-5 (relative fit, not a global league rank).
- reason: why this university fits the stated goals (no invented tuition numbers).
- next_step: one concrete action (e.g. open official site admissions page).
- Do not invent fees, deadlines, or scholarships.
- Prefer higher national_rank / world_rank when goals are ambiguous and ranks exist.
`;
}

function buildSystemPromptGenerative(lang: string, countryLabel: string): string {
  return `You are SOSO AI Match — a structured shortlist assistant for study-abroad planning.

The in-app university list for ${countryLabel} is too small to index. You MUST suggest 3 to 5 real, well-known universities yourself so the student can continue research.

Output MUST be a single JSON object only (no markdown).
Schema:
{
  "summary": string (2-4 sentences in ${lang}),
  "trust_note": string (one line: verify every URL and deadline on official sites; these suggestions are not from the SOSO catalog),
  "picks": [
    {
      "name": string,
      "country": string,
      "website": string | null,
      "reason": string,
      "fit_score": number,
      "next_step": string
    }
  ]
}

Rules:
- picks: 3 to 5 items. Do NOT use "index" — use name/country/website objects only.
- name: real institution names only. country: should match the student's target (${countryLabel}) when possible.
- website: ONLY the official https URL if you are confident. If unsure, use null. Never invent fake or guessed URLs.
- Do not invent specific tuition amounts, deadlines, or scholarship guarantees.
- summary: State clearly that the SOSO catalog had very few schools for this country in our database, so these are independent research suggestions to explore further.
- fit_score: integer 1-5.
`;
}

export async function generateAiShortlistMatch(args: {
  language: "uz" | "ru" | "en";
  country: string;
  goals: string;
  studyField?: string;
  budgetTier?: "unspecified" | "low" | "mid" | "high";
}): Promise<AiShortlistResult> {
  if (!isAzureOpenAiConfigured()) {
    throw new Error("AI service is not configured.");
  }

  const goals = args.goals.trim();
  if (goals.length < 8) {
    throw new Error("Goals text is too short.");
  }

  const countryForList = args.country.trim() || "";
  const { universities, listOrigin } = await resolvePlatformUniversities(countryForList);

  const indexed = universities.map((uni: PlatformUniversity, i: number) => ({
    index: i + 1,
    name: uni.name,
    country: uni.country,
    website: uni.website,
    national_rank: uni.national_rank ?? null,
    world_rank: uni.world_rank ?? null,
    ranking_source_url: uni.ranking_source_url ?? null,
  }));

  const maxIndex = indexed.length;
  const lang = args.language.toUpperCase();
  const field = (args.studyField || "").trim();
  const budget = args.budgetTier || "unspecified";

  const useGenerativeFallback = maxIndex < 3;
  const systemPrompt = useGenerativeFallback
    ? buildSystemPromptGenerative(lang, countryForList || "the selected country")
    : buildSystemPromptCatalog(maxIndex, lang);

  const userPayload = {
    language: args.language,
    recommendation_country: countryForList || null,
    canonical_country_key: countryForList ? canonicalCountryKey(countryForList) : null,
    study_field: field || null,
    budget_tier: budget,
    student_goals: goals,
    platform_universities_numbered: indexed,
    catalog_size: maxIndex,
    mode: useGenerativeFallback ? "generative_fallback" : "indexed_catalog",
  };

  const text = await generateAzureChatCompletionText({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify(userPayload, null, 2),
      },
    ],
    deployment: getAzureOpenAIDeploymentByPurpose("reasoning"),
    temperature: useGenerativeFallback ? 0.35 : 0.25,
    maxTokens: useGenerativeFallback ? 1800 : 1400,
    responseFormat: "json_object",
  });

  const parsed = parseShortlistJson(text || "{}");
  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : "Shortlist could not be summarized.";
  const trust_note =
    typeof parsed.trust_note === "string" && parsed.trust_note.trim()
      ? parsed.trust_note.trim()
      : "Verify all deadlines and fees on official university websites.";

  const rawPicks = Array.isArray(parsed.picks) ? parsed.picks : [];
  const picks: AiShortlistPick[] = [];

  if (useGenerativeFallback) {
    for (const row of rawPicks) {
      const name = typeof row?.name === "string" ? row.name.trim() : "";
      if (!name) continue;
      const country =
        typeof row?.country === "string" && row.country.trim()
          ? row.country.trim()
          : countryForList || "Unknown";

      picks.push({
        pick_source: "ai_research",
        index: 0,
        name,
        country,
        website: normalizeOptionalWebsite(row?.website),
        reason: typeof row?.reason === "string" ? row.reason.trim() : "",
        fit_score: clampInt(row?.fit_score, 1, 5) ?? 3,
        next_step:
          typeof row?.next_step === "string" && row.next_step.trim()
            ? row.next_step.trim()
            : "Confirm the programme on the official university website.",
        national_rank: null,
        world_rank: null,
        ranking_source_url: null,
      });
      if (picks.length >= 5) break;
    }
  } else {
    for (const row of rawPicks) {
      const idx = clampInt(row?.index, 1, maxIndex);
      if (idx === null || maxIndex === 0) continue;
      const uni = universities[idx - 1];
      if (!uni) continue;

      picks.push({
        pick_source: "catalog",
        index: idx,
        name: uni.name,
        country: uni.country,
        website: uni.website,
        reason: typeof row?.reason === "string" ? row.reason.trim() : "",
        fit_score: clampInt(row?.fit_score, 1, 5) ?? 3,
        next_step: typeof row?.next_step === "string" ? row.next_step.trim() : "Open the official website.",
        national_rank: uni.national_rank ?? null,
        world_rank: uni.world_rank ?? null,
        ranking_source_url: uni.ranking_source_url ?? null,
      });
      if (picks.length >= 5) break;
    }
  }

  return {
    summary,
    trust_note,
    list_origin: listOrigin,
    picks_mode: useGenerativeFallback ? "ai_research" : "catalog",
    picks,
  };
}
