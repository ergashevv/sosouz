'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SearchHeader from '@/components/SearchHeader';

const SECTION_KEYS = [
  'privacy.s1Title',
  'privacy.s1Body',
  'privacy.s2Title',
  'privacy.s2Body',
  'privacy.s3Title',
  'privacy.s3Body',
  'privacy.s4Title',
  'privacy.s4Body',
  'privacy.s5Title',
  'privacy.s5Body',
  'privacy.s6Title',
  'privacy.s6Body',
  'privacy.s7Title',
  'privacy.s7Body',
  'privacy.s8Title',
  'privacy.s8Body',
] as const;

function SectionBlocks({ t }: { t: (k: string) => string }) {
  const blocks: { title: string; body: string }[] = [];
  for (let i = 0; i < SECTION_KEYS.length; i += 2) {
    blocks.push({
      title: t(SECTION_KEYS[i]),
      body: t(SECTION_KEYS[i + 1]),
    });
  }
  return (
    <div className="space-y-8 sm:space-y-10">
      {blocks.map((block) => (
        <section key={block.title} className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">{block.title}</h2>
          <div className="space-y-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
            {block.body.split('\n\n').map((para, j) => (
              <p key={`${block.title}-${j}`}>{para}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-(--bg-main) flex flex-col">
      <SearchHeader fixed showSearchForm={false} />

      <section className="pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto w-full space-y-8 sm:space-y-10">
          <Link href="/" className="edge-btn-secondary inline-flex">
            <ArrowLeft size={15} aria-hidden /> {t('privacy.back')}
          </Link>

          <header className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{t('privacy.updated')}</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              {t('privacy.title')}
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">{t('privacy.intro')}</p>
          </header>

          <div className="edge-panel p-6 sm:p-8 lg:p-10">
            <SectionBlocks t={t} />
          </div>
        </div>
      </section>

      <footer className="py-10 sm:py-12 border-t border-neutral-200 bg-(--bg-surface)">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm font-medium text-neutral-400 text-center md:text-left">{t('footer.copyright')}</div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <Link href="/about" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
              {t('nav.about')}
            </Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">
              {t('nav.terms')}
            </Link>
            <Link href="/privacy" className="text-sm font-semibold text-neutral-900">
              {t('nav.privacy')}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
