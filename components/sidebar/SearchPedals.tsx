"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";

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
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return new Date(year, month - 1, day);
  }

  return null;
}

function isNewPedal(value: any): boolean {
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 30);

  releaseDate.setHours(0, 0, 0, 0);

  return releaseDate >= limitDate && releaseDate <= today;
}

export default function SearchPedals({
  pedalsLibrary,
  pedalSearch,
  setPedalSearch,
  showPedalResults,
  setShowPedalResults,
  setShowBoardResults,
  addPedal,
  pedalInputRef,
  t,
  groupItems,
}: Props) {
  const prevOpen = useRef(false);

  useEffect(() => {
    if (showPedalResults && !prevOpen.current) {
      setPedalSearch("");
      pedalInputRef.current?.focus();
    }

    prevOpen.current = showPedalResults;
  }, [showPedalResults, setPedalSearch, pedalInputRef]);

  const groupedPedals = useMemo(() => {
    return groupItems(pedalsLibrary, pedalSearch);
  }, [pedalsLibrary, pedalSearch, groupItems]);

  const newPedals = useMemo(() => {
    const search = pedalSearch.trim().toLowerCase();

    return pedalsLibrary
      .filter((p) => isNewPedal(p.year))
      .filter((p) => {
        if (!search) return true;

        const brand = String(p.brand || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();

        return brand.includes(search) || name.includes(search);
      })
      .sort((a, b) => {
        const dateA = parseReleaseDate(a.year)?.getTime() || 0;
        const dateB = parseReleaseDate(b.year)?.getTime() || 0;

        return dateB - dateA;
      });
  }, [pedalsLibrary, pedalSearch]);

  const hasGroupedResults = Object.keys(groupedPedals).length > 0;
  const hasNewResults = newPedals.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("sidebar.addPedalTitle")}
        </span>
      </div>

      <div className="relative" style={{ zIndex: showPedalResults ? 60 : 10 }}>
        <div className="relative flex items-center">
          <input
            ref={pedalInputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={showPedalResults ? "" : `${t("sidebar.searchPedal")}...`}
            className={`w-full bg-zinc-950 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-white placeholder:text-zinc-500 outline-none transition-all ${
              showPedalResults ? "border-zinc-500" : "border-zinc-700"
            }`}
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

          <ChevronDown
            onClick={(e) => {
              e.stopPropagation();
              setShowBoardResults(false);
              setShowPedalResults(!showPedalResults);
            }}
            className={`absolute right-3 size-4 cursor-pointer transition-transform ${
              showPedalResults ? "rotate-180 text-zinc-400" : "text-zinc-500"
            }`}
          />
        </div>

        {showPedalResults && (
          <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
            {hasNewResults && (
              <div className="flex flex-col">
                <div className="px-4 h-10 flex items-center bg-zinc-950">
                  <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
                    {t("pedalsMenu.newReleases")}
                  </span>
                </div>

                {newPedals.map((p) => (
                  <button
                    key={`new-${p.id}`}
                    onClick={() => {
                      setPedalSearch("");
                      addPedal(p);
                      setShowPedalResults(false);
                    }}
                    className="w-full px-4 py-1 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                  >
                    <span className="font-semibold mr-2 text-zinc-400">
                      {p.brand}
                    </span>

                    {p.name}

                    <span className="ml-2 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                      {t("pedalsMenu.new")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {hasGroupedResults ? (
              Object.keys(groupedPedals).map((brand) => (
                <div key={brand} className="flex flex-col">
                  <div className="px-4 h-10 flex items-center bg-zinc-950">
                    <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
                      {brand}
                    </span>
                  </div>

                  {groupedPedals[brand].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPedalSearch("");
                        addPedal(p);
                        setShowPedalResults(false);
                      }}
                      className="w-full px-4 py-1 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                    >
                      <span className="font-semibold mr-2 text-zinc-400">
                        {brand}
                      </span>

                      {p.name}

                      {isNewPedal(p.year) && (
                        <span className="ml-2 text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                          {t("pedalsMenu.new")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            ) : !hasNewResults ? (
              <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">
                {t("search.noResults")}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}