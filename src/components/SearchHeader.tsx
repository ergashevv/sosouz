'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Menu, X } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Outfit } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';
import HeaderAccountActions from '@/components/HeaderAccountActions';
import Link from 'next/link';

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });

interface SearchHeaderProps {
  fixed?: boolean;
  showSearchForm?: boolean;
}

function SearchHeaderContent({ fixed = true, showSearchForm = true }: SearchHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();
  const headerRef = useRef<HTMLElement | null>(null);
  const queryInputRef = useRef<HTMLInputElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const selectedCountry = searchParams?.get('country') || 'United Kingdom';
  const initialQuery = searchParams?.get('q') || '';
  const mobileLinks = [
    { href: '/', label: 'Home' },
    { href: '/search', label: 'Search' },
    { href: '/about', label: 'About' },
    { href: '/students', label: 'Students' },
  ];

  const buildSearchHref = (country: string, searchQuery?: string) => {
    const params = new URLSearchParams({ country });
    if (searchQuery && searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    return `/search?${params.toString()}`;
  };

  useEffect(() => {
    if (!fixed) {
      setScrolled(false);
      return;
    }

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fixed]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const height = headerRef.current?.offsetHeight;
      if (!height) return;
      document.documentElement.style.setProperty('--search-header-height', `${Math.ceil(height)}px`);
    };

    updateHeaderHeight();

    if (!headerRef.current || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateHeaderHeight);
      return () => window.removeEventListener('resize', updateHeaderHeight);
    }

    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    const height = headerRef.current?.offsetHeight;
    if (!height) return;
    document.documentElement.style.setProperty('--search-header-height', `${Math.ceil(height)}px`);
  }, [scrolled, language, selectedCountry, initialQuery, mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = queryInputRef.current?.value || '';
    window.location.assign(buildSearchHref(selectedCountry, query));
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    const query = queryInputRef.current?.value || '';
    // Hard navigation avoids mixed-content issues caused by misreported protocol upstream.
    window.location.assign(buildSearchHref(newCountry, query));
  };

  return (
    <header ref={headerRef} className={`${fixed ? 'fixed top-0 left-0 w-full' : 'relative w-full'} z-50 transition-all duration-200 bg-white/90 backdrop-blur-md border-b ${scrolled ? 'border-neutral-200 py-3 sm:py-4 shadow-sm' : 'border-neutral-100 py-4 sm:py-6'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-[max(env(safe-area-inset-top),0px)]">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6">

          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <div 
              className="flex flex-col cursor-pointer"
              onClick={() => router.push('/')}
            >
              <span className={`text-2xl sm:text-3xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}>
                soso.
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              <div className="h-6 w-px bg-neutral-100 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-3">
                {(['en', 'ru', 'uz'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                      language === lang ? 'text-black underline underline-offset-4' : 'text-neutral-300 hover:text-neutral-500'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <HeaderAccountActions />
            </div>

            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-black transition-colors"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="md:hidden rounded-2xl border border-neutral-200 bg-white/95 backdrop-blur-sm p-4 shadow-sm space-y-5">
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Navigation
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mobileLinks.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`rounded-xl border px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide transition-colors ${
                          isActive
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-black'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Language
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['en', 'ru', 'uz'] as const).map((lang) => (
                    <button
                      key={`mobile-${lang}`}
                      onClick={() => {
                        setLanguage(lang);
                        setMobileMenuOpen(false);
                      }}
                      className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        language === lang
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-black'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Account
                </div>
                <HeaderAccountActions />
              </div>
            </div>
          ) : null}

          {showSearchForm ? (
            <form onSubmit={handleSearch} className="w-full xl:max-w-2xl xl:ml-auto">
              <div className="w-full flex flex-col md:flex-row md:items-center bg-white border border-neutral-200 rounded-3xl md:rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:ring-2 focus-within:ring-neutral-200 focus-within:border-neutral-300 transition-all">
                <div className="flex items-center gap-2 pl-4 sm:pl-6 pr-4 border-b md:border-b-0 md:border-r border-neutral-200 min-h-11 min-w-0">
                  <MapPin size={16} className="text-neutral-400" />
                  <select
                    value={selectedCountry}
                    onChange={handleCountryChange}
                    className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-2.5 md:py-3.5 w-full min-w-0"
                  >
                    {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex-1 px-4 flex items-center gap-3 min-h-11">
                  <Search size={16} className="text-neutral-400" />
                  <input
                    type="text"
                    key={initialQuery}
                    ref={queryInputRef}
                    defaultValue={initialQuery}
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
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default function SearchHeader({ fixed = true, showSearchForm = true }: SearchHeaderProps) {
  return (
    <Suspense fallback={<div className="h-40 bg-white border-b border-neutral-100" />}>
      <SearchHeaderContent fixed={fixed} showSearchForm={showSearchForm} />
    </Suspense>
  );
}
