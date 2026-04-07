'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Shield,
  Database,
  LayoutGrid,
  Menu,
  X,
  Sparkles,
  Compass,
  WalletCards,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import { countries } from '@/lib/countries';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Outfit } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';
import HeaderAccountActions from '@/components/HeaderAccountActions';
import TopRankingsSection from '@/components/TopRankingsSection';

const outfit = Outfit({ subsets: ['latin'], weight: ['800'] });
const INDEX_START_VALUE = 0;
// 2026-04-07 09:00 (Uzbekistan, UTC+5)
const INDEX_CLOCK_START_MS = new Date('2026-04-07T09:00:00+05:00').getTime();

const homeIntentCopy = {
  uz: {
    eyebrow: "30 soniyada tushunib oling",
    title: "Bu sayt nima, nima beradi va nima uchun kerak?",
    lead: "Soso — chet eldagi universitetlar bo'yicha qarorni tezroq va aniqroq qilish uchun qurilgan qidiruv maydoni. Bu yerda siz variantlarni topasiz, taqqoslaysiz va keyingi qadamni yo'qotmasdan harakat qilasiz.",
    valueTitle: "Bu qanday ishlaydi?",
    valueSteps: [
      "Mamlakat va yo'nalishni tanlaysiz.",
      "Universitet variantlarini bir joyda ko'rasiz.",
      "O'zingizga mos yo'nalishga tez o'tasiz.",
    ],
    answers: [
      {
        icon: Compass,
        question: 'Bu nima?',
        answer: "Abituriyent uchun universitetlarni izlash va saralash platformasi.",
      },
      {
        icon: WalletCards,
        question: 'Nima olaman bundan?',
        answer: "Vaqtingiz tejaladi: qo'lda tarqoq izlash o'rniga tartiblangan natija olasiz.",
      },
      {
        icon: Sparkles,
        question: 'Nima foydasi bor?',
        answer: "Chalg'imasdan asosiy ma'lumotni ko'rib, aniq qaror qabul qilasiz.",
      },
      {
        icon: Rocket,
        question: 'Nima qiladi?',
        answer: "Qidiruvdan boshlab mos universitetga yetguncha yo'lingizni soddalashtiradi.",
      },
    ],
    ctaPrimary: "Hozir qidirishni boshlash",
    ctaSecondary: "Platforma haqida",
  },
  en: {
    eyebrow: 'Understand in 30 seconds',
    title: 'What is this site, what do I get, and why should I use it?',
    lead: 'Soso is a focused discovery space for studying abroad. Instead of scattered research, you get one clear flow: find options, compare quickly, and move to your next step with confidence.',
    valueTitle: 'How does it work?',
    valueSteps: [
      'Choose country and study direction.',
      'See relevant university options in one place.',
      'Move to the best-fit path without losing momentum.',
    ],
    answers: [
      {
        icon: Compass,
        question: 'What is this?',
        answer: 'A student-first platform to explore and shortlist universities.',
      },
      {
        icon: WalletCards,
        question: 'What do I get?',
        answer: 'Time saved: structured options instead of manual fragmented search.',
      },
      {
        icon: Sparkles,
        question: 'What is the benefit?',
        answer: 'Clearer decisions with less noise and faster understanding.',
      },
      {
        icon: Rocket,
        question: 'What does it do?',
        answer: 'It simplifies your route from search to a relevant university choice.',
      },
    ],
    ctaPrimary: 'Start searching now',
    ctaSecondary: 'About the platform',
  },
  ru: {
    eyebrow: 'Поймите за 30 секунд',
    title: 'Что это за сайт, что я получу и зачем он мне?',
    lead: 'Soso — это платформа для быстрого выбора зарубежного вуза. Вместо разрозненного поиска вы получаете понятный путь: найти варианты, сравнить и перейти к следующему шагу.',
    valueTitle: 'Как это работает?',
    valueSteps: [
      'Выбираете страну и направление.',
      'Смотрите подходящие варианты вузов в одном месте.',
      'Быстро переходите к наиболее подходящему пути.',
    ],
    answers: [
      {
        icon: Compass,
        question: 'Что это?',
        answer: 'Платформа для поиска и отбора университетов для абитуриентов.',
      },
      {
        icon: WalletCards,
        question: 'Что я получу?',
        answer: 'Экономию времени: структурированные результаты вместо хаотичного поиска.',
      },
      {
        icon: Sparkles,
        question: 'Какая польза?',
        answer: 'Меньше шума, больше ясности и более уверенное решение.',
      },
      {
        icon: Rocket,
        question: 'Что делает сайт?',
        answer: 'Упрощает путь от первого запроса до подходящего университета.',
      },
    ],
    ctaPrimary: 'Начать поиск',
    ctaSecondary: 'О платформе',
  },
} as const;

function formatBadgeIndex(nowMs: number): string {
  const elapsedHours = Math.max(0, Math.floor((nowMs - INDEX_CLOCK_START_MS) / (1000 * 60 * 60)));
  return String(INDEX_START_VALUE + elapsedHours).padStart(2, '0');
}

export default function Home() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dynamicIndex, setDynamicIndex] = useState('00');
  const copy = homeIntentCopy[language] ?? homeIntentCopy.en;

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

  useEffect(() => {
    const updateIndex = () => setDynamicIndex(formatBadgeIndex(Date.now()));
    updateIndex();
    const timerId = window.setInterval(updateIndex, 60 * 1000);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Modern Soft Navbar */}
      <nav className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-neutral-100 bg-white relative z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
            <span className={`text-3xl sm:text-4xl tracking-tight text-neutral-900 leading-none ${outfit.className}`}>
              soso.
            </span>
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

          <div className="hidden md:flex items-center flex-wrap justify-end gap-3 sm:gap-5">
            <Link href="/search" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.search')}</Link>
            <Link href="/about" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.about')}</Link>
            <Link href="/students" className="text-[10px] sm:text-[11px] font-bold text-neutral-500 hover:text-black transition-colors uppercase tracking-widest">{t('nav.students')}</Link>

            <div className="h-4 w-px bg-neutral-200 mx-1"></div>

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

            <HeaderAccountActions />
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="md:hidden mt-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-neutral-600 hover:text-black transition-colors uppercase tracking-widest">{t('nav.search')}</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-neutral-600 hover:text-black transition-colors uppercase tracking-widest">{t('nav.about')}</Link>
              <Link href="/students" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-neutral-600 hover:text-black transition-colors uppercase tracking-widest">{t('nav.students')}</Link>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Language
              </div>
              <div className="flex items-center gap-4">
                {(['en', 'ru', 'uz'] as const).map((lang) => (
                  <button
                    key={`mobile-${lang}`}
                    onClick={() => {
                      setLanguage(lang);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                      language === lang ? 'text-black underline underline-offset-4' : 'text-neutral-300 hover:text-neutral-500'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <HeaderAccountActions />
            </div>
          </div>
        ) : null}
      </nav>

      {/* Hero Section */}
      <section className="hero-wrap px-4 sm:px-6">
        <div className="hero-grid max-w-6xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-copy"
          >
            <div className="w-full sm:w-fit">
              <div className="hero-status-strip">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 h-px w-full bg-black/80 origin-left animate-[scanline_2.6s_ease-in-out_infinite]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-black/40 origin-right animate-[scanline_2.6s_ease-in-out_infinite_0.35s]"
                />
                <div className="relative z-10 flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                  <span
                    className="hidden sm:inline-flex items-center gap-2 border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-600"
                    suppressHydrationWarning
                  >
                    <span className="inline-block h-1.5 w-1.5 bg-black animate-pulse" />
                    {`Index ${dynamicIndex}`}
                  </span>
                  <span className="hidden sm:block h-5 w-px bg-neutral-200" />
                  <span className="text-sm sm:text-base font-semibold text-neutral-800 tracking-[0.01em] text-center sm:text-left">
                    {t('home.hero.badge')}
                  </span>
                  <span className="hidden sm:block border border-neutral-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-neutral-700 animate-[microfloat_2.2s_ease-in-out_infinite]">
                    25K+
                  </span>
                </div>
              </div>
            </div>

            <h1 className="max-w-[16ch] text-[2.65rem] sm:text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.04]">
              {t('home.hero.title')} <br />
              <span className="text-neutral-400 italic">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="max-w-xl text-neutral-500 text-[1.05rem] sm:text-lg leading-relaxed">
              {t('home.hero.desc')}
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="hero-search-shell"
          >
            <div className="flex flex-col items-stretch h-auto gap-2">
              <div className="hero-search-row">
                <MapPin size={18} className="text-neutral-400" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-2 w-full"
                >
                  {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="hero-search-row">
                <Search size={18} className="text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.search.placeholder')}
                  className="bg-transparent w-full py-3 md:py-2 text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400"
                />
              </div>
              <button type="submit" className="hero-search-btn">
                {t('home.search.btn')}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="home-intent-shell max-w-6xl mx-auto">
          <div className="home-intent-grid">
            <div className="home-intent-main">
              <span className="home-intent-eyebrow">{copy.eyebrow}</span>
              <h2 className="home-intent-title">{copy.title}</h2>
              <p className="home-intent-lead">{copy.lead}</p>

              <div className="home-intent-rail">
                <h3 className="home-intent-rail-title">{copy.valueTitle}</h3>
                <ol className="home-intent-steps">
                  {copy.valueSteps.map((step, index) => (
                    <li key={step} className="home-intent-step">
                      <span className="home-intent-step-index">{index + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href={buildSearchHref(selectedCountry, query)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
                >
                  {copy.ctaPrimary}
                  <ArrowRight size={16} />
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-500 hover:text-black"
                >
                  {copy.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="home-intent-cards">
              {copy.answers.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.question} className="home-answer-card" data-tilt={index % 2 === 0 ? 'left' : 'right'}>
                    <div className="home-answer-icon-wrap">
                      <Icon size={16} />
                    </div>
                    <h3 className="home-answer-question">{item.question}</h3>
                    <p className="home-answer-text">{item.answer}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <TopRankingsSection language={language} />

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

