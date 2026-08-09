"use client";

import React, { useMemo } from "react";
import { Search, X } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
  boardsLibrary: AnyRow[];
  boardSearch: string;
  setBoardSearch: (v: string) => void;
  showBoardResults: boolean;
  setShowBoardResults: (v: boolean) => void;
  setShowPedalResults: (v: boolean) => void;
  selectBoard: (b: AnyRow) => void;
  boardInputRef: React.RefObject<HTMLInputElement | null>;
  t: (key: string) => string;
  groupItems: (
    items: AnyRow[],
    filter: string
  ) => Record<string, AnyRow[]>;
};

const POPULAR_BOARDS = [
  "Pedaltrain Classic JR",
  "Pedaltrain Nano +",
  "Pedaltrain Metro 16",
  "Temple Audio Duo 24 GM",
  "RockBoard TRES 3.1",
  "Temple Audio Solo 18 GM",
  "RockBoard QUAD 4.2",
  "Daddario XPND 2 Core",
  "Mono Cases Rail Small",
  "Harley Benton Spaceship 40",
  "Aclam Smart Track XS2 Free",
  "Creation Music Company Elevation 24",
];

function normalize(value: any) {
  return String(value || "").trim().toLowerCase();
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
}: Props) {
  const search = boardSearch.trim().toLowerCase();
  const isSearching = search.length > 0;

  const visibleBoards = useMemo(() => {
    const terms = search.split(" ").filter(Boolean);

    const list = boardsLibrary.filter((board) => {
      if (!terms.length) {
        const fullName = normalize(
          `${board.brand ?? ""} ${board.name ?? ""}`
        );

        const nameOnly = normalize(board.name);

        return POPULAR_BOARDS.some((popular) => {
          const popularName = normalize(popular);

          return (
            fullName === popularName ||
            nameOnly === popularName
          );
        });
      }

      const haystack = `
        ${board.brand ?? ""}
        ${board.name ?? ""}
        ${board.type ?? ""}
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

        const indexA = POPULAR_BOARDS.findIndex(
          (popular) => {
            const normalizedPopular = normalize(popular);

            return (
              fullA === normalizedPopular ||
              nameA === normalizedPopular
            );
          }
        );

        const indexB = POPULAR_BOARDS.findIndex(
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
      const brandA = String(a.brand || "").localeCompare(
        String(b.brand || "")
      );

      if (brandA !== 0) return brandA;

      return String(a.name || "").localeCompare(
        String(b.name || "")
      );
    });
  }, [boardsLibrary, search, isSearching]);

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">
      {/* COMPTEUR AU-DESSUS DE LA BARRE DE RECHERCHE */}
      <div className="px-1 mb-2 shrink-0">
        <div className="text-[11px] font-black uppercase tracking-wide">
          {isSearching
            ? t("boardsMenu.results").replace(
              "{count}",
              String(visibleBoards.length)
            )
            : t("boardsMenu.count").replace(
              "{count}",
              String(boardsLibrary.length)
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
          ref={boardInputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t(
            "boardsMenu.searchPlaceholder"
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
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setBoardSearch("");
              boardInputRef.current?.focus();
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
        {/* TEXTE BOARDS POPULAIRES */}
        {!isSearching && (
          <div className="px-1 shrink-0 text-[10px] font-bold text-zinc-500">
            {t("boardsMenu.popular")}
          </div>
        )}

        {/* LISTE */}
        <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar pb-6 min-h-0">
          {visibleBoards.length > 0 ? (
            visibleBoards.map((board, index) => {
              const image = board.thumbnail || null;
              const podium =
                !isSearching && index < 3
                  ? ["🥇", "🥈", "🥉"][index]
                  : null;

              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => {
                    selectBoard(board);
                    setShowBoardResults(false);
                  }}
                  className="
                    relative
                    w-full
                    min-h-[48px]
                    rounded-lg
                    bg-zinc-800
                    hover:bg-canvas
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
                        alt={`${board.brand || ""} ${board.name || ""}`}
                        loading="lazy"
                        decoding="async"
                        className="
                          block
                          max-w-[60px]
                          max-h-[38px]
                          object-contain
                        "
                      />
                    ) : (
                      <div className="w-12 h-6 rounded-md bg-zinc-700" />
                    )}
                  </div>

                  {/* TEXTE */}
                  <div className="min-w-0 flex items-center flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-black leading-tight truncate">
                        {board.brand}
                      </div>

                      <div className="text-[10px] font-bold text-zinc-300 leading-tight mt-0.5 line-clamp-2">
                        {board.name}
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