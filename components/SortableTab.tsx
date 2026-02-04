"use client";

import React from "react";
import { Edit2, X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project } from "@/types/project";

type Props = {
  project: Project;

  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;

  startEditing: (project: Project, e: React.MouseEvent<HTMLElement>) => void;
  deleteProject: (id: number, e: React.MouseEvent<HTMLElement>) => void;

  editingProjectId: number | null;
  tempName: string;
  setTempName: (v: string) => void;
  saveName: () => void;
};

export default function SortableTab({
  project,
  activeProjectId,
  setActiveProjectId,
  startEditing,
  deleteProject,
  editingProjectId,
  tempName,
  setTempName,
  saveName,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isDragging) return;
        setActiveProjectId(project.id);
      }}
      className={`group relative flex items-center gap-2 px-4 h-8 self-end ${
        isDragging ? "cursor-grabbing opacity-80" : "cursor-grab"
      } transition-all rounded-t-lg ${
        activeProjectId === project.id
          ? "bg-[#3a3a3c] text-white z-10 border-t border-x border-zinc-800"
          : "bg-transparent text-zinc-400 hover:text-white border-b border-zinc-900"
      }`}
    >
      {editingProjectId === project.id ? (
        <input
          autoFocus
          className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest w-full"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") saveName();
          }}
        />
      ) : (
        <span className="text-[10px] font-black uppercase tracking-widest truncate">{project.name}</span>
      )}

      <div className="flex items-center gap-1.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="Rename project"
          className="p-1 hover:text-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            startEditing(project, e);
          }}
        >
          <Edit2 className="size-3" />
        </button>

        <button
          type="button"
          aria-label="Delete project"
          className="p-1 hover:text-red-500 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            deleteProject(project.id, e);
          }}
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
