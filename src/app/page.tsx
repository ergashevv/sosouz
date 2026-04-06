'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Shield, Database, LayoutGrid } from 'lucide-react';
import { countries } from '@/lib/countries';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Outfit } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });

export default function Home() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');

  const buildSearchHref = (country: string, searchQuery?: string) => {
    const params = new URLSearchParams({ country });
    if (searchQuery && searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    return `/search?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.assign(buildSearchHref(selectedCountry, query));
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Modern Soft Navbar */}
      <nav className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-neutral-100 bg-white relative z-50">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
          <span className={`text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}>
            soso.
          </span>
        </div>
        
        <div className="flex items-center flex-wrap justify-center sm:justify-end gap-3 sm:gap-6">
          <Link href="/search" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.search')}</Link>
          <Link href="/about" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.about')}</Link>
          <Link href="/students" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.students')}</Link>
          
          <div className="hidden sm:block h-4 w-px bg-neutral-200 mx-1"></div>
          
          <div className="flex items-center gap-3 sm:gap-4">
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto w-full text-center space-y-10 sm:space-y-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="mx-auto w-fit inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-8 hover:scale-105 transition-transform cursor-default">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neutral-800"></span>
              </span>
              <span className="text-xs font-semibold text-neutral-600 tracking-wide">
                {t('home.hero.badge')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight leading-[1.1]">
              {t('home.hero.title')} <br />
              <span className="text-neutral-400 italic">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="max-w-2xl mx-auto text-neutral-500 text-base sm:text-lg leading-relaxed mt-4 sm:mt-6">
              {t('home.hero.desc')}
            </p>
          </motion.div>

          {/* Centralized Search Bar */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mt-10 sm:mt-16 p-2 bg-white border border-neutral-200 rounded-3xl md:rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-neutral-200 transition-all"
          >
            <div className="flex flex-col md:flex-row items-stretch h-auto md:h-14">
              <div className="flex items-center gap-2 pl-4 sm:pl-6 pr-4 border-b md:border-b-0 md:border-r border-neutral-200">
                <MapPin size={18} className="text-neutral-400" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-3 md:py-2 w-full md:w-auto"
                >
                  {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex-1 px-4 flex items-center gap-3 bg-transparent min-h-12">
                <Search size={18} className="text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.search.placeholder')}
                  className="bg-transparent w-full py-3 md:py-2 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
                />
              </div>
              <button type="submit" className="px-8 h-11 md:h-full bg-neutral-900 text-white text-sm font-bold rounded-full hover:bg-black transition-colors w-full md:w-auto flex items-center justify-center shadow-md">
                {t('home.search.btn')}
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Trust & Categories Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-black/5 bg-neutral-50">
        <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24">
          {/* Trust Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-10 sm:gap-6 border-b border-black/10 pb-14 sm:pb-24">
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black text-black tracking-tighter">25.4K</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2"><Shield size={12} /> {t('home.stats.verified')}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black text-black tracking-tighter">195+</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2"><Database size={12} /> {t('home.stats.countries')}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black text-black tracking-tighter">100%</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={12} /> {t('home.stats.free')}</span>
            </div>
          </div>

          {/* Quick Access Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: 'United Kingdom', key: 'home.reg.uk', color: 'bg-black text-white border-black' },
              { name: 'United States', key: 'home.reg.us', color: 'bg-white text-black border-black/10 hover:border-black' },
              { name: 'Germany', key: 'home.reg.de', color: 'bg-white text-black border-black/10 hover:border-black' }
            ].map(dest => (
              <a
                key={dest.name}
                href={buildSearchHref(dest.name)}
                className={`p-6 sm:p-10 border transition-all flex flex-col justify-between h-40 sm:h-48 group ${dest.color}`}
              >
                <MapPin size={24} className={dest.name === 'United Kingdom' ? 'text-white/50' : 'text-black/20'} />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter">{t(dest.key)}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('home.reg.view')} &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-black/10 bg-white flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] text-center md:text-left flex-1">
            {t('footer.copyright')}
          </div>
          <div className="flex flex-1 justify-center items-center gap-6 sm:gap-8 flex-wrap">
            <Link href="/about" className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-black">{t('nav.about')}</Link>
            <Link href="/terms" className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] hover:text-black">{t('nav.terms')}</Link>
          </div>
          <div className="flex flex-1 justify-center md:justify-end items-center gap-2 text-black font-bold text-[10px] uppercase tracking-widest">
            {t('footer.status')}
          </div>
        </div>
      </footer>
    </main>
  );
}

