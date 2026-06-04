"use client";

import React from "react";
import { RotateCw, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import type { Language } from "@/utils/i18n";

type Props = {
  selectedBoardDetails: any;

  units: "metric" | "imperial";
  language: Language;

  t: (key: string) => string;

  isCustomBoard: boolean;

  buildThomannUrl: (slug: string) => string;
  getStoresForCountry: () => string[];

  hasBoardCommercialLinks: boolean;
  selectedBoardInstanceId: number | null;
  rotateBoard: (id: number) => void;
  moveBoardFront: (id: number) => void;
  moveBoardBack: (id: number) => void;
  deleteBoard: (id: number) => void;
  isUSA: boolean;
  isEurope: boolean;
};

export default function BoardSpecs({
  selectedBoardDetails,
  units,
  language,
  t,
  isCustomBoard,
  buildThomannUrl,
  getStoresForCountry,
  hasBoardCommercialLinks,
  selectedBoardInstanceId,
  rotateBoard,
  moveBoardFront,
  moveBoardBack,
  deleteBoard,
  isUSA,
  isEurope,
}: Props) {

  if (!selectedBoardDetails) return null;

return (
  <div className="flex flex-col gap-1 animate-in slide-in-from-left duration-300 px-1">

    {selectedBoardInstanceId !== null && (
      <div className="space-y-4 mt-4 mb-4">
        <div className="w-full text-[11px] font-black uppercase py-2 rounded-md bg-blue-600 !text-white text-center cursor-default">
          {t("pedal.actions.title")}
        </div>

<div className="grid grid-cols-4 gap-2">

  <button
    onClick={() => rotateBoard(selectedBoardInstanceId)}
    className="h-[40px] flex items-center justify-center bg-zinc-950 border border-canvas rounded-md transition-all duration-150 cursor-pointer hover:bg-canvas active:scale-[0.98]"
  >
    <RotateCw size={17} strokeWidth={2.5} />
  </button>

  <button
    onClick={() => deleteBoard(selectedBoardInstanceId)}
    className="h-[40px] flex items-center justify-center bg-zinc-950 border border-canvas rounded-md transition-all duration-150 cursor-pointer hover:bg-canvas active:scale-[0.98]"
  >
    <Trash2 size={17} strokeWidth={2.5} />
  </button>

  <button
    onClick={() => moveBoardFront(selectedBoardInstanceId)}
    className="h-[40px] flex items-center justify-center bg-zinc-950 border border-canvas rounded-md transition-all duration-150 cursor-pointer hover:bg-canvas active:scale-[0.98]"
  >
    <ArrowUp size={17} strokeWidth={2.5} />
  </button>

  <button
    onClick={() => moveBoardBack(selectedBoardInstanceId)}
    className="h-[40px] flex items-center justify-center bg-zinc-950 border border-canvas rounded-md transition-all duration-150 cursor-pointer hover:bg-canvas active:scale-[0.98]"
  >
    <ArrowDown size={17} strokeWidth={2.5} />
  </button>
</div>
      </div>
    )}

    <div className="space-y-0.5 border-zinc-900">

        {/* HEADER */}
<div className="mt-3 mb-4">
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
    {t("pedal.features")}
  </div>
</div>

{/* STATUT */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.status.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

<span
  className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap ${
    (selectedBoardDetails.status || "")
      .toLowerCase()
      .includes("active")
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500"
      }`}
    >
      {selectedBoardDetails.status
        ? t(`board.status.${selectedBoardDetails.status.toLowerCase()}`)
        : "N/A"}
    </span>

  </div>
)}

{/* MARQUE */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.brand")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold  whitespace-nowrap">
      {selectedBoardDetails.brand || "N/A"}
    </span>

  </div>
)}

{/* MODÈLE */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.model")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedBoardDetails.name || "N/A"}
    </span>

  </div>
)}

{/* YEAR */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.year")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedBoardDetails.year || "N/A"}
    </span>

  </div>
)}

{/* MATÉRIAU */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.material.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedBoardDetails.material
        ? t(`board.material.${selectedBoardDetails.material}`)
        : "N/A"}
    </span>

  </div>
)}

{/* PROFIL */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.profile.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedBoardDetails.profile
        ? t(`board.profile.${selectedBoardDetails.profile}`)
        : "N/A"}
    </span>

  </div>
)}

{/* DIMENSIONS */}
<div className="flex items-center py-1">

  <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
    {t("board.dimensions")}
  </span>

  <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

  <span className="text-[11px] font-bold font-mono whitespace-nowrap">
    {units === "metric"
      ? `${selectedBoardDetails.width} x ${selectedBoardDetails.depth || 0} mm`
      : `${mmToIn(selectedBoardDetails.width).toFixed(2)} x ${mmToIn(
          selectedBoardDetails.depth || 0
        ).toFixed(2)} in`}
  </span>

</div>

{/* POIDS */}
{!isCustomBoard && (
  <div className="flex items-center py-1">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.weight")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {formatWeight(selectedBoardDetails.weight || 0, units, language)}
    </span>

  </div>
)}

{/* ORIGINE */}
{!isCustomBoard && (
  <div className="flex items-center py-1 border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("board.origin")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedBoardDetails.origin || "N/A"}
    </span>

  </div>
)}
      </div>

      {/* BUY ONLINE */}
      {!isCustomBoard && selectedBoardDetails && (
        <div className="mt-8">

<div className="mb-4">
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
    {t("sidebar.buyOnline")}
  </div>
</div>

          <div className="flex flex-col">
            {(
              (selectedBoardDetails.status || "")
                .toLowerCase()
                .includes("discontinued") ||
              !hasBoardCommercialLinks
                ? ["reverb"]
                : [...getStoresForCountry(), "reverb"]
            ).map((store) => {

              let url = "";

              if (store === "reverb") {
                url = `https://reverb.com/marketplace?query=${encodeURIComponent(
                  selectedBoardDetails.brand + " " + selectedBoardDetails.name
                )}`;
              }

              if (store === "sweetwater") {
                url = selectedBoardDetails.sweetwater;
              }

              if (store === "woodbrass") {
                url = selectedBoardDetails.woodbrass;
              }

              if (store.includes("thomann")) {
                url = buildThomannUrl(selectedBoardDetails.thomann);
              }

              if (!url) return null;

              const storeData = {
                sweetwater: { label: "Sweetwater", logo: "/logos/sweetwater.png" },
                woodbrass: { label: "Woodbrass", logo: "/logos/woodbrass.png" },
                reverb: { label: "Reverb", logo: "/logos/reverb.png" },
                thomann: { label: "Thomann", logo: "/logos/thomann.png" },
              };

              const key = store.includes("thomann") ? "thomann" : store;
              const data = storeData[key as keyof typeof storeData];

              return (
                <a
                  key={store}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    flex items-center gap-3
                    px-3 py-2
                    rounded-lg
                    transition-all duration-200 ease-out
                    hover:bg-zinc-900
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    group
                  "
                >
                  <img
                    src={data.logo}
                    alt={data.label}
                    className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="
                    text-[12px] font-semibold text-zinc-300
                    transition-all duration-200
                    group-hover:text-white
                    group-hover:translate-x-1
                  ">
                    {data.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}