import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";
import it from "@/messages/it.json";
import pt from "@/messages/pt.json";
import zh from "@/messages/zh.json";

export type Language = "en" | "fr" | "es" | "de" | "it" | "pt" | "zh";

const DICTS: Record<Language, any> = {
  en,
  fr,
  es,
  de,
  it,
  pt,
  zh,
};

export function getTranslator(lang: Language) {
  const dict = DICTS[lang] || DICTS.en;

  return function t(key: string): string {
    const parts = key.split(".");
    let value: any = dict;

    for (const part of parts) {
      value = value?.[part];

      if (value === undefined) {
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };
}