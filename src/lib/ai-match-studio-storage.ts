import type { Language } from "@/lib/i18n";
import type { AiShortlistResult } from "@/types/ai-shortlist";

const STORAGE_KEY_PREFIX = "soso_ai_match_studio_v1";
/** Default ~24h — form va qisqa ro‘yxat qayta kirganda tiklanadi */
const TTL_MS = 24 * 60 * 60 * 1000;

function storageKey(lang: Language): string {
  return `${STORAGE_KEY_PREFIX}:${lang}`;
}

type PersistedV1 = {
  v: 1;
  savedAt: number;
  lang: Language;
  country: string;
  goals: string;
  studyField: string;
  budgetTier: "unspecified" | "low" | "mid" | "high";
  result: AiShortlistResult | null;
};

function isBudgetTier(x: unknown): x is PersistedV1["budgetTier"] {
  return x === "unspecified" || x === "low" || x === "mid" || x === "high";
}

export function loadAiMatchStudioPersisted(lang: Language): Omit<PersistedV1, "v" | "savedAt"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(lang));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PersistedV1>;
    if (p.v !== 1 || p.lang !== lang) return null;
    if (typeof p.savedAt !== "number" || Date.now() - p.savedAt > TTL_MS) {
      localStorage.removeItem(storageKey(lang));
      return null;
    }
    if (typeof p.country !== "string" || typeof p.goals !== "string" || typeof p.studyField !== "string") {
      return null;
    }
    if (!isBudgetTier(p.budgetTier)) return null;
    const result =
      p.result === null
        ? null
        : p.result && typeof p.result === "object" && typeof (p.result as AiShortlistResult).summary === "string"
          ? (p.result as AiShortlistResult)
          : null;

    return {
      lang: p.lang,
      country: p.country,
      goals: p.goals,
      studyField: p.studyField,
      budgetTier: p.budgetTier,
      result,
    };
  } catch {
    return null;
  }
}

export function saveAiMatchStudioPersisted(
  data: Omit<PersistedV1, "v" | "savedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedV1 = {
      v: 1,
      savedAt: Date.now(),
      ...data,
    };
    localStorage.setItem(storageKey(data.lang), JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}
