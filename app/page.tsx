"use client";

import React, { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";
import { useLibrary } from "@/hooks/useLibrary";

type AnyRow = Record<string, any>;

type BoardItem = AnyRow & {
  instanceId: number;
  x: number;
  y: number;
  rotation: number;
};

type Project = {
  id: number;
  name: string; // ✅ IMPORTANT : obligatoire (TopBarTabs l’exige)
  zoom: number;
  boardPedals: BoardItem[];
  selectedBoards: BoardItem[];
};

const MAX_PROJECTS = 8;
const STORAGE_KEY = "guitar-sandbox-data";

export default function PedalBoardApp() {
  const { pedalsLibrary, boardsLibrary } = useLibrary();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [workingBoard, setWorkingBoard] = useState<Project>({
    id: -1,
    name: "WORKING",
    zoom: 100,
    boardPedals: [],
    selectedBoards: [],
  });

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");

  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] = useState<number | null>(null);

  const [pedalSearch, setPedalSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [showPedalResults, setShowPedalResults] = useState(false);
  const [showBoardResults, setShowBoardResults] = useState(false);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [displaySizes, setDisplaySizes] = useState<Record<number, { w: number; h: number }>>({});
  const [hydrated, setHydrated] = useState(false);

  const [customType, setCustomType] = useState<"pedal" | "board">("pedal");
  const [customName, setCustomName] = useState("");
  const [customWidth, setCustomWidth] = useState("");
  const [customDepth, setCustomDepth] = useState("");
  const [customColor, setCustomColor] = useState("#3b82f6");

  // présents dans ton ancien code (même si pas utilisés ici, je ne touche pas)
  const pedalSearchRef = useRef<HTMLInputElement | null>(null);
  const boardSearchRef = useRef<HTMLInputElement | null>(null);

  const BACKGROUNDS = [
    { id: "neutral", label: "Neutral", type: "css" },
    { id: "wood", label: "Wood", type: "image", src: "/backgrounds/wood.webp" },
    { id: "marble", label: "Marble", type: "image", src: "/backgrounds/marble.webp" },
  ];

  const [canvasBg, setCanvasBg] = useState("neutral");

  const closeSearchMenus = () => {
    setShowPedalResults(false);
    setShowBoardResults(false);
    setPedalSearch("");
    setBoardSearch("");
  };

  const activeProject: Project =
    projects.find((p) => p.id === activeProjectId) ?? workingBoard;

  const selectedPedal: AnyRow | undefined = activeProject.boardPedals.find(
    (p) => p.instanceId === selectedInstanceId
  );

  const selectedBoardDetails: AnyRow | undefined = activeProject.selectedBoards.find(
    (b) => b.instanceId === selectedBoardInstanceId
  );

  const updateActiveProject = (updates: Partial<Project>) => {
    if (activeProjectId !== null) {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, ...updates } : p))
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

  // ===== Load + resize =====
  useEffect(() => {
    const updateSize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", updateSize);
    updateSize();

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData) as {
        projects?: Partial<Project>[];
        activeProjectId?: number | null;
        workingBoard?: Partial<Project>;
      };

      // ✅ Important : on “répare” les vieux projets qui n’ont pas name
      const loadedProjects: Project[] = (parsed.projects ?? []).map((p, i) => ({
        id: typeof p.id === "number" ? p.id : Date.now() + i,
        name: typeof p.name === "string" && p.name.trim() ? p.name : `BOARD ${i + 1}`,
        zoom: typeof p.zoom === "number" ? p.zoom : 100,
        boardPedals: Array.isArray(p.boardPedals) ? (p.boardPedals as BoardItem[]) : [],
        selectedBoards: Array.isArray(p.selectedBoards) ? (p.selectedBoards as BoardItem[]) : [],
      }));

      setProjects(loadedProjects);
      setActiveProjectId(parsed.activeProjectId ?? null);

      const wb = parsed.workingBoard;
      setWorkingBoard({
        id: -1,
        name:
          wb && typeof wb.name === "string" && wb.name.trim()
            ? wb.name
            : "WORKING",
        zoom: wb && typeof wb.zoom === "number" ? wb.zoom : 100,
        boardPedals: wb && Array.isArray(wb.boardPedals) ? (wb.boardPedals as BoardItem[]) : [],
        selectedBoards: wb && Array.isArray(wb.selectedBoards) ? (wb.selectedBoards as BoardItem[]) : [],
      });
    }

    setHydrated(true);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // ===== Save =====
  useEffect(() => {
    if (!hydrated) return;
    if (dimensions.width === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ projects, activeProjectId, workingBoard })
    );
  }, [hydrated, projects, activeProjectId, workingBoard, dimensions.width]);

  // ===== Zoom Ctrl/Cmd+Wheel (window listener => WheelEvent) =====
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const currentZoom = activeProject.zoom ?? 100;
      const delta = e.deltaY > 0 ? -5 : 5;
      const newZoom = Math.min(Math.max(currentZoom + delta, 25), 200);

      updateActiveProject({ zoom: newZoom });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [activeProject.zoom, activeProjectId, projects, workingBoard]);

  // ===== Actions (identiques à ta logique) =====
  const resetCanvas = () => {
    if (window.confirm("Are you sure you want to clear the entire board?")) {
      updateActiveProject({ boardPedals: [], selectedBoards: [] });
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
    }
  };

  const createNewProject = () => {
    if (projects.length >= MAX_PROJECTS) return;
    const newId = Date.now();
    const newProject: Project = {
      id: newId,
      name: `BOARD ${projects.length + 1}`,
      boardPedals: [],
      selectedBoards: [],
      zoom: 100,
    };
    setProjects([...projects, newProject]);
    setActiveProjectId(newId);
  };

  const deleteProject = (id: number, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const newProjects = projects.filter((p) => p.id !== id);
    setProjects(newProjects);

    if (newProjects.length === 0) {
      setActiveProjectId(null);
      setWorkingBoard({ id: -1, name: "WORKING", boardPedals: [], selectedBoards: [], zoom: 100 });
    } else if (activeProjectId === id) {
      setActiveProjectId(newProjects[0].id);
    }
  };

  const startEditing = (project: Project, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setTempName(project.name);
  };

  const saveName = () => {
    if (editingProjectId === null) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProjectId ? { ...p, name: tempName.toUpperCase() } : p
      )
    );
    setEditingProjectId(null);
  };

  const addPedal = (pedal: AnyRow) => {
    const newPedal: BoardItem = {
      ...pedal,
      instanceId: Date.now(),
      x: (dimensions.width - 320) / 2,
      y: (dimensions.height - 56) / 2,
      rotation: 0,
    };
    updateActiveProject({ boardPedals: [...activeProject.boardPedals, newPedal] });
    closeSearchMenus();
  };

  const selectBoard = (board: AnyRow) => {
    const newBoard: BoardItem = {
      ...board,
      instanceId: Date.now(),
      x: (dimensions.width - 320) / 2,
      y: (dimensions.height - 56) / 2,
      rotation: 0,
    };
    updateActiveProject({ selectedBoards: [...activeProject.selectedBoards, newBoard] });
    closeSearchMenus();
  };

  const addCustomItem = () => {
    if (!customWidth || !customDepth) return;

    const item: BoardItem = {
      instanceId: Date.now(),
      name: customName || `Custom ${customType}`,
      brand: "Custom",
      width: parseFloat(customWidth),
      depth: parseFloat(customDepth),
      color: customColor,
      x: (dimensions.width - 320) / 2,
      y: (dimensions.height - 56) / 2,
      rotation: 0,
      draw: 0,
      weight: 0,
    };

    if (customType === "pedal") {
      updateActiveProject({ boardPedals: [...activeProject.boardPedals, item] });
    } else {
      updateActiveProject({ selectedBoards: [...activeProject.selectedBoards, item] });
    }

    setCustomWidth("");
    setCustomDepth("");
    setCustomName("");
  };

  const rotatePedal = (id: number) => {
    updateActiveProject({
      boardPedals: activeProject.boardPedals.map((p) =>
        p.instanceId === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      ),
    });
  };

  const deletePedal = (id: number) => {
    updateActiveProject({
      boardPedals: activeProject.boardPedals.filter((p) => p.instanceId !== id),
    });
    setSelectedInstanceId(null);
  };

  // ===== BoardCanvas helper (tel que tu l'avais) =====
  const currentZoom = activeProject.zoom ?? 100;

  const getDragBounds = (
    id: number,
    rotation: number,
    pos: { x: number; y: number }
  ) => {
    const size = displaySizes[id];
    if (!size) return pos;
    const isVertical = (rotation / 90) % 2 !== 0;
    const w = (isVertical ? size.h : size.w) * (currentZoom / 100);
    const h = (isVertical ? size.w : size.h) * (currentZoom / 100);
    const stageW = dimensions.width - 320;
    const stageH = dimensions.height - 56;
    return {
      x: Math.max(w / 2, Math.min(stageW - w / 2, pos.x)),
      y: Math.max(h / 2, Math.min(stageH - h / 2, pos.y)),
    };
  };

  if (dimensions.width === 0) return null;

  return (
    <div
      className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans fixed inset-0 select-none"
      onClick={closeSearchMenus}
    >
      <Sidebar
        pedalsLibrary={pedalsLibrary as AnyRow[]}
        boardsLibrary={boardsLibrary as AnyRow[]}
        showPedalResults={showPedalResults}
        setShowPedalResults={setShowPedalResults}
        showBoardResults={showBoardResults}
        setShowBoardResults={setShowBoardResults}
        pedalSearch={pedalSearch}
        setPedalSearch={setPedalSearch}
        boardSearch={boardSearch}
        setBoardSearch={setBoardSearch}
        selectedPedal={selectedPedal}
        selectedBoardDetails={selectedBoardDetails}
        selectedInstanceId={selectedInstanceId}
        selectedBoardInstanceId={selectedBoardInstanceId}
        setSelectedInstanceId={setSelectedInstanceId}
        setSelectedBoardInstanceId={setSelectedBoardInstanceId}
        customType={customType}
        setCustomType={setCustomType}
        customName={customName}
        setCustomName={setCustomName}
        customWidth={customWidth}
        setCustomWidth={setCustomWidth}
        customDepth={customDepth}
        setCustomDepth={setCustomDepth}
        customColor={customColor}
        setCustomColor={setCustomColor}
        addPedal={addPedal}
        selectBoard={selectBoard}
        addCustomItem={addCustomItem}
        resetCanvas={resetCanvas}
        rotatePedal={rotatePedal}
        deletePedal={deletePedal}
      />

      {/* Board area + neutral background */}
      <div
        className="flex-1 relative bg-[#2c2c2e] bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)] flex flex-col"
        style={canvasBg === "neutral" ? { backgroundColor: "#2c2c2e" } : {}}
      >
        <TopBarTabs
          projects={projects}
          setProjects={(v: Project[]) => setProjects(v)}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          editingProjectId={editingProjectId}
          tempName={tempName}
          setTempName={setTempName}
          startEditing={startEditing}
          saveName={saveName}
          deleteProject={deleteProject}
          createNewProject={createNewProject}
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
          getDragBounds={getDragBounds}
          closeSearchMenus={closeSearchMenus}
          BACKGROUNDS={BACKGROUNDS}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
        />
      </div>
    </div>
  );
}
