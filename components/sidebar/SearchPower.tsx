"use client";

import React, { useMemo } from "react";
import { Search, X } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
  powerLibrary: AnyRow[];
  powerSearch: string;
  setPowerSearch: (v: string) => void;
  showPowerResults: boolean;
  setShowPowerResults: (v: boolean) => void;
  setShowPedalResults: (v: boolean) => void;
  setShowBoardResults: (v: boolean) => void;
  addPower: (p: AnyRow) => void;
  powerInputRef: React.RefObject<HTMLInputElement | null>;
  powerDropdownRef: React.RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
  groupItems: (
    items: AnyRow[],
    filter: string
  ) => Record<string, AnyRow[]>;
};

const POPULAR_POWER_SUPPLIES = [
  "Cioks DC7 V2",
  "Strymon Zuma",
  "Voodoo Lab Pedal Power 3",
  "Cioks Sol",
  "Strymon Ojai",
  "Truetone 1 SPOT Pro CS6",
  "Harley Benton PowerPlant ISO-2 Pro",
  "Voodoo Lab Pedal Power X8",
  "MXR DC Brick | M237",
  "Truetone 1 SPOT Pro CS12",
  "Walrus Audio Canvas Power HP",
  "Fender Engine Room LVL8",
];

function normalize(value: any) {
  return String(value || "").trim().toLowerCase();
}

export default function SearchPower({
  powerLibrary,
  powerSearch,
  setPowerSearch,
  setShowPowerResults,
  setShowPedalResults,
  setShowBoardResults,
  addPower,
  powerInputRef,
  t,
}: Props) {
  const search = powerSearch.trim().toLowerCase();
  const isSearching = search.length > 0;

  const visiblePower = useMemo(() => {
    const terms = search.split(" ").filter(Boolean);

    const list = powerLibrary.filter((power) => {
      if (!terms.length) {
        const fullName = normalize(
          `${power.brand ?? ""} ${power.name ?? ""}`
        );

        const nameOnly = normalize(power.name);

        return POPULAR_POWER_SUPPLIES.some((popular) => {
          const popularName = normalize(popular);

          return (
            fullName === popularName ||
            nameOnly === popularName
          );
        });
      }

      const haystack = `
        ${power.brand ?? ""}
        ${power.name ?? ""}
        ${power.type ?? ""}
      `.toLowerCase();

      return terms.every((term) =>
        haystack.includes(term)
      );
    });

    if (!isSearching) {
      return list.sort((a, b) => {
        const fullA = normalize(
          `${a.brand ?? ""} ${a.name ?? ""}`
        );

        const nameA = normalize(a.name);

        const fullB = normalize(
          `${b.brand ?? ""} ${b.name ?? ""}`
        );

        const nameB = normalize(b.name);

        const indexA = POPULAR_POWER_SUPPLIES.findIndex(
          (popular) => {
            const normalizedPopular = normalize(popular);

            return (
              fullA === normalizedPopular ||
              nameA === normalizedPopular
            );
          }
        );

        const indexB = POPULAR_POWER_SUPPLIES.findIndex(
          (popular) => {
            const normalizedPopular = normalize(popular);

            return (
              fullB === normalizedPopular ||
              nameB === normalizedPopular
            );
          }
        );

        return indexA - indexB;
      });
    }

    return list.sort((a, b) => {
      const brandA = String(
        a.brand || ""
      ).localeCompare(String(b.brand || ""));

      if (brandA !== 0) return brandA;

      return String(a.name || "").localeCompare(
        String(b.name || "")
      );
    });
  }, [powerLibrary, search, isSearching]);

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">
      {/* COMPTEUR AU-DESSUS DE LA BARRE DE RECHERCHE */}
      <div className="px-1 mb-2 shrink-0">
        <div className="text-[11px] font-black uppercase tracking-wide">
          {isSearching
            ? t("powerMenu.results").replace(
              "{count}",
              String(visiblePower.length)
            )
            : t("powerMenu.count").replace(
              "{count}",
              String(powerLibrary.length)
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
          ref={powerInputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t(
            "powerMenu.searchPlaceholder"
          )}
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
          value={powerSearch}
          onClick={(event) => {
            event.stopPropagation();

            setShowPedalResults(false);
            setShowBoardResults(false);
            setShowPowerResults(true);
          }}
          onChange={(event) => {
            setPowerSearch(event.target.value);
            setShowPowerResults(true);
          }}
        />

        {powerSearch && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setPowerSearch("");
              powerInputRef.current?.focus();
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
        {/* TEXTE ALIMENTATIONS POPULAIRES */}
        {!isSearching && (
          <div className="px-1 shrink-0 text-[10px] font-bold text-zinc-500">
            {t("powerMenu.popular")}
          </div>
        )}

        {/* LISTE */}
        <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar pb-6 min-h-0">
          {visiblePower.length > 0 ? (
            visiblePower.map((power, index) => {
              const image = power.thumbnail || null;
              const podium =
                !isSearching && index < 3
                  ? ["🥇", "🥈", "🥉"][index]
                  : null;

              return (
                <button
                  key={power.id}
                  type="button"
                  onClick={() => {
                    addPower(power);
                    setShowPowerResults(false);
                  }}
                  className="
                    relative
                    w-full
                    min-h-[48px]
                    rounded-lg
                    bg-zinc-800
                    hover:bg-canvas
                    pl-[70px]
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
                        alt={`${power.brand || ""} ${power.name || ""}`}
                        loading="lazy"
                        decoding="async"
                        className="
                          block
                          max-w-[60px]
                          max-h-[25px]
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
                      <div className="text-[12px] font-black leading-tight truncate">
                        {power.brand}
                      </div>

                      <div className="text-[10px] font-bold text-zinc-300 leading-tight mt-0.5 line-clamp-2">
                        {power.name}
                      </div>
                    </div>
                  </div>

                  {podium && (
                    <span
                      className="
      absolute
      right-2
      top-1/2
      -translate-y-1/2
      text-[18px]
      leading-none
      pointer-events-none
    "
                    >
                      {podium}
                    </span>
                  )}
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