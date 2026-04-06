'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Determine initial language from cookie or localStorage
    const getInitialLang = (): Language => {
      const match = document.cookie.match(new RegExp('(^| )soso_lang=([^;]+)'));
      if (match && (match[2] === 'uz' || match[2] === 'ru' || match[2] === 'en')) return match[2] as Language;
      
      const saved = localStorage.getItem('soso_lang');
      if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved as Language;
      
      return 'en';
    };

    setLanguage(getInitialLang());
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('soso_lang', lang);
    // Set cookie for server components (expires in 1 year)
    document.cookie = `soso_lang=${lang}; path=/; max-age=31536000`;
    // Force a router refresh to sync server components if needed
    window.location.reload(); 
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
