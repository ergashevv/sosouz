'use client';

import useSWR from 'swr';
import { fetchUniversities } from '@/lib/api';
import UniversityCard from '@/components/UniversityCard';
import { use } from 'react';
import { Database, ChevronLeft, ChevronRight, Activity, Shield, Info } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';

const PAGE_SIZE = 12;

const fetcher = async ([country, query]: [string, string | undefined]) => {
  return await fetchUniversities(country, query);
};

function ResultsGrid({ country, q, page }: { country: string, q?: string, page: number }) {
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
          <h3 className="text-6xl font-black text-black uppercase tracking-tighter italic">Error Loading Data.</h3>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Status: connection failed.</p>
        </div>
      </div>
    );
  }

  if (universities.length === 0) {
    return (
      <div className="p-40 border border-black/10 text-center relative z-10 bg-neutral-50 shadow-sm">
        <Database size={80} className="mx-auto text-neutral-200 mb-10" />
        <div className="space-y-6">
          <h3 className="text-6xl font-black text-black uppercase tracking-tighter italic">Zero Results.</h3>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Status: no universities matching Query: {q || 'None'} in Country: {country}.</p>
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 py-20 border-t border-black">
          <Link
            href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${Math.max(1, page - 1)}`}
            className={`btn-secondary !py-4 px-12 ${page === 1 ? 'opacity-20 pointer-events-none' : ''}`}
          >
            <ChevronLeft size={16} /> PREVIOUS
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <Link
                    key={p}
                    href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${p}`}
                    className={`w-12 h-12 flex items-center justify-center text-[10px] font-black border border-black/10 transition-all ${page === p ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 hover:text-black hover:border-black'
                      }`}
                  >
                    {p}
                  </Link>
                );
              }
              if (p === page - 2 || p === page + 2) return <span key={p} className="text-neutral-200 font-black px-2">...</span>;
              return null;
            })}
          </div>

          <Link
            href={`/search?country=${country}${q ? `&q=${q}` : ''}&page=${Math.min(totalPages, page + 1)}`}
            className={`btn-secondary !py-4 px-12 ${page === totalPages ? 'opacity-20 pointer-events-none' : ''}`}
          >
            NEXT <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
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
              <Shield size={14} /> Search Results For
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] capitalize">
              {country} Universities.
            </h1>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mt-6">
               <div className="px-4 py-1.5 rounded-full bg-white text-neutral-600 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 animate-pulse"></span>
                 Live Data Search
               </div>
               <div className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                 <Info size={16} className="text-neutral-400" /> Browsing verified academic directory
               </div>
            </div>
          </div>

          <div className="flex flex-col lg:items-end gap-10">
            <div className="text-xs font-semibold text-neutral-500 border border-neutral-200 py-3 px-6 rounded-full bg-white flex items-center gap-3 shadow-sm">
              <Activity size={16} className="text-neutral-400" /> Query: <span className="text-neutral-900 font-bold">{query || 'ALL UNIVERSITIES'}</span>
            </div>
          </div>
        </div>

        <ResultsGrid country={country} q={query} page={page} />
      </div>

      <footer className="mt-20 py-12 border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm font-medium text-neutral-500">
            &copy; 2026 SOSO Education
          </div>
          <div className="flex items-center gap-8">
            <Link href="/about" className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition-colors">About Us</Link>
            <Link href="/students" className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition-colors">For Students</Link>
            <Link href="/terms" className="text-sm font-semibold text-neutral-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
