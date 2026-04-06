'use client';

import { University, getLogoUrl, getFallbackLogoUrl } from '@/lib/api';
import { motion } from 'framer-motion';
import { MapPin, Globe, ArrowRight, Shield } from 'lucide-react';
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
        <div className="clean-card relative h-[420px] flex flex-col justify-between p-12 hover:bg-neutral-50 border-black/10 transition-all duration-300">
           <div className="space-y-10">
              <div className="flex items-start justify-between">
                 <div className="w-16 h-16 bg-white border border-neutral-100 flex items-center justify-center p-3 transition-all">
                    <SmartImage 
                      src={logoSrc} 
                      fallback={fallbackSrc}
                      alt={university.name} 
                      className="w-full h-full object-contain"
                    />
                 </div>
                 <div className="flex flex-col items-end">
                    <div className="px-3 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                       {t('uni.verified_tag')}
                    </div>
                    <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest mt-2">{university.alpha_two_code}</span>
                 </div>
              </div>

              <h2 className="text-3xl font-black text-black leading-none tracking-tighter uppercase group-hover:underline underline-offset-8 decoration-neutral-200">
                 {university.name}
              </h2>
           </div>

           <div className="space-y-8">
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-neutral-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-black transition-colors">
                    <MapPin size={12} className="text-neutral-200 group-hover:text-black" /> {university.country}
                 </div>
                 <div className="flex items-center gap-3 text-neutral-400 font-bold text-[10px] uppercase tracking-widest group-hover:text-black transition-colors">
                    <Globe size={12} className="text-neutral-200 group-hover:text-black" /> {domain}
                 </div>
              </div>
              
              <div className="pt-8 border-t border-black/5 flex items-center justify-between group-hover:border-black transition-colors">
                 <span className="text-xs font-bold text-neutral-400 group-hover:text-black transition-colors">{t('uni.view')}</span>
                 <ArrowRight size={20} className="text-neutral-200 group-hover:text-black group-hover:translate-x-3 transition-all" />
              </div>
           </div>
        </div>
      </Link>
    </motion.div>
  );
}
