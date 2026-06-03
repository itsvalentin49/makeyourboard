"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { saveCustomImage } from "@/utils/customImageStore";

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
  "#6b21a8", "#374151", "#facc15", "#ea580c", "#be185d"
];
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [uploadModel, setUploadModel] = useState("");
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadImageId, setUploadImageId] = useState<string | null>(null);
  const [uploadWidth, setUploadWidth] = useState("");
  const [uploadDepth, setUploadDepth] = useState("");
  const [uploadVoltage, setUploadVoltage] = useState("");
  const [uploadDraw, setUploadDraw] = useState("");
  const [customVoltage, setCustomVoltage] = useState("");
  const [customDraw, setCustomDraw] = useState("");
  const [customVoltageOpen, setCustomVoltageOpen] = useState(false);
  const customVoltageRef = React.useRef<HTMLDivElement>(null);
  const [voltageOpen, setVoltageOpen] = useState(false);
  const voltageRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setShowPicker(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      voltageRef.current &&
      !voltageRef.current.contains(e.target as Node)
    ) {
      setVoltageOpen(false);
    }
    if (
  customVoltageRef.current &&
  !customVoltageRef.current.contains(e.target as Node)
) {
  setCustomVoltageOpen(false);
}
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


const widthNumber = Number(customWidth);
const depthNumber = Number(customDepth);

const hasCustomDimensions = customWidth !== "" || customDepth !== "";

const customDimensionsInvalid =
  hasCustomDimensions &&
  (
    !widthNumber ||
    !depthNumber ||
    widthNumber < minValue ||
    widthNumber > maxValue ||
    depthNumber < minValue ||
    depthNumber > maxValue
  );


  const uploadWidthNumber =
  units === "metric" ? Number(uploadWidth) : Number(uploadWidth) * 25.4;

const uploadDepthNumber =
  units === "metric" ? Number(uploadDepth) : Number(uploadDepth) * 25.4;

const isUploadValid =
  !!uploadImage &&
  !!uploadWidthNumber &&
  !!uploadDepthNumber &&
  uploadWidthNumber >= 30 &&
  uploadWidthNumber <= 500 &&
  uploadDepthNumber >= 30 &&
  uploadDepthNumber <= 500;



  const handleLocalImageUpload = async (file: File | null) => {
  if (!file) return;

  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    alert("Format non supporté. Utilise PNG, JPG ou WEBP.");
    return;
  }

  if (file.size > 1_000_000) {
    alert("Image trop lourde. Maximum conseillé : 1 MB.");
    return;
  }

  const imageId = await saveCustomImage(file);
  const previewUrl = URL.createObjectURL(file);

  setUploadImageId(imageId);
  setUploadImage(previewUrl);
  };




return (
  <div className="flex flex-col gap-2 mt-1 h-full min-h-0">


<div
  className="
    w-full
    text-[11px] !text-white font-black uppercase
    py-2 rounded-md
    bg-blue-600
    text-center
    cursor-default
  "
>
  {customType === "board"
  ? t("customMenu.boardTitle")
  : t("customMenu.pedalTitle")}
</div>

<div className="flex flex-col gap-1">
  <div className="text-[10px] font-bold text-zinc-500">
    {t("customMenu.subtitle")}
  </div>

<div className="text-[9px] leading-[1.45] text-zinc-500">
  <div>
    • Dimensions : min {displayMin} {unitLabel} / max {displayMax} {unitLabel}
  </div>
</div>
</div>




      <div className="flex flex-col gap-4">

{/* SELECT TYPE */}
<div
  className="
    relative grid grid-cols-2
    h-[35px] rounded-lg
    bg-zinc-950 border border-zinc-800
    overflow-hidden cursor-pointer
  "
  onClick={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    setCustomType(clickX < rect.width / 2 ? "pedal" : "board");
    setCustomWidth("");
    setCustomDepth("");
    setCustomName("");
  }}
>
  <div
    className={`
      absolute top-0 h-full w-1/2
      rounded-md bg-canvas
      transition-transform duration-200 ease-out
      ${customType === "board" ? "translate-x-full" : "translate-x-0"}
    `}
  />

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setCustomType("pedal");
      setCustomWidth("");
      setCustomDepth("");
      setCustomName("");
    }}
    className={`
      relative z-10 text-[9px] font-black uppercase tracking-wide
      transition-colors duration-150
      light:!text-black
    `}
  >
    {t("custom.pedal")}
  </button>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setCustomType("board");
      setCustomWidth("");
      setCustomDepth("");
      setCustomName("");
    }}
    className={`
      relative z-10 text-[9px] font-black uppercase tracking-wide
      transition-colors duration-150
      light:!text-black
    `}
  >
    {t("custom.board")}
  </button>
</div>

        {/* PEDAL FLOW */}
        {customType === "pedal" && (

          <div className="flex flex-col gap-2">

            {/* NAME + COLOR */}
<div className="grid grid-cols-2 gap-2">

  {/* NAME (aligné à gauche) */}
  <div>

    <input
    type="text"
    placeholder={t("custom.namePlaceholder")}
    value={customName}
    onFocus={() => setFocusedField("name")}
    onBlur={() => setFocusedField(null)}
    onChange={(e) => setCustomName(e.target.value)}
    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"  />
  </div>


{/* COLOR */}
<div className="relative">
  <div
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPicker((prev) => !prev);
  }}
  className="w-full h-[34px] rounded-md border border-zinc-800 cursor-pointer overflow-hidden bg-zinc-950"
>
  <div
    className="w-full h-full flex items-center px-3 text-[10px]"
    style={{
      backgroundColor: customColor || undefined,
    }}
  >
    {!customColor ? t("custom.color") : null}
  </div>
</div>

  {showPicker && (
    <div
      className="
        absolute z-50 top-[42px] right-0
        w-[170px]
        bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl
        p-3
      "
      onClick={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-4 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => {
              setCustomColor(color);
              setShowPicker(false);
            }}
            className={`
              w-7 h-7 rounded-md
              transition-all duration-150
              ${customColor === color
                ? "scale-110 ring-2 ring-white"
                : "hover:scale-105"
              }
            `}
            style={{ background: color }}
          />
        ))}

        <button
          type="button"
          onClick={() => {
            setCustomColor("");
            setShowPicker(false);
          }}
          className={`
            relative w-7 h-7 rounded-md
            bg-zinc-100 border border-zinc-400
            overflow-hidden transition-all duration-150
            ${!customColor ? "scale-110 ring-2 ring-white" : "hover:scale-105"}
          `}
          aria-label="No color"
        >
          <span className="absolute left-1/2 top-1/2 w-[38px] h-[2px] bg-red-500 -translate-x-1/2 -translate-y-1/2 rotate-45" />
        </button>
      </div>
    </div>
  )}
</div>
  
</div>


            {/* ENTER DIMENSIONS */}
              <div className="flex flex-col gap-1.5">

                <div className="grid grid-cols-2 gap-2">

                  {/* WIDTH PEDAL */}
                    <input
                    type="number"
                    min={minValue}
                    max={maxValue}
                    step={units === "metric" ? 1 : 0.1}
                    placeholder={withUnit(t("custom.width"))}
                    value={customWidth}
                    onFocus={() => {
                      setFocusedField("width");
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                    }}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"                  />

                  {/* DEPTH PEDAL */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={withUnit(t("custom.depth"))}
                  value={customDepth}
                  onFocus={() => setFocusedField("depth")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCustomDepth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"                />
                </div>
              </div>

              {/* VLOTAGE + AMPERAGE (centré) */}
<div className="grid grid-cols-2 gap-2">
  <div ref={customVoltageRef} className="relative">
    <button
      type="button"
      onClick={() => setCustomVoltageOpen((v) => !v)}
      className="
        w-full py-2
        bg-zinc-950 border border-zinc-800 rounded-md
        px-3 text-[10px] text-left
        flex items-center justify-between
        hover:border-zinc-600 transition-colors
      "
    >
      <span>
        {customVoltage ? `${customVoltage}V DC` : t("customMenu.voltage")}
      </span>

      <ChevronDown
        size={14}
        className={`text-zinc-500 transition-transform ${
          customVoltageOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    {customVoltageOpen && (
      <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        {["9", "12", "18", "24"].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setCustomVoltage(v);
              setCustomVoltageOpen(false);
            }}
            className="w-full h-[25px] px-3 text-left text-[10px] flex items-center hover:bg-canvas"
          >
            {v}V DC
          </button>
        ))}
      </div>
    )}
  </div>

  <input
    type="number"
    placeholder={t("customMenu.current")}
    value={customDraw}
    onChange={(e) => setCustomDraw(e.target.value)}
    className="w-full py-2 bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
  />
</div>


<button
  onClick={() => {
addCustomItem({
  name: customName,
  color: customColor || undefined,
  voltage: Number(customVoltage) || 9,
  power: customVoltage ? `${customVoltage}V DC` : "9V DC",
  draw: Number(customDraw) || 0,
});

    setCustomName("");
    setCustomWidth("");
    setCustomDepth("");
    setCustomColor("");
    setCustomVoltage("");
    setCustomDraw("");
  }}
  disabled={!isPedalValid}
className={`
  w-full text-[10px] font-black uppercase py-2 mt-2 rounded-md
  transition-all duration-150
  ${
    isPedalValid
      ? "!text-white bg-green-700 hover:bg-green-600 cursor-pointer"
      : "bg-canvas cursor-not-allowed"
  }
`}            >
              {t("custom.addPedal")}
            </button>

          </div>

        )}

        {/* BOARD FLOW */}
        {customType === "board" && (

          <div className="flex flex-col gap-0.5">

              {/* ENTER DIMENSIONS */}
              <div className="flex flex-col gap-1.5">

                <div className="grid grid-cols-2 gap-2">

                {/* WIDTH BOARD */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={withUnit(t("custom.width"))}
                  value={customWidth}
                  onFocus={() => {
                    setFocusedField("width");
                  }}
                  onBlur={() => {
                    setFocusedField(null);
                  }}
                  onChange={(e) => setCustomWidth(e.target.value)}
className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"                />

                {/* DEPTH BOARD */}
                  <input
                  type="number"
                  min={minValue}
                  max={maxValue}
                  step={units === "metric" ? 1 : 0.1}
                  placeholder={withUnit(t("custom.depth"))}
                  value={customDepth}
                  onFocus={() => setFocusedField("depth")}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => setCustomDepth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"                />
                </div>
              </div>

<button
  onClick={() => {
    addCustomItem({ name: customName });

    setCustomName("");
    setCustomWidth("");
    setCustomDepth("");
  }}
  disabled={!isBoardValid}
className={`
  w-full mt-2 text-[10px] font-black uppercase py-2 rounded-md
  transition-all duration-150
  ${
    isBoardValid
      ? "!text-white bg-green-700 hover:bg-green-600 cursor-pointer"
      : "bg-canvas cursor-not-allowed"
  }
`}            >
              {t("custom.addBoard")}
            </button>

          </div>
          

        )}
        <div className="flex flex-col gap-2 pt-6">
  <div className="flex flex-col gap-2">
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
  {t("customMenu.importTitle")}
</div>

<div className="text-[10px] font-bold text-zinc-500">
  {t("customMenu.importSubtitle")}
</div>
  </div>

<div className="text-[9px] leading-[1.45] text-zinc-500 -mt-1">
  <div>• {t("customMenu.formats")}</div>
  <div>• {t("customMenu.maxSize")}</div>
  <div>• {t("customMenu.imageDimensions")}</div>
</div>

{!uploadImage && (
  <label className="h-[35px] rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-canvas transition-all cursor-pointer flex items-center justify-center text-[9px] font-black uppercase tracking-wide light:!text-black">
    {t("customMenu.chooseImage")}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleLocalImageUpload(e.target.files?.[0] || null)}
    />
  </label>
)}

{/* PREVIEW IMAGE */}
{uploadImage && (
  <div className="relative flex items-center justify-center py-1">
    <img
      src={uploadImage}
      alt="Custom upload preview"
      className="max-w-full max-h-[90px] object-contain"
    />

    <button
      type="button"
      aria-label="Remove image"
      onClick={() => {
        setUploadImage(null);
        setUploadImageId(null);
      }}
      className="
        absolute top-1 right-1
        w-7 h-7 rounded-full
        bg-zinc-950 border border-zinc-800
        flex items-center justify-center
        hover:border-white hover:bg-zinc-900
        active:scale-95
        transition-all duration-150
      "
    >
      <X size={14} strokeWidth={2.5} />
    </button>
  </div>
)}

<input
  type="text"
  placeholder={t("custom.namePlaceholder")}
  value={uploadModel}
  onChange={(e) => setUploadModel(e.target.value)}
  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
/>

  <div className="grid grid-cols-2 gap-2">
    <input
      type="number"
      placeholder={withUnit(t("custom.width"))}
      value={uploadWidth}
      onChange={(e) => setUploadWidth(e.target.value)}
className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"  />

    <input
  type="number"
  placeholder={withUnit(t("custom.depth"))}
  value={uploadDepth}
  onChange={(e) => setUploadDepth(e.target.value)}
  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
/>
  </div>

<div className="grid grid-cols-2 gap-2">

  <div ref={voltageRef} className="relative">
  <button
    type="button"
    onClick={() => setVoltageOpen((v) => !v)}
    className="
      w-full py-2
      bg-zinc-950 border border-zinc-800 rounded-md
      px-3 text-[10px] text-left
      flex items-center justify-between
      hover:border-zinc-600 transition-colors
    "
  >
<span>
  {uploadVoltage ? `${uploadVoltage}V DC` : t("customMenu.voltage")}
</span>

    <ChevronDown
      size={14}
      className={`text-zinc-500 transition-transform ${
        voltageOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {voltageOpen && (
    <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
      {["9", "12", "18", "24"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => {
            setUploadVoltage(v);
            setVoltageOpen(false);
          }}
          className="w-full h-[25px] px-3 text-left text-[10px] flex items-center hover:bg-canvas"
        >
          {v}V DC
        </button>
      ))}
    </div>
  )}
</div>

  <input
    type="number"
    placeholder={t("customMenu.current")}
    value={uploadDraw}
    onChange={(e) => setUploadDraw(e.target.value)}
  className="w-full py-2 bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
  />
</div>

  <button
    disabled={!isUploadValid}
    onClick={() => {
      addCustomItem({
        brand: "Custom",
        name: uploadModel || "Custom Pedal",
        slug: "custom-upload",
        type: "pedal",
        imageId: uploadImageId,
        image: uploadImage,
        image_url: uploadImage,
        photo: uploadImage,
        width:
          units === "metric"
            ? Number(uploadWidth)
            : Number(uploadWidth) * 25.4,
        depth:
          units === "metric"
            ? Number(uploadDepth)
            : Number(uploadDepth) * 25.4,
        voltage: Number(uploadVoltage) || 9,
        power: uploadVoltage ? `${uploadVoltage}V DC` : "9V DC",
        draw: Number(uploadDraw) || 0,
        weight: 0,
      });

      setUploadModel("");
      setUploadImage(null);
      setUploadImageId(null);
      setUploadWidth("");
      setUploadDepth("");
      setUploadVoltage("");
      setUploadDraw("");
    }}
className={`group w-full text-[10px] font-black uppercase py-2 mt-2 rounded-md transition-all duration-150
  ${
    isUploadValid
      ? "!text-white bg-green-700 hover:bg-green-600 cursor-pointer"
      : "bg-canvas cursor-not-allowed"
  }
`} >
    <span className={`inline-block transition-transform duration-150`}>
  {t("customMenu.add")}
</span>
  </button>
</div>

      </div>

    </div>
  );
}