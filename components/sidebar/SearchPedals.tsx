"use client";

import React from "react";
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

  return (
    <div className="flex flex-col gap-2">

      <div className="mt-3 flex items-center gap-3">

        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("sidebar.addPedal")}
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
            placeholder={`${t("sidebar.searchPedal")}...`}
            className={`w-full bg-zinc-950 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-white placeholder:text-zinc-500 outline-none transition-all ${
              showPedalResults
                ? "border-zinc-500"
                : "border-zinc-700"
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
              setShowPedalResults(!showPedalResults);
              setShowBoardResults(false);
            }}
            className={`absolute right-3 size-4 cursor-pointer transition-transform ${
              showPedalResults
                ? "rotate-180 text-zinc-400"
                : "text-zinc-500"
            }`}
          />

        </div>

        {showPedalResults && (
          <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">

            {Object.keys(groupItems(pedalsLibrary, pedalSearch)).length > 0 ? (

              Object.keys(groupItems(pedalsLibrary, pedalSearch)).map((brand) => (

                <div key={brand} className="flex flex-col">

                  <div className="px-4 h-10 flex items-center bg-zinc-950">
                    <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
                      {brand}
                    </span>
                  </div>

                  {groupItems(pedalsLibrary, pedalSearch)[brand].map((p) => (

                    <button
                      key={p.id}
                      onClick={() => {
  setPedalSearch(`${p.brand} ${p.name}`);
  addPedal(p);
  setShowPedalResults(false);
}}
                      className="w-full px-5 py-2 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                    >
                      <span className="font-semibold mr-2 text-zinc-500">
                        {brand}
                      </span>

                      {p.name}
                    </button>

                  ))}

                </div>

              ))

            ) : (

              <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">
                No pedals found
              </div>

            )}

          </div>
        )}

      </div>

    </div>
  );
}