"use client";

import React, { useEffect, useRef, useState } from "react";
import { Cable, GripVertical } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
    t: (key: string) => string;

    isMobile: boolean;
    isLightTheme: boolean;

    showCableMenu: boolean;
    onToggleCableMenu: () => void;

    showJacksMargin: boolean;
    setShowJacksMargin: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    showSignalChain: boolean;
    setShowSignalChain: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    boardPedals: AnyRow[];

    signalOrder: number[];
    setSignalOrder: React.Dispatch<
        React.SetStateAction<number[]>
    >;

    rightSidebarRef: React.Ref<HTMLDivElement>;

    mobileFullPanelClass: string;
    desktopRightSidebarClass: string;
    desktopRightSidebarStyle: React.CSSProperties;
};


/* =========================================================
   SIGNAL CHAIN
========================================================= */

const EXCLUDED_TYPES = new Set([
    "power",
    "power supply",
    "expression",
    "footswitch",
    "tap tempo",
    "midi controller",
    "midi switcher",
    "accessory",
    "audio interface",
    "drum machine",
    "utility",
    "a/b box",
    "aby switcher",
    "line selector",
    "loop switcher",
    "switcher",
]);


const SIGNAL_PRIORITY: Record<string, number> = {
    /* INPUT */
    "Wireless System": 10,
    Tuner: 20,
    Buffer: 30,

    /* DYNAMICS */
    Compressor: 40,
    Limiter: 41,
    Sustainer: 42,

    /* FILTER / PITCH */
    Wah: 50,
    "Envelope Filter": 51,
    Filter: 52,
    Octaver: 53,
    Pitch: 54,
    Whammy: 55,
    Synth: 56,

    /* GAIN */
    Fuzz: 60,
    Boost: 61,
    Overdrive: 62,
    Distortion: 63,
    "Noise Gate": 64,

    /* PREAMP / EQ */
    Preamp: 70,
    Equalizer: 71,
    EQ: 71,
    Enhancer: 72,
    Acoustic: 73,
    "Acoustic Simulator": 74,

    /* MULTI EFFECT */
    "Multi-FX": 80,

    /* MODULATION */
    Chorus: 90,
    Flanger: 91,
    Phaser: 92,
    "Uni-Vibe": 93,
    Vibe: 93,
    Doubler: 94,
    "Ring Modulator": 95,
    "Bit Crusher": 96,
    "Lo-Fi": 97,

    /* MOVEMENT */
    Vibrato: 100,
    Rotary: 101,
    Tremolo: 102,
    Slicer: 103,
    Swell: 104,
    Volume: 105,

    /* TIME */
    Delay: 110,
    Reverb: 120,

    /* OUTPUT */
    Looper: 130,
    "Amp Simulator": 140,
    "Power Amp": 141,
    "Cab Simulator": 142,
    DI: 143,
    Vocal: 144,
};


function getRecommendedSignalOrder(
    pedals: AnyRow[]
): number[] {
    return pedals
        .filter((pedal) => {
            if (!pedal?.instanceId) return false;

            const type = String(
                pedal.type || ""
            )
                .trim()
                .toLowerCase();

            if (EXCLUDED_TYPES.has(type)) {
                return false;
            }

            return true;
        })
        .map((pedal, originalIndex) => ({
            pedal,
            originalIndex,
            priority:
                SIGNAL_PRIORITY[
                String(pedal.type || "").trim()
                ] ?? 500,
        }))
        .sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }

            return a.originalIndex - b.originalIndex;
        })
        .map((item) => item.pedal.instanceId);
}


/* =========================================================
   COMPONENT
========================================================= */

export default function CablesPanel({
    t,
    isMobile,
    isLightTheme,

    showCableMenu,
    onToggleCableMenu,

    showJacksMargin,
    setShowJacksMargin,

    showSignalChain,
    setShowSignalChain,

    boardPedals,

    signalOrder,
    setSignalOrder,

    rightSidebarRef,

    mobileFullPanelClass,
    desktopRightSidebarClass,
    desktopRightSidebarStyle,
}: Props) {

    /* =======================================================
       INITIALISE / UPDATE SIGNAL ORDER
    ======================================================= */

    useEffect(() => {
        const recommended =
            getRecommendedSignalOrder(boardPedals);

        const validIds = new Set(recommended);

        // Conserve l'ordre manuel des pédales déjà présentes
        const nextOrder = signalOrder.filter((id) =>
            validIds.has(id)
        );

        const existingSet = new Set(nextOrder);

        // Nouvelles pédales qui ne sont pas encore dans la chaîne
        const missing = recommended.filter(
            (id) => !existingSet.has(id)
        );

        // Position théorique de chaque pédale dans l'ordre conseillé
        const recommendedIndex = new Map(
            recommended.map((id, index) => [
                id,
                index,
            ])
        );

        // Insère chaque nouvelle pédale à la bonne position
        // au lieu de simplement l'ajouter à la fin
        missing.forEach((id) => {
            const priorityIndex =
                recommendedIndex.get(id) ?? Infinity;

            const insertIndex =
                nextOrder.findIndex(
                    (existingId) =>
                        (recommendedIndex.get(
                            existingId
                        ) ?? Infinity) >
                        priorityIndex
                );

            if (insertIndex === -1) {
                nextOrder.push(id);
            } else {
                nextOrder.splice(
                    insertIndex,
                    0,
                    id
                );
            }
        });

        const isSame =
            nextOrder.length === signalOrder.length &&
            nextOrder.every(
                (id, index) =>
                    id === signalOrder[index]
            );

        if (!isSame) {
            setSignalOrder(nextOrder);
        }
    }, [
        boardPedals,
        signalOrder,
        setSignalOrder,
    ]);


    const orderedPedals = signalOrder
        .map((id) =>
            boardPedals.find(
                (pedal) =>
                    pedal.instanceId === id
            )
        )
        .filter(Boolean) as AnyRow[];


    const resetRecommendedOrder = () => {
        setSignalOrder(
            getRecommendedSignalOrder(boardPedals)
        );
    };

    const [draggedPedalId, setDraggedPedalId] =
        useState<number | null>(null);

    const [signalDropIndex, setSignalDropIndex] =
        useState<number | null>(null);

    const signalDropIndexRef =
        useRef<number | null>(null);

    const draggedPedalIdRef =
        useRef<number | null>(null);

    const signalListRef =
        useRef<HTMLDivElement | null>(null);

    const setSignalDropTarget = (
        index: number | null
    ) => {
        signalDropIndexRef.current = index;
        setSignalDropIndex(index);
    };


    const moveSignalPedal = (
        draggedId: number,
        dropIndex: number
    ) => {
        setSignalOrder((currentOrder) => {
            const fromIndex =
                currentOrder.indexOf(draggedId);

            if (fromIndex === -1) {
                return currentOrder;
            }

            const nextOrder = [...currentOrder];

            nextOrder.splice(fromIndex, 1);

            let insertIndex = dropIndex;

            // La suppression de la pédale décale les positions
            // situées après son emplacement d'origine.
            if (fromIndex < dropIndex) {
                insertIndex -= 1;
            }

            insertIndex = Math.max(
                0,
                Math.min(insertIndex, nextOrder.length)
            );

            nextOrder.splice(
                insertIndex,
                0,
                draggedId
            );

            return nextOrder;
        });
    };


    const getSignalDropIndex = (
        clientY: number
    ): number | null => {
        const list = signalListRef.current;

        if (!list) {
            return null;
        }

        const cards = Array.from(
            list.querySelectorAll<HTMLElement>(
                "[data-signal-card]"
            )
        );

        for (
            let index = 0;
            index < cards.length;
            index += 1
        ) {
            const rect =
                cards[index].getBoundingClientRect();

            const middle =
                rect.top + rect.height / 2;

            if (clientY < middle) {
                return index;
            }
        }

        return cards.length;
    };


    return (
        <div className="relative">

            {/* ===================================================
          BUTTON
      =================================================== */}

            <button
                type="button"
                onClick={onToggleCableMenu}
                className={`
          hidden
          items-center justify-center gap-2
          ${isMobile
                        ? "h-8 w-20 text-[9px]"
                        : "h-10 w-28 text-[11px]"
                    }
          bg-zinc-900
          border border-zinc-800
          rounded-2xl
          shadow-2xl
          font-mono
          font-bold
          uppercase
          transition-all
          duration-200
          hover:scale-105
          hover:border-blue-500
          active:scale-95
          cursor-pointer
        `}
            >
                <Cable
                    size={16}
                    className={
                        showCableMenu
                            ? "text-red-500"
                            : undefined
                    }
                />

                {t("cables.title")}
            </button>


            {/* ===================================================
          PANEL
      =================================================== */}

            {showCableMenu && (
                <div
                    ref={rightSidebarRef}
                    className={
                        isMobile
                            ? mobileFullPanelClass
                            : desktopRightSidebarClass
                    }
                    style={
                        isMobile
                            ? undefined
                            : desktopRightSidebarStyle
                    }
                >
                    <div
                        className={
                            isMobile
                                ? "relative w-full min-h-full bg-zinc-800 border-0 rounded-none p-6"
                                : "relative w-full bg-transparent border-0 rounded-none p-0"
                        }
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* =============================================
                TITLE
            ============================================= */}

                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-6">

                            <img
                                src={
                                    isLightTheme
                                        ? "/images/tab-cables-dark.webp"
                                        : "/images/tab-cables-light.webp"
                                }
                                alt=""
                                aria-hidden="true"
                                draggable={false}
                                className="w-[18px] h-[18px] object-contain shrink-0"
                            />

                            {t("cables.title")}

                        </div>


                        {/* =============================================
                CABLE CLEARANCE
            ============================================= */}

                        <div className="relative">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowJacksMargin(
                                        (v) => !v
                                    )
                                }
                                className="
                  w-full
                  text-left
                  pr-14
                "
                            >
                                <div className="text-[10px] font-bold uppercase tracking-wide">
                                    {t(
                                        "cables.clearance"
                                    )}
                                </div>

                                <div className="text-[10px] font-medium mt-0.5 text-zinc-500 leading-snug">
                                    {t(
                                        "cables.clearanceDescription"
                                    )}
                                </div>
                            </button>

                            <div
                                className={`
                  absolute
                  top-0
                  right-0
                  w-10
                  h-5
                  rounded-full
                  transition-colors
                  duration-200
                  pointer-events-none
                  ${showJacksMargin
                                        ? "bg-blue-600"
                                        : "bg-zinc-700"
                                    }
                `}
                            >
                                <div
                                    className={`
                    absolute
                    top-0.5
                    left-0.5
                    w-4
                    h-4
                    rounded-full
                    bg-white
                    transition-transform
                    duration-200
                    ${showJacksMargin
                                            ? "translate-x-5"
                                            : "translate-x-0"
                                        }
                  `}
                                />
                            </div>
                        </div>

                        {/* CABLE CLEARANCE EXAMPLE */}

                        <div
                            className="mt-4 flex items-start justify-center"
                            style={{ gap: "48px" }}
                        >
                            {/* OK */}
                            <div className="flex flex-col items-center gap-2">

                                <div
                                    className="flex"
                                    style={{ gap: "12px" }}
                                >
                                    {[0, 1].map((item) => (
                                        <div
                                            key={item}
                                            className="
                        relative
                        flex
                        items-center
                        justify-center
                    "
                                            style={{
                                                width: "56px",
                                                height: "64px",
                                            }}
                                        >
                                            <svg
                                                className="absolute inset-0 pointer-events-none"
                                                style={{
                                                    width: "56px",
                                                    height: "64px",
                                                }}
                                                viewBox="0 0 56 64"
                                                aria-hidden="true"
                                            >
                                                <rect
                                                    x="1"
                                                    y="1"
                                                    width="54"
                                                    height="62"
                                                    rx="8"
                                                    fill="none"
                                                    stroke="#22c55e"
                                                    strokeWidth="1.25"
                                                    strokeDasharray="4 3"
                                                />
                                            </svg>

                                            <img
                                                src={
                                                    isLightTheme
                                                        ? "/images/tab-pedal2-dark.webp"
                                                        : "/images/tab-pedal2-light.webp"
                                                }
                                                alt=""
                                                aria-hidden="true"
                                                draggable={false}
                                                className="
                            w-10
                            h-10
                            object-contain
                            pointer-events-none
                            select-none
                        "
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="text-[10px] font-bold"
                                    style={{ color: "#22c55e" }}
                                >
                                    OK
                                </div>

                            </div>


                            {/* KO */}
                            <div className="flex flex-col items-center gap-2">

                                <div
                                    className="relative"
                                    style={{
                                        width: "102px",
                                        height: "64px",
                                    }}
                                >
                                    {/* PEDAL 1 */}
                                    <div
                                        className="
                    absolute
                    top-0
                    left-0
                    flex
                    items-center
                    justify-center
                "
                                        style={{
                                            width: "56px",
                                            height: "64px",
                                        }}
                                    >
                                        <img
                                            src={
                                                isLightTheme
                                                    ? "/images/tab-pedal2-dark.webp"
                                                    : "/images/tab-pedal2-light.webp"
                                            }
                                            alt=""
                                            aria-hidden="true"
                                            draggable={false}
                                            className="
                        w-10
                        h-10
                        object-contain
                        pointer-events-none
                        select-none
                    "
                                        />
                                    </div>

                                    {/* PEDAL 2 */}
                                    <div
                                        className="
                    absolute
                    top-0
                    flex
                    items-center
                    justify-center
                "
                                        style={{
                                            left: "46px",
                                            width: "56px",
                                            height: "64px",
                                        }}
                                    >
                                        <img
                                            src={
                                                isLightTheme
                                                    ? "/images/tab-pedal2-dark.webp"
                                                    : "/images/tab-pedal2-light.webp"
                                            }
                                            alt=""
                                            aria-hidden="true"
                                            draggable={false}
                                            className="
                        w-10
                        h-10
                        object-contain
                        pointer-events-none
                        select-none
                    "
                                        />
                                    </div>

                                    {/* RED OUTLINES — AU-DESSUS DES DEUX PÉDALES */}
                                    <svg
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            width: "102px",
                                            height: "64px",
                                            zIndex: 20,
                                        }}
                                        viewBox="0 0 102 64"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="1"
                                            y="1"
                                            width="54"
                                            height="62"
                                            rx="8"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="1.25"
                                            strokeDasharray="4 3"
                                        />

                                        <rect
                                            x="47"
                                            y="1"
                                            width="54"
                                            height="62"
                                            rx="8"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="1.25"
                                            strokeDasharray="4 3"
                                        />
                                    </svg>
                                </div>

                                <div
                                    className="text-[10px] font-bold"
                                    style={{ color: "#ef4444" }}
                                >
                                    KO
                                </div>

                            </div>
                        </div>

                        {/* =============================================
                SIGNAL CHAIN SWITCH
            ============================================= */}

                        <div className="relative pt-5 pb-2">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowSignalChain(
                                        (v) => !v
                                    )
                                }
                                className="
                  w-full
                  text-left
                  pr-14
                "
                            >
                                <div className="text-[10px] font-bold uppercase tracking-wide">
                                    {t("cables.signalChain")}
                                </div>

                                <div className="text-[10px] font-medium mt-0.5 text-zinc-500 leading-snug">
                                    {t("cables.signalChainDescription")}
                                </div>
                            </button>

                            <div
                                className={`
                  absolute
                  top-4
                  right-0
                  w-10
                  h-5
                  rounded-full
                  transition-colors
                  duration-200
                  pointer-events-none
                  ${showSignalChain
                                        ? "bg-blue-600"
                                        : "bg-zinc-700"
                                    }
                `}
                            >
                                <div
                                    className={`
                    absolute
                    top-0.5
                    left-0.5
                    w-4
                    h-4
                    rounded-full
                    bg-white
                    transition-transform
                    duration-200
                    ${showSignalChain
                                            ? "translate-x-5"
                                            : "translate-x-0"
                                        }
                  `}
                                />
                            </div>

                        </div>


                        {/* =============================================
                SIGNAL CHAIN LIST
            ============================================= */}

                        {showSignalChain && (
                            <div className="space-y-1">

                                {orderedPedals.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={resetRecommendedOrder}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.setProperty(
                                                "color",
                                                "var(--foreground)",
                                                "important"
                                            );
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.removeProperty(
                                                "color"
                                            );
                                        }}
                                        className="
            text-[9px]
            font-bold
            uppercase
            text-zinc-500
            transition-colors
            duration-150
        "
                                    >
                                        {t("cables.reset")}
                                    </button>
                                )}


                                {orderedPedals.length === 0 ? (

                                    <div className="text-[10px] font-medium leading-snug">
                                        {t("cables.empty")}
                                    </div>

                                ) : (

                                    <div ref={signalListRef}>

                                        {orderedPedals.map(
                                            (pedal, index) => (

                                                <React.Fragment key={pedal.instanceId}>

                                                    {/* INSERTION LINE BEFORE THIS CARD */}
                                                    <div
                                                        className="relative"
                                                        style={{ height: 6 }}
                                                    >
                                                        {signalDropIndex === index &&
                                                            draggedPedalId !== null && (
                                                                <div
                                                                    className="
                                                                        pointer-events-none
                                                                        absolute
                                                                        top-1/2
                                                                        left-2
                                                                        right-2
                                                                        h-[2px]
                                                                        -translate-y-1/2
                                                                        rounded-full
                                                                        z-20
                                                                    "
                                                                    style={{
                                                                        backgroundColor:
                                                                            "var(--foreground)",
                                                                    }}
                                                                />
                                                            )}
                                                    </div>

                                                    <div
                                                        data-signal-card
                                                        onPointerDown={(e) => {
                                                            if (e.button !== 0) {
                                                                return;
                                                            }

                                                            e.preventDefault();

                                                            draggedPedalIdRef.current =
                                                                pedal.instanceId;

                                                            setDraggedPedalId(
                                                                pedal.instanceId
                                                            );

                                                            setSignalDropTarget(null);

                                                            e.currentTarget.setPointerCapture(
                                                                e.pointerId
                                                            );

                                                            // Rend uniquement la carte déplacée semi-transparente
                                                            e.currentTarget.style.opacity = "0.4";
                                                        }}
                                                        onPointerMove={(e) => {
                                                            if (
                                                                draggedPedalIdRef.current !==
                                                                pedal.instanceId
                                                            ) {
                                                                return;
                                                            }

                                                            const nextDropIndex =
                                                                getSignalDropIndex(
                                                                    e.clientY
                                                                );

                                                            if (nextDropIndex !== null) {
                                                                setSignalDropTarget(
                                                                    nextDropIndex
                                                                );
                                                            }
                                                        }}
                                                        onPointerUp={(e) => {
                                                            if (
                                                                draggedPedalIdRef.current !==
                                                                pedal.instanceId
                                                            ) {
                                                                return;
                                                            }

                                                            e.currentTarget.style.opacity = "";

                                                            const dropIndex =
                                                                signalDropIndexRef.current;

                                                            draggedPedalIdRef.current = null;

                                                            if (
                                                                e.currentTarget.hasPointerCapture(
                                                                    e.pointerId
                                                                )
                                                            ) {
                                                                e.currentTarget.releasePointerCapture(
                                                                    e.pointerId
                                                                );
                                                            }

                                                            if (dropIndex !== null) {
                                                                moveSignalPedal(
                                                                    pedal.instanceId,
                                                                    dropIndex
                                                                );
                                                            }

                                                            setDraggedPedalId(null);
                                                            setSignalDropTarget(null);
                                                        }}
                                                        onPointerCancel={(e) => {
                                                            e.currentTarget.style.opacity = "";

                                                            draggedPedalIdRef.current = null;

                                                            if (
                                                                e.currentTarget.hasPointerCapture(
                                                                    e.pointerId
                                                                )
                                                            ) {
                                                                e.currentTarget.releasePointerCapture(
                                                                    e.pointerId
                                                                );
                                                            }

                                                            setDraggedPedalId(null);
                                                            setSignalDropTarget(null);
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            const grip = e.currentTarget.querySelector(
                                                                "[data-signal-grip]"
                                                            ) as SVGElement | null;

                                                            grip?.style.setProperty(
                                                                "color",
                                                                "var(--zinc-300)",
                                                                "important"
                                                            );
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const grip = e.currentTarget.querySelector(
                                                                "[data-signal-grip]"
                                                            ) as SVGElement | null;

                                                            grip?.style.removeProperty("color");
                                                        }}
                                                        className={`
        relative
        flex
        items-center
        gap-2
        min-h-[42px]
        px-3
        py-1
        rounded-lg
        border
        bg-zinc-950
        cursor-grab
        active:cursor-grabbing
        transition-all
        duration-150
border-zinc-700
    `}
                                                    >

                                                        {/* DRAG HANDLE */}

                                                        <GripVertical
                                                            data-signal-grip
                                                            size={14}
                                                            className="
        shrink-0
        text-zinc-600
        transition-colors
        duration-150
        cursor-grab
    "
                                                        />


                                                        {/* NUMBER */}

                                                        <div
                                                            className="
                              shrink-0
                              w-6
                              h-6
                              rounded-full
                              bg-blue-600
                              text-white
                              flex
                              items-center
                              justify-center
                              text-[10px]
                              font-bold
                            "
                                                        >
                                                            {index + 1}
                                                        </div>


                                                        {/* PEDAL */}

                                                        <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                                                            {/* BRAND + NAME */}
                                                            <div
                                                                className="min-w-0"
                                                                style={{ position: "relative", left: "5px" }}
                                                            >

                                                                <div
                                                                    className="
                text-[10px]
                uppercase
                font-bold
                truncate
            "
                                                                >
                                                                    {pedal.brand || ""}
                                                                </div>

                                                                <div
                                                                    className="
                text-[10px]
                font-bold
                truncate
            "
                                                                >
                                                                    {pedal.name || "Pedal"}
                                                                </div>

                                                            </div>

                                                            {/* TYPE */}
                                                            <div
                                                                className="
            shrink-0
            text-[10px]
            text-zinc-500
            text-right
            whitespace-nowrap
        "
                                                            >
                                                                {pedal.type || ""}
                                                            </div>

                                                        </div>
                                                    </div>

                                                    {index === orderedPedals.length - 1 && (
                                                        <div
                                                            className="relative"
                                                        >
                                                            {signalDropIndex === orderedPedals.length &&
                                                                draggedPedalId !== null && (
                                                                    <div
                                                                        className="
                                                                        pointer-events-none
                                                                        absolute
                                                                        top-1/2
                                                                        left-2
                                                                        right-2
                                                                        h-[2px]
                                                                        -translate-y-1/2
                                                                        rounded-full
                                                                        z-20
                                                                    "
                                                                        style={{
                                                                            backgroundColor:
                                                                                "var(--foreground)",
                                                                        }}
                                                                    />
                                                                )}
                                                        </div>
                                                    )}

                                                </React.Fragment>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}