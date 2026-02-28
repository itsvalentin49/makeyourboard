"use client";

import React, { useState, type Dispatch, type SetStateAction } from "react";
import { Plus, Settings } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import SortableTab from "@/components/SortableTab";
import type { Project } from "@/types/project";
import { getTranslator } from "@/utils/i18n";

type Props = {
  projects: Project[];
  setProjects: Dispatch<SetStateAction<Project[]>>;

  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;

  editingProjectId: number | null;
  tempName: string;
  setTempName: (v: string) => void;

  startEditing: (project: Project, e: React.MouseEvent<HTMLElement>) => void;
  saveName: () => void;
  deleteProject: (id: number, e: React.MouseEvent<HTMLElement>) => void;

  createNewProject: () => void;

  language: "en" | "fr" | "es" | "de" | "it" | "pt";

  // 🔥 AJOUT IMPORTANT
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
};

function toNumberId(id: UniqueIdentifier): number {
  return typeof id === "number" ? id : Number(id);
}

export default function TopBarTabs({
  projects,
  setProjects,
  activeProjectId,
  setActiveProjectId,
  editingProjectId,
  tempName,
  setTempName,
  startEditing,
  saveName,
  deleteProject,
  createNewProject,
  language,
  settingsOpen,
  setSettingsOpen,
}: Props) {
  const MAX_TABS = 5;

  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const t = getTranslator(language ?? "en");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const draggingProject =
    projects.find((p) => p.id === activeTabId) ?? null;

  const handleTabsDragStart = (event: DragStartEvent) => {
    setActiveTabId(toNumberId(event.active.id));
  };

  const handleTabsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTabId(null);
    if (!over || active.id === over.id) return;

    const activeId = toNumberId(active.id);
    const overId = toNumberId(over.id);

    setProjects((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleTabsDragCancel = () => {
    setActiveTabId(null);
  };

  return (
    <div className="h-12 bg-zinc-950 flex items-stretch relative z-20">

      {/* ZONE SCROLLABLE */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex h-full overflow-x-auto">

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleTabsDragStart}
            onDragEnd={handleTabsDragEnd}
            onDragCancel={handleTabsDragCancel}
          >
            <SortableContext
              items={projects.map((p) => p.id)}
              strategy={horizontalListSortingStrategy}
            >
              {projects.map((project) => (
                <SortableTab
                  key={project.id}
                  project={project}
                  activeProjectId={activeProjectId}
                  setActiveProjectId={setActiveProjectId}
                  startEditing={startEditing}
                  deleteProject={deleteProject}
                  editingProjectId={editingProjectId}
                  tempName={tempName}
                  setTempName={setTempName}
                  saveName={saveName}
                  t={t}
                />
              ))}
            </SortableContext>

            {/* + Onglet */}
            {projects.length < MAX_TABS && (
              <button
                type="button"
                onClick={createNewProject}
                className="px-6 h-full flex items-center justify-center shrink-0 text-white"
                aria-label="Create project"
              >
                <span className="
                  flex items-center justify-center
                  transition-transform duration-200
                  hover:scale-110 hover:rotate-6
                  active:scale-95
                ">
                  <Plus className="size-4" />
                </span>
              </button>
            )}

            <DragOverlay>
              {draggingProject ? (
                <div className="flex items-center justify-center min-w-[150px] px-4 h-[47px] bg-zinc-900 text-white shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">
                    {draggingProject.name}
                  </span>
                </div>
              ) : null}
            </DragOverlay>

          </DndContext>
        </div>
      </div>

      {/* SETTINGS BUTTON */}
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="
          flex shrink-0 px-6 h-full
          items-center justify-center
          text-white
          transition-all duration-200
          hover:scale-110 hover:rotate-6
          active:scale-95
        "
        aria-label="Settings"
      >
        <Settings className="size-5" />
      </button>

    </div>
  );
}