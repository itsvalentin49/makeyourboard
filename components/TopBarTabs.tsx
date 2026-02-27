"use client";

import React, { useState, type Dispatch, type SetStateAction } from "react";
import { Plus, } from "lucide-react";
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
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

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

  BACKGROUNDS: { id: string; label: string }[];
  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: "en" | "fr" | "es" | "de" | "it" | "pt";

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
  BACKGROUNDS = [],
  canvasBg,
  setCanvasBg,
  language,
}: Props) {

  const MAX_TABS = 5;

  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const t = getTranslator(language ?? "en");


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const draggingProject = projects.find((p) => p.id === activeTabId) ?? null;

  const handleTabsDragStart = (event: DragStartEvent) => {
    setActiveTabId(toNumberId(event.active.id));
  };

  const handleTabsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTabId(null);
    if (!over) return;
    if (active.id === over.id) return;

    const activeId = toNumberId(active.id);
    const overId = toNumberId(over.id);

    setProjects((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleTabsDragCancel = (_event: DragCancelEvent) => {
    setActiveTabId(null);
  };

  return (
    <div className="h-14 bg-zinc-950 flex items-center relative">
      <div className="flex flex-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleTabsDragStart}
        onDragEnd={handleTabsDragEnd}
        onDragCancel={handleTabsDragCancel}
      >
        <SortableContext items={projects.map((p) => p.id)} strategy={horizontalListSortingStrategy}>
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

        <DragOverlay>
  {draggingProject ? (
    <div
      className="
        flex items-center justify-center
        min-w-[150px] px-4 h-9
        rounded-t-xl
        bg-zinc-900
        border border-zinc-800
        text-white
        shadow-2xl
      "
    >
      <span className="text-[10px] font-black uppercase tracking-widest truncate">
        {draggingProject.name}
      </span>
    </div>
  ) : null}
</DragOverlay>
      </DndContext>
      </div>

      {projects.length < MAX_TABS && (
  <div className="flex items-center shrink-0 h-full">
    <button
      type="button"
      onClick={createNewProject}
      className="px-3 h-full flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
      aria-label="Create project"
    >
      <Plus className="size-4" />
    </button>
  </div>
)}

      <div className="flex-1 h-8 self-end border-b border-zinc-900" />
    </div>
  );
}
