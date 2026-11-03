import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { ku } from './locales/ku';
import { tr } from './locales/tr';
import { LanguageCode, TextDirection } from '../types';

type TranslationsType = typeof en;

const translations: Record<LanguageCode, TranslationsType> = {
  en,
  ar,
  ku,
  tr,
};

export const LANGUAGE_OPTIONS: { code: LanguageCode; name: string; nativeName: string; dir: TextDirection }[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ku', name: 'Kurdish (Sorani)', nativeName: 'کوردی (سۆرانی)', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
];

interface LanguageContextType {
  language: LanguageCode;
  direction: TextDirection;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (dateString: string) => string;
  formatRelativeTime: (dateString: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('findora_language') as LanguageCode;
    if (saved && ['en', 'ar', 'ku', 'tr'].includes(saved)) {
      return saved;
    }
    // Check browser language
    const browserLang = navigator.language.slice(0, 2);
    if (browserLang === 'ar') return 'ar';
    if (browserLang === 'ku') return 'ku';
    if (browserLang === 'tr') return 'tr';
    return 'en';
  });

  const direction: TextDirection = language === 'ar' || language === 'ku' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem('findora_language', language);
    document.documentElement.lang = language === 'ku' ? 'ckb' : language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback: any = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    if (params) {
      return Object.entries(params).reduce((str, [k, val]) => {
        return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
      }, current);
    }

    return current;
  };

  const getLocaleTag = (lang: LanguageCode) => {
    switch (lang) {
      case 'ar':
        return 'ar-EG';
      case 'ku':
        return 'ckb-IQ';
      case 'tr':
        return 'tr-TR';
      case 'en':
      default:
        return 'en-US';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat(getLocaleTag(language), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return language === 'ar' ? 'الآن' : language === 'ku' ? 'ئێستا' : language === 'tr' ? 'Az önce' : 'Just now';
      if (diffMin < 60) return `${diffMin} ${language === 'ar' ? 'دقيقة' : language === 'ku' ? 'خولەک' : language === 'tr' ? 'dk önce' : 'm ago'}`;
      if (diffHour < 24) return `${diffHour} ${language === 'ar' ? 'ساعة' : language === 'ku' ? 'کاتژمێر' : language === 'tr' ? 'saat önce' : 'h ago'}`;
      if (diffDay < 7) return `${diffDay} ${language === 'ar' ? 'يوم' : language === 'ku' ? 'ڕۆژ' : language === 'tr' ? 'gün önce' : 'd ago'}`;
      return formatDate(dateString);
    } catch {
      return dateString;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t, formatDate, formatRelativeTime }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
