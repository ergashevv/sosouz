"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Outfit } from "next/font/google";
import { Globe2 } from "lucide-react";
import SearchHeader from "@/components/SearchHeader";
import DataFreshnessStrip from "@/components/DataFreshnessStrip";
import { useLanguage } from "@/contexts/LanguageContext";
const outfit = Outfit({ subsets: ["latin"], weight: ["800"] });

interface RankingEntry {
  rank: number;
  /** Present when country/region filter uses global list ordering — position in that list. */
  world_rank?: number;
  university_name: string;
  country: string;
  region: string | null;
  state_province: string | null;
  official_website: string | null;
  source_url: string | null;
  source_title: string | null;
  confidence: number;
}

interface RankingsResponse {
  dataset: "world-top-100" | "south-korea-top-10" | "country-top";
  list_scope?: "world" | "region" | "country";
  year: number;
  month_snapshot: string;
  generated_at: string;
  source_strategy: "serper+gemini";
  cache_key_year?: number;
  requested_calendar_year?: number;
  used_prior_year_cache?: boolean;
  db_synced_at?: string;
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
  filters: {
    country: string | null;
    region: string | null;
    top: number;
  };
  available_countries: string[];
  available_regions: string[];
  entries: RankingEntry[];
  ranking_pool?: {
    loaded: number;
    target: number;
    compact: boolean;
  };
  /** True while national list is still building in the server background. */
  ranking_build_incomplete?: boolean;
}

const LOCAL_COUNTRY = process.env.NEXT_PUBLIC_LOCAL_COUNTRY || "Uzbekistan";
const POPULAR_COUNTRIES = [
  "United States",
  "United Kingdom",
  "China",
  "Japan",
  "South Korea",
  "Singapore",
  LOCAL_COUNTRY,
];

const pageCopy = {
  uz: {
    title: "Top universitetlar",
    subtitle: "Dunyo boʻyicha yetakchi universitetlar roʻyxati.",
    country: "Mamlakat",
    allCountries: "Barcha davlatlar",
    region: "Hudud",
    allRegions: "Barcha hududlar",
    regionFromCountry: "Mamlakat bo‘yicha",
    local: "Lokal",
    top: "Roʻyxat hajmi",
    source: "Manba",
    official: "Rasmiy sayt",
    empty:
      "Tanlangan filtrlar boʻyicha natija yoʻq. Boshqa mamlakat yoki hududni tanlang yoki filtrlarni tozalang.",
    loading: "Top universitetlar yuklanmoqda...",
    loadError: "Reytingni yuklash muvaffaqiyatsiz tugadi. Keyinroq qayta urinib koʻring.",
    quickPick: "Tez tanlash",
    resultsTitle: "Universitetlar",
    summaryPrefix: "Hozirgi tanlov",
    worldRank: "Jahon reytingida: #{n}",
    askAi: "AI chat",
  },
  en: {
    title: "Top Universities",
    subtitle: "Explore the world’s leading universities in one list.",
    country: "Country",
    allCountries: "All countries",
    region: "Region",
    allRegions: "All regions",
    regionFromCountry: "Inferred from country",
    local: "Local",
    top: "List size",
    source: "Source",
    official: "Official site",
    empty:
      "No results for these filters. Try another country or region, or reset the filters.",
    loading: "Loading top universities...",
    loadError: "Could not load rankings. Please try again later.",
    quickPick: "Quick picks",
    resultsTitle: "Universities",
    summaryPrefix: "Current selection",
    worldRank: "World rank: #{n}",
    askAi: "Ask AI",
  },
  ru: {
    title: "Топ университеты",
    subtitle: "Список ведущих университетов мира в одном месте.",
    country: "Страна",
    allCountries: "Все страны",
    region: "Регион",
    allRegions: "Все регионы",
    regionFromCountry: "По выбранной стране",
    local: "Локальные",
    top: "Размер списка",
    source: "Источник",
    official: "Официальный сайт",
    empty:
      "По выбранным фильтрам ничего не найдено. Попробуйте другую страну или регион либо сбросьте фильтры.",
    loading: "Загрузка топ университетов...",
    loadError: "Не удалось загрузить рейтинг. Попробуйте позже.",
    quickPick: "Быстрый выбор",
    resultsTitle: "Университеты",
    summaryPrefix: "Сейчас выбрано",
    worldRank: "Мировой рейтинг: #{n}",
    askAi: "Спросить AI",
  },
} as const;

function toInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  if (rounded < 1) return fallback;
  return rounded;
}

function fetchRankings(url: string): Promise<RankingsResponse> {
  return fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to fetch rankings");
    }
    return (await response.json()) as RankingsResponse;
  });
}

function toLocation(entry: RankingEntry) {
  const parts = [entry.country, entry.region || entry.state_province].filter(Boolean);
  return parts.join(", ");
}

function buildPageHref(args: { country: string; region: string; top: number; page: number }) {
  const params = new URLSearchParams();
  if (args.country) {
    params.set("country", args.country);
  }
  if (args.region) {
    params.set("region", args.region);
  }
  params.set("top", String(args.top));
  params.set("page", String(args.page));
  return `/top-university?${params.toString()}`;
}

function buildChatAdvisorHref(entry: RankingEntry) {
  const params = new URLSearchParams();
  params.set("country", entry.country);
  params.set(
    "advisorContext",
    encodeURIComponent(
      JSON.stringify({
        name: entry.university_name,
        country: entry.country,
        officialWebsite: entry.official_website,
        nationalRank: entry.rank,
        worldRank: entry.world_rank,
        rankingSourceUrl: entry.source_url,
      }),
    ),
  );
  return `/chat?${params.toString()}`;
}

const SKELETON_ROWS = 10;

function RankingsListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
        <div
          key={`sk-${index}`}
          className="rounded-2xl border border-neutral-100 bg-white px-4 py-4 shadow-sm min-h-23 animate-pulse"
        >
          <div className="h-2.5 w-12 rounded bg-neutral-200" />
          <div className="mt-3 h-5 w-[70%] max-w-md rounded bg-neutral-200" />
          <div className="mt-2 h-4 w-[45%] max-w-xs rounded bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export default function TopUniversityPage() {
  const { language, t } = useLanguage();
  const copy = pageCopy[language];
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const year = new Date().getUTCFullYear();

  const page = toInt(searchParams.get("page"), 1);
  const top = Math.min(100, toInt(searchParams.get("top"), 100));
  const country = (searchParams.get("country") || "").trim();
  const region = (searchParams.get("region") || "").trim();
  const effectiveRegion = country ? "" : region;

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("dataset", "world-top-100");
    params.set("year", String(year));
    params.set("page", String(page));
    params.set("pageSize", "10");
    params.set("top", String(top));
    if (country) {
      params.set("country", country);
    }
    if (effectiveRegion) {
      params.set("region", effectiveRegion);
    }
    return `/api/rankings?${params.toString()}`;
  }, [country, effectiveRegion, page, top, year]);

  const { data, isLoading, isValidating, error, mutate } = useSWR(apiUrl, fetchRankings, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 120_000,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!data?.ranking_build_incomplete || !country) return;
    const intervalMs = 12_000;
    const id = setInterval(() => {
      void mutate();
    }, intervalMs);
    return () => clearInterval(id);
  }, [country, data?.ranking_build_incomplete, mutate]);

  const listScopeOk = Boolean(
    data &&
      (!data.list_scope
        ? !country
        : country
          ? data.list_scope === "country"
          : data.list_scope === "world" || data.list_scope === "region"),
  );

  const responseMatchesUrl = Boolean(
    data &&
      listScopeOk &&
      (data.filters.country ?? "") === country &&
      (data.filters.region ?? "") === effectiveRegion &&
      data.filters.top === top &&
      data.page === page,
  );

  const showListSkeleton = !error && ((isLoading || isValidating) && !responseMatchesUrl);

  const showLogoOverlay = Boolean(!error && !data && isLoading);

  const countryOptions = useMemo(() => {
    const fromApi = data?.available_countries ?? [];
    const names = new Set<string>(fromApi);
    if (country) names.add(country);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [data?.available_countries, country]);

  const pageNumbers = useMemo(() => {
    const totalPages = data?.total_pages || 1;
    const current = data?.page || 1;
    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p += 1) {
      if (p === 1 || p === totalPages || (p >= current - 1 && p <= current + 1)) {
        pages.push(p);
      }
    }
    return pages;
  }, [data?.page, data?.total_pages]);

  // Filters must follow URL only so SSR, first client paint, and SWR agree (avoid hydration mismatch).
  const totalPages = data?.total_pages || 1;
  const currentPage = data?.page ?? page;

  const navigateFilters = (href: string) => {
    router.push(href, { scroll: false });
  };

  const topLabel = t("rankings.topN").replace("{n}", String(top));
  const selectionSummary = country
    ? `${country} · ${topLabel}`
    : effectiveRegion
      ? `${effectiveRegion} · ${topLabel}`
      : `${copy.allCountries} · ${topLabel}`;

  return (
    <main className="relative min-h-screen bg-white pb-20">
      <AnimatePresence>
        {showLogoOverlay ? (
          <motion.div
            key="rankings-loading-overlay"
            role="status"
            aria-busy="true"
            aria-label={copy.loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-white/75 backdrop-blur-[3px] pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none flex flex-col items-center gap-3"
            >
              <span
                className={`text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}
              >
                soso.
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                {copy.loading}
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SearchHeader fixed={false} showSearchForm={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <header className="border-b border-neutral-100 bg-linear-to-b from-neutral-50 to-white px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              <Globe2 size={12} className="shrink-0 text-neutral-400" aria-hidden />
              {t("rankings.top100.badge")}
            </div>
            <h1 className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">{copy.subtitle}</p>
          </header>

          <div className="px-5 py-5 sm:px-6 sm:py-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400">{t("filters.label")}</h2>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-x-3 lg:gap-y-3">
              <div className={country ? "lg:col-span-6" : "lg:col-span-4"}>
                <label htmlFor="tu-country" className="mb-1.5 block text-xs font-medium text-neutral-600">
                  {copy.country}
                </label>
                <select
                  id="tu-country"
                  value={country}
                  onChange={(event) => {
                    const nextCountry = event.target.value;
                    const nextTop = nextCountry && top < 20 ? 100 : top;
                    navigateFilters(
                      buildPageHref({
                        country: nextCountry,
                        region: "",
                        top: nextTop,
                        page: 1,
                      }),
                    );
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                >
                  <option value="">{copy.allCountries}</option>
                  {countryOptions.map((countryName) => (
                    <option key={countryName} value={countryName}>
                      {countryName}
                    </option>
                  ))}
                </select>
              </div>

              {!country ? (
                <div className="lg:col-span-3">
                  <label htmlFor="tu-region" className="mb-1.5 block text-xs font-medium text-neutral-600">
                    {copy.region}
                  </label>
                  <select
                    id="tu-region"
                    value={effectiveRegion}
                    onChange={(event) => {
                      navigateFilters(
                        buildPageHref({
                          country,
                          region: event.target.value,
                          top,
                          page: 1,
                        }),
                      );
                    }}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                  >
                    <option value="">{copy.allRegions}</option>
                    {(data?.available_regions || []).map((regionName) => (
                      <option key={regionName} value={regionName}>
                        {regionName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className={country ? "lg:col-span-3" : "lg:col-span-2"}>
                <label htmlFor="tu-top" className="mb-1.5 block text-xs font-medium text-neutral-600">
                  {copy.top}
                </label>
                <select
                  id="tu-top"
                  value={String(top)}
                  onChange={(event) => {
                    navigateFilters(
                      buildPageHref({
                        country,
                        region: effectiveRegion,
                        top: Number(event.target.value),
                        page: 1,
                      }),
                    );
                  }}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900/10"
                >
                  {[10, 20, 50, 100].map((value) => (
                    <option key={value} value={value}>
                      {t("rankings.topN").replace("{n}", String(value))}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`flex sm:col-span-2 ${country ? "lg:col-span-3" : "lg:col-span-3"} lg:justify-end lg:self-end`}
              >
                <Link
                  href={pathname}
                  className="inline-flex h-[42px] w-full items-center justify-center rounded-xl border border-neutral-300 px-4 text-xs font-bold uppercase tracking-wide text-neutral-800 transition-colors hover:border-neutral-900 hover:bg-neutral-50 lg:w-auto"
                >
                  {t("filters.reset")}
                </Link>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">
              <span className="font-semibold text-neutral-800">{copy.summaryPrefix}:</span>{" "}
              <span className="text-neutral-700">{selectionSummary}</span>
            </div>

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <div className="text-xs font-semibold text-neutral-700">{copy.quickPick}</div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {POPULAR_COUNTRIES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      navigateFilters(
                        buildPageHref({
                          country: name,
                          region: "",
                          top: Math.max(top, 50),
                          page: 1,
                        }),
                      );
                    }}
                    className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:bg-neutral-50"
                  >
                    {name === LOCAL_COUNTRY ? `${copy.local}: ${name}` : name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 min-h-[calc(5.75rem*10+0.75rem*9)]">
          {responseMatchesUrl &&
          data!.list_scope === "world" &&
          data!.ranking_pool?.compact &&
          (country || effectiveRegion) &&
          data!.total < top ? (
            <div
              role="status"
              className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              {t("rankings.poolUpgradeHint")
                .replace("{loaded}", String(data!.ranking_pool!.loaded))
                .replace("{target}", String(data!.ranking_pool!.target))}
            </div>
          ) : null}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <h2 className="text-base font-bold text-neutral-900">{copy.resultsTitle}</h2>
            {responseMatchesUrl ? (
              <DataFreshnessStrip
                variant="inline"
                language={language}
                generatedAt={data!.generated_at}
                dbSyncedAt={data!.db_synced_at}
                yearFallbackNote={Boolean(data!.used_prior_year_cache)}
                className="shrink-0 self-end sm:self-auto"
              />
            ) : null}
          </div>
          {error ? (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
              {copy.loadError}
            </div>
          ) : showListSkeleton ? (
            <RankingsListSkeleton />
          ) : responseMatchesUrl && data!.entries.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
              {copy.empty}
            </div>
          ) : responseMatchesUrl ? (
            <div
              className={`space-y-3 transition-opacity duration-200 ${isValidating ? "opacity-60" : "opacity-100"}`}
            >
              {data!.entries.map((entry) => (
                <article
                  key={`${entry.rank}-${entry.university_name}`}
                  className="rounded-2xl border border-neutral-100 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        #{entry.rank}
                      </div>
                      <div className="mt-1 text-base sm:text-lg font-bold text-neutral-900 wrap-break-word">
                        {entry.university_name}
                      </div>
                      <div className="mt-1 text-sm text-neutral-500">{toLocation(entry)}</div>
                      {typeof entry.world_rank === "number" ? (
                        <div className="mt-0.5 text-xs text-neutral-400">
                          {copy.worldRank.replace("#{n}", String(entry.world_rank))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 text-[12px]">
                      <Link
                        href={buildChatAdvisorHref(entry)}
                        className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:border-neutral-900 hover:bg-neutral-50"
                      >
                        {copy.askAi}
                      </Link>
                      {entry.official_website ? (
                        <a
                          href={entry.official_website}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-black hover:underline"
                        >
                          {copy.official}
                        </a>
                      ) : null}
                      {entry.source_url ? (
                        <a
                          href={entry.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-neutral-500 hover:text-black hover:underline"
                        >
                          {copy.source}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        {responseMatchesUrl && data!.total_pages > 1 ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 py-10 border-t border-neutral-100 mt-8">
            <Link
              href={buildPageHref({
                country,
                region: effectiveRegion,
                top,
                page: Math.max(1, currentPage - 1),
              })}
              className={`px-6 py-2.5 rounded-full border border-neutral-200 text-xs font-bold transition-all hover:bg-neutral-50 ${
                currentPage === 1 ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              {t("pagination.previous")}
            </Link>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {pageNumbers.map((p, index) => {
                const prev = pageNumbers[index - 1];
                const needsGap = prev && p - prev > 1;
                return (
                  <div key={`p-${p}`} className="flex items-center gap-2">
                    {needsGap ? <span className="text-neutral-300">...</span> : null}
                    <Link
                      href={buildPageHref({ country, region: effectiveRegion, top, page: p })}
                      className={`w-9 h-9 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        p === currentPage
                          ? "bg-black text-white"
                          : "text-neutral-500 hover:text-black hover:bg-neutral-50"
                      }`}
                    >
                      {p}
                    </Link>
                  </div>
                );
              })}
            </div>

            <Link
              href={buildPageHref({
                country,
                region: effectiveRegion,
                top,
                page: Math.min(totalPages, currentPage + 1),
              })}
              className={`px-6 py-2.5 rounded-full border border-neutral-200 text-xs font-bold transition-all hover:bg-neutral-50 ${
                currentPage === totalPages ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              {t("pagination.next")}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
