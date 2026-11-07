
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleX,
  WandSparkles,
  Search,
  X,
  Cable,
} from "lucide-react";

import {
  findCompatibleBoards,
  getFinderLayout,
  physicalPedals,
} from "@/utils/boardFinder";

type AnyRow = Record<string, any>;

type Props = {
  boardsLibrary: AnyRow[];

  boardSearch: string;
  setBoardSearch: (v: string) => void;

  showBoardResults: boolean;
  setShowBoardResults: (v: boolean) => void;
  setShowPedalResults: (v: boolean) => void;

  selectBoard: (b: AnyRow) => void;

  boardInputRef:
  React.RefObject<HTMLInputElement | null>;

  t: (key: string) => string;

  groupItems: (
    items: AnyRow[],
    filter: string
  ) => Record<string, AnyRow[]>;

  finderPedals?: AnyRow[];
  existingBoards?: AnyRow[];

  selectSuggestedBoard?: (
    board: AnyRow
  ) => boolean;

  units?: "metric" | "imperial";
};


function boardReleaseDate(value: unknown): Date | null {
  const m = String(value ?? "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return date.getFullYear() === Number(m[1]) && date.getMonth() === Number(m[2]) - 1 && date.getDate() === Number(m[3]) ? date : null;
}

function isNewBoard(value: unknown): boolean {
  const date = boardReleaseDate(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(today.getDate() - 365);
  return date >= limit && date <= today;
}

function normalize(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function SearchBoards({
  boardsLibrary,
  boardSearch,
  setBoardSearch,
  setShowBoardResults,
  setShowPedalResults,
  selectBoard,
  boardInputRef,
  t,
  finderPedals = [],
  existingBoards = [],
  selectSuggestedBoard,
  units = "metric",
}: Props) {

  /* =========================
     FINDER STATE
     ========================= */

  const [finderOpen, setFinderOpen] =
    useState(false);

  const [isLightTheme, setIsLightTheme] =
    useState(true);

  useEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      setIsLightTheme(html.classList.contains("light"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const search = boardSearch
    .trim()
    .toLowerCase();

  const isSearching = search.length > 0;

  const pedals = physicalPedals(
    finderPedals
  );

  const pedalCount = pedals.length;

  const canOpenFinder =
    pedalCount >= 2 &&
    Boolean(selectSuggestedBoard);

  const isFinder =
    finderOpen && canOpenFinder;

  useEffect(() => {
    if (!canOpenFinder) {
      setFinderOpen(false);
    }
  }, [canOpenFinder]);

  /* =========================
     FINDER CALCULATIONS
     ========================= */

  const layout = useMemo(
    () =>
      getFinderLayout(
        finderPedals,
        existingBoards
      ),
    [finderPedals, existingBoards]
  );

  const matches = useMemo(
    () =>
      findCompatibleBoards(
        layout,
        boardsLibrary
      ),
    [layout, boardsLibrary]
  );

  const matchCount = matches.length;

  const recommendedBoards = useMemo(
    () =>
      new Set(
        matches.map((match) => match.board)
      ),
    [matches]
  );

  /* =========================
     CLASSIC SEARCH
     ========================= */

  const visibleBoards = useMemo(() => {
    const terms = search
      .split(" ")
      .filter(Boolean);

    if (!isSearching) {
      return boardsLibrary
        .filter(board => normalize(board.status) === "active" && isNewBoard(board.year))
        .sort((a, b) => String(b.year).localeCompare(String(a.year)) ||
          String(a.brand ?? "").localeCompare(String(b.brand ?? "")) ||
          String(a.name ?? "").localeCompare(String(b.name ?? "")))
        .slice(0, 20);
    }

    const list = boardsLibrary.filter(board => {
      const haystack = `${board.brand ?? ""} ${board.name ?? ""} ${board.type ?? ""}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });

    return list.sort(
      (a, b) =>
        String(a.brand || "").localeCompare(
          String(b.brand || "")
        ) ||
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
    );
  }, [
    boardsLibrary,
    search,
    isSearching,
  ]);

  const displayedBoards = isFinder
    ? matches.map((match) => match.board)
    : visibleBoards;

  /* =========================
     FORMATTING
     ========================= */

  const dimensionPair = (
    width: number,
    depth: number
  ) =>
    units === "imperial"
      ? `${(width / 25.4).toFixed(1)} × ${(depth / 25.4).toFixed(1)} in`
      : `${Math.ceil(width)} × ${Math.ceil(depth)} mm`;

  const resultLabel = t(matchCount === 0 ? "powerFinder.noResults" : matchCount === 1 ? "powerFinder.result" : "powerFinder.results")
    .replace("{count}", String(matchCount));

  /* =========================
     NAVIGATION
     ========================= */

  const openFinder = () => {
    setBoardSearch("");
    setShowBoardResults(false);
    setShowPedalResults(false);

    setFinderOpen(true);
  };

  const closeFinder = () => {
    setFinderOpen(false);
  };

  /* =========================
     BOARD HOVER
     ========================= */

  const handleBoardHover = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;

    const shade = button.className.match(
      /(?:^|\s)hover:bg-zinc-(\d+)(?:\s|$)/
    )?.[1];

    if (!shade) return;

    button.style.setProperty(
      "background-color",
      `var(--zinc-${shade})`,
      "important"
    );
  };

  const handleBoardLeave = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.currentTarget.style.removeProperty(
      "background-color"
    );
  };

  /* =========================
     RENDER
     ========================= */

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">

      <div className="mb-2 shrink-0">
        <div className="min-w-0 text-[11px] font-black uppercase tracking-wide">
          {t("boardsMenu.title")}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="relative flex items-center flex-1 min-w-0">
          {isFinder ? (
            <div
              className="w-full h-[30px] rounded-md flex items-center gap-2 min-w-0 px-3 text-[10px] font-black uppercase"
              style={{ height: 30, minHeight: 30, backgroundColor: "#e5f8ec", color: "#14532d", fontSize: 10 }}
              role="status"
              aria-live="polite"
              title={resultLabel}
            >
              {matchCount > 0 && (
                <CheckCircle2 size={16} strokeWidth={2.4} className="shrink-0" aria-hidden="true" style={{ color: "#16a34a", stroke: "#16a34a" }} />
              )}
              <span className="truncate">{resultLabel}</span>
            </div>
          ) : (
            <>
              <Search size={15} strokeWidth={2.5} className="absolute left-4 text-[#6f6a5d]" aria-hidden="true" />
              <input
                ref={boardInputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={t("boardsMenu.searchPlaceholder")}
                aria-label={t("boardsMenu.searchPlaceholder")}
                className="w-full h-[30px] bg-white !text-black placeholder:!text-zinc-500 rounded-md pl-12 pr-11 text-[12px] font-bold outline-none"
                value={boardSearch}
                onClick={(event) => {
                  event.stopPropagation();
                  setShowPedalResults(false);
                  setShowBoardResults(true);
                }}
                onChange={(event) => {
                  setBoardSearch(event.target.value);
                  setShowBoardResults(true);
                }}
              />
              {boardSearch && (
                <button type="button" onClick={(event) => {
                  event.stopPropagation();
                  setBoardSearch("");
                  boardInputRef.current?.focus();
                }} className="absolute right-4 flex items-center justify-center text-[#6f6a5d] hover:opacity-70 transition-opacity"
                  aria-label={t("powerMenu.clearSearch")}>
                  <X size={15} strokeWidth={3} />
                </button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          disabled={!isFinder && !canOpenFinder}
          aria-label={t(isFinder ? "sidebar.back" : "boardFinder.button")}
          title={t(isFinder ? "sidebar.back" : "boardFinder.button")}
          onClick={(event) => {
            event.stopPropagation();
            if (isFinder) closeFinder();
            else if (canOpenFinder) openFinder();
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
          style={{ width: 30, minWidth: 30, height: 30, minHeight: 30, padding: 0, border: "none", backgroundColor: "#2563eb", color: "#ffffff" }}
        >
          {isFinder ? (
            <ArrowLeft size={22} strokeWidth={2} aria-hidden="true" style={{ color: "#ffffff", stroke: "#ffffff" }} />
          ) : (
            <WandSparkles size={22} strokeWidth={2} aria-hidden="true" style={{ color: "#ffffff", stroke: "#ffffff" }} />
          )}
        </button>
      </div>

      {!isFinder && isSearching && (
        <div className="mt-4 mb-2 shrink-0 text-[11px] font-bold">
          {t(visibleBoards.length <= 1 ? "boardsMenu.result" : "boardsMenu.results").replace("{count}", String(visibleBoards.length))}
        </div>
      )}

      {/* =========================
          FINDER RESULTS
          ========================= */}

      {isFinder && (
        <div className="flex shrink-0 flex-col">

          {layout.status === "ready" && matchCount === 0 && (
            <div className="mb-4 flex items-start gap-2 text-[11px] leading-relaxed" role="status">
              <CircleX size={16} className="shrink-0 text-red-500" />
              <span>{t("boardFinder.noMatch")}</span>
            </div>
          )}

          {/* MULTIPLE BOARDS WARNING */}

          {existingBoards.length > 1 && (
            <div className="mb-3 flex items-start gap-2 text-[11px]">

              <AlertTriangle
                size={16}
                className="shrink-0 text-red-500"
              />

              <span>
                {t("boardFinder.multipleBoards")}
              </span>

            </div>
          )}

          {/* OVERLAP WARNING */}

          {layout.hasOverlap && (
            <div className="mb-3 flex items-start gap-2 text-[11px] leading-relaxed">

              <Cable
                size={16}
                className="-mt-[1px] shrink-0 text-red-500"
              />

              <span>
                {t("boardFinder.overlap")}
              </span>

            </div>
          )}

        </div>
      )}

      {/* =========================
          BOARD LIST
          ========================= */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

        {!isFinder && !isSearching && (
          <div className="mb-1 mt-4 shrink-0 text-[11px] font-bold">

            {t("pedalsMenu.latest")}

          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto no-scrollbar pb-6">

          {displayedBoards.map((board) => {

            const image =
              board.thumbnail || null;

            const showCompatibilityCheck =
              isFinder && recommendedBoards.has(board);

            const boardWidth =
              Number(board.width);

            const boardDepth =
              Number(board.depth);

            const hasBoardDimensions =
              Number.isFinite(boardWidth) &&
              boardWidth > 0 &&
              Number.isFinite(boardDepth) &&
              boardDepth > 0;

            return (
              <button
                key={board.id}
                type="button"

                disabled={
                  isFinder &&
                  existingBoards.length > 1
                }

                onClick={(event) => {
                  event.stopPropagation();

                  if (isFinder) {
                    const success =
                      selectSuggestedBoard?.(board);

                    if (success) {
                      setShowBoardResults(false);
                    }
                  } else {
                    selectBoard(board);
                    setShowBoardResults(false);
                  }
                }}

                onMouseEnter={
                  handleBoardHover
                }

                onMouseLeave={
                  handleBoardLeave
                }

                className="relative w-full min-h-[48px] rounded-lg bg-zinc-800 hover:bg-zinc-700 pl-[72px] pr-[34px] py-1 flex items-center text-left transition-colors shrink-0 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {/* BOARD IMAGE */}

                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[64px] h-[42px] flex items-center justify-center pointer-events-none">

                  {/* FOND CLAIR — DARK MODE UNIQUEMENT */}
                  {!isLightTheme && (
                    <div
                      className="absolute rounded-md"
                      style={{
                        width: "50px",
                        height: "40px",
                        backgroundColor: "#e5e7eb",
                      }}
                    />
                  )}

                  {/* IMAGE DU PEDALBOARD */}
                  {image ? (
                    <img
                      src={image}
                      alt={`${board.brand || ""} ${board.name || ""}`}
                      loading="lazy"
                      decoding="async"
                      className="relative z-10 block object-contain"
                      style={{
                        maxWidth: isLightTheme ? 60 : 46,
                        maxHeight: isLightTheme ? 38 : 36,
                      }}
                    />
                  ) : (
                    <div className="relative z-10 w-12 h-6 rounded-md bg-zinc-700" />
                  )}

                </div>
                {/* BOARD DETAILS */}

                <div className="min-w-0 flex flex-1 items-center">

                  <div className="min-w-0 flex-1">

                    <div className="truncate text-[12px] font-black leading-tight">

                      {board.brand}

                    </div>

                    <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                      <span className="truncate min-w-0">{board.name}</span>
                      {isNewBoard(board.year) && (
                        <span className="text-[8px] font-black uppercase tracking-wider text-green-500 shrink-0">
                          {t("pedalsMenu.new")}
                        </span>
                      )}
                    </div>

                    {hasBoardDimensions && (
                      <div className="mt-1 text-[9px] tabular-nums text-zinc-400">

                        {dimensionPair(
                          boardWidth,
                          boardDepth
                        )}

                      </div>
                    )}

                  </div>

                </div>

                {/* COMPATIBILITY CHECK */}

                {showCompatibilityCheck && (
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                    aria-label={t("boardFinder.compatible")}
                    title={t("boardFinder.compatible")}
                  >

                    <CheckCircle2
                      size={16}
                      strokeWidth={2.6}
                    />

                  </div>
                )}

              </button>
            );
          })}

        </div>

      </div>

    </div>
  );
}
