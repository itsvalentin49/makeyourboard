import type { Language } from "@/utils/i18n";

export function mmToIn(mm: number) {
  return mm / 25.4;
}

const LOCALE_MAP: Record<Language, string> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
};

function formatNumber(
  value: number,
  lang: Language,
  decimals: number
) {
  const locale = LOCALE_MAP[lang] ?? "en-US";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatWeight(
  g: number,
  units: "metric" | "imperial",
  lang: Language
) {
  if (units === "metric") {
    if (g >= 1000) {
      return `${formatNumber(g / 1000, lang, 2)} kg`;
    }
    return `${formatNumber(g, lang, 0)} g`;
  }

  const oz = g / 28.3495;

  if (oz < 32) {
    return `${formatNumber(oz, lang, 1)} oz`;
  }

  return `${formatNumber(oz / 16, lang, 1)} lb`;
}