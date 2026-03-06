"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import BuyOnline from "./BuyOnline";
import { mmToIn, formatWeight } from "@/utils/units";

type Props = {
  selectedPedal: any;
  units: "metric" | "imperial";
  language: "en" | "fr" | "es" | "de" | "it" | "pt";
  t: (key: string) => string;

  isCustomPedal: boolean;
  isUSA: boolean;
  isEurope: boolean;

  buildThomannUrl: (slug: string) => string;
};

export default function PedalSpecs({
  selectedPedal,
  units,
  language,
  t,
  isCustomPedal,
  isUSA,
  isEurope,
  buildThomannUrl,
}: Props) {

  if (!selectedPedal) return null;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300 px-1">

      {/* PEDAL INFO */}
      <div className="space-y-0.5 border-zinc-900">

        <div className="mt-4 mb-4 flex items-center gap-3">
          <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
          <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
            {t("pedal.features")}
          </span>
        </div>

        {/* STATUT */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.status.label")}
      </span>
      <span
        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
          (selectedPedal.status || "").toLowerCase().includes("active")
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
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
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.brand")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.brand || "N/A"}
      </span>
    </div>
  )}

  {/* MODÈLE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.model")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.name || "N/A"}
      </span>
    </div>
  )}

    {/* MODÈLE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.year")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.year || "N/A"}
      </span>
    </div>
  )}


  {/* TYPE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.type.label")}
      </span>
      <span className="text-[11px] font-bold font-mono text-zinc-400">
        {selectedPedal.type
          ? t(`pedal.type.${selectedPedal.type}`)
          : "N/A"}
      </span>
    </div>
  )}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.circuit.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.circuit
                ? t(`pedal.circuit.${selectedPedal.circuit}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.bypass.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.bypass
                ? t(`pedal.bypass.${selectedPedal.bypass}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.power.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.power
                ? t(`pedal.power.${selectedPedal.power}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.draw")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.draw || 0} mA
              </span>
            </div>)}

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-white uppercase font-bold tracking-wider">
              {t("pedal.dimensions")}
            </span>
            <span className="text-[11px] font-bold font-mono text-zinc-400">
              {units === "metric"
                ? `${selectedPedal.width} x ${selectedPedal.depth || 0} mm`
                : `${mmToIn(selectedPedal.width).toFixed(2)} x ${mmToIn(
                    selectedPedal.depth || 0
                  ).toFixed(2)} in`}
            </span>
            </div>

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-white uppercase font-bold tracking-wider">
              {t("pedal.weight")}
            </span>
            <span className="text-[11px] font-bold font-mono text-zinc-400">
              {formatWeight(selectedPedal.weight || 0, units, language)}
            </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
               {t("pedal.origin")}
              </span>
              <span className="text-[11px] font-bold text-zinc-400">
                {selectedPedal.origin || "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.manual")}
              </span>
              {selectedPedal.manual ? (
                <a
                  href={selectedPedal.manual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  PDF <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-[11px] font-bold text-zinc-400">N/A</span>
              )}
            </div>)}

        {/* ensuite tu copies tout ton bloc specs ici */}

      </div>

      {!isCustomPedal && (
        <BuyOnline
          selectedPedal={selectedPedal}
          isUSA={isUSA}
          isEurope={isEurope}
          buildThomannUrl={buildThomannUrl}
          t={t}
        />
      )}

    </div>
  );
}