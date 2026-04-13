import { after, NextResponse } from "next/server";
import {
  COUNTRY_RANKING_API_PREFETCH_BATCHES,
  COUNTRY_RANKING_ENTRY_COUNT,
  ensureCoreRankingSnapshot,
  ensureCountryRankingSnapshot,
  getRankingSnapshot,
  isCountryRankingSnapshotComplete,
  WORLD_RANKING_ENTRY_COUNT,
  type RankingSnapshotLoadResult,
} from "@/lib/rankings";
import { foldGeoLabel, inferRegionFromCountry } from "@/lib/geoFilters";
import {
  TOP_UNIVERSITY_DEFAULT_PAGE,
  TOP_UNIVERSITY_DEFAULT_PAGE_SIZE,
  TOP_UNIVERSITY_DEFAULT_TOP,
  normalizeTopTier,
} from "@/lib/top-university-defaults";

/** When world snapshot is missing, still populate country picker for ?country=… requests. */
function availableGeoFromWorldOrFallback(
  worldLoad: RankingSnapshotLoadResult | null,
  countryHint: string,
): { availableCountries: string[]; availableRegions: string[]; worldEnumEntryCount: number } {
  if (!worldLoad) {
    const fallback = [
      "United States",
      "United Kingdom",
      "China",
      "Japan",
      "South Korea",
      "Singapore",
      process.env.NEXT_PUBLIC_LOCAL_COUNTRY || "Uzbekistan",
    ];
    const availableCountries = Array.from(
      new Set([countryHint, ...fallback].map((c) => c.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
    return { availableCountries, availableRegions: [], worldEnumEntryCount: 0 };
  }

  const enumSnapshot = worldLoad.snapshot;
  const enumEntriesWithRegion = enumSnapshot.entries.map((entry) => ({
    ...entry,
    region: entry.region || inferRegionFromCountry(entry.country),
  }));

  const availableCountries = Array.from(
    new Set(
      enumEntriesWithRegion.map((entry) => entry.country).filter((item) => item && item !== "Unknown"),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const availableRegions = Array.from(
    new Set(enumEntriesWithRegion.map((entry) => entry.region).filter((item) => item && item !== "Other")),
  ).sort((a, b) => a.localeCompare(b));

  return {
    availableCountries,
    availableRegions,
    worldEnumEntryCount: enumSnapshot.entries.length,
  };
}

export const runtime = "nodejs";

/** First request for a new country can run Serper + Azure OpenAI — allow long execution. */
export const maxDuration = 300;

function toDataset(value: string | null): "world-top-100" | "south-korea-top-10" {
  if (value === "south-korea-top-10") return "south-korea-top-10";
  return "world-top-100";
}

function toYear(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const year = Math.trunc(parsed);
  if (year < 2000 || year > 2100) return undefined;
  return year;
}

function toMonthSnapshot(value: string | null) {
  if (!value) return undefined;
  return /^\d{4}-\d{2}$/.test(value) ? value : undefined;
}

function toPositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.trunc(parsed);
  if (rounded < 1) return fallback;
  return rounded;
}

function normalizeCountry(value: string | null) {
  if (!value) return "";
  return value.trim();
}

function normalizeRegion(value: string | null) {
  if (!value) return "";
  return value.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = toYear(searchParams.get("year"));
    const monthSnapshot = toMonthSnapshot(searchParams.get("month"));
    const page = toPositiveInt(searchParams.get("page"), TOP_UNIVERSITY_DEFAULT_PAGE);
    const pageSize = Math.min(50, toPositiveInt(searchParams.get("pageSize"), TOP_UNIVERSITY_DEFAULT_PAGE_SIZE));
    const rawTop = Math.min(100, toPositiveInt(searchParams.get("top"), TOP_UNIVERSITY_DEFAULT_TOP));
    const top = normalizeTopTier(rawTop);
    const country = normalizeCountry(searchParams.get("country"));
    const region = normalizeRegion(searchParams.get("region"));
    const calendarYear = year ?? new Date().getUTCFullYear();
    const effectiveRegion = country ? "" : region;

    if (country) {
      const countryLoaded = await ensureCountryRankingSnapshot({
        filterCountry: country,
        year: calendarYear,
        monthSnapshot,
        maxBatches: COUNTRY_RANKING_API_PREFETCH_BATCHES,
      });

      if (
        countryLoaded &&
        !isCountryRankingSnapshotComplete(countryLoaded.snapshot, COUNTRY_RANKING_ENTRY_COUNT)
      ) {
        const y = calendarYear;
        const m = monthSnapshot;
        const c = country;
        after(() => {
          ensureCountryRankingSnapshot({
            filterCountry: c,
            year: y,
            monthSnapshot: m,
          }).catch((err) => console.error("[rankings] background country build", err));
        });
      }

      if (!countryLoaded) {
        return NextResponse.json(
          {
            error: "Could not load national ranking for this country.",
            hint: "Check SERPER_API_KEY and Azure OpenAI env vars, then try again.",
          },
          { status: 503 },
        );
      }

      /** DB-only: never run heavy world sync here — country list is already loaded; dropdown uses world cache or static fallback. */
      const worldForEnums = await getRankingSnapshot({
        dataset: "world-top-100",
        year,
        monthSnapshot,
      });
      const { availableCountries, availableRegions } = availableGeoFromWorldOrFallback(worldForEnums, country);

      const snapshot = countryLoaded.snapshot;
      const entriesWithRegion = snapshot.entries.map((entry) => ({
        ...entry,
        region: entry.region || inferRegionFromCountry(entry.country),
      }));
      const ordered = entriesWithRegion.sort((a, b) => a.rank - b.rank).slice(0, top);
      const total = ordered.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      const entries = ordered.slice(start, start + pageSize);

      return NextResponse.json(
        {
          dataset: snapshot.dataset,
          year: snapshot.year,
          month_snapshot: snapshot.month_snapshot,
          generated_at: snapshot.generated_at,
          source_strategy: snapshot.source_strategy,
          cache_key_year: countryLoaded.resolvedKeyYear,
          requested_calendar_year: calendarYear,
          used_prior_year_cache: countryLoaded.usedPriorYearKey,
          db_synced_at: countryLoaded.storedAt.toISOString(),
          list_scope: "country",
          ranking_build_incomplete: !isCountryRankingSnapshotComplete(
            snapshot,
            COUNTRY_RANKING_ENTRY_COUNT,
          ),
          ranking_pool: {
            loaded: snapshot.entries.length,
            target: COUNTRY_RANKING_ENTRY_COUNT,
            compact: snapshot.entries.length < top,
          },
          total,
          total_pages: totalPages,
          page: safePage,
          page_size: pageSize,
          filters: {
            country: country || null,
            region: effectiveRegion || null,
            top,
          },
          available_countries: availableCountries,
          available_regions: availableRegions,
          entries,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
          },
        },
      );
    }

    const worldForEnums = await ensureCoreRankingSnapshot({
      dataset: "world-top-100",
      year,
      monthSnapshot,
    });

    if (!worldForEnums) {
      return NextResponse.json(
        {
          error: "Ranking snapshot not found.",
          hint:
            "Configure SERPER_API_KEY and Azure OpenAI (or run /api/rankings/sync with CRON_SECRET). On-demand sync can be disabled with RANKINGS_DISABLE_ON_DEMAND_SYNC=1.",
        },
        { status: 404 },
      );
    }

    const { availableCountries, availableRegions, worldEnumEntryCount } = availableGeoFromWorldOrFallback(
      worldForEnums,
      country,
    );

    const dataset = toDataset(searchParams.get("dataset"));
    const loaded = await ensureCoreRankingSnapshot({
      dataset,
      year,
      monthSnapshot,
    });

    if (!loaded) {
      return NextResponse.json(
        {
          error: "Ranking snapshot not found.",
          hint:
            "Configure SERPER_API_KEY and Azure OpenAI (or run /api/rankings/sync with CRON_SECRET). On-demand sync can be disabled with RANKINGS_DISABLE_ON_DEMAND_SYNC=1.",
        },
        { status: 404 },
      );
    }

    const snapshot = loaded.snapshot;

    const entriesWithRegion = snapshot.entries.map((entry) => ({
      ...entry,
      region: entry.region || inferRegionFromCountry(entry.country),
    }));

    const normalizedRegion = effectiveRegion ? foldGeoLabel(effectiveRegion) : "";
    const filteredByRegion = normalizedRegion
      ? entriesWithRegion.filter((entry) => foldGeoLabel(entry.region || "") === normalizedRegion)
      : entriesWithRegion;
    const orderedGlobal = filteredByRegion.sort((a, b) => a.rank - b.rank);
    const capped = orderedGlobal.slice(0, top);
    const scopedLocalList = Boolean(normalizedRegion) && dataset === "world-top-100";
    const withPresentationRank = scopedLocalList
      ? capped.map((entry, index) => ({
          ...entry,
          world_rank: entry.rank,
          rank: index + 1,
        }))
      : capped;

    const total = withPresentationRank.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const entries = withPresentationRank.slice(start, start + pageSize);

    const worldPoolLoaded = worldEnumEntryCount;

    return NextResponse.json(
      {
        dataset: snapshot.dataset,
        year: snapshot.year,
        month_snapshot: snapshot.month_snapshot,
        generated_at: snapshot.generated_at,
        source_strategy: snapshot.source_strategy,
        cache_key_year: loaded.resolvedKeyYear,
        requested_calendar_year: calendarYear,
        used_prior_year_cache: loaded.usedPriorYearKey,
        db_synced_at: loaded.storedAt.toISOString(),
        list_scope: normalizedRegion ? "region" : "world",
        ranking_pool: {
          loaded: worldPoolLoaded,
          target: WORLD_RANKING_ENTRY_COUNT,
          compact: worldPoolLoaded < WORLD_RANKING_ENTRY_COUNT,
        },
        total,
        total_pages: totalPages,
        page: safePage,
        page_size: pageSize,
        filters: {
          country: country || null,
          region: effectiveRegion || null,
          top,
        },
        available_countries: availableCountries,
        available_regions: availableRegions,
        entries,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to read rankings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
