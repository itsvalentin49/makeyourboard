"use client";

import React, { useEffect, useRef, useState } from "react";
import { GripVertical, X } from "lucide-react";
import type { Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";

const PROJECT_ORDER_STORAGE_KEY =
    "make-your-board:pedalboard-order";

type Props = {
    projects: Project[];
    activeProjectId?: number | null;
    setActiveProjectId?: (id: number | null) => void;
    createNewProject?: () => void;
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
    maxProjects?: number;
};

export default function PedalboardsPanel({
    projects,
    activeProjectId,
    setActiveProjectId,
    createNewProject,
    deleteProject,
    startEditing,
    editingProjectId,
    tempName = "",
    setTempName,
    saveName,
    language,
    isLightTheme,
    isMobile = false,
    maxProjects = 7,
}: Props) {
    const t = getTranslator(language);

    const [
        confirmDeleteProjectId,
        setConfirmDeleteProjectId,
    ] = useState<number | null>(null);

    const confirmDeleteRef =
        useRef<HTMLDivElement>(null);

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


    /* =========================================================
       DELETE CONFIRMATION
    ========================================================= */

    useEffect(() => {
        if (
            confirmDeleteProjectId ===
            null
        ) {
            return;
        }

        const handleClickOutsideConfirm =
            (e: MouseEvent) => {
                const target =
                    e.target as Node;

                if (
                    confirmDeleteRef.current?.contains(
                        target
                    )
                ) {
                    return;
                }

                setConfirmDeleteProjectId(
                    null
                );
            };

        document.addEventListener(
            "mousedown",
            handleClickOutsideConfirm
        );

        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutsideConfirm
            );
    }, [confirmDeleteProjectId]);


    /* =========================================================
       DRAG / DROP
       SAME LOGIC AS CABLES
    ========================================================= */

    const [
        draggedProjectId,
        setDraggedProjectId,
    ] = useState<number | null>(
        null
    );

    const [
        projectDropIndex,
        setProjectDropIndex,
    ] = useState<number | null>(
        null
    );

    const projectDropIndexRef =
        useRef<number | null>(null);

    const draggedProjectIdRef =
        useRef<number | null>(null);

    const projectListRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const setProjectDropTarget = (
        index: number | null
    ) => {
        projectDropIndexRef.current =
            index;

        setProjectDropIndex(index);
    };


    const moveProject = (
        draggedId: number,
        dropIndex: number
    ) => {
        setProjectOrder(
            (currentOrder) => {
                const fromIndex =
                    currentOrder.indexOf(
                        draggedId
                    );

                if (fromIndex === -1) {
                    return currentOrder;
                }

                const nextOrder = [
                    ...currentOrder,
                ];

                nextOrder.splice(
                    fromIndex,
                    1
                );

                let insertIndex =
                    dropIndex;

                // La suppression du pedalboard décale
                // les positions situées après son
                // emplacement d'origine.
                if (
                    fromIndex <
                    dropIndex
                ) {
                    insertIndex -= 1;
                }

                insertIndex =
                    Math.max(
                        0,
                        Math.min(
                            insertIndex,
                            nextOrder.length
                        )
                    );

                nextOrder.splice(
                    insertIndex,
                    0,
                    draggedId
                );

                return nextOrder;
            }
        );
    };


    const getProjectDropIndex = (
        clientY: number
    ): number | null => {
        const list =
            projectListRef.current;

        if (!list) {
            return null;
        }

        const cards =
            Array.from(
                list.querySelectorAll<HTMLElement>(
                    "[data-project-card]"
                )
            );

        for (
            let index = 0;
            index < cards.length;
            index += 1
        ) {
            const rect =
                cards[
                    index
                ].getBoundingClientRect();

            const middle =
                rect.top +
                rect.height / 2;

            if (
                clientY < middle
            ) {
                return index;
            }
        }

        return cards.length;
    };


    return (
        <div
            className={
                isMobile
                    ? "w-full min-h-full bg-zinc-800 border-0 rounded-none p-6 flex flex-col gap-2"
                    : "w-full bg-transparent border-0 rounded-none p-0 flex flex-col gap-2"
            }
            onClick={(e) =>
                e.stopPropagation()
            }
        >

            {/* ===================================================
                TITLE
            =================================================== */}

            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold px-2 pb-3">

                <img
                    src={
                        isLightTheme
                            ? "/images/tab-board-dark.webp"
                            : "/images/tab-board-light.webp"
                    }
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="w-[18px] h-[18px] object-contain shrink-0"
                />

                {t(
                    "canvasControls.pedalboards"
                )}

            </div>


            {/* ===================================================
                PROJECTS
            =================================================== */}

            <div
                ref={
                    projectListRef
                }
            >

                {orderedProjects.map(
                    (
                        project,
                        index
                    ) => {

                        const active =
                            project.id ===
                            activeProjectId;

                        return (

                            <React.Fragment
                                key={
                                    project.id
                                }
                            >

                                {/* INSERTION LINE BEFORE THIS CARD */}

                                <div
                                    className="relative"
                                    style={{
                                        height: 6,
                                    }}
                                >

                                    {projectDropIndex ===
                                        index &&
                                        draggedProjectId !==
                                        null && (

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


                                {/* PROJECT CARD */}

                                <div
                                    data-project-card
                                    onMouseEnter={(
                                        e
                                    ) => {
                                        const grip =
                                            e.currentTarget.querySelector(
                                                "[data-project-grip]"
                                            ) as SVGElement | null;

                                        grip?.style.setProperty(
                                            "color",
                                            "var(--zinc-300)",
                                            "important"
                                        );
                                    }}
                                    onMouseLeave={(
                                        e
                                    ) => {
                                        const grip =
                                            e.currentTarget.querySelector(
                                                "[data-project-grip]"
                                            ) as SVGElement | null;

                                        grip?.style.removeProperty(
                                            "color"
                                        );
                                    }}
                                    className={`
                                        pedalboard-project-row
                                        group
                                        relative
                                        flex
                                        items-center
                                        gap-2
                                        h-[35px]
                                        rounded-lg
                                        border
                                        bg-zinc-950
                                        transition-all
                                        duration-150
                                        overflow-visible
                                        ${active
                                            ? "border-white"
                                            : "border-zinc-700"
                                        }
                                    `}
                                >


                                    {/* DRAG HANDLE */}

                                    <GripVertical
                                        data-project-grip
                                        size={14}
                                        onPointerDown={(
                                            e
                                        ) => {
                                            if (
                                                e.button !==
                                                0
                                            ) {
                                                return;
                                            }

                                            e.preventDefault();
                                            e.stopPropagation();

                                            draggedProjectIdRef.current =
                                                project.id;

                                            setDraggedProjectId(
                                                project.id
                                            );

                                            setProjectDropTarget(
                                                null
                                            );

                                            e.currentTarget.setPointerCapture(
                                                e.pointerId
                                            );

                                            const card =
                                                e.currentTarget.closest(
                                                    "[data-project-card]"
                                                ) as HTMLElement | null;

                                            if (
                                                card
                                            ) {
                                                card.style.opacity =
                                                    "0.4";
                                            }
                                        }}
                                        onPointerMove={(
                                            e
                                        ) => {
                                            if (
                                                draggedProjectIdRef.current !==
                                                project.id
                                            ) {
                                                return;
                                            }

                                            const nextDropIndex =
                                                getProjectDropIndex(
                                                    e.clientY
                                                );

                                            if (
                                                nextDropIndex !==
                                                null
                                            ) {
                                                setProjectDropTarget(
                                                    nextDropIndex
                                                );
                                            }
                                        }}
                                        onPointerUp={(
                                            e
                                        ) => {
                                            if (
                                                draggedProjectIdRef.current !==
                                                project.id
                                            ) {
                                                return;
                                            }

                                            const card =
                                                e.currentTarget.closest(
                                                    "[data-project-card]"
                                                ) as HTMLElement | null;

                                            if (
                                                card
                                            ) {
                                                card.style.opacity =
                                                    "";
                                            }

                                            const dropIndex =
                                                projectDropIndexRef.current;

                                            draggedProjectIdRef.current =
                                                null;

                                            if (
                                                e.currentTarget.hasPointerCapture(
                                                    e.pointerId
                                                )
                                            ) {
                                                e.currentTarget.releasePointerCapture(
                                                    e.pointerId
                                                );
                                            }

                                            if (
                                                dropIndex !==
                                                null
                                            ) {
                                                moveProject(
                                                    project.id,
                                                    dropIndex
                                                );
                                            }

                                            setDraggedProjectId(
                                                null
                                            );

                                            setProjectDropTarget(
                                                null
                                            );
                                        }}
                                        onPointerCancel={(
                                            e
                                        ) => {
                                            const card =
                                                e.currentTarget.closest(
                                                    "[data-project-card]"
                                                ) as HTMLElement | null;

                                            if (
                                                card
                                            ) {
                                                card.style.opacity =
                                                    "";
                                            }

                                            draggedProjectIdRef.current =
                                                null;

                                            if (
                                                e.currentTarget.hasPointerCapture(
                                                    e.pointerId
                                                )
                                            ) {
                                                e.currentTarget.releasePointerCapture(
                                                    e.pointerId
                                                );
                                            }

                                            setDraggedProjectId(
                                                null
                                            );

                                            setProjectDropTarget(
                                                null
                                            );
                                        }}
                                        className="
                                            relative
                                            z-10
                                            ml-3
                                            shrink-0
                                            text-zinc-600
                                            transition-colors
                                            duration-150
                                            cursor-grab
                                            active:cursor-grabbing
                                            touch-none
                                        "
                                    />


                                    {/* PROJECT NAME */}

                                    {editingProjectId ===
                                        project.id ? (

                                        <input
                                            autoFocus
                                            value={
                                                tempName
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setTempName?.(
                                                    e.target.value
                                                )
                                            }
                                            onClick={(
                                                e
                                            ) =>
                                                e.stopPropagation()
                                            }
                                            onBlur={() =>
                                                saveName?.()
                                            }
                                            onKeyDown={(
                                                e
                                            ) => {
                                                if (
                                                    e.key ===
                                                    "Enter"
                                                ) {
                                                    saveName?.();
                                                }

                                                if (
                                                    e.key ===
                                                    "Escape"
                                                ) {
                                                    saveName?.();
                                                }
                                            }}
                                            className="
                                                relative
                                                z-10
                                                flex-1
                                                bg-transparent
                                                outline-none
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-bold
                                                tracking-wide
                                            "
                                        />

                                    ) : (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setActiveProjectId?.(
                                                    project.id
                                                )
                                            }
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
                                            className="
                                                relative
                                                z-10
                                                flex-1
                                                h-full
                                                text-left
                                                px-3
                                                text-[10px]
                                                font-bold
                                                tracking-wide
                                                touch-manipulation
                                            "
                                        >
                                            {project.name ||
                                                `Board ${index +
                                                1
                                                }`}
                                        </button>

                                    )}


                                    {/* DELETE */}

                                    <div className="relative z-10 flex items-center h-full">

                                        <button
                                            type="button"
                                            aria-label={t(
                                                "pedal.actions.delete"
                                            )}
                                            onClick={(
                                                e
                                            ) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                setConfirmDeleteProjectId(
                                                    project.id
                                                );
                                            }}
                                            onPointerUp={(
                                                e
                                            ) => {
                                                if (
                                                    e.pointerType !==
                                                    "touch"
                                                ) {
                                                    return;
                                                }

                                                e.preventDefault();
                                                e.stopPropagation();

                                                setConfirmDeleteProjectId(
                                                    project.id
                                                );
                                            }}
                                            onMouseEnter={(
                                                e
                                            ) => {
                                                if (
                                                    isMobile
                                                ) {
                                                    return;
                                                }

                                                e.currentTarget.style.color =
                                                    "var(--red)";
                                            }}
                                            onMouseLeave={(
                                                e
                                            ) => {
                                                e.currentTarget.style.color =
                                                    "";
                                            }}
                                            className="
                                                delete-project-button
                                                w-11
                                                h-[35px]
                                                flex
                                                items-center
                                                justify-center
                                                shrink-0
                                                touch-manipulation
                                            "
                                        >
                                            <X
                                                size={
                                                    14
                                                }
                                            />
                                        </button>

                                    </div>

                                </div>


                                {/* INSERTION LINE AFTER LAST CARD */}

                                {index ===
                                    orderedProjects.length -
                                    1 && (

                                        <div
                                            className="relative"
                                            style={{
                                                height: 6,
                                            }}
                                        >

                                            {projectDropIndex ===
                                                orderedProjects.length &&
                                                draggedProjectId !==
                                                null && (

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

                        );
                    }
                )}

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
                        w-full
                        h-[35px]
                        px-3
                        rounded-lg
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
                    "
                    >
                        {t(
                            "canvasControls.newBoard"
                        )}
                    </button>

                )}


            {/* ===================================================
                DELETE CONFIRMATION
            =================================================== */}

            {confirmDeleteProjectId !==
                null && (

                    <div
                        ref={
                            confirmDeleteRef
                        }
                        className="
                        w-full
                        rounded-xl
                        bg-zinc-950
                        border
                        border-zinc-800
                        p-3
                    "
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="text-[11px] font-bold mb-3">

                            {t(
                                "tabs.confirmDelete"
                            ).replace(
                                "{name}",
                                projects.find(
                                    (
                                        project
                                    ) =>
                                        project.id ===
                                        confirmDeleteProjectId
                                )?.name ||
                                "Pedalboard"
                            )}

                        </div>


                        <div className="flex gap-2 justify-end">

                            <button
                                type="button"
                                onClick={(
                                    e
                                ) => {
                                    e.stopPropagation();

                                    setConfirmDeleteProjectId(
                                        null
                                    );
                                }}
                                className="
                                px-3
                                py-1.5
                                rounded-md
                                bg-blue-600
                                hover:bg-blue-500
                                !text-white
                                transition-colors
                                text-[10px]
                                font-black
                                uppercase
                            "
                            >
                                {t(
                                    "tabs.cancel"
                                )}
                            </button>


                            <button
                                type="button"
                                onClick={(
                                    e
                                ) => {
                                    e.stopPropagation();

                                    deleteProject?.(
                                        confirmDeleteProjectId,
                                        e
                                    );

                                    setConfirmDeleteProjectId(
                                        null
                                    );
                                }}
                                className="
                                px-3
                                py-1.5
                                rounded-md
                                bg-red-600
                                hover:bg-red-500
                                !text-white
                                transition-colors
                                text-[10px]
                                font-black
                                uppercase
                            "
                            >
                                {t(
                                    "pedal.actions.delete"
                                )}
                            </button>

                        </div>

                    </div>

                )}

        </div>
    );
}