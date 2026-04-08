'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin, ExternalLink, DollarSign, Award, ClipboardList, Info, ArrowLeft, Shield, Search, Clock3, BookOpen, Play } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import SmartImage from '@/components/SmartImage';
import DataFreshnessStrip from '@/components/DataFreshnessStrip';
import { University } from '@/lib/api';
import { translations, type Language } from '@/lib/i18n';
import type { YoutubeVideoPreview } from '@/lib/university-youtube';
import {
  clampHttpUrlToOfficial,
  collectOfficialBases,
  officialHomeUrl,
  urlMatchesOfficialBases,
} from '@/lib/official-url';
import { highlightInlinePrices } from '@/lib/highlight-inline-prices';
import { bumpOutcomeMetric, trackEvent } from '@/lib/analytics';

export interface AIResearchData {
  tuition_fees?: string | null;
  scholarships?: { name: string; link: string }[] | null;
  programs?: Array<string | { name?: string; link?: string | null }> | null;
  admission_requirements?: Record<string, string | number | boolean> | null;
  admission_deadline?: string | null;
  detailed_overview?: string | null;
  source_links?:
    | Array<string | { title?: string; link?: string; url?: string; snippet?: string }>
    | null;
  data_confidence?: number | null;
  refresh_status?: string | null;
  last_updated?: string | Date | null;
  next_refresh_at?: string | Date | null;
}

export interface UniversityDetailsProps {
  basicInfo: University;
  aiDetails: AIResearchData | null;
  domain: string;
  logoSrc: string;
  fallbackSrc: string;
  lang?: Language;
  youtubeVideos?: YoutubeVideoPreview[] | null;
}

function t(key: string, lang: Language) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

function heroTrustMeta(
  aiDetails: AIResearchData | null,
  lang: Language,
): { label: string; textClass: string; iconClass: string } {
  if (!aiDetails) {
    return {
      label: t('uni.hero_trust_pending', lang),
      textClass: 'text-neutral-500',
      iconClass: 'text-neutral-400',
    };
  }
  const s = (aiDetails.refresh_status || '').toLowerCase().trim();
  if (s === 'failed') {
    return {
      label: t('uni.hero_trust_incomplete', lang),
      textClass: 'text-amber-800',
      iconClass: 'text-amber-600',
    };
  }
  if (s === 'partial' || s === 'stale') {
    return {
      label: t('uni.hero_trust_review', lang),
      textClass: 'text-amber-800',
      iconClass: 'text-amber-600',
    };
  }
  if (s === 'fresh') {
    return {
      label: t('uni.hero_trust_verified', lang),
      textClass: 'text-neutral-800',
      iconClass: 'text-neutral-600',
    };
  }
  return {
    label: t('uni.hero_trust_general', lang),
    textClass: 'text-neutral-600',
    iconClass: 'text-neutral-500',
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function formatDateStable(date: Date, lang: Language): string {
  const day = pad2(date.getUTCDate());
  const month = pad2(date.getUTCMonth() + 1);
  const year = String(date.getUTCFullYear());

  if (lang === 'en') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${monthNames[date.getUTCMonth()]} ${year}`;
  }

  return `${day}.${month}.${year}`;
}

function localizeStructuredValue(
  value: string | null | undefined,
  lang: Language,
  field: 'tuition' | 'deadline',
): string {
  if (!value) return '';
  if (lang === 'en') return value;

  let localized = value;
  type ReplacementEntry = [RegExp, string];

  localized = localized.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, '$1');

  const monthMap: ReplacementEntry[] =
    lang === 'uz'
      ? [
          [/\bJanuary\b/gi, 'Yanvar'],
          [/\bFebruary\b/gi, 'Fevral'],
          [/\bMarch\b/gi, 'Mart'],
          [/\bApril\b/gi, 'Aprel'],
          [/\bMay\b/gi, 'May'],
          [/\bJune\b/gi, 'Iyun'],
          [/\bJuly\b/gi, 'Iyul'],
          [/\bAugust\b/gi, 'Avgust'],
          [/\bSeptember\b/gi, 'Sentabr'],
          [/\bOctober\b/gi, 'Oktabr'],
          [/\bNovember\b/gi, 'Noyabr'],
          [/\bDecember\b/gi, 'Dekabr'],
        ]
      : [
          [/\bJanuary\b/gi, 'Январь'],
          [/\bFebruary\b/gi, 'Февраль'],
          [/\bMarch\b/gi, 'Март'],
          [/\bApril\b/gi, 'Апрель'],
          [/\bMay\b/gi, 'Май'],
          [/\bJune\b/gi, 'Июнь'],
          [/\bJuly\b/gi, 'Июль'],
          [/\bAugust\b/gi, 'Август'],
          [/\bSeptember\b/gi, 'Сентябрь'],
          [/\bOctober\b/gi, 'Октябрь'],
          [/\bNovember\b/gi, 'Ноябрь'],
          [/\bDecember\b/gi, 'Декабрь'],
        ];

  for (const [pattern, replacement] of monthMap) {
    localized = localized.replace(pattern, replacement);
  }

  const commonMap: ReplacementEntry[] =
    lang === 'uz'
      ? [
          [/\bfor most courses via UCAS\b/gi, "ko'pchilik kurslar uchun UCAS orqali"],
          [/\bvaries by program\b/gi, "yo'nalishga qarab farq qiladi"],
          [/\boften rolling admissions\b/gi, "ko'pincha rolling qabul asosida"],
          [/\bspecific deadlines\b/gi, 'aniq muddatlar'],
          [/\bfor September intake\b/gi, 'sentabr qabuli uchun'],
          [/\bapplicants are advised to check individual course pages\b/gi, "abituriyentlarga alohida kurs sahifalarini tekshirish tavsiya etiladi"],
          [/\bcheck individual course pages\b/gi, "alohida kurs sahifalarini tekshiring"],
        ]
      : [
          [/\bfor most courses via UCAS\b/gi, 'для большинства программ через UCAS'],
          [/\bvaries by program\b/gi, 'зависит от программы'],
          [/\boften rolling admissions\b/gi, 'часто при скользящем наборе'],
          [/\bspecific deadlines\b/gi, 'конкретные дедлайны'],
          [/\bfor September intake\b/gi, 'для сентябрьского набора'],
          [/\bapplicants are advised to check individual course pages\b/gi, 'абитуриентам рекомендуется проверить страницы отдельных программ'],
          [/\bcheck individual course pages\b/gi, 'проверяйте страницы отдельных программ'],
        ];

  for (const [pattern, replacement] of commonMap) {
    localized = localized.replace(pattern, replacement);
  }

  if (field === 'tuition') {
    const tuitionMap: ReplacementEntry[] =
      lang === 'uz'
        ? [
            [/\bapprox\.?\b/gi, 'taxminan'],
            [/\bestimate(d)?\b/gi, "taxminiy"],
            [/\bper year\b/gi, 'yiliga'],
            [/\bannual\b/gi, 'yillik'],
          ]
        : [
            [/\bapprox\.?\b/gi, 'примерно'],
            [/\bestimate(d)?\b/gi, "оценочно"],
            [/\bper year\b/gi, 'в год'],
            [/\bannual\b/gi, 'годовой'],
          ];

    for (const [pattern, replacement] of tuitionMap) {
      localized = localized.replace(pattern, replacement);
    }
  }

  if (field === 'deadline') {
    const deadlineMap: ReplacementEntry[] =
      lang === 'uz'
        ? [
            [/\bUndergraduate\b/gi, 'Bakalavriat'],
            [/\bPostgraduate\b/gi, 'Magistratura'],
            [/\bRolling Admissions\b/gi, 'Arizalar doimiy qabul qilinadi'],
          ]
        : [
            [/\bUndergraduate\b/gi, 'Бакалавриат'],
            [/\bPostgraduate\b/gi, 'Магистратура'],
            [/\bRolling Admissions\b/gi, 'Скользящий набор'],
          ];

    for (const [pattern, replacement] of deadlineMap) {
      localized = localized.replace(pattern, replacement);
    }
  }

  return localized;
}

function excerptForHero(text: string, maxChars: number): { excerpt: string; truncated: boolean } {
  const trimmed = text.trim();
  if (!trimmed) return { excerpt: '', truncated: false };
  if (trimmed.length <= maxChars) return { excerpt: trimmed, truncated: false };
  const slice = trimmed.slice(0, maxChars);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
  );
  if (lastSentenceEnd >= Math.floor(maxChars * 0.35)) {
    return { excerpt: slice.slice(0, lastSentenceEnd + 1).trim(), truncated: true };
  }
  const lastSpace = slice.lastIndexOf(' ');
  const excerpt = `${(lastSpace > 0 ? slice.slice(0, lastSpace) : slice).trim()}…`;
  return { excerpt, truncated: true };
}

function clipHeroLine(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars - 1).trimEnd()}…`;
}

interface NormalizedProgram {
  name: string;
  link: string | null;
}

interface NormalizedSource {
  title: string;
  link: string;
  shortLink: string;
  host: string;
  snippet: string | null;
  linkType: 'program' | 'general';
  intent: 'apply' | 'tuition' | 'program' | 'general';
}

function normalizeProgram(
  program: string | { name?: string; link?: string | null },
  fallbackLink: string | null,
): NormalizedProgram | null {
  if (typeof program === 'string') {
    const name = program.trim();
    if (!name) return null;
    return { name, link: fallbackLink };
  }

  if (!program || typeof program !== 'object') return null;
  const name = typeof program.name === 'string' ? program.name.trim() : '';
  const link = typeof program.link === 'string' ? program.link.trim() : '';
  if (!name) return null;

  return { name, link: link || fallbackLink };
}

function toShortLink(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/$/, '');
    if (!path || path === '/') return host;
    return `${host}${path.length > 28 ? `${path.slice(0, 28)}...` : path}`;
  } catch {
    return url.length > 40 ? `${url.slice(0, 40)}...` : url;
  }
}

function getHostLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const parts = hostname.split('.');
    // Strip CDN/technical subdomains that contain digits with hyphens (e.g. tip-134-219-220-117.rhul.ac.uk)
    if (parts.length > 2 && /\d/.test(parts[0]) && /-/.test(parts[0])) {
      return parts.slice(1).join('.');
    }
    return hostname;
  } catch {
    return 'external';
  }
}

function inferSourceType(url: string): 'program' | 'general' {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (/(program|programme|course|study|undergraduate|postgraduate|department)/.test(path)) {
      return 'program';
    }
  } catch {
    return 'general';
  }
  return 'general';
}

function inferSourceIntent(
  url: string,
  title: string,
  snippet: string | null,
): 'apply' | 'tuition' | 'program' | 'general' {
  const haystack = `${url} ${title} ${snippet || ''}`.toLowerCase();
  const applyPattern =
    /(apply|application|admission|admissions|how-to-apply|entry requirement|international student|enrol|enroll|prospective)/;
  if (applyPattern.test(haystack)) return 'apply';

  const tuitionPattern =
    /(tuition|fee|fees|cost|finance|financial|payment|funding|contract|pricing)/;
  if (tuitionPattern.test(haystack)) return 'tuition';

  const programPattern = /(program|programme|course|study|major|faculty|department)/;
  if (programPattern.test(haystack)) return 'program';

  return 'general';
}

function toSnippetPreview(rawSnippet: string | null): string | null {
  if (!rawSnippet) return null;
  const cleaned = rawSnippet.replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.length > 180 ? `${cleaned.slice(0, 180)}...` : cleaned;
}

function cleanSourceTitle(rawTitle: string, url: string, fallbackTitle: string): string {
  const trimmed = rawTitle.trim();
  if (!trimmed || /^source\s+\d+$/i.test(trimmed)) {
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] || '';
      if (lastSegment) {
        return decodeURIComponent(lastSegment)
          .replace(/[-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch {
      return fallbackTitle;
    }
    return fallbackTitle;
  }

  return trimmed
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s+-\s*(Official Site|Official Website|Home)$/i, '')
    .trim();
}

function normalizeSource(
  source: string | { title?: string; link?: string; url?: string; snippet?: string },
  index: number,
): NormalizedSource | null {
  const fallbackTitle = `Source ${index + 1}`;
  if (typeof source === 'string') {
    const link = source.trim();
    if (!link) return null;
    return {
      title: fallbackTitle,
      link,
      shortLink: toShortLink(link),
      host: getHostLabel(link),
      snippet: null,
      linkType: inferSourceType(link),
      intent: inferSourceIntent(link, fallbackTitle, null),
    };
  }

  if (!source || typeof source !== 'object') return null;
  const linkRaw = typeof source.link === 'string' ? source.link : source.url;
  const link = typeof linkRaw === 'string' ? linkRaw.trim() : '';
  if (!link) return null;
  const titleRaw = typeof source.title === 'string' ? source.title : '';
  const title = cleanSourceTitle(titleRaw, link, fallbackTitle);
  const snippetRaw = typeof source.snippet === 'string' ? source.snippet : null;
  const snippet = toSnippetPreview(snippetRaw);

  return {
    title,
    link,
    shortLink: toShortLink(link),
    host: getHostLabel(link),
    snippet,
    linkType: inferSourceType(link),
    intent: inferSourceIntent(link, title, snippet),
  };
}

export default function UniversityDetailView({
  basicInfo,
  aiDetails,
  domain,
  logoSrc,
  fallbackSrc,
  lang = 'en',
  youtubeVideos = null,
}: UniversityDetailsProps) {
  const [summaryExpandedMobile, setSummaryExpandedMobile] = useState(false);
  const [programsExpandedMobile, setProgramsExpandedMobile] = useState(false);
  const [sourcesExpandedMobile, setSourcesExpandedMobile] = useState(false);
  const trackOfficialClick = (targetType: 'official' | 'apply' | 'program' | 'tuition' | 'source') => {
    bumpOutcomeMetric('official_link_clicked');
    trackEvent('soso_official_link_clicked', {
      target_type: targetType,
      country: basicInfo.country,
      university_name: basicInfo.name,
    });
  };
  const websiteFallback = basicInfo.web_pages?.[0] || null;
  const officialBases = collectOfficialBases({
    primaryDomain: domain,
    domains: basicInfo.domains,
    web_pages: basicInfo.web_pages,
  });
  const displayHome =
    officialHomeUrl(officialBases, basicInfo.web_pages) ||
    (websiteFallback
      ? (() => {
          try {
            return new URL(websiteFallback).origin + '/';
          } catch {
            return '';
          }
        })()
      : '') ||
    (domain && domain !== 'unknown' ? `https://${domain}/` : '');
  const linkFallbackForClamp = displayHome || websiteFallback || '';

  const normalizedPrograms = (aiDetails?.programs || [])
    .map((program) => normalizeProgram(program, websiteFallback))
    .filter((program): program is NormalizedProgram => Boolean(program))
    .map((program) => ({
      ...program,
      link: program.link
        ? clampHttpUrlToOfficial(program.link, officialBases, linkFallbackForClamp)
        : null,
    }));
  const normalizedSources = (aiDetails?.source_links || [])
    .map((source, index) => normalizeSource(source, index))
    .filter((source): source is NormalizedSource => Boolean(source))
    .filter(
      (source) =>
        officialBases.length === 0 || urlMatchesOfficialBases(source.link, officialBases),
    )
    .slice(0, 6);
  const heroTrust = heroTrustMeta(aiDetails, lang);
  const overviewBody = aiDetails?.detailed_overview?.trim() || '';
  const confidencePct =
    typeof aiDetails?.data_confidence === 'number' && Number.isFinite(aiDetails.data_confidence)
      ? Math.min(100, Math.max(0, Math.round(aiDetails.data_confidence * 100)))
      : null;
  const nextRefreshAt =
    aiDetails?.next_refresh_at ? new Date(aiDetails.next_refresh_at) : null;
  const formattedNextRefresh =
    nextRefreshAt && !Number.isNaN(nextRefreshAt.getTime())
      ? formatDateStable(nextRefreshAt, lang)
      : null;
  const localizedTuition = localizeStructuredValue(aiDetails?.tuition_fees, lang, 'tuition');
  const localizedDeadline = localizeStructuredValue(aiDetails?.admission_deadline, lang, 'deadline');
  const tuitionDisplay = localizedTuition || t('uni.not_specified', lang);
  const tuitionSizeClass =
    tuitionDisplay.length > 90
      ? 'text-base sm:text-lg leading-relaxed wrap-break-word'
      : 'text-xl sm:text-2xl leading-snug wrap-break-word max-w-[26ch]';
  const showLessLabel = lang === 'uz' ? "Qisqartirish" : lang === 'ru' ? 'Скрыть' : 'Show less';
  const officialWebsiteTitle =
    lang === 'uz'
      ? "Universitetning rasmiy sayti"
      : lang === 'ru'
        ? 'Официальный сайт университета'
        : 'Official university website';
  const officialWebsiteDescription =
    lang === 'uz'
      ? "Aniq ma'lumot olish uchun universitetning rasmiy saytiga tashrif buyuring."
      : lang === 'ru'
        ? 'Для получения точной информации посетите официальный сайт университета.'
        : 'For accurate information, visit the official university website.';
  const heroOfficialNotice =
    lang === 'uz'
      ? "Aniq ma'lumot olish uchun rasmiy veb-saytga tashrif buyuring."
      : lang === 'ru'
        ? 'Для получения точной информации посетите официальный сайт.'
        : 'For accurate information, visit the official website.';
  const sourceTypeLabel = (type: 'program' | 'general') => {
    if (lang === 'uz') return type === 'program' ? "Yo'nalish sahifasi" : "Rasmiy manba";
    if (lang === 'ru') return type === 'program' ? 'Страница программы' : 'Официальный источник';
    return type === 'program' ? 'Program page' : 'Official source';
  };
  const importantApplySource =
    normalizedSources.find((source) => source.intent === 'apply') || null;
  const importantTuitionSource =
    normalizedSources.find((source) => source.intent === 'tuition') || null;
  const importantProgramSource =
    normalizedPrograms.find((program) => Boolean(program.link))?.link ||
    normalizedSources.find((source) => source.intent === 'program')?.link ||
    null;
  const primaryLinks = [
    {
      id: 'apply',
      title: t('uni.important_apply', lang),
      description: t('uni.important_apply_desc', lang),
      link: importantApplySource?.link || websiteFallback,
      host: importantApplySource?.host || (websiteFallback ? getHostLabel(websiteFallback) : null),
    },
    {
      id: 'programs',
      title: t('uni.important_programs', lang),
      description: t('uni.important_programs_desc', lang),
      link: importantProgramSource || websiteFallback,
      host: importantProgramSource
        ? getHostLabel(importantProgramSource)
        : websiteFallback
          ? getHostLabel(websiteFallback)
          : null,
    },
    {
      id: 'tuition',
      title: t('uni.important_tuition', lang),
      description: t('uni.important_tuition_desc', lang),
      link: importantTuitionSource?.link || websiteFallback,
      host: importantTuitionSource?.host || (websiteFallback ? getHostLabel(websiteFallback) : null),
    },
  ];

  const heroExcerpt = overviewBody ? excerptForHero(overviewBody, 320) : null;
  const hasHeroTuition = Boolean(localizedTuition?.trim());
  const hasHeroDeadline = Boolean(localizedDeadline?.trim());
  const programCount = normalizedPrograms.length;
  const showHeroChips = programCount > 0 || hasHeroTuition || hasHeroDeadline;
  const heroTuitionLine = hasHeroTuition && localizedTuition ? clipHeroLine(localizedTuition, 130) : '';
  const heroDeadlineLine = hasHeroDeadline && localizedDeadline ? clipHeroLine(localizedDeadline, 130) : '';
  const shouldClampSummaryOnMobile = overviewBody.length > 520;
  const maxProgramsOnMobile = 8;
  const visiblePrograms = programsExpandedMobile
    ? normalizedPrograms
    : normalizedPrograms.slice(0, maxProgramsOnMobile);
  const maxSourcesOnMobile = 3;
  const visibleSourcesMobile = sourcesExpandedMobile
    ? normalizedSources
    : normalizedSources.slice(0, maxSourcesOnMobile);

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-(--bg-main) pb-16 sm:pb-32 lg:pb-64">
      {/* Mobile redesign */}
      <div className="sm:hidden border-b border-neutral-200 bg-(--bg-surface)">
        <div className="mx-auto w-full max-w-7xl px-4 py-4">
          <Link href="/search" className="edge-btn-secondary mb-3 w-full px-3 py-2 text-[11px]">
            <ArrowLeft size={14} /> {t('uni.back', lang)}
          </Link>

          <div className="edge-panel p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white p-2">
                <SmartImage
                  src={logoSrc}
                  fallback={fallbackSrc}
                  alt={basicInfo.name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="edge-eyebrow">{t('uni.profile', lang)}</div>
                <h1 className="text-role-name-display text-[1.6rem] leading-tight wrap-break-word" data-text-role="name">
                  {basicInfo.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-700">
                  <div className="inline-flex items-center gap-1.5">
                    <MapPin size={14} className="text-neutral-400" />
                    <span>{basicInfo.country}</span>
                  </div>
                  <div className="inline-flex min-w-0 items-center gap-1.5">
                    <Globe size={14} className="text-neutral-400 shrink-0" />
                    {websiteFallback ? (
                      <a
                        href={websiteFallback}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-role-link-quiet truncate max-w-[170px]"
                      >
                        {domain}
                      </a>
                    ) : (
                      <span className="truncate text-neutral-500">{domain}</span>
                    )}
                  </div>
                </div>
                {websiteFallback ? (
                  <a
                    href={websiteFallback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOfficialClick('official')}
                    className="text-role-link-surface inline-flex items-center gap-1.5 text-sm"
                  >
                    <span className="line-clamp-2">{heroOfficialNotice}</span>
                    <ExternalLink size={13} className="shrink-0" />
                  </a>
                ) : null}
              </div>
            </div>

            {websiteFallback ? (
              <a
                href={websiteFallback}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOfficialClick('official')}
                className="edge-btn-primary mt-4 w-full px-4 py-2.5 text-[10px]"
              >
                {t('uni.visit', lang)}
                <ExternalLink size={13} className="shrink-0" />
              </a>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <a href="#executive-summary-mobile" className="edge-btn-secondary w-full px-3 py-2 text-[10px]">
              {t('uni.summary', lang)}
            </a>
            <a href="#tuition-mobile" className="edge-btn-secondary w-full px-3 py-2 text-[10px]">
              {t('uni.tuition', lang)}
            </a>
            {programCount > 0 ? (
              <div className="col-span-2 flex items-center gap-2 rounded-none border border-neutral-200 bg-white px-3 py-2.5">
                <BookOpen size={14} className="shrink-0 text-neutral-500" aria-hidden />
                <span className="text-xs text-neutral-800">
                  <span className="font-bold tabular-nums">{programCount}</span> {t('uni.hero_programs_listed', lang)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="sm:hidden mx-auto w-full max-w-7xl px-4 py-5 space-y-5">
        <section id="executive-summary-mobile" className="space-y-3">
          <h2 className="text-role-name-display text-2xl tracking-tight">{t('uni.summary', lang)}</h2>
          <div className="edge-panel p-4">
            <div className="text-role-label mb-3">{t('uni.overview', lang)}</div>
            {overviewBody ? (
              <p
                className={`text-role-body text-base ${shouldClampSummaryOnMobile && !summaryExpandedMobile ? 'line-clamp-8' : ''}`}
                data-text-role="body"
              >
                {highlightInlinePrices(overviewBody)}
              </p>
            ) : (
              <p className="text-role-body-muted text-base">{t('uni.overview_empty', lang)}</p>
            )}
            {overviewBody && shouldClampSummaryOnMobile ? (
              <button
                type="button"
                onClick={() => setSummaryExpandedMobile((prev) => !prev)}
                className="mt-3 inline-flex text-[11px] font-bold uppercase tracking-wider text-neutral-600 underline underline-offset-4"
              >
                {summaryExpandedMobile ? showLessLabel : t('uni.view', lang)}
              </button>
            ) : null}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3">
          <section id="tuition-mobile" className="rounded-none border border-neutral-200 bg-white p-4">
            <div className="text-role-label-wide mb-2">{t('uni.tuition', lang)}</div>
            <p className={`text-neutral-800 ${tuitionSizeClass} font-medium leading-relaxed`} data-text-role="price">
              {highlightInlinePrices(tuitionDisplay)}
            </p>
          </section>

          <section className="rounded-none border border-neutral-200 bg-white p-4">
            <div className="text-role-label-wide mb-2">{t('uni.deadline', lang)}</div>
            <p className="text-role-body text-sm leading-relaxed wrap-break-word" data-text-role="body">
              {localizedDeadline || t('uni.varies', lang)}
            </p>
          </section>
        </div>

        <section className="space-y-3">
          <h3 className="text-role-name-display text-xl tracking-tight">{t('uni.programs', lang)}</h3>
          {normalizedPrograms.length > 0 ? (
            <div className="space-y-2.5">
              {visiblePrograms.map((program, i) => (
                <a
                  key={`${program.name}-${i}`}
                  href={program.link || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block rounded-none border px-4 py-3 text-sm font-semibold ${
                    program.link
                      ? 'border-neutral-200 bg-white text-neutral-800'
                      : 'border-neutral-100 bg-neutral-50 text-neutral-400 pointer-events-none'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="wrap-break-word">{program.name}</span>
                    {program.link ? <ExternalLink size={14} className="mt-0.5 shrink-0 text-neutral-400" /> : null}
                  </div>
                </a>
              ))}
              {normalizedPrograms.length > maxProgramsOnMobile ? (
                <button
                  type="button"
                  onClick={() => setProgramsExpandedMobile((prev) => !prev)}
                  className="w-full rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-700"
                >
                  {programsExpandedMobile ? showLessLabel : t('uni.view', lang)}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
              {t('uni.not_specified', lang)}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-role-name-display text-xl tracking-tight">{t('uni.important_links', lang)}</h3>
          <div className="space-y-2.5">
            {primaryLinks.map((item) =>
              item.link ? (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOfficialClick(item.id === 'apply' ? 'apply' : item.id === 'tuition' ? 'tuition' : 'program')}
                  className="text-role-link-card block rounded-none border border-neutral-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-role-name text-sm font-semibold wrap-break-word">{item.title}</p>
                    <ExternalLink size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                  </div>
                  <p className="text-role-body-sm mt-1.5 text-xs">{item.description}</p>
                </a>
              ) : null,
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-role-name-display text-xl tracking-tight">{t('uni.sources', lang)}</h3>
          {visibleSourcesMobile.length > 0 ? (
            <div className="space-y-2.5">
              {visibleSourcesMobile.map((source, i) => (
                <a
                  key={`${source.link}-${i}`}
                  href={source.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOfficialClick('source')}
                  className="text-role-link-card block rounded-none border border-neutral-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-role-name text-xs font-semibold leading-snug wrap-break-word">{source.title}</p>
                    <ExternalLink size={13} className="mt-0.5 shrink-0 text-neutral-400" />
                  </div>
                  {source.snippet ? (
                    <p className="text-role-body mt-1.5 text-[11px] leading-relaxed text-neutral-500">
                      {highlightInlinePrices(source.snippet)}
                    </p>
                  ) : null}
                </a>
              ))}
              {normalizedSources.length > maxSourcesOnMobile ? (
                <button
                  type="button"
                  onClick={() => setSourcesExpandedMobile((prev) => !prev)}
                  className="w-full rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-neutral-700"
                >
                  {sourcesExpandedMobile ? showLessLabel : t('uni.view', lang)}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
              {t('uni.not_specified', lang)}
            </p>
          )}
        </section>

        <div className="rounded-none border border-neutral-300 bg-neutral-50/70 px-4 py-3">
          <p className="text-role-body-sm text-[11px] leading-relaxed text-neutral-600">{t('uni.disclaimer_official', lang)}</p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden sm:block relative border-b border-neutral-200 bg-(--bg-surface) pt-4 pb-6 sm:pt-5 sm:pb-8 lg:pt-6 lg:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Back button */}
          <Link href="/search" className="edge-btn-secondary mb-4 px-3 py-2 text-[11px] sm:mb-5 sm:px-5 sm:py-2.5 sm:text-xs lg:mb-6">
            <ArrowLeft size={14} /> {t('uni.back', lang)}
          </Link>

          <div className="flex flex-row items-start gap-3 sm:gap-4 md:gap-6 lg:gap-10 text-left">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white p-2 transition-transform sm:h-24 sm:w-24 sm:p-3 md:h-28 md:w-28 lg:h-36 lg:w-36 lg:p-4"
            >
              <SmartImage
                src={logoSrc}
                fallback={fallbackSrc}
                alt={basicInfo.name}
                className="h-full w-full object-contain"
              />
            </motion.div>

            {/* Info column */}
            <div className="min-w-0 flex-1 space-y-3 sm:space-y-3 lg:space-y-5">
              {/* Badge row — trust meta hidden on mobile to reduce clutter */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="edge-eyebrow">{t('uni.profile', lang)}</div>
                <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold ${heroTrust.textClass}`}>
                  <Shield size={14} className={`shrink-0 ${heroTrust.iconClass}`} aria-hidden />
                  <span>{heroTrust.label}</span>
                </div>
              </div>

              {/* University name */}
              <h1
                className="text-role-name-display text-xl leading-[1.15] wrap-break-word sm:text-3xl md:text-4xl lg:text-5xl max-w-4xl"
                data-text-role="name"
              >
                {basicInfo.name}
              </h1>

              {/* Location + website row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 md:gap-6">
                <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <MapPin size={14} className="shrink-0 text-neutral-400" />
                  <span>
                    {basicInfo.country}
                    {basicInfo.state_province ? (
                      <span className="text-neutral-500">{`, ${basicInfo.state_province}`}</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  <Globe size={14} className="shrink-0 text-neutral-400" />
                  {websiteFallback ? (
                    <a
                      href={websiteFallback}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-role-link-quiet truncate max-w-[160px] sm:max-w-none"
                    >
                      {domain}
                    </a>
                  ) : (
                    <span className="truncate text-neutral-500">{domain}</span>
                  )}
                </div>
                {/* Alpha code — hidden on mobile */}
                <div className="hidden sm:block px-3 py-1 rounded-md border border-neutral-200 bg-white text-xs font-bold text-neutral-500 uppercase">
                  {basicInfo.alpha_two_code}
                </div>
              </div>

              {/* Official site notice */}
              {websiteFallback ? (
                <a
                  href={websiteFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOfficialClick('official')}
                  className="text-role-link-surface inline-flex items-center gap-1.5 text-sm"
                >
                  <span className="line-clamp-2 sm:line-clamp-none">{heroOfficialNotice}</span>
                  <ExternalLink size={14} className="shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-neutral-500">{heroOfficialNotice}</p>
              )}

              {/* At-a-glance chips — 2-col grid on mobile, flex-wrap on sm+ */}
              {showHeroChips ? (
                <div
                  className="hidden sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-2 md:gap-0"
                  aria-label={t('uni.hero_at_a_glance', lang)}
                >
                  {programCount > 0 ? (
                    <div className="flex min-h-[84px] items-start gap-2 rounded-none border border-neutral-200 bg-white px-3 py-2.5 text-left">
                      <BookOpen size={14} className="shrink-0 text-neutral-500" aria-hidden />
                      <span className="min-w-0 text-xs text-neutral-800">
                        <span className="mb-0.5 block font-bold text-neutral-500">{t('uni.programs', lang)}</span>
                        <span className="block leading-snug">
                          <span className="font-bold tabular-nums">{programCount}</span>{' '}
                          {t('uni.hero_programs_listed', lang)}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  {hasHeroTuition ? (
                    <div className="flex min-h-[84px] items-start gap-2 rounded-none border border-neutral-200 bg-white px-3 py-2.5 text-left">
                      <DollarSign size={14} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
                      <span className="min-w-0 text-xs text-neutral-800">
                        <span className="block font-bold text-neutral-500 mb-0.5">{t('uni.tuition', lang)}</span>
                        <span className="line-clamp-2 leading-snug">
                          {highlightInlinePrices(heroTuitionLine)}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  {hasHeroDeadline ? (
                    <div className="flex min-h-[84px] items-start gap-2 rounded-none border border-neutral-200 bg-white px-3 py-2.5 text-left">
                      <ClipboardList size={14} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
                      <span className="min-w-0 text-xs text-neutral-800">
                        <span className="block font-bold text-neutral-500 mb-0.5">{t('uni.deadline', lang)}</span>
                        <span className="line-clamp-2 leading-snug">
                          {heroDeadlineLine}
                        </span>
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Excerpt — hidden on mobile (body has full content); shown on sm+ */}
              {heroExcerpt?.excerpt && heroExcerpt.truncated ? (
                <div className="hidden sm:block mt-4 max-w-3xl space-y-2 text-left">
                  <p className="text-role-body text-base leading-relaxed">
                    {highlightInlinePrices(heroExcerpt.excerpt)}
                  </p>
                  <a href="#executive-summary" className="text-role-link inline-flex text-sm">
                    {t('uni.hero_read_full', lang)}
                  </a>
                </div>
              ) : null}
              {!overviewBody ? (
                <p className="hidden sm:block mt-4 max-w-3xl text-left text-sm leading-relaxed text-neutral-500">
                  {t('uni.hero_whats_below', lang)}
                </p>
              ) : overviewBody && !heroExcerpt?.truncated && !showHeroChips ? (
                <p className="hidden sm:block mt-4 max-w-3xl text-left text-sm leading-relaxed text-neutral-500">
                  {t('uni.hero_more_below', lang)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-4 w-full max-w-full space-y-2 overflow-hidden sm:hidden">
          <div className="grid w-full grid-cols-2 gap-2">
            <a
              href="#executive-summary"
              className="edge-btn-secondary flex min-w-0 w-full px-3 py-2 text-[10px]"
            >
              {t('uni.summary', lang)}
            </a>
            <a
              href="#tuition-detail"
              className="edge-btn-secondary flex min-w-0 w-full px-3 py-2 text-[10px]"
            >
              {t('uni.tuition', lang)}
            </a>
            {websiteFallback ? (
              <a
                href={websiteFallback}
                target="_blank"
                rel="noopener noreferrer"
                className="edge-btn-primary col-span-2 flex min-w-0 w-full px-3 py-2 text-[10px]"
              >
                {t('uni.visit', lang)}
                <ExternalLink size={12} className="shrink-0" />
              </a>
            ) : null}
          </div>
          {programCount > 0 ? (
            <div className="flex w-full min-w-0 items-center gap-2 rounded-none border border-neutral-200 bg-white px-3 py-2.5 text-left">
              <BookOpen size={14} className="shrink-0 text-neutral-500" aria-hidden />
              <span className="text-xs text-neutral-800">
                <span className="font-bold tabular-nums">{programCount}</span>{' '}
                {t('uni.hero_programs_listed', lang)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden sm:grid mx-auto max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:gap-14 sm:px-6 sm:py-12 lg:grid-cols-3 lg:gap-20 lg:py-16">
        {/* Content Data */}
        <div className="lg:col-span-2 space-y-10 sm:space-y-20 lg:space-y-32">
          <section id="executive-summary" className="scroll-mt-28 space-y-6 sm:space-y-8">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white text-neutral-700">
                   <Search size={20} />
                </div>
                <h2 className="text-role-name-display text-2xl sm:text-3xl tracking-tight">{t('uni.summary', lang)}</h2>
             </div>
             <div className="group edge-panel p-5 sm:p-8">
                <div className="text-role-label mb-4 tracking-[0.14em]">{t('uni.overview', lang)}</div>
                {overviewBody ? (
                  <p
                    className={`text-role-body text-base sm:text-xl transition-colors ${shouldClampSummaryOnMobile && !summaryExpandedMobile ? 'line-clamp-8 sm:line-clamp-none' : ''}`}
                    data-text-role="body"
                  >
                    {highlightInlinePrices(overviewBody)}
                  </p>
                ) : (
                  <p className="text-role-body-muted text-base sm:text-lg" data-text-role="body-muted">
                    {t('uni.overview_empty', lang)}
                  </p>
                )}
                {overviewBody && shouldClampSummaryOnMobile ? (
                  <button
                    type="button"
                    onClick={() => setSummaryExpandedMobile((prev) => !prev)}
                    className="sm:hidden inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-neutral-600 underline underline-offset-4"
                  >
                    {summaryExpandedMobile ? showLessLabel : t('uni.view', lang)}
                  </button>
                ) : null}
                {confidencePct !== null ? (
                  <div className="mt-6 space-y-1.5" aria-label={t('uni.confidence', lang)}>
                    <div className="flex items-baseline justify-between gap-3 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                      <span>{t('uni.confidence', lang)}</span>
                      <span className="tabular-nums text-neutral-800">{confidencePct}%</span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-none bg-neutral-200"
                      role="presentation"
                    >
                      <div
                        className="h-full rounded-none bg-neutral-900 transition-[width] duration-500"
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                    <p className="text-[10px] leading-snug text-neutral-400 font-medium">
                      {t('uni.confidence_hint', lang)}
                    </p>
                  </div>
                ) : null}
                <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
                  <DataFreshnessStrip
                    language={lang}
                    generatedAt={aiDetails?.last_updated}
                  />
                  {formattedNextRefresh ? (
                    <div className="inline-flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
                      <Clock3 size={14} className="text-neutral-400 shrink-0" aria-hidden />
                      <span>
                        {t('uni.next_refresh', lang)}:{' '}
                        <span suppressHydrationWarning>{formattedNextRefresh}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
             <div id="tuition-detail" className="p-5 sm:p-7 rounded-none border border-neutral-200 space-y-4 bg-white relative overflow-hidden hover:bg-neutral-50 transition-all min-h-[140px] sm:min-h-[210px]">
                <div className="absolute -top-4 -right-4 p-8 opacity-[0.06]">
                   <DollarSign size={80} className="text-neutral-700" />
                </div>
                 <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-role-label-wide">{t('uni.tuition', lang)}</span>
                   <div className="text-role-price-block">
                     <p
                       className={`text-neutral-800 ${tuitionSizeClass} font-medium leading-relaxed`}
                       data-text-role="price"
                     >
                       {highlightInlinePrices(tuitionDisplay)}
                     </p>
                   </div>
                </div>
             </div>

             <div id="deadline-detail" className="p-5 sm:p-7 rounded-none border border-neutral-200 space-y-4 bg-white relative overflow-hidden hover:bg-neutral-50 transition-all min-h-[140px] sm:min-h-[210px]">
                <div className="absolute -top-4 -right-4 p-8 opacity-[0.06]">
                   <ClipboardList size={80} className="text-neutral-700" />
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-role-label-wide">{t('uni.deadline', lang)}</span>
                   <div className="text-role-deadline-block">
                     <p
                       className="text-role-body text-sm sm:text-base leading-relaxed wrap-break-word"
                       data-text-role="body"
                     >
                       {localizedDeadline || t('uni.varies', lang)}
                     </p>
                   </div>
                </div>
             </div>
          </div>

          {youtubeVideos && youtubeVideos.length > 0 ? (
            <section className="space-y-6 sm:space-y-8" aria-label={t('uni.youtube.title', lang)}>
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white text-neutral-700">
                  <Play size={20} aria-hidden />
                </div>
                <div>
                  <h2 className="text-role-name-display text-2xl sm:text-3xl tracking-tight">
                    {t('uni.youtube.title', lang)}
                  </h2>
                  <p className="text-role-body-sm mt-1 text-neutral-500">{t('uni.youtube.subtitle', lang)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {youtubeVideos.slice(0, 4).map((video) => (
                  <div key={video.videoId} className="space-y-3 rounded-none border border-neutral-200 bg-white p-4">
                    <p className="text-role-name text-sm font-semibold leading-snug line-clamp-2">{video.title}</p>
                    <div className="relative aspect-video w-full overflow-hidden rounded-none bg-neutral-100 border border-neutral-200">
                      <iframe
                        title={video.title}
                        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}`}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <a
                      href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-black"
                    >
                      {t('uni.youtube.watch', lang)}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-role-body-sm text-[11px] leading-relaxed text-neutral-400">{t('uni.youtube.embedNote', lang)}</p>
            </section>
          ) : null}

          <section className="space-y-8 sm:space-y-12">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6 sm:pb-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white text-neutral-700">
                   <BookOpen size={20} />
                </div>
                <h2 className="text-role-name-display text-2xl sm:text-3xl tracking-tight">{t('uni.programs', lang)}</h2>
             </div>
             {normalizedPrograms.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {visiblePrograms.map((program, i) => (
                   <a
                     key={`${program.name}-${i}`}
                     href={program.link || undefined}
                     target="_blank"
                     rel="noopener noreferrer"
                    className={`group px-5 py-4 rounded-none border bg-white text-sm font-semibold transition-all flex items-center justify-between gap-3 ${
                       program.link
                        ? 'border-neutral-200 text-neutral-800 cursor-pointer hover:border-neutral-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2'
                         : 'border-neutral-100 text-neutral-400 cursor-default pointer-events-none'
                     }`}
                   >
                    <span
                      className={`wrap-break-word ${program.link ? 'text-role-name-link' : 'text-sm font-medium text-neutral-400'}`}
                    >
                      {program.name}
                    </span>
                    {program.link ? <ExternalLink size={15} className="shrink-0 text-neutral-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> : null}
                   </a>
                 ))}
                 {normalizedPrograms.length > maxProgramsOnMobile ? (
                   <button
                     type="button"
                     onClick={() => setProgramsExpandedMobile((prev) => !prev)}
                     className="sm:hidden md:hidden col-span-1 rounded-none border border-neutral-300 bg-neutral-50 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-100 transition-colors"
                   >
                     {programsExpandedMobile ? showLessLabel : t('uni.view', lang)}
                   </button>
                 ) : null}
               </div>
             ) : (
               <div className="p-10 text-center rounded-none border-2 border-dashed border-neutral-300 bg-neutral-50">
                 <p className="text-role-body-muted text-sm not-italic text-neutral-400">{t('uni.not_specified', lang)}</p>
               </div>
             )}
          </section>

          <section className="space-y-8 sm:space-y-12">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6 sm:pb-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white text-neutral-700">
                   <Award size={20} />
                </div>
                <h2 className="text-role-name-display text-2xl sm:text-3xl tracking-tight">{t('uni.scholarships', lang)}</h2>
             </div>
             <div className="grid grid-cols-1 gap-6">
                  {(aiDetails?.scholarships && aiDetails.scholarships.length > 0) ? (
                    aiDetails.scholarships.map((s, i) => (
                      <div key={i} className="p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-8 rounded-none border border-neutral-200 bg-white hover:bg-neutral-50 transition-all">
                         <div className="space-y-3">
                            <div className="text-role-label tracking-[0.14em] text-neutral-600">
                              {t('uni.scholarship_tag', lang)}
                            </div>
                            <h4 className="text-role-name text-lg sm:text-xl wrap-break-word" data-text-role="name">
                              {s.name}
                            </h4>
                         </div>
                         <a 
                          href={
                            clampHttpUrlToOfficial(s.link, officialBases, linkFallbackForClamp) ||
                            websiteFallback ||
                            '#'
                          }
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="edge-btn-primary w-full md:w-auto px-6 py-2.5 text-sm"
                         >
                           {t('uni.visit', lang)} <ExternalLink size={14} className="ml-2" />
                         </a>
                      </div>
                    ))
                 ) : (
                    <div className="p-20 text-center rounded-none border-2 border-dashed border-neutral-300 bg-neutral-50">
                       <p className="text-role-body-muted text-sm not-italic text-neutral-500 leading-relaxed max-w-prose mx-auto">
                         {t('uni.scholarships_empty', lang)}
                       </p>
                    </div>
                 )}
             </div>
          </section>
        </div>

        {/* Sidebar — matches home `home-intent-shell` light cards */}
        <div className="space-y-8 sm:space-y-12 lg:pt-2">
          <div className="home-intent-shell relative space-y-8 sm:space-y-10">
            <div className="relative z-10 space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 home-intent-eyebrow">
                <Globe size={12} className="text-neutral-500" aria-hidden />
                {t('uni.website', lang)}
              </div>
              <h3 className="text-role-name-display text-2xl leading-[1.12] sm:text-3xl lg:text-[2.35rem]">
                {officialWebsiteTitle}
              </h3>
              <p className="text-role-body max-w-prose text-base sm:text-lg sm:leading-relaxed">
                {officialWebsiteDescription}
              </p>
              {websiteFallback ? (
                <>
                  <div className="rounded-none border border-neutral-200 bg-white px-5 py-5 sm:px-6 sm:py-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-black text-white"
                        aria-hidden
                      >
                        <Globe size={22} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-role-label tracking-[0.16em] text-neutral-500">
                          {officialWebsiteTitle}
                        </p>
                        <p className="text-role-name-display mt-2 text-lg wrap-break-word sm:text-xl" data-text-role="name">
                          {domain}
                        </p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={websiteFallback}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOfficialClick('official')}
                    className="edge-btn-primary w-full px-6 py-3.5 text-sm sm:text-base"
                  >
                    {t('uni.visit', lang)}
                    <ExternalLink size={18} aria-hidden />
                  </a>
                </>
              ) : (
                <p className="text-role-body-sm font-semibold text-neutral-500">
                  {domain && domain !== 'unknown' ? domain : t('uni.not_specified', lang)}
                </p>
              )}
            </div>

            <div className="relative z-10 space-y-3 sm:space-y-4">
              {(basicInfo.web_pages?.length || 0) > 0 ? (
                basicInfo.web_pages?.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-role-link-card group block w-full rounded-none border border-neutral-200 bg-white px-5 py-4 sm:py-5 transition-all hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-role-name text-sm sm:text-base font-semibold">
                          {i === 0 ? t('uni.visit', lang) : `${t('uni.visit', lang)} ${i + 1}`}
                        </p>
                        <p className="text-role-url-line mt-1 truncate">{toShortLink(url)}</p>
                      </div>
                      <ExternalLink size={14} className="mt-0.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-700" />
                    </div>
                  </a>
                ))
              ) : (
                <p className="rounded-none border border-neutral-300 bg-neutral-50 px-5 py-4 text-xs text-neutral-500">
                  {t('uni.not_specified', lang)}
                </p>
              )}
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5 pt-2">
              <div className="text-role-label text-neutral-500 tracking-[0.14em]">
                {t('uni.important_links', lang)}
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {primaryLinks.map((item) =>
                  item.link ? (
                    <a
                      key={item.id}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOfficialClick(item.id === 'apply' ? 'apply' : item.id === 'tuition' ? 'tuition' : 'program')}
                      className="text-role-link-card group block cursor-pointer rounded-none border border-neutral-200 bg-neutral-50 px-4 py-3.5 transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <p className="text-role-name text-sm font-semibold wrap-break-word flex-1 min-w-0">{item.title}</p>
                        <ExternalLink size={13} className="mt-0.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600" />
                      </div>
                      <p className="text-role-body-sm mt-1.5 text-xs leading-relaxed">{item.description}</p>
                      {item.host ? (
                        <p className="text-role-url-line mt-2 text-[11px]">{item.host}</p>
                      ) : null}
                    </a>
                  ) : (
                    <div key={item.id} className="rounded-none border border-neutral-200 bg-neutral-50/50 px-4 py-3.5 opacity-80">
                      <p className="text-role-name text-sm font-semibold text-neutral-800 wrap-break-word">{item.title}</p>
                      <p className="text-role-body-sm mt-1.5 text-xs text-neutral-500 leading-relaxed">{item.description}</p>
                      <p className="text-role-url-line mt-2 text-[11px] text-neutral-400">{t('uni.not_specified', lang)}</p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5 pt-2">
              <div className="text-role-label text-neutral-500 tracking-[0.14em]">{t('uni.sources', lang)}</div>
              {normalizedSources.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {normalizedSources.map((source, i) => (
                    <a
                      key={`${source.link}-${i}`}
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOfficialClick('source')}
                      className="text-role-link-card group block cursor-pointer rounded-none border border-neutral-200 bg-white px-4 py-3.5 transition-all hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="text-role-name text-xs font-semibold leading-snug wrap-break-word flex-1 min-w-0">{source.title}</div>
                        <ExternalLink size={13} className="mt-0.5 shrink-0 text-neutral-400 transition-colors group-hover:text-neutral-600" />
                      </div>
                      {source.snippet ? (
                        <p className="text-role-body mt-1.5 text-[11px] leading-relaxed wrap-break-word text-neutral-500">
                          {highlightInlinePrices(source.snippet)}
                        </p>
                      ) : null}
                      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                        <span className="shrink-0 whitespace-nowrap rounded-none border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                          {sourceTypeLabel(source.linkType)}
                        </span>
                        <span className="text-role-url-line min-w-0 truncate text-[10px] text-neutral-400">
                          {source.host}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">{t('uni.not_specified', lang)}</p>
              )}
            </div>

            <div className="relative z-10 flex items-start gap-3 rounded-none border border-neutral-300 bg-neutral-50/70 px-4 py-3.5">
              <Info size={17} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
              <p className="text-role-body-sm text-[11px] leading-relaxed text-neutral-600">{t('uni.disclaimer_official', lang)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
