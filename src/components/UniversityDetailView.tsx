'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin, ExternalLink, GraduationCap, DollarSign, Award, ClipboardList, Info, Sparkles, ArrowLeft, Shield, Zap, Search } from 'lucide-react';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import { University } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export interface AIResearchData {
  tuition_fees?: string | null;
  scholarships?: { name: string; link: string }[] | null;
  admission_requirements?: Record<string, string | number | boolean> | null;
  admission_deadline?: string | null;
  detailed_overview?: string | null;
}

export interface UniversityDetailsProps {
  basicInfo: University;
  aiDetails: AIResearchData | null;
  domain: string;
  logoSrc: string;
  fallbackSrc: string;
}

export default function UniversityDetailView({ basicInfo, aiDetails, domain, logoSrc, fallbackSrc }: UniversityDetailsProps) {
  const { t } = useLanguage();
  return (
    <div className="pb-64 relative z-10 bg-white">
      {/* Hero Section */}
      <div className="relative pt-64 pb-32 border-b border-black bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <Link href="/search" className="inline-flex items-center gap-2 mb-20 px-6 py-3 rounded-full border border-neutral-200 bg-white text-sm font-bold shadow-sm hover:shadow-md hover:bg-neutral-50 transition-all">
              <ArrowLeft size={16} /> {t('uni.back')}
           </Link>
           
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-12 text-center lg:text-left">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="w-48 h-48 bg-white border border-neutral-200 rounded-2xl flex items-center justify-center p-6 flex-shrink-0 shadow-sm transition-transform"
              >
                 <SmartImage 
                   src={logoSrc} 
                   fallback={fallbackSrc}
                   alt={basicInfo.name} 
                   className="w-full h-full object-scale-down"
                 />
              </motion.div>
              <div className="space-y-6 flex-1">
                <div className="flex items-center justify-center lg:justify-start gap-4">
                   <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide">{t('uni.profile')}</div>
                   <div className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
                      <Shield size={14} className="text-blue-500" /> {t('uni.verified')}
                   </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.1] max-w-4xl">
                   {basicInfo.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8">
                   <div className="flex items-center gap-2 text-neutral-600 font-semibold text-sm">
                      <MapPin size={16} className="text-neutral-400" /> {basicInfo.country}
                   </div>
                   <div className="flex items-center gap-2 text-neutral-600 font-semibold text-sm">
                      <Globe size={16} className="text-neutral-400" /> {domain}
                   </div>
                   <div className="px-4 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-bold text-neutral-500 uppercase">
                      {basicInfo.alpha_two_code}
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 lg:grid-cols-3 gap-24">
        {/* Content Data */}
        <div className="lg:col-span-2 space-y-32">
          <section className="space-y-8">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                   <Search size={20} />
                </div>
                <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{t('uni.summary')}</h2>
             </div>
             <div className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm group">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">{t('uni.overview')}</div>
                <p className="text-xl text-neutral-700 leading-relaxed font-medium transition-colors">
                   {aiDetails?.detailed_overview || "..."}
                </p>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 rounded-2xl border border-neutral-200 space-y-6 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <DollarSign size={80} className="text-blue-600" />
                </div>
                 <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('uni.tuition')}</span>
                   <p className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                     {aiDetails?.tuition_fees || t('uni.not_specified')}
                   </p>
                </div>
             </div>

             <div className="p-8 rounded-2xl border border-neutral-200 space-y-6 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <ClipboardList size={80} className="text-blue-600" />
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{t('uni.deadline')}</span>
                   <p className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                     {aiDetails?.admission_deadline || t('uni.varies')}
                   </p>
                </div>
             </div>
          </div>

          <section className="space-y-12">
             <div className="flex items-center gap-4 border-b border-neutral-100 pb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <Award size={20} />
                </div>
                <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">{t('uni.scholarships')}</h2>
             </div>
             <div className="grid grid-cols-1 gap-6">
                  {(aiDetails?.scholarships && aiDetails.scholarships.length > 0) ? (
                    aiDetails.scholarships.map((s, i) => (
                      <div key={i} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 rounded-3xl border border-neutral-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all">
                         <div className="space-y-3">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Scholarship Opportunity</div>
                            <h4 className="text-xl font-bold text-neutral-900 tracking-tight">{s.name}</h4>
                         </div>
                         <a 
                          href={s.link} 
                          target="_blank" 
                          className="px-6 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-bold hover:bg-black transition-colors flex items-center justify-center"
                         >
                           {t('uni.visit')} <ExternalLink size={14} className="ml-2" />
                         </a>
                      </div>
                    ))
                 ) : (
                    <div className="p-20 text-center rounded-3xl border-2 border-dashed border-neutral-100 bg-neutral-50">
                       <p className="text-sm font-medium text-neutral-400">No active scholarships detected for this university.</p>
                    </div>
                 )}
             </div>
          </section>
        </div>

        {/* Action Interface */}
        <div className="space-y-12">
           <div className="p-10 rounded-[40px] bg-neutral-900 text-white space-y-12 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                 <GraduationCap size={120} />
              </div>
              <div className="space-y-8 relative z-10">
                 <div className="px-4 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold inline-block border border-white/20 uppercase tracking-widest">{t('uni.website')}</div>
                 <h3 className="text-4xl font-extrabold leading-tight tracking-tight">{t('uni.visit')}</h3>
                 <p className="text-neutral-400 font-medium text-sm leading-relaxed">
                   Visit the official university website for the most accurate and up-to-date admission information.
                 </p>
              </div>
              <div className="space-y-3 relative z-10">
                 {basicInfo.web_pages?.map((url, i) => (
                   <a 
                     key={i} 
                     href={url} 
                     target="_blank"
                     className="w-full flex items-center justify-center gap-3 bg-white text-neutral-900 hover:bg-neutral-100 py-4 rounded-2xl text-sm font-bold transition-all shadow-lg"
                   >
                      {t('uni.visit')} <ExternalLink size={16} />
                   </a>
                 ))}
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex gap-4 items-start relative z-10">
                 <Info size={18} className="text-neutral-400 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Note: While we strive for accuracy, please verify all specific program details and deadlines on the official university website.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
