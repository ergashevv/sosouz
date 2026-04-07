'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ForStudentsPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="flex items-center px-4 sm:px-6 py-5 sm:py-8 border-b border-black/5 bg-white">
        <Link href="/" className="text-xl font-black text-black tracking-tighter uppercase leading-none">
          SOSO
        </Link>
      </nav>

      <section className="flex-1 flex flex-col pt-14 sm:pt-24 lg:pt-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto w-full space-y-10 sm:space-y-12">
          <Link href="/" className="inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 bg-white text-black border border-black font-bold rounded-none transition-all duration-200 uppercase tracking-widest hover:bg-black hover:text-white active:scale-[0.98] w-fit text-[10px] sm:text-xs">
            <ArrowLeft size={16} /> {t('about.back')}
          </Link>

          <div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-black tracking-tighter uppercase italic underline decoration-neutral-100">
              {t('students.title')}
            </h1>
          </div>

          <div className="prose prose-lg max-w-none text-black leading-relaxed">
            <p className="text-lg sm:text-2xl font-bold uppercase tracking-tight text-neutral-400">
              {t('students.subtitle')}
            </p>
            
            <div className="space-y-6 sm:space-y-8 mt-8 sm:mt-12 text-xs sm:text-sm font-bold uppercase tracking-wide sm:tracking-widest leading-loose text-neutral-600">
               <p>
                 {t('students.p1')}
               </p>
               <p>
                 {t('students.p2')}
               </p>
               <div className="p-5 sm:p-8 border border-black/10 bg-neutral-50 rounded-none relative">
                 <div className="tag-pill bg-black text-white absolute -top-3 left-4 sm:left-8 uppercase">{t('students.notice')}</div>
                 <p className="mt-4 text-xs">
                   {t('students.noticeBody')}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-black/10 bg-white mt-14 sm:mt-24 lg:mt-32">
         <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] text-center md:text-left">
               {t('footer.copyright')}
            </div>
         </div>
      </footer>
    </main>
  );
}
