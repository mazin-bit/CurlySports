"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, isRtl } from "@/lib/i18n";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import hi from "@/messages/hi.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import pt from "@/messages/pt.json";

const MESSAGES: Record<Locale, Record<string, unknown>> = { en, ar, hi, es, fr, pt };

const LS_KEY = "curly-lang";

function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  dir: "ltr" | "rtl";
  rtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
  dir: "ltr",
  rtl: false,
});

function applyDir(l: Locale) {
  document.documentElement.lang = l;
  document.documentElement.dir = isRtl(l) ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as Locale | null;
    if (saved && LOCALES.find((l) => l.code === saved)) {
      setLocaleState(saved);
      applyDir(saved);
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LS_KEY, l);
    applyDir(l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string =>
      resolve(MESSAGES[locale], key)
      ?? resolve(MESSAGES.en, key)
      ?? fallback
      ?? key,
    [locale],
  );

  const rtl = isRtl(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, dir: rtl ? "rtl" : "ltr", rtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
