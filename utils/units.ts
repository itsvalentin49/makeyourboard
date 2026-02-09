export function mmToIn(mm: number) {
  return mm / 25.4;
}

export function formatWeight(g: number, units: "metric" | "imperial") {
  if (units === "metric") {
    return g >= 1000
      ? `${(g / 1000).toFixed(1)} kg`
      : `${g} g`;
  }

  const oz = g / 28.3495;
  return oz < 32
    ? `${oz.toFixed(1)} oz`
    : `${(oz / 16).toFixed(1)} lb`;
}
