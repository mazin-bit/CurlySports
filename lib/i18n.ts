export type Locale = "en" | "ar" | "hi" | "es" | "fr" | "pt";

export interface LocaleConfig {
  code: Locale;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: LocaleConfig[] = [
  { code: "en", label: "English",    nativeLabel: "English",    dir: "ltr" },
  { code: "ar", label: "Arabic",     nativeLabel: "العربية",    dir: "rtl" },
  { code: "hi", label: "Hindi",      nativeLabel: "हिन्दी",      dir: "ltr" },
  { code: "es", label: "Spanish",    nativeLabel: "Español",    dir: "ltr" },
  { code: "fr", label: "French",     nativeLabel: "Français",   dir: "ltr" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português",  dir: "ltr" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: Locale[] = ["ar"];

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
