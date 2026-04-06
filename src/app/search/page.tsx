'use client';

import useSWR from 'swr';
import { fetchUniversities } from '@/lib/api';
import UniversityCard from '@/components/UniversityCard';
import { use, useState } from 'react';
import { Activity, Shield, Info, Database, Search, MapPin } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { countries } from '@/lib/countries';

const PAGE_SIZE = 12;

const fetcher = async ([country, query]: [string, string | undefined]) => {
  return await fetchUniversities(country, query);
};

const buildSearchHref = (country: string, page: number, query?: string) => {
  const params = new URLSearchParams({ country, page: String(page) });
  if (query && query.trim()) {
    params.set('q', query.trim());
  }
  return `/search?${params.toString()}`;
};

function ResultsGrid({ country, q, page }: { country: string; q?: string; page: number }) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-96 border border-neutral-100 animate-pulse bg-neutral-50" />
        ))}
      </div>
    );
  }

  if (error || !universities) {
    return (
      <div className="p-8 sm:p-16 md:p-24 border border-black/10 text-center relative z-10 bg-neutral-50 shadow-sm rounded-2xl">
        <Database size={80} className="mx-auto text-neutral-200 mb-10" />
        <div className="space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">Error Loading Data</h3>
          <p className="text-neutral-500 font-medium">Status: connection failed.</p>
        </div>
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="p-8 sm:p-16 md:p-24 border border-neutral-100 text-center relative z-10 bg-neutral-50 shadow-sm rounded-3xl">
        <Database size={80} className="mx-auto text-neutral-200 mb-10" />
        <div className="space-y-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">Zero Results</h3>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {paginatedResult.map((uni, index) => (
          <UniversityCard key={`${uni.name}-${index}`} university={uni} index={index} />
        ))}
      </div>

      {/* Pagination Interface */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10 py-10 sm:py-16 border-t border-neutral-100 mt-12 sm:mt-20">
          <a
            href={buildSearchHref(country, Math.max(1, page - 1), q)}
            className={`px-8 py-3 rounded-full border border-neutral-200 text-sm font-bold transition-all hover:bg-neutral-50 ${page === 1 ? 'opacity-20 pointer-events-none' : ''}`}
          >
            PREVIOUS
          </a>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <a
                    key={p}
                    href={buildSearchHref(country, p, q)}
                    className={`w-10 h-10 flex items-center justify-center text-xs font-bold rounded-full transition-all ${page === p ? 'bg-black text-white' : 'text-neutral-400 hover:text-black hover:bg-neutral-50'}`}
                  >
                    {p}
                  </a>
                );
              }
              if (p === page - 2 || p === page + 2) return <span key={p} className="text-neutral-300">...</span>;
              return null;
            })}
          </div>

          <a
            href={buildSearchHref(country, Math.min(totalPages, page + 1), q)}
            className={`px-8 py-3 rounded-full border border-neutral-200 text-sm font-bold transition-all hover:bg-neutral-50 ${page === totalPages ? 'opacity-20 pointer-events-none' : ''}`}
          >
            NEXT
          </a>
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
  const [searchCountry, setSearchCountry] = useState(country);
  const [searchQuery, setSearchQuery] = useState(query || '');

  const handleRefineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.assign(buildSearchHref(searchCountry, 1, searchQuery || undefined));
  };

  return (
    <main className="min-h-screen bg-white pb-24 sm:pb-40">
      <SearchHeader fixed={false} showSearchForm={false} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-14 sm:pb-20 relative z-10">
        <section className="mb-8 sm:mb-12">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 sm:mb-4">
              <Search size={13} className="text-neutral-400" />
              Search Universities
            </div>

            <form onSubmit={handleRefineSearch} className="w-full">
              <div className="w-full flex flex-col md:flex-row md:items-center bg-white border border-neutral-200 rounded-3xl md:rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-neutral-200 focus-within:border-neutral-300 transition-all">
                <div className="flex items-center gap-2 pl-4 sm:pl-6 pr-4 border-b md:border-b-0 md:border-r border-neutral-200 min-h-11 min-w-0">
                  <MapPin size={16} className="text-neutral-400" />
                  <select
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-2.5 md:py-3.5 w-full min-w-0"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 px-4 flex items-center gap-3 min-h-11">
                  <Search size={16} className="text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('home.search.placeholder')}
                    className="bg-transparent w-full py-2.5 md:py-3.5 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
                  />
                </div>

                <div className="px-2 pb-2 md:pb-0 md:pr-2">
                  <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-black transition-colors shadow-sm">
                    {t('home.search.btn')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 sm:mb-16 gap-8 sm:gap-12 border-b border-neutral-100 pb-10 sm:pb-16">
          <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-widest mb-4">
              <Shield size={14} /> {t('search.header.country')}
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] capitalize wrap-break-word">
              {country} Universities.
            </h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mt-4 sm:mt-6">
               <div className="px-4 py-1.5 rounded-full bg-white text-neutral-600 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 animate-pulse"></span>
                 {t('search.header.live')}
               </div>
               <div className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                 <Info size={16} className="text-neutral-400" /> {t('search.header.browsing')}
               </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-6 sm:gap-10">
            <div className="text-xs font-semibold text-neutral-500 border border-neutral-200 py-3 px-4 sm:px-6 rounded-full bg-white flex items-center gap-3 shadow-sm max-w-full min-w-0">
              <Activity size={16} className="text-neutral-400 shrink-0" /> {t('search.header.query')} <span className="text-neutral-900 font-bold break-all">{query || t('search.header.all')}</span>
            </div>
          </div>
        </div>

        <ResultsGrid
          country={country}
          q={query}
          page={page}
        />
      </div>

      <footer className="mt-12 sm:mt-20 py-10 sm:py-12 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-sm font-medium text-neutral-500 text-center md:text-left">
            {t('footer.copyright')}
          </div>
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap justify-center">
            <Link href="/about" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.about')}</Link>
            <Link href="/students" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.students')}</Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-black transition-colors">{t('nav.terms')}</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
