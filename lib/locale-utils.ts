import type { Locale } from "./i18n";

/** BCP 47 tags for Intl APIs */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-GB",
  ar: "ar-SA",
  hi: "hi-IN",
  es: "es-ES",
  fr: "fr-FR",
  pt: "pt-BR",
};

/**
 * Format a number using locale-appropriate digits.
 * Arabic → Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩).
 */
export function formatNumber(n: number, locale: Locale): string {
  const bcp = LOCALE_BCP47[locale];
  const opts: Intl.NumberFormatOptions =
    locale === "ar" ? { numberingSystem: "arab" } : {};
  return new Intl.NumberFormat(bcp, opts).format(n);
}

/**
 * Convert Western digit characters in a string to locale digits.
 * Use for dates, stats, counts — NOT for match scores.
 */
export function localizeDigits(str: string, locale: Locale): string {
  if (locale === "ar") {
    return str.replace(/\d/g, (d) => String.fromCharCode(0x0660 + parseInt(d)));
  }
  return str;
}

/**
 * Locale-aware date formatting.
 * Replaces all hardcoded toLocaleDateString("en-GB", ...) calls.
 */
export function formatDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  },
): string {
  const bcp = LOCALE_BCP47[locale];
  const opts: Intl.DateTimeFormatOptions =
    locale === "ar" ? { ...options, numberingSystem: "arab" } : options;
  return new Intl.DateTimeFormat(bcp, opts).format(date);
}

/**
 * Locale-aware time formatting.
 * Replaces all hardcoded toLocaleTimeString("en-GB", ...) calls.
 */
export function formatTime(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const bcp = LOCALE_BCP47[locale];
  const opts: Intl.DateTimeFormatOptions =
    locale === "ar" ? { ...options, numberingSystem: "arab" } : options;
  return new Intl.DateTimeFormat(bcp, opts).format(date);
}

/** Locale-aware short day abbreviation (replaces hardcoded DAY_ABBR). */
export function dayAbbr(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_BCP47[locale], {
    weekday: "short",
  })
    .format(date)
    .toUpperCase();
}

/** Locale-aware short month abbreviation (replaces hardcoded MONTH_ABBR). */
export function monthAbbr(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_BCP47[locale], {
    month: "short",
  }).format(date);
}

/** Month + year label for calendar headers. */
export function monthYearLabel(date: Date, locale: Locale): string {
  const bcp = LOCALE_BCP47[locale];
  const opts: Intl.DateTimeFormatOptions =
    locale === "ar"
      ? { month: "short", year: "numeric", numberingSystem: "arab" }
      : { month: "short", year: "numeric" };
  return new Intl.DateTimeFormat(bcp, opts).format(date);
}
