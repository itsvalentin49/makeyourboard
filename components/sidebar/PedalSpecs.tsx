"use client";

import React from "react";
import { ExternalLink, RotateCw, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import BuyOnline from "./BuyOnline";
import { mmToIn, formatWeight } from "@/utils/units";

type Props = {
  selectedPedal: any;
  selectedInstanceId: number | null;

  units: "metric" | "imperial";
  language: "en" | "fr" | "es" | "de" | "it" | "pt";
  t: (key: string) => string;

  isCustomPedal: boolean;
  isUSA: boolean;
  isEurope: boolean;

  buildThomannUrl: (slug: string) => string;

  rotatePedal: (id: number) => void;
  movePedalFront: (id: number) => void;
  movePedalBack: (id: number) => void;
  deletePedal: (id: number) => void;
};

export default function PedalSpecs({
  selectedPedal,
  selectedInstanceId,
  units,
  language,
  t,
  isCustomPedal,
  isUSA,
  isEurope,
  buildThomannUrl,
  rotatePedal,
  movePedalFront,
  movePedalBack,
  deletePedal,
}: Props) {

  if (!selectedPedal) return null;

  return (
    <div className="flex flex-col gap-1 animate-in slide-in-from-left duration-300 px-1">

      {selectedInstanceId !== null && (
  <div className="space-y-4 mt-4 mb-4">


    {/* ACTIONS */}
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
      {t("pedal.actions.title")}
    </div>

    <div className="grid grid-cols-4 gap-2">

  {/* ROTATE */}
  <button
    onClick={() => rotatePedal(selectedInstanceId)}
    title={t("pedal.actions.rotate")}
    className="
      h-[40px]
      flex items-center justify-center
      bg-zinc-950 border border-canvas rounded-md
      transition-all duration-150
      cursor-pointer
      hover:bg-canvas
      active:scale-[0.98]
    "
  >
    <RotateCw size={17} strokeWidth={2.5} />
  </button>

  {/* DELETE */}
  <button
    onClick={() => deletePedal(selectedInstanceId)}
    title={t("pedal.actions.delete")}
    className="
      h-[40px]
      flex items-center justify-center
      bg-zinc-950 border border-canvas rounded-md
      transition-all duration-150
      cursor-pointer
      hover:bg-canvas
      active:scale-[0.98]
    "
  >
    <Trash2 size={17} strokeWidth={2.5} />
  </button>

  {/* MOVE FRONT */}
  <button
    onClick={() => movePedalFront(selectedInstanceId)}
    title={t("pedal.actions.moveFront")}
    className="
      h-[40px]
      flex items-center justify-center
      bg-zinc-950 border border-canvas rounded-md
      transition-all duration-150
      cursor-pointer
      hover:bg-canvas
      active:scale-[0.98]
    "
  >
    <ArrowUp size={17} strokeWidth={2.5} />
  </button>

  {/* MOVE BACK */}
  <button
    onClick={() => movePedalBack(selectedInstanceId)}
    title={t("pedal.actions.moveBack")}
    className="
      h-[40px]
      flex items-center justify-center
      bg-zinc-950 border border-canvas rounded-md
      transition-all duration-150
      cursor-pointer
      hover:bg-canvas
      active:scale-[0.98]
    "
  >
    <ArrowDown size={17} strokeWidth={2.5} />
  </button>

</div>
  </div>
)}


      {/* PEDAL INFO */}
      <div className="border-zinc-900">

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
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    {/* LABEL */}
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.status.label")}
    </span>

    {/* POINTILLÉS */}
    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    {/* VALUE */}
<span
  className={`text-[9px] px-2 py-1 rounded-full font-black uppercase whitespace-nowrap ${
    (selectedPedal.status || "").toLowerCase().includes("active")
      ? "bg-green-500/20 text-green-500"
      : "bg-red-500/20 text-red-500"
  }`}
>
      {selectedPedal.status
        ? t(`pedal.status.${selectedPedal.status.toLowerCase()}`)
        : "N/A"}
    </span>

  </div>
)}

  {/* MARQUE */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    {/* LABEL */}
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.brand")}
    </span>

    {/* POINTILLÉS */}
    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    {/* VALUE */}
    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.brand || "N/A"}
    </span>

  </div>
)}

{/* MODÈLE */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    {/* LABEL */}
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.model")}
    </span>

    {/* POINTILLÉS */}
    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    {/* VALUE */}
    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.name || "N/A"}
    </span>

  </div>
)}

{/* ANNÉE */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.year")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.year
  ? String(selectedPedal.year).split("-")[0]
  : "N/A"}
    </span>

  </div>
)}

{/* TYPE */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.type.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.type
        ? t(`pedal.type.${selectedPedal.type}`)
        : "N/A"}
    </span>

  </div>
)}

{/* CIRCUIT */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.circuit.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.circuit
        ? t(`pedal.circuit.${selectedPedal.circuit}`)
        : "N/A"}
    </span>

  </div>
)}

{/* BYPASS */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.bypass.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.bypass
        ? t(`pedal.bypass.${selectedPedal.bypass}`)
        : "N/A"}
    </span>

  </div>
)}

{/* POWER */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.power.label")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.power
        ? t(`pedal.power.${selectedPedal.power}`)
        : "N/A"}
    </span>

  </div>
)}

{/* DRAW */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.draw")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.draw || 0} mA
    </span>

  </div>
)}

{/* MARQUE CUSTOM */}
{isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      MARQUE
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.brand || "Custom"}
    </span>
  </div>
)}

{/* MODÈLE CUSTOM */}
{isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      MODÈLE
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.name || "Custom Pedal"}
    </span>
  </div>
)}

{/* VOLTAGE CUSTOM */}
{isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      VOLTAGE
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {selectedPedal.voltage ? `${selectedPedal.voltage}V DC` : "N/A"}
    </span>
  </div>
)}

{/* DRAW CUSTOM */}
{isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">
    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      CURRENT
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {Number(selectedPedal.draw) || 0} mA
    </span>
  </div>
)}

{/* DIMENSIONS */}
<div className="flex items-center py-1 border-b border-zinc-900">

  {/* LABEL */}
  <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
    {t("pedal.dimensions")}
  </span>

  {/* POINTILLÉS */}
  <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

  {/* VALUE */}
  <span className="text-[11px] font-bold font-mono whitespace-nowrap">
    {units === "metric"
      ? `${selectedPedal.width} x ${selectedPedal.depth || 0} mm`
      : `${mmToIn(selectedPedal.width).toFixed(2)} x ${mmToIn(
          selectedPedal.depth || 0
        ).toFixed(2)} in`}
  </span>

</div>

{/* POIDS */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.weight")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold font-mono whitespace-nowrap">
      {formatWeight(selectedPedal.weight || 0, units, language)}
    </span>

  </div>
)}

{/* ORIGIN */}
{!isCustomPedal && (
  <div className="flex items-center py-1 border-b border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.origin")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    <span className="text-[11px] font-bold whitespace-nowrap">
      {selectedPedal.origin || "N/A"}
    </span>

  </div>
)}

{/* MANUEL */}
{!isCustomPedal && (
  <div className="flex items-center py-2 border-zinc-900">

    <span className="text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
      {t("pedal.manual")}
    </span>

    <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

    {selectedPedal.manual ? (
      <a
        href={selectedPedal.manual}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 whitespace-nowrap"
      >
        PDF <ExternalLink size={10} />
      </a>
    ) : (
      <span className="text-[11px] font-bold whitespace-nowrap">
        N/A
      </span>
    )}

  </div>
)}

      </div>

{!isCustomPedal && (
  <div className="-mt-3">
    <BuyOnline
      selectedPedal={selectedPedal}
      isUSA={isUSA}
      isEurope={isEurope}
      buildThomannUrl={buildThomannUrl}
      t={t}
    />
  </div>
)}

    </div>
  );
}