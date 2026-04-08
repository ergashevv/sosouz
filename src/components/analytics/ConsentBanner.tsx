"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const CONSENT_COOKIE = "soso_analytics_consent";
const CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 180;

function readConsentCookie(): "granted" | "denied" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)(?:;|$)`),
  );
  const v = match?.[1];
  return v === "granted" || v === "denied" ? v : null;
}

function writeConsentCookie(value: "granted" | "denied") {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

function pushConsentToGtag(granted: boolean) {
  if (typeof window === "undefined") return;
  const g = window.gtag;
  if (typeof g !== "function") return;
  g("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    personalization_storage: "denied",
  });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function ConsentBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(() => readConsentCookie() === null);

  useEffect(() => {
    const existing = readConsentCookie();
    if (existing === "granted") {
      pushConsentToGtag(true);
      return;
    }
    if (existing === "denied") {
      pushConsentToGtag(false);
    }
  }, []);

  if (!visible) return null;

  const onAccept = () => {
    writeConsentCookie("granted");
    pushConsentToGtag(true);
    setVisible(false);
  };

  const onReject = () => {
    writeConsentCookie("denied");
    pushConsentToGtag(false);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t("cookie.analytics.title")}
      className="fixed bottom-0 left-0 right-0 z-80 border-t border-neutral-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <div className="min-w-0 space-y-1 pr-0 sm:pr-4">
          <p className="text-sm font-bold text-neutral-900">{t("cookie.analytics.title")}</p>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{t("cookie.analytics.body")}</p>
          <p className="text-[11px] text-neutral-500">
            <Link href="/terms" className="font-semibold text-blue-700 underline decoration-blue-200 hover:text-blue-800">
              {t("cookie.analytics.termsLink")}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-xs font-bold text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            {t("cookie.analytics.reject")}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            {t("cookie.analytics.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
