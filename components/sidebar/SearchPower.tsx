"use client";

import React, { useMemo, useState } from "react";
import { Search, X, WandSparkles, ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";

import { findPowerSupplies, hydratePedals, recommendPower, powerMountingHint, label } from "@/utils/powerFinder";

import type { CatalogStatus } from "@/hooks/useLibrary";

type AnyRow = Record<string, any>;

type Props = {
  powerLibrary: AnyRow[];
  catalogStatus: CatalogStatus;
  pedalsLoading: boolean;
  finderPedals: AnyRow[];
  existingBoards?: AnyRow[];
  pedalsLibrary: AnyRow[];

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

function parseReleaseDate(value: any): Date | null {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) &&
    date.getMonth() === Number(match[2]) - 1 &&
    date.getDate() === Number(match[3]) ? date : null;
}


function isNewPedal(value: any): boolean {
  const releaseDate = parseReleaseDate(value);

  if (!releaseDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 365);

  releaseDate.setHours(0, 0, 0, 0);

  return releaseDate >= limitDate && releaseDate <= today;
}


function releaseValue(power: AnyRow): unknown {
  return power.year;
}

function releaseSortKey(power: AnyRow, today: Date): number | null {
  const value = releaseValue(power);
  const date = parseReleaseDate(value);
  if (date) {
    if (date.getTime() > today.getTime()) return null;
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }
  // A year alone remains an approximate date; never invent January 1st.
  const yearText = String(value ?? "").trim();
  if (!/^\d{4}$/.test(yearText)) return null;
  const year = Number(yearText);
  return year >= 1900 && year <= today.getFullYear() ? year * 10000 : null;
}

export default function SearchPower({
  finderPedals,
  existingBoards = [],
  pedalsLibrary,
  powerLibrary,
  catalogStatus,
  pedalsLoading,
  powerSearch,
  setPowerSearch,
  setShowPowerResults,
  setShowPedalResults,
  setShowBoardResults,
  addPower,
  powerInputRef,
  t,
}: Props) {
  const [finderOpen, setFinderOpen] = useState(false);
  const search =
    powerSearch.trim().toLowerCase();

  const isSearching =
    search.length > 0;

  const visiblePower = useMemo(() => {
    const terms = search.split(/\s+/).filter(Boolean);
    if (terms.length) {
      return powerLibrary.filter(power => {
        const haystack = `${power.brand ?? ""} ${power.name ?? ""} ${power.type ?? ""}`.toLowerCase();
        return terms.every(term => haystack.includes(term));
      }).sort((a, b) => String(a.brand ?? "").localeCompare(String(b.brand ?? "")) ||
        String(a.name ?? "").localeCompare(String(b.name ?? "")));
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return powerLibrary
      .filter(power => String(power.status ?? "").trim().toLowerCase() === "active")
      .filter(power => isNewPedal(releaseValue(power)))
      .map(power => ({ power, key: releaseSortKey(power, today) }))
      .filter((entry): entry is { power: AnyRow; key: number } => entry.key !== null)
      .sort((a, b) => b.key - a.key ||
        String(a.power.brand ?? "").localeCompare(String(b.power.brand ?? "")) ||
        String(a.power.name ?? "").localeCompare(String(b.power.name ?? "")))
      .slice(0, 20)
      .map(entry => entry.power);
  }, [powerLibrary, search]);

  const handlePowerHover = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;

    const shade =
      button.className.match(
        /(?:^|\s)hover:bg-zinc-(\d+)(?:\s|$)/
      )?.[1];

    if (!shade) return;

    button.style.setProperty(
      "background-color",
      `var(--zinc-${shade})`,
      "important"
    );
  };

  const handlePowerLeave = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.currentTarget.style.removeProperty(
      "background-color"
    );
  };

  const finder = useMemo(() => {
    if (!finderOpen) return null;
    const analysis = findPowerSupplies(hydratePedals(finderPedals, pedalsLibrary), powerLibrary, 60000, t);
    return { analysis, matches: recommendPower(analysis.results, existingBoards) };
  }, [finderOpen, finderPedals, pedalsLibrary, powerLibrary, existingBoards, t]);

  const resultLabel = t((finder?.matches.length ?? 0) === 0 ? "powerFinder.noResults" : finder?.matches.length === 1 ? "powerFinder.result" : "powerFinder.results")
    .replace("{count}", String(finder?.matches.length ?? 0));

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">
      {/* TITLE */}

      <div className="mb-2 shrink-0">
        <div className="min-w-0 text-[11px] font-black uppercase tracking-wide">
          {t("powerMenu.title")}
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}

      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="relative flex items-center flex-1 min-w-0">
          {finderOpen ? (
            <div
              className="w-full h-[30px] rounded-md flex items-center gap-2 min-w-0 px-3 text-[10px] font-black uppercase"
              style={{ height: 30, minHeight: 30, backgroundColor: "#e5f8ec", color: "#14532d", fontSize: 10 }}
              role="status"
              aria-live="polite"
              title={resultLabel}
            >
              {(finder?.matches.length ?? 0) > 0 && (
                <CheckCircle2 size={16} strokeWidth={2.4} className="shrink-0" aria-hidden="true" style={{ color: "#16a34a", stroke: "#16a34a" }} />
              )}
              <span className="truncate">{resultLabel}</span>
            </div>
          ) : (
            <>
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
            text-[16px] lg:text-[12px]
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
                  setPowerSearch(
                    event.target.value
                  );

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
                  aria-label={t("powerMenu.clearSearch")}
                >
                  <X
                    size={15}
                    strokeWidth={3}
                  />
                </button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          disabled={catalogStatus !== "ready" || pedalsLoading}
          aria-label={t(finderOpen ? "sidebar.back" : "powerFinder.open")}
          title={t(finderOpen ? "sidebar.back" : "powerFinder.open")}
          onClick={(event) => {
            event.stopPropagation();
            setShowPedalResults(false);
            setShowBoardResults(false);
            setShowPowerResults(false);
            setFinderOpen(open => !open);
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.setProperty("background-color", "#1d4ed8", "important");
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.setProperty("background-color", "#2563eb", "important");
          }}
          ref={(element) => {
            if (element) {
              element.style.setProperty("background-color", "#2563eb", "important");
              element.style.setProperty("color", "#ffffff", "important");
            }
          }}
          className="shrink-0 flex items-center justify-center rounded-md cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            width: 30,
            minWidth: 30,
            height: 30,
            minHeight: 30,
            padding: 0,
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
          }}
        >
          {finderOpen ? (
            <ArrowLeft size={22} strokeWidth={2} aria-hidden="true" style={{ color: "#ffffff", stroke: "#ffffff" }} />
          ) : (
            <WandSparkles size={22} strokeWidth={2} aria-hidden="true" style={{ color: "#ffffff", stroke: "#ffffff" }} />
          )}
        </button>
      </div>

      {catalogStatus !== "ready" ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 mb-2 flex shrink-0 items-center gap-2 text-[11px] font-bold"
        >
          {catalogStatus === "loading" ? (
            <>
              <LoaderCircle
                size={14}
                className="animate-spin motion-reduce:animate-none shrink-0"
                aria-hidden="true"
              />
              {t("customPanel.loadingImage")}
            </>
          ) : (
            t("pedalsMenu.loadError")
          )}
        </div>
      ) : finderOpen && finder ? (
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {finder.matches.length === 0 && (
            <p className="mb-4 text-[11px] text-zinc-400" role="status">
              {!finderPedals.some(item => String(item.type ?? "").trim().toLowerCase() !== "power")
                ? t("powerFinder.startWithPedals")
                : t(finder.analysis.count === 1 ? "powerFinder.noRecommendationSingle" : "powerFinder.noRecommendations")}
            </p>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto no-scrollbar pb-6">
              {finder.matches.map((match, index) => {
                const power = match.supply;
                const image = power.thumbnail || power.image || null;
                const mountingHint = powerMountingHint(power, existingBoards);

                return (
                  <button
                    key={`${power.id ?? "power"}-${index}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addPower(power);
                    }}
                    onMouseEnter={handlePowerHover}
                    onMouseLeave={handlePowerLeave}
                    className="relative w-full min-h-[48px] rounded-lg bg-zinc-800 hover:bg-zinc-700 pl-[72px] pr-[34px] py-1 flex items-center text-left transition-colors shrink-0 overflow-hidden"
                    aria-label={t("powerFinder.addSupply").replace("{name}", label(power) === "powerFinder.unnamed" ? t("powerFinder.unnamed") : label(power))}
                  >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[64px] h-[42px] flex items-center justify-center pointer-events-none">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="relative z-10 block max-w-[60px] max-h-[38px] object-contain"
                        />
                      ) : (
                        <div className="relative z-10 w-12 h-6 rounded-md bg-zinc-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex flex-1 items-center">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-black leading-tight">{power.brand}</div>
                        <div className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-tight text-zinc-300">{power.name}</div>
                        {mountingHint && (
                          <div className="mt-1 text-[9px] text-zinc-400" title={t("powerFinder.mountingTooltip")}>
                            {t(mountingHint)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" aria-hidden="true">
                      <CheckCircle2 size={16} strokeWidth={2.6} />
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* NOMBRE DE RÉSULTATS */}

          {isSearching && (
            <div className="mt-4 mb-2 shrink-0 text-[11px] font-bold">
              {t(
                visiblePower.length <= 1
                  ? "powerMenu.result"
                  : "powerMenu.results"
              ).replace(
                "{count}",
                String(
                  visiblePower.length
                )
              )}
            </div>
          )}

          {/* RÉSULTATS */}

          <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
            {/* TEXTE NOUVEAUTÉS */}

            {!isSearching && (
              <div className="mt-4 shrink-0 text-[11px] font-bold">
                {t("powerMenu.latest")}
              </div>
            )}

            {/* LISTE */}

            <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar pb-6 min-h-0">
              {visiblePower.map(
                (power) => {
                  const image =
                    power.thumbnail ||
                    null;

                  const isNew = isNewPedal(releaseValue(power));

                  return (
                    <button
                      key={power.id}
                      type="button"
                      onClick={() => {
                        addPower(power);

                        setShowPowerResults(
                          false
                        );
                      }}
                      onMouseEnter={
                        handlePowerHover
                      }
                      onMouseLeave={
                        handlePowerLeave
                      }
                      className="
                    relative
                    w-full
                    min-h-[48px]
                    rounded-lg
                    bg-zinc-800
                    hover:bg-zinc-700
                    pl-[72px]
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
                      w-[64px]
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
                            className="relative z-10 block max-w-[60px] max-h-[38px] object-contain"
                          />
                        ) : (
                          <div className="relative z-10 w-12 h-6 rounded-md bg-zinc-700" />
                        )}
                      </div>

                      {/* TEXTE */}

                      <div className="min-w-0 flex items-center flex-1">
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-black leading-tight truncate">
                            {power.brand}
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                            <span className="truncate min-w-0">{power.name}</span>
                            {isNew && (
                              <span className="text-[8px] font-black uppercase tracking-wider text-green-500 shrink-0">
                                {t("powerMenu.new")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}