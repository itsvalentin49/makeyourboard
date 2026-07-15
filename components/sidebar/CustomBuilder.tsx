"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

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

type PresetColor = {
  value: string;
  label: string;
};

type BoardTexture =
  | "black"
  | "wood"
  | "aluminium";

type BoardTextureOption = {
  value: BoardTexture;
  label: string;
  image: string;
};

type LocationValue =
  | "top"
  | "bottom"
  | "left"
  | "right";

type LocationOption = {
  value: LocationValue;
  label: string;
};

type LocationDropdownProps = {
  label: string;
  locations: LocationValue[];
  setLocations: React.Dispatch<
    React.SetStateAction<LocationValue[]>
  >;
  open: boolean;
  setOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  containerRef: React.RefObject<HTMLDivElement | null>;
  options: LocationOption[];
  closeOtherMenus: () => void;
};

function LocationDropdown({
  label,
  locations,
  setLocations,
  open,
  setOpen,
  containerRef,
  options,
  closeOtherMenus,
}: LocationDropdownProps) {
  const toggleLocation = (
    location: LocationValue
  ) => {
    setLocations((current) =>
      current.includes(location)
        ? current.filter(
          (item) => item !== location
        )
        : [...current, location]
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[34px]"
    >
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;

          closeOtherMenus();
          setOpen(nextOpen);
        }}
        className="
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
        "
      >
        <span className="truncate">
          {label}
        </span>

        <ChevronDown
          size={14}
          className={`
            ml-2
            shrink-0
            text-zinc-500
            transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
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
          "
        >
          {options.map((option) => {
            const selected =
              locations.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  toggleLocation(option.value);
                }}
                className="
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
                "
              >
                <span>{option.label}</span>

                <span
                  className={`
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
                      : "border-zinc-500 bg-transparent"
                    }
                  `}
                >
                  {selected && (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-white"
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  const [customColorOpen, setCustomColorOpen] =
    useState(false);

  const [hasSelectedColor, setHasSelectedColor] =
    useState(false);

  const [customVoltage, setCustomVoltage] =
    useState("");

  const [customDraw, setCustomDraw] =
    useState("");

  const [customVoltageOpen, setCustomVoltageOpen] =
    useState(false);

  const [boardTexture, setBoardTexture] =
    useState<BoardTexture>("wood");

  const [boardTextureOpen, setBoardTextureOpen] =
    useState(false);

  const [jackLocations, setJackLocations] =
    useState<LocationValue[]>(
      DEFAULT_JACK_LOCATIONS
    );

  const [powerLocations, setPowerLocations] =
    useState<LocationValue[]>(
      DEFAULT_POWER_LOCATIONS
    );

  const [jackLocationsOpen, setJackLocationsOpen] =
    useState(false);

  const [powerLocationsOpen, setPowerLocationsOpen] =
    useState(false);

  const customColorRef =
    useRef<HTMLDivElement>(null);

  const customVoltageRef =
    useRef<HTMLDivElement>(null);

  const boardTextureRef =
    useRef<HTMLDivElement>(null);

  const jackLocationsRef =
    useRef<HTMLDivElement>(null);

  const powerLocationsRef =
    useRef<HTMLDivElement>(null);

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

  const selectedColor =
    PRESET_COLORS.find(
      (color) => color.value === customColor
    ) || PRESET_COLORS[0];

  const selectedBoardTexture =
    BOARD_TEXTURES.find(
      (texture) =>
        texture.value === boardTexture
    ) || BOARD_TEXTURES[0];

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      const target = event.target as Node;

      if (
        customVoltageRef.current &&
        !customVoltageRef.current.contains(target)
      ) {
        setCustomVoltageOpen(false);
      }

      if (
        customColorRef.current &&
        !customColorRef.current.contains(target)
      ) {
        setCustomColorOpen(false);
      }

      if (
        boardTextureRef.current &&
        !boardTextureRef.current.contains(target)
      ) {
        setBoardTextureOpen(false);
      }

      if (
        jackLocationsRef.current &&
        !jackLocationsRef.current.contains(target)
      ) {
        setJackLocationsOpen(false);
      }

      if (
        powerLocationsRef.current &&
        !powerLocationsRef.current.contains(target)
      ) {
        setPowerLocationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
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

  const selectCustomType = (
    type: "pedal" | "board"
  ) => {
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

  const defaultPreviewWidthMm =
    customType === "board"
      ? DEFAULT_BOARD_PREVIEW_WIDTH_MM
      : DEFAULT_PEDAL_PREVIEW_WIDTH_MM;

  const defaultPreviewDepthMm =
    customType === "board"
      ? DEFAULT_BOARD_PREVIEW_DEPTH_MM
      : DEFAULT_PEDAL_PREVIEW_DEPTH_MM;

  const previewWidthMm =
    enteredWidth > 0
      ? units === "metric"
        ? enteredWidth
        : enteredWidth * 25.4
      : defaultPreviewWidthMm;

  const previewDepthMm =
    enteredDepth > 0
      ? units === "metric"
        ? enteredDepth
        : enteredDepth * 25.4
      : defaultPreviewDepthMm;

  /*
    Le board utilise une largeur maximale plus petite
    afin de conserver davantage de marge sur les côtés.
  */
  const previewMaxWidth =
    customType === "board" ? 215 : 170;

  const previewMaxHeight =
    customType === "board" ? 120 : 120;

  const previewScale = Math.min(
    previewMaxWidth / previewWidthMm,
    previewMaxHeight / previewDepthMm
  );

  const previewWidthPx = Math.max(
    customType === "board" ? 80 : 38,
    previewWidthMm * previewScale
  );

  const previewHeightPx = Math.max(
    customType === "board" ? 36 : 55,
    previewDepthMm * previewScale
  );

  /*
    Valeurs identiques au rendu Custom Pedal du canvas.
  */
  const CANVAS_KNOB_SIZE = 25;
  const CANVAS_FOOTSWITCH_SIZE = 18;
  const CANVAS_KNOB_TOP = 14;
  const CANVAS_FOOTSWITCH_TOP_FROM_BOTTOM = 30;
  const CANVAS_HARDWARE_SPREAD = 1.25;
  const CANVAS_TEXT_SIZE = 8;

  const previewKnobSizePx =
    CANVAS_KNOB_SIZE * previewScale;

  const previewFootswitchSizePx =
    CANVAS_FOOTSWITCH_SIZE * previewScale;

  const previewKnobTopPx =
    CANVAS_KNOB_TOP * previewScale;

  const previewFootswitchTopPx =
    previewHeightPx -
    CANVAS_FOOTSWITCH_TOP_FROM_BOTTOM *
    previewScale;

  const previewTextSizePx =
    CANVAS_TEXT_SIZE * previewScale;

  const previewKnobCount =
    previewWidthMm < 70
      ? 1
      : previewWidthMm <= 100
        ? 2
        : 3;

  const previewSideJackWidth =
    14 * previewScale;

  const previewSideJackHeight =
    18 * previewScale;

  const previewHorizontalJackWidth =
    18 * previewScale;

  const previewHorizontalJackHeight =
    14 * previewScale;

  const PREVIEW_JACK_OUTSIDE_RATIO = 0.55;

  const previewSideJackOffset =
    previewSideJackWidth *
    PREVIEW_JACK_OUTSIDE_RATIO;

  const previewHorizontalJackOffset =
    previewHorizontalJackHeight *
    PREVIEW_JACK_OUTSIDE_RATIO;

  return (
    <div
      className="
        flex
        flex-col
        mt-4
        h-full
        min-h-0
        overflow-y-auto
        no-scrollbar
        pb-10
      "
    >
      <div className="flex flex-col gap-0">
        {/* TITRE + DIMENSIONS */}
        <div className="flex flex-col gap-[2px] mb-3">
          <div className="text-[11px] font-black uppercase tracking-wide">
            {customType === "board"
              ? t("customMenu.boardSubtitle")
              : t("customMenu.pedalSubtitle")}
          </div>

          <div className="text-[9px] leading-[1.45] text-zinc-400">
            •{" "}
            {t("custom.dimensionError")
              .replace(
                "{min}",
                String(displayMin)
              )
              .replace(
                "{max}",
                String(displayMax)
              )
              .replaceAll(
                "{unit}",
                unitLabel
              )}
          </div>
        </div>

        {/* SÉLECTEUR PÉDALE / BOARD */}
        <div
          className="
            relative
            grid
            grid-cols-2
            h-[34px]
            rounded-lg
            bg-zinc-950
            border
            border-zinc-800
            overflow-hidden
          "
        >
          <div
            className={`
              absolute
              top-0
              h-full
              w-1/2
              rounded-md
              border
              border-blue-500
              bg-blue-500/10
              transition-transform
              duration-200
              ease-out
              ${customType === "board"
                ? "translate-x-full"
                : "translate-x-0"
              }
            `}
          />

          <button
            type="button"
            onClick={() =>
              selectCustomType("pedal")
            }
            className="
              relative
              z-10
              text-[10px]
              font-black
              uppercase
              tracking-wide
            "
          >
            {t("custom.pedal")}
          </button>

          <button
            type="button"
            onClick={() =>
              selectCustomType("board")
            }
            className="
              relative
              z-10
              text-[10px]
              font-black
              uppercase
              tracking-wide
            "
          >
            {t("custom.board")}
          </button>
        </div>

        {/* FORMULAIRE PÉDALE */}
        {customType === "pedal" && (
          <div className="flex flex-col gap-2 mt-2">
            {/* LARGEUR + PROFONDEUR */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={
                  units === "metric"
                    ? 1
                    : 0.1
                }
                placeholder={withUnit(
                  t("custom.width")
                )}
                value={customWidth}
                onChange={(event) =>
                  setCustomWidth(
                    event.target.value
                  )
                }
                className="
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
                "
              />

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={
                  units === "metric"
                    ? 1
                    : 0.1
                }
                placeholder={withUnit(
                  t("custom.depth")
                )}
                value={customDepth}
                onChange={(event) =>
                  setCustomDepth(
                    event.target.value
                  )
                }
                className="
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
                "
              />
            </div>

            {/* NOM + COULEUR */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t(
                  "custom.namePlaceholder"
                )}
                value={customName}
                onChange={(event) =>
                  setCustomName(
                    event.target.value
                  )
                }
                className="
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
                "
              />

              {/* COULEUR */}
              <div
                ref={customColorRef}
                className="relative h-[34px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen =
                      !customColorOpen;

                    closeAllMenus();
                    setCustomColorOpen(nextOpen);
                  }}
                  className="
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
                  "
                >
                  <span className="truncate">
                    {hasSelectedColor
                      ? selectedColor.label
                      : t("custom.color")}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasSelectedColor &&
                      (selectedColor.value ? (
                        <span
                          className="
                            block
                            w-[16px]
                            h-[16px]
                            rounded-[4px]
                            border
                            border-zinc-600
                            shrink-0
                          "
                          style={{
                            backgroundColor:
                              selectedColor.value,
                          }}
                        />
                      ) : (
                        <span
                          className="
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
                          "
                        >
                          <span
                            className="
                              absolute
                              left-1/2
                              top-1/2
                              w-[22px]
                              h-[2px]
                              bg-red-500
                              -translate-x-1/2
                              -translate-y-1/2
                              rotate-45
                            "
                          />
                        </span>
                      ))}

                    <ChevronDown
                      size={14}
                      className={`
                        text-zinc-500
                        transition-transform
                        ${customColorOpen
                          ? "rotate-180"
                          : ""
                        }
                      `}
                    />
                  </div>
                </button>

                {customColorOpen && (
                  <div
                    className="
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
                    "
                  >
                    {PRESET_COLORS.map(
                      (color) => {
                        const active =
                          hasSelectedColor &&
                          customColor ===
                          color.value;

                        return (
                          <button
                            key={
                              color.value ||
                              "aluminium"
                            }
                            type="button"
                            onClick={() => {
                              setCustomColor(
                                color.value
                              );

                              setHasSelectedColor(
                                true
                              );

                              setCustomColorOpen(
                                false
                              );
                            }}
                            className={`
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
                                : "font-normal"
                              }
                            `}
                          >
                            <span>
                              {color.label}
                            </span>

                            {color.value ? (
                              <span
                                className="
                                  block
                                  w-[16px]
                                  h-[16px]
                                  rounded-[4px]
                                  border
                                  border-zinc-600
                                  shrink-0
                                "
                                style={{
                                  backgroundColor:
                                    color.value,
                                }}
                              />
                            ) : (
                              <span
                                className="
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
                                "
                              >
                                <span
                                  className="
                                    absolute
                                    left-1/2
                                    top-1/2
                                    w-[22px]
                                    h-[2px]
                                    bg-red-500
                                    -translate-x-1/2
                                    -translate-y-1/2
                                    rotate-45
                                  "
                                />
                              </span>
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* JACKS + ALIMENTATION */}
            <div className="grid grid-cols-2 gap-2">
              <LocationDropdown
                label={t(
                  "customMenu.jackLocations"
                )}
                locations={jackLocations}
                setLocations={setJackLocations}
                open={jackLocationsOpen}
                setOpen={setJackLocationsOpen}
                containerRef={jackLocationsRef}
                options={LOCATION_OPTIONS}
                closeOtherMenus={closeAllMenus}
              />

              <LocationDropdown
                label={t(
                  "customMenu.powerLocations"
                )}
                locations={powerLocations}
                setLocations={setPowerLocations}
                open={powerLocationsOpen}
                setOpen={setPowerLocationsOpen}
                containerRef={powerLocationsRef}
                options={LOCATION_OPTIONS}
                closeOtherMenus={closeAllMenus}
              />
            </div>

            {/* VOLTAGE + AMPÉRAGE */}
            <div className="grid grid-cols-2 gap-2">
              <div
                ref={customVoltageRef}
                className="relative h-[34px]"
              >
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen =
                      !customVoltageOpen;

                    closeAllMenus();
                    setCustomVoltageOpen(
                      nextOpen
                    );
                  }}
                  className="
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
                  "
                >
                  <span>
                    {customVoltage
                      ? `${customVoltage}V DC`
                      : t(
                        "customMenu.voltage"
                      )}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`
                      text-zinc-500
                      transition-transform
                      ${customVoltageOpen
                        ? "rotate-180"
                        : ""
                      }
                    `}
                  />
                </button>

                {customVoltageOpen && (
                  <div
                    className="
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
                    "
                  >
                    {[
                      "9",
                      "12",
                      "18",
                      "24",
                    ].map((voltage) => (
                      <button
                        key={voltage}
                        type="button"
                        onClick={() => {
                          setCustomVoltage(
                            voltage
                          );

                          setCustomVoltageOpen(
                            false
                          );
                        }}
                        className="
                          w-full
                          h-[25px]
                          px-3
                          text-left
                          text-[10px]
                          flex
                          items-center
                          hover:bg-canvas
                        "
                      >
                        {voltage}V DC
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="number"
                min={0}
                placeholder={t(
                  "customMenu.current"
                )}
                value={customDraw}
                onChange={(event) =>
                  setCustomDraw(
                    event.target.value
                  )
                }
                className="
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
                "
              />
            </div>

            {/* APERÇU PÉDALE */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="text-[11px] font-black uppercase tracking-wide">
                {t("export.preview")}
              </div>

              <div
                className="
                  min-h-[145px]
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
                "
              >
                <div
                  className="
                    relative
                    shrink-0
                    overflow-visible
                  "
                  style={{
                    width: `${previewWidthPx}px`,
                    height: `${previewHeightPx}px`,
                  }}
                >
                  {/* JACK GAUCHE */}
                  {jackLocations.includes("left") && (
                    <img
                      src="/images/jack-left.webp"
                      alt=""
                      draggable={false}
                      className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      "
                      style={{
                        width: `${previewSideJackWidth}px`,
                        height: `${previewSideJackHeight}px`,
                        left: `${-previewSideJackOffset}px`,
                        top: `${previewHeightPx / 2 -
                          previewSideJackHeight / 2
                          }px`,
                      }}
                    />
                  )}

                  {/* JACK DROIT */}
                  {jackLocations.includes("right") && (
                    <img
                      src="/images/jack-right.webp"
                      alt=""
                      draggable={false}
                      className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      "
                      style={{
                        width: `${previewSideJackWidth}px`,
                        height: `${previewSideJackHeight}px`,
                        right: `${-previewSideJackOffset}px`,
                        top: `${previewHeightPx / 2 -
                          previewSideJackHeight / 2
                          }px`,
                      }}
                    />
                  )}

                  {/* JACK BAS */}
                  {jackLocations.includes("bottom") && (
                    <img
                      src="/images/jack-down.webp"
                      alt=""
                      draggable={false}
                      className="
                        absolute
                        z-0
                        object-contain
                        pointer-events-none
                      "
                      style={{
                        width: `${previewHorizontalJackWidth}px`,
                        height: `${previewHorizontalJackHeight}px`,
                        left: `${previewWidthPx / 2 -
                          previewHorizontalJackWidth / 2
                          }px`,
                        bottom: `${-previewHorizontalJackOffset}px`,
                      }}
                    />
                  )}

                  {/* JACKS DU HAUT */}
                  {jackLocations.includes("top") && (
                    <>
                      <img
                        src="/images/jack-top.webp"
                        alt=""
                        draggable={false}
                        className="
                          absolute
                          z-0
                          object-contain
                          pointer-events-none
                        "
                        style={{
                          width: `${previewHorizontalJackWidth}px`,
                          height: `${previewHorizontalJackHeight}px`,
                          left: `${previewWidthPx * 0.3 -
                            previewHorizontalJackWidth / 2
                            }px`,
                          top: `${-previewHorizontalJackOffset}px`,
                        }}
                      />

                      <img
                        src="/images/jack-top.webp"
                        alt=""
                        draggable={false}
                        className="
                          absolute
                          z-0
                          object-contain
                          pointer-events-none
                        "
                        style={{
                          width: `${previewHorizontalJackWidth}px`,
                          height: `${previewHorizontalJackHeight}px`,
                          left: `${previewWidthPx * 0.7 -
                            previewHorizontalJackWidth / 2
                            }px`,
                          top: `${-previewHorizontalJackOffset}px`,
                        }}
                      />
                    </>
                  )}

                  {/* ENCLOSURE */}
                  <div
                    className="
                      absolute
                      inset-0
                      z-10
                      overflow-hidden
                      rounded-[6px]
                      shadow-lg
                      transition-all
                      duration-200
                    "
                  >
                    <img
                      src="/images/custom-pedal.webp"
                      alt=""
                      draggable={false}
                      className="
                        absolute
                        inset-0
                        w-full
                        h-full
                        object-fill
                        pointer-events-none
                      "
                    />

                    {customColor && (
                      <div
                        className="
                          absolute
                          inset-0
                          pointer-events-none
                        "
                        style={{
                          backgroundColor:
                            customColor,
                          opacity: 0.7,
                        }}
                      />
                    )}

                    {/* POTENTIOMÈTRES */}
                    {Array.from({
                      length: previewKnobCount,
                    }).map((_, index) => {
                      const spacing =
                        previewWidthPx /
                        (previewKnobCount + 1);

                      const offsetFromCenter =
                        (index -
                          (previewKnobCount - 1) /
                          2) *
                        spacing *
                        CANVAS_HARDWARE_SPREAD;

                      return (
                        <img
                          key={index}
                          src="/images/knob.webp"
                          alt=""
                          draggable={false}
                          className="
                            absolute
                            object-contain
                            pointer-events-none
                          "
                          style={{
                            width: `${previewKnobSizePx}px`,
                            height: `${previewKnobSizePx}px`,
                            left: `${previewWidthPx / 2 +
                              offsetFromCenter -
                              previewKnobSizePx / 2
                              }px`,
                            top: `${previewKnobTopPx}px`,
                          }}
                        />
                      );
                    })}

                    {/* NOM */}
                    <div
                      className="
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
                      "
                      style={{
                        fontSize: `${previewTextSizePx}px`,
                      }}
                    >
                      {customName.trim() ||
                        "CUSTOM"}
                    </div>

                    {/* FOOTSWITCH */}
                    <img
                      src="/images/footswitch.webp"
                      alt=""
                      draggable={false}
                      className="
                        absolute
                        object-contain
                        pointer-events-none
                      "
                      style={{
                        width: `${previewFootswitchSizePx}px`,
                        height: `${previewFootswitchSizePx}px`,
                        left: `${previewWidthPx / 2 -
                          previewFootswitchSizePx / 2
                          }px`,
                        top: `${previewFootswitchTopPx}px`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AJOUTER LA PÉDALE */}
            <button
              type="button"
              disabled={!isPedalValid}
              onClick={() => {
                addCustomItem({
                  name: customName,

                  color:
                    customColor ||
                    undefined,

                  voltage:
                    Number(customVoltage) ||
                    9,

                  power: customVoltage
                    ? `${customVoltage}V DC`
                    : "9V DC",

                  draw:
                    Number(customDraw) || 0,

                  jacksLocation:
                    jackLocations.join(", "),

                  powerLocation:
                    powerLocations.join(", "),
                });

                resetPedalFields();
              }}
              className={`
                w-full
                h-[34px]
                mt-2
                rounded-md
                bg-green-700
                hover:bg-green-600
                !text-white
                text-[10px]
                font-black
                uppercase
                transition-all
                duration-150
                ${isPedalValid
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
                }
              `}
            >
              {t("custom.addPedal")}
            </button>
          </div>
        )}

        {/* FORMULAIRE BOARD */}
        {customType === "board" && (
          <div className="flex flex-col gap-2 mt-2">
            {/* LARGEUR + PROFONDEUR */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={
                  units === "metric"
                    ? 1
                    : 0.1
                }
                placeholder={withUnit(
                  t("custom.width")
                )}
                value={customWidth}
                onChange={(event) =>
                  setCustomWidth(
                    event.target.value
                  )
                }
                className="
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
                "
              />

              <input
                type="number"
                min={minValue}
                max={maxValue}
                step={
                  units === "metric"
                    ? 1
                    : 0.1
                }
                placeholder={withUnit(
                  t("custom.depth")
                )}
                value={customDepth}
                onChange={(event) =>
                  setCustomDepth(
                    event.target.value
                  )
                }
                className="
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
                "
              />
            </div>

            {/* MENU DÉROULANT TYPE DE BOARD */}
            <div
              ref={boardTextureRef}
              className="relative h-[40px] mt-1"
            >
              <button
                type="button"
                onClick={() => {
                  const nextOpen =
                    !boardTextureOpen;

                  closeAllMenus();
                  setBoardTextureOpen(nextOpen);
                }}
                className="
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
                "
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="
                      w-[48px]
                      h-[24px]
                      rounded-[4px]
                      border
                      border-zinc-700
                      overflow-hidden
                      shrink-0
                      bg-zinc-900
                    "
                  >
                    <img
                      src={selectedBoardTexture.image}
                      alt=""
                      draggable={false}
                      className="
                        block
                        w-full
                        h-full
                        object-cover
                        pointer-events-none
                      "
                    />
                  </div>

                  <span className="truncate font-bold">
                    {selectedBoardTexture.label}
                  </span>
                </div>

                <ChevronDown
                  size={14}
                  className={`
                    ml-3
                    shrink-0
                    text-zinc-500
                    transition-transform
                    ${boardTextureOpen
                      ? "rotate-180"
                      : ""
                    }
                  `}
                />
              </button>

              {boardTextureOpen && (
                <div
                  className="
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
                  "
                >
                  {BOARD_TEXTURES.map(
                    (texture) => {
                      const active =
                        boardTexture ===
                        texture.value;

                      return (
                        <button
                          key={texture.value}
                          type="button"
                          onClick={() => {
                            setBoardTexture(
                              texture.value
                            );

                            setBoardTextureOpen(
                              false
                            );
                          }}
                          className={`
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
                              : "font-normal"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="
                                w-[48px]
                                h-[24px]
                                rounded-[4px]
                                border
                                border-zinc-700
                                overflow-hidden
                                shrink-0
                                bg-zinc-900
                              "
                            >
                              <img
                                src={texture.image}
                                alt=""
                                draggable={false}
                                className="
                                  block
                                  w-full
                                  h-full
                                  object-cover
                                  pointer-events-none
                                "
                              />
                            </div>

                            <span className="truncate">
                              {texture.label}
                            </span>
                          </div>

                          <span
                            className={`
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
                                : "border-zinc-500 bg-transparent"
                              }
                            `}
                          >
                            {active && (
                              <Check
                                size={11}
                                strokeWidth={3}
                                className="text-white"
                              />
                            )}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* APERÇU BOARD */}
            <div className="flex flex-col gap-2 mt-3">
              <div className="text-[11px] font-black uppercase tracking-wide">
                {t("export.preview")}
              </div>

              <div
                className="
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
  "

              >
                <div
                  className="
                    relative
                    shrink-0
                    overflow-hidden
                    rounded-[6px]
                    shadow-lg
                    transition-all
                    duration-200
                  "
                  style={{
                    width: `${previewWidthPx}px`,
                    height: `${previewHeightPx}px`,
                  }}
                >
                  <img
                    src={selectedBoardTexture.image}
                    alt={`Board ${selectedBoardTexture.label}`}
                    draggable={false}
                    className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-fill
                      pointer-events-none
                    "
                  />
                </div>
              </div>
            </div>

            {/* AJOUTER LE BOARD */}
            <button
              type="button"
              disabled={!isBoardValid}
              onClick={() => {
                addCustomItem({
                  name:
                    customName.trim() ||
                    "Custom Board",

                  image:
                    selectedBoardTexture.image,

                  image_url:
                    selectedBoardTexture.image,

                  photo:
                    selectedBoardTexture.image,

                  boardTexture:
                    selectedBoardTexture.value,
                });

                resetBoardFields();
              }}
              className={`
                w-full
                h-[34px]
                mt-2
                rounded-md
                bg-green-700
                hover:bg-green-600
                !text-white
                text-[10px]
                font-black
                uppercase
                transition-all
                duration-150
                ${isBoardValid
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
                }
              `}
            >
              {t("custom.addBoard")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}