"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, Database } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { translations, translateRefreshStatus } from "@/lib/i18n";

function tr(key: string, lang: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

function parseDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatAbsolute(d: Date, lang: Language): string {
  const locale = lang === "en" ? "en-GB" : lang === "ru" ? "ru-RU" : "uz-UZ";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d);
}

function relativeFromNow(d: Date, lang: Language): string {
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const locale = lang === "en" ? "en" : lang === "ru" ? "ru" : "uz";
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  return rtf.format(Math.round(diffSec / 604800), "week");
}

export type DataFreshnessStripProps = {
  language: Language;
  /** When the AI / pipeline produced this content (e.g. ranking generated_at, research refresh). */
  generatedAt?: string | Date | null;
  /** When the row was last written in DB (e.g. search_cache.last_updated). */
  dbSyncedAt?: string | Date | null;
  /** e.g. month snapshot key YYYY-MM */
  periodLabel?: string | null;
  refreshStatus?: string | null;
  /** True when rankings served from previous year because current year cache is empty. */
  yearFallbackNote?: boolean;
  /** `inline` = compact pill, last update only (generated_at, else db_synced_at). */
  variant?: "full" | "inline";
  className?: string;
};

export default function DataFreshnessStrip({
  language,
  generatedAt,
  dbSyncedAt,
  periodLabel,
  refreshStatus,
  yearFallbackNote,
  variant = "full",
  className = "",
}: DataFreshnessStripProps) {
  const gen = parseDate(generatedAt);
  const db = parseDate(dbSyncedAt);
  const lastUpdate = gen ?? db;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const relative = useMemo(() => {
    if (!gen) return null;
    void tick;
    return relativeFromNow(gen, language);
  }, [gen, language, tick]);

  const relativeLast = useMemo(() => {
    if (!lastUpdate) return null;
    void tick;
    return relativeFromNow(lastUpdate, language);
  }, [lastUpdate, language, tick]);

  if (variant === "inline") {
    if (!lastUpdate) return null;
    return (
      <aside
        suppressHydrationWarning
        className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full border border-neutral-200/90 bg-white px-2.5 py-1 text-[11px] leading-tight text-neutral-600 shadow-sm ${yearFallbackNote ? "ring-1 ring-amber-200/80" : ""} ${className}`}
        title={yearFallbackNote ? tr("dataFreshness.yearFallback", language) : undefined}
      >
        <Clock3 size={12} strokeWidth={2} className="shrink-0 text-neutral-400" aria-hidden />
        <span className="shrink-0 text-neutral-500">{tr("dataFreshness.lastUpdated", language)}</span>
        <time
          dateTime={lastUpdate.toISOString()}
          suppressHydrationWarning
          className="font-medium tabular-nums text-neutral-800"
        >
          {formatAbsolute(lastUpdate, language)}
        </time>
        {relativeLast ? (
          <span suppressHydrationWarning className="text-neutral-400">
            · {relativeLast}
          </span>
        ) : null}
      </aside>
    );
  }

  if (!gen && !db && !periodLabel && !yearFallbackNote && !refreshStatus) return null;

  const statusNorm = refreshStatus?.toLowerCase().trim() || "";
  const statusPillClass =
    statusNorm === "fresh"
      ? "border-emerald-200/90 bg-emerald-50 text-emerald-900"
      : statusNorm === "failed"
        ? "border-red-200/90 bg-red-50 text-red-900"
        : statusNorm === "stale" || statusNorm === "partial"
          ? "border-amber-200/90 bg-amber-50 text-amber-950"
          : "border-neutral-200 bg-white text-neutral-600";

  return (
    <aside
      className={`rounded-2xl border border-neutral-200 bg-neutral-50/90 px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2 sm:gap-2.5 text-xs text-neutral-600 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-6 sm:gap-y-1">
        <div className="flex items-center gap-2 font-semibold text-neutral-800">
          <Clock3 size={15} className="text-neutral-400 shrink-0" aria-hidden />
          <span>{tr("dataFreshness.badge", language)}</span>
        </div>

        {gen ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-neutral-500">{tr("dataFreshness.profileBuilt", language)}</span>
            <time
              dateTime={gen.toISOString()}
              suppressHydrationWarning
              className="font-mono tabular-nums text-neutral-900"
            >
              {formatAbsolute(gen, language)}
            </time>
            {relative ? (
              <span suppressHydrationWarning className="text-neutral-400">
                ({relative})
              </span>
            ) : null}
          </div>
        ) : null}

        {periodLabel ? (
          <div className="text-neutral-500">
            {tr("dataFreshness.snapshotPeriod", language)}:{" "}
            <span className="font-medium text-neutral-800">{periodLabel}</span>
          </div>
        ) : null}

        {db ? (
          <div className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-neutral-500">
            <Database size={13} className="text-neutral-400 shrink-0" aria-hidden />
            <span>{tr("dataFreshness.dbCached", language)}</span>
            <time
              dateTime={db.toISOString()}
              suppressHydrationWarning
              className="font-mono tabular-nums text-neutral-700"
            >
              {formatAbsolute(db, language)}
            </time>
          </div>
        ) : null}

        {refreshStatus ? (
          <span
            title={refreshStatus}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusPillClass}`}
          >
            {tr("uni.refresh_status", language)}: {translateRefreshStatus(refreshStatus, language)}
          </span>
        ) : null}
      </div>

      {yearFallbackNote ? (
        <p className="text-[11px] leading-snug text-amber-900 bg-amber-50 border border-amber-100/80 rounded-lg px-2.5 py-2">
          {tr("dataFreshness.yearFallback", language)}
        </p>
      ) : null}
    </aside>
  );
}
