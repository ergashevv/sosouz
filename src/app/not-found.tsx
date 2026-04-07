'use client';

import Link from 'next/link';
import { ArrowLeft, Search, Compass } from 'lucide-react';
import { Outfit } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-5 sm:py-8 border-b border-neutral-100 bg-white">
        <Link
          href="/"
          className={`text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}
        >
          soso.
        </Link>
      </nav>

      <section className="hero-wrap flex-1 flex flex-col px-4 sm:px-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center py-16 sm:py-24 relative z-10">
          <p className="registry-label text-center sm:text-left">{t('notfound.badge')}</p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">
            <span
              className={`text-7xl sm:text-8xl md:text-9xl font-black text-neutral-900 tabular-nums leading-none tracking-tighter ${outfit.className}`}
              aria-hidden
            >
              404
            </span>
            <div className="flex-1 space-y-4 pb-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                {t('notfound.title')}
              </h1>
              <p className="text-base sm:text-lg text-neutral-500 leading-relaxed font-medium">
                {t('notfound.desc')}
              </p>
            </div>
          </div>

          <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
            >
              <ArrowLeft size={18} strokeWidth={2.25} />
              {t('notfound.home')}
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-500 hover:text-black"
            >
              <Search size={18} strokeWidth={2.25} />
              {t('notfound.search')}
            </Link>
          </div>

          <div className="mt-16 sm:mt-20 pt-10 sm:pt-12 border-t border-neutral-100">
            <div className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-700 shadow-sm border border-neutral-100">
                <Compass size={22} strokeWidth={1.75} />
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                <span className="font-semibold text-neutral-900">{t('nav.search')}</span>
                {' · '}
                <Link href="/top-university" className="font-semibold text-neutral-900 hover:underline">
                  {t('nav.top')}
                </Link>
                {' · '}
                <Link href="/about" className="font-semibold text-neutral-900 hover:underline">
                  {t('nav.about')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-neutral-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
            {t('footer.copyright')}
          </span>
        </div>
      </footer>
    </main>
  );
}
