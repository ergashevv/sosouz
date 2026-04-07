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
    return (
      "Yillik to‘lov-kontrakt: taxminan 19 200 000 so‘mdan 28 500 000 so‘mgacha " +
      "(o'zbek so'mi, AQSH dollari emas). Bu — ko'pchilik kunduzgi bakalavr yo'nalishlari uchun rasmiy DTM/BBA katalogidagi oraliq; OTM kodi 314. " +
      "Aniq summa tanlangan yo‘nalishga qarab farq qiladi. "
    ).concat(`To‘liq jadval: ${NUU_UZBMB_CATALOG_URL}. Onlayn shartnoma: shartnoma.nuu.uz`);
  }

  if (lang === "ru") {
    return (
      "Годовой контракт: примерно от 19 200 000 до 28 500 000 сумов в год " +
      "(узбекская национальная валюта, не доллары США). Для многих очных программ бакалавриата — по официальному каталогу DTM, вуз №314. " +
      "Точная сумма зависит от направления. "
    ).concat(`Таблица: ${NUU_UZBMB_CATALOG_URL}. Онлайн-контракт: shartnoma.nuu.uz`);
  }

  return (
    "Annual contract tuition: about 19,200,000 to 28,500,000 UZS per year " +
    "(Uzbek soum — Uzbekistan national currency, not US dollars). " +
    "That range covers many full-time bachelor programs in the official DTM/BBA catalog; this university is listed as no. 314. " +
    "Your exact amount depends on the program you choose. "
  ).concat(`Full table: ${NUU_UZBMB_CATALOG_URL}. Contract portal: shartnoma.nuu.uz`);
}
