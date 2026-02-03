"use client";

import React, { useEffect, useRef, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";
import { useLibrary } from "@/hooks/useLibrary";

/**
 * Types locaux (pour arrêter l’hémorragie TypeScript dans Vercel)
 * On ne change pas ton fonctionnement : on rend juste le modèle cohérent.
 */
type AnyRow = Record<string, any>;

type BoardItem = AnyRow & {
  instanceId: number;
  x: number;
  y: number;
  rotation: number;
};

type Project = {
  id: number;
  name: string;
  zoom: number;
  boardPedals: BoardItem[];
  selectedBoards: BoardItem[];
};

const MAX_PROJECTS = 8;
const STORAGE_KEY = "guitar-sandbox-data";

const DEFAULT_WORKING_BOARD: Project = {
  id: -1,
  name: "WORKING",
  zoom: 100,
  boardPedals: [],
  selectedBoards: [],
};

export default function PedalBoardApp() {
  const { pedalsLibrary, boardsLibrary } = useLibrary();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [workingBoard, setWorkingBoard] = useState<Project>(DEFAULT_WORKING_BOARD);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [tempName, setTempName] = useState<string>("");

  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] = useState<number | null>(null);

  const [pedalSearch, setPedalSearch] = useState<string>("");
  const [boardSearch, setBoardSearch] = useState<string>("");

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [showPedalResults, setShowPedalResults] = useState<boolean>(false);
  const [showBoardResults, setShowBoardResults] = useState<boolean>(false);

  const [displaySizes, setDisplaySizes] = useState<Record<number, { w: number; h: number }>>({});
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Backgrounds (neutral par défaut)
  const BACKGROUNDS = [
    { id: "neutral", label: "Neutral", type: "css" as const },
    { id: "wood", label: "Wood", type: "image" as const, src: "/backgrounds/wood.webp" },
    { id: "marble", label: "Marble", type: "image" as const, src: "/backgrounds/marble.webp" },
  ];
  const [canvasBg, setCanvasBg] = useState<string>("neutral");

  // Custom item (inchangé)
  const [customType, setCustomType] = useState<"pedal" | "board">("pedal");
  const [customName, setCustomName] = useState<string>("");
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customDepth, setCustomDepth] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("#3b82f6");

  // refs (si tu les utilises plus tard)
  const pedalSearchRef = useRef<HTMLInputElement | null>(null);
  const boardSearchRef = useRef<HTMLInputElement | null>(null);

  /**
   * Active project (toujours un Project valide)
   */
  const activeProject: Project =
    projects.find((p) => p.id === activeProjectId) ?? workingBoard;

  /**
   * Helpers
   */
  const closeSearchMenus = () => {
    setShowPedalResults(false);
    setShowBoardResults(false);
    setPedalSearch("");
    setBoardSearch("");
  };

  const updateActiveProject = (updates: Partial<Project>) => {
    if (activeProjectId !== null) {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, ...updates } : p))
      );
    } else {
      setWorkingBoard((prev) => ({ ...prev, ...updates }));
    }
  };

  /**
   * Wheel zoom (Ctrl / Cmd + molette)
   */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentZoom = activeProject.zoom ?? 100;
        const delta = e.deltaY > 0 ? -5 : 5;
        const newZoom = Math.min(Math.max(currentZoom + delta, 25), 200);
        updateActiveProject({ zoom: newZoom });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
    // on dépend volontairement d’activeProject.zoom via activeProject
  }, [activeProjectId, activeProject.zoom]);

  /**
   * Hydratation + resize + load localStorage (safe)
   */
  useEffect(() => {
    const updateSize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", updateSize);
    updateSize();

    // Load safe
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        const parsedProjects = (parsed.projects ?? []) as any[];
        const safeProjects: Project[] = parsedProjects.map((p: any, i: number) => ({
          id: typeof p.id === "number" ? p.id : Date.now() + i,
          name: typeof p.name === "string" ? p.name : `BOARD ${i + 1}`,
          zoom: typeof p.zoom === "number" ? p.zoom : 100,
          boardPedals: Array.isArray(p.boardPedals) ? p.boardPedals : [],
          selectedBoards: Array.isArray(p.selectedBoards) ? p.selectedBoards : [],
        }));

        setProjects(safeProjects);

        const ap = parsed.activeProjectId;
        setActiveProjectId(typeof ap === "number" ? ap : null);

        const wb = parsed.workingBoard ?? {};
        setWorkingBoard({
          ...DEFAULT_WORKING_BOARD,
          ...wb,
          name: typeof wb.name === "string" ? wb.name : DEFAULT_WORKING_BOARD.name,
          zoom: typeof wb.zoom === "number" ? wb.zoom : DEFAULT_WORKING_BOARD.zoom,
          boardPedals: Array.isArray(wb.boardPedals) ? wb.boardPedals : [],
          selectedBoards: Array.isArray(wb.selectedBoards) ? wb.selectedBoards : [],
        });
      }
    } catch {
      // si JSON corrompu, on ignore et on part sur défaut
      setProjects([]);
      setActiveProjectId(null);
      setWorkingBoard(DEFAULT_WORKING_BOARD);
    }

    setHydrated(true);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  /**
   * Save localStorage (safe)
   */
  useEffect(() => {
    if (!hydrated) return;
    if (dimensions.width === 0) return;

    const dataToSave = JSON.stringify({ projects, activeProjectId, workingBoard });
    localStorage.setItem(STORAGE_KEY, dataToSave);
  }, [hydrated, projects, activeProjectId, workingBoard, dimensions.width]);

  /**
   * Sélections (safe)
   */
  const selectedPedal = activeProject.boardPedals.find(
    (p) => p.instanceId === selectedInstanceId
  );
  const selectedBoardDetails = activeProject.selectedBoards.find(
    (b) => b.instanceId === selectedBoardInstanceId
  );

  /**
   * Sizing callback (IMPORTANT : doit exister sinon runtime error)
   */
  const handleSizeUpdate = (id: number, w: number, h: number) => {
    setDisplaySizes((prev) => {
      const existing = prev[id];
      if (existing && existing.w === w && existing.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  };

  /**
   * Actions (inchangées)
   */
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
      zoom: 100,
      boardPedals: [],
      selectedBoards: [],
    };

    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newId);
  };

  const deleteProject = (id: number, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();

    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);

      // si plus de projets, on repasse sur workingBoard
      if (next.length === 0) {
        setActiveProjectId(null);
        setWorkingBoard(DEFAULT_WORKING_BOARD);
      } else if (activeProjectId === id) {
        setActiveProjectId(next[0].id);
      }

      return next;
    });
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
    updateActiveProject({
      selectedBoards: [...activeProject.selectedBoards, newBoard],
    });
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

  // (Si tu gères aussi rotation/suppression de boards, garde ces fonctions)
  const rotateBoard = (id: number) => {
    updateActiveProject({
      selectedBoards: activeProject.selectedBoards.map((b) =>
        b.instanceId === id ? { ...b, rotation: (b.rotation + 90) % 360 } : b
      ),
    });
  };

  const deleteBoard = (id: number) => {
    updateActiveProject({
      selectedBoards: activeProject.selectedBoards.filter((b) => b.instanceId !== id),
    });
    setSelectedBoardInstanceId(null);
  };

  /**
   * Drag bounds (inchangé)
   */
  const getDragBounds = (
    id: number,
    rotation: number,
    pos: { x: number; y: number }
  ) => {
    const size = displaySizes[id];
    if (!size) return pos;

    const currentZoom = activeProject.zoom || 100;
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
      {/* SIDEBAR */}
      <Sidebar
        pedalsLibrary={pedalsLibrary}
        boardsLibrary={boardsLibrary}
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

      {/* BOARD AREA + neutral background intact */}
      <div className="flex-1 relative bg-[#2c2c2e] bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)] flex flex-col">
        <TopBarTabs
          projects={projects}
          setProjects={setProjects}
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
          // si BoardCanvas utilise rotateBoard/deleteBoard etc, ajoute-les là-bas, mais je ne les invente pas
        />
      </div>
    </div>
  );
}
