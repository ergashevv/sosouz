'use client';

import { University, getLogoUrl, getFallbackLogoUrl } from '@/lib/api';
import { motion } from 'framer-motion';
import { MapPin, Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import SmartImage from './SmartImage';
import { useLanguage } from '@/contexts/LanguageContext';

interface UniversityCardProps {
  university: University;
  index: number;
}

export default function UniversityCard({ university, index }: UniversityCardProps) {
  const { t, language } = useLanguage();
  const domain = university.domains?.[0] || 'unknown';
  const logoSrc = getLogoUrl(domain);
  const fallbackSrc = getFallbackLogoUrl(domain);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.6 }}
      className="group"
    >
      <Link href={`/university/${encodeURIComponent(university.name)}?lang=${language}`}>
        <div className="university-card-hover relative min-h-[320px] sm:min-h-[380px] lg:min-h-[420px] flex flex-col justify-between rounded-none border border-neutral-200 bg-white p-5 sm:p-8 lg:p-10">
           <div className="space-y-6 sm:space-y-8 lg:space-y-9">
              <div className="flex items-start justify-between">
                 <div className="w-14 h-14 sm:w-16 sm:h-16 bg-neutral-50 border border-neutral-200 flex items-center justify-center p-2.5 sm:p-3 transition-all group-hover:bg-neutral-50 group-hover:border-neutral-300">
                    <SmartImage 
                      src={logoSrc} 
                      fallback={fallbackSrc}
                      alt={university.name} 
                      className="w-full h-full object-contain"
                    />
                 </div>
                 <div className="flex flex-col items-end shrink-0">
                    <div className="px-3 py-1 bg-neutral-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-none">
                       {t('uni.verified_tag')}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-2">{university.alpha_two_code}</span>
                 </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-black leading-tight sm:leading-none tracking-tighter uppercase wrap-break-word">
                 {university.name}
              </h2>
           </div>

           <div className="space-y-6 sm:space-y-8">
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-neutral-600 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin size={12} className="text-neutral-400 shrink-0" /> <span className="truncate">{university.country}</span>
                 </div>
                 <div className="flex items-center gap-3 text-neutral-600 font-bold text-[10px] uppercase tracking-widest">
                    <Globe size={12} className="text-neutral-400 shrink-0" /> <span className="truncate">{domain}</span>
                 </div>
              </div>
              
              <div className="pt-6 sm:pt-8 border-t border-neutral-200 flex items-center justify-between transition-colors group-hover:border-neutral-300">
                 <span className="text-xs font-bold text-neutral-700">{t('uni.view')}</span>
                 <ArrowRight size={20} className="text-neutral-500 group-hover:text-neutral-900 group-hover:translate-x-1.5 transition-all" />
              </div>
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
