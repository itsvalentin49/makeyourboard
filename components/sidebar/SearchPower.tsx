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
  groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

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

  const visiblePower = useMemo(() => {
    const terms = search.split(" ").filter(Boolean);

    return powerLibrary
      .filter((p) => {
        if (!terms.length) return true;

        const haystack = `${p.brand ?? ""} ${p.name ?? ""} ${p.type ?? ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .sort((a, b) => {
        const brandA = String(a.brand || "").localeCompare(String(b.brand || ""));
        if (brandA !== 0) return brandA;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [powerLibrary, search]);

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
  {t("powerMenu.title")}
</div>

      <div className="relative flex items-center shrink-0">
        <Search
          size={18}
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
          placeholder={t("powerMenu.searchPlaceholder")}
          className="
            w-full h-[30px]
            bg-white text-zinc-950 placeholder:!text-zinc-500
            rounded-md
            pl-12 pr-11
            text-[12px] font-bold
            outline-none
          "
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

        {powerSearch && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPowerSearch("");
              powerInputRef.current?.focus();
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
        {t("powerMenu.count").replace("{count}", String(visiblePower.length))}
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto no-scrollbar pb-28 min-h-0">
        {visiblePower.length > 0 ? (
          visiblePower.map((p) => {
            const img = p.image || p.image_url || p.photo;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPowerSearch("");
                  addPower(p);
                  setShowPowerResults(false);
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
                      alt={`${p.brand || ""} ${p.name || ""}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-12 h-6 rounded-md bg-zinc-700" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-black leading-tight">
                    {p.name}
                  </div>

                  <div className="text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                    {p.brand}
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