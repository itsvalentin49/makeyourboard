"use client";
import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Import as ImportIcon, X } from "lucide-react";
import { saveCustomImage } from "@/utils/customImageStore";
type AnyRow = Record<string, any>;

const PEDAL_FORMATS = [
    { width: 38, depth: 92, name: "Xotic EP Booster", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/xotic-ep.webp", jackLocations: ["left", "right"] },
    { width: 60, depth: 112, name: "MXR Phase 90", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/mxr-m169-v3.webp?v=1791401146937", jackLocations: ["left", "right"] },
    { width: 66, depth: 122, name: "JHS Morning Glory V4", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/jhs-morning-glory-mk4-v2.webp?v=1790875734076", jackLocations: ["left", "right"] },
    { width: 94, depth: 119, name: "EHX Little Big Muff", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/ehx-little-big-muff-pi-v3.webp", jackLocations: ["left", "right"] },
    { width: 102, depth: 114, name: "Strymon El Capistan V2", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/strymon-elcap-v2-v2.webp", jackLocations: ["top"] },
    { width: 171, depth: 127, name: "Warm Audio Centavo Silver", image: "https://vvnzdxvjfexagllltueu.supabase.co/storage/v1/object/public/pedals-thumbs/warm-audio-centavo-silver.webp", jackLocations: ["top"] },
] as const;

const withoutUnit = (label: string) => label.replace(/\s*\((?:V|mA)\)\s*$/i, "");
function DimensionsGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return <div className="myb-field-group">
        <div className="myb-field-heading text-[10px] font-medium">{title}</div>
        {children}
    </div>;
}
function DimensionField({ label, unit, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; unit: string }) {
    return <label className="myb-inline-field">
        <span className="myb-field-label">{label}</span>
        <input {...props} type="number" aria-label={`${label} (${unit})`} />
        <span className="myb-field-unit" aria-hidden="true">{unit}</span>
    </label>;
}
function CurrentField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium">
        <span className="myb-field-heading">{withoutUnit(label)}</span>
        <span className="myb-inline-field">
            <input {...props} type="number" aria-label={`${withoutUnit(label)} (mA)`} />
            <span className="myb-field-unit" aria-hidden="true">mA</span>
        </span>
    </label>;
}
type ImportBuilderProps = {
    addCustomItem: (item: AnyRow) => void;
    units: "metric" | "imperial";
    withUnit: (label: string) => string;
    t: (key: string) => string;
};
function ImportBuilder({ addCustomItem, units, t }: ImportBuilderProps) {
    const [uploadModel, setUploadModel] = useState("");
    const [uploadImage, setUploadImage] = useState<string | null>(null);
    const [uploadImageId, setUploadImageId] = useState<string | null>(null);
    const [uploadWidth, setUploadWidth] = useState("");
    const [uploadDepth, setUploadDepth] = useState("");
    const [uploadVoltage, setUploadVoltage] = useState("");
    const [uploadDraw, setUploadDraw] = useState("100");
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
            draw: uploadDraw.trim() ? Number(uploadDraw) : 100,
            weight: 0,
        });
        removeImage();
        setUploadModel("");
        setUploadWidth("");
        setUploadDepth("");
        setUploadVoltage("");
        setUploadDraw("100");
    };
    return (<form onSubmit={submit} className="mt-2 flex flex-col gap-2 pb-4">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 8, alignItems: "start" }}>
            <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${id}-image`} className="myb-field-heading text-[10px] font-medium">{t("customPanel.chooseImage")}</label>
                <input ref={fileInputRef} id={`${id}-image`} type="file" disabled={Boolean(uploadImage) || imageLoading} accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => {
                    void handleLocalImageUpload(event.target.files?.[0] || null);
                    event.target.value = "";
                }} />
                <div className={`myb-upload-slot${uploadImage ? " myb-upload-loaded" : ""}`}>
                    {uploadImage ? <div className="myb-upload-button rounded-lg bg-zinc-950">
                        <img src={uploadImage} alt={uploadModel || t("customPanel.chooseImage")} draggable={false} className="myb-upload-thumbnail" />
                    </div> : <button type="button" aria-label={t("customPanel.chooseImage")}
                        aria-busy={imageLoading} onClick={() => fileInputRef.current?.click()} disabled={imageLoading}
                        className="myb-import-image myb-upload-button rounded-lg bg-zinc-950 disabled:opacity-50">
                        <ImportIcon size={18} aria-hidden="true" />
                    </button>}
                    {uploadImage && <button type="button" onClick={removeImage}
                        aria-label={t("customPanel.removeImage")} title={t("customPanel.removeImage")}
                        className="myb-remove-upload"><X size={14} /></button>}
                </div>
            </div>
            <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium">
                <span className="myb-field-heading">{t("customPanel.namePlaceholder")}</span>
                <input type="text" aria-label={t("customPanel.namePlaceholder")} value={uploadModel} onChange={event => setUploadModel(event.target.value)} className={`myb-name-field ${fieldClass}`} />
            </label>
        </div>
        <p className="myb-image-hint text-[9px] leading-relaxed">{t("customPanel.imageHint")}</p>
        {imageError && <p role="alert" className="text-[10px] text-red-400">{imageError}</p>}
        <DimensionsGroup title={t("customPanel.enterDimensions").replace(/\s*\([^)]*\)\s*$/, "")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                <DimensionField label={t("customPanel.width")} unit={units === "metric" ? "mm" : "in"} required min={min} max={max} step="any" inputMode="decimal" value={uploadWidth} onChange={event => setUploadWidth(event.target.value)} />
                <DimensionField label={(t("customPanel.height") === "customPanel.height" ? t("customPanel.depth") : t("customPanel.height"))} unit={units === "metric" ? "mm" : "in"} required min={min} max={max} step="any" inputMode="decimal" value={uploadDepth} onChange={event => setUploadDepth(event.target.value)} />
            </div>
            <p className="myb-image-hint text-[9px] leading-relaxed" style={{ margin: "-4px 0 0" }}>
                {t("customPanel.enclosureDimensions")
                    .replaceAll("{min}", String(Number(min.toFixed(2))))
                    .replaceAll("{max}", String(Number(max.toFixed(2))))
                    .replaceAll("{unit}", units === "metric" ? "mm" : "in")}
            </p>
        </DimensionsGroup>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium">
                <span className="myb-field-heading">{withoutUnit(t("customPanel.voltage"))}</span>
                <select aria-label={withoutUnit(t("customPanel.voltage"))} value={uploadVoltage} onChange={event => setUploadVoltage(event.target.value)} className={fieldClass}>
                    <option value="">9V DC</option>
                    {[12, 18, 24].map(voltage => <option key={voltage} value={voltage}>{voltage}V DC</option>)}
                </select>
            </label>
            <CurrentField label={t("customPanel.consumption")} min={0} step="any" inputMode="decimal" value={uploadDraw} onChange={event => setUploadDraw(event.target.value)} />
        </div>
        <button type="submit" disabled={!isUploadValid} className="mt-1 flex h-[34px] w-full items-center justify-center rounded-md myb-add-button bg-blue-600 text-[10px] font-black uppercase !text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40">
            {t("customPanel.add")}
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
type PedalPreviewProps = {
    previewWidthMm: number;
    previewDepthMm: number;
    previewWidthPx: number;
    previewHeightPx: number;
    previewScale: number;
    customColor: string;
    customName: string;
    jackLocations: LocationValue[];
};
function PedalPreview({ previewWidthMm, previewDepthMm, previewWidthPx, previewHeightPx, previewScale, customColor, customName, jackLocations }: PedalPreviewProps) {
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
    return (
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
                    {customName.trim()}
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
    );
}
function CustomBuilder({ customType, customName, setCustomName, customWidth, setCustomWidth, customDepth, setCustomDepth, customColor, setCustomColor, addCustomItem, isPedalValid, isBoardValid, minValue, maxValue, displayMin, displayMax, units, unitLabel, withUnit, t, }: CustomBuilderProps) {
    const DEFAULT_JACK_LOCATIONS: LocationValue[] = [];
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
    const [hasSelectedColor, setHasSelectedColor] = useState(false);
    const [pickedColor, setPickedColor] = useState("#ea580c");
    const [customVoltage, setCustomVoltage] = useState("");
    const [customDraw, setCustomDraw] = useState("100");
    const [customVoltageOpen, setCustomVoltageOpen] = useState(false);
    const [boardTexture, setBoardTexture] = useState<BoardTexture>("wood");
    const [boardTextureOpen, setBoardTextureOpen] = useState(false);
    const [jackLocations, setJackLocations] = useState<LocationValue[]>(DEFAULT_JACK_LOCATIONS);
    const customVoltageRef = useRef<HTMLDivElement>(null);
    const boardTextureRef = useRef<HTMLDivElement>(null);
    const formatsRef = useRef<HTMLDivElement>(null);
    const formatsId = React.useId();
    const scrollFormats = (direction: -1 | 1) => {
        const element = formatsRef.current;
        if (element) element.scrollBy({ left: direction * (element.clientWidth + 8), behavior: "smooth" });
    };
    const previousFormats = t("customPanel.previousFormats");
    const nextFormats = t("customPanel.nextFormats");
    const PRESET_COLORS: PresetColor[] = [
        { value: "", label: t("colors.aluminium") },
        { value: "#111111", label: t("colors.black") },
        { value: "#ffffff", label: t("colors.white") },
        { value: "#b91c1c", label: t("colors.red") },
        { value: "#1e3a8a", label: t("colors.blue") },
        { value: "#065f46", label: t("colors.green") },
        { value: "#facc15", label: t("colors.yellow") },
    ];
    const customColorTranslation = t("customPanel.chooseCustomColor");
    const customColorLabel = customColorTranslation && customColorTranslation !== "customPanel.chooseCustomColor"
        ? customColorTranslation : "Choose a custom color";
    const isCustomColorSelected = hasSelectedColor && !PRESET_COLORS.some(color => color.value === customColor);
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
    const selectedBoardTexture = BOARD_TEXTURES.find((texture) => texture.value === boardTexture) || BOARD_TEXTURES[0];
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (customVoltageRef.current &&
                !customVoltageRef.current.contains(target)) {
                setCustomVoltageOpen(false);
            }
            if (boardTextureRef.current &&
                !boardTextureRef.current.contains(target)) {
                setBoardTextureOpen(false);
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

        setCustomVoltageOpen(false);
        setBoardTextureOpen(false);
    };
    useEffect(() => {
        closeAllMenus();
    }, [customType]);
    const resetPedalFields = () => {
        resetCommonFields();
        setCustomColor("");
        setHasSelectedColor(false);
        setCustomVoltage("");
        setCustomDraw("100");
        setJackLocations([
            ...DEFAULT_JACK_LOCATIONS,
        ]);
        closeAllMenus();
    };
    const resetBoardFields = () => {
        resetCommonFields();
        setBoardTexture("wood");
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
    return (<div className="
        flex
        flex-col
        mt-0
        pb-4
      ">
        <div className="flex flex-col gap-0">
            {/* FORMULAIRE PÉDALE */}
            {customType === "pedal" && (<div className="flex flex-col gap-2 mt-2">
                <div className="myb-field-group">
                    <div className="myb-field-heading text-[10px] font-medium">{t("customPanel.format") === "customPanel.format" ? "Format" : t("customPanel.format")}</div>
                    <div className="myb-formats-carousel">
                        <button type="button" className="myb-carousel-arrow myb-carousel-previous"
                            aria-label={previousFormats === "customPanel.previousFormats" ? "Previous formats" : previousFormats}
                            aria-controls={formatsId} onClick={() => scrollFormats(-1)}><ChevronLeft size={16} /></button>
                        <div ref={formatsRef} id={formatsId} role="group" tabIndex={0}
                            aria-label={`${withUnit(t("customPanel.width"))} / ${withUnit(t("customPanel.depth"))}`}
                            className="myb-formats-track">
                            {PEDAL_FORMATS.map(({ width, depth, name, image, jackLocations: formatJackLocations }) => {
                                const widthMm = Number(customWidth) * (units === "imperial" ? 25.4 : 1);
                                const depthMm = Number(customDepth) * (units === "imperial" ? 25.4 : 1);
                                const selected = Math.abs(widthMm - width) < 0.02 && Math.abs(depthMm - depth) < 0.02;
                                return (
                                    <button
                                        key={`${width}x${depth}`}
                                        type="button"
                                        aria-pressed={selected}
                                        aria-label={name}
                                        title={name}
                                        onClick={() => {
                                            const formatValue = (value: number) => units === "metric"
                                                ? String(value)
                                                : String(Number((value / 25.4).toFixed(6)));
                                            setCustomWidth(formatValue(width));
                                            setCustomDepth(formatValue(depth));
                                            setJackLocations([...formatJackLocations]);
                                        }}
                                        className="myb-format-choice flex flex-col items-center justify-center gap-2 rounded-lg bg-zinc-950 p-2 transition-colors"
                                        style={{ border: "1px solid transparent" }}
                                    >
                                        <img src={image} alt="" draggable={false} className="myb-format-image" />
                                        {selected && <Check size={12} strokeWidth={3} aria-hidden="true" className="myb-selection-check" />}
                                    </button>
                                );
                            })}
                        </div>
                        <button type="button" className="myb-carousel-arrow myb-carousel-next"
                            aria-label={nextFormats === "customPanel.nextFormats" ? "Next formats" : nextFormats}
                            aria-controls={formatsId} onClick={() => scrollFormats(1)}><ChevronRight size={16} /></button>
                    </div>
                </div>
                {/* NOM + COULEUR */}
                <div className="flex min-w-0 flex-col gap-2">
                    <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium"><span className="myb-field-heading">{t("customPanel.namePlaceholder")}</span><input type="text" aria-label={t("customPanel.namePlaceholder")} value={customName} onChange={(event) => setCustomName(event.target.value)} className="myb-name-field 
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
                    <div className="flex w-full min-w-0 flex-col gap-1 text-[10px] font-medium">
                        <span className="myb-field-heading">{t("customPanel.color")}</span>
                        <div role="group" aria-label={t("customPanel.color")} className="myb-color-row">
                            {PRESET_COLORS.map(color => (
                                <button key={color.value || "aluminium"} type="button"
                                    aria-label={color.label} title={color.label}
                                    aria-pressed={hasSelectedColor && customColor === color.value}
                                    onClick={() => {
                                        closeAllMenus();
                                        setCustomColor(color.value);
                                        setHasSelectedColor(true);
                                    }}
                                    className="myb-color-swatch"
                                    style={{
                                        background: color.value || "linear-gradient(135deg, #eeeeee, #999999, #eeeeee)"
                                    }}
                                >
                                    {hasSelectedColor && customColor === color.value && <Check size={14} strokeWidth={3} aria-hidden="true" style={{ color: ["#111111", "#b91c1c", "#1e3a8a", "#065f46"].includes(color.value) ? "#ffffff" : "#111111" }} />}
                                </button>
                            ))}
                            <label className="myb-color-swatch myb-custom-color" title={customColorLabel}>
                                <input type="color" aria-label={customColorLabel}
                                    value={isCustomColorSelected ? customColor : pickedColor}
                                    onChange={event => {
                                        closeAllMenus();
                                        setPickedColor(event.target.value);
                                        setCustomColor(event.target.value);
                                        setHasSelectedColor(true);
                                    }} />
                                {isCustomColorSelected && <Check size={14} strokeWidth={3} aria-hidden="true" style={{ color: "#111111", pointerEvents: "none" }} />}
                            </label>
                        </div>
                    </div>
                </div>
                {/* DIMENSIONS */}
                <DimensionsGroup title={t("customPanel.enterDimensions").replace(/\s*\([^)]*\)\s*$/, "")}>
                    <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                        <DimensionField label={t("customPanel.width")} unit={units === "metric" ? "mm" : "in"} min={minValue} max={maxValue} step={units === "metric"
                            ? 1
                            : 0.1} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} />
                        <DimensionField label={(t("customPanel.height") === "customPanel.height" ? t("customPanel.depth") : t("customPanel.height"))} unit={units === "metric" ? "mm" : "in"} min={minValue} max={maxValue} step={units === "metric"
                            ? 1
                            : 0.1} value={customDepth} onChange={(event) => setCustomDepth(event.target.value)} />
                    </div>
                    <p className="myb-image-hint text-[9px] leading-relaxed" style={{ margin: "-4px 0 0" }}>
                        {t("customPanel.enclosureDimensions")
                            .replaceAll("{min}", String(displayMin))
                            .replaceAll("{max}", String(displayMax))
                            .replaceAll("{unit}", unitLabel)}
                    </p>
                </DimensionsGroup>
                {/* JACKS + ALIMENTATION */}
                <div className="flex min-w-0 flex-col gap-1 text-[10px] font-medium">
                    <span className="myb-field-heading">{t("customPanel.jackLocations")}</span>
                    <div role="group" aria-label={t("customPanel.jackLocations")} className="myb-jack-options">
                        {LOCATION_OPTIONS.map(option => <label key={option.value} className="myb-jack-option">
                            <input type="checkbox" className="myb-jack-input"
                                checked={jackLocations.includes(option.value)}
                                onChange={event => {
                                    const checked = event.target.checked;
                                    setJackLocations(current => checked
                                        ? current.includes(option.value) ? current : [...current, option.value]
                                        : current.filter(location => location !== option.value));
                                }} />
                            <span className="myb-jack-checkbox" aria-hidden="true">
                                {jackLocations.includes(option.value) && <Check size={10} strokeWidth={3} />}
                            </span>
                            <span>{option.label}</span>
                        </label>)}
                    </div>
                </div>
                {/* VOLTAGE + AMPÉRAGE */}
                <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                    <div className="flex min-w-0 flex-col gap-1 text-[10px] font-medium"><span className="myb-field-heading">{withoutUnit(t("customPanel.voltage"))}</span><div ref={customVoltageRef} className="relative h-[34px]">
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
                                    : "9V DC"}
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
                    <CurrentField label={t("customPanel.current")} min={0} value={customDraw} onChange={(event) => setCustomDraw(event.target.value)} />
                </div>
                {/* APERÇU PÉDALE */}
                <div className="myb-preview-section flex flex-col gap-2 mt-0">
                    <div className="myb-field-heading text-[10px] font-medium">
                        {t("export.preview")}
                    </div>
                    <div className="myb-pedal-preview-box
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
                        <PedalPreview previewWidthMm={previewWidthMm} previewDepthMm={previewDepthMm} previewWidthPx={previewWidthPx} previewHeightPx={previewHeightPx} previewScale={previewScale} customColor={customColor} customName={customName} jackLocations={jackLocations} />
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
                        draw: customDraw.trim() ? Number(customDraw) || 0 : 100,
                        jacksLocation: jackLocations.join(", "),
                        powerLocation: "top",
                    });
                    resetPedalFields();
                }} className={`
                w-full
                h-[34px]
                mt-2
                rounded-md
myb-add-button bg-blue-600
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
                    {t("customPanel.add")}
                </button>
            </div>)}
            {/* FORMULAIRE BOARD */}
            {customType === "board" && (<div className="flex flex-col gap-2 mt-2">
                {/* DIMENSIONS */}
                <div className="myb-field-group">
                    <div className="myb-field-heading text-[10px] font-medium">{t("customPanel.boardDimensions") === "customPanel.boardDimensions" ? "Dimensions" : t("customPanel.boardDimensions")}</div>
                    <div className="min-w-0" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                        <DimensionField label={t("customPanel.width")} unit={units === "metric" ? "mm" : "in"} min={minValue} max={maxValue} step={units === "metric"
                            ? 1
                            : 0.1} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} />
                        <DimensionField label={(t("customPanel.height") === "customPanel.height" ? t("customPanel.depth") : t("customPanel.height"))} unit={units === "metric" ? "mm" : "in"} min={minValue} max={maxValue} step={units === "metric"
                            ? 1
                            : 0.1} value={customDepth} onChange={(event) => setCustomDepth(event.target.value)} />
                    </div>
                </div>
                {/* MENU DÉROULANT TYPE DE BOARD */}
                <div className="flex min-w-0 flex-col gap-1 text-[10px] font-medium"><span className="myb-field-heading">{t("customPanel.boardFinish")}</span><div ref={boardTextureRef} className="relative h-[40px]">
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
                <div className="myb-preview-section flex flex-col gap-2 mt-0">
                    <div className="myb-field-heading text-[10px] font-medium">
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
myb-add-button bg-blue-600
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
                    {t("customPanel.add")}
                </button>
            </div>)}
        </div>
    </div>);
}
type CustomPanelProps = CustomBuilderProps & ImportBuilderProps;
export default function CustomPanel(props: CustomPanelProps) {
    const [mode, setMode] = useState<"custom" | "import">("custom");
    const [visited, setVisited] = useState({ custom: true, import: false });
    const { t } = props;
    const { customType, setCustomType } = props;
    useEffect(() => {
        if (customType === null) setCustomType("pedal");
    }, [customType, setCustomType]);
    const toggle = (value: "custom" | "import") => {
        setVisited(current => ({ ...current, [value]: true }));
        setMode(value);
    };
    return (<section className="myb-custom-panel mt-4 flex flex-1 min-h-0 flex-col">
        <style>{`
        .myb-custom-panel .myb-custom-title { margin: 0 0 8px !important; }
        .myb-custom-panel .myb-name-field,
        .myb-custom-panel .myb-add-button {
          height: 34px !important; min-height: 34px !important; max-height: 34px !important;
          box-sizing: border-box; padding-top: 0 !important; padding-bottom: 0 !important;
        }
        .myb-custom-panel .myb-upload-slot { position: relative; width: 100%; }
        .myb-custom-panel .myb-upload-button {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 34px; min-height: 34px; padding: 3px 28px;
        }
        .myb-custom-panel .myb-upload-thumbnail { display: block; width: 100%; height: 100px; object-fit: contain; }
        .myb-custom-panel .myb-pedal-preview-box,
        .myb-custom-panel .myb-upload-button {
          min-height: 134px !important; box-sizing: border-box; padding: 16px !important;
        }
        .myb-custom-panel .myb-upload-button { height: 134px !important; }
        .myb-custom-panel .myb-remove-upload {
          position: absolute; right: 5px; top: 5px; display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; padding: 0; border: 0; border-radius: 4px;
          background: var(--zinc-950, #09090b); color: inherit; cursor: pointer;
        }
        .myb-custom-panel .myb-remove-upload { transition: background-color 140ms ease; }
        .myb-custom-panel .myb-remove-upload:hover,
        .myb-custom-panel .myb-remove-upload:focus-visible {
          background: color-mix(in srgb, currentColor 18%, transparent) !important;
        }
        .myb-custom-panel .myb-image-hint { margin: -8px 0 0; font-style: italic; }
        .myb-custom-panel .myb-formats-carousel { position: relative; min-width: 0; margin-bottom: 0; }
        .myb-custom-panel .myb-formats-track {
          display: grid; grid-auto-flow: column; grid-auto-columns: calc((100% - 16px) / 3); gap: 8px;
          overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none;
        }
        .myb-custom-panel .myb-formats-track::-webkit-scrollbar { display: none; }
        .myb-custom-panel .myb-carousel-arrow {
          position: absolute; top: 50%; transform: translateY(-50%); z-index: 1;
          display: flex; align-items: center; justify-content: center; width: 20px; height: 26px;
          padding: 0; border: 0; border-radius: 5px; color: inherit !important;
          background: color-mix(in srgb, currentColor 12%, transparent) !important; cursor: pointer;
        }
        .myb-custom-panel .myb-carousel-previous { left: -5px; }
        .myb-custom-panel .myb-carousel-next { right: -5px; }
        .myb-custom-panel .myb-format-choice {
          scroll-snap-align: start;
          width: 100%; height: 62px !important; min-height: 62px !important; max-height: 62px !important;
          aspect-ratio: auto; box-sizing: border-box; padding: 7px !important;
        }
        .myb-custom-panel .myb-format-image {
          display: block; width: 100%; height: 100%; max-height: 46px;
          object-fit: contain; pointer-events: none;
        }
        .myb-custom-panel .myb-field-heading {
          text-transform: none !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          letter-spacing: normal !important;
          margin-top: 4px;
          margin-bottom: 0 !important;
        }
        .myb-custom-panel .myb-field-heading::first-letter { text-transform: uppercase; }
        .myb-custom-panel span.myb-field-heading { display: inline-block; }
        .myb-custom-panel .myb-field-group,
        .myb-custom-panel .myb-preview-section {
          display: flex; flex-direction: column; gap: 4px !important; margin-top: 0 !important;
        }
        .myb-custom-panel .myb-custom-tabs {
          height: 30px !important; min-height: 30px !important; max-height: 30px !important;
          box-sizing: border-box; padding: 2px !important; background: #ffffff !important;
        }
        .myb-custom-panel .myb-custom-tabs .myb-type-choice {
          height: 26px !important; min-height: 0 !important; max-height: 26px !important;
          padding-top: 0 !important; padding-bottom: 0 !important; color: #111111;
        }
        .myb-custom-panel .myb-custom-tabs .myb-type-choice[aria-pressed="true"],
        .light .myb-custom-panel .myb-custom-tabs .myb-type-choice[aria-pressed="true"] {
          color: #111111 !important;
          background: #e5e7eb !important;
          border-color: transparent !important;
        }
        .myb-custom-panel .myb-type-choice,
        .myb-custom-panel .myb-format-choice { border: 1px solid transparent !important; box-shadow: none !important; }
        .myb-custom-panel .myb-type-choice[aria-pressed="true"] { border-color: #111111 !important; }
        .light .myb-custom-panel .myb-type-choice[aria-pressed="true"] {
          border-color: var(--color-canvas, var(--canvas, #adb5bd)) !important;
        }
        .myb-custom-panel .myb-format-choice,
        .myb-custom-panel .myb-jack-option { position: relative; }
        .myb-custom-panel .myb-selection-check {
          position: absolute; top: 4px; right: 4px; color: inherit; pointer-events: none;
        }
        .myb-custom-panel .myb-color-row { display: flex; flex-wrap: nowrap; align-items: center; justify-content: space-between; gap: 4px; width: 100%; }
        .myb-custom-panel .myb-color-swatch {
          display: inline-flex !important; align-items: center; justify-content: center;
          width: 24px !important; height: 24px !important;
          min-width: 0 !important; min-height: 0 !important;
          flex: 0 1 24px !important; aspect-ratio: 1;
          padding: 0 !important; border: 0 !important; border-radius: 50% !important;
          box-shadow: none !important; cursor: pointer; appearance: none;
        }
        .myb-custom-panel .myb-inline-field {
          display: flex; align-items: center; gap: 6px; width: 100%; min-width: 0;
          height: 34px; padding: 0 10px; box-sizing: border-box;
          background: var(--zinc-950, #09090b); border: 1px solid var(--zinc-800, #27272a); border-radius: 6px;
          font-size: 10px;
        }
        .myb-custom-panel .myb-inline-field input {
          flex: 1 1 0; width: 0; min-width: 0; height: 100%; padding: 0;
          border: 0 !important; background: transparent !important; box-shadow: none !important;
          color: inherit; font: inherit; text-align: right; appearance: textfield;
        }
        .myb-custom-panel .myb-inline-field input::-webkit-inner-spin-button,
        .myb-custom-panel .myb-inline-field input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .myb-custom-panel .myb-field-label { flex-shrink: 0; }
        .myb-custom-panel .myb-field-label,
        .myb-custom-panel .myb-image-hint { color: #a1a1aa !important; }
        .myb-custom-panel .myb-field-unit { flex-shrink: 0; color: #a1a1aa; }
        .light .myb-custom-panel .myb-field-label,
        .light .myb-custom-panel .myb-field-unit,
        .light .myb-custom-panel .myb-image-hint {
          color: #626975 !important;
        }
        .myb-custom-panel .myb-custom-color {
          position: relative; overflow: hidden;
          background: conic-gradient(#ff5252, #ffff00, #00e676, #00b0ff, #7c4dff, #ff40ff, #ff5252);
        }
        .myb-custom-panel .myb-custom-color input[type="color"] {
          position: absolute; inset: 0; width: 100%; height: 100%;
          margin: 0; padding: 0; opacity: 0; cursor: pointer;
        }
        .myb-custom-panel .myb-jack-options { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
        .myb-custom-panel .myb-jack-option {
          min-width: 0; height: 34px; padding: 0 3px; font: inherit; color: inherit;
          background: var(--zinc-950, #09090b); border: 1px solid transparent !important;
          border-radius: 6px; cursor: pointer; box-shadow: none !important;
        }
        .myb-custom-panel .myb-jack-option { display: flex; align-items: center; justify-content: center; gap: 4px; }
        .myb-custom-panel .myb-jack-input {
          position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; opacity: 0;
        }
        .myb-custom-panel .myb-jack-checkbox {
          display: flex; align-items: center; justify-content: center;
          width: 14px; height: 14px; flex: 0 0 14px; box-sizing: border-box;
          border: 1px solid #71717a; border-radius: 3px; color: #ffffff;
          background: transparent;
        }
        .myb-custom-panel .myb-jack-input:checked + .myb-jack-checkbox {
          border-color: #2563eb; background: #2563eb;
        }
        .myb-custom-panel .myb-jack-input:focus-visible + .myb-jack-checkbox {
          outline: 2px solid #60a5fa; outline-offset: 2px;
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
        <h2 className="myb-custom-title mb-1 shrink-0 text-[11px] font-black uppercase tracking-wide">
            {t("customPanel.title")}
        </h2>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6">
            <div role="group" aria-label={t("customPanel.itemType")}
                className="myb-custom-tabs rounded-md"
                style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 4 }}>
                {(["pedal", "board", "import"] as const).map(tab => {
                    const selected = tab === "import" ? mode === "import" : mode === "custom" && props.customType === tab;
                    const label = t(tab === "import" ? "customPanel.modeImport" : tab === "pedal" ? "customPanel.pedal" : "customPanel.board");
                    return <button key={tab} type="button" aria-pressed={selected}
                        className={`myb-type-choice h-[34px] rounded-md text-[10px] font-bold ${selected ? "bg-canvas" : "bg-transparent"}`}
                        onClick={() => {
                            if (tab === "import") {
                                toggle("import");
                            } else {
                                props.setCustomType(tab);
                                props.setCustomName("");
                                props.setCustomWidth("");
                                props.setCustomDepth("");
                                toggle("custom");
                            }
                        }}>{label}</button>;
                })}
            </div>
            <div hidden={mode !== "custom"} style={{ display: mode === "custom" ? "block" : "none" }}>
                {visited.custom && customType !== null && <CustomBuilder {...props} />}
            </div>
            <div hidden={mode !== "import"} style={{ display: mode === "import" ? "block" : "none" }}>
                {visited.import && <ImportBuilder {...props} />}
            </div>

        </div>
    </section>);
}