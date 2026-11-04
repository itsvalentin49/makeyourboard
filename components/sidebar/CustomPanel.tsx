"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, PencilRuler, Import as ImportIcon, X } from "lucide-react";
import { saveCustomImage } from "@/utils/customImageStore";
type AnyRow = Record<string, any>;
type ImportBuilderProps = {
    addCustomItem: (item: AnyRow) => void;
    units: "metric" | "imperial";
    withUnit: (label: string) => string;
    t: (key: string) => string;
};
function ImportBuilder({ addCustomItem, units, withUnit, t }: ImportBuilderProps) {
    const [uploadModel, setUploadModel] = useState("");
    const [uploadImage, setUploadImage] = useState<string | null>(null);
    const [uploadImageId, setUploadImageId] = useState<string | null>(null);
    const [uploadWidth, setUploadWidth] = useState("");
    const [uploadDepth, setUploadDepth] = useState("");
    const [uploadVoltage, setUploadVoltage] = useState("");
    const [uploadDraw, setUploadDraw] = useState("");
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRequest = useRef(0);
    const id = React.useId();
    useEffect(() => () => { imageRequest.current += 1; }, []);
    const widthMm = units === "metric" ? Number(uploadWidth) : Number(uploadWidth) * 25.4;
    const depthMm = units === "metric" ? Number(uploadDepth) : Number(uploadDepth) * 25.4;
    const dimensionsValid = widthMm >= 30 && widthMm <= 500 && depthMm >= 30 && depthMm <= 500;
    const drawValid = uploadDraw.trim() === "" || (Number.isFinite(Number(uploadDraw)) && Number(uploadDraw) > 0);
    const isUploadValid = Boolean(uploadImage && uploadImageId) && dimensionsValid && drawValid && !imageLoading;
    const min = units === "metric" ? 30 : 30 / 25.4;
    const max = units === "metric" ? 500 : 500 / 25.4;
    const displayLimit = (value: number) => Number(value.toFixed(2)).toString();
    const dimensionHint = t("customPanel.enclosureDimensions")
        .replaceAll("{min}", displayLimit(min)).replaceAll("{max}", displayLimit(max))
        .replaceAll("{unit}", units === "metric" ? "mm" : "in");
    const fieldClass = "h-[34px] w-full min-w-0 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-[10px]";
    const removeImage = () => {
        imageRequest.current += 1;
        setUploadImage(null);
        setUploadImageId(null);
        setImageLoading(false);
        setImageError("");
    };
    const handleLocalImageUpload = async (file: File | null) => {
        if (!file)
            return;
        const request = ++imageRequest.current;
        setImageLoading(false);
        setImageError("");
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
            setImageError(t("customPanel.invalidImageFormat"));
            return;
        }
        if (file.size > 300000) {
            setImageError(t("customPanel.imageTooLarge"));
            return;
        }
        setImageLoading(true);
        try {
            // A data URL remains valid after the form resets and the canvas takes over.
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            const imageId = await saveCustomImage(file);
            if (request !== imageRequest.current)
                return;
            setUploadImageId(imageId);
            setUploadImage(preview);
        }
        catch {
            if (request === imageRequest.current)
                setImageError(t("customPanel.imageLoadError"));
        }
        finally {
            if (request === imageRequest.current)
                setImageLoading(false);
        }
    };
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isUploadValid)
            return;
        addCustomItem({
            brand: "Custom",
            name: uploadModel.trim() || t("customPanel.defaultPedalName"),
            slug: "custom-upload", type: "pedal",
            imageId: uploadImageId, image: uploadImage, image_url: uploadImage, photo: uploadImage,
            width: widthMm, depth: depthMm,
            voltage: Number(uploadVoltage) || 9,
            power: uploadVoltage ? `${uploadVoltage}V DC` : "9V DC",
            draw: uploadDraw.trim() ? Number(uploadDraw) : null,
            weight: 0,
        });
        removeImage();
        setUploadModel("");
        setUploadWidth("");
        setUploadDepth("");
        setUploadVoltage("");
        setUploadDraw("");
    };
    return (<form onSubmit={submit} className="mt-3 flex flex-col gap-3 pb-4">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, alignItems: "start" }}>
            <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={`${id}-image`} className="text-[10px] font-medium">{t("customPanel.chooseImage")}</label>
                <input ref={fileInputRef} id={`${id}-image`} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => {
                    void handleLocalImageUpload(event.target.files?.[0] || null);
                    event.target.value = "";
                }} />
                {uploadImage ? <div role="status" className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-[10px] font-medium" style={{ height: 34, padding: "0 8px" }}>
                    <Check size={16} className="shrink-0 text-emerald-500" aria-hidden="true" />
                    <span>{t("customPanel.imageLoaded")}</span>
                </div> : <button type="button" aria-label={t("customPanel.chooseImage")} aria-busy={imageLoading} onClick={() => fileInputRef.current?.click()} disabled={imageLoading} style={{ height: 34, minHeight: 34, padding: "0 12px" }} className="myb-import-image flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-[10px] font-bold disabled:opacity-50">
                    <ImportIcon size={18} className="shrink-0" />
                </button>}
            </div>
            <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium">
                {t("customPanel.namePlaceholder")}
                <input type="text" aria-label={t("customPanel.namePlaceholder")} value={uploadModel} onChange={event => setUploadModel(event.target.value)} className={fieldClass} />
            </label>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-400">{t("customPanel.imageHint")}</p>
        {imageError && <p role="alert" className="text-[10px] text-red-400">{imageError}</p>}
        <div className="flex flex-col gap-1.5">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium">
                    {withUnit(t("customPanel.width"))}
                    <input type="number" aria-label={withUnit(t("customPanel.width"))} required min={min} max={max} step="any" inputMode="decimal" value={uploadWidth} onChange={event => setUploadWidth(event.target.value)} aria-describedby={`${id}-dimensions`} className={fieldClass} />
                </label>
                <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium">
                    {withUnit(t("customPanel.depth"))}
                    <input type="number" aria-label={withUnit(t("customPanel.depth"))} required min={min} max={max} step="any" inputMode="decimal" value={uploadDepth} onChange={event => setUploadDepth(event.target.value)} aria-describedby={`${id}-dimensions`} className={fieldClass} />
                </label>
            </div>
            <p id={`${id}-dimensions`} className="text-[9px] leading-relaxed text-zinc-400">{dimensionHint}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium">
                {t("customPanel.voltage")}
                <select aria-label={t("customPanel.voltage")} value={uploadVoltage} onChange={event => setUploadVoltage(event.target.value)} className={fieldClass}>
                    <option value="">9 V DC</option>
                    {[12, 18, 24].map(voltage => <option key={voltage} value={voltage}>{voltage} V DC</option>)}
                </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium">
                {t("customPanel.consumption")}
                <input type="number" aria-label={t("customPanel.consumption")} min={0} step="any" inputMode="decimal" value={uploadDraw} onChange={event => setUploadDraw(event.target.value)} className={fieldClass} />
            </label>
        </div>
        {uploadImage && <div className="mt-2 flex flex-col gap-2">
            <div className="text-[10px] font-medium">{t("export.preview")}</div>
            <div className="relative flex min-h-[120px] items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-4">
                <img src={uploadImage} alt={uploadModel || t("export.preview")} draggable={false} style={{ display: "block", maxWidth: "100%", width: "auto", height: 100, objectFit: "contain" }} />
                <button type="button" onClick={removeImage} aria-label={t("customPanel.removeImage")} title={t("customPanel.removeImage")} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md hover:bg-zinc-800" style={{ cursor: "pointer" }}><X size={16} /></button>
            </div>
        </div>}
        <button type="submit" disabled={!isUploadValid} className="mt-1 flex h-[34px] w-full items-center justify-center rounded-md bg-blue-600 text-[10px] font-black uppercase !text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
            {t("customPanel.addToBoard")}
        </button>
    </form>);
}
type CustomBuilderProps = {
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
    addCustomItem: (item: AnyRow) => void;
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
type PresetColor = {
    value: string;
    label: string;
};
type BoardTexture = "black" | "wood" | "aluminium";
type BoardTextureOption = {
    value: BoardTexture;
    label: string;
    image: string;
};
type LocationValue = "top" | "bottom" | "left" | "right";
type LocationOption = {
    value: LocationValue;
    label: string;
};
type LocationDropdownProps = {
    label: string;
    locations: LocationValue[];
    setLocations: React.Dispatch<React.SetStateAction<LocationValue[]>>;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    options: LocationOption[];
    closeOtherMenus: () => void;
};
function LocationDropdown({ label, locations, setLocations, open, setOpen, containerRef, options, closeOtherMenus, }: LocationDropdownProps) {
    const toggleLocation = (location: LocationValue) => {
        setLocations((current) => current.includes(location)
            ? current.filter((item) => item !== location)
            : [...current, location]);
    };
    return (<div className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{label}</span><div ref={containerRef} className="relative h-[34px]">
        <button type="button" onClick={() => {
            const nextOpen = !open;
            closeOtherMenus();
            setOpen(nextOpen);
        }} className="
          w-full
          h-[34px]
          px-3
          bg-zinc-950
          border
          border-zinc-800
          rounded-md
          text-[10px]
          text-left
          flex
          items-center
          justify-between
          hover:border-zinc-600
          transition-colors
        ">
            <span className="truncate">
                {options.filter(option => locations.includes(option.value)).map(option => option.label).join(", ") || "—"}
            </span>
            <ChevronDown size={14} className={`
            ml-2
            shrink-0
            text-zinc-500
            transition-transform
            ${open ? "rotate-180" : ""}
          `} />
        </button>
        {open && (<div className="
            absolute
            z-50
            top-full
            mt-1
            left-0
            w-full
            bg-zinc-950
            border
            border-zinc-800
            rounded-lg
            overflow-hidden
            shadow-2xl
          ">
            {options.map((option) => {
                const selected = locations.includes(option.value);
                return (<button key={option.value} type="button" onClick={() => {
                    toggleLocation(option.value);
                }} className="
                  w-full
                  h-[30px]
                  px-3
                  flex
                  items-center
                  justify-between
                  text-left
                  text-[10px]
                  hover:bg-canvas
                  transition-colors
                ">
                    <span>{option.label}</span>
                    <span className={`
                    w-[16px]
                    h-[16px]
                    rounded-[4px]
                    border
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${selected
                            ? "border-blue-500 bg-blue-500"
                            : "border-zinc-500 bg-transparent"}
                  `}>
                        {selected && (<Check size={12} strokeWidth={3} className="text-white" />)}
                    </span>
                </button>);
            })}
        </div>)}
    </div></div>);
}
function CustomBuilder({ customType, setCustomType, customName, setCustomName, customWidth, setCustomWidth, customDepth, setCustomDepth, customColor, setCustomColor, addCustomItem, isPedalValid, isBoardValid, minValue, maxValue, displayMin, displayMax, units, unitLabel, withUnit, t, }: CustomBuilderProps) {
    const DEFAULT_JACK_LOCATIONS: LocationValue[] = [
        "left",
        "right",
    ];
    const DEFAULT_POWER_LOCATIONS: LocationValue[] = [
        "top",
    ];
    const BOARD_TEXTURES: BoardTextureOption[] = [
        {
            value: "black",
            label: t("boardTextures.black"),
            image: "/images/board-black.webp",
        },
        {
            value: "wood",
            label: t("boardTextures.wood"),
            image: "/images/board-wood.webp",
        },
        {
            value: "aluminium",
            label: t("boardTextures.aluminium"),
            image: "/images/board-aluminium.webp",
        },
    ];
    const [customColorOpen, setCustomColorOpen] = useState(false);
    const [hasSelectedColor, setHasSelectedColor] = useState(false);
    const [customVoltage, setCustomVoltage] = useState("");
    const [customDraw, setCustomDraw] = useState("");
    const [customVoltageOpen, setCustomVoltageOpen] = useState(false);
    const [boardTexture, setBoardTexture] = useState<BoardTexture>("wood");
    const [boardTextureOpen, setBoardTextureOpen] = useState(false);
    const [jackLocations, setJackLocations] = useState<LocationValue[]>(DEFAULT_JACK_LOCATIONS);
    const [powerLocations, setPowerLocations] = useState<LocationValue[]>(DEFAULT_POWER_LOCATIONS);
    const [jackLocationsOpen, setJackLocationsOpen] = useState(false);
    const [powerLocationsOpen, setPowerLocationsOpen] = useState(false);
    const customColorRef = useRef<HTMLDivElement>(null);
    const customVoltageRef = useRef<HTMLDivElement>(null);
    const boardTextureRef = useRef<HTMLDivElement>(null);
    const jackLocationsRef = useRef<HTMLDivElement>(null);
    const powerLocationsRef = useRef<HTMLDivElement>(null);
    const PRESET_COLORS: PresetColor[] = [
        {
            value: "",
            label: t("colors.aluminium"),
        },
        {
            value: "#111111",
            label: t("colors.black"),
        },
        {
            value: "#ffffff",
            label: t("colors.white"),
        },
        {
            value: "#b91c1c",
            label: t("colors.red"),
        },
        {
            value: "#92400e",
            label: t("colors.brown"),
        },
        {
            value: "#065f46",
            label: t("colors.green"),
        },
        {
            value: "#1e3a8a",
            label: t("colors.blue"),
        },
        {
            value: "#6b21a8",
            label: t("colors.purple"),
        },
        {
            value: "#374151",
            label: t("colors.gray"),
        },
        {
            value: "#facc15",
            label: t("colors.yellow"),
        },
        {
            value: "#ea580c",
            label: t("colors.orange"),
        },
        {
            value: "#be185d",
            label: t("colors.pink"),
        },
    ];
    const LOCATION_OPTIONS: LocationOption[] = [
        {
            value: "top",
            label: t("locations.top"),
        },
        {
            value: "bottom",
            label: t("locations.bottom"),
        },
        {
            value: "left",
            label: t("locations.left"),
        },
        {
            value: "right",
            label: t("locations.right"),
        },
    ];
    const selectedColor = PRESET_COLORS.find((color) => color.value === customColor) || PRESET_COLORS[0];
    const selectedBoardTexture = BOARD_TEXTURES.find((texture) => texture.value === boardTexture) || BOARD_TEXTURES[0];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (customVoltageRef.current &&
                !customVoltageRef.current.contains(target)) {
                setCustomVoltageOpen(false);
            }
            if (customColorRef.current &&
                !customColorRef.current.contains(target)) {
                setCustomColorOpen(false);
            }
            if (boardTextureRef.current &&
                !boardTextureRef.current.contains(target)) {
                setBoardTextureOpen(false);
            }
            if (jackLocationsRef.current &&
                !jackLocationsRef.current.contains(target)) {
                setJackLocationsOpen(false);
            }
            if (powerLocationsRef.current &&
                !powerLocationsRef.current.contains(target)) {
                setPowerLocationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const resetCommonFields = () => {
        setCustomName("");
        setCustomWidth("");
        setCustomDepth("");
    };
    const closeAllMenus = () => {
        setCustomColorOpen(false);
        setCustomVoltageOpen(false);
        setBoardTextureOpen(false);
        setJackLocationsOpen(false);
        setPowerLocationsOpen(false);
    };
    const resetPedalFields = () => {
        resetCommonFields();
        setCustomColor("");
        setHasSelectedColor(false);
        setCustomVoltage("");
        setCustomDraw("");
        setJackLocations([
            ...DEFAULT_JACK_LOCATIONS,
        ]);
        setPowerLocations([
            ...DEFAULT_POWER_LOCATIONS,
        ]);
        closeAllMenus();
    };
    const resetBoardFields = () => {
        resetCommonFields();
        setBoardTexture("wood");
        closeAllMenus();
    };
    const selectCustomType = (type: "pedal" | "board") => {
        setCustomType(type);
        resetCommonFields();
        closeAllMenus();
    };
    /*
      Valeurs par défaut utilisées lorsque les dimensions
      ne sont pas encore saisies.
    */
    const DEFAULT_PEDAL_PREVIEW_WIDTH_MM = 70;
    const DEFAULT_PEDAL_PREVIEW_DEPTH_MM = 110;
    const DEFAULT_BOARD_PREVIEW_WIDTH_MM = 406.4;
    const DEFAULT_BOARD_PREVIEW_DEPTH_MM = 203.2;
    const enteredWidth = Number(customWidth);
    const enteredDepth = Number(customDepth);
    const defaultPreviewWidthMm = customType === "board"
        ? DEFAULT_BOARD_PREVIEW_WIDTH_MM
        : DEFAULT_PEDAL_PREVIEW_WIDTH_MM;
    const defaultPreviewDepthMm = customType === "board"
        ? DEFAULT_BOARD_PREVIEW_DEPTH_MM
        : DEFAULT_PEDAL_PREVIEW_DEPTH_MM;
    const previewWidthMm = enteredWidth > 0
        ? units === "metric"
            ? enteredWidth
            : enteredWidth * 25.4
        : defaultPreviewWidthMm;
    const previewDepthMm = enteredDepth > 0
        ? units === "metric"
            ? enteredDepth
            : enteredDepth * 25.4
        : defaultPreviewDepthMm;
    /*
      Le board utilise une largeur maximale plus petite
      afin de conserver davantage de marge sur les côtés.
    */
    const previewMaxWidth = customType === "board" ? 215 : 170;
    const previewMaxHeight = 100;
    const previewScale = Math.min(previewMaxWidth / previewWidthMm, previewMaxHeight / previewDepthMm);
    const previewWidthPx = Math.max(customType === "board" ? 80 : 38, previewWidthMm * previewScale);
    const previewHeightPx = Math.max(customType === "board" ? 36 : 55, previewDepthMm * previewScale);
    /*
      Valeurs identiques au rendu Custom Pedal du canvas.
    */
    const CANVAS_KNOB_SIZE = 25;
    const CANVAS_FOOTSWITCH_SIZE = 18;
    const CANVAS_KNOB_TOP = 14;
    const CANVAS_FOOTSWITCH_TOP_FROM_BOTTOM = 30;
    const CANVAS_HARDWARE_SPREAD = 1.25;
    const CANVAS_TEXT_SIZE = 8;
    const previewKnobSizePx = CANVAS_KNOB_SIZE * previewScale;
    const previewFootswitchSizePx = CANVAS_FOOTSWITCH_SIZE * previewScale;
    const previewKnobTopPx = CANVAS_KNOB_TOP * previewScale;
    const previewFootswitchTopPx = previewHeightPx -
        CANVAS_FOOTSWITCH_TOP_FROM_BOTTOM *
        previewScale;
    const previewTextSizePx = CANVAS_TEXT_SIZE * previewScale;
    const previewHideHardware = previewWidthMm < 70 &&
        previewDepthMm < 70;
    const previewKnobCount = previewWidthMm < 70
        ? 1
        : previewWidthMm <= 100
            ? 2
            : 3;
    const previewSideJackWidth = 14 * previewScale;
    const previewSideJackHeight = 18 * previewScale;
    const previewHorizontalJackWidth = 18 * previewScale;
    const previewHorizontalJackHeight = 14 * previewScale;
    const PREVIEW_JACK_OUTSIDE_RATIO = 0.55;
    const previewSideJackOffset = previewSideJackWidth *
        PREVIEW_JACK_OUTSIDE_RATIO;
    const previewHorizontalJackOffset = previewHorizontalJackHeight *
        PREVIEW_JACK_OUTSIDE_RATIO;
    return (<div className="
        flex
        flex-col
        mt-4
        pb-4
      ">
        <div className="flex flex-col gap-0">
            <div role="group" aria-label={t("customPanel.itemType")} className="rounded-lg bg-zinc-950 p-0.5" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 4 }}>
                {(["pedal", "board"] as const).map(type => <button key={type} type="button" aria-pressed={customType === type} onClick={() => selectCustomType(type)} className="h-[34px] rounded-md text-[10px] font-black uppercase tracking-wide" style={{ border: customType === type ? "1px solid #a1a1aa" : "1px solid transparent", background: customType === type ? "rgba(140,140,150,.18)" : "transparent" }}>{t(type === "pedal" ? "customPanel.pedal" : "customPanel.board")}</button>)}
            </div>
            {/* FORMULAIRE PÉDALE */}
            {customType === "pedal" && (<div className="flex flex-col gap-2 mt-2">
                {/* NOM + COULEUR */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{t("customPanel.namePlaceholder")}</span><input type="text" aria-label={t("customPanel.namePlaceholder")} value={customName} onChange={(event) => setCustomName(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                    {/* COULEUR */}
                    <div className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{t("customPanel.color")}</span><div ref={customColorRef} className="relative h-[34px]">
                        <button type="button" onClick={() => {
                            const nextOpen = !customColorOpen;
                            closeAllMenus();
                            setCustomColorOpen(nextOpen);
                        }} className="
                    w-full
                    h-[34px]
                    px-3
                    bg-zinc-950
                    border
                    border-zinc-800
                    rounded-md
                    text-[10px]
                    text-left
                    flex
                    items-center
                    justify-between
                    hover:border-zinc-600
                    transition-colors
                  ">
                            <span className="truncate">
                                {hasSelectedColor
                                    ? selectedColor.label
                                    : "—"}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                                {hasSelectedColor &&
                                    (selectedColor.value ? (<span className="
                            block
                            w-[16px]
                            h-[16px]
                            rounded-[4px]
                            border
                            border-zinc-600
                            shrink-0
                          " style={{
                                            backgroundColor: selectedColor.value,
                                        }} />) : (<span className="
                            relative
                            block
                            w-[16px]
                            h-[16px]
                            rounded-[4px]
                            border
                            border-zinc-500
                            bg-zinc-200
                            overflow-hidden
                            shrink-0
                          ">
                                            <span className="
                              absolute
                              left-1/2
                              top-1/2
                              w-[22px]
                              h-[2px]
                              bg-red-500
                              -translate-x-1/2
                              -translate-y-1/2
                              rotate-45
                            "/>
                                        </span>))}
                                <ChevronDown size={14} className={`
                        text-zinc-500
                        transition-transform
                        ${customColorOpen
                                        ? "rotate-180"
                                        : ""}
                      `} />
                            </div>
                        </button>
                        {customColorOpen && (<div className="
                      absolute
                      z-50
                      top-full
                      mt-1
                      left-0
                      w-full
                      max-h-[210px]
                      overflow-y-auto
                      no-scrollbar
                      bg-zinc-950
                      border
                      border-zinc-800
                      rounded-lg
                      shadow-2xl
                    ">
                            {PRESET_COLORS.map((color) => {
                                const active = hasSelectedColor &&
                                    customColor ===
                                    color.value;
                                return (<button key={color.value ||
                                    "aluminium"} type="button" onClick={() => {
                                        setCustomColor(color.value);
                                        setHasSelectedColor(true);
                                        setCustomColorOpen(false);
                                    }} className={`
                              w-full
                              h-[30px]
                              px-3
                              flex
                              items-center
                              justify-between
                              text-left
                              text-[10px]
                              transition-colors
                              hover:bg-canvas
                              ${active
                                            ? "font-black"
                                            : "font-normal"}
                            `}>
                                    <span>
                                        {color.label}
                                    </span>
                                    {color.value ? (<span className="
                                  block
                                  w-[16px]
                                  h-[16px]
                                  rounded-[4px]
                                  border
                                  border-zinc-600
                                  shrink-0
                                " style={{
                                            backgroundColor: color.value,
                                        }} />) : (<span className="
                                  relative
                                  block
                                  w-[16px]
                                  h-[16px]
                                  rounded-[4px]
                                  border
                                  border-zinc-500
                                  bg-zinc-200
                                  overflow-hidden
                                  shrink-0
                                ">
                                            <span className="
                                    absolute
                                    left-1/2
                                    top-1/2
                                    w-[22px]
                                    h-[2px]
                                    bg-red-500
                                    -translate-x-1/2
                                    -translate-y-1/2
                                    rotate-45
                                  "/>
                                        </span>)}
                                </button>);
                            })}
                        </div>)}
                    </div></div>
                </div>
                {/* LARGEUR + PROFONDEUR */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{withUnit(t("customPanel.width"))}</span><input type="number" min={minValue} max={maxValue} step={units === "metric"
                        ? 1
                        : 0.1} aria-label={withUnit(t("customPanel.width"))} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{withUnit(t("customPanel.depth"))}</span><input type="number" min={minValue} max={maxValue} step={units === "metric"
                        ? 1
                        : 0.1} aria-label={withUnit(t("customPanel.depth"))} value={customDepth} onChange={(event) => setCustomDepth(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                </div>
                <p className="text-[9px] leading-relaxed text-zinc-400">{t("customPanel.enclosureDimensions").replace("{min}", String(displayMin)).replace("{max}", String(displayMax)).replace("{unit}", unitLabel)}</p>
                {/* JACKS + ALIMENTATION */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <LocationDropdown label={t("customPanel.jackLocations")} locations={jackLocations} setLocations={setJackLocations} open={jackLocationsOpen} setOpen={setJackLocationsOpen} containerRef={jackLocationsRef} options={LOCATION_OPTIONS} closeOtherMenus={closeAllMenus} />
                    <LocationDropdown label={t("customPanel.powerLocations")} locations={powerLocations} setLocations={setPowerLocations} open={powerLocationsOpen} setOpen={setPowerLocationsOpen} containerRef={powerLocationsRef} options={LOCATION_OPTIONS} closeOtherMenus={closeAllMenus} />
                </div>
                {/* VOLTAGE + AMPÉRAGE */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <div className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{t("customPanel.voltage")}</span><div ref={customVoltageRef} className="relative h-[34px]">
                        <button type="button" onClick={() => {
                            const nextOpen = !customVoltageOpen;
                            closeAllMenus();
                            setCustomVoltageOpen(nextOpen);
                        }} className="
                    w-full
                    h-[34px]
                    px-3
                    bg-zinc-950
                    border
                    border-zinc-800
                    rounded-md
                    text-[10px]
                    text-left
                    flex
                    items-center
                    justify-between
                    hover:border-zinc-600
                    transition-colors
                  ">
                            <span>
                                {customVoltage
                                    ? `${customVoltage}V DC`
                                    : "9 V DC"}
                            </span>
                            <ChevronDown size={14} className={`
                      text-zinc-500
                      transition-transform
                      ${customVoltageOpen
                                    ? "rotate-180"
                                    : ""}
                    `} />
                        </button>
                        {customVoltageOpen && (<div className="
                      absolute
                      z-50
                      top-full
                      mt-1
                      w-full
                      bg-zinc-950
                      border
                      border-zinc-800
                      rounded-lg
                      overflow-hidden
                    ">
                            {[
                                "9",
                                "12",
                                "18",
                                "24",
                            ].map((voltage) => (<button key={voltage} type="button" onClick={() => {
                                setCustomVoltage(voltage);
                                setCustomVoltageOpen(false);
                            }} className="
                          w-full
                          h-[25px]
                          px-3
                          text-left
                          text-[10px]
                          flex
                          items-center
                          hover:bg-canvas
                        ">
                                {voltage}V DC
                            </button>))}
                        </div>)}
                    </div></div>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{t("customPanel.current")}</span><input type="number" min={0} aria-label={t("customPanel.current")} value={customDraw} onChange={(event) => setCustomDraw(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                </div>
                {/* APERÇU PÉDALE */}
                <div className="flex flex-col gap-2 mt-2">
                    <div className="text-[10px] font-medium">
                        {t("export.preview")}
                    </div>
                    <div className="
                  min-h-[120px]
                  rounded-lg
                  border
                  border-zinc-800
                  bg-zinc-950
                  px-4
                  py-4
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                ">
                        <div className="
                    relative
                    shrink-0
                    overflow-visible
                  " style={{
                                width: `${previewWidthPx}px`,
                                height: `${previewHeightPx}px`,
                            }}>
                            {/* JACK GAUCHE */}
                            {jackLocations.includes("left") && (<img src="/images/jack-left.webp" alt="" draggable={false} className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      " style={{
                                    width: `${previewSideJackWidth}px`,
                                    height: `${previewSideJackHeight}px`,
                                    left: `${-previewSideJackOffset}px`,
                                    top: `${previewHeightPx / 2 -
                                        previewSideJackHeight / 2}px`,
                                }} />)}
                            {/* JACK DROIT */}
                            {jackLocations.includes("right") && (<img src="/images/jack-right.webp" alt="" draggable={false} className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      " style={{
                                    width: `${previewSideJackWidth}px`,
                                    height: `${previewSideJackHeight}px`,
                                    right: `${-previewSideJackOffset}px`,
                                    top: `${previewHeightPx / 2 -
                                        previewSideJackHeight / 2}px`,
                                }} />)}
                            {/* JACK BAS */}
                            {jackLocations.includes("bottom") && (<img src="/images/jack-down.webp" alt="" draggable={false} className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      " style={{
                                    width: `${previewHorizontalJackWidth}px`,
                                    height: `${previewHorizontalJackHeight}px`,
                                    left: `${previewWidthPx / 2 -
                                        previewHorizontalJackWidth / 2}px`,
                                    bottom: `${-previewHorizontalJackOffset}px`,
                                }} />)}
                            {/* JACKS DU HAUT */}
                            {jackLocations.includes("top") && (<>
                                <img src="/images/jack-top.webp" alt="" draggable={false} className="
                          absolute
                          z-0
                          object-contain
                          pointer-events-none
                        " style={{
                                        width: `${previewHorizontalJackWidth}px`,
                                        height: `${previewHorizontalJackHeight}px`,
                                        left: `${previewWidthPx * 0.3 -
                                            previewHorizontalJackWidth / 2}px`,
                                        top: `${-previewHorizontalJackOffset}px`,
                                    }} />
                                <img src="/images/jack-top.webp" alt="" draggable={false} className="
                          absolute
                          z-0
                          object-contain
                          pointer-events-none
                        " style={{
                                        width: `${previewHorizontalJackWidth}px`,
                                        height: `${previewHorizontalJackHeight}px`,
                                        left: `${previewWidthPx * 0.7 -
                                            previewHorizontalJackWidth / 2}px`,
                                        top: `${-previewHorizontalJackOffset}px`,
                                    }} />
                            </>)}
                            {/* ENCLOSURE */}
                            <div className="
                      absolute
                      inset-0
                      z-10
                      overflow-hidden
                      rounded-[6px]
                      shadow-lg
                      transition-all
                      duration-200
                    ">
                                <img src="/images/custom-pedal.webp" alt="" draggable={false} className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-fill
                        pointer-events-none
                      "/>
                                {customColor && (<div className="
                          absolute
                          inset-0
                          pointer-events-none
                        " style={{
                                        backgroundColor: customColor,
                                        opacity: 0.7,
                                    }} />)}
                                {/* POTENTIOMÈTRES */}
                                {!previewHideHardware &&
                                    Array.from({
                                        length: previewKnobCount,
                                    }).map((_, index) => {
                                        const spacing = previewWidthPx /
                                            (previewKnobCount + 1);
                                        const offsetFromCenter = (index -
                                            (previewKnobCount - 1) / 2) *
                                            spacing *
                                            CANVAS_HARDWARE_SPREAD;
                                        return (<img key={index} src="/images/knob.webp" alt="" draggable={false} className="
          absolute
          object-contain
          pointer-events-none
        " style={{
                                                width: `${previewKnobSizePx}px`,
                                                height: `${previewKnobSizePx}px`,
                                                left: `${previewWidthPx / 2 +
                                                    offsetFromCenter -
                                                    previewKnobSizePx / 2}px`,
                                                top: `${previewKnobTopPx}px`,
                                            }} />);
                                    })}
                                {/* NOM */}
                                <div className="
                        absolute
                        left-1/2
                        top-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        w-[88%]
                        text-center
                        text-black
                        font-black
                        uppercase
                        leading-none
                        break-words
                        pointer-events-none
                      " style={{
                                        fontSize: `${previewTextSizePx}px`,
                                    }}>
                                    {customName.trim() ||
                                        "CUSTOM"}
                                </div>
                                {/* FOOTSWITCH */}
                                {!previewHideHardware && (<img src="/images/footswitch.webp" alt="" draggable={false} className="
      absolute
      object-contain
      pointer-events-none
    " style={{
                                        width: `${previewFootswitchSizePx}px`,
                                        height: `${previewFootswitchSizePx}px`,
                                        left: `${previewWidthPx / 2 -
                                            previewFootswitchSizePx / 2}px`,
                                        top: `${previewFootswitchTopPx}px`,
                                    }} />)}
                            </div>
                        </div>
                    </div>
                </div>
                {/* AJOUTER LA PÉDALE */}
                <button type="button" disabled={!isPedalValid} onClick={() => {
                    addCustomItem({
                        name: customName,
                        color: customColor ||
                            undefined,
                        voltage: Number(customVoltage) ||
                            9,
                        power: customVoltage
                            ? `${customVoltage}V DC`
                            : "9V DC",
                        draw: Number(customDraw) || 0,
                        jacksLocation: jackLocations.join(", "),
                        powerLocation: powerLocations.join(", "),
                    });
                    resetPedalFields();
                }} className={`
                w-full
                h-[34px]
                mt-2
                rounded-md
bg-blue-600
hover:bg-blue-500
                !text-white
                text-[10px]
                font-black
                uppercase
                transition-all
                duration-150
                ${isPedalValid
                        ? "cursor-pointer"
                        : "cursor-not-allowed"}
              `}>
                    {t("customPanel.addToBoard")}
                </button>
            </div>)}
            {/* FORMULAIRE BOARD */}
            {customType === "board" && (<div className="flex flex-col gap-2 mt-2">
                {/* LARGEUR + PROFONDEUR */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{withUnit(t("customPanel.width"))}</span><input type="number" min={minValue} max={maxValue} step={units === "metric"
                        ? 1
                        : 0.1} aria-label={withUnit(t("customPanel.width"))} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                    <label className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{withUnit(t("customPanel.depth"))}</span><input type="number" min={minValue} max={maxValue} step={units === "metric"
                        ? 1
                        : 0.1} aria-label={withUnit(t("customPanel.depth"))} value={customDepth} onChange={(event) => setCustomDepth(event.target.value)} className="
                  w-full
                  h-[34px]
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  px-3
                  text-[10px]
                  outline-none
                  focus:border-zinc-600
                "/></label>
                </div>
                <p className="text-[9px] leading-relaxed text-zinc-400">{t("customPanel.enclosureDimensions").replace("{min}", String(displayMin)).replace("{max}", String(displayMax)).replace("{unit}", unitLabel)}</p>
                {/* MENU DÉROULANT TYPE DE BOARD */}
                <div className="flex min-w-0 flex-col gap-1.5 text-[10px] font-medium"><span>{t("customPanel.boardFinish")}</span><div ref={boardTextureRef} className="relative h-[40px] mt-1">
                    <button type="button" onClick={() => {
                        const nextOpen = !boardTextureOpen;
                        closeAllMenus();
                        setBoardTextureOpen(nextOpen);
                    }} className="
                  w-full
                  h-[40px]
                  px-3
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-md
                  text-[10px]
                  text-left
                  flex
                  items-center
                  justify-between
                  hover:border-zinc-600
                  transition-colors
                ">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="
                      w-[48px]
                      h-[24px]
                      rounded-[4px]
                      border
                      border-zinc-700
                      overflow-hidden
                      shrink-0
                      bg-zinc-900
                    ">
                                <img src={selectedBoardTexture.image} alt="" draggable={false} className="
                        block
                        w-full
                        h-full
                        object-cover
                        pointer-events-none
                      "/>
                            </div>
                            <span className="truncate font-bold">
                                {selectedBoardTexture.label}
                            </span>
                        </div>
                        <ChevronDown size={14} className={`
                    ml-3
                    shrink-0
                    text-zinc-500
                    transition-transform
                    ${boardTextureOpen
                                ? "rotate-180"
                                : ""}
                  `} />
                    </button>
                    {boardTextureOpen && (<div className="
                    absolute
                    z-50
                    top-full
                    mt-1
                    left-0
                    w-full
                    bg-zinc-950
                    border
                    border-zinc-800
                    rounded-lg
                    overflow-hidden
                    shadow-2xl
                  ">
                        {BOARD_TEXTURES.map((texture) => {
                            const active = boardTexture ===
                                texture.value;
                            return (<button key={texture.value} type="button" onClick={() => {
                                setBoardTexture(texture.value);
                                setBoardTextureOpen(false);
                            }} className={`
                            w-full
                            h-[42px]
                            px-3
                            flex
                            items-center
                            justify-between
                            text-left
                            text-[10px]
                            hover:bg-canvas
                            transition-colors
                            ${active
                                    ? "font-black"
                                    : "font-normal"}
                          `}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="
                                w-[48px]
                                h-[24px]
                                rounded-[4px]
                                border
                                border-zinc-700
                                overflow-hidden
                                shrink-0
                                bg-zinc-900
                              ">
                                        <img src={texture.image} alt="" draggable={false} className="
                                  block
                                  w-full
                                  h-full
                                  object-cover
                                  pointer-events-none
                                "/>
                                    </div>
                                    <span className="truncate">
                                        {texture.label}
                                    </span>
                                </div>
                                <span className={`
                              w-[16px]
                              h-[16px]
                              rounded-full
                              border
                              flex
                              items-center
                              justify-center
                              shrink-0
                              ${active
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-zinc-500 bg-transparent"}
                            `}>
                                    {active && (<Check size={11} strokeWidth={3} className="text-white" />)}
                                </span>
                            </button>);
                        })}
                    </div>)}
                </div></div>
                {/* APERÇU BOARD */}
                <div className="flex flex-col gap-2 mt-3">
                    <div className="text-[11px] font-black uppercase tracking-wide">
                        {t("export.preview")}
                    </div>
                    <div className="
    rounded-lg
    border
    border-zinc-800
    bg-zinc-950
    px-5
    py-4
    flex
    items-center
    justify-center
    overflow-hidden
  ">
                        <div className="
                    relative
                    shrink-0
                    overflow-hidden
                    rounded-[6px]
                    shadow-lg
                    transition-all
                    duration-200
                  " style={{
                                width: `${previewWidthPx}px`,
                                height: `${previewHeightPx}px`,
                            }}>
                            <img src={selectedBoardTexture.image} alt={`Board ${selectedBoardTexture.label}`} draggable={false} className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-fill
                      pointer-events-none
                    "/>
                        </div>
                    </div>
                </div>
                {/* AJOUTER LE BOARD */}
                <button type="button" disabled={!isBoardValid} onClick={() => {
                    addCustomItem({
                        name: customName.trim() ||
                            "Custom Board",
                        image: selectedBoardTexture.image,
                        image_url: selectedBoardTexture.image,
                        photo: selectedBoardTexture.image,
                        boardTexture: selectedBoardTexture.value,
                    });
                    resetBoardFields();
                }} className={`
                w-full
                h-[34px]
                mt-2
                rounded-md
bg-blue-600
hover:bg-blue-500
                !text-white
                text-[10px]
                font-black
                uppercase
                transition-all
                duration-150
                ${isBoardValid
                        ? "cursor-pointer"
                        : "cursor-not-allowed"}
              `}>
                    {t("customPanel.addToBoard")}
                </button>
            </div>)}
        </div>
    </div>);
}
type CustomPanelProps = CustomBuilderProps & ImportBuilderProps;
export default function CustomPanel(props: CustomPanelProps) {
    const [mode, setMode] = useState<"custom" | "import" | null>(null);
    const [visited, setVisited] = useState({ custom: false, import: false });
    const { t } = props;
    const toggle = (value: "custom" | "import") => {
        setVisited(current => ({ ...current, [value]: true }));
        setMode(value);
    };
    return (<section className="myb-custom-panel mt-4 flex flex-1 min-h-0 flex-col">
        <style>{`
        .myb-custom-choice {
          background-color: #ffffff !important;
          border: 1px solid transparent !important;
          color: #18181b !important;
          transition: background-color 140ms ease, border-color 140ms ease;
        }
        .myb-custom-choice:hover {
          background-color: #ffffff !important;
          border-color: #a1a1aa !important;
          box-shadow: none;
        }
        .myb-import-image {
          border: none !important;
          cursor: pointer;
          transition: background-color 140ms ease;
        }
        .myb-import-image:hover:not(:disabled) {
          background-color: var(--zinc-900, #18181b);
        }
        .myb-custom-panel input:focus,
        .myb-custom-panel input:focus-visible,
        .myb-custom-panel select:focus,
        .myb-custom-panel select:focus-visible,
        .myb-custom-panel textarea:focus,
        .myb-custom-panel textarea:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          border-color: var(--zinc-800, #27272a) !important;
        }
      `}</style>
        <h2 className="mb-2 shrink-0 text-[11px] font-black uppercase tracking-wide">
            {t("customPanel.title")}
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6">
            {mode === null && <div className="flex flex-col gap-3">
                {([
                    { value: "custom", label: t("customPanel.create"), Icon: PencilRuler },
                    { value: "import", label: t("customPanel.modeImport"), Icon: ImportIcon },
                ] as const).map(({ value, label, Icon }) => <button key={value} type="button" onClick={() => toggle(value)} style={{ height: 30, minHeight: 30, maxHeight: 30, padding: "0 12px", cursor: "pointer" }} className="myb-custom-choice flex w-full items-center gap-3 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-500">
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span className="flex-1 text-[11px] font-bold uppercase tracking-wide">{label}</span>
                    <ChevronRight size={16} className="shrink-0" />
                </button>)}
            </div>}
            {mode !== null && <button type="button" onClick={() => setMode(null)} aria-label={t("sidebar.back")} title={t("sidebar.back")} style={{ height: 30, minHeight: 30, maxHeight: 30, padding: "0 12px", cursor: "pointer" }} className="myb-custom-choice mb-2 flex w-full items-center gap-3 rounded-md text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-500">
                <ArrowLeft size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-wide">{mode === "custom" ? t("customPanel.create") : t("customPanel.modeImport")}</span>
            </button>}
            <div hidden={mode !== "custom"} style={{ display: mode === "custom" ? "block" : "none" }}>
                {visited.custom && <CustomBuilder {...props} />}
            </div>
            <div hidden={mode !== "import"} style={{ display: mode === "import" ? "block" : "none" }}>
                {visited.import && <ImportBuilder {...props} />}
            </div>
        </div>
    </section>);
}
