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
  groupItems: (
    items: AnyRow[],
    filter: string
  ) => Record<string, AnyRow[]>;
};

function parseReleaseDate(value: any): Date | null {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}

function isNewPedal(value: any): boolean {
  const releaseDate = parseReleaseDate(value);

  if (!releaseDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 60);

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
        .filter((pedal) => isNewPedal(pedal.year))
        .sort((a, b) => {
          const dateA = parseReleaseDate(a.year)?.getTime() || 0;
          const dateB = parseReleaseDate(b.year)?.getTime() || 0;

          return dateB - dateA;
        });
    }

    const terms = search.split(" ").filter(Boolean);

    return pedalsLibrary
      .filter((pedal) => {
        const haystack = `
          ${pedal.brand ?? ""}
          ${pedal.name ?? ""}
          ${pedal.type ?? ""}
        `.toLowerCase();

        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => {
        const brandA = String(a.brand || "").toLowerCase();
        const brandB = String(b.brand || "").toLowerCase();

        const nameA = String(a.name || "").toLowerCase();
        const nameB = String(b.name || "").toLowerCase();

        const typeA = String(a.type || "").toLowerCase();
        const typeB = String(b.type || "").toLowerCase();

        function getSearchScore(
          brand: string,
          name: string,
          type: string
        ) {
          // 1. La marque correspond exactement
          if (brand === search) return 0;

          // 2. La marque commence par la recherche
          if (brand.startsWith(search)) return 1;

          // 3. La marque contient la recherche
          if (brand.includes(search)) return 2;

          // 4. Le nom correspond exactement
          if (name === search) return 3;

          // 5. Le nom commence par la recherche
          if (name.startsWith(search)) return 4;

          // 6. Le nom contient la recherche
          if (name.includes(search)) return 5;

          // 7. Le type correspond exactement
          if (type === search) return 6;

          // 8. Le type contient la recherche
          if (type.includes(search)) return 7;

          return 8;
        }

        const scoreA = getSearchScore(
          brandA,
          nameA,
          typeA
        );

        const scoreB = getSearchScore(
          brandB,
          nameB,
          typeB
        );

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        const brandComparison = brandA.localeCompare(
          brandB,
          undefined,
          {
            sensitivity: "base",
          }
        );

        if (brandComparison !== 0) {
          return brandComparison;
        }

        return nameA.localeCompare(
          nameB,
          undefined,
          {
            sensitivity: "base",
          }
        );
      });
  }, [pedalsLibrary, search, isSearching]);

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">
      {/* COMPTEUR AU-DESSUS DE LA BARRE DE RECHERCHE */}
      <div className="px-1 mb-2 shrink-0">
        <div className="text-[11px] font-black uppercase tracking-wide">
          {isSearching
            ? t("pedalsMenu.results").replace(
              "{count}",
              String(visiblePedals.length)
            )
            : t("pedalsMenu.count").replace(
              "{count}",
              String(pedalsLibrary.length)
            )}
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="relative flex items-center mb-4 shrink-0">
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
            w-full
            h-[30px]
            bg-white
            !text-black
            placeholder:!text-zinc-500
            rounded-md
            pl-12
            pr-11
            text-[12px]
            font-bold
            outline-none
          "
          value={pedalSearch}
          onClick={(event) => {
            event.stopPropagation();

            setShowBoardResults(false);
            setShowPedalResults(true);
          }}
          onChange={(event) => {
            setPedalSearch(event.target.value);
            setShowPedalResults(true);
          }}
        />

        {pedalSearch && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setPedalSearch("");
              pedalInputRef.current?.focus();
            }}
            className="
              absolute
              right-4
              flex
              items-center
              justify-center
              text-[#6f6a5d]
              hover:opacity-70
              transition-opacity
            "
            aria-label="Effacer la recherche"
          >
            <X size={15} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* RÉSULTATS */}
      <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
        {/* TEXTE NOUVEAUTÉS */}
        {!isSearching && (
          <div className="px-1 shrink-0 text-[10px] font-bold text-zinc-500">
            {t("pedalsMenu.latest")}
          </div>
        )}

        {/* LISTE */}
        <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar pb-6 min-h-0">
          {visiblePedals.length > 0 ? (
            visiblePedals.map((pedal) => {
              const image = pedal.thumbnail || null;
              const isNew = isNewPedal(pedal.year);

              return (
                <button
                  key={pedal.id}
                  type="button"
                  onClick={() => {
                    addPedal(pedal);
                    setShowPedalResults(false);
                  }}
                  className="
                    relative
                    w-full
                    min-h-[48px]
                    rounded-lg
                    bg-zinc-800
                    hover:bg-canvas
                    pl-[64px]
                    pr-2
                    py-1
                    flex
                    items-center
                    text-left
                    transition-colors
                    shrink-0
                    overflow-hidden
                  "
                >
                  {/* IMAGE COMPLÈTEMENT À GAUCHE */}
                  <div
                    className="
                      absolute
                      left-0
                      top-1/2
                      -translate-y-1/2
                      w-[56px]
                      h-[42px]
                      flex
                      items-center
                      justify-center
                      pointer-events-none
                      overflow-hidden
                    "
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`${pedal.brand || ""} ${pedal.name || ""}`}
                        loading="lazy"
                        decoding="async"
                        className="
                          block
                          max-w-[52px]
                          max-h-[38px]
                          object-contain
                        "
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-zinc-700" />
                    )}
                  </div>

                  {/* TEXTE */}
                  <div className="min-w-0 flex items-center flex-1">
                    <div className="min-w-0 flex-1">
                      {/* MARQUE */}
                      <div className="text-[12px] font-black leading-tight truncate">
                        {pedal.brand}
                      </div>

                      {/* NOM + BADGE NEW */}
                      <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                        <span className="truncate min-w-0">
                          {pedal.name}
                        </span>

                        {isNew && (
                          <span
                            className="
                              text-[8px]
                              font-black
                              uppercase
                              tracking-wider
                              text-green-500
                              shrink-0
                            "
                          >
                            {t("pedalsMenu.new")}
                          </span>
                        )}
                      </div>
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