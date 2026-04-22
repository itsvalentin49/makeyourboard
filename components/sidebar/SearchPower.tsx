"use client";

import React, { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
  powerLibrary: AnyRow[];
  powerSearch: string;
  setPowerSearch: (v: string) => void;
  showPowerResults: boolean;
  powerDropdownRef: React.RefObject<HTMLDivElement | null>;
  setShowPowerResults: (v: boolean) => void;
  setShowPedalResults: (v: boolean) => void;
  setShowBoardResults: (v: boolean) => void;
  addPower: (p: AnyRow) => void;
  powerInputRef: React.RefObject<HTMLInputElement | null>;
  t: (key: string) => string;
  groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

export default function SearchPower({
  powerLibrary,
  powerSearch,
  setPowerSearch,
  showPowerResults,
  setShowPowerResults,
  setShowPedalResults,
  setShowBoardResults,
  addPower,
  powerInputRef,
  powerDropdownRef,
  t,
  groupItems,
}: Props) {

  const prevOpen = useRef(false);

  useEffect(() => {
    if (showPowerResults && !prevOpen.current) {
      setPowerSearch("");
      powerInputRef.current?.focus();
    }

    prevOpen.current = showPowerResults;
  }, [showPowerResults]);

  return (
    <div ref={powerDropdownRef} className="flex flex-col gap-2 mt-4">

      <div className="mt-3 flex items-center gap-3">
        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("sidebar.addPowerTitle")}
        </span>
      </div>

      <div className="relative" style={{ zIndex: showPowerResults ? 60 : 10 }}>

        <div className="relative flex items-center">

          <input
            ref={powerInputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={showPowerResults ? "" : `${t("sidebar.searchPower")}...`}
            className={`w-full bg-zinc-950 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-white placeholder:text-zinc-500 outline-none transition-all ${
              showPowerResults
                ? "border-zinc-500"
                : "border-zinc-700"
            }`}
            value={powerSearch}
            onClick={(e) => {
              e.stopPropagation();
              setShowPedalResults(false);
              setShowBoardResults(false);
              setShowPowerResults(true);
            }}
            onChange={(e) => {
              setPowerSearch(e.target.value);
              setShowPowerResults(true);
            }}
          />

          <ChevronDown
            onClick={(e) => {
              e.stopPropagation();
              setShowPedalResults(false);
              setShowBoardResults(false);
              setShowPowerResults(!showPowerResults);
            }}
            className={`absolute right-3 size-4 cursor-pointer transition-transform ${
              showPowerResults
                ? "rotate-180 text-zinc-400"
                : "text-zinc-500"
            }`}
          />

        </div>

        {showPowerResults && (
          <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">

            {Object.keys(groupItems(powerLibrary, powerSearch)).length > 0 ? (

              Object.keys(groupItems(powerLibrary, powerSearch)).map((brand) => (

                <div key={brand} className="flex flex-col">

                  <div className="px-4 h-10 flex items-center bg-zinc-950">
                    <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
                      {brand}
                    </span>
                  </div>

                  {groupItems(powerLibrary, powerSearch)[brand].map((p) => (

                    <button
                      key={p.id}
onClick={() => {
  setPowerSearch("");
  addPower(p); // ✅ AJOUT DIRECT
  setShowPowerResults(false);
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
                {t("search.noResults")}
              </div>

            )}

          </div>
        )}

      </div>

    </div>
  );
}