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
  groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

const POPULAR_BOARDS = [
  "Pedaltrain Nano",
  "Pedaltrain Nano +",
  "Pedaltrain Metro 16",
  "Pedaltrain Metro 20",
  "Pedaltrain Classic JR",
  "Pedaltrain Novo 18",
  "RockBoard DUO 2.1",
  "RockBoard TRES 3.1",
  "RockBoard QUAD 4.2",
  "Daddario XPND 2 Core",
  "Temple Audio Duo 17 GM",
  "Temple Audio Duo 24 GM",
  "Harley Benton Spaceship 40",
  "Harley Benton Spaceship 60",
  "Harley Benton Spaceship 80",
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

    let list = boardsLibrary.filter((b) => {
      if (!terms.length) {
        const fullName = normalize(`${b.brand ?? ""} ${b.name ?? ""}`);
        const nameOnly = normalize(b.name);

        return POPULAR_BOARDS.some((popular) => {
          const popularName = normalize(popular);
          return fullName === popularName || nameOnly === popularName;
        });
      }

      const haystack =
        `${b.brand ?? ""} ${b.name ?? ""} ${b.type ?? ""}`.toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });

    if (!isSearching) {
      return list.sort((a, b) => {
        const fullA = normalize(`${a.brand ?? ""} ${a.name ?? ""}`);
        const nameA = normalize(a.name);

        const fullB = normalize(`${b.brand ?? ""} ${b.name ?? ""}`);
        const nameB = normalize(b.name);

        const indexA = POPULAR_BOARDS.findIndex((popular) => {
          const p = normalize(popular);
          return fullA === p || nameA === p;
        });

        const indexB = POPULAR_BOARDS.findIndex((popular) => {
          const p = normalize(popular);
          return fullB === p || nameB === p;
        });

        return indexA - indexB;
      });
    }

    return list.sort((a, b) => {
      const brandA = String(a.brand || "").localeCompare(String(b.brand || ""));
      if (brandA !== 0) return brandA;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [boardsLibrary, search, isSearching]);

  return (
    <div className="flex flex-col gap-4 mt-1 h-full min-h-0">
      <div className="relative flex items-center shrink-0">
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
          className="
            w-full h-[30px]
            bg-white !text-black placeholder:!text-zinc-500
            rounded-md
            pl-12 pr-11
            text-[12px] font-bold
            outline-none
          "
          value={boardSearch}
          onClick={(e) => {
            e.stopPropagation();
            setShowPedalResults(false);
            setShowBoardResults(true);
          }}
          onChange={(e) => {
            setBoardSearch(e.target.value);
            setShowBoardResults(true);
          }}
        />

        {boardSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBoardSearch("");
              boardInputRef.current?.focus();
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
              ? t("boardsMenu.results").replace(
                  "{count}",
                  String(visibleBoards.length)
                )
              : t("boardsMenu.count").replace(
                  "{count}",
                  String(boardsLibrary.length)
                )}
          </div>

          {!isSearching && (
            <div className="mt-1 text-[10px] font-bold text-zinc-500">
              {t("boardsMenu.popular")}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar pb-28 min-h-0">
          {visibleBoards.length > 0 ? (
            visibleBoards.map((b) => {
              const img = b.image || b.image_url || b.photo;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBoardSearch("");
                    selectBoard(b);
                    setShowBoardResults(false);
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
                  <div className="w-[50px] h-[34px] shrink-0 flex items-center justify-center">
                    {img ? (
                      <img
                        src={img}
                        alt={`${b.brand || ""} ${b.name || ""}`}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-12 h-6 rounded-md bg-zinc-700" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-black leading-tight">
                      {b.name}
                    </div>

                    <div className="text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                      {b.brand}
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