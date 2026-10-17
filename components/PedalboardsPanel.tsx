"use client";

import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";

type Props = {
    projects: Project[];
    activeProjectId?: number | null;
    setActiveProjectId?: (id: number | null) => void;
    createNewProject?: () => void;
    deleteProject?: (id: number, e: React.MouseEvent<HTMLElement>) => void;
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
    const [confirmDeleteProjectId, setConfirmDeleteProjectId] = useState<number | null>(null);
    const confirmDeleteRef = useRef<HTMLDivElement>(null);
    const lastProjectTapRef = useRef<{ id: number; time: number } | null>(null);

    useEffect(() => {
        if (confirmDeleteProjectId === null) return;

        const handleClickOutsideConfirm = (e: MouseEvent) => {
            const target = e.target as Node;
            if (confirmDeleteRef.current?.contains(target)) return;
            setConfirmDeleteProjectId(null);
        };

        document.addEventListener("mousedown", handleClickOutsideConfirm);
        return () => document.removeEventListener("mousedown", handleClickOutsideConfirm);
    }, [confirmDeleteProjectId]);

    return (
        <div
            className={
                isMobile
                    ? "w-full min-h-full bg-zinc-800 border-0 rounded-none p-6 flex flex-col gap-2"
                    : "w-full bg-transparent border-0 rounded-none p-0 flex flex-col gap-2"
            }
            onClick={(e) => e.stopPropagation()}
        >
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
                {t("canvasControls.pedalboards")}
            </div>

            {projects.map((project, index) => {
                const active = project.id === activeProjectId;

                return (
                    <div
                        key={project.id}
                        className="pedalboard-project-row group relative flex items-center gap-2 h-[35px] rounded-lg border border-zinc-800 bg-zinc-950 transition-colors overflow-visible"
                    >
                        {active && (
                            <div className="absolute inset-0 rounded-md border border-blue-500 bg-blue-500/10 pointer-events-none z-0" />
                        )}

                        {editingProjectId === project.id ? (
                            <input
                                autoFocus
                                value={tempName}
                                onChange={(e) => setTempName?.(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => saveName?.()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveName?.();
                                    if (e.key === "Escape") saveName?.();
                                }}
                                className="relative z-10 flex-1 bg-transparent outline-none px-3 py-2 text-[10px] font-bold tracking-wide"
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={() => setActiveProjectId?.(project.id)}
                                onDoubleClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startEditing?.(project);
                                }}
                                onTouchEnd={(e) => {
                                    e.stopPropagation();

                                    const now = Date.now();
                                    const lastTap = lastProjectTapRef.current;

                                    if (
                                        lastTap &&
                                        lastTap.id === project.id &&
                                        now - lastTap.time <= 350
                                    ) {
                                        e.preventDefault();
                                        lastProjectTapRef.current = null;
                                        startEditing?.(project);
                                        return;
                                    }

                                    lastProjectTapRef.current = {
                                        id: project.id,
                                        time: now,
                                    };
                                }}
                                className="flex-1 h-full text-left px-3 text-[10px] font-bold tracking-wide touch-manipulation"
                            >
                                {project.name || `Board ${index + 1}`}
                            </button>
                        )}

                        <div className="flex items-center h-full">
                            <button
                                type="button"
                                aria-label={t("pedal.actions.delete")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDeleteProjectId(project.id);
                                }}
                                onPointerUp={(e) => {
                                    if (e.pointerType !== "touch") return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDeleteProjectId(project.id);
                                }}
                                onMouseEnter={(e) => {
                                    if (isMobile) return;
                                    e.currentTarget.style.color = "var(--red)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "";
                                }}
                                className="delete-project-button w-11 h-[35px] flex items-center justify-center shrink-0 touch-manipulation"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}

            {projects.length < maxProjects && (
                <button
                    type="button"
                    onClick={() => createNewProject?.()}
                    className="w-full h-[35px] px-3 rounded-lg bg-blue-600 !text-white text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-colors hover:bg-blue-500"
                >
                    {t("canvasControls.newBoard")}
                </button>
            )}

            {confirmDeleteProjectId !== null && (
                <div
                    ref={confirmDeleteRef}
                    className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-[11px] font-bold mb-3">
                        {t("tabs.confirmDelete").replace(
                            "{name}",
                            projects.find((project) => project.id === confirmDeleteProjectId)?.name ||
                            "Pedalboard"
                        )}
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteProjectId(null);
                            }}
                            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 !text-white transition-colors text-[10px] font-black uppercase"
                        >
                            {t("tabs.cancel")}
                        </button>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteProject?.(confirmDeleteProjectId, e);
                                setConfirmDeleteProjectId(null);
                            }}
                            className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 !text-white transition-colors text-[10px] font-black uppercase"
                        >
                            {t("pedal.actions.delete")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
