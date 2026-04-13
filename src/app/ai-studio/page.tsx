"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  LayoutGrid,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import SearchHeader from "@/components/SearchHeader";
import AiMatchStudio from "@/components/AiMatchStudio";
import { buildTopUniversityPath } from "@/lib/top-university-defaults";
import { useLanguage } from "@/contexts/LanguageContext";
import ContactMailtoLink from "@/components/ContactMailtoLink";
import { authFetch } from "@/lib/client-auth";

interface MePayload {
  authenticated: boolean;
}

export default function AiStudioPage() {
  const { t, language } = useLanguage();
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await authFetch("/api/auth/me");
        const data = (await res.json()) as MePayload;
        if (!active) return;
        setAuth(Boolean(data.authenticated));
      } catch {
        if (active) setAuth(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const trustItems = [t("aiStudio.trust1"), t("aiStudio.trust2"), t("aiStudio.trust3"), t("aiStudio.trust4")];

  return (
    <main className="min-h-screen bg-(--product-surface) pb-20 text-(--product-on-surface)">
      <SearchHeader fixed={false} showSearchForm={false} />

      <div className="product-hero">
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          <p className="text-sm text-(--product-on-surface-variant)">{t("aiStudio.productBreadcrumb")}</p>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-[2.75rem]">
            {t("aiStudio.heroTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-(--product-on-surface-variant) sm:text-lg">
            {t("aiStudio.heroLead")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#ai-match" className="product-primary-btn px-6 py-3 text-base">
              {t("aiStudio.heroCtaPrimary")}
            </a>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-(--product-outline) bg-white px-5 py-2.5 text-sm font-medium text-(--product-on-surface) shadow-sm transition hover:bg-neutral-50"
            >
              <Search size={16} aria-hidden /> {t("aiStudio.heroCtaSecondary")}
            </Link>
            <Link href="/chat" className="product-text-link inline-flex items-center gap-1 px-2 py-1">
              {t("chat.navActive")} <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-center text-xs font-medium uppercase tracking-[0.12em] text-(--product-on-surface-variant)">
          {t("aiStudio.howTitle")}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="product-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-800">
              <Search size={20} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-medium">{t("aiStudio.howStep1Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t("aiStudio.howStep1Body")}</p>
          </div>
          <div className="product-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-800">
              <MessageCircle size={20} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-medium">{t("aiStudio.howStep2Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t("aiStudio.howStep2Body")}</p>
          </div>
          <div className="product-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-800">
              <Shield size={20} aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-medium">{t("aiStudio.howStep3Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t("aiStudio.howStep3Body")}</p>
          </div>
        </div>

        <div className="product-trust-panel mt-12">
          <div className="flex items-center gap-2 text-sm font-medium text-(--product-on-surface)">
            <Sparkles className="text-(--product-primary)" size={18} aria-hidden />
            {t("aiStudio.trustTitle")}
          </div>
          <ul className="mt-5 space-y-3">
            {trustItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-(--product-on-surface-variant)">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-(--product-primary)" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h2 className="mt-16 text-center text-xl font-medium sm:text-2xl">{t("aiStudio.featuresTitle")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="product-card">
            <Target className="text-(--product-primary)" size={22} aria-hidden />
            <h3 className="mt-3 text-base font-medium">{t("aiStudio.matchTitle")}</h3>
            <p className="mt-2 text-sm text-(--product-on-surface-variant)">{t("aiStudio.matchSubtitle")}</p>
          </article>
          <article className="product-card">
            <Bot className="text-(--product-primary)" size={22} aria-hidden />
            <h3 className="mt-3 text-base font-medium">{t("chat.title")}</h3>
            <p className="mt-2 text-sm text-(--product-on-surface-variant)">{t("chat.subtitle")}</p>
          </article>
          <article className="product-card">
            <LayoutGrid className="text-(--product-primary)" size={22} aria-hidden />
            <h3 className="mt-3 text-base font-medium">{t("aiStudio.featureGridSearchTitle")}</h3>
            <p className="mt-2 text-sm text-(--product-on-surface-variant)">{t("aiStudio.featureGridSearchBody")}</p>
          </article>
          <article className="product-card">
            <Sparkles className="text-(--product-primary)" size={22} aria-hidden />
            <h3 className="mt-3 text-base font-medium">{t("nav.top")}</h3>
            <p className="mt-2 text-sm text-(--product-on-surface-variant)">{t("aiStudio.featureGridRankBody")}</p>
            <Link
              href={buildTopUniversityPath({})}
              className="product-text-link mt-3 inline-flex items-center gap-1 text-sm"
            >
              {t("aiStudio.featureRankLink")} <ArrowRight size={14} aria-hidden />
            </Link>
          </article>
        </div>

        <div id="ai-match" className="scroll-mt-28 pt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-medium tracking-tight">{t("aiStudio.matchTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm text-(--product-on-surface-variant)">{t("aiStudio.matchSubtitle")}</p>
          </div>
          <AiMatchStudio lang={language} defaultCountry="United Kingdom" isAuthenticated={auth === true} />
        </div>

        <section className="product-card mt-14">
          <h3 className="text-base font-medium">{t("aiStudio.workflowTitle")}</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-(--product-on-surface-variant)">
            <li>{t("aiStudio.step1")}</li>
            <li>{t("aiStudio.step2")}</li>
            <li>{t("aiStudio.step3")}</li>
          </ol>
        </section>
      </div>

      <footer className="border-t border-(--product-outline) bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <p className="text-center text-xs text-(--product-on-surface-variant) sm:text-left">{t("footer.copyright")}</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-(--product-on-surface-variant)">
            <Link href="/about" className="hover:text-(--product-on-surface)">
              {t("nav.about")}
            </Link>
            <Link href="/terms" className="hover:text-(--product-on-surface)">
              {t("nav.terms")}
            </Link>
            <ContactMailtoLink className="hover:text-(--product-on-surface)" />
          </div>
        </div>
      </footer>
    </main>
  );
}
