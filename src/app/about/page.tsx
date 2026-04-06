'use client';

import Link from 'next/link';
import { ArrowLeft, Target, Eye, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-8 border-b border-neutral-100 bg-white sticky top-0 z-50 transition-all">
        <Link href="/" className="text-2xl font-black text-neutral-900 tracking-tighter">
          soso.
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-40 px-6">
        <div className="max-w-4xl mx-auto w-full space-y-20">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-200 bg-white text-sm font-bold shadow-sm hover:shadow-md hover:bg-neutral-50 transition-all">
            <ArrowLeft size={16} /> {t('about.back')}
          </Link>

          <div className="space-y-8">
            <h1 className="text-5xl md:text-8xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {t('about.title')}
            </h1>
            <p className="text-2xl md:text-3xl font-medium text-neutral-500 leading-snug">
              {t('about.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-neutral-100">
             <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                   <Target size={24} />
                </div>
                <p className="text-lg text-neutral-600 leading-relaxed font-medium">
                  {t('about.desc1')}
                </p>
             </div>
             <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <ShieldCheck size={24} />
                </div>
                <p className="text-lg text-neutral-600 leading-relaxed font-medium">
                  {t('about.desc2')}
                </p>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm font-medium text-neutral-400">
            {t('footer.copyright')}
          </div>
          <div className="flex items-center gap-8">
            <Link href="/students" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.students')}</Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.terms')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
