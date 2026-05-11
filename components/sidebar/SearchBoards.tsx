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

  const visibleBoards = useMemo(() => {
    const terms = search.split(" ").filter(Boolean);

    return boardsLibrary
      .filter((b) => {
        if (!terms.length) return true;

        const haystack = `${b.brand ?? ""} ${b.name ?? ""} ${b.type ?? ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => {
        const brandA = String(a.brand || "").localeCompare(String(b.brand || ""));
        if (brandA !== 0) return brandA;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [boardsLibrary, search]);

  return (
    <div className="flex flex-col gap-4 mt-1 h-full min-h-0">
<div
  className="
    w-full
    text-[11px] font-black uppercase
    py-2 rounded-md
    bg-blue-600 !text-white
    text-center
    cursor-default
  "
>
  {t("boardsMenu.title")}
</div>

      <div className="relative flex items-center shrink-0">
        <Search
          size={18}
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
            bg-white text-zinc-950 placeholder:!text-zinc-500
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

      <div className="px-1 text-[11px] font-black uppercase tracking-wide text-zinc-300 shrink-0">
        {t("boardsMenu.count").replace("{count}", String(visibleBoards.length))}
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
  );
}