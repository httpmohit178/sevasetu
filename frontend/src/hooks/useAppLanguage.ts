import { useCallback, useEffect, useState } from 'react';

export type AppLanguage = 'en' | 'hi';
const STORAGE_KEY = 'sevasetu-language';
const LANGUAGE_EVENT = 'sevasetu-language-change';

function readLanguage(): AppLanguage {
  return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en';
}

export function useAppLanguage(): [AppLanguage, (language: AppLanguage | ((current: AppLanguage) => AppLanguage)) => void] {
  const [language, setLanguageState] = useState<AppLanguage>(readLanguage);

  useEffect(() => {
    const sync = () => setLanguageState(readLanguage());
    window.addEventListener(LANGUAGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LANGUAGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setLanguage = useCallback((next: AppLanguage | ((current: AppLanguage) => AppLanguage)) => {
    setLanguageState((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      window.localStorage.setItem(STORAGE_KEY, value);
      window.dispatchEvent(new Event(LANGUAGE_EVENT));
      return value;
    });
  }, []);

  return [language, setLanguage];
}
