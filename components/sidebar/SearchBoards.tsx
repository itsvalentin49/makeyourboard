
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
  ScanSearch,
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


const POPULAR_BOARDS = [
  "Pedaltrain Classic JR",
  "Pedaltrain Nano +",
  "RockBoard TRES 3.1",
  "Temple Audio Solo 18 GM",
  "RockBoard QUAD 4.2",
  "Daddario XPND 2 Core",
  "Harley Benton Spaceship 40",
];

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

    const list = boardsLibrary.filter(
      (board) => {
        if (!terms.length) {
          const fullName = normalize(
            `${board.brand ?? ""} ${board.name ?? ""}`
          );

          const nameOnly = normalize(
            board.name
          );

          return POPULAR_BOARDS.some(
            (popular) => {
              const popularName = normalize(
                popular
              );

              return (
                fullName === popularName ||
                nameOnly === popularName
              );
            }
          );
        }

        const haystack =
          `${board.brand ?? ""} ${board.name ?? ""} ${board.type ?? ""}`
            .toLowerCase();

        return terms.every(
          (term) => haystack.includes(term)
        );
      }
    );

    if (!isSearching) {
      return list.sort((a, b) => {
        const index = (board: AnyRow) =>
          POPULAR_BOARDS.findIndex(
            (popular) => {
              const p = normalize(popular);

              return (
                normalize(
                  `${board.brand ?? ""} ${board.name ?? ""}`
                ) === p ||
                normalize(board.name) === p
              );
            }
          );

        return index(a) - index(b);
      });
    }

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

  const pedalLabel =
    pedalCount === 1
      ? t("boardFinder.pedalLabel")
      : t("boardFinder.pedalsLabel");

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

      {/* =========================
          CLASSIC MODE
          ========================= */}

      {!isFinder && (
        <>

          {/* TITLE */}

          <div className="mb-2 shrink-0">

            <div className="min-w-0 text-[11px] font-black uppercase tracking-wide">
              {t("boardsMenu.title")}
            </div>

          </div>

          {/* SEARCH */}

          <div className="relative flex items-center mb-4 shrink-0">

            <Search
              size={15}
              strokeWidth={2.5}
              className="absolute left-4 text-[#6f6a5d]"
            />

            <input
              ref={boardInputRef}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={t("boardsMenu.searchPlaceholder")}
              className="w-full h-[30px] bg-white !text-black placeholder:!text-zinc-500 rounded-md pl-12 pr-11 text-[12px] font-bold outline-none"
              value={boardSearch}

              onClick={(event) => {
                event.stopPropagation();

                setShowPedalResults(false);
                setShowBoardResults(true);
              }}

              onChange={(event) => {
                setBoardSearch(
                  event.target.value
                );

                setShowBoardResults(true);
              }}
            />

            {boardSearch && (
              <button
                type="button"

                onClick={(event) => {
                  event.stopPropagation();

                  setBoardSearch("");
                  boardInputRef.current?.focus();
                }}

                className="absolute right-4 flex items-center justify-center text-[#6f6a5d] hover:opacity-70 transition-opacity"
              >
                <X
                  size={15}
                  strokeWidth={3}
                />
              </button>
            )}

          </div>

          {/* NOMBRE DE RÉSULTATS */}
          {isSearching && (
            <div className="mt-4 mb-2 shrink-0 text-[11px] font-bold">
              {t(
                visibleBoards.length <= 1
                  ? "boardsMenu.result"
                  : "boardsMenu.results"
              ).replace(
                "{count}",
                String(visibleBoards.length)
              )}
            </div>
          )}

          {/* PEDALBOARD FINDER BUTTON */}

          {canOpenFinder && !isSearching && (
            <button
              type="button"

              onClick={(event) => {
                event.stopPropagation();
                openFinder();
              }}

              onMouseEnter={(event) => {
                event.currentTarget.style.boxShadow =
                  "0 0 0 1px #2563eb";
              }}

              onMouseLeave={(event) => {
                event.currentTarget.style.boxShadow =
                  "none";
              }}

              className="
      mb-4
      flex
      w-full
      shrink-0
      cursor-pointer
      items-center
      gap-3
      overflow-hidden
      border
      bg-transparent
      px-3
      py-0
      text-left
    "

              style={{
                borderRadius: "8px",

                height: 54,
                minHeight: 54,
                maxHeight: 54,

                flexShrink: 0,
                boxSizing: "border-box",

                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "#2563eb",

                transition: "box-shadow 120ms ease-out",
              }}
            >

              <ScanSearch
                size={30}
                strokeWidth={2}
                color="#2563eb"
                className="shrink-0"
                aria-hidden="true"

                style={{
                  color: "#2563eb",
                  stroke: "#2563eb",
                }}
              />

              <span className="flex min-w-0 flex-1 flex-col">

                <span className="block text-[11px] font-black uppercase leading-[1.25] tracking-tight">
                  {t("boardFinder.button")}
                </span>

                <span className="block text-[10px] font-medium leading-[1.5]">
                  {t("boardFinder.subtitle")}
                </span>

              </span>

            </button>
          )}

        </>
      )}

      {/* =========================
          FINDER NAVIGATION
          ========================= */}

      {isFinder && (
        <div className="shrink-0">

          <button
            type="button"

            onClick={(event) => {
              event.stopPropagation();
              closeFinder();
            }}

            className="mb-2 flex items-center gap-2 py-1 text-[11px] font-bold cursor-pointer"

            aria-label={t("boardFinder.back")}
          >

            <ArrowLeft
              size={17}
              strokeWidth={2.3}
            />

            <span>
              {t("boardFinder.back")}
            </span>

          </button>

        </div>
      )}

      {/* =========================
          FINDER RESULTS
          ========================= */}

      {isFinder && (
        <div className="flex shrink-0 flex-col">

          {/* RESULTS SUMMARY */}

          {layout.status === "ready" &&
            matchCount > 0 ? (

            <div
              className="mb-4 flex shrink-0 items-start gap-3 rounded-xl p-3"

              style={{
                backgroundColor: "#e5f8ec",
              }}

              role="status"
            >

              <CheckCircle2
                size={30}
                strokeWidth={2.4}
                color="#16a34a"
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">

                <div className="text-[10px] font-black leading-snug uppercase text-[#14532d]">
                  {t("boardFinder.resultsFound").replace(
                    "{count}",
                    String(matchCount)
                  )}

                </div>


                <div className="mt-1 text-[10px] tabular-nums text-[#166534]">
                  {pedalCount} {pedalLabel}
                  {" · "}
                  {dimensionPair(
                    layout.width,
                    layout.depth
                  )}
                </div>


              </div>

            </div>

          ) : layout.status === "ready" ? (

            /* NO COMPATIBLE BOARD */

            <div
              className="mb-4 flex items-start gap-2 text-[11px] leading-relaxed"
              role="status"
            >

              <CircleX
                size={16}
                className="shrink-0 text-red-500"
              />

              <span>
                {t("boardFinder.noMatch")}
              </span>

            </div>

          ) : null}

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

            {t("boardsMenu.popular")}

          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto no-scrollbar pb-6">

          {displayedBoards.map((board) => {

            const image =
              board.thumbnail || null;

            const showCompatibilityCheck =
              recommendedBoards.has(board);

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
                      className="relative z-10 block max-w-[60px] max-h-[38px] object-contain"
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

                    <div className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-tight text-zinc-300">

                      {board.name}

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
