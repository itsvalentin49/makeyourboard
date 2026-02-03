"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";

import SortableTab from "@/components/SortableTab";

type Project = {
  id: number;
  name: string;
};

type Props = {
  projects: Project[];
  setProjects: (v: Project[] | ((prev: Project[]) => Project[])) => void;

  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;

  editingProjectId: number | null;
  tempName: string;
  setTempName: (v: string) => void;

  startEditing: (project: Project, e: any) => void;
  saveName: () => void;
  deleteProject: (id: number, e: any) => void;

  createNewProject: () => void;
};

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
}: Props) {
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const draggingProject = projects.find((p) => p.id === activeTabId) || null;

  const handleTabsDragStart = (event: any) => {
    setActiveTabId(event.active.id);
  };

  const handleTabsDragEnd = (event: any) => {
    const { active, over } = event;

    setActiveTabId(null);

    if (!over) return;
    if (active.id === over.id) return;

    setProjects((prev: Project[]) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleTabsDragCancel = () => {
    setActiveTabId(null);
  };

  return (
    <div className="h-13 bg-zinc-950 flex items-center px-6 shrink-0 overflow-x-auto relative">
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
              setActiveProjectId={(id: number) => setActiveProjectId(id)}
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
          <button onClick={createNewProject} className="p-2 text-zinc-400 hover:text-white transition-colors">
            <Plus className="size-5" />
          </button>
        </div>
      )}

      <div className="flex-1 h-8 self-end border-b border-zinc-900" />
    </div>
  );
}
