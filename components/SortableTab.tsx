"use client";

import React from "react";
import { X } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project } from "@/types/project";
import { getTranslator } from "@/utils/i18n";


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

  t: (key: string) => string;
  

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
  t,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const [justSaved, setJustSaved] = React.useState(false); 

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    zIndex: isDragging ? 50 : "auto",


  };

  const handleSave = () => {
  saveName();          // appelle ta fonction existante
  setJustSaved(true);  // active le feedback

  setTimeout(() => {
    setJustSaved(false);
  }, 300);             // 300ms de feedback
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
      onDoubleClick={(e) => {
      e.stopPropagation();
      startEditing(project, e);
       }}
      className={`
group relative flex items-center justify-center
flex-1 min-w-0 px-2 sm:px-3 md:px-4 h-8 sm:h-9 rounded-t-xl
border border-transparent
transition-all duration-200
${isDragging ? "cursor-grabbing opacity-0" : "cursor-grab"}
${justSaved ? "ring-2 ring-white/50" : ""}
${
  activeProjectId === project.id
    ? "bg-zinc-900 text-white border-zinc-800"
    : "text-zinc-500 hover:text-white hover:bg-zinc-900"
}
`}
    >
      {editingProjectId === project.id ? (
        <input
          autoFocus
          onClick={(e) => e.stopPropagation()}
          className="bg-transparent outline-none text-center text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest w-full"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleSave();
          }}
        />
      ) : (
        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate">{project.name}</span>
      )}

      <div className="absolute right-2 flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">

        <button
            type="button"
            aria-label="Delete project"
            className="p-1 hover:text-red-500 transition-colors"
            onClick={(e) => {
              e.stopPropagation();

              const confirmed = window.confirm(
                t("tabs.confirmDelete")
              );

              if (confirmed) {
                deleteProject(project.id, e);
              }
            }}
          >
            <X className="size-3" />
          </button>

            </div>

      {activeProjectId === project.id && (
        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white" />
      )}
    </div>
  );
}
