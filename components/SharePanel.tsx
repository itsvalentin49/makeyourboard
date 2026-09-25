"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Share2,
    Copy,
    Check,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import {
    getTranslator,
    type Language,
} from "@/utils/i18n";

type AnyRow = Record<string, any>;

type Props = {
    isLightTheme: boolean;
    isMobile?: boolean;
    language: Language;

    boardName?: string;

    boardPedals: AnyRow[];
    selectedBoards?: AnyRow[];
    signalPath?: AnyRow[];

    zoom: number;
    stageX?: number;
    stageY?: number;

    displaySizes: Record<
        number,
        {
            w: number;
            h: number;
        }
    >;

    canvasBg: string;
    selectedBackgroundSrc?: string;

    onClose: () => void;
};

export default function SharePanel({
    isLightTheme,
    isMobile = false,
    language,
    boardName,

    boardPedals,
    selectedBoards = [],
    signalPath = [],

    zoom,
    stageX,
    stageY,

    displaySizes,

    canvasBg,
    selectedBackgroundSrc,
}: Props) {
    const t = getTranslator(language);

    const [loading, setLoading] =
        useState(false);

    const [shareUrl, setShareUrl] =
        useState<string | null>(null);

    const [copied, setCopied] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [name, setName] =
        useState(
            boardName ||
            "My Pedalboard"
        );

    const previewRef =
        useRef<HTMLCanvasElement | null>(
            null
        );

    const previewRenderIdRef =
        useRef(0);

    /* =========================================================
       CURRENT BACKGROUND
       ========================================================= */

    const currentBackground:
        | {
            type: "css";
        }
        | {
            type: "image";
            src: string;
        } = selectedBackgroundSrc
            ? {
                type: "image",
                src: selectedBackgroundSrc,
            }
            : {
                type: "css",
            };

    /* =========================================================
       PREVIEW ITEMS
       ========================================================= */

    const getRenderItems =
        (): AnyRow[] =>
            [
                ...(selectedBoards || []).map(
                    (item: AnyRow) => ({
                        ...item,
                        kind: "board",
                    })
                ),

                ...(boardPedals || []).map(
                    (item: AnyRow) => ({
                        ...item,
                        kind: "pedal",
                    })
                ),
            ].sort(
                (
                    a: AnyRow,
                    b: AnyRow
                ) =>
                    (Number(a.zIndex) || 0) -
                    (Number(b.zIndex) || 0)
            );

    /* =========================================================
       CUSTOM PEDAL RENDER
       ========================================================= */

    const drawCustomPedal = (
        ctx: CanvasRenderingContext2D,
        item: AnyRow,
        w: number,
        h: number,
        knobImg: HTMLImageElement,
        footswitchImg: HTMLImageElement,
        img?: HTMLImageElement | null
    ) => {
        const radius = 5;
        const hasColor = !!item.color;

        ctx.save();

        ctx.beginPath();

        ctx.moveTo(
            -w / 2 + radius,
            -h / 2
        );

        ctx.lineTo(
            w / 2 - radius,
            -h / 2
        );

        ctx.quadraticCurveTo(
            w / 2,
            -h / 2,
            w / 2,
            -h / 2 + radius
        );

        ctx.lineTo(
            w / 2,
            h / 2 - radius
        );

        ctx.quadraticCurveTo(
            w / 2,
            h / 2,
            w / 2 - radius,
            h / 2
        );

        ctx.lineTo(
            -w / 2 + radius,
            h / 2
        );

        ctx.quadraticCurveTo(
            -w / 2,
            h / 2,
            -w / 2,
            h / 2 - radius
        );

        ctx.lineTo(
            -w / 2,
            -h / 2 + radius
        );

        ctx.quadraticCurveTo(
            -w / 2,
            -h / 2,
            -w / 2 + radius,
            -h / 2
        );

        ctx.closePath();
        ctx.clip();

        if (img) {
            ctx.drawImage(
                img,
                -w / 2,
                -h / 2,
                w,
                h
            );
        } else {
            ctx.fillStyle =
                item.color || "#888";

            ctx.fillRect(
                -w / 2,
                -h / 2,
                w,
                h
            );
        }

        if (hasColor) {
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = item.color;

            ctx.fillRect(
                -w / 2,
                -h / 2,
                w,
                h
            );

            ctx.globalAlpha = 1;
        }

        ctx.restore();

        const knobSize = 25;
        const footswitchSize = 18;

        const knobCount =
            Number(item.width) < 70
                ? 1
                : Number(item.width) <= 100
                    ? 2
                    : 3;

        const knobY =
            -h / 2 + 14;

        const spacing =
            w / (knobCount + 1);

        const spread = 1.25;

        for (
            let i = 0;
            i < knobCount;
            i++
        ) {
            const offsetFromCenter =
                (i -
                    (knobCount - 1) / 2) *
                spacing *
                spread;

            ctx.drawImage(
                knobImg,
                offsetFromCenter -
                knobSize / 2,
                knobY,
                knobSize,
                knobSize
            );
        }

        ctx.drawImage(
            footswitchImg,
            -footswitchSize / 2,
            h / 2 - 30,
            footswitchSize,
            footswitchSize
        );

        if (item.name) {
            ctx.fillStyle = "#000000";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 0.5;

            ctx.font =
                "bold 8px Arial";

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.strokeText(
                item.name.toUpperCase(),
                0,
                0
            );

            ctx.fillText(
                item.name.toUpperCase(),
                0,
                0
            );
        }
    };

    /* =========================================================
       DRAW ITEMS
       ========================================================= */

    const drawItems =
        async (
            ctx: CanvasRenderingContext2D,
            minX: number,
            minY: number,
            loadImage: (
                src: string
            ) => Promise<HTMLImageElement>
        ) => {
            const knobImg =
                await loadImage(
                    "/images/knob.webp"
                );

            const footswitchImg =
                await loadImage(
                    "/images/footswitch.webp"
                );

            for (
                const item of getRenderItems()
            ) {
                const size =
                    displaySizes[
                    Number(
                        item.instanceId
                    )
                    ];

                if (!size) continue;

                const imgSrc =
                    item.image ||
                    item.image_url ||
                    item.photo ||
                    null;

                const w = size.w;
                const h = size.h;

                const drawX =
                    item.x - minX;

                const drawY =
                    item.y - minY;

                const rotation =
                    ((item.rotation || 0) *
                        Math.PI) /
                    180;

                ctx.save();

                ctx.translate(
                    drawX,
                    drawY
                );

                ctx.rotate(
                    rotation
                );

                /* BOARD */

                if (
                    item.kind ===
                    "board"
                ) {
                    if (imgSrc) {
                        const img =
                            await loadImage(
                                imgSrc
                            );

                        ctx.drawImage(
                            img,
                            -w / 2,
                            -h / 2,
                            w,
                            h
                        );
                    }

                    ctx.restore();
                    continue;
                }

                /* PEDAL */

                const img =
                    imgSrc
                        ? await loadImage(
                            imgSrc
                        )
                        : null;

                if (
                    item.slug ===
                    "custom"
                ) {
                    drawCustomPedal(
                        ctx,
                        item,
                        w,
                        h,
                        knobImg,
                        footswitchImg,
                        img
                    );
                } else if (img) {
                    ctx.drawImage(
                        img,
                        -w / 2,
                        -h / 2,
                        w,
                        h
                    );
                }

                ctx.restore();
            }
        };

    /* =========================================================
       PREVIEW BOUNDS
       ========================================================= */

    const getPreviewBounds =
        () => {
            let minX = Infinity;
            let minY = Infinity;

            let maxX = -Infinity;
            let maxY = -Infinity;

            getRenderItems().forEach(
                (item) => {
                    const size =
                        displaySizes[
                        Number(
                            item.instanceId
                        )
                        ];

                    if (!size) return;

                    const w = size.w;
                    const h = size.h;

                    const rotation =
                        ((Number(
                            item.rotation
                        ) || 0) *
                            Math.PI) /
                        180;

                    const corners = [
                        {
                            x: -w / 2,
                            y: -h / 2,
                        },
                        {
                            x: w / 2,
                            y: -h / 2,
                        },
                        {
                            x: w / 2,
                            y: h / 2,
                        },
                        {
                            x: -w / 2,
                            y: h / 2,
                        },
                    ];

                    corners.forEach(
                        (corner) => {
                            const rotatedX =
                                corner.x *
                                Math.cos(
                                    rotation
                                ) -
                                corner.y *
                                Math.sin(
                                    rotation
                                );

                            const rotatedY =
                                corner.x *
                                Math.sin(
                                    rotation
                                ) +
                                corner.y *
                                Math.cos(
                                    rotation
                                );

                            const worldX =
                                item.x +
                                rotatedX;

                            const worldY =
                                item.y +
                                rotatedY;

                            minX =
                                Math.min(
                                    minX,
                                    worldX
                                );

                            minY =
                                Math.min(
                                    minY,
                                    worldY
                                );

                            maxX =
                                Math.max(
                                    maxX,
                                    worldX
                                );

                            maxY =
                                Math.max(
                                    maxY,
                                    worldY
                                );
                        }
                    );
                }
            );

            const PADDING = 20;

            minX -= PADDING;
            minY -= PADDING;

            maxX += PADDING;
            maxY += PADDING;

            return {
                minX,
                minY,

                width:
                    maxX - minX,

                height:
                    maxY - minY,
            };
        };

    /* =========================================================
       BACKGROUND
       ========================================================= */

    const drawBackground =
        async (
            ctx: CanvasRenderingContext2D,
            width: number,
            height: number,

            loadImage: (
                src: string
            ) => Promise<HTMLImageElement>
        ) => {
            if (
                currentBackground.type ===
                "css"
            ) {
                const color =
                    getComputedStyle(
                        document.documentElement
                    )
                        .getPropertyValue(
                            document.documentElement.classList.contains(
                                "light"
                            )
                                ? "--zinc-200"
                                : "--zinc-600"
                        )
                        .trim();

                ctx.fillStyle =
                    color;

                ctx.fillRect(
                    0,
                    0,
                    width,
                    height
                );
            }

            if (
                currentBackground.type ===
                "image" &&
                currentBackground.src
            ) {
                const bgImg =
                    await loadImage(
                        currentBackground.src
                    );

                ctx.drawImage(
                    bgImg,
                    0,
                    0,
                    width,
                    height
                );
            }
        };

    /* =========================================================
       PREVIEW RENDER
       ========================================================= */

    const renderPreview =
        async () => {
            const hasItems =
                !!boardPedals?.length ||
                !!selectedBoards?.length;

            if (
                hasItems &&
                Object.keys(
                    displaySizes
                ).length === 0
            ) {
                return;
            }

            const renderId =
                ++previewRenderIdRef.current;

            try {
                const loadImage = (
                    src: string
                ): Promise<HTMLImageElement> =>
                    new Promise(
                        (
                            resolve,
                            reject
                        ) => {
                            const img =
                                new Image();

                            img.crossOrigin =
                                "anonymous";

                            img.src = src;

                            img.onload =
                                () =>
                                    resolve(img);

                            img.onerror =
                                reject;
                        }
                    );

                /* EMPTY */

                if (!hasItems) {
                    const canvas =
                        previewRef.current;

                    if (!canvas) return;

                    const ctx =
                        canvas.getContext(
                            "2d"
                        );

                    if (!ctx) return;

                    const width = 240;
                    const height = 135;
                    const SCALE = 3;

                    canvas.width =
                        width * SCALE;

                    canvas.height =
                        height * SCALE;

                    ctx.setTransform(
                        SCALE,
                        0,
                        0,
                        SCALE,
                        0,
                        0
                    );

                    ctx.clearRect(
                        0,
                        0,
                        width,
                        height
                    );

                    ctx.imageSmoothingEnabled =
                        true;

                    await drawBackground(
                        ctx,
                        width,
                        height,
                        loadImage
                    );

                    return;
                }

                const {
                    minX,
                    minY,
                    width,
                    height,
                } =
                    getPreviewBounds();

                if (
                    !isFinite(width) ||
                    !isFinite(height)
                ) {
                    return;
                }

                const visibleCanvas =
                    previewRef.current;

                if (!visibleCanvas) {
                    return;
                }

                const visibleCtx =
                    visibleCanvas.getContext(
                        "2d"
                    );

                if (!visibleCtx) {
                    return;
                }

                const SCALE = 6;

                const tempCanvas =
                    document.createElement(
                        "canvas"
                    );

                const tempCtx =
                    tempCanvas.getContext(
                        "2d"
                    );

                if (!tempCtx) {
                    return;
                }

                tempCanvas.width =
                    width * SCALE;

                tempCanvas.height =
                    height * SCALE;

                tempCtx.setTransform(
                    SCALE,
                    0,
                    0,
                    SCALE,
                    0,
                    0
                );

                tempCtx.clearRect(
                    0,
                    0,
                    width,
                    height
                );

                tempCtx.imageSmoothingEnabled =
                    true;

                await drawBackground(
                    tempCtx,
                    width,
                    height,
                    loadImage
                );

                if (
                    renderId !==
                    previewRenderIdRef.current
                ) {
                    return;
                }

                await drawItems(
                    tempCtx,
                    minX,
                    minY,
                    loadImage
                );

                if (
                    renderId !==
                    previewRenderIdRef.current
                ) {
                    return;
                }

                visibleCanvas.width =
                    tempCanvas.width;

                visibleCanvas.height =
                    tempCanvas.height;

                visibleCtx.setTransform(
                    1,
                    0,
                    0,
                    1,
                    0,
                    0
                );

                visibleCtx.clearRect(
                    0,
                    0,
                    visibleCanvas.width,
                    visibleCanvas.height
                );

                visibleCtx.drawImage(
                    tempCanvas,
                    0,
                    0
                );
            } catch (e) {
                console.error(e);
            }
        };

    /* =========================================================
       AUTO PREVIEW
       ========================================================= */

    useEffect(() => {
        renderPreview();
    }, [
        boardPedals,
        selectedBoards,
        displaySizes,
        canvasBg,
        selectedBackgroundSrc,
        isLightTheme,
    ]);

    /* =========================================================
       CREATE SHARE LINK
       ========================================================= */

    const createShareLink =
        async () => {
            if (loading) return;

            setLoading(true);
            setError(null);

            try {
                const id =
                    crypto
                        .randomUUID()
                        .replaceAll(
                            "-",
                            ""
                        )
                        .slice(
                            0,
                            12
                        );

                const snapshot = {
                    version: 1,

                    project: {
                        name:
                            name.trim() ||
                            "My Pedalboard",

                        boardPedals,
                        selectedBoards,
                        signalPath,

                        zoom,

                        stageX:
                            typeof stageX ===
                                "number"
                                ? stageX
                                : 0,

                        stageY:
                            typeof stageY ===
                                "number"
                                ? stageY
                                : 0,
                    },

                    displaySizes,

                    appearance: {
                        canvasBg,

                        selectedBackgroundSrc:
                            selectedBackgroundSrc ||
                            null,
                    },
                };

                const {
                    error:
                    insertError,
                } =
                    await supabase
                        .from(
                            "shared_boards"
                        )
                        .insert({
                            id,

                            name:
                                name.trim() ||
                                "My Pedalboard",

                            data:
                                snapshot,
                        });

                if (
                    insertError
                ) {
                    throw insertError;
                }

                const url =
                    `${window.location.origin}/board/${id}`;

                setShareUrl(url);
            } catch (err) {
                console.error(
                    "Error creating shared board:",
                    err
                );

                setError(
                    t(
                        "share.error"
                    )
                );
            } finally {
                setLoading(false);
            }
        };

    /* =========================================================
       COPY
       ========================================================= */

    const copyShareLink =
        async () => {
            if (!shareUrl) return;

            try {
                await navigator.clipboard.writeText(
                    shareUrl
                );

                setCopied(true);

                window.setTimeout(
                    () => {
                        setCopied(false);
                    },
                    1800
                );
            } catch (err) {
                console.error(
                    "Unable to copy link:",
                    err
                );
            }
        };

    /* =========================================================
       UI
       ========================================================= */

    return (
        <div
            className={
                isMobile
                    ? "w-full min-h-full bg-zinc-800 border-0 rounded-none shadow-none p-6 flex flex-col gap-6"
                    : "w-full bg-transparent border-0 rounded-none shadow-none p-0 flex flex-col gap-6"
            }
        >
            {/* TITLE */}

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Share2 size={18} />

                {t(
                    "share.title"
                )}
            </div>

            {/* BOARD NAME */}

            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-wider font-bold">
                    {t(
                        "share.boardName"
                    )}
                </label>

                <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                        setName(
                            e.target.value
                        )
                    }
                    maxLength={120}
                    className="
            h-9
            px-3
            rounded-md
            bg-zinc-950
            border
            border-zinc-700
            text-[12px]
            font-mono
            outline-none
            focus:border-blue-500
          "
                />
            </div>

            {/* PREVIEW */}

            <div className="flex flex-col gap-2 -mt-2">
                <label className="text-[10px] uppercase tracking-wider font-bold">
                    {t(
                        "export.preview"
                    )}
                </label>

                <div className="w-full overflow-hidden flex justify-center">
                    <canvas
                        ref={previewRef}
                        className={
                            isMobile
                                ? "block w-full h-auto rounded-md"
                                : "block max-w-full max-h-40 rounded-md"
                        }
                    />
                </div>
            </div>

            {!shareUrl ? (
                <>
                    {/* CREATE */}

                    <button
                        type="button"
                        onClick={
                            createShareLink
                        }
                        disabled={
                            loading
                        }
                        className="
              w-full
              h-[35px]
              px-3
              rounded-lg
              border-0
              bg-blue-600
              !text-white
              text-[10px]
              font-black
              uppercase
              flex
              items-center
              justify-center
              gap-2
              transition-colors
              hover:bg-blue-500
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
                    >
                        <Share2
                            size={15}
                        />

                        {loading
                            ? t(
                                "share.creating"
                            )
                            : t(
                                "share.createLink"
                            )}
                    </button>

                    {error && (
                        <div className="text-[11px] text-red-400">
                            {error}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* LINK */}

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold">
                            {t(
                                "share.shareLink"
                            )}
                        </label>

                        <div className="flex gap-2">
                            <div
                                className="
                  min-w-0
                  flex-1
                  h-9
                  px-3
                  rounded-md
                  bg-zinc-950
                  border
                  border-zinc-700
                  flex
                  items-center
                  text-[11px]
                  font-mono
                  overflow-hidden
                "
                            >
                                <span className="truncate">
                                    {shareUrl}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    copyShareLink
                                }
                                className="
                  w-9
                  h-9
                  rounded-md
                  bg-zinc-950
                  border
                  border-zinc-700
                  flex
                  items-center
                  justify-center
                  hover:border-blue-500
                "
                                aria-label={t(
                                    "share.copy"
                                )}
                                title={
                                    copied
                                        ? t(
                                            "share.copied"
                                        )
                                        : t(
                                            "share.copy"
                                        )
                                }
                            >
                                {copied ? (
                                    <Check
                                        size={
                                            15
                                        }
                                        className="text-green-500"
                                    />
                                ) : (
                                    <Copy
                                        size={
                                            15
                                        }
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* SUCCESS */}

                    <div className="text-xs leading-relaxed text-zinc-400">
                        {t(
                            "share.ready"
                        )}
                    </div>
                </>
            )}
        </div>
    );
}