"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  EMPTY_OUTCOME_METRICS,
  getOutcomeMetricsSnapshot,
  onOutcomeMetricsUpdated,
  type OutcomeMetricsSnapshot,
} from "@/lib/analytics";

export default function OutcomeMetricsPanel() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<OutcomeMetricsSnapshot>(EMPTY_OUTCOME_METRICS);

  useEffect(() => {
    setMetrics(getOutcomeMetricsSnapshot());
    return onOutcomeMetricsUpdated(setMetrics);
  }, []);

  return (
    <section className="px-4 sm:px-6 pb-10 sm:pb-14">
      <div className="mx-auto max-w-6xl rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {t("home.outcomes.title")}
          </p>
          <h3 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900">
            {t("home.outcomes.title")}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{t("home.outcomes.subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-black tabular-nums text-neutral-900">
              {metrics.discovery_search_started}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-neutral-500">{t("home.outcomes.discovery")}</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-black tabular-nums text-neutral-900">
              {metrics.profile_opened}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-neutral-500">{t("home.outcomes.profile")}</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-black tabular-nums text-neutral-900">
              {metrics.chat_message_sent}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-neutral-500">{t("home.outcomes.chat")}</p>
          </article>
          <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-black tabular-nums text-neutral-900">
              {metrics.official_link_clicked}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs font-semibold text-neutral-500">{t("home.outcomes.official")}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
