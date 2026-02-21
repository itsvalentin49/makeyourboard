import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import es from "@/messages/es.json";
import de from "@/messages/de.json";
import it from "@/messages/it.json";
import pt from "@/messages/pt.json";

export type Language = "en" | "fr" | "es" | "de" | "it" | "pt";

type DictValue = string | { [key: string]: DictValue };

const DICTS: Record<Language, DictValue> = {
  en,
  fr,
  es,
  de,
  it,
  pt,
};

export function getTranslator(lang: Language) {
  const dict = DICTS[lang] ?? DICTS.en;

  return function t(key: string): string {
    const parts = key.split(".");
    let value: DictValue | undefined = dict;

    for (const part of parts) {
      if (typeof value !== "object" || value === null) {
        return key;
      }
      value = value[part];
      if (value === undefined) return key;
    }

    return typeof value === "string" ? value : key;
  };
}
