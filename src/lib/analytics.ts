"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | null | undefined>;

const CONSENT_STORAGE_KEY = "soso_analytics_consent";
const METRICS_STORAGE_KEY = "soso_outcome_metrics_v1";
const METRICS_EVENT_NAME = "soso:metrics-updated";

export type OutcomeMetricKey =
  | "discovery_search_started"
  | "profile_opened"
  | "chat_message_sent"
  | "official_link_clicked";

export interface OutcomeMetricsSnapshot {
  discovery_search_started: number;
  profile_opened: number;
  chat_message_sent: number;
  official_link_clicked: number;
}

/** Default snapshot; safe for SSR and initial client paint (before localStorage hydrate). */
export const EMPTY_OUTCOME_METRICS: OutcomeMetricsSnapshot = {
  discovery_search_started: 0,
  profile_opened: 0,
  chat_message_sent: 0,
  official_link_clicked: 0,
};

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
}

function toFiniteCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

export function getOutcomeMetricsSnapshot(): OutcomeMetricsSnapshot {
  if (typeof window === "undefined") return { ...EMPTY_OUTCOME_METRICS };
  try {
    const raw = window.localStorage.getItem(METRICS_STORAGE_KEY);
    if (!raw) return { ...EMPTY_OUTCOME_METRICS };
    const parsed = JSON.parse(raw) as Partial<OutcomeMetricsSnapshot>;
    return {
      discovery_search_started: toFiniteCount(parsed.discovery_search_started),
      profile_opened: toFiniteCount(parsed.profile_opened),
      chat_message_sent: toFiniteCount(parsed.chat_message_sent),
      official_link_clicked: toFiniteCount(parsed.official_link_clicked),
    };
  } catch {
    return { ...EMPTY_OUTCOME_METRICS };
  }
}

export function bumpOutcomeMetric(metric: OutcomeMetricKey, delta = 1): OutcomeMetricsSnapshot {
  if (typeof window === "undefined") return { ...EMPTY_OUTCOME_METRICS };
  const current = getOutcomeMetricsSnapshot();
  const next = {
    ...current,
    [metric]: Math.max(0, current[metric] + Math.max(1, Math.trunc(delta))),
  } as OutcomeMetricsSnapshot;

  try {
    window.localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(METRICS_EVENT_NAME, { detail: next }));
  } catch {
    // Keep analytics non-blocking for product UX.
  }
  return next;
}

export function onOutcomeMetricsUpdated(
  listener: (metrics: OutcomeMetricsSnapshot) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event) => {
    const custom = event as CustomEvent<OutcomeMetricsSnapshot | undefined>;
    listener(custom.detail ?? getOutcomeMetricsSnapshot());
  };
  window.addEventListener(METRICS_EVENT_NAME, handler);
  return () => window.removeEventListener(METRICS_EVENT_NAME, handler);
}

/** For `useSyncExternalStore`: subscribe without setState-in-effect. */
export function subscribeOutcomeMetrics(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(METRICS_EVENT_NAME, handler);
  return () => window.removeEventListener(METRICS_EVENT_NAME, handler);
}

/** Stable string snapshot for `useSyncExternalStore` (Object.is compares strings). */
export function getOutcomeMetricsSnapshotString(): string {
  return JSON.stringify(getOutcomeMetricsSnapshot());
}

export function getServerOutcomeMetricsSnapshotString(): string {
  return JSON.stringify(EMPTY_OUTCOME_METRICS);
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  try {
    const g = window.gtag;
    if (typeof g !== "function") return;
    g("event", name, params);
  } catch {
    // Never interrupt UX because analytics failed.
  }
}
