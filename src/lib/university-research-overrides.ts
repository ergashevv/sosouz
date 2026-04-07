import type { Language } from "@/lib/i18n";

function coerceLanguage(value: string | undefined): Language | null {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return null;
}

/** Parse DB cache key `University name::lang` (legacy rows may omit `::lang`, then `en` is used). */
export function parseResearchCacheKey(key: string): { university: string; lang: Language } | null {
  const trimmed = key.trim();
  if (!trimmed) return null;
  const idx = trimmed.lastIndexOf("::");
  if (idx === -1) {
    return { university: trimmed, lang: "en" };
  }
  const university = trimmed.slice(0, idx).trim();
  const langRaw = trimmed.slice(idx + 2).trim();
  const lang = coerceLanguage(langRaw);
  if (!university) return null;
  if (lang) return { university, lang };
  return { university: trimmed, lang: "en" };
}

/** Normalize university names for override lookup (ASCII-ish, lowercased). */
function normalizeUniversityKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['ʼʻ]/g, "'")
    .replace(/ō/g, "o");
}

const NUU_KEYS = new Set(
  [
    "national university of uzbekistan",
    "o'zbekiston milliy universiteti",
    "natsionalnyy universitet uzbekistana",
  ].map((s) => normalizeUniversityKey(s)),
);

export function isNationalUniversityOfUzbekistan(name: string): boolean {
  const key = normalizeUniversityKey(name);
  if (NUU_KEYS.has(key)) return true;
  if (key.includes("national university of uzbekistan")) return true;
  if (key.includes("milliy universitet") && key.includes("o'zbekiston")) return true;
  return false;
}

/** Shorter copy: leading number, then links (DTM catalog + contract portal). */
const NUU_UZBMB_CATALOG_URL = "https://my.uzbmb.uz/university-about-direction/314";

export function getResearchTuitionOverride(university: string, lang: Language): string | null {
  if (!isNationalUniversityOfUzbekistan(university)) return null;

  if (lang === "uz") {
    return `Taxminan 19,2–28,5 mln so‘m/yil (kunduzgi bakalavr, ko‘pchilik yo‘nalishlar; DTM jadvali, OTM 314). Aniq summa — tanlangan yo‘nalishga qarab. Jadval: ${NUU_UZBMB_CATALOG_URL} · Shartnoma: shartnoma.nuu.uz`;
  }

  if (lang === "ru") {
    return `Около 19,2–28,5 млн сум/год (очная бакалавриат, типичный диапазон по каталогу DTM, вуз №314). Точная сумма — по направлению. Каталог: ${NUU_UZBMB_CATALOG_URL} · Контракт: shartnoma.nuu.uz`;
  }

  return `About 19.2–28.5M UZS/year (full-time bachelor, typical range in the DTM catalog — university 314). Exact fee depends on your program. Table: ${NUU_UZBMB_CATALOG_URL} · Contract: shartnoma.nuu.uz`;
}
