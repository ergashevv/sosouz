'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin, ExternalLink, DollarSign, Award, ClipboardList, Info, ArrowLeft, Shield, Search, Clock3, BookOpen, Play } from 'lucide-react';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import DataFreshnessStrip from '@/components/DataFreshnessStrip';
import { University } from '@/lib/api';
import { translations, type Language } from '@/lib/i18n';
import type { YoutubeVideoPreview } from '@/lib/university-youtube';

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
    return new URL(url).hostname.replace(/^www\./, '');
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
  const websiteFallback = basicInfo.web_pages?.[0] || null;
  const normalizedPrograms = (aiDetails?.programs || [])
    .map((program) => normalizeProgram(program, websiteFallback))
    .filter((program): program is NormalizedProgram => Boolean(program));
  const normalizedSources = (aiDetails?.source_links || [])
    .map((source, index) => normalizeSource(source, index))
    .filter((source): source is NormalizedSource => Boolean(source))
    .slice(0, 4);
  const nextRefreshAt =
    aiDetails?.next_refresh_at ? new Date(aiDetails.next_refresh_at) : null;
  const formattedNextRefresh =
    nextRefreshAt && !Number.isNaN(nextRefreshAt.getTime())
      ? formatDateStable(nextRefreshAt, lang)
      : null;
  const localizedTuition = localizeStructuredValue(aiDetails?.tuition_fees, lang, 'tuition');
  const localizedDeadline = localizeStructuredValue(aiDetails?.admission_deadline, lang, 'deadline');
  const tuitionDisplay = localizedTuition || t('uni.not_specified', lang);
  const tuitionBodyClass =
    tuitionDisplay.length > 90
      ? 'text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-relaxed wrap-break-word'
      : 'text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-snug wrap-break-word max-w-[26ch]';
  const openLinkLabel = lang === 'uz' ? "Havolani ochish" : lang === 'ru' ? 'Открыть ссылку' : 'Open link';
  const opensToLabel = lang === 'uz' ? "Ochiladigan sahifa" : lang === 'ru' ? 'Откроется страница' : 'Opens page';
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

  return (
    <div className="pb-24 sm:pb-40 lg:pb-64 relative z-10 bg-white">
      {/* Hero Section */}
      <div className="relative pt-[calc(var(--search-header-height,12rem)+1rem)] sm:pt-[calc(var(--search-header-height,12rem)+1.5rem)] lg:pt-[calc(var(--search-header-height,12rem)+2rem)] pb-14 sm:pb-24 lg:pb-32 border-b border-black bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
           <Link href="/search" className="inline-flex items-center gap-2 mb-8 sm:mb-12 lg:mb-20 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-neutral-200 bg-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:bg-neutral-50 transition-all">
              <ArrowLeft size={16} /> {t('uni.back', lang)}
           </Link>
           
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8 sm:gap-10 lg:gap-12 text-center lg:text-left">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center p-3 sm:p-4 lg:p-5 shrink-0 shadow-sm transition-transform"
              >
                 <SmartImage 
                   src={logoSrc} 
                   fallback={fallbackSrc}
                   alt={basicInfo.name} 
                   className="w-full h-full object-contain"
                 />
              </motion.div>
              <div className="space-y-4 sm:space-y-6 flex-1 min-w-0">
                <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-4 flex-wrap">
                   <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide">{t('uni.profile', lang)}</div>
                   <div className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
                      <Shield size={14} className="text-blue-500" /> {t('uni.verified', lang)}
                   </div>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15] max-w-4xl wrap-break-word">
                   {basicInfo.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 mt-4 sm:mt-8">
                   <div className="flex items-center gap-2 text-neutral-600 font-semibold text-sm">
                      <MapPin size={16} className="text-neutral-400" /> {basicInfo.country}
                   </div>
                   <div className="flex items-center gap-2 text-neutral-600 font-semibold text-sm min-w-0 max-w-full">
                      <Globe size={16} className="text-neutral-400 shrink-0" />
                      {websiteFallback ? (
                        <a
                          href={websiteFallback}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-neutral-700 hover:text-blue-700 transition-colors"
                        >
                          {domain}
                        </a>
                      ) : (
                        <span className="truncate">{domain}</span>
                      )}
                   </div>
                   <div className="px-4 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-bold text-neutral-500 uppercase">
                      {basicInfo.alpha_two_code}
                   </div>
                </div>
                {websiteFallback ? (
                  <a
                    href={websiteFallback}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center lg:justify-start gap-2 mt-2 text-sm sm:text-base font-semibold text-blue-700 hover:text-blue-800 transition-colors"
                  >
                    <span className="wrap-break-word">{heroOfficialNotice}</span>
                    <ExternalLink size={15} className="shrink-0" />
                  </a>
                ) : (
                  <p className="mt-2 text-sm sm:text-base font-semibold text-blue-700">{heroOfficialNotice}</p>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-3 gap-10 sm:gap-16 lg:gap-24">
        {/* Content Data */}
        <div className="lg:col-span-2 space-y-12 sm:space-y-20 lg:space-y-32">
          <section className="space-y-6 sm:space-y-8">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                   <Search size={20} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">{t('uni.summary', lang)}</h2>
             </div>
             <div className="p-5 sm:p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm group">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">{t('uni.overview', lang)}</div>
                <p className="text-base sm:text-xl text-neutral-700 leading-relaxed font-medium transition-colors">
                   {aiDetails?.detailed_overview || "..."}
                </p>
                <div className="mt-8 pt-6 border-t border-neutral-100 space-y-3">
                  <DataFreshnessStrip
                    language={lang}
                    generatedAt={aiDetails?.last_updated}
                    refreshStatus={aiDetails?.refresh_status}
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
             <div className="p-5 sm:p-7 rounded-2xl border border-neutral-200 space-y-4 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all min-h-[210px]">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <DollarSign size={80} className="text-blue-600" />
                </div>
                 <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('uni.tuition', lang)}</span>
                  <p className={tuitionBodyClass}>
                     {tuitionDisplay}
                   </p>
                </div>
             </div>

             <div className="p-5 sm:p-7 rounded-2xl border border-neutral-200 space-y-4 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all min-h-[210px]">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <ClipboardList size={80} className="text-blue-600" />
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('uni.deadline', lang)}</span>
                   <p className="text-lg sm:text-2xl font-bold text-neutral-900 tracking-tight leading-snug wrap-break-word max-w-[30ch]">
                     {localizedDeadline || t('uni.varies', lang)}
                   </p>
                </div>
             </div>
          </div>

          {youtubeVideos && youtubeVideos.length > 0 ? (
            <section className="space-y-6 sm:space-y-8" aria-label={t('uni.youtube.title', lang)}>
              <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Play size={20} aria-hidden />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
                    {t('uni.youtube.title', lang)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">{t('uni.youtube.subtitle', lang)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {youtubeVideos.slice(0, 4).map((video) => (
                  <div key={video.videoId} className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold leading-snug text-neutral-900 line-clamp-2">{video.title}</p>
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
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
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                    >
                      {t('uni.youtube.watch', lang)}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400">{t('uni.youtube.embedNote', lang)}</p>
            </section>
          ) : null}

          <section className="space-y-8 sm:space-y-12">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6 sm:pb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <BookOpen size={20} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">{t('uni.programs', lang)}</h2>
             </div>
             {normalizedPrograms.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {normalizedPrograms.map((program, i) => (
                   <a
                     key={`${program.name}-${i}`}
                     href={program.link || undefined}
                     target="_blank"
                     rel="noopener noreferrer"
                    className={`group px-5 py-4 rounded-2xl border bg-white text-sm font-semibold shadow-sm transition-all flex items-center justify-between gap-3 ${
                       program.link
                        ? 'border-neutral-200 text-neutral-700 cursor-pointer hover:border-blue-300 hover:shadow-md hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2'
                         : 'border-neutral-100 text-neutral-400 cursor-default pointer-events-none'
                     }`}
                   >
                    <span className={`wrap-break-word ${program.link ? 'text-blue-700 underline decoration-blue-300 underline-offset-4 group-hover:decoration-blue-600' : ''}`}>
                      {program.name}
                    </span>
                    {program.link ? <ExternalLink size={15} className="shrink-0 text-blue-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /> : null}
                   </a>
                 ))}
               </div>
             ) : (
               <div className="p-10 text-center rounded-3xl border-2 border-dashed border-neutral-100 bg-neutral-50">
                 <p className="text-sm font-medium text-neutral-400">{t('uni.not_specified', lang)}</p>
               </div>
             )}
          </section>

          <section className="space-y-8 sm:space-y-12">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6 sm:pb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <Award size={20} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">{t('uni.scholarships', lang)}</h2>
             </div>
             <div className="grid grid-cols-1 gap-6">
                  {(aiDetails?.scholarships && aiDetails.scholarships.length > 0) ? (
                    aiDetails.scholarships.map((s, i) => (
                      <div key={i} className="p-5 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-8 rounded-3xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                         <div className="space-y-3">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Scholarship Opportunity</div>
                            <h4 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight wrap-break-word">{s.name}</h4>
                         </div>
                         <a 
                          href={s.link} 
                          target="_blank" 
                          className="w-full md:w-auto px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-black transition-colors flex items-center justify-center"
                         >
                           {t('uni.visit', lang)} <ExternalLink size={14} className="ml-2" />
                         </a>
                      </div>
                    ))
                 ) : (
                    <div className="p-20 text-center rounded-3xl border-2 border-dashed border-neutral-100 bg-neutral-50">
                       <p className="text-sm font-medium text-neutral-400">No active scholarships detected for this university.</p>
                    </div>
                 )}
             </div>
          </section>
        </div>

        {/* Action Interface */}
        <div className="space-y-8 sm:space-y-12">
          <div className="p-6 sm:p-9 lg:p-10 rounded-3xl sm:rounded-[38px] bg-neutral-900 text-white space-y-8 sm:space-y-10 relative overflow-hidden shadow-[0_24px_55px_-30px_rgba(15,23,42,0.85)]">
            <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90">
                <Globe size={12} />
                {t('uni.website', lang)}
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold leading-tight tracking-tight">{t('uni.visit', lang)}</h3>
              <div className="rounded-2xl bg-white/12 px-5 py-4 sm:px-6 sm:py-5 space-y-2">
                <p className="text-lg sm:text-xl font-extrabold leading-tight text-white">
                  {officialWebsiteTitle}
                </p>
                <p className="text-sm sm:text-base font-medium leading-7 text-white/75 max-w-[46ch]">
                  {officialWebsiteDescription}
                </p>
              </div>
              <p className="text-xs font-semibold text-white/55">{domain}</p>
            </div>

            <div className="relative z-10 space-y-3 sm:space-y-4">
              {(basicInfo.web_pages?.length || 0) > 0 ? (
                basicInfo.web_pages?.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block w-full rounded-2xl bg-white/10 px-5 py-4 sm:py-5 transition-colors hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-white">
                          {i === 0 ? t('uni.visit', lang) : `${t('uni.visit', lang)} ${i + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-white/60 truncate">{toShortLink(url)}</p>
                      </div>
                      <div className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 whitespace-nowrap">
                        {openLinkLabel}
                        <ExternalLink size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </a>
                ))
              ) : (
                <p className="rounded-2xl bg-white/10 px-5 py-4 text-xs text-white/60">
                  {t('uni.not_specified', lang)}
                </p>
              )}
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5 pt-2">
              <div className="text-[10px] uppercase tracking-widest font-bold text-white/55">
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
                      className="block rounded-2xl bg-white/8 px-4 py-3.5 hover:bg-white/14 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white wrap-break-word">{item.title}</p>
                          <p className="mt-1.5 text-xs text-white/65 leading-relaxed">{item.description}</p>
                          {item.host ? (
                            <p className="mt-2 text-[11px] text-white/45">{item.host}</p>
                          ) : null}
                        </div>
                        <div className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-white/85 whitespace-nowrap">
                          {openLinkLabel}
                          <ExternalLink size={12} />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div key={item.id} className="rounded-2xl bg-white/6 px-4 py-3.5 opacity-70">
                      <p className="text-sm font-semibold text-white wrap-break-word">{item.title}</p>
                      <p className="mt-1.5 text-xs text-white/60 leading-relaxed">{item.description}</p>
                      <p className="mt-2 text-[11px] text-white/45">{t('uni.not_specified', lang)}</p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-5 pt-2">
              <div className="text-[10px] uppercase tracking-widest font-bold text-white/55">{t('uni.sources', lang)}</div>
              {normalizedSources.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {normalizedSources.map((source, i) => (
                    <a
                      key={`${source.link}-${i}`}
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl bg-white/7 px-4 py-3.5 hover:bg-white/13 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-wide text-white/45 mb-1">{opensToLabel}</div>
                          <div className="text-xs text-white/90 font-semibold leading-snug wrap-break-word">
                            {source.title}
                          </div>
                          {source.snippet ? (
                            <p className="mt-2 text-[11px] text-white/60 leading-relaxed wrap-break-word">
                              {source.snippet}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-white/45">
                            <span className="px-2 py-0.5 rounded-full bg-white/10">{sourceTypeLabel(source.linkType)}</span>
                            <span>{source.host}</span>
                          </div>
                        </div>
                        <div className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-white/85 whitespace-nowrap">
                          {openLinkLabel}
                          <ExternalLink size={12} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/60">{t('uni.not_specified', lang)}</p>
              )}
              {typeof aiDetails?.data_confidence === 'number' ? (
                <p className="text-[11px] text-white/50">
                  {t('uni.confidence', lang)}: {Math.round(aiDetails.data_confidence * 100)}%
                </p>
              ) : null}
            </div>

            <div className="relative z-10 flex gap-3 items-start rounded-2xl bg-white/7 px-4 py-3.5">
              <Info size={17} className="text-white/65 shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/62 leading-relaxed">
                Note: While we strive for accuracy, please verify all specific program details and deadlines on the official university website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
