'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });

function SearchHeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCountry = searchParams?.get('country') || 'United Kingdom';
  const initialQuery = searchParams?.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [scrolled, setScrolled] = useState(false);

  // Sync state if URL changes externally (e.g. back button)
  const currentCountry = searchParams?.get('country') || 'United Kingdom';
  if (selectedCountry !== currentCountry) {
    setSelectedCountry(currentCountry);
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?country=${selectedCountry}${query ? `&q=${query}` : ''}`);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    // Push the navigation dynamically immediately so the page updates its text
    router.push(`/search?country=${newCountry}${query ? `&q=${query}` : ''}`);
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-200 bg-white/90 backdrop-blur-md border-b ${scrolled ? 'border-neutral-200 py-4 shadow-sm' : 'border-neutral-100 py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">

          {/* Soft Modern Branding */}
          <div 
            className="flex flex-col cursor-pointer"
            onClick={() => router.push('/')}
          >
            <span className={`text-3xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}>
              soso.
            </span>
          </div>

          {/* Soft Search Interface */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl flex justify-end">
             <div className="w-full flex items-center bg-white border border-neutral-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-neutral-200 focus-within:border-neutral-300 transition-all">
                <div className="flex items-center gap-2 pl-6 pr-4 border-r border-neutral-200">
                  <MapPin size={16} className="text-neutral-400" />
                  <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-3.5"
                  >
                    {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 px-4 flex items-center gap-3">
                  <Search size={16} className="text-neutral-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search university name..."
                    className="bg-transparent w-full py-3.5 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
                  />
                </div>

                <div className="pr-2">
                  <button type="submit" className="px-6 py-2 bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-black transition-colors shadow-sm">
                    Search
                  </button>
                </div>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}

export default function SearchHeader() {
  return (
    <Suspense fallback={<div className="h-40 bg-white border-b border-neutral-100" />}>
      <SearchHeaderContent />
    </Suspense>
  );
}
