import { Suspense } from 'react';
import { fetchUniversityByName, getLogoUrl, getFallbackLogoUrl } from '@/lib/api';
import { performResearch } from '@/lib/research';
import { GraduationCap, Shield } from 'lucide-react';
import Link from 'next/link';
import SearchHeader from '@/components/SearchHeader';
import UniversityDetailView, { AIResearchData } from '@/components/UniversityDetailView';

interface UniversityPageProps {
  params: Promise<{ name: string }>;
}

function LoadingState() {
  return (
    <div className="h-[80vh] w-full flex items-center justify-center flex-col gap-10 relative z-10 bg-white">
       <div className="relative">
         <div className="w-24 h-24 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
         <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap size={32} className="text-primary" />
         </div>
       </div>
       <div className="text-center space-y-3 mt-4">
         <p className="text-xl font-bold text-neutral-800 tracking-tight">Gathering university details...</p>
         <div className="text-sm text-neutral-500 animate-pulse font-medium">
           Loading tuition, admission, and scholarship data
         </div>
       </div>
    </div>
  );
}

async function UniversityContent({ name }: { name: string }) {
  const decodedName = decodeURIComponent(name);
  const basicInfo = await fetchUniversityByName(decodedName);
  
  if (!basicInfo) {
    return (
      <div className="max-w-4xl mx-auto my-40 p-16 clean-card text-center relative z-10 border-border-light shadow-2xl shadow-black/5">
         <h2 className="text-3xl font-bold text-neutral-900 mb-6 tracking-tight">University Not Found</h2>
         <p className="text-neutral-500 font-medium text-lg">We couldn&apos;t find an institution matching &quot;{decodedName}&quot; in our database.</p>
         <Link href="/search" className="btn-primary mt-12 inline-flex items-center rounded-full bg-blue-600 text-white px-8 py-3">Return to Search</Link>
      </div>
    );
  }

  const domain = (basicInfo.domains && basicInfo.domains.length > 0) ? basicInfo.domains[0] : (basicInfo.web_pages && basicInfo.web_pages[0] ? new URL(basicInfo.web_pages[0]).hostname : 'unknown');
  const aiDetails = await performResearch(decodedName, basicInfo.country, domain);
  const logoSrc = getLogoUrl(domain);
  const fallbackSrc = getFallbackLogoUrl(domain);

  return (
    <UniversityDetailView 
      basicInfo={basicInfo}
      aiDetails={aiDetails as unknown as AIResearchData}
      domain={domain}
      logoSrc={logoSrc}
      fallbackSrc={fallbackSrc}
    />
  );
}

export default async function UniversityDetail({ params }: UniversityPageProps) {
  const { name } = await params;
  
  return (
    <main className="min-h-screen bg-white">
      <SearchHeader />
      <Suspense fallback={<LoadingState />}>
        <UniversityContent name={name} />
      </Suspense>
    </main>
  );
}
