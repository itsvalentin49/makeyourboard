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
}: Props) {

  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);


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
    <div className="h-14 bg-zinc-950 flex items-center px-6 shrink-0 overflow-x-auto overflow-y-hidden relative">
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
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {draggingProject ? (
            <div className="flex items-center gap-2 px-4 h-8 rounded-t-lg bg-[#3a3a3c] text-white border border-zinc-700 shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-widest truncate">
                {draggingProject.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {projects.length < 8 && (
        <div className="h-8 self-end border-b border-zinc-900 flex items-center shrink-0">
          <button
            type="button"
            onClick={createNewProject}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Create project"
          >
            <Plus className="size-5" />
          </button>
        </div>
      )}

      <div className="flex-1 h-8 self-end border-b border-zinc-900" />
    </div>
  );
}
