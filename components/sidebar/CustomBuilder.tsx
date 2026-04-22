"use client";

import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

type Props = {
  customType: "pedal" | "board" | null;
  setCustomType: (v: "pedal" | "board") => void;

  customName: string;
  setCustomName: (v: string) => void;

  customWidth: string;
  setCustomWidth: (v: string) => void;

  customDepth: string;
  setCustomDepth: (v: string) => void;

  customColor: string;
  setCustomColor: (v: string) => void;

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
  customName,
  setCustomName,
  customWidth,
  setCustomWidth,
  customDepth,
  setCustomDepth,
  customColor,
  setCustomColor,
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

  const [showPicker, setShowPicker] = useState(false);
  const PRESET_COLORS = [
  "#111111", "#ffffff", "#b91c1c", "#92400e", "#065f46", "#1e3a8a",
  "#6b21a8", "#374151", "#facc15", "#ea580c", "#be185d", "#0f172a"
];
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const close = () => setShowPicker(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="flex flex-col gap-2 mt-8">

      <div className="flex items-center gap-3">

        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("custom.title")}
        </span>
      </div>

      <div className="flex flex-col gap-4">

        {/* SELECT TYPE */}
        <div className="flex flex-col gap-2">

          <div className="flex w-full bg-zinc-950 border border-zinc-700 rounded-lg overflow-hidden">

            <button
              onClick={() => {
                setCustomType("pedal");
                setCustomWidth("");
                setCustomDepth("");
                setCustomName("");
              }}
              className={`
                flex-1 py-2 text-[10px] font-black uppercase tracking-widest
                transition-all duration-200
                ${
                  customType === "pedal"
                    ? "bg-blue-500 !text-white"
                    : "bg-zinc-950 text-white"
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
                setCustomName("");
              }}
              className={`
                flex-1 py-2 text-[10px] font-black uppercase tracking-widest
                transition-all duration-200
                border-l border-zinc-800
                ${
                  customType === "board"
                    ? "bg-blue-500 !text-white"
                    : "bg-zinc-950 text-white"
                }
              `}
            >
              {t("custom.board")}
            </button>

          </div>

        </div>

        {/* PEDAL FLOW */}
        {customType === "pedal" && (

          <div className="flex flex-col gap-2">

            {/* ENTER DIMENSIONS */}
              <div className="flex flex-col gap-1.5">

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
                    {t("custom.enterDimensions")}
                  </span>

                  <span className="text-[9px] text-white font-mono leading-tight">
                    min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">

                  {/* WIDTH PEDAL */}
                    <input
                    type="number"
                    min={minValue}
                    max={maxValue}
                    step={units === "metric" ? 1 : 0.1}
                    placeholder={focusedField === "width" ? "" : withUnit(t("custom.width"))}
                    value={customWidth}
                    onFocus={() => {
                      setFocusedField("width");
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                    }}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
                  />

                  {/* DEPTH PEDAL */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={focusedField === "depth" ? "" : withUnit(t("custom.depth"))}
                  value={customDepth}
                  onFocus={() => setFocusedField("depth")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCustomDepth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
                />

                </div>

              </div>


{/* NAME + COLOR */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

  {/* NAME (aligné à gauche) */}
  <div className="flex flex-col items-center gap-1 text-center">

    <span className="text-[9px] text-white uppercase font-black tracking-widest">
      {t("custom.nameOptional")}
    </span>

    <input
    type="text"
    placeholder={focusedField === "name" ? "" : t("custom.namePlaceholder")}
    value={customName}
    onFocus={() => setFocusedField("name")}
    onBlur={() => setFocusedField(null)}
    onChange={(e) => setCustomName(e.target.value)}
    className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
  />

  </div>

  {/* COLOR (centré) */}
  <div className="flex flex-col items-center gap-1 text-center">

    <span className="text-[9px] text-white uppercase font-black tracking-widest">
      {t("custom.color")}
    </span>

    <div
onClick={(e) => {
  e.stopPropagation();
  e.preventDefault();
  setShowPicker(prev => !prev); // 🔥 toggle
}}
  className="w-full max-w-[120px] h-[34px] rounded-md border border-zinc-700 cursor-pointer overflow-hidden"
>
  <div
    className="w-full h-full"
    style={{
      background: customColor || "linear-gradient(145deg, #bbb, #eee)"
    }}
  />
</div>

  </div>

</div>

{showPicker && (

  
<div className="grid grid-cols-6 gap-2 mt-2">
  {PRESET_COLORS.map((color) => (
    <button
      key={color}
      onClick={() => setCustomColor(color)}
      className={`
  w-6 h-6 rounded-md
  transition-all duration-150
  ${customColor === color 
    ? "scale-110 ring-2 ring-white" 
    : "hover:scale-105"
  }
`}
      style={{ background: color }}
    />
  ))}
</div>
)}


            <button
              onClick={() =>
  addCustomItem({
    name: customName,
    color: customColor ? customColor : undefined,
  })
}
              disabled={!isPedalValid}
              className="w-full text-[10px] mt-2 font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 !text-white disabled:cursor-not-allowed"
            >
              {t("custom.addPedal")}
            </button>

          </div>

        )}

        {/* BOARD FLOW */}
        {customType === "board" && (

          <div className="flex flex-col gap-0.5">

              {/* ENTER DIMENSIONS */}
              <div className="flex flex-col gap-1.5">

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
                    {t("custom.enterDimensions")}
                  </span>

                  <span className="text-[9px] text-white talic font-mono leading-tight">
                    min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">

                {/* WIDTH BOARD */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={focusedField === "width" ? "" : withUnit(t("custom.width"))}
                  value={customWidth}
                  onFocus={() => {
                    setFocusedField("width");
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                  }}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
                />

                {/* DEPTH BOARD */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={focusedField === "depth" ? "" : withUnit(t("custom.depth"))}
                  value={customDepth}
                  onFocus={() => setFocusedField("depth")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCustomDepth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
                />

                </div>

              </div>

            <button
              onClick={() => addCustomItem({ name: customName })}
              disabled={!isBoardValid}
              className="w-full mt-2 text-[10px] font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 !text-white disabled:cursor-not-allowed"
            >
              {t("custom.addBoard")}
            </button>

          </div>

        )}

      </div>

    </div>
  );
}