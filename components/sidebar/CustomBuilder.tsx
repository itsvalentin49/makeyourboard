"use client";

import React from "react";

type Props = {
  customType: "pedal" | "board" | null;
  setCustomType: (v: "pedal" | "board") => void;

  customWidth: string;
  setCustomWidth: (v: string) => void;

  customDepth: string;
  setCustomDepth: (v: string) => void;

  addCustomItem: (item?: any) => void;

  isPedalValid: boolean;
  isBoardValid: boolean;

  minValue: number;
  maxValue: number;

  displayMin: number;
  displayMax: number;

  units: "metric" | "imperial";

  unitLabel: string;

  withUnit: (label: string) => string;

  t: (key: string) => string;
};

export default function CustomBuilder({
  customType,
  setCustomType,
  customWidth,
  setCustomWidth,
  customDepth,
  setCustomDepth,
  addCustomItem,
  isPedalValid,
  isBoardValid,
  minValue,
  maxValue,
  displayMin,
  displayMax,
  units,
  unitLabel,
  withUnit,
  t,
}: Props) {

  return (
    <div className="flex flex-col gap-2 mt-8">

      <div className="mb-2 flex items-center gap-3">
        <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("custom.title")}
        </span>
      </div>

      <div className="flex flex-col gap-6">

        {/* SELECT TYPE */}
        <div className="flex flex-col gap-2">

          <span className="text-[9px] text-white uppercase font-black tracking-widest">
            {t("custom.selectType")}
          </span>

          <div className="flex w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">

            <button
              onClick={() => {
                setCustomType("pedal");
                setCustomWidth("");
                setCustomDepth("");
              }}
              className={`
                flex-1 py-2 text-[10px] font-black uppercase tracking-widest
                transition-all duration-200
                ${
                  customType === "pedal"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-500 hover:text-white"
                }
              `}
            >
              {t("custom.pedal")}
            </button>

            <button
              onClick={() => {
                setCustomType("board");
                setCustomWidth("");
                setCustomDepth("");
              }}
              className={`
                flex-1 py-2 text-[10px] font-black uppercase tracking-widest
                transition-all duration-200
                border-l border-zinc-800
                ${
                  customType === "board"
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-500 hover:text-white"
                }
              `}
            >
              {t("custom.board")}
            </button>

          </div>

        </div>

        {/* PEDAL FLOW */}
        {customType === "pedal" && (

          <div className="flex flex-col gap-1">

            <div className="flex flex-col gap-0.5">

              <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
                {t("custom.enterDimensions")}
              </span>

              <span className="text-[9px] text-zinc-500 font-mono leading-tight">
                min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
              </span>

            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={units === "metric" ? 1 : 0.1}
                placeholder={withUnit(t("custom.width"))}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
              />

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={units === "metric" ? 1 : 0.1}
                placeholder={withUnit(t("custom.depth"))}
                value={customDepth}
                onChange={(e) => setCustomDepth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
              />

            </div>

            <button
              onClick={addCustomItem}
              disabled={!isPedalValid}
              className="w-full text-[10px] mt-2 font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white disabled:cursor-not-allowed"
            >
              {t("custom.addPedal")}
            </button>

          </div>

        )}

        {/* BOARD FLOW */}
        {customType === "board" && (

          <div className="flex flex-col gap-1">

            <div className="flex flex-col gap-0.5">

              <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
                {t("custom.enterDimensions")}
              </span>

              <span className="text-[9px] text-zinc-500 font-mono leading-tight">
                min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
              </span>

            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={units === "metric" ? 1 : 0.1}
                placeholder={withUnit(t("custom.width"))}
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
              />

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={units === "metric" ? 1 : 0.1}
                placeholder={withUnit(t("custom.depth"))}
                value={customDepth}
                onChange={(e) => setCustomDepth(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
              />

            </div>

            <button
              onClick={addCustomItem}
              disabled={!isBoardValid}
              className="w-full mt-2 text-[10px] font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white disabled:cursor-not-allowed"
            >
              {t("custom.addBoard")}
            </button>

          </div>

        )}

      </div>

    </div>
  );
}