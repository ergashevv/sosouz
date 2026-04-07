import { Suspense } from 'react';
import type { Metadata } from 'next';
import { fetchUniversityByName, getLogoUrl, getFallbackLogoUrl } from '@/lib/api';
import { getSiteUrl } from '@/lib/site';
import { performResearch } from '@/lib/research';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';
import UniversityDetailView, { AIResearchData } from '@/components/UniversityDetailView';
import { getUniversityYoutubeVideos } from '@/lib/university-youtube';
import type { Language } from '@/lib/i18n';
import { headers } from 'next/headers';

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
  const basicInfo = await fetchUniversityByName(decodedName);
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
    <section className="bg-white pt-[calc(var(--search-header-height,12rem)+1rem)] sm:pt-[calc(var(--search-header-height,12rem)+1.5rem)]">
      <div className="min-h-[calc(100vh-var(--search-header-height,12rem)-2rem)] sm:min-h-[calc(100vh-var(--search-header-height,12rem)-2.5rem)] w-full flex items-center justify-center flex-col gap-8 sm:gap-10 px-4 relative z-10">
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

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function toSafeProto(value: string | null): "http" | "https" {
  return value === "http" ? "http" : "https";
}

function toSafeHost(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
  if (!normalized) return null;
  return /^[a-zA-Z0-9.-]+(?::\d+)?$/.test(normalized) ? normalized : null;
}

async function UniversityContent({
  name,
  lang = 'en',
  apiOrigin,
}: {
  name: string;
  lang?: Language;
  apiOrigin?: string;
}) {
  const decodedName = decodeURIComponent(name);
  const basicInfo = await fetchUniversityByName(decodedName, apiOrigin);
  
  if (!basicInfo) {
    const copy = getNotFoundCopy(lang);
    const searchHref = `/search?lang=${lang}`;

    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-[calc(var(--search-header-height,12rem)+2rem)] sm:pt-[calc(var(--search-header-height,12rem)+2.5rem)] pb-16 sm:pb-24 lg:pb-28 relative z-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-neutral-50/70 p-8 sm:p-12 lg:p-16 text-center shadow-sm">
          <div className="mx-auto mb-6 sm:mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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
            className="mt-10 inline-flex items-center justify-center rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
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
    <UniversityDetailView 
      basicInfo={basicInfo}
      aiDetails={aiDetails as unknown as AIResearchData}
      domain={domain}
      logoSrc={logoSrc}
      fallbackSrc={fallbackSrc}
      lang={lang}
      youtubeVideos={youtubeVideos}
    />
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
  const headerStore = await headers();
  const forwardedHost = toSafeHost(firstForwardedValue(headerStore.get("x-forwarded-host")));
  const host = forwardedHost || toSafeHost(firstForwardedValue(headerStore.get("host")));
  const proto = toSafeProto(firstForwardedValue(headerStore.get("x-forwarded-proto")));
  const apiOrigin = host ? `${proto}://${host}` : undefined;
  const lang = coerceLanguage(sParams.lang || cookieStore.get('soso_lang')?.value);
  
  return (
    <main className="min-h-screen bg-white">
      <SearchHeader />
      <Suspense fallback={<LoadingState />}>
        <UniversityContent name={name} lang={lang} apiOrigin={apiOrigin} />
      </Suspense>
    </main>
  );
}
