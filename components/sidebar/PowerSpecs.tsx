"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import BuyOnline from "./BuyOnline";
import { mmToIn, formatWeight } from "@/utils/units";

type Props = {
  selectedPower: any;

  units: "metric" | "imperial";
  language: "en" | "fr" | "es" | "de" | "it" | "pt";

  t: (key: string) => string;

  isUSA: boolean;
  isEurope: boolean;

  buildThomannUrl: (slug: string) => string;
};

export default function PowerSpecs({
  selectedPower,
  units,
  language,
  t,
  isUSA,
  isEurope,
  buildThomannUrl,
}: Props) {

  if (!selectedPower) return null;

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300 px-1">

      {/* HEADER */}
      <div className="space-y-0.5 border-zinc-900">

        <div className="mt-4 mb-4">
          <div
            className="
              w-full
              text-[11px] font-black uppercase
              py-2 rounded-md
              bg-blue-500 !text-white
              text-center
              cursor-default
            "
          >
            {t("power.features")}
          </div>
        </div>

        {/* STATUS */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.status.label")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap ${
              (selectedPower.status || "").toLowerCase().includes("active")
                ? "bg-green-500/20 text-green-500"
                : "bg-red-500/20 text-red-500"
            }`}
          >
            {selectedPower.status
              ? t(`power.status.${selectedPower.status.toLowerCase()}`)
              : "N/A"}
          </span>
        </div>

        {/* BRAND */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.brand")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.brand || "N/A"}
          </span>
        </div>

        {/* MODEL */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.model")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.name || "N/A"}
          </span>
        </div>

        {/* YEAR */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.year")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.year || "N/A"}
          </span>
        </div>

        {/* OUTPUTS */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.outputs")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.outputs || "N/A"}
          </span>
        </div>

        {/* ISOLATED */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.isolated")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.isolated ? t("power.yes") : t("power.no")}
          </span>
        </div>

        {/* CAPACITY */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.capacity")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold font-mono text-white whitespace-nowrap">
            {selectedPower.capacity || 0} mA
          </span>
        </div>

        {/* VOLTAGE */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.voltage")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold font-mono text-white whitespace-nowrap">
            {selectedPower.voltage || "N/A"}
          </span>
        </div>

        {/* DIMENSIONS */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.dimensions")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold font-mono text-white whitespace-nowrap">
            {units === "metric"
              ? `${selectedPower.width} x ${selectedPower.depth} mm`
              : `${mmToIn(selectedPower.width).toFixed(2)} x ${mmToIn(
                  selectedPower.depth
                ).toFixed(2)} in`}
          </span>
        </div>

        {/* WEIGHT */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.weight")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold font-mono text-white whitespace-nowrap">
            {formatWeight(selectedPower.weight || 0, units, language)}
          </span>
        </div>

        {/* ORIGIN */}
        <div className="flex items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.origin")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {selectedPower.origin || "N/A"}
          </span>
        </div>

        {/* MANUAL */}
        <div className="flex items-center py-2 border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider whitespace-nowrap">
            {t("power.manual")}
          </span>

          <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

          {selectedPower.manual ? (
            <a
              href={selectedPower.manual}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              PDF <ExternalLink size={10} />
            </a>
          ) : (
            <span className="text-[11px] font-bold text-white whitespace-nowrap">
              N/A
            </span>
          )}
        </div>
      </div>

      {/* BUY ONLINE */}
      <BuyOnline
        selectedPedal={selectedPower}
        isUSA={isUSA}
        isEurope={isEurope}
        buildThomannUrl={buildThomannUrl}
        t={t}
      />
    </div>
  );
}