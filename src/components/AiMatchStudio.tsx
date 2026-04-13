"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ExternalLink, GraduationCap, Wallet, Globe2 } from "lucide-react";
import { countries } from "@/lib/countries";
import { authFetch } from "@/lib/client-auth";
import type { Language } from "@/lib/i18n";
import { loadAiMatchStudioPersisted, saveAiMatchStudioPersisted } from "@/lib/ai-match-studio-storage";
import type { AiShortlistListOrigin, AiShortlistResult } from "@/types/ai-shortlist";

type Copy = {
  countryLabel: string;
  goalsLabel: string;
  goalsPlaceholder: string;
  fieldLabel: string;
  fieldPlaceholder: string;
  budgetLabel: string;
  budgetUnspecified: string;
  budgetLow: string;
  budgetMid: string;
  budgetHigh: string;
  submit: string;
  needAuth: string;
  signIn: string;
  errorGeneric: string;
  emptyPicks: string;
  listOrigin: Record<AiShortlistListOrigin, string>;
  picksTitle: string;
  fitLabel: string;
  nextStep: string;
  openSearch: string;
  openChat: string;
  aiResearchBadge: string;
  picksModeBanner: string;
};

const COPY: Record<Language, Copy> = {
  uz: {
    countryLabel: "Mamlakat (tavsiya ro‘yxati)",
    goalsLabel: "Maqsadingiz va cheklovlaringiz",
    goalsPlaceholder:
      "Masalan: magistratura, Data Science, ingliz tili B2, byudjet oyiga ~800 USD, kichik shahar ham mos...",
    fieldLabel: "Yo‘nalish (ixtiyoriy)",
    fieldPlaceholder: "Masalan: Computer Science, Business...",
    budgetLabel: "Byudjet zonasi",
    budgetUnspecified: "Aniqlanmagan",
    budgetLow: "Past",
    budgetMid: "O‘rta",
    budgetHigh: "Yuqori",
    submit: "AI qisqa ro‘yxat",
    needAuth: "Qisqa ro‘yxat olish uchun hisobga kiring — AI javoblari serverda shakllanadi.",
    signIn: "Kirish",
    errorGeneric: "So‘rov bajarilmadi. Qayta urinib ko‘ring.",
    emptyPicks:
      "Hozirgi katalog uchun tanlov juda kam. Qidiruv yoki boshqa mamlakatni tanlang; AI maslahatchi bilan davom eting.",
    listOrigin: {
      "soso-country-ranking": "SOSO milliy reyting keshi",
      "soso-world-slice": "SOSO jahon reytingi × mamlakat",
      hipolabs: "Hipolabs ochiq katalog",
      "global-world-pool": "Jahon namunaviy ro‘yxati",
    },
    picksTitle: "Mos keladiganlar",
    fitLabel: "Moslik",
    nextStep: "Keyingi qadam",
    openSearch: "Katalogda qidirish",
    openChat: "AI maslahatchi",
    aiResearchBadge: "AI tavsiyasi (katalogdan tashqari)",
    picksModeBanner:
      "Bazada bu mamlakat uchun universitetlar ro‘yxati kam — quyidagi tanlovlar mustaqil AI tavsiyasi; barcha ma’lumotlarni rasmiy saytda tekshiring.",
  },
  ru: {
    countryLabel: "Страна (список для подбора)",
    goalsLabel: "Цели и ограничения",
    goalsPlaceholder:
      "Например: магистратура, Data Science, английский B2, бюджет ~800 USD/мес, подойдёт небольшой город...",
    fieldLabel: "Направление (необязательно)",
    fieldPlaceholder: "Например: Computer Science, Business...",
    budgetLabel: "Бюджет",
    budgetUnspecified: "Не указан",
    budgetLow: "Ниже",
    budgetMid: "Средний",
    budgetHigh: "Выше",
    submit: "AI подбор",
    needAuth: "Войдите в аккаунт для подбора — ответы ИИ формируются на сервере.",
    signIn: "Войти",
    errorGeneric: "Запрос не выполнен. Попробуйте снова.",
    emptyPicks:
      "Для текущего каталога слишком мало вариантов. Смените страницу или продолжите в AI-чате.",
    listOrigin: {
      "soso-country-ranking": "Национальный рейтинг SOSO",
      "soso-world-slice": "Мировой рейтинг SOSO × страна",
      hipolabs: "Открытый каталог Hipolabs",
      "global-world-pool": "Глобальная выборка",
    },
    picksTitle: "Подходящие варианты",
    fitLabel: "Соответствие",
    nextStep: "Следующий шаг",
    openSearch: "Поиск в каталоге",
    openChat: "AI-советник",
    aiResearchBadge: "Предложение ИИ (вне каталога)",
    picksModeBanner:
      "В базе мало университетов для этой страны — ниже независимые подсказки ИИ; проверьте всё на официальных сайтах.",
  },
  en: {
    countryLabel: "Country (shortlist source)",
    goalsLabel: "Goals & constraints",
    goalsPlaceholder:
      "e.g. Master’s in Data Science, English B2, budget ~USD 800/mo, smaller city OK...",
    fieldLabel: "Field (optional)",
    fieldPlaceholder: "e.g. Computer Science, Business...",
    budgetLabel: "Budget band",
    budgetUnspecified: "Unspecified",
    budgetLow: "Lower",
    budgetMid: "Mid",
    budgetHigh: "Higher",
    submit: "Build AI shortlist",
    needAuth: "Sign in to run the shortlist — AI responses are generated on our servers.",
    signIn: "Sign in",
    errorGeneric: "Request failed. Please try again.",
    emptyPicks:
      "Too few universities in the current batch for this country. Try another country or continue in AI chat.",
    listOrigin: {
      "soso-country-ranking": "SOSO national ranking cache",
      "soso-world-slice": "SOSO world ranking × country",
      hipolabs: "Hipolabs open directory",
      "global-world-pool": "Global sample pool",
    },
    picksTitle: "Top matches",
    fitLabel: "Fit",
    nextStep: "Next step",
    openSearch: "Search catalog",
    openChat: "AI advisor",
    aiResearchBadge: "AI suggestion (outside catalog)",
    picksModeBanner:
      "Our catalog has few universities for this country — these picks are independent AI suggestions. Verify everything on official sites.",
  },
};

function buildSearchHref(country: string, query?: string) {
  const params = new URLSearchParams({ country, page: "1" });
  if (query?.trim()) params.set("q", query.trim());
  return `/search?${params.toString()}`;
}

function encodeUniPath(name: string) {
  return encodeURIComponent(name);
}

export default function AiMatchStudio({
  lang,
  defaultCountry,
  isAuthenticated,
}: {
  lang: Language;
  defaultCountry: string;
  isAuthenticated: boolean;
}) {
  const copy = COPY[lang] ?? COPY.en;
  const [country, setCountry] = useState(defaultCountry || "United Kingdom");
  const [goals, setGoals] = useState("");
  const [studyField, setStudyField] = useState("");
  const [budgetTier, setBudgetTier] = useState<"unspecified" | "low" | "mid" | "high">("unspecified");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiShortlistResult | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const p = loadAiMatchStudioPersisted(lang);
    if (p) {
      setCountry(p.country);
      setGoals(p.goals);
      setStudyField(p.studyField);
      setBudgetTier(p.budgetTier);
      setResult(p.result);
    }
    setRestored(true);
  }, [lang]);

  useEffect(() => {
    if (!restored || loading) return;
    saveAiMatchStudioPersisted({
      lang,
      country,
      goals,
      studyField,
      budgetTier,
      result,
    });
  }, [restored, loading, lang, country, goals, studyField, budgetTier, result]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          country,
          goals,
          studyField: studyField.trim() || undefined,
          budgetTier: budgetTier === "unspecified" ? undefined : budgetTier,
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const msg =
          payload && typeof payload === "object" && typeof (payload as { error?: string }).error === "string"
            ? (payload as { error: string }).error
            : copy.errorGeneric;
        throw new Error(msg);
      }
      setResult(payload as AiShortlistResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-studio-match space-y-8">
      {!isAuthenticated ? (
        <div className="rounded-2xl border border-(--product-outline) bg-(--product-surface) px-4 py-3 text-sm text-(--product-on-surface) flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-(--product-on-surface-variant)">{copy.needAuth}</span>
          <Link
            href="/login?next=/ai-studio"
            className="product-primary-btn shrink-0 px-5 py-2 text-sm"
          >
            {copy.signIn}
          </Link>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-(--product-outline) bg-white p-5 sm:p-8 shadow-[0_1px_2px_rgba(60,64,67,0.12)]"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-(--product-on-surface-variant)">
          <Sparkles size={14} className="text-(--product-primary)" aria-hidden />
          SOSO AI
        </div>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <Globe2 size={14} /> {copy.countryLabel}
          </span>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-semibold text-neutral-700">{copy.goalsLabel}</span>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={4}
            required
            minLength={8}
            placeholder={copy.goalsPlaceholder}
            className="w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <GraduationCap size={14} /> {copy.fieldLabel}
            </span>
            <input
              type="text"
              value={studyField}
              onChange={(e) => setStudyField(e.target.value)}
              placeholder={copy.fieldPlaceholder}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
            />
          </label>
          <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
              <Wallet size={14} /> {copy.budgetLabel}
            </span>
            <select
              value={budgetTier}
              onChange={(e) => setBudgetTier(e.target.value as typeof budgetTier)}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
            >
              <option value="unspecified">{copy.budgetUnspecified}</option>
              <option value="low">{copy.budgetLow}</option>
              <option value="mid">{copy.budgetMid}</option>
              <option value="high">{copy.budgetHigh}</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !isAuthenticated || goals.trim().length < 8}
          className="product-primary-btn w-full py-3.5 text-base font-medium sm:w-auto sm:px-10"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {copy.submit}
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
              {copy.listOrigin[result.list_origin]}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-neutral-800">{result.summary}</p>
            <p className="mt-4 text-xs text-neutral-600 border-t border-neutral-200/80 pt-4">{result.trust_note}</p>
          </div>

          {(result.picks_mode ?? "catalog") === "ai_research" ? (
            <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
              {copy.picksModeBanner}
            </p>
          ) : null}

          {result.picks.length === 0 ? (
            <p className="text-sm text-neutral-600">{copy.emptyPicks}</p>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-black tracking-tight text-neutral-900">{copy.picksTitle}</h3>
              <ul className="space-y-4">
                {result.picks.map((pick) => (
                  <li
                    key={`${pick.pick_source ?? "catalog"}-${pick.index}-${pick.name}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-neutral-900">{pick.name}</p>
                        <p className="text-xs text-neutral-500">{pick.country}</p>
                        {(pick.pick_source ?? "catalog") === "ai_research" ? (
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800/90">
                            {copy.aiResearchBadge}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-700">
                        {copy.fitLabel} {pick.fit_score}/5
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-700 leading-relaxed">{pick.reason}</p>
                    <p className="mt-2 text-xs font-semibold text-neutral-800">
                      {copy.nextStep}: {pick.next_step}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {pick.website ? (
                        <a
                          href={pick.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-800 hover:border-neutral-900"
                        >
                          <ExternalLink size={12} /> www
                        </a>
                      ) : null}
                      {(pick.pick_source ?? "catalog") === "ai_research" ? (
                        <Link
                          href={buildSearchHref(pick.country || country, pick.name)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-neutral-800 hover:border-neutral-900"
                        >
                          {copy.openSearch}
                        </Link>
                      ) : (
                        <Link
                          href={`/university/${encodeUniPath(pick.name)}?lang=${lang}`}
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white hover:opacity-90"
                          style={{ backgroundColor: "var(--product-primary)" }}
                        >
                          SOSO profil
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={buildSearchHref(country)}
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-800 hover:border-neutral-900"
            >
              {copy.openSearch}
            </Link>
            <Link
              href="/chat"
              className="product-primary-btn px-5 py-2.5 text-xs font-medium uppercase tracking-wide"
            >
              {copy.openChat}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
