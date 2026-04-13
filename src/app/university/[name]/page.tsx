import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getLogoUrl, getFallbackLogoUrl } from '@/lib/api';
import { fetchUniversityByNameDirect } from '@/lib/hipo-search';
import { getSiteUrl } from '@/lib/site';
import { performResearch } from '@/lib/research';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';
import UniversityDetailView, { AIResearchData } from '@/components/UniversityDetailView';
import { getUniversityYoutubeVideos } from '@/lib/university-youtube';
import type { Language } from '@/lib/i18n';

interface UniversityPageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const basicInfo = await fetchUniversityByNameDirect(decodedName);
  const site = getSiteUrl();
  const canonicalPath = `/university/${name}`;

  if (!basicInfo) {
    return {
      title: decodedName,
      description: `Find "${decodedName}" and explore universities worldwide on SOSO.`,
      robots: { index: false, follow: true },
      alternates: { canonical: `${site}${canonicalPath}` },
    };
  }

  const title = `${basicInfo.name} — ${basicInfo.country}`;
  const description = `Profile for ${basicInfo.name} in ${basicInfo.country}: official links, discovery data, and research context on SOSO.`;

  return {
    title,
    description,
    alternates: { canonical: `${site}${canonicalPath}` },
    openGraph: {
      title: `${basicInfo.name} | SOSO`,
      description,
      url: canonicalPath,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${basicInfo.name} | SOSO`,
      description,
    },
  };
}

function LoadingState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center bg-white px-4 py-8 sm:gap-10 sm:py-12">
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-8 sm:gap-10">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap size={28} className="text-primary" />
          </div>
        </div>
        <div className="text-center space-y-3 mt-2 sm:mt-4">
          <p className="text-lg sm:text-xl font-bold text-neutral-800 tracking-tight">Gathering university details...</p>
          <div className="text-sm text-neutral-500 animate-pulse font-medium">
            Loading tuition, admission, and scholarship data
          </div>
        </div>
      </div>
    </section>
  );
}

function deriveDomain(basicInfo: { domains?: string[]; web_pages?: string[] }): string {
  if (Array.isArray(basicInfo.domains) && basicInfo.domains.length > 0 && basicInfo.domains[0]) {
    return basicInfo.domains[0];
  }

  const fallbackPage = Array.isArray(basicInfo.web_pages) ? basicInfo.web_pages[0] : null;
  if (!fallbackPage) return "unknown";

  try {
    return new URL(fallbackPage).hostname || "unknown";
  } catch {
    return "unknown";
  }
}

function getNotFoundCopy(lang: Language): { title: string; message: string; action: string } {
  if (lang === 'uz') {
    return {
      title: 'Universitet topilmadi',
      message: 'Ushbu nomga mos universitet topilmadi. Boshqa kalit soʻz bilan qidirib koʻring.',
      action: "Qidiruvga qaytish",
    };
  }

  if (lang === 'ru') {
    return {
      title: 'Университет не найден',
      message: 'Университет с таким названием не найден. Попробуйте другой запрос.',
      action: 'Вернуться к поиску',
    };
  }

  return {
    title: 'University Not Found',
    message: 'We could not find a university matching this name. Try a different search.',
    action: 'Return to Search',
  };
}

async function UniversityContent({
  name,
  lang = 'en',
}: {
  name: string;
  lang?: Language;
}) {
  const decodedName = decodeURIComponent(name);
  const basicInfo = await fetchUniversityByNameDirect(decodedName);
  
  if (!basicInfo) {
    const copy = getNotFoundCopy(lang);
    const searchHref = `/search?lang=${lang}`;

    return (
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl rounded-none border border-neutral-200 bg-neutral-50 p-8 sm:p-12 lg:p-16 text-center shadow-none">
          <div className="mx-auto mb-6 sm:mb-8 flex h-14 w-14 items-center justify-center rounded-none border border-neutral-300 bg-white text-black">
            <GraduationCap size={26} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            {copy.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 font-medium leading-relaxed wrap-break-word">
            {copy.message} <span className="text-neutral-900">&quot;{decodedName}&quot;</span>.
          </p>
          <Link
            href={searchHref}
            className="edge-btn-primary mt-10 px-8 py-3 text-sm"
          >
            {copy.action}
          </Link>
        </div>
      </section>
    );
  }

  const domain = deriveDomain(basicInfo);
  let aiDetails: Awaited<ReturnType<typeof performResearch>> = null;
  try {
    aiDetails = await performResearch(decodedName, basicInfo.country, domain, lang, {
      domains: basicInfo.domains,
      web_pages: basicInfo.web_pages,
    });
  } catch (error) {
    console.error("Research fetch failed:", error);
  }
  let youtubeVideos: Awaited<ReturnType<typeof getUniversityYoutubeVideos>> = null;
  try {
    youtubeVideos = await getUniversityYoutubeVideos(decodedName);
  } catch (error) {
    console.error("YouTube fetch failed:", error);
  }
  const logoSrc = getLogoUrl(domain);
  const fallbackSrc = getFallbackLogoUrl(domain);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <UniversityDetailView
        basicInfo={basicInfo}
        aiDetails={aiDetails as unknown as AIResearchData}
        domain={domain}
        logoSrc={logoSrc}
        fallbackSrc={fallbackSrc}
        lang={lang}
        youtubeVideos={youtubeVideos}
      />
    </div>
  );
}

import { cookies } from "next/headers";

function coerceLanguage(value: string | undefined): Language {
  if (value === 'uz' || value === 'ru' || value === 'en') return value;
  return 'en';
}

export default async function UniversityDetail({ params, searchParams }: UniversityPageProps) {
  const { name } = await params;
  const sParams = await searchParams;
  const cookieStore = await cookies();
  const lang = coerceLanguage(sParams.lang || cookieStore.get('soso_lang')?.value);
  
  return (
    <main className="flex min-h-dvh flex-col bg-(--bg-main)">
      <SearchHeader showSearchForm={false} />
      <div className="flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<LoadingState />}>
          <UniversityContent name={name} lang={lang} />
        </Suspense>
      </div>
    </main>
  );
}
