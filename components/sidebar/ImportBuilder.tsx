"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { saveCustomImage } from "@/utils/customImageStore";

type AnyRow = Record<string, any>;

type Props = {
    addCustomItem: (item: AnyRow) => void;
    units: "metric" | "imperial";
    withUnit: (label: string) => string;
    t: (key: string) => string;
};

export default function ImportBuilder({
    addCustomItem,
    units,
    withUnit,
    t,
}: Props) {
    const [uploadModel, setUploadModel] = useState("");
    const [uploadImage, setUploadImage] = useState<string | null>(null);
    const [uploadImageId, setUploadImageId] = useState<string | null>(null);
    const [uploadWidth, setUploadWidth] = useState("");
    const [uploadDepth, setUploadDepth] = useState("");
    const [uploadVoltage, setUploadVoltage] = useState("");
    const [uploadDraw, setUploadDraw] = useState("");
    const [voltageOpen, setVoltageOpen] = useState(false);

    const voltageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                voltageRef.current &&
                !voltageRef.current.contains(event.target as Node)
            ) {
                setVoltageOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (uploadImage?.startsWith("blob:")) {
                URL.revokeObjectURL(uploadImage);
            }
        };
    }, [uploadImage]);

    /*
      Dimensions physiques utilisées uniquement pour le canvas.
  
      L’aperçu conserve toujours le ratio naturel du fichier image
      et n’est pas modifié par ces valeurs.
    */
    const uploadWidthMm =
        units === "metric"
            ? Number(uploadWidth)
            : Number(uploadWidth) * 25.4;

    const uploadDepthMm =
        units === "metric"
            ? Number(uploadDepth)
            : Number(uploadDepth) * 25.4;

    const isUploadValid =
        Boolean(uploadImage) &&
        uploadWidthMm >= 30 &&
        uploadWidthMm <= 500 &&
        uploadDepthMm >= 30 &&
        uploadDepthMm <= 500;

    const handleLocalImageUpload = async (file: File | null) => {
        if (!file) return;

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Format non supporté. Utilise PNG, JPG ou WEBP.");
            return;
        }

        if (file.size > 300_000) {
            alert("Image trop lourde. Maximum : 300 Ko.");
            return;
        }

        if (uploadImage?.startsWith("blob:")) {
            URL.revokeObjectURL(uploadImage);
        }

        const imageId = await saveCustomImage(file);
        const previewUrl = URL.createObjectURL(file);

        setUploadImageId(imageId);
        setUploadImage(previewUrl);
    };

    const removeImage = () => {
        if (uploadImage?.startsWith("blob:")) {
            URL.revokeObjectURL(uploadImage);
        }

        setUploadImage(null);
        setUploadImageId(null);
    };

    const resetForm = () => {
        removeImage();
        setUploadModel("");
        setUploadWidth("");
        setUploadDepth("");
        setUploadVoltage("");
        setUploadDraw("");
        setVoltageOpen(false);
    };

    return (
        <div
            className="
        flex
        flex-col
        gap-2
        mt-4
        h-full
        min-h-0
        overflow-y-auto
        no-scrollbar
        pb-10
      "
        >
            {/* INTRODUCTION */}
            <div className="flex flex-col gap-[2px]">
                <div className="text-[11px] font-black uppercase tracking-wide">
                    {t("customMenu.importSubtitle")}
                </div>

                <div className="text-[9px] leading-[1.45]">
                    <div>• {t("customMenu.formats")}</div>
                    <div>• {t("customMenu.maxSize")}</div>
                    <div>• {t("customMenu.imageDimensions")}</div>
                </div>
            </div>

            {/* CHOISIR OU REMPLACER UNE IMAGE */}
            <label
                className="
          mt-2
          h-[34px]
          rounded-lg
          border
          border-blue-500
          bg-blue-500/10
          hover:bg-blue-500/20
          transition-all
          cursor-pointer
          flex
          items-center
          justify-center
          text-[9px]
          font-black
          uppercase
          tracking-wide
        "
            >
                {t("customMenu.chooseImage")}

                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                        handleLocalImageUpload(
                            event.target.files?.[0] || null
                        );

                        /*
                          Permet de choisir de nouveau le même fichier,
                          notamment après avoir supprimé l’image.
                        */
                        event.target.value = "";
                    }}
                />
            </label>

            {/* NOM */}
            <input
                type="text"
                placeholder={t("custom.namePlaceholder")}
                value={uploadModel}
                onChange={(event) => {
                    setUploadModel(event.target.value);
                }}
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

            {/* DIMENSIONS */}
            <div className="grid grid-cols-2 gap-2">
                <input
                    type="number"
                    min={units === "metric" ? 30 : 30 / 25.4}
                    max={units === "metric" ? 500 : 500 / 25.4}
                    step={units === "metric" ? 1 : 0.1}
                    placeholder={withUnit(t("custom.width"))}
                    value={uploadWidth}
                    onChange={(event) => {
                        setUploadWidth(event.target.value);
                    }}
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
                    min={units === "metric" ? 30 : 30 / 25.4}
                    max={units === "metric" ? 500 : 500 / 25.4}
                    step={units === "metric" ? 1 : 0.1}
                    placeholder={withUnit(t("custom.depth"))}
                    value={uploadDepth}
                    onChange={(event) => {
                        setUploadDepth(event.target.value);
                    }}
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

            {/* VOLTAGE + CONSOMMATION */}
            <div className="grid grid-cols-2 gap-2">
                <div
                    ref={voltageRef}
                    className="relative h-[34px]"
                >
                    <button
                        type="button"
                        onClick={() => {
                            setVoltageOpen((current) => !current);
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
                            {uploadVoltage
                                ? `${uploadVoltage}V DC`
                                : t("customMenu.voltage")}
                        </span>

                        <ChevronDown
                            size={14}
                            className={`
                text-zinc-500
                transition-transform
                ${voltageOpen ? "rotate-180" : ""}
              `}
                        />
                    </button>

                    {voltageOpen && (
                        <div
                            className="
                absolute
                z-50
                mt-1
                w-full
                bg-zinc-950
                border
                border-zinc-800
                rounded-lg
                overflow-hidden
              "
                        >
                            {["9", "12", "18", "24"].map((voltage) => (
                                <button
                                    key={voltage}
                                    type="button"
                                    onClick={() => {
                                        setUploadVoltage(voltage);
                                        setVoltageOpen(false);
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
                    placeholder={t("customMenu.current")}
                    value={uploadDraw}
                    onChange={(event) => {
                        setUploadDraw(event.target.value);
                    }}
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

            {/* APERÇU */}
            {uploadImage && (
                <div className="flex flex-col gap-2 mt-2">
                    <div className="text-[11px] font-black uppercase tracking-wide">
                        {t("export.preview")}
                    </div>

                    <div
                        className="
        relative
        h-[145px]
        rounded-lg
        border
        border-zinc-800
        bg-zinc-950
        p-1
        flex
        items-center
        justify-center
        overflow-hidden
      "
                    >
                        <>
                            {/* IMAGE AU RATIO NATUREL */}
                            <img
                                src={uploadImage}
                                alt={
                                    uploadModel.trim() ||
                                    "Custom upload preview"
                                }
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                                className="
            block
            w-full
            h-full
            object-contain
            pointer-events-none
          "
                            />

                            {/* SUPPRIMER L’IMAGE */}
                            <button
                                type="button"
                                aria-label="Remove image"
                                onClick={removeImage}
                                className="
            absolute
            top-2
            right-2
            z-10
            w-[22px]
            h-[22px]
            rounded-full
            bg-zinc-950
            border
            border-zinc-700
            flex
            items-center
            justify-center
            hover:bg-zinc-900
            active:scale-95
            transition-all
          "
                            >
                                <X size={11} strokeWidth={2.5} />
                            </button>
                        </>
                    </div>
                </div>
            )}

            {/* AJOUTER */}
            <button
                type="button"
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
                        width: uploadWidthMm,
                        depth: uploadDepthMm,
                        voltage: Number(uploadVoltage) || 9,
                        power: uploadVoltage
                            ? `${uploadVoltage}V DC`
                            : "9V DC",
                        draw: Number(uploadDraw) || 0,
                        weight: 0,
                    });

                    resetForm();
                }}
                className={`
          w-full
          h-[34px]
          mt-2
          rounded-md
          !text-white
          bg-blue-600
          hover:bg-blue-500
          text-[10px]
          font-black
          uppercase
          transition-all
          duration-150
          ${isUploadValid
                        ? "hover:bg-blue-500 cursor-pointer"
                        : "cursor-not-allowed"
                    }
        `}
            >
                {t("customMenu.add")}
            </button>
        </div>
    );
}