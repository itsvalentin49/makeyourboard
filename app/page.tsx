"use client";

import React, { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";
import { useLibrary } from "@/hooks/useLibrary";
import type { AnyRow, BoardItem, Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";

type Units = "metric" | "imperial";
const LANGUAGE_TO_LOCALE: Record<string, "en" | "fr" | "es" | "de" | "it" | "pt"> = {
  English: "en",
  French: "fr",
  Spanish: "es",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
};


const MAX_PROJECTS = 5;
const STORAGE_KEY = "guitar-sandbox-data";
const SETTINGS_STORAGE_KEY = "myb_settings";


const DEFAULT_WORKING_BOARD: Project = {
  id: -1,
  name: "WORKING",
  zoom: 100,
  boardPedals: [],
  selectedBoards: [],
};

// 👉 updates “compatibles BoardCanvas”
type ActiveProjectUpdates = Partial<{
  zoom: number;
  boardPedals: AnyRow[];
  selectedBoards: AnyRow[];
}>;

const createEmptyProject = (index: number): Project => ({
  id: Date.now() + index,
  name: `Pedalboard ${index}`,
  zoom: 100,
  boardPedals: [],
  selectedBoards: [],
});


export default function PedalBoardApp() {
  const { pedalsLibrary, boardsLibrary } = useLibrary();

const BACKGROUNDS = [
  {
    id: "neutral",
    label: "Neutral",
    type: "css" as const,
  },
  {
    id: "wood",
    label: "Wood",
    type: "image" as const,
    src: "/backgrounds/wood.webp",
  },
  {
    id: "marble",
    label: "Marble",
    type: "image" as const,
    src: "/backgrounds/marble.webp",
  },
  {
    id: "rug",
    label: "Rug",
    type: "image" as const,
    src: "/backgrounds/rug.webp",
  },
  {
    id: "stage",
    label: "Stage",
    type: "image" as const,
    src: "/backgrounds/stage.webp",
  },
  {
    id: "flightcase",
    label: "Flightcase",
    type: "image" as const,
    src: "/backgrounds/flightcase.webp",
  },
];



  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [workingBoard, setWorkingBoard] = useState<Project>(DEFAULT_WORKING_BOARD);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [tempName, setTempName] = useState<string>("");

  const [canvasBg, setCanvasBg] = useState<string>("neutral");
  const [language, setLanguage] = useState<Language>("en");
  const t = getTranslator(language);

  const [units, setUnits] = useState<Units>("metric");

  useEffect(() => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);

    if (parsed.canvasBg) setCanvasBg(parsed.canvasBg);
    if (parsed.language) {
  const allowed: Language[] = ["en", "fr", "es", "de", "it", "pt"];

  if (allowed.includes(parsed.language)) {
    setLanguage(parsed.language);
  }
}



    if (parsed.units) setUnits(parsed.units);
  } catch {
    // storage corrompu → on ignore
  }
}, []);
useEffect(() => {
  const data = {
    canvasBg,
    language,
    units,
  };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
}, [canvasBg, language, units]);



  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] = useState<number | null>(null);

  const [pedalSearch, setPedalSearch] = useState<string>("");
  const [boardSearch, setBoardSearch] = useState<string>("");

  const [showPedalResults, setShowPedalResults] = useState<boolean>(false);
  const [showBoardResults, setShowBoardResults] = useState<boolean>(false);
  const [contactOpen, setContactOpen] = useState(false);

  const [displaySizes, setDisplaySizes] = useState<Record<number, { w: number; h: number }>>({});
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
  if (projects.length === 0) {
    const firstProject: Project = {
      id: Date.now(),
      name: "Pedalboard 1",
      zoom: 100,
      boardPedals: [],
      selectedBoards: [],
    };

    setProjects([firstProject]);
    setActiveProjectId(firstProject.id);
  }
}, [projects]);


  // Custom item
  const [customName, setCustomName] = useState<string>("pedal");
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customDepth, setCustomDepth] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("#3b82f6");
  const [makeOpen, setMakeOpen] = useState(true);


  const [customType, setCustomType] = useState<"pedal" | "board" | null>("pedal");



  /**
   * Active project (toujours un Project valide)
   */
  const activeProject: Project = projects.find((p) => p.id === activeProjectId) ?? workingBoard;

  /**
   * Helpers
   */
  const closeSearchMenus = () => {
    setShowPedalResults(false);
    setShowBoardResults(false);
  };

  /**
   * ✅ Fix TS: accepte AnyRow[] (BoardCanvas) puis normalise en BoardItem[] (state)
   */
  const updateActiveProject = (updates: ActiveProjectUpdates) => {
    const normalized: Partial<Pick<Project, "zoom" | "boardPedals" | "selectedBoards">> = {
      ...(typeof updates.zoom === "number" ? { zoom: updates.zoom } : {}),
      ...(updates.boardPedals ? { boardPedals: updates.boardPedals as BoardItem[] } : {}),
      ...(updates.selectedBoards ? { selectedBoards: updates.selectedBoards as BoardItem[] } : {}),
    };

    if (activeProjectId !== null) {
      setProjects((prev) =>
        prev.map((p) => (p.id === activeProjectId ? { ...p, ...normalized } : p))
      );
    } else {
      setWorkingBoard((prev) => ({ ...prev, ...normalized }));
    }
  };

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
  }, [activeProjectId, activeProject.zoom]);
  
  useEffect(() => {

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        const parsedProjects = (parsed.projects ?? []) as any[];
        const safeProjects: Project[] = parsedProjects.map((p: any, i: number) => ({
          id: typeof p.id === "number" ? p.id : Date.now() + i,
          name: typeof p.name === "string" ? p.name : `Pedalboard ${i + 1}`,
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
      setProjects([]);
      setActiveProjectId(null);
      setWorkingBoard(DEFAULT_WORKING_BOARD);
    }

    setHydrated(true);
    }, []);

  useEffect(() => {
  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 768;

  setIsMobileDevice(isTouch && isSmallScreen);
}, []);

  /**
   * Save localStorage (safe)
   */
  useEffect(() => {
    if (!hydrated) return;

    const dataToSave = JSON.stringify({ projects, activeProjectId, workingBoard });
    localStorage.setItem(STORAGE_KEY, dataToSave);
  }, [hydrated, projects, activeProjectId, workingBoard,]);

  /**
   * Sélections (safe)
   */
  const selectedPedal = activeProject.boardPedals.find((p) => p.instanceId === selectedInstanceId);
  const selectedBoardDetails = activeProject.selectedBoards.find(
    (b) => b.instanceId === selectedBoardInstanceId
  );

  /**
   * Sizing callback
   */
  const handleSizeUpdate = (id: number, w: number, h: number) => {
    setDisplaySizes((prev) => {
      const existing = prev[id];
      if (existing && existing.w === w && existing.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  };

  /**
   * Actions
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
      name: `Pedalboard ${projects.length + 1}`,
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
      prev.map((p) => (p.id === editingProjectId ? { ...p, name: tempName.toUpperCase() } : p))
    );
    setEditingProjectId(null);
  };

  const addPedal = (pedal: AnyRow) => {
  const isMobile = isMobileDevice;
  const sidebarWidth = isMobile ? 0 : 320;

  const newPedal: BoardItem = {
    ...pedal,
    instanceId: Date.now(),
    x: 400,
    y: 300,
    rotation: 0,
    draw: Number(pedal.draw) || 0,
    weight: Number(pedal.weight) || 0,
  };

  updateActiveProject({
    boardPedals: [...activeProject.boardPedals, newPedal],
  });

  closeSearchMenus();
};


  const selectBoard = (board: AnyRow) => {
  const isMobile = isMobileDevice;
  const sidebarWidth = isMobile ? 0 : 320;

  const newBoard: BoardItem = {
    ...board,
    instanceId: Date.now(),
    x: 400,
    y: 300,
    rotation: 0,
  };

  updateActiveProject({
    selectedBoards: [...activeProject.selectedBoards, newBoard],
  });

  closeSearchMenus();
};


const addCustomItem = () => {
  if (!customType) return;

  const isMobile = isMobileDevice;
  const sidebarWidth = isMobile ? 0 : 320;

  const widthMm =
  units === "metric"
    ? Number(customWidth)
    : Number(customWidth) * 25.4;

  const depthMm =
    units === "metric"
      ? Number(customDepth)
      : Number(customDepth) * 25.4;

  // 🎛 PEDAL (30–300)
  if (customType === "pedal") {
    if (
      !widthMm ||
      !depthMm ||
      widthMm < 30 ||
      widthMm > 300 ||
      depthMm < 30 ||
      depthMm > 300
    ) {
      return;
    }
  }

  // 🪵 BOARD (100–1000)
  if (customType === "board") {
    if (
      !widthMm ||
      !depthMm ||
      widthMm < 100 ||
      widthMm > 1000 ||
      depthMm < 100 ||
      depthMm > 1000
    ) {
      return;
    }
  }

const newItem: BoardItem = {
  id: Date.now(),              // IMPORTANT
  slug: "custom",              // IMPORTANT si utilisé
  type: "Custom",
  circuit: "",
  bypass: "",
  power: "",
  status: "Active",
  origin: "",
  year: "",
  manual: "",

  instanceId: Date.now(),
  name: "Custom",
  brand: "Custom",
  width: widthMm,
  depth: depthMm,
  image:
  customType === "pedal"
    ? "/images/custom-pedal.png"
    : "/images/custom-board.png",
  x: 400,
  y: 300,
  rotation: 0,
  draw: 0,
  weight: 0,
};

  if (customType === "pedal") {
    updateActiveProject({
      boardPedals: [...activeProject.boardPedals, newItem],
    });
  } else {
    updateActiveProject({
      selectedBoards: [...activeProject.selectedBoards, newItem],
    });
  }

  setCustomWidth("");
  setCustomDepth("");
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

  const rotateBoard = (id: number) => {
  updateActiveProject({
    selectedBoards: (activeProject.selectedBoards || []).map((b) =>
      b.instanceId === id
        ? { ...b, rotation: ((b.rotation || 0) + 90) % 360 }
        : b
    ),
  });
};

const deleteBoard = (id: number) => {
  updateActiveProject({
    selectedBoards: (activeProject.selectedBoards || []).filter(
      (b) => b.instanceId !== id
    ),
  });
  setSelectedBoardInstanceId(null);
};


  return (
  <div
    className="bg-zinc-950 text-white font-sans select-none overflow-hidden"
    style={{ height: "100dvh" }}
    onClick={closeSearchMenus}
  >
    <div className="flex h-full min-w-[1200px]">

  {hydrated && isMobileDevice && (
  <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-black text-xs text-center py-1 z-50">
    Best experienced on desktop or tablet.
  </div>
)}

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
        rotatePedal={rotatePedal}
        deletePedal={deletePedal}
        rotateBoard={rotateBoard}
        deleteBoard={deleteBoard}
        canvasBg={canvasBg}
        setCanvasBg={setCanvasBg}
        language={language}
        setLanguage={(lang) => {setLanguage(lang);}}
        units={units}
        setUnits={setUnits}
        customType={customType}
        setCustomType={setCustomType}
        makeOpen={makeOpen}
        setMakeOpen={setMakeOpen}
        contactOpen={contactOpen}
        setContactOpen={setContactOpen}
      />

        <div className="flex-1 min-w-0 relative bg-[#2c2c2e] bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)] flex flex-col overflow-hidden">        <TopBarTabs
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
          language={language}
          setLanguage={setLanguage}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
          units={units}
          setUnits={setUnits}
          />


        <BoardCanvas
          activeProject={activeProject}
          units={units}
          language={language}
          selectedInstanceId={selectedInstanceId}
          setSelectedInstanceId={setSelectedInstanceId}
          selectedBoardInstanceId={selectedBoardInstanceId}
          setSelectedBoardInstanceId={setSelectedBoardInstanceId}
          displaySizes={displaySizes}
          handleSizeUpdate={handleSizeUpdate}
          updateActiveProject={updateActiveProject}
          closeSearchMenus={closeSearchMenus}
          setContactOpen={setContactOpen}
          BACKGROUNDS={BACKGROUNDS}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
        />
       </div>
      </div>
    </div>
  );
}
