"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Zap,
  Weight,
  Trash2,
  Plus,
  Edit2,
  X,
  Star,
  Square,
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  Check,
  RotateCw,
  ShoppingCart,
  History,
  Minus,
} from "lucide-react";
import {
  Stage,
  Layer,
  Rect,
  Group,
  Line,
  Circle,
  Path,
  Text,
  Image as KonvaImage,
} from "react-konva";

import Sidebar from "@/components/Sidebar";
import PedalImage from "@/components/PedalImage";
import { useLibrary } from "@/hooks/useLibrary";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";

/* =======================
   TYPES
======================= */

type BoardItem = {
  instanceId: number;
  name?: string;
  brand?: string;
  draw?: number;
  weight?: number;
  x: number;
  y: number;
  rotation: number;
};

type Project = {
  id: number;
  name?: string;
  zoom: number;
  boardPedals: BoardItem[];
  selectedBoards: BoardItem[];
};

/* =======================
   CONSTANTS
======================= */

const MAX_PROJECTS = 8;
const STORAGE_KEY = "guitar-sandbox-data";

/* =======================
   COMPONENT
======================= */

export default function PedalBoardApp() {
  const { pedalsLibrary, boardsLibrary } = useLibrary();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [workingBoard, setWorkingBoard] = useState<Project>({
    id: -1,
    zoom: 100,
    boardPedals: [],
    selectedBoards: [],
  });

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  );
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] =
    useState<number | null>(null);

  const [pedalSearch, setPedalSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [displaySizes, setDisplaySizes] = useState<Record<number, { w: number; h: number }>>({});
  const [hydrated, setHydrated] = useState(false);

  /* =======================
     BACKGROUNDS
  ======================= */

  const BACKGROUNDS = [
    { id: "neutral", label: "Neutral", type: "css" },
    { id: "wood", label: "Wood", type: "image", src: "/backgrounds/wood.webp" },
    { id: "marble", label: "Marble", type: "image", src: "/backgrounds/marble.webp" },
  ];

  const [canvasBg, setCanvasBg] = useState("neutral");

  /* =======================
     ACTIVE PROJECT (UNIQUE)
  ======================= */

  const activeProject: Project =
    projects.find((p) => p.id === activeProjectId) ?? workingBoard;

  /* =======================
     EFFECTS
  ======================= */

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? -5 : 5;
      const newZoom = Math.min(
        Math.max(activeProject.zoom + delta, 25),
        200
      );

      updateActiveProject({ zoom: newZoom });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeProject]);

  useEffect(() => {
    const updateSize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", updateSize);
    updateSize();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.projects ?? []);
      setActiveProjectId(parsed.activeProjectId ?? null);
      setWorkingBoard(
        parsed.workingBoard ?? {
          id: -1,
          zoom: 100,
          boardPedals: [],
          selectedBoards: [],
        }
      );
    }

    setHydrated(true);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!hydrated || dimensions.width === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ projects, activeProjectId, workingBoard })
    );
  }, [projects, activeProjectId, workingBoard, hydrated, dimensions.width]);

  /* =======================
     HELPERS (INCHANGÉS)
  ======================= */

  const updateActiveProject = (updates: Partial<Project>) => {
    if (activeProjectId !== null) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId ? { ...p, ...updates } : p
        )
      );
    } else {
      setWorkingBoard((prev) => ({ ...prev, ...updates }));
    }
  };

  const handleSizeUpdate = (id: number, w: number, h: number) => {
    setDisplaySizes((prev) => {
      if (prev[id]?.w === w && prev[id]?.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  };

  const createNewProject = () => {
    if (projects.length >= MAX_PROJECTS) return;

    const id = Date.now();
    const project: Project = {
      id,
      name: `BOARD ${projects.length + 1}`,
      zoom: 100,
      boardPedals: [],
      selectedBoards: [],
    };

    setProjects([...projects, project]);
    setActiveProjectId(id);
  };

  const deleteProject = (id: number) => {
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);

    if (remaining.length === 0) {
      setActiveProjectId(null);
      setWorkingBoard({
        id: -1,
        zoom: 100,
        boardPedals: [],
        selectedBoards: [],
      });
    } else if (activeProjectId === id) {
      setActiveProjectId(remaining[0].id);
    }
  };

  /* =======================
     RENDER
  ======================= */

  if (dimensions.width === 0) return null;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white fixed inset-0 select-none">
      <Sidebar
        pedalsLibrary={pedalsLibrary}
        boardsLibrary={boardsLibrary}
        selectedPedal={activeProject.boardPedals.find(
          (p) => p.instanceId === selectedInstanceId
        )}
        selectedBoardDetails={activeProject.selectedBoards.find(
          (b) => b.instanceId === selectedBoardInstanceId
        )}
        selectedInstanceId={selectedInstanceId}
        setSelectedInstanceId={setSelectedInstanceId}
        selectedBoardInstanceId={selectedBoardInstanceId}
        setSelectedBoardInstanceId={setSelectedBoardInstanceId}
        pedalSearch={pedalSearch}
        setPedalSearch={setPedalSearch}
        boardSearch={boardSearch}
        setBoardSearch={setBoardSearch}
      />

      {/* BOARD AREA */}
      <div
        className="flex-1 relative flex flex-col"
        style={
          canvasBg === "neutral"
            ? { backgroundColor: "#2c2c2e" }
            : {}
        }
      >
        <TopBarTabs
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          createNewProject={createNewProject}
          deleteProject={deleteProject}
        />

        <BoardCanvas
          dimensions={dimensions}
          activeProject={activeProject}
          selectedInstanceId={selectedInstanceId}
          setSelectedInstanceId={setSelectedInstanceId}
          selectedBoardInstanceId={selectedBoardInstanceId}
          setSelectedBoardInstanceId={setSelectedBoardInstanceId}
          displaySizes={displaySizes}
          handleSizeUpdate={handleSizeUpdate}
          updateActiveProject={updateActiveProject}
          BACKGROUNDS={BACKGROUNDS}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
        />
      </div>
    </div>
  );
}
