"use client";

import React, { useMemo } from "react";
import { Search, X } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
  pedalsLibrary: AnyRow[];
  pedalSearch: string;
  setPedalSearch: (v: string) => void;
  showPedalResults: boolean;
  setShowPedalResults: (v: boolean) => void;
  setShowBoardResults: (v: boolean) => void;
  addPedal: (p: AnyRow) => void;
  pedalInputRef: React.RefObject<HTMLInputElement | null>;
  t: (key: string) => string;
  groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

function parseReleaseDate(value: any): Date | null {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function isNewPedal(value: any): boolean {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 40);

  releaseDate.setHours(0, 0, 0, 0);

  return releaseDate >= limitDate && releaseDate <= today;
}

export default function SearchPedals({
  pedalsLibrary,
  pedalSearch,
  setPedalSearch,
  setShowPedalResults,
  setShowBoardResults,
  addPedal,
  pedalInputRef,
  t,
}: Props) {
  const search = pedalSearch.trim().toLowerCase();
  const isSearching = search.length > 0;

  const visiblePedals = useMemo(() => {
    if (!isSearching) {
      return pedalsLibrary
        .filter((p) => isNewPedal(p.year))
        .sort((a, b) => {
          const dateA = parseReleaseDate(a.year)?.getTime() || 0;
          const dateB = parseReleaseDate(b.year)?.getTime() || 0;
          return dateB - dateA;
        });
    }

    const terms = search.split(" ").filter(Boolean);

    return pedalsLibrary
      .filter((p) => {
        const haystack = `${p.brand ?? ""} ${p.name ?? ""} ${p.type ?? ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => {
        const brandA = String(a.brand || "").localeCompare(String(b.brand || ""));
        if (brandA !== 0) return brandA;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [pedalsLibrary, search, isSearching]);

  return (
    <div className="flex flex-col gap-4 mt-1 h-full min-h-0">

      <div className="relative flex items-center shrink-0">
        <Search
          size={15}
          strokeWidth={2.5}
          className="absolute left-4 text-[#6f6a5d]"
        />

<input
  ref={pedalInputRef}
  type="text"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  placeholder={t("pedalsMenu.searchPlaceholder")}
  className="
    w-full h-[30px]
    bg-white !text-black placeholder:!text-zinc-500
    rounded-md
    pl-12 pr-11
    text-[12px] font-bold
    outline-none
  "
  value={pedalSearch}
  onClick={(e) => {
    e.stopPropagation();
    setShowBoardResults(false);
    setShowPedalResults(true);
  }}
  onChange={(e) => {
    setPedalSearch(e.target.value);
    setShowPedalResults(true);
  }}
/>

        {pedalSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPedalSearch("");
              pedalInputRef.current?.focus();
            }}
            className="
              absolute right-4
              flex items-center justify-center
              text-[#6f6a5d]
              hover:opacity-70
              transition-opacity
            "
          >
            <X size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden">
<div className="px-1 shrink-0">
  <div className="text-[11px] font-black uppercase tracking-wide text-zinc-300">
    {isSearching
      ? t("pedalsMenu.results").replace("{count}", String(visiblePedals.length))
      : t("pedalsMenu.count").replace("{count}", String(pedalsLibrary.length))}
  </div>

  {!isSearching && (
    <div className="mt-1 text-[10px] font-bold text-zinc-500">
      {t("pedalsMenu.latest")}
    </div>
  )}
</div>

        <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar pb-6 min-h-0">
          {visiblePedals.length > 0 ? (
            visiblePedals.map((p) => {
              const originalImg = p.image || p.image_url || p.photo;
              const img = p.thumbnail || null;
              const isNew = isNewPedal(p.year);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPedalSearch("");
                    addPedal(p);
                    setShowPedalResults(false);
                  }}
                  className="
                    w-full min-h-[50px]
                    rounded-xl
                    bg-zinc-950 hover:bg-canvas
                    px-3 py-1.5
                    flex items-center gap-3
                    text-left
                    transition-colors
                    shrink-0
                  "
                >
                    <div className="w-[40px] h-[34px] shrink-0 flex items-center justify-center">                    {img ? (
                      <img
  src={img}
  alt={`${p.brand || ""} ${p.name || ""}`}
  loading="lazy"
  decoding="async"
  className="max-w-full max-h-full object-contain"
/>
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-zinc-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[12px] font-black leading-tight">
                        {p.name}
                      </span>


                    </div>

<div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
  <span>{p.brand}</span>

  {isNew && (
    <span className="text-[8px] font-black uppercase tracking-wider text-green-500">
      {t("pedalsMenu.new")}
    </span>
  )}
</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-zinc-800 px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              {t("search.noResults")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}