"use client";

import React, { useEffect, useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import BoardCanvas from "@/components/BoardCanvas";
import SettingsPanel from "@/components/SettingsPanel";
import { useLibrary } from "@/hooks/useLibrary";
import type { AnyRow, BoardItem, Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";
import { Settings, Plus, Minus, RotateCw, X, Trash2 } from "lucide-react";
import { useRef } from "react";
import MobileHeader from "@/components/mobile/MobileHeader";

type Units = "metric" | "imperial";
const LANGUAGE_TO_LOCALE: Record<string, "en" | "fr" | "es" | "de" | "it" | "pt" | "zh"> = {
  English: "en",
  French: "fr",
  Spanish: "es",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Chinese: "zh",
};


const MAX_PROJECTS = 5;
const STORAGE_KEY = "guitar-sandbox-data";
const SETTINGS_STORAGE_KEY = "myb_settings";


const DEFAULT_WORKING_BOARD: Project = {
  id: -1,
  name: "WORKING",
  zoom: 200,
  stageX: 0,
  stageY: 0,
  boardPedals: [],
  selectedBoards: [],
};

// 👉 updates “compatibles BoardCanvas”
type ActiveProjectUpdates = Partial<{
  zoom: number;
  stageX: number;
  stageY: number;
  boardPedals: AnyRow[];
  selectedBoards: AnyRow[];
}>;

const createEmptyProject = (index: number): Project => ({
  id: Date.now() + index,
  name: `Pedalboard ${index}`,
  zoom: 200,
  boardPedals: [],
  selectedBoards: [],
});


export default function PedalBoardAppClient() {
  const desktopCanvasRef = useRef<HTMLDivElement | null>(null);
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const { pedalsLibrary, boardsLibrary, powerLibrary } = useLibrary();




const [projects, setProjects] = useState<Project[]>([]);
const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
const [workingBoard, setWorkingBoard] = useState<Project>(DEFAULT_WORKING_BOARD);
const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
const [tempName, setTempName] = useState<string>("");
const [canvasBg, setCanvasBg] = useState<string>("neutral");

const BACKGROUNDS = React.useMemo(() => [
  {
    id: "neutral",
    label: "Neutral",
    type: "css" as const,
  },
  {
    id: "wood",
    label: "Wood",
    type: "image" as const,
    thumbSrc: "/backgrounds/wood-thumb.webp",
  },
  {
    id: "steel",
    label: "Steel",
    type: "image" as const,
    thumbSrc: "/backgrounds/steel-thumb.webp",
  },
], []);

const selectedBackgroundSrc =
  canvasBg === "wood"
    ? "/backgrounds/wood-full.webp"
    : canvasBg === "steel"
      ? "/backgrounds/steel-full.webp"
      : undefined;

const [language, setLanguage] = useState<Language>("en");
const t = getTranslator(language);
const [units, setUnits] = useState<Units>("metric");
const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
const [specsOpen, setSpecsOpen] = useState(false);
const [settingsOpen, setSettingsOpen] = useState(false);
const [canvasSize, setCanvasSize] = useState({
  width: 0,
  height: 0,
});

const getCenterRef = useRef<(() => { x: number; y: number }) | null>(null);


/* ================= SETTINGS LOAD ================= */
useEffect(() => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (parsed.canvasBg) setCanvasBg(parsed.canvasBg);

if (parsed.language) {
  const allowed: Language[] = ["en", "fr", "es", "de", "it", "pt", "zh"];

  const normalizedLanguage = String(parsed.language)
    .replace("Chinese", "zh")
    .replace("中文", "zh") as Language;

  if (allowed.includes(normalizedLanguage)) {
    setLanguage(normalizedLanguage);
  }
}

      if (parsed.units) setUnits(parsed.units);
    }

    // ✅ THEME (AJOUT)
const savedTheme = localStorage.getItem("theme");

// ✅ DEFAULT = LIGHT
if (!savedTheme || savedTheme === "light") {
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
}

  } catch {
    // storage corrompu → on ignore
  }
}, []);

/* ================= SETTINGS SAVE ================= */
useEffect(() => {
  const data = {
    canvasBg,
    language,
    units,
  };

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
}, [canvasBg, language, units]);


/* ================= FORCE CLOSE MOBILE DRAWER ON DESKTOP ================= */
useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth >= 1024) {
      setMobileSidebarOpen(false);
    }
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);



  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] = useState<number | null>(null);

  const [pedalSearch, setPedalSearch] = useState<string>("");
  const [boardSearch, setBoardSearch] = useState<string>("");

  const [showPedalResults, setShowPedalResults] = useState<boolean>(false);
  const [showBoardResults, setShowBoardResults] = useState<boolean>(false);
  const [lastSelectedPedal, setLastSelectedPedal] = useState<AnyRow | null>(null);
  const [lastSelectedPower, setLastSelectedPower] = useState<AnyRow | null>(null);
  const [lastSelectedBoard, setLastSelectedBoard] = useState<AnyRow | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const [displaySizes, setDisplaySizes] = useState<Record<number, { w: number; h: number }>>({});
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

useEffect(() => {
  if (!hydrated) return;

  if (projects.length === 0) {
    const firstProject: Project = {
      id: Date.now(),
      name: "Pedalboard 1",
      zoom: 200,
      stageX: 0,
      stageY: 0,
      boardPedals: [],
      selectedBoards: [],
    };

    setProjects([firstProject]);
    setActiveProjectId(firstProject.id);
  }
}, [projects.length, hydrated]);


  // Custom item
  const [customName, setCustomName] = useState<string>("");
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customDepth, setCustomDepth] = useState<string>("");
  const [customColor, setCustomColor] = useState<string>("");
  const [makeOpen, setMakeOpen] = useState(true);


  const [customType, setCustomType] = useState<"pedal" | "board" | null>("pedal");



  /**
   * Active project (toujours un Project valide)
   */
  const activeProject: Project = projects.find((p) => p.id === activeProjectId) ?? workingBoard;
  const isFirstBoard = projects.findIndex(p => p.id === activeProjectId) === 0;

  const isBoardEmpty =
  activeProject?.boardPedals?.length === 0 &&
  activeProject?.selectedBoards?.length === 0;

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
    const normalized: Partial<Project> = {
  ...(typeof updates.zoom === "number" ? { zoom: updates.zoom } : {}),
  ...(typeof updates.stageX === "number" ? { stageX: updates.stageX } : {}),
  ...(typeof updates.stageY === "number" ? { stageY: updates.stageY } : {}),
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

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        const parsedProjects = (parsed.projects ?? []) as any[];

const safeProjects: Project[] = parsedProjects.map((p: any, i: number) => ({
  id: typeof p.id === "number" ? p.id : Date.now() + i,
  name: typeof p.name === "string" ? p.name : `Pedalboard ${i + 1}`,
  zoom: typeof p.zoom === "number" ? p.zoom : 100,
  stageX: typeof p.stageX === "number" ? p.stageX : 0,
  stageY: typeof p.stageY === "number" ? p.stageY : 0,
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
  const check = () => {
    setIsMobileDevice(window.innerWidth < 768);
  };

  check();
  window.addEventListener("resize", check);
  return () => window.removeEventListener("resize", check);
}, []);

  //Save localStorage
   
 useEffect(() => {
  if (!hydrated) return;

  const dataToSave = JSON.stringify({
    projects,
    activeProjectId,
    workingBoard,
  });

  localStorage.setItem(STORAGE_KEY, dataToSave);

}, [
  hydrated,
  activeProjectId,
  projects,
  workingBoard
]);

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
      zoom: 200,
      stageX: 0,
      stageY: 0,
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
const center = getCenterRef.current?.() ?? { x: 0, y: 0 };

let newX = center.x;
let newY = center.y;

// 🔥 CONFIG
const STEP = 40;
const MIN_DISTANCE = 80;

// 🔥 OFFSETS SPIRALE
let xOffset = 0;
let yOffset = 0;

// 🔥 CONTROLE SPIRALE
let directionIndex = 0; // 0=right,1=down,2=left,3=up
let stepsInCurrentDir = 0;
let stepsLimit = 1;
let totalSteps = 0;

let isOccupied = true;

while (isOccupied && totalSteps < 200) {

  isOccupied = activeProject.boardPedals.some((p) => {
    const dx = p.x - (center.x + xOffset);
    const dy = p.y - (center.y + yOffset);

    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < MIN_DISTANCE;
  });

  if (!isOccupied) break;

  // 👉 mouvement dans la direction
  if (directionIndex === 0) xOffset += STEP; // droite
  if (directionIndex === 1) yOffset += STEP; // bas
  if (directionIndex === 2) xOffset -= STEP; // gauche
  if (directionIndex === 3) yOffset -= STEP; // haut

  stepsInCurrentDir++;
  totalSteps++;

  // 👉 changement direction
  if (stepsInCurrentDir === stepsLimit) {
    stepsInCurrentDir = 0;
    directionIndex = (directionIndex + 1) % 4;

    // 👉 agrandir spirale tous les 2 côtés
    if (directionIndex === 0 || directionIndex === 2) {
      stepsLimit++;
    }
  }
}

newX = center.x + xOffset;
newY = center.y + yOffset;

  const now = Date.now();

const newPedal: BoardItem = {
    ...pedal,
    instanceId: now,
zIndex: now,
x: newX,
y: newY,
    rotation: 0,
    draw: Number(pedal.draw) || 0,
    weight: Number(pedal.weight) || 0,
  };

  updateActiveProject({
    boardPedals: [...activeProject.boardPedals, newPedal],
  });

  setLastSelectedPedal(pedal);

  closeSearchMenus();
};

  

  const selectBoard = (board: AnyRow) => {
  const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
  const { x, y } = center;

const now = Date.now();

const newBoard: BoardItem = {
  ...board,
  instanceId: now,
  x,
  y,
  rotation: 0,
  zIndex: -9999,
};

  updateActiveProject({
    selectedBoards: [...activeProject.selectedBoards, newBoard],
  });

  setLastSelectedBoard(board);
  setSelectedBoardInstanceId(null);

  closeSearchMenus();
};

const addCustomItem = (item: AnyRow = {}) => {
  const isUploadedImage = item?.slug === "custom-upload";
  const itemType = isUploadedImage ? "pedal" : customType;

  if (!itemType) return;

  const widthMm =
    item?.width ??
    (units === "metric"
      ? Number(customWidth)
      : Number(customWidth) * 25.4);

  const depthMm =
    item?.depth ??
    (units === "metric"
      ? Number(customDepth)
      : Number(customDepth) * 25.4);

  if (itemType === "pedal") {
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

  if (itemType === "board") {
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

  const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
  const instanceId = Date.now();

  const newItem: BoardItem = {
    id: instanceId,
    instanceId,

    ...item,

    slug: item?.slug || (isUploadedImage ? "custom-upload" : "custom"),
    type: item?.type || (itemType === "pedal" ? "Custom" : "board"),
    brand: item?.brand || "Custom",
    name: item?.name?.trim() || customName.trim() || "Custom",

    width: widthMm,
    depth: depthMm,

imageId: item?.imageId || null,

image:
  item?.imageId
    ? ""
    : item?.image ||
      item?.image_url ||
      item?.photo ||
      (itemType === "pedal"
        ? "/images/custom-pedal.webp"
        : "/images/custom-board.webp"),

image_url:
  item?.imageId
    ? ""
    : item?.image_url ||
      item?.image ||
      item?.photo ||
      undefined,

photo:
  item?.imageId
    ? ""
    : item?.photo ||
      item?.image ||
      item?.image_url ||
      undefined,

    color:
      itemType === "pedal"
        ? item?.color || customColor || undefined
        : "",

    circuit: item?.circuit || "",
    bypass: item?.bypass || "",
    power: item?.power || "",
    status: item?.status || "Active",
    origin: item?.origin || "",
    year: item?.year || "",
    manual: item?.manual || "",

    voltage: Number(item?.voltage) || 9,
    draw: Number(item?.draw) || 0,
    weight: Number(item?.weight) || 0,

    x: center.x,
    y: center.y,
    rotation: 0,
    zIndex: instanceId,
  };

  if (itemType === "pedal") {
    updateActiveProject({
      boardPedals: [...activeProject.boardPedals, newItem],
    });
  } else {
    updateActiveProject({
      selectedBoards: [...activeProject.selectedBoards, newItem],
    });
  }

  setCustomName("");
};

  const rotatePedal = (id: number) => {
    updateActiveProject({
      boardPedals: activeProject.boardPedals.map((p) =>
        p.instanceId === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      ),
    });
  };

const movePedalFront = (id: number) => {
  const allItems = [
    ...activeProject.boardPedals,
    ...(activeProject.selectedBoards || []),
  ];

  const maxZ = Math.max(
    0,
    ...allItems.map((item) => Number(item.zIndex) || 0)
  );

  updateActiveProject({
    boardPedals: activeProject.boardPedals.map((p) =>
      p.instanceId === id
        ? { ...p, zIndex: maxZ + 1 }
        : p
    ),
  });
};

const movePedalBack = (id: number) => {
  const allItems = [
    ...activeProject.boardPedals,
    ...(activeProject.selectedBoards || []),
  ];

  const minZ = Math.min(
    0,
    ...allItems.map((item) => Number(item.zIndex) || 0)
  );

  updateActiveProject({
    boardPedals: activeProject.boardPedals.map((p) =>
      p.instanceId === id
        ? { ...p, zIndex: minZ - 1 }
        : p
    ),
  });
};

  const deletePedal = (id: number) => {
    updateActiveProject({
      boardPedals: activeProject.boardPedals.filter((p) => p.instanceId !== id),
    });
    setSelectedInstanceId(null);
  };

  const moveBoardFront = (id: number) => {
  const maxZ = Math.max(
    0,
    ...activeProject.boardPedals.map((p) => Number(p.zIndex) || 0),
    ...(activeProject.selectedBoards || []).map((b) => Number(b.zIndex) || 0)
  );

  updateActiveProject({
    selectedBoards: (activeProject.selectedBoards || []).map((b) =>
      b.instanceId === id ? { ...b, zIndex: maxZ + 1 } : b
    ),
  });
};

const moveBoardBack = (id: number) => {
  const minZ = Math.min(
    0,
    ...activeProject.boardPedals.map((p) => Number(p.zIndex) || 0),
    ...(activeProject.selectedBoards || []).map((b) => Number(b.zIndex) || 0)
  );

  updateActiveProject({
    selectedBoards: (activeProject.selectedBoards || []).map((b) =>
      b.instanceId === id ? { ...b, zIndex: minZ - 1 } : b
    ),
  });
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
  className="bg-[var(--background)] text-[var(--foreground)] font-sans select-none overflow-hidden h-screen"
  onClick={closeSearchMenus}
  >

    <div className="h-full w-full">

{/* ================= DESKTOP ≥1024 ================= */}
<div className="hidden lg:flex h-full">

  <div className="flex flex-1 min-h-0">

    <Sidebar
      pedalsLibrary={pedalsLibrary}
      boardsLibrary={boardsLibrary}
      powerLibrary={powerLibrary}
      setLastSelectedPedal={setLastSelectedPedal}
      lastSelectedPower={lastSelectedPower}
      setLastSelectedPower={setLastSelectedPower}
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
      lastSelectedPedal={lastSelectedPedal}
      lastSelectedBoard={lastSelectedBoard}
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
      movePedalFront={movePedalFront}
      movePedalBack={movePedalBack}
      moveBoardFront={moveBoardFront}
      moveBoardBack={moveBoardBack}
      deletePedal={deletePedal}
      rotateBoard={rotateBoard}
      deleteBoard={deleteBoard}
      canvasBg={canvasBg}
      setCanvasBg={setCanvasBg}
      language={language}
      setLanguage={setLanguage}
      units={units}
      setUnits={setUnits}
      customType={customType}
      setCustomType={setCustomType}
      makeOpen={makeOpen}
      setMakeOpen={setMakeOpen}
      contactOpen={contactOpen}
      setContactOpen={setContactOpen}
    />

    <div
      ref={desktopCanvasRef}
      className="flex-1 min-w-0 bg-[#323234] flex flex-col overflow-hidden"
    >
      <div className="flex-1 relative overflow-hidden">
        <BoardCanvas
          key={activeProject.id}
          activeProject={activeProject}
          units={units}
          language={language}
          setMobileSidebarOpen={setMobileSidebarOpen}
          setSpecsOpen={setSpecsOpen}
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
          selectedBackgroundSrc={selectedBackgroundSrc}
          setCanvasBg={setCanvasBg}
          showIntro={isFirstBoard && isBoardEmpty}
          isMobile={isMobileDevice}
          rotatePedal={rotatePedal}
          deletePedal={deletePedal}
          movePedalFront={movePedalFront}
          movePedalBack={movePedalBack} 
          rotateBoard={rotateBoard}
          deleteBoard={deleteBoard}
          onStageSizeChange={setCanvasSize}
          getCenterRef={getCenterRef}
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          createNewProject={createNewProject}
          deleteProject={deleteProject}
          startEditing={startEditing}
          editingProjectId={editingProjectId}
          tempName={tempName}
          setTempName={setTempName}
          saveName={saveName}
          setSettingsOpen={setSettingsOpen}
          setLanguage={setLanguage}
          setUnits={setUnits}
          
        />
      </div>
    </div>

  </div>

</div>

      {/* ================= MOBILE <1024 ================= */}
      <div className="flex lg:hidden flex-col h-full relative">

        {/* HEADER MOBILE */}
<MobileHeader
  t={t}
  mobileSidebarOpen={mobileSidebarOpen}
  setMobileSidebarOpen={setMobileSidebarOpen}
  setSelectedInstanceId={setSelectedInstanceId}
  setSelectedBoardInstanceId={setSelectedBoardInstanceId}
/>

        {/* CANVAS MOBILE */}
        <div
  ref={mobileCanvasRef}
  className="flex-1 relative bg-[#323234] overflow-hidden"
>
          <BoardCanvas
            activeProject={activeProject}
            units={units}
            language={language}
            setMobileSidebarOpen={setMobileSidebarOpen}
            setSpecsOpen={setSpecsOpen}
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
            selectedBackgroundSrc={selectedBackgroundSrc}
            setCanvasBg={setCanvasBg}
            showIntro={isFirstBoard && isBoardEmpty}
            rotatePedal={rotatePedal}
            deletePedal={deletePedal}
            movePedalFront={movePedalFront}
            movePedalBack={movePedalBack}
            rotateBoard={rotateBoard}
            deleteBoard={deleteBoard}
            isMobile
            mobileSidebarOpen={mobileSidebarOpen}
            getCenterRef={getCenterRef}
            projects={projects}
            activeProjectId={activeProjectId}
            setActiveProjectId={setActiveProjectId}
            createNewProject={createNewProject}
            setSettingsOpen={setSettingsOpen}
            setLanguage={setLanguage}
            setUnits={setUnits}
          />
        </div>



        {/* MOBILE SIDEBAR DRAWER */}
        <div
className={`absolute top-[calc(64px+env(safe-area-inset-top))] left-0 right-0 bottom-0 z-40 transition-opacity duration-300 ${            mobileSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className={`absolute inset-0 w-full transition-transform duration-300 ${
              mobileSidebarOpen ? "translate-y-0" : "translate-y-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative bg-zinc-800 h-full w-full shadow-2xl flex flex-col"
              style={{
  paddingBottom: "env(safe-area-inset-bottom)",
}}
            >


              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto px-2 pt-2 pb-2">

                <Sidebar
                  pedalsLibrary={pedalsLibrary}
                  boardsLibrary={boardsLibrary}
                  powerLibrary={powerLibrary}
                  setLastSelectedPedal={setLastSelectedPedal}
                  lastSelectedPower={lastSelectedPower}
                  setLastSelectedPower={setLastSelectedPower}
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
                  lastSelectedPedal={lastSelectedPedal}
                  lastSelectedBoard={lastSelectedBoard}
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
                  
                
                  addPedal={(p) => {
                    addPedal(p);
                    setMobileSidebarOpen(false);
                  }}
                  selectBoard={(b) => {
                    selectBoard(b);
                    setMobileSidebarOpen(false);
                  }}
                  addCustomItem={(item) => {
                    addCustomItem(item);
                    setMobileSidebarOpen(false);
                  }}
                  rotatePedal={rotatePedal}
                  movePedalFront={movePedalFront}
                  movePedalBack={movePedalBack}
                  moveBoardFront={moveBoardFront}
                  moveBoardBack={moveBoardBack}
                  deletePedal={deletePedal}
                  rotateBoard={rotateBoard}
                  deleteBoard={deleteBoard}
                  canvasBg={canvasBg}
                  setCanvasBg={setCanvasBg}
                  language={language}
                  setLanguage={setLanguage}
                  units={units}
                  setUnits={setUnits}
                  customType={customType}
                  setCustomType={setCustomType}
                  makeOpen={makeOpen}
                  setMakeOpen={setMakeOpen}
                  contactOpen={contactOpen}
                  setContactOpen={setContactOpen}
                  hideLogo
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {specsOpen && (
  <div className="fixed inset-0 z-[300]">

    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={() => setSpecsOpen(false)}
    />

    <div className="absolute inset-0 bg-zinc-950 flex flex-col">

      {/* HEADER */}
      <div
        className="flex items-center justify-between px-6"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          height: "calc(60px + env(safe-area-inset-top))",
        }}
      >
        <h2 className="text-[18px] font-black uppercase tracking-wider">
          MAKE YOUR BOARD
        </h2>

        <button
          onClick={() => setSpecsOpen(false)}
          className="text-white text-xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">

        <Sidebar
  pedalsLibrary={pedalsLibrary}
  boardsLibrary={boardsLibrary}
  powerLibrary={powerLibrary}
  setLastSelectedPedal={setLastSelectedPedal}
  lastSelectedPower={lastSelectedPower}
  setLastSelectedPower={setLastSelectedPower}
  showPedalResults={false}
  setShowPedalResults={() => {}}
  showBoardResults={false}
  setShowBoardResults={() => {}}
  pedalSearch=""
  setPedalSearch={() => {}}
  boardSearch=""
  setBoardSearch={() => {}}
  selectedPedal={selectedPedal}
  selectedBoardDetails={selectedBoardDetails}
  lastSelectedPedal={lastSelectedPedal}
  lastSelectedBoard={lastSelectedBoard}
  selectedInstanceId={selectedInstanceId}
  selectedBoardInstanceId={null}
  setSelectedInstanceId={() => {}}
  setSelectedBoardInstanceId={() => {}}

  customName=""
  setCustomName={() => {}}

  customWidth=""
  setCustomWidth={() => {}}

  customDepth=""
  setCustomDepth={() => {}}

  customColor="#000"
  setCustomColor={() => {}}

  addPedal={() => {}}
  selectBoard={() => {}}
  addCustomItem={() => {}}

  rotatePedal={rotatePedal}
  movePedalFront={movePedalFront}
  movePedalBack={movePedalBack}
  moveBoardFront={moveBoardFront}
  moveBoardBack={moveBoardBack}
  deletePedal={deletePedal}

  rotateBoard={rotateBoard}
  deleteBoard={deleteBoard}

  canvasBg={canvasBg}
  setCanvasBg={setCanvasBg}

  language={language}
  setLanguage={setLanguage}

  units={units}
  setUnits={setUnits}

  customType={null}
  setCustomType={() => {}}

  makeOpen={false}
  setMakeOpen={() => {}}

  contactOpen={false}
  setContactOpen={() => {}}

  hideLogo
/>

      </div>

    </div>
  </div>
)}

    {/* SETTINGS DRAWER */}
{settingsOpen && (
  <>
    {/* ================= DESKTOP ================= */}
    <div className="hidden lg:flex fixed inset-0 z-[200]">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />
      <div className="w-[85%] max-w-[420px] bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[16px] font-black uppercase tracking-wider text-white">
            {t("settings.title")}
          </h2>
          <button onClick={() => setSettingsOpen(false)} className="p-1">
  <X
    size={18}
    style={{ color: "#71717a", cursor: "pointer" }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
  />
</button>
        </div>

        <SettingsPanel
          t={t}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
          language={language}
          setLanguage={setLanguage}
          units={units}
          setUnits={setUnits}
          backgrounds={BACKGROUNDS}
          setContactOpen={setContactOpen}
        />
      </div>
    </div>

    {/* ================= MOBILE ================= */}
    <div className="lg:hidden fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="absolute inset-0 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-6"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(60px + env(safe-area-inset-top))",
          }}
        >
          <h2 className="text-[18px] font-black uppercase tracking-wider">
            {t("settings.title")}
          </h2>

          <button onClick={() => setSettingsOpen(false)} className="p-1">
  <X
    size={18}
    style={{ color: "#71717a", cursor: "pointer" }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
  />
</button>
        </div>

        {/* CONTENT */}
        <div
          className="flex-1 overflow-y-auto p-6"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <SettingsPanel
            t={t}
            canvasBg={canvasBg}
            setCanvasBg={setCanvasBg}
            language={language}
            setLanguage={setLanguage}
            units={units}
            setUnits={setUnits}
            backgrounds={BACKGROUNDS}
            setContactOpen={setContactOpen}
          />
        </div>
      </div>
    </div>
  </>
)}

  </div>
);
}
