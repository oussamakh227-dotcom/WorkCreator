import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const language = i18n.language || 'en';
    setIsRTL(language === 'ar');
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return {
    language: i18n.language || 'en',
    isRTL,
    t,
    changeLanguage,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'ar', name: 'العربية' },
      { code: 'fr', name: 'Français' },
    ],
  };
}
