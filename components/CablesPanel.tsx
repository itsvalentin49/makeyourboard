"use client";

import { createPortal } from "react-dom";
import React, { useEffect, useRef, useState } from "react";
import { Cable, X, CheckCircle2, XCircle } from "lucide-react";
import pedalActions from "./PedalActions.module.css";

type AnyRow = Record<string, any>;

type Props = {
    desktopPanelHost?: HTMLDivElement | null;
    t: (key: string) => string;

    isMobile: boolean;
    isLightTheme: boolean;

    showCableMenu: boolean;
    onToggleCableMenu: () => void;

    signalRoutingEnabled: boolean;
    showSignalCables: boolean;
    setShowSignalCables: (visible: boolean) => void;

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

function translateExample(t: Props["t"], key: string, fallback: string) {
    const fullKey = `cables.${key}`;
    const value = t(fullKey);
    return !value || value === fullKey || value === key ? fallback : value;
}

function PanelSwitch({ checked }: { checked: boolean }) {
    return (
        <span aria-hidden="true" style={{ position: "relative", display: "block", width: 40, height: 22, flexShrink: 0, borderRadius: 999, background: checked ? "var(--color-blue-600, #2563eb)" : "var(--zinc-700)", transition: "background-color 150ms ease" }}>
            <span style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 150ms ease" }} />
        </span>
    );
}

function ClearanceExample({ ok, isLightTheme }: { ok: boolean; isLightTheme: boolean }) {
    const positions = ok ? [5, 75] : [20, 65];
    const stroke = ok ? "#22c55e" : "#ef4444";
    return (
        <svg viewBox="0 0 136 86" className="block h-auto w-full max-w-[180px]" aria-hidden="true">
            {positions.map((x, index) => (
                <image key={index} href={isLightTheme ? "/images/tab-pedal2-dark.webp" : "/images/tab-pedal2-light.webp"} x={x + 10} y="17" width="38" height="48" preserveAspectRatio="xMidYMid meet" />
            ))}
            {positions.map(x => (
                <rect key={x} x={x} y="5" width="56" height="76" rx="10" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 3" />
            ))}
        </svg>
    );
}

function SignalChainExample({ t, isLightTheme }: { t: Props["t"]; isLightTheme: boolean }) {
    const items = [
        translateExample(t, "exampleReverb", "Reverb"),
        translateExample(t, "exampleDelay", "Delay"),
        translateExample(t, "exampleDrive", "Drive"),
        translateExample(t, "exampleTuner", "Tuner"),
    ];
    return (
        <div className="min-w-0" style={{ marginTop: 14 }}>
            <svg viewBox="0 0 280 70" style={{ display: "block", width: "100%", height: "auto" }} aria-hidden="true">
                <path d="M35 38H245" fill="none" stroke="var(--zinc-500)" strokeWidth="1.5" strokeDasharray="4 4" />
                {items.map((_, index) => {
                    const x = 35 + index * 70;
                    return (
                        <g key={index}>
                            <rect x={x - 21} y="8" width="42" height="60" rx="6" fill="var(--zinc-900)" />
                            <image href={isLightTheme ? "/images/tab-pedal2-dark.webp" : "/images/tab-pedal2-light.webp"} x={x - 20} y="14" width="40" height="48" preserveAspectRatio="xMidYMid meet" />
                            <circle cx={x + 17} cy="12" r="10" fill="var(--blue)" />
                            <text x={x + 17} y="12" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="600" fill="white">{items.length - index}</text>
                        </g>
                    );
                })}
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: 5, textAlign: "center", fontSize: 10, lineHeight: 1.3 }} className="text-zinc-400">
                {items.map((item, i) => <span key={i} style={{ minWidth: 0, overflowWrap: "anywhere" }}>{item}</span>)}
            </div>
        </div>
    );
}

export default function CablesPanel({
    desktopPanelHost = null,
    t,
    isMobile,
    isLightTheme,

    showCableMenu,
    onToggleCableMenu,

    signalRoutingEnabled,
    showSignalCables,
    setShowSignalCables,
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

    // Same sortable interaction as PedalboardsPanel.
    type Drag = {
        id: number; pointerId: number; startY: number; startX: number;
        from: number; to: number; delta: number; rects: DOMRect[];
        ids: number[]; mode: "pending" | "drag" | "scroll";
        started: number; scrollHost: HTMLElement | null; lastY: number;
    };
    const signalListRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<Drag | null>(null);
    const [dragView, setDragView] = useState<{
        id: number; from: number; to: number; delta: number; rects: DOMRect[];
    } | null>(null);

    useEffect(() => {
        dragRef.current = null;
        setDragView(null);
    }, [showCableMenu, showSignalChain, signalOrder.join(",")]);

    function scrollParent(element: HTMLElement): HTMLElement | null {
        for (let node = element.parentElement; node; node = node.parentElement) {
            if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
        }
        return null;
    }

    function beginDrag(e: React.PointerEvent<HTMLDivElement>, id: number, index: number) {
        if (e.button !== 0 || !e.isPrimary || dragRef.current) return;
        const cards = Array.from(signalListRef.current?.querySelectorAll<HTMLElement>("[data-signal-card]") ?? []);
        if (cards.length < 2) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
            id, pointerId: e.pointerId, startY: e.clientY, startX: e.clientX,
            from: index, to: index, delta: 0, rects: cards.map(card => card.getBoundingClientRect()),
            ids: orderedPedals.map(pedal => pedal.instanceId),
            mode: "pending", started: Date.now(), scrollHost: scrollParent(e.currentTarget), lastY: e.clientY,
        };
    }

    function updateDrag(e: React.PointerEvent<HTMLDivElement>) {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        const movement = e.clientY - d.startY;
        if (d.mode === "pending") {
            if (Math.hypot(e.clientX - d.startX, movement) < 6) return;
            d.mode = e.pointerType === "touch" && Date.now() - d.started < 220 ? "scroll" : "drag";
        }
        if (d.mode === "scroll") {
            if (d.scrollHost) d.scrollHost.scrollTop -= e.clientY - d.lastY;
            d.lastY = e.clientY;
            return;
        }
        e.preventDefault();
        const rect = d.rects[d.from];
        d.delta = Math.max(d.rects[0].top - rect.top, Math.min(movement, d.rects[d.rects.length - 1].bottom - rect.bottom));
        const center = rect.top + rect.height / 2 + d.delta;
        d.to = d.from;
        for (let i = d.from + 1; i < d.rects.length; i++) {
            if (center > d.rects[i].top + d.rects[i].height / 2) d.to = i;
        }
        for (let i = d.from - 1; i >= 0; i--) {
            if (center < d.rects[i].top + d.rects[i].height / 2) d.to = i;
        }
        setDragView({ id: d.id, from: d.from, to: d.to, delta: d.delta, rects: d.rects });
    }

    function finishDrag(e: React.PointerEvent<HTMLDivElement>, cancelled = false) {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        dragRef.current = null;
        if (!cancelled && d.mode === "drag" && d.from !== d.to) {
            setSignalOrder(order => {
                const result = [...order];
                const from = result.indexOf(d.id);
                const target = result.indexOf(d.ids[d.to]);
                if (from < 0 || target < 0) return order;
                result.splice(from, 1);
                result.splice(target, 0, d.id);
                return result;
            });
        }
        setDragView(null);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }

    function cardOffset(index: number) {
        if (!dragView) return 0;
        const { from, to, rects, delta } = dragView;
        if (index === from) return delta;
        if (from < to && index > from && index <= to) return rects[index - 1].top - rects[index].top;
        if (from > to && index < from && index >= to) return rects[index + 1].top - rects[index].top;
        return 0;
    }

    function displayIndex(index: number) {
        if (!dragView) return index;
        const { from, to } = dragView;
        if (index === from) return to;
        if (from < to && index > from && index <= to) return index - 1;
        if (from > to && index < from && index >= to) return index + 1;
        return index;
    }

    const renderPanel = (content: React.ReactNode) =>
        desktopPanelHost ? createPortal(content, desktopPanelHost) : content;

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

            {showCableMenu && renderPanel(
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
                                ? "relative w-full min-h-full bg-transparent border-0 rounded-none p-6"
                                : "relative w-full bg-transparent border-0 rounded-none p-0"
                        }
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* =============================================
                TITLE
            ============================================= */}

                        <div className="flex items-center gap-2 text-[18px] uppercase tracking-wider font-bold mb-3">

                            <Cable size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />

                            {t("cables.title")}
                            {isMobile && (
                                <button type="button" aria-label={t("gear.closeDetails")} onClick={(e) => { e.stopPropagation(); onToggleCableMenu(); }} className={pedalActions.mobilePanelClose}>
                                    <X size={20} strokeWidth={2} aria-hidden="true" />
                                </button>
                            )}

                        </div>


                        <style>{`
                            [data-signal-card].myb-signal-card {
                                border: 0 !important;
                                outline: none !important;
                                box-shadow: none !important;
                            }
                            @media (hover: hover) {
                                [data-signal-card].myb-signal-card:hover {
                                    box-shadow: inset 0 0 0 1px var(--color-zinc-500, var(--zinc-500, #71717a)) !important;
                                }
                            }
                        `}</style>

                        {/* CABLE CLEARANCE */}
                        <section className="mb-4 min-w-0 rounded-xl bg-zinc-950 p-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={showJacksMargin}
                                onClick={() => setShowJacksMargin(v => !v)}
                                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                            >
                                <span className="min-w-0 text-[14px] font-semibold normal-case">{t("cables.clearance")}</span>
                                <PanelSwitch checked={showJacksMargin} />
                            </button>
                            <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
                                {t("cables.clearanceDescription")}
                            </p>
                            <div className="grid min-w-0 grid-cols-2 gap-2" style={{ marginTop: 16 }}>
                                {[true, false].map(ok => (
                                    <div key={String(ok)} className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-zinc-900 p-2">
                                        <ClearanceExample ok={ok} isLightTheme={isLightTheme} />
                                        <div className={`flex items-center justify-center gap-1 text-center text-[10px] font-medium ${ok ? "text-green-500" : "text-red-500"}`}>
                                            {ok ? <CheckCircle2 size={12} className="shrink-0" /> : <XCircle size={12} className="shrink-0" />}
                                            <span>{translateExample(t, ok ? "enoughSpace" : "tooClose", ok ? "Enough space" : "Too close")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* PEDAL ORDER */}
                        <section className="mb-4 min-w-0 rounded-xl bg-zinc-950 p-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={showSignalChain}
                                onClick={() => setShowSignalChain(v => !v)}
                                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                            >
                                <span className="min-w-0 text-[14px] font-semibold normal-case">{t("cables.pedalOrder")}</span>
                                <PanelSwitch checked={showSignalChain} />
                            </button>
                            <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{t("cables.signalChainDescription")}</p>
                            {!showSignalChain && <SignalChainExample t={t} isLightTheme={isLightTheme} />}

                            {showSignalChain && (
                                <div className="mt-4 space-y-1">
                                    {orderedPedals.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={resetRecommendedOrder}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.setProperty("color", "var(--foreground)", "important");
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.removeProperty("color");
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

                                        <div ref={signalListRef} className="flex flex-col" style={{ gap: 6 }}>
                                            {orderedPedals.map((pedal, index) => {
                                                const dragging = dragView?.id === pedal.instanceId;
                                                return (
                                                    <div
                                                        key={pedal.instanceId}
                                                        data-signal-card
                                                        onPointerDown={e => beginDrag(e, pedal.instanceId, index)}
                                                        onPointerMove={updateDrag}
                                                        onPointerUp={e => finishDrag(e)}
                                                        onPointerCancel={e => finishDrag(e, true)}
                                                        onLostPointerCapture={e => finishDrag(e, true)}
                                                        onDragStart={e => e.preventDefault()}
                                                        className={`myb-signal-card relative flex items-center gap-2 min-h-[42px] px-3 py-1 rounded-lg bg-zinc-800 ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                                                        style={{
                                                            transform: `translateY(${cardOffset(index)}px)`,
                                                            transition: dragging ? "none" : dragView ? "transform 180ms ease, box-shadow 150ms ease" : "box-shadow 150ms ease",
                                                            zIndex: dragging ? 60 : undefined,
                                                            touchAction: orderedPedals.length > 1 ? "none" : "auto",
                                                            userSelect: "none",
                                                        }}
                                                    >
                                                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                                            {displayIndex(index) + 1}
                                                        </div>
                                                        <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                                                            <div className="min-w-0" style={{ position: "relative", left: "5px" }}>
                                                                <div className="text-[10px] uppercase font-bold truncate">{pedal.brand || ""}</div>
                                                                <div className="text-[10px] font-bold truncate">{pedal.name || "Pedal"}</div>
                                                            </div>
                                                            <div className="shrink-0 text-[10px] text-right whitespace-nowrap">{pedal.type || ""}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                    )}

                                </div>
                            )}
                        </section>

                        {/* SIGNAL ROUTING */}
                        {signalRoutingEnabled && (
                            <section className="min-w-0 rounded-xl bg-zinc-950 p-3">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={showSignalCables}
                                    onClick={() => setShowSignalCables(!showSignalCables)}
                                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                                >
                                    <span className="min-w-0 text-[14px] font-semibold normal-case">
                                        {t("cables.signalRouting")}
                                    </span>

                                    <PanelSwitch checked={showSignalCables} />
                                </button>

                                <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">
                                    {t("cables.signalRoutingDescription")}
                                </p>
                            </section>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}