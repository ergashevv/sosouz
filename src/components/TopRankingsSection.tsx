"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import Link from "next/link";
import DataFreshnessStrip from "@/components/DataFreshnessStrip";

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
  dataset: "world-top-100" | "south-korea-top-10";
  year: number;
  month_snapshot: string;
  generated_at: string;
  source_strategy: "serper+gemini";
  entries: RankingEntry[];
  total: number;
  total_pages: number;
  page: number;
  page_size: number;
  available_countries: string[];
  db_synced_at?: string;
  used_prior_year_cache?: boolean;
}

type SectionLanguage = "uz" | "ru" | "en";

const sectionCopy: Record<
  SectionLanguage,
  {
    title: string;
    subtitle: string;
    worldTitle: string;
    koreaTitle: string;
    source: string;
    official: string;
    noData: string;
    loading: string;
    refreshHint: string;
    openAll: string;
  }
> = {
  uz: {
    title: "Top universitetlar",
    subtitle: "Dunyo boʻyicha mashhur universitetlar reytingi — har oy yangilanadi.",
    worldTitle: "Dunyo reytingi (ko‘rsatilyapti: top 10)",
    koreaTitle: "Koreya top 10",
    source: "Manba",
    official: "Rasmiy sayt",
    noData: "Hozircha reyting maʼlumotlari yoʻq. Keyinroq qayta urinib koʻring.",
    loading: "Top reytinglar yuklanmoqda...",
    refreshHint: "Maʼlumotlar katalogdan — yangilanish vaqti pastda",
    openAll: "To‘liq ro‘yxat",
  },
  en: {
    title: "Top Universities",
    subtitle: "A curated global ranking of leading universities, refreshed monthly.",
    worldTitle: "World top 100 (showing: top 10)",
    koreaTitle: "South Korea top 10",
    source: "Source",
    official: "Official site",
    noData: "Rankings are not available yet. Please try again later.",
    loading: "Loading top rankings...",
    refreshHint: "Served from catalog — see update time below",
    openAll: "Open full list",
  },
  ru: {
    title: "Топ университеты",
    subtitle: "Подборка ведущих университетов мира с ежемесячным обновлением.",
    worldTitle: "Мировой рейтинг (показано: топ 10)",
    koreaTitle: "Топ 10 Южной Кореи",
    source: "Источник",
    official: "Официальный сайт",
    noData: "Рейтинг пока недоступен. Попробуйте позже.",
    loading: "Загрузка топ-рейтингов...",
    refreshHint: "Данные из каталога — время обновления ниже",
    openAll: "Полный список",
  },
};

async function fetchRanking(
  dataset: "world-top-100" | "south-korea-top-10",
  year: number,
): Promise<RankingSnapshotPayload | null> {
  const url = new URL("/api/rankings", window.location.origin);
  url.searchParams.set("dataset", dataset);
  url.searchParams.set("year", String(year));
  url.searchParams.set("top", dataset === "world-top-100" ? "10" : "10");
  url.searchParams.set("page", "1");
  url.searchParams.set("pageSize", "10");

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  return (await response.json()) as RankingSnapshotPayload;
}

function toLocationLabel(entry: RankingEntry) {
  const parts = [entry.country, entry.region || entry.state_province].filter(Boolean);
  return parts.join(", ");
}

function RankingList({
  title,
  entries,
  sourceText,
  officialText,
}: {
  title: string;
  entries: RankingEntry[];
  sourceText: string;
  officialText: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6">
      <h3 className="text-sm font-black uppercase tracking-widest text-neutral-700">{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <article
            key={`${title}-${entry.rank}-${entry.university_name}`}
            className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-3 sm:px-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  #{entry.rank}
                </div>
                <div className="mt-1 text-sm sm:text-base font-bold text-neutral-900 wrap-break-word">
                  {entry.university_name}
                </div>
                <div className="mt-1 text-xs font-medium text-neutral-500">{toLocationLabel(entry)}</div>
              </div>

              <div className="flex flex-col items-end gap-1 text-[11px] shrink-0">
                {entry.official_website ? (
                  <a
                    href={entry.official_website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-black hover:underline"
                  >
                    {officialText}
                  </a>
                ) : null}
                {entry.source_url ? (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-neutral-500 hover:text-black hover:underline"
                  >
                    {sourceText}
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function TopRankingsSection({ language }: { language: SectionLanguage }) {
  const copy = sectionCopy[language] ?? sectionCopy.en;
  const [loading, setLoading] = useState(true);
  const [world, setWorld] = useState<RankingSnapshotPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const year = new Date().getUTCFullYear();

    async function run() {
      try {
        const worldData = await fetchRanking("world-top-100", year);
        if (cancelled) return;
        setWorld(worldData);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const worldTopTen = useMemo(() => world?.entries || [], [world]);

  return (
    <section className="px-4 sm:px-6 py-12 sm:py-16 border-t border-black/5 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">{copy.title}</h2>
            <p className="mt-2 text-sm sm:text-base text-neutral-500">{copy.subtitle}</p>
            <div className="mt-3">
              <Link
                href="/top-university"
                className="inline-flex items-center rounded-full border border-neutral-300 px-4 py-2 text-xs font-bold uppercase tracking-wide text-neutral-700 hover:border-black hover:text-black transition-colors"
              >
                {copy.openAll}
              </Link>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 max-w-md sm:text-left sm:max-w-xs">
            {copy.refreshHint}
          </p>
        </div>

        {!loading && world ? (
          <div className="mt-6">
            <DataFreshnessStrip
              language={language}
              generatedAt={world.generated_at}
              dbSyncedAt={world.db_synced_at}
              periodLabel={world.month_snapshot}
              yearFallbackNote={Boolean(world.used_prior_year_cache)}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
            {copy.loading}
          </div>
        ) : worldTopTen.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
            {copy.noData}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                <Globe2 size={12} />
                <span>{copy.worldTitle}</span>
              </div>
              <RankingList
                title={copy.worldTitle}
                entries={worldTopTen}
                sourceText={copy.source}
                officialText={copy.official}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
