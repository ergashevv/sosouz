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
  Target,
  MessageCircle,
} from 'lucide-react';
import { countries } from '@/lib/countries';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Outfit } from 'next/font/google';
import { useLanguage } from '@/contexts/LanguageContext';
import HeaderAccountActions from '@/components/HeaderAccountActions';
import TopRankingsSection from '@/components/TopRankingsSection';
import ContactMailtoLink from '@/components/ContactMailtoLink';
import { useRecommendedUniversities } from '@/lib/useRecommendedUniversities';
import OutcomeMetricsPanel from '@/components/OutcomeMetricsPanel';
import { bumpOutcomeMetric, trackEvent } from '@/lib/analytics';
import { buildTopUniversityPath } from '@/lib/top-university-defaults';
import { getSiteOperatorLegalName } from '@/lib/site';

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
      "Mamlakat bo'yicha faqat platformadagi tekshirilgan universitetlar tavsiya qilinadi.",
      "Rasmiy havolalar va dolzarblik belgisi bilan xatolik riski kamayadi.",
      "Qidiruv → profil → AI maslahat → rasmiy saytga o'tish oqimi bir joyda ishlaydi.",
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
      'Recommendations are constrained to verified universities in SOSO for the selected country.',
      'Official links and freshness cues reduce misinformation risk.',
      'One flow: discovery -> profile -> AI advisor -> official next step.',
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
      'Рекомендации ограничены проверенными вузами SOSO по выбранной стране.',
      'Официальные ссылки и метки свежести снижают риск ошибок.',
      'Единая воронка: поиск -> профиль -> AI‑советник -> официальный следующий шаг.',
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
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('United Kingdom');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dynamicIndex, setDynamicIndex] = useState('00');
  const copy = homeIntentCopy[language] ?? homeIntentCopy.en;
  const { universities: recommendedUniversities, isLoading: isUniversitiesLoading } =
    useRecommendedUniversities(selectedCountry);

  const buildSearchHref = (country: string, searchQuery?: string) => {
    const params = new URLSearchParams({ country });
    if (searchQuery && searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    return `/search?${params.toString()}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    bumpOutcomeMetric('discovery_search_started');
    trackEvent('soso_discovery_search_started', {
      country: selectedCountry,
      has_query: Boolean(selectedUniversity.trim()),
      page: 'home',
    });
    window.location.assign(buildSearchHref(selectedCountry, selectedUniversity));
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
    <main className="min-h-screen flex flex-col bg-transparent">
      {/* Modern Soft Navbar */}
      <nav className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-md relative z-50 supports-[backdrop-filter]:bg-white/70">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
            <span className={`text-3xl sm:text-4xl tracking-tight text-slate-800 leading-none ${outfit.className}`}>
              soso<span className="text-stone-600">.</span>
            </span>
          </div>

          <button
            type="button"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div className="hidden md:flex items-center flex-wrap justify-end gap-3 sm:gap-5">
            <Link href="/search" className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.search')}</Link>
            <Link href="/ai-studio" className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.aiStudio')}</Link>
            <Link href={buildTopUniversityPath({})} className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.top')}</Link>
            <Link href="/about" className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.about')}</Link>
            <Link href="/students" className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.students')}</Link>
            <Link href="/privacy" className="text-[10px] sm:text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.privacy')}</Link>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            <div className="flex items-center gap-3 sm:gap-4">
              {(['en', 'ru', 'uz'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                    language === lang ? 'text-slate-900 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'
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
          <div className="md:hidden mt-4 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm space-y-4 backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.search')}</Link>
              <Link href="/ai-studio" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.aiStudio')}</Link>
              <Link href={buildTopUniversityPath({})} onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.top')}</Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.about')}</Link>
              <Link href="/students" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.students')}</Link>
              <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest">{t('nav.privacy')}</Link>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                {t('header.menu.language')}
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
                      language === lang ? 'text-slate-900 underline underline-offset-4' : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
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
                  className="pointer-events-none absolute left-0 top-0 h-px w-full bg-stone-400/30 origin-left animate-[scanline_2.6s_ease-in-out_infinite]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-stone-400/15 origin-right animate-[scanline_2.6s_ease-in-out_infinite_0.35s]"
                />
                <div className="relative z-10 flex items-center justify-center sm:justify-start gap-3 sm:gap-4">
                  <span
                    className="hidden sm:inline-flex items-center gap-2 border border-slate-200/90 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600"
                    suppressHydrationWarning
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-700 animate-pulse" />
                    {`Index ${dynamicIndex}`}
                  </span>
                  <span className="hidden sm:block h-5 w-px bg-slate-200" />
                  <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-[0.01em] text-center sm:text-left">
                    {t('home.hero.badge')}
                  </span>
                  <span className="hidden sm:block border border-slate-200/90 bg-white/60 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 animate-[microfloat_2.2s_ease-in-out_infinite]">
                    25K+
                  </span>
                </div>
              </div>
            </div>

            <h1 className="max-w-[16ch] text-[2.65rem] sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.04]">
              {t('home.hero.title')} <br />
              <span className="text-slate-500 italic text-[0.92em]">{t('home.hero.subtitle')}</span>
            </h1>
            <p className="max-w-xl text-slate-600 text-[1.05rem] sm:text-lg leading-relaxed">
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
                <MapPin size={18} className="text-slate-400" />
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedUniversity('');
                  }}
                  className="bg-transparent text-sm font-semibold text-neutral-700 outline-none cursor-pointer py-2 w-full"
                >
                  {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="hero-search-row">
                <Search size={18} className="text-slate-400" />
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="bg-transparent w-full py-3 md:py-2 text-sm font-medium text-neutral-800 outline-none"
                >
                  <option value="">
                    {isUniversitiesLoading ? t('home.search.loadingUniversities') : t('home.search.selectUniversity')}
                  </option>
                  {recommendedUniversities.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
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
                  href={buildSearchHref(selectedCountry, selectedUniversity)}
                  onClick={() => {
                    bumpOutcomeMetric('discovery_search_started');
                    trackEvent('soso_discovery_search_started', {
                      country: selectedCountry,
                      has_query: Boolean(selectedUniversity.trim()),
                      trigger: 'home_cta',
                    });
                  }}
                  className="product-primary-btn px-6 py-3 text-sm font-semibold shadow-sm"
                >
                  {copy.ctaPrimary}
                  <ArrowRight size={16} />
                </a>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
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

      <section className="home-ai-layer px-4 sm:px-6 py-14 sm:py-20 border-t border-(--product-outline)">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 sm:mb-14">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-(--product-outline) bg-white px-3 py-1 text-xs font-medium text-(--product-on-surface-variant)">
                <Sparkles size={12} className="text-(--product-primary)" aria-hidden /> SOSO AI
              </span>
              <h2 className="text-2xl sm:text-4xl font-medium tracking-tight leading-tight text-(--product-on-surface)">
                {t('home.aiLayer.title')}
              </h2>
              <p className="text-sm sm:text-base text-(--product-on-surface-variant) leading-relaxed">{t('home.aiLayer.subtitle')}</p>
            </div>
            <Link
              href="/ai-studio"
              className="product-primary-btn inline-flex shrink-0 items-center gap-2 px-6 py-3 text-sm font-medium"
            >
              {t('home.aiLayer.cta')}
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="product-card">
              <Target className="text-(--product-primary)" size={22} aria-hidden />
              <h3 className="mt-4 text-base font-medium text-(--product-on-surface)">{t('home.aiLayer.cardMatchTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t('home.aiLayer.cardMatchBody')}</p>
            </article>
            <article className="product-card">
              <MessageCircle className="text-(--product-primary)" size={22} aria-hidden />
              <h3 className="mt-4 text-base font-medium text-(--product-on-surface)">{t('home.aiLayer.cardChatTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t('home.aiLayer.cardChatBody')}</p>
            </article>
            <article className="product-card">
              <LayoutGrid className="text-(--product-primary)" size={22} aria-hidden />
              <h3 className="mt-4 text-base font-medium text-(--product-on-surface)">{t('home.aiLayer.cardRankTitle')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--product-on-surface-variant)">{t('home.aiLayer.cardRankBody')}</p>
            </article>
          </div>
        </div>
      </section>

      <OutcomeMetricsPanel />

      <TopRankingsSection language={language} />

      {/* Trust & Categories Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-stone-200/60 bg-linear-to-b from-stone-100/90 to-[#ebe9e6]">
        <div className="max-w-5xl mx-auto space-y-16 sm:space-y-24">
          {/* Trust Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-10 sm:gap-6 border-b border-slate-200/80 pb-14 sm:pb-24">
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black tracking-tighter bg-linear-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">25.4K</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Shield size={12} className="text-slate-400" /> {t('home.stats.verified')}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black tracking-tighter bg-linear-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">195+</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Database size={12} className="text-slate-400" /> {t('home.stats.countries')}</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl font-black tracking-tighter bg-linear-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">100%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={12} className="text-slate-400" /> {t('home.stats.free')}</span>
            </div>
          </div>

          {/* Quick Access Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: 'United Kingdom', key: 'home.reg.uk', color: 'bg-linear-to-br from-slate-800 to-slate-900 text-white border-slate-700 shadow-lg shadow-slate-900/15' },
              { name: 'United States', key: 'home.reg.us', color: 'bg-white text-stone-900 border-stone-200/90 hover:border-stone-400 hover:shadow-md' },
              { name: 'Germany', key: 'home.reg.de', color: 'bg-white text-stone-900 border-stone-200/90 hover:border-stone-400 hover:shadow-md' }
            ].map(dest => (
              <a
                key={dest.name}
                href={buildSearchHref(dest.name)}
                className={`p-6 sm:p-10 border rounded-2xl transition-all flex flex-col justify-between h-40 sm:h-48 group ${dest.color}`}
              >
                <MapPin size={24} className={dest.name === 'United Kingdom' ? 'text-white/50' : 'text-stone-300 group-hover:text-stone-500'} />
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
      <footer className="py-10 sm:py-12 px-4 sm:px-6 border-t border-slate-200/60 bg-white/90 backdrop-blur-sm flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] sm:tracking-[0.4em] text-center md:text-left flex-1">
              {t('footer.copyright')}
            </div>
            <div className="flex flex-1 justify-center items-center gap-6 sm:gap-8 flex-wrap">
              <Link href="/about" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900">{t('nav.about')}</Link>
            <Link href="/terms" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900">{t('nav.terms')}</Link>
            <Link href="/privacy" className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900">{t('nav.privacy')}</Link>
            <ContactMailtoLink className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:text-slate-900" />
            </div>
            <div className="flex flex-1 justify-center md:justify-end items-center gap-2 text-slate-700 font-bold text-[10px] uppercase tracking-widest">
              {t('footer.status')}
            </div>
          </div>
          <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em]">
            <span className="text-slate-500">{t('footer.operator')}:</span>{' '}
            <span className="text-slate-600 normal-case tracking-normal">{getSiteOperatorLegalName()}</span>
            <span className="mx-2 opacity-50">·</span>
            <ContactMailtoLink className="text-slate-600 normal-case tracking-normal hover:text-slate-900" />
          </p>
        </div>
      </footer>
    </main>
  );
}

