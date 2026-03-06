"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

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
  showBoardResults,
  setShowBoardResults,
  setShowPedalResults,
  selectBoard,
  boardInputRef,
  t,
  groupItems,
}: Props) {

  return (
    <div className="flex flex-col gap-2 mt-8">

      <div className="mb-1 flex items-center gap-3">
        <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("sidebar.addBoard")}
        </span>
      </div>

      <div className="relative" style={{ zIndex: showBoardResults ? 60 : 5 }}>

        <div className="relative flex items-center">

          <input
            ref={boardInputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={`${t("sidebar.searchBoard")}...`}
            className={`w-full bg-zinc-900 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-zinc-200 placeholder:text-zinc-500 outline-none transition-all ${
              showBoardResults
                ? "border-zinc-500"
                : "border-zinc-700"
            }`}
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

          <ChevronDown
            onClick={(e) => {
              e.stopPropagation();
              setShowBoardResults(!showBoardResults);
              setShowPedalResults(false);
            }}
            className={`absolute right-3 size-4 cursor-pointer transition-transform ${
              showBoardResults
                ? "rotate-180 text-zinc-400"
                : "text-zinc-500"
            }`}
          />

        </div>

        {showBoardResults && (
          <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">

            {Object.keys(groupItems(boardsLibrary, boardSearch)).length > 0 ? (

              Object.keys(groupItems(boardsLibrary, boardSearch)).map((brand) => (

                <div key={brand} className="flex flex-col">

                  <div className="px-4 h-10 flex items-center bg-zinc-950">
                    <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
                      {brand}
                    </span>
                  </div>

                  {groupItems(boardsLibrary, boardSearch)[brand].map((b) => (

                    <button
                      key={b.id}
                      onClick={() => selectBoard(b)}
                      className="w-full px-5 py-2 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                    >
                      <span className="font-semibold opacity-50 mr-2">
                        {brand}
                      </span>

                      {b.name}
                    </button>

                  ))}

                </div>

              ))

            ) : (

              <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">
                No boards found
              </div>

            )}

          </div>
        )}

      </div>

    </div>
  );
}