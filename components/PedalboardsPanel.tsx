"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Plus, Pencil, Trash2, Copy } from "lucide-react";
import pedalActions from "./PedalActions.module.css";
import Image from "next/image";
import { physicalPedals } from "@/utils/boardFinder";
import { getCustomImageUrl } from "@/utils/customImageStore";
import type { Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";

const PROJECT_ORDER_STORAGE_KEY =
    "make-your-board:pedalboard-order";

type Props = {
    projects: Project[];
    activeProjectId?: number | null;
    setActiveProjectId?: (id: number | null) => void;
    createNewProject?: () => void;
    duplicateProject?: (id: number) => void;
    deleteProject?: (
        id: number,
        e: React.MouseEvent<HTMLElement>
    ) => void;
    startEditing?: (project: Project) => void;
    editingProjectId?: number | null;
    tempName?: string;
    setTempName?: (value: string) => void;
    saveName?: () => void;
    language: Language;
    isLightTheme: boolean;
    isMobile?: boolean;
    onClose?: () => void;
    maxProjects?: number;
};

// A lightweight preview using the saved canvas coordinates, not a second editor.
type PreviewItem = {
    x: number; y: number; w: number; h: number; rotation: number;
    z: number; src: string; imageId: string; key: string; color: string;
};

function PreviewGear({ item }: { item: PreviewItem }) {
    const [storedUrl, setStoredUrl] = useState("");
    useEffect(() => {
        let cancelled = false;
        let url: string | null = null;
        setStoredUrl("");
        if (item.imageId) {
            getCustomImageUrl(item.imageId).then(value => {
                if (!value) return;
                if (cancelled) URL.revokeObjectURL(value);
                else { url = value; setStoredUrl(value); }
            }).catch(() => { });
        }
        return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
    }, [item.imageId]);
    const source = storedUrl || item.src;
    return (
        <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
            {source ? <image href={source} x={-item.w / 2} y={-item.h / 2}
                width={item.w} height={item.h} preserveAspectRatio="none" /> :
                <rect x={-item.w / 2} y={-item.h / 2} width={item.w} height={item.h}
                    rx={3} fill={item.color || "#71717a"} />}
        </g>
    );
}

function ProjectPreview({ project, isLightTheme }: { project: Project; isLightTheme: boolean }) {
    const rows = [
        ...(project.selectedBoards || []).map(item => ({ item, board: true })),
        ...(project.boardPedals || []).map(item => ({ item, board: false })),
    ];
    const items: PreviewItem[] = rows.map(({ item, board }, index) => {
        const row = item as unknown as Record<string, unknown>;
        const number = (v: unknown, fallback: number) => Number.isFinite(Number(v)) ? Number(v) : fallback;
        const source = [row.image, row.image_url, row.photo].find(v => typeof v === "string" && v.trim());
        return {
            x: number(row.x, 0), y: number(row.y, 0),
            w: Math.max(1, number(row.width, board ? 400 : 80) || (board ? 400 : 80)),
            h: Math.max(1, number(row.depth, board ? 200 : 120) || (board ? 200 : 120)),
            rotation: number(row.rotation, 0), z: number(row.zIndex, board ? -9999 : 0),
            src: typeof source === "string" ? source : "",
            imageId: String(row.imageId || ""), key: `${board ? "b" : "p"}-${row.instanceId ?? index}`,
            color: typeof row.color === "string" ? row.color : "",
        };
    }).sort((a, b) => a.z - b.z);
    const bounds = items.map(item => {
        const r = item.rotation * Math.PI / 180;
        const hw = (Math.abs(Math.cos(r)) * item.w + Math.abs(Math.sin(r)) * item.h) / 2;
        const hh = (Math.abs(Math.sin(r)) * item.w + Math.abs(Math.cos(r)) * item.h) / 2;
        return { minX: item.x - hw, maxX: item.x + hw, minY: item.y - hh, maxY: item.y + hh };
    });
    const minX = Math.min(...bounds.map(b => b.minX));
    const maxX = Math.max(...bounds.map(b => b.maxX));
    const minY = Math.min(...bounds.map(b => b.minY));
    const maxY = Math.max(...bounds.map(b => b.maxY));
    const padding = items.length ? Math.max(maxX - minX, maxY - minY) * 0.06 : 0;
    return (
        <div className="shrink-0 overflow-hidden rounded-md bg-zinc-600 flex items-center justify-center"
            style={{ width: 90, height: 62, backgroundColor: isLightTheme ? "#e4e4e7" : "#52525b" }} aria-hidden="true">
            {items.length ? (
                <svg width="90" height="62" viewBox={`${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`} preserveAspectRatio="xMidYMid meet">
                    {items.map(item => <PreviewGear key={item.key} item={item} />)}
                </svg>
            ) : null}
        </div>
    );
}

export default function PedalboardsPanel({
    projects,
    activeProjectId,
    setActiveProjectId,
    createNewProject,
    duplicateProject,
    deleteProject,
    startEditing,
    editingProjectId,
    tempName = "",
    setTempName,
    saveName,
    language,
    isLightTheme,
    isMobile = false,
    onClose,
    maxProjects = 7,
}: Props) {
    const t = getTranslator(language);
    const lastProjectTapRef =
        useRef<{
            id: number;
            time: number;
        } | null>(null);

    const [projectOrder, setProjectOrder] =
        useState<number[]>(() =>
            projects.map(
                (project) => project.id
            )
        );

    const [
        isProjectOrderLoaded,
        setIsProjectOrderLoaded,
    ] = useState(false);


    /* =========================================================
       PROJECT ORDER
    ========================================================= */

    useEffect(() => {
        if (
            isProjectOrderLoaded ||
            projects.length === 0
        ) {
            return;
        }

        try {
            const savedOrder =
                window.localStorage.getItem(
                    PROJECT_ORDER_STORAGE_KEY
                );

            if (savedOrder) {
                const parsedOrder: unknown =
                    JSON.parse(savedOrder);

                if (
                    Array.isArray(parsedOrder)
                ) {
                    const validIds =
                        new Set(
                            projects.map(
                                (project) =>
                                    project.id
                            )
                        );

                    const restoredOrder =
                        parsedOrder.filter(
                            (
                                id
                            ): id is number =>
                                typeof id ===
                                "number" &&
                                validIds.has(id)
                        );

                    const restoredSet =
                        new Set(
                            restoredOrder
                        );

                    projects.forEach(
                        (project) => {
                            if (
                                !restoredSet.has(
                                    project.id
                                )
                            ) {
                                restoredOrder.push(
                                    project.id
                                );
                            }
                        }
                    );

                    setProjectOrder(
                        restoredOrder
                    );
                }
            }
        } catch {
            // Ignore invalid or unavailable localStorage data.
        } finally {
            setIsProjectOrderLoaded(true);
        }
    }, [
        projects,
        isProjectOrderLoaded,
    ]);


    useEffect(() => {
        setProjectOrder(
            (currentOrder) => {
                const validIds =
                    new Set(
                        projects.map(
                            (project) =>
                                project.id
                        )
                    );

                const nextOrder =
                    currentOrder.filter(
                        (id) =>
                            validIds.has(id)
                    );

                const existingSet =
                    new Set(nextOrder);

                projects.forEach(
                    (project) => {
                        if (
                            !existingSet.has(
                                project.id
                            )
                        ) {
                            nextOrder.push(
                                project.id
                            );
                        }
                    }
                );

                const isSame =
                    nextOrder.length ===
                    currentOrder.length &&
                    nextOrder.every(
                        (id, index) =>
                            id ===
                            currentOrder[
                            index
                            ]
                    );

                return isSame
                    ? currentOrder
                    : nextOrder;
            }
        );
    }, [projects]);


    useEffect(() => {
        if (!isProjectOrderLoaded) {
            return;
        }

        try {
            window.localStorage.setItem(
                PROJECT_ORDER_STORAGE_KEY,
                JSON.stringify(
                    projectOrder
                )
            );
        } catch {
            // Ignore unavailable localStorage.
        }
    }, [
        projectOrder,
        isProjectOrderLoaded,
    ]);


    const orderedProjects =
        projectOrder
            .map((id) =>
                projects.find(
                    (project) =>
                        project.id === id
                )
            )
            .filter(Boolean) as Project[];


    // Sortable cards: move the dragged card with the pointer and animate
    // the remaining cards into their prospective positions.
    type Drag = {
        id: number; pointerId: number; startY: number; startX: number;
        from: number; to: number; delta: number; rects: DOMRect[];
        mode: "pending" | "drag" | "scroll"; started: number;
        card: HTMLDivElement; scrollHost: HTMLElement | null; lastY: number;
    };
    const projectListRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<Drag | null>(null);
    const suppressClick = useRef(false);
    const [dragView, setDragView] = useState<{ id: number; from: number; to: number; delta: number; rects: DOMRect[] } | null>(null);

    function scrollParent(element: HTMLElement): HTMLElement | null {
        for (let node = element.parentElement; node; node = node.parentElement) {
            if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight) return node;
        }
        return null;
    }

    function beginDrag(e: React.PointerEvent<HTMLDivElement>, id: number, index: number) {
        if (e.button !== 0 || !e.isPrimary || dragRef.current || editingProjectId === id) return;
        if ((e.target as Element).closest("[data-project-actions], input")) return;
        const cards = Array.from(projectListRef.current?.querySelectorAll<HTMLElement>("[data-project-card]") ?? []);
        if (cards.length < 2) return;
        suppressClick.current = false;
        dragRef.current = {
            id, pointerId: e.pointerId, startY: e.clientY, startX: e.clientX,
            from: index, to: index, delta: 0, rects: cards.map(card => card.getBoundingClientRect()),
            mode: "pending", started: Date.now(), card: e.currentTarget,
            scrollHost: scrollParent(e.currentTarget), lastY: e.clientY,
        };
        // Capture on the original target so normal taps still reach the selection button.
        (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    function updateDrag(e: React.PointerEvent<HTMLDivElement>) {
        const d = dragRef.current;
        if (!d || d.pointerId !== e.pointerId) return;
        const movement = e.clientY - d.startY;
        if (d.mode === "pending") {
            if (Math.hypot(e.clientX - d.startX, movement) < 6) return;
            d.mode = e.pointerType === "touch" && Date.now() - d.started < 220 ? "scroll" : "drag";
            suppressClick.current = true;
            lastProjectTapRef.current = null;
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
        if (d.mode !== "pending") {
            suppressClick.current = true;
            // Suppress only the synthetic click following this gesture.
            window.setTimeout(() => { suppressClick.current = false; }, 350);
        }
        if (!cancelled && d.mode === "drag" && d.from !== d.to) {
            setProjectOrder(order => {
                const result = [...order];
                const from = result.indexOf(d.id);
                if (from < 0) return order;
                result.splice(from, 1);
                result.splice(d.to, 0, d.id);
                return result;
            });
        }
        setDragView(null);
    }

    function cardOffset(index: number) {
        if (!dragView) return 0;
        const { from, to, rects, delta } = dragView;
        if (index === from) return delta;
        if (from < to && index > from && index <= to) return rects[index - 1].top - rects[index].top;
        if (from > to && index < from && index >= to) return rects[index + 1].top - rects[index].top;
        return 0;
    }

    return (
        <div
            className={
                isMobile
                    ? "w-full min-h-full bg-transparent border-0 rounded-none p-6 flex flex-col gap-3"
                    : "w-full bg-transparent border-0 rounded-none p-0 flex flex-col gap-3"
            }
            onClick={(e) =>
                e.stopPropagation()
            }
        >

            <style>{`
                [data-project-card].myb-project-card {
                    border: 0 !important;
                    outline: none !important;
                    box-shadow: none !important;
                }
                [data-project-card] .myb-project-name-input {
                    display: block !important;
                    width: 100% !important;
                    min-width: 0 !important;
                    height: 18px !important;
                    min-height: 0 !important;
                    box-sizing: border-box !important;
                    border: 0 !important;
                    outline: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    font: inherit !important;
                    letter-spacing: inherit !important;
                    text-transform: uppercase !important;
                    color: inherit !important;
                    caret-color: currentColor;
                }
                @media (hover: hover) {
                    [data-project-card].myb-project-card:hover {
                        box-shadow: inset 0 0 0 1px var(--color-zinc-500, var(--zinc-500, #71717a)) !important;
                    }
                }
            `}</style>

            {/* ===================================================
                TITLE
            =================================================== */}

            <div className="flex items-center gap-2 text-[18px] uppercase tracking-wider font-bold m-0">

                <Image
                    src={isLightTheme ? "/images/tab-board-dark.webp" : "/images/tab-board-light.webp"}
                    alt=""
                    width={20}
                    height={20}
                    draggable={false}
                    className="size-[20px] shrink-0 object-contain"
                />

                {t(
                    "canvasControls.pedalboards"
                )}
                {isMobile && (
                    <button type="button" aria-label={t("gear.closeDetails")} onClick={(e) => { e.stopPropagation(); onClose?.(); }} className={pedalActions.mobilePanelClose}>
                        <X size={20} strokeWidth={2} aria-hidden="true" />
                    </button>
                )}

            </div>


            {/* ===================================================
                PROJECTS
            =================================================== */}

            <div ref={projectListRef} className="flex flex-col" style={{ gap: 6, paddingBlock: 0 }}>
                {orderedProjects.map((project, index) => {
                    const active = project.id === activeProjectId;
                    const dragging = dragView?.id === project.id;
                    return (
                        <div
                            key={project.id}
                            data-project-card
                            onPointerDown={e => beginDrag(e, project.id, index)}
                            onPointerMove={updateDrag}
                            onPointerUp={e => finishDrag(e)}
                            onPointerCancel={e => finishDrag(e, true)}
                            onLostPointerCapture={e => finishDrag(e, true)}
                            onDragStart={e => e.preventDefault()}
                            onClickCapture={e => {
                                if (suppressClick.current && !(e.target as Element).closest("[data-project-actions]")) {
                                    e.preventDefault(); e.stopPropagation(); suppressClick.current = false;
                                }
                            }}
                            className={`group relative flex items-center gap-2 min-h-[82px] p-2 rounded-xl overflow-visible bg-zinc-950 myb-project-card ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                            style={{
                                transform: `translateY(${cardOffset(index)}px)`,
                                transition: dragging ? "none" : dragView ? "transform 180ms ease, box-shadow 150ms ease" : "box-shadow 150ms ease",
                                zIndex: dragging ? 60 : undefined,
                                touchAction: editingProjectId === project.id ? "auto" : "none",
                                userSelect: editingProjectId === project.id ? "auto" : "none",
                            }}
                        >
                            {/* PROJECT NAME */}
                            <div
                                role={editingProjectId === project.id ? undefined : "button"}
                                tabIndex={editingProjectId === project.id ? undefined : 0}
                                onClick={() =>
                                    setActiveProjectId?.(
                                        project.id
                                    )
                                }
                                onKeyDown={e => {
                                    if (e.target !== e.currentTarget || editingProjectId === project.id) return;
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setActiveProjectId?.(project.id);
                                    }
                                }}
                                onDoubleClick={(
                                    e
                                ) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    startEditing?.(
                                        project
                                    );
                                }}
                                onTouchEnd={(
                                    e
                                ) => {
                                    e.stopPropagation();
                                    if (editingProjectId === project.id) return;
                                    if (dragRef.current?.mode === "drag" || dragRef.current?.mode === "scroll" || suppressClick.current) return;

                                    const now =
                                        Date.now();

                                    const lastTap =
                                        lastProjectTapRef.current;

                                    if (
                                        lastTap &&
                                        lastTap.id ===
                                        project.id &&
                                        now -
                                        lastTap.time <=
                                        350
                                    ) {
                                        e.preventDefault();

                                        lastProjectTapRef.current =
                                            null;

                                        startEditing?.(
                                            project
                                        );

                                        return;
                                    }

                                    lastProjectTapRef.current =
                                    {
                                        id: project.id,
                                        time: now,
                                    };
                                }}
                                className="relative z-10 flex flex-1 min-w-0 items-center gap-2 text-left bg-transparent select-none" style={{ paddingRight: 0 }}
                                aria-pressed={editingProjectId === project.id ? undefined : active}
                            >
                                <ProjectPreview project={project} isLightTheme={isLightTheme} />
                                <span className="flex min-w-0 flex-1 flex-col gap-1" style={{ paddingBottom: 22 }}>
                                    <span className={`block min-w-0 truncate uppercase text-[12px] font-semibold ${active ? "text-blue-500" : "text-inherit"}`} style={{ fontSize: 12, fontWeight: 600, lineHeight: "18px" }}>
                                        {editingProjectId === project.id ? (
                                            <input
                                                autoFocus
                                                aria-label={t("tabs.projectNameShort")}
                                                value={tempName}
                                                onChange={e => setTempName?.(e.target.value)}
                                                onPointerDown={e => e.stopPropagation()}
                                                onClick={e => e.stopPropagation()}
                                                onDoubleClick={e => e.stopPropagation()}
                                                onTouchEnd={e => e.stopPropagation()}
                                                onBlur={() => saveName?.()}
                                                onKeyDown={e => {
                                                    e.stopPropagation();
                                                    if (e.nativeEvent.isComposing) return;
                                                    if (e.key === "Enter" || e.key === "Escape") {
                                                        e.preventDefault();
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                className="myb-project-name-input"
                                            />
                                        ) : (project.name || `Board ${index + 1}`)}
                                    </span>
                                    <span className="text-[11px] font-normal text-zinc-400">
                                        {t(
                                            physicalPedals(project.boardPedals || []).length <= 1
                                                ? "powerFinder.pedalCount"
                                                : "powerFinder.pedalsCount"
                                        ).replace("{count}", String(physicalPedals(project.boardPedals || []).length))}
                                    </span>
                                </span>
                            </div>

                            {/* PROJECT ACTIONS */}
                            <div data-project-actions className="flex items-center gap-1" style={{ position: "absolute", bottom: 6, right: 8, zIndex: 25 }}>
                                <button type="button" title={t("tabs.projectNameShort")} aria-label={t("tabs.projectNameShort")}
                                    onClick={e => { e.stopPropagation(); startEditing?.(project); }}
                                    className="flex items-center justify-center rounded-md text-inherit hover:bg-zinc-700" style={{ width: 24, height: 24, border: 0 }}>
                                    <Pencil size={14} />
                                </button>
                                <button type="button" title={t("tabs.duplicateProject")} aria-label={t("tabs.duplicateProject")}
                                    disabled={!duplicateProject || projects.length >= maxProjects}
                                    onClick={e => { e.stopPropagation(); duplicateProject?.(project.id); }}
                                    className="flex items-center justify-center rounded-md text-inherit hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed" style={{ width: 24, height: 24, border: 0 }}>
                                    <Copy size={14} />
                                </button>
                                <button type="button" title={t("pedal.actions.delete")} aria-label={t("pedal.actions.delete")}
                                    onClick={e => { e.stopPropagation(); deleteProject?.(project.id, e); }}
                                    className="flex items-center justify-center rounded-md text-red-500 hover:bg-zinc-700" style={{ width: 24, height: 24, border: 0 }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* ===================================================
                NEW PROJECT
            =================================================== */}

            {projects.length <
                maxProjects && (

                    <button
                        type="button"
                        onClick={() =>
                            createNewProject?.()
                        }
                        className="
                        self-end
                        h-[35px]
                        px-3
                        rounded-lg
                        bg-blue-600
                        !text-white
                        text-[12px]
                        font-semibold
                        
                        flex
                        items-center
                        justify-center
                        gap-2
                        transition-colors
                        hover:bg-blue-500
                    "
                    >
                        <Plus size={15} />
                        {t("canvasControls.newBoard")}
                    </button>

                )}


        </div>
    );
}
