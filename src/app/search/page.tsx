'use client';

import useSWR from 'swr';
import { fetchUniversities } from '@/lib/api';
import UniversityCard from '@/components/UniversityCard';
import { use } from 'react';
import { Activity, Shield, Info, Database } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';
import { useLanguage } from '@/contexts/LanguageContext';

const PAGE_SIZE = 12;

const fetcher = async ([country, query]: [string, string | undefined]) => {
  return await fetchUniversities(country, query);
};

function ResultsGrid({ country, q, page }: { country: string, q?: string, page: number }) {
  const { t } = useLanguage();
  const { data: universities, error, isLoading } = useSWR(
    [country, q],
    fetcher,
    {
      revalidateOnFocus: false, // Prevents multiple calls when switching tabs
      revalidateOnReconnect: false,
      dedupingInterval: 60000 // Cache locally for 1 minute
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-96 border border-neutral-100 animate-pulse bg-neutral-50" />
        ))}
      </div>
    );
  }

  if (error || !universities) {
    return (
      <div className="p-40 border border-black/10 text-center relative z-10 bg-neutral-50 shadow-sm">
        <Database size={80} className="mx-auto text-neutral-200 mb-10" />
        <div className="space-y-6">
          <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Error Loading Data</h3>
          <p className="text-neutral-500 font-medium">Status: connection failed.</p>
        </div>
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="p-40 border border-neutral-100 text-center relative z-10 bg-neutral-50 shadow-sm rounded-3xl">
        <Database size={80} className="mx-auto text-neutral-200 mb-10" />
        <div className="space-y-6">
          <h3 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Zero Results</h3>
          <p className="text-neutral-500 font-medium">No universities matching &quot;{q || 'None'}&quot; in {country}.</p>
        </div>
      </div>
    );
  }

  const totalResults = universities.length;
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  const paginatedResult = universities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-32 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {paginatedResult.map((uni, index) => (
          <UniversityCard key={`${uni.name}-${index}`} university={uni} index={index} />
        ))}
      </div>

      {/* Pagination Interface */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 py-20 border-t border-neutral-100 mt-20">
          <Link
            href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${Math.max(1, page - 1)}`}
            className={`px-8 py-3 rounded-full border border-neutral-200 text-sm font-bold transition-all hover:bg-neutral-50 ${page === 1 ? 'opacity-20 pointer-events-none' : ''}`}
          >
            PREVIOUS
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <Link
                    key={p}
                    href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${p}`}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-full transition-all ${page === p ? 'bg-black text-white' : 'text-neutral-400 hover:text-black hover:bg-neutral-50'}`}
                  >
                    {p}
                  </Link>
                );
              }
              if (p === page - 2 || p === page + 2) return <span key={p} className="text-neutral-300">...</span>;
              return null;
            })}
          </div>

          <Link
            href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${Math.min(totalPages, page + 1)}`}
            className={`px-8 py-3 rounded-full border border-neutral-200 text-sm font-bold transition-all hover:bg-neutral-50 ${page === totalPages ? 'opacity-20 pointer-events-none' : ''}`}
          >
            NEXT
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { t } = useLanguage();
  const params = use(searchParams);
  const country = (params.country as string) || 'United Kingdom';
  const query = (params.q as string) || undefined;
  const page = parseInt((params.page as string)) || 1;

  return (
    <main className="min-h-screen bg-white pb-40">
      <SearchHeader />

      <div className="max-w-7xl mx-auto px-6 pt-72 pb-20 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-12 border-b border-neutral-100 pb-16">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-widest mb-4">
              <Shield size={14} /> {t('search.header.country')}
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] capitalize">
              {country} Universities.
            </h1>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-6">
               <div className="px-4 py-1.5 rounded-full bg-white text-neutral-600 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 animate-pulse"></span>
                 {t('search.header.live')}
               </div>
               <div className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                 <Info size={16} className="text-neutral-400" /> {t('search.header.browsing')}
               </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-10">
            <div className="text-xs font-semibold text-neutral-500 border border-neutral-200 py-3 px-6 rounded-full bg-white flex items-center gap-3 shadow-sm">
              <Activity size={16} className="text-neutral-400" /> {t('search.header.query')} <span className="text-neutral-900 font-bold">{query || t('search.header.all')}</span>
            </div>
          </div>
        </div>

        <ResultsGrid country={country} q={query} page={page} />
      </div>

      <footer className="mt-20 py-12 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm font-medium text-neutral-500">
            {t('footer.copyright')}
          </div>
          <div className="flex items-center gap-8">
            <Link href="/about" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.about')}</Link>
            <Link href="/students" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.students')}</Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.terms')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
