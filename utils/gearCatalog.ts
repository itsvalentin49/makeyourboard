import type { AnyRow } from "@/types/project";
import { splitTags } from "@/components/sidebar/SpecsPedals";

export const gearKinds = ["pedals", "boards", "power"] as const;
export type GearKind = (typeof gearKinds)[number];
export type GearCategory = GearKind | "all";
export type GearEntry = { kind: GearKind; item: AnyRow; brand: string; tags: string[]; searchText: string };

export function normalizeGear(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function gearEntries(
  libraries: Record<GearKind, AnyRow[]>,
  t: (key: string) => string,
): GearEntry[] {
  return gearKinds.flatMap((kind) => libraries[kind].flatMap((item) => {
    const tags = kind === "pedals" ? splitTags(item.type) : [];
    if (tags.some((tag) => ["power", "power supply"].includes(tag.toLowerCase()))) return [];
    const brand = String(item.brand ?? "").trim();
    const searchText = normalizeGear([
      brand,
      item.name,
      item.type,
      ...tags.map((tag) => t(`pedal.type.${tag}`)),
    ].join(" "));
    return [{ kind, item, brand, tags, searchText }];
  }));
}

export function gearKey({ kind, item }: GearEntry) {
  return `${kind}-${item.id}`;
}

export function compareGearRelease(a: GearEntry, b: GearEntry) {
  const date = (value: unknown) => {
    const text = String(value ?? "");
    return /^\d{4}(?:-\d{2}-\d{2})?$/.test(text) ? text : "";
  };
  return date(b.item.year).localeCompare(date(a.item.year));
}


export function gearSearchScore(entry: GearEntry, query: string): number {
  const term = normalizeGear(query).trim();
  if (!term) return 0;

  const brand = normalizeGear(entry.brand);
  const name = normalizeGear(String(entry.item.name ?? ""));

  if (brand === term) return 1000;
  if (brand.startsWith(term)) return 900;
  if (name === term) return 800;
  if (name.startsWith(term)) return 700;
  if (brand.includes(term)) return 600;
  if (name.includes(term)) return 500;
  if (entry.searchText.includes(term)) return 100;

  return 0;
}



