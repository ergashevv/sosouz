'use client';

import { motion } from 'framer-motion';
import { Globe, MapPin, ExternalLink, GraduationCap, DollarSign, Award, ClipboardList, Info, Sparkles, ArrowLeft, Shield, Zap, Search } from 'lucide-react';
import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import { University } from '@/lib/api';

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
  return (
    <div className="pb-64 relative z-10 bg-white">
      {/* Hero Section */}
      <div className="relative pt-64 pb-32 border-b border-black bg-neutral-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
           <Link href="/search" className="btn-secondary inline-flex mb-20 !py-4 !px-8 hover:bg-black hover:text-white transition-all">
              <ArrowLeft size={16} /> BACK TO SEARCH
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
                   <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wide">University Profile</div>
                   <div className="text-xs font-semibold text-neutral-500 flex items-center gap-2">
                      <Shield size={14} className="text-blue-500" /> Verified Data
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
                <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Executive Summary</h2>
             </div>
             <div className="p-8 rounded-2xl border border-neutral-200 bg-white shadow-sm group">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">University Overview</div>
                <p className="text-xl text-neutral-700 leading-relaxed font-medium transition-colors">
                   {aiDetails?.detailed_overview || "Gathering university data..."}
                </p>
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="p-8 rounded-2xl border border-neutral-200 space-y-6 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <DollarSign size={80} className="text-blue-600" />
                </div>
                 <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Tuition Fees</span>
                   <p className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                     {aiDetails?.tuition_fees || "Not specified"}
                   </p>
                </div>
             </div>

             <div className="p-8 rounded-2xl border border-neutral-200 space-y-6 bg-white relative overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                <div className="absolute -top-4 -right-4 p-8 opacity-5">
                   <ClipboardList size={80} className="text-blue-600" />
                </div>
                <div className="flex flex-col gap-2 relative z-10">
                   <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Admission Deadline</span>
                   <p className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                     {aiDetails?.admission_deadline || "Varies by program"}
                   </p>
                </div>
             </div>
          </div>

          <section className="space-y-12">
             <div className="flex items-center gap-5 border-b border-black pb-8">
                <div className="w-12 h-12 bg-neutral-100 border border-black flex items-center justify-center text-black font-black">
                   <Award size={24} />
                </div>
                <h2 className="text-5xl font-black text-black tracking-tighter uppercase italic">Verified Funding Streams</h2>
             </div>
             <div className="grid grid-cols-1 gap-6">
                 {(aiDetails?.scholarships && aiDetails.scholarships.length > 0) ? (
                   aiDetails.scholarships.map((s, i) => (
                     <div key={i} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-12 group hover:bg-black transition-all border border-black/10">
                        <div className="space-y-4">
                           <div className="text-[9px] font-black text-neutral-300 group-hover:text-neutral-400 uppercase tracking-[0.4em]">Scholarship Opportunity</div>
                           <h4 className="text-3xl font-black text-black group-hover:text-white transition-colors uppercase tracking-tight italic underline decoration-neutral-100 group-hover:decoration-neutral-800">{s.name}</h4>
                        </div>
                        <a 
                         href={s.link} 
                         target="_blank" 
                         className="btn-secondary !border-current group-hover:bg-white group-hover:text-black !py-4 !px-10 font-black"
                        >
                          VISIT WEBSITE <ExternalLink size={16} className="ml-4" />
                        </a>
                     </div>
                   ))
                ) : (
                   <div className="p-32 text-center border-4 border-dotted border-neutral-100 bg-neutral-50">
                     <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.6em] italic">No active scholarships detected for this university.</p>
                   </div>
                )}
             </div>
          </section>
        </div>

        {/* Action Interface */}
        <div className="space-y-12">
           <div className="p-12 bg-black text-white space-y-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                 <GraduationCap size={120} />
              </div>
              <div className="space-y-12 relative z-10">
                 <div className="tag-pill bg-white text-black border-white inline-block">OFFICIAL SITE</div>
                 <h3 className="text-6xl font-black leading-[0.8] tracking-tighter uppercase italic">Visit <br/>Official <br/>Website.</h3>
                 <p className="text-neutral-400 font-bold text-lg leading-relaxed uppercase tracking-tight">
                   Visit the official university website for the most accurate and up-to-date admission information.
                 </p>
              </div>
              <div className="space-y-4 relative z-10">
                 {basicInfo.web_pages?.map((url, i) => (
                   <a 
                     key={i} 
                     href={url} 
                     target="_blank"
                     className="btn-primary w-full bg-white text-black hover:bg-neutral-100 !py-8 text-[14px] font-black border-none"
                   >
                      VISIT UNIVERSITY SITE <ExternalLink size={20} className="ml-4" />
                   </a>
                 ))}
              </div>
              <div className="p-8 bg-neutral-900 border-l-8 border-neutral-700 flex gap-6 items-start relative z-10">
                 <Info size={24} className="text-neutral-400 shrink-0" />
                 <p className="text-[10px] text-neutral-500 font-black leading-relaxed uppercase tracking-[0.3em] italic">
                    Note: While we strive for accuracy, please verify all specific program details and deadlines on the official university website.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
