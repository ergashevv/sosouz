'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  ShieldCheck,
  Globe2,
  BookOpen,
  Sparkles,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ContactMailtoLink from '@/components/ContactMailtoLink';
import SearchHeader from '@/components/SearchHeader';
import { getSiteUrl } from '@/lib/site';

const softPanel =
  'edge-panel relative overflow-hidden p-6 sm:p-8 lg:p-10';
const answerCard =
  'edge-panel p-5 sm:p-6 transition-colors duration-300 hover:bg-white';
const answerIconWrap =
  'mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-neutral-300 bg-white text-black';

export default function AboutPage() {
  const { t } = useLanguage();
  const siteUrl = getSiteUrl();

  return (
    <main className="min-h-screen bg-(--bg-main) flex flex-col">
      <SearchHeader fixed showSearchForm={false} />

      <section className="pt-8 sm:pt-12 lg:pt-16 pb-14 sm:pb-24 lg:pb-32 px-4 sm:px-6 flex-1">
        <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-10 lg:space-y-12">
          <Link href="/" className="edge-btn-secondary">
            <ArrowLeft size={15} aria-hidden /> {t('about.back')}
          </Link>

          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase italic text-black tracking-tight leading-tight">
              {t('about.title')}
            </h1>
            <p className="text-lg sm:text-2xl md:text-3xl font-medium text-neutral-500 leading-snug max-w-3xl">
              {t('about.subtitle')}
            </p>
          </div>

          <div className={softPanel}>
            <div className="relative z-10 grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <div className={answerIconWrap}>
                  <Target size={20} />
                </div>
                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-medium">
                  {t('about.desc1')}
                </p>
              </div>
              <div className="space-y-4">
                <div className={answerIconWrap}>
                  <ShieldCheck size={20} />
                </div>
                <p className="text-base sm:text-lg text-neutral-600 leading-relaxed font-medium">
                  {t('about.desc2')}
                </p>
              </div>
            </div>
          </div>

          <div className={softPanel}>
            <div className="relative z-10 space-y-6 sm:space-y-8">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                {t('about.offerTitle')}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                <div className={answerCard}>
                  <div className={answerIconWrap}>
                    <Globe2 size={19} />
                  </div>
                  <h3 className="mt-3 text-sm sm:text-base font-bold text-neutral-900">{t('about.offer1Title')}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{t('about.offer1Desc')}</p>
                </div>
                <div className={answerCard}>
                  <div className={answerIconWrap}>
                    <BookOpen size={19} />
                  </div>
                  <h3 className="mt-3 text-sm sm:text-base font-bold text-neutral-900">{t('about.offer2Title')}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{t('about.offer2Desc')}</p>
                </div>
                <div className={answerCard}>
                  <div className={answerIconWrap}>
                    <Sparkles size={19} />
                  </div>
                  <h3 className="mt-3 text-sm sm:text-base font-bold text-neutral-900">{t('about.offer3Title')}</h3>
                  <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{t('about.offer3Desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="edge-panel p-6 sm:p-8 lg:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{t('about.dataTitle')}</h2>
            <div className="mt-4 sm:mt-5 space-y-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-medium">
              <p>{t('about.dataP1')}</p>
              <p>{t('about.dataP2')}</p>
            </div>
          </div>

          <div className={softPanel}>
            <div className="relative z-10 space-y-6 sm:space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className={`${answerIconWrap} h-11 w-11 shrink-0`}>
                  <Mail size={20} aria-hidden />
                </div>
                <div className="min-w-0 space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{t('about.contactTitle')}</h2>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">{t('about.contactLead')}</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 text-sm sm:text-base">
                <div className="edge-panel px-4 py-4">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                    {t('about.contactEmailLabel')}
                  </dt>
                  <dd>
                    <ContactMailtoLink className="font-semibold text-neutral-900 hover:underline break-all" />
                  </dd>
                </div>
                <div className="edge-panel px-4 py-4">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1.5">
                    {t('about.contactWebLabel')}
                  </dt>
                  <dd>
                    <a
                      href={siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-neutral-900 hover:underline break-all"
                    >
                      {siteUrl.replace(/^https?:\/\//, '')}
                      <ExternalLink size={14} className="shrink-0 opacity-45" aria-hidden />
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">{t('about.contactHint')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/search?country=United%20Kingdom"
              className="edge-btn-primary h-11 px-7 text-sm"
            >
              {t('about.ctaSearch')}
            </Link>
            <Link
              href="/students"
              className="edge-btn-secondary h-11 px-7 text-sm"
            >
              {t('about.ctaStudents')}
            </Link>
            <Link
              href="/chat"
              className="edge-btn-secondary h-11 px-7 text-sm"
            >
              {t('about.ctaChat')}
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10 sm:py-12 border-t border-neutral-200 bg-(--bg-surface)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-sm font-medium text-neutral-400 text-center md:text-left">{t('footer.copyright')}</div>
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
            <Link href="/students" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
              {t('nav.students')}
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
              {t('nav.terms')}
            </Link>
            <ContactMailtoLink className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors" />
          </div>
        </div>
      </footer>
    </main>
  );
}
