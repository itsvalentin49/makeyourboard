"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
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
  const [uploadBrand, setUploadBrand] = useState("");
  const [uploadModel, setUploadModel] = useState("");
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadWidth, setUploadWidth] = useState("");
  const [uploadDepth, setUploadDepth] = useState("");
  const [uploadVoltage, setUploadVoltage] = useState("");
  const [uploadDraw, setUploadDraw] = useState("");
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


  const handleLocalImageUpload = (file: File | null) => {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = String(reader.result);
    setUploadImage(base64);
    localStorage.setItem("myb_custom_image", base64);
  };

  reader.readAsDataURL(file);
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
  {t("customMenu.title")}
</div>

<div className="text-[10px] italic font-bold text-zinc-500">
  {t("customMenu.subtitle")}
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

{customDimensionsInvalid && (
  <div className="text-[9px] font-bold text-red-500 leading-tight">
    {t("custom.dimensionError")
      .replace("{min}", String(displayMin))
      .replace("{max}", String(displayMax))
      .replaceAll("{unit}", unitLabel)}
  </div>
)}

              </div>


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

  {/* COLOR (centré) */}
  <div>

    <div
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPicker((prev) => !prev);
  }}
  className="
    w-full max-w-[120px] h-[34px]
    rounded-md border border-zinc-800
    cursor-pointer overflow-hidden
    bg-zinc-950
  "
>

<div
  className="
    w-full h-full
    flex items-center px-3
    text-[10px]
  "
  style={{
    backgroundColor:
      customColor && customColor !== "#111111"
        ? customColor
        : undefined,
  }}
>
  {!customColor || customColor === "#111111" ? t("custom.color") : null}
</div>
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
  onClick={() => {
    addCustomItem({
      name: customName,
      color: customColor ? customColor : undefined,
    });

    setCustomName("");
    setCustomWidth("");
    setCustomDepth("");
    setCustomColor("#111111");
  }}
  disabled={!isPedalValid}
className={`
  w-full text-[10px] font-black uppercase py-2 mt-2 rounded-md
  transition-all duration-150
  ${
    isPedalValid
      ? "bg-green-700 hover:bg-green-600 cursor-pointer"
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

{customDimensionsInvalid && (
  <div className="text-[9px] font-bold text-red-500 leading-tight">
    {t("custom.dimensionError")
      .replace("{min}", String(displayMin))
      .replace("{max}", String(displayMax))
      .replaceAll("{unit}", unitLabel)}
  </div>
)}

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
      ? "bg-green-700 hover:bg-green-600 cursor-pointer"
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

<div className="text-[10px] italic font-bold text-zinc-500">
  {t("customMenu.importSubtitle")}
</div>
  </div>

  <label className="h-[35px] rounded-lg border border-zinc-800 bg-zinc-950 hover:!border-white transition-all cursor-pointer flex items-center justify-center text-[9px] font-black uppercase tracking-wide light:!text-black hover:text-white

  ">
    {t("customMenu.chooseImage")}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => handleLocalImageUpload(e.target.files?.[0] || null)}
    />
  </label>

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
        localStorage.removeItem("myb_custom_image");
      }}
      className="
        absolute top-1 right-1
        w-7 h-7 rounded-full
        bg-zinc-950/90 border border-zinc-800
        flex items-center justify-center
        !text-white
        hover:text-white hover:border-white hover:bg-zinc-900
        active:scale-95
        transition-all duration-150
      "
    >
      <X size={14} strokeWidth={2.5} />
    </button>
  </div>
)}

<div className="grid grid-cols-2 gap-2">
  <input
    type="text"
    placeholder={t("customMenu.brand")}
    value={uploadBrand}
    onChange={(e) => setUploadBrand(e.target.value)}
className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600" 
  />

  <input
    type="text"
    placeholder={t("customMenu.model")}
    value={uploadModel}
    onChange={(e) => setUploadModel(e.target.value)}
className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"  />
</div>

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
      w-full h-[36px]
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
  className="w-full h-[36px] bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[10px] outline-none focus:border-zinc-600"
  />
</div>

  <button
    disabled={!uploadImage || !uploadWidth || !uploadDepth}
    onClick={() => {
      addCustomItem({
        brand: uploadBrand || "Custom",
        name: uploadModel || "Custom Pedal",
        slug: "custom-upload",
        type: "pedal",
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
        voltage: Number(uploadVoltage),
        power: `${uploadVoltage}V DC`,
        draw: Number(uploadDraw) || 0,
        weight: 0,
      });

      setUploadBrand("");
      setUploadModel("");
      setUploadImage(null);
      setUploadWidth("");
      setUploadDepth("");
      setUploadVoltage("");
      setUploadDraw("");
    }}
className={`group w-full text-[10px] font-black uppercase py-2 mt-2 rounded-md transition-all duration-150
  ${
    uploadImage && uploadWidth && uploadDepth
      ? "bg-green-700 hover:bg-green-600 cursor-pointer"
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