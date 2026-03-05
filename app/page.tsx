"use client";

import React, { useEffect, useState } from "react";

import Sidebar from "@/components/Sidebar";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";
import SettingsPanel from "@/components/SettingsPanel";
import { useLibrary } from "@/hooks/useLibrary";
import type { AnyRow, BoardItem, Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";
import { Settings, Plus, Minus, RotateCw, Trash2 } from "lucide-react";
import { useRef } from "react";

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
  zoom: 100,
  boardPedals: [],
  selectedBoards: [],
});


export default function PedalBoardApp() {
  const desktopCanvasRef = useRef<HTMLDivElement | null>(null);
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
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
const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      stageX: 0,
      stageY: 0,
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
  const { x, y } = center;

  const newPedal: BoardItem = {
    ...pedal,
    instanceId: Date.now(),
    x,
    y,
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
  const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
const { x, y } = center;

  const newBoard: BoardItem = {
    ...board,
    instanceId: Date.now(),
    x,
    y,
    rotation: 0,
  };

  updateActiveProject({
    selectedBoards: [...activeProject.selectedBoards, newBoard],
  });

  closeSearchMenus();
};

const addCustomItem = (item: AnyRow) => {
  if (!customType) return;

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

  // ✅ Centre réel du canvas
  const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
const { x, y } = center;

  const instanceId = Date.now();

  const newItem: BoardItem = {
    id: instanceId,
    instanceId,
    slug: "custom",
    type: "Custom",
    circuit: "",
    bypass: "",
    power: "",
    status: "Active",
    origin: "",
    year: "",
    manual: "",

    name: "Custom",
    brand: "Custom",
    width: widthMm,
    depth: depthMm,
    image:
      customType === "pedal"
        ? "/images/custom-pedal.png"
        : "/images/custom-board.png",

    x,
    y,
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
    className="bg-zinc-950 text-[#f5f5f7] font-sans select-none overflow-hidden h-screen"
    onClick={closeSearchMenus}
  >
    <div className="h-full w-full">

      {/* ================= DESKTOP ≥1024 ================= */}
      <div className="hidden lg:flex h-full">

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
    language={language}
    settingsOpen={settingsOpen}
    setSettingsOpen={setSettingsOpen}
  />

  <div className="flex-1 relative overflow-hidden">
    <BoardCanvas
    key={activeProject.id}
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
      showIntro={isFirstBoard && isBoardEmpty}
      isMobile={isMobileDevice}
      rotatePedal={rotatePedal}
      deletePedal={deletePedal}
      rotateBoard={rotateBoard}
      deleteBoard={deleteBoard}
      onStageSizeChange={setCanvasSize}
      getCenterRef={getCenterRef}
    />
  </div>
</div>
</div>

      {/* ================= MOBILE <1024 ================= */}
      <div className="flex lg:hidden flex-col h-full relative">

        {/* HEADER MOBILE */}
        <div
          className="bg-zinc-950 flex items-center justify-between px-4 border-b border-zinc-800"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            height: "calc(48px + env(safe-area-inset-top))",
          }}
        >
          <span className="text-base font-bold tracking-widest">
            MAKE YOUR BOARD
          </span>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center w-12 h-12 text-white"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* CANVAS MOBILE */}
        <div
  ref={mobileCanvasRef}
  className="flex-1 relative bg-[#323234] overflow-hidden"
>
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
            showIntro={isFirstBoard && isBoardEmpty}
            rotatePedal={rotatePedal}
            deletePedal={deletePedal}
            rotateBoard={rotateBoard}
            deleteBoard={deleteBoard}
            isMobile
            mobileSidebarOpen={mobileSidebarOpen}
            getCenterRef={getCenterRef}
          />
        </div>

       {/* ================= MOBILE ACTION BUTTONS ================= */}

{/* FLOATING ADD / CLOSE BUTTON */}
<button
  onClick={() => setMobileSidebarOpen((prev) => !prev)}
  className="
    absolute
    bottom-6
    left-1/2
    -translate-x-1/2
    z-50
    w-12
    h-12
    rounded-full
    bg-blue-500
    flex
    items-center
    justify-center
    shadow-2xl
    active:scale-95
    transition
  "
>
  {mobileSidebarOpen ? (
    <Minus size={28} className="text-white" />
  ) : (
    <Plus size={28} className="text-white" />
  )}
</button>

        {/* MOBILE SIDEBAR DRAWER */}
        <div
          className={`absolute inset-0 z-40 transition-opacity duration-300 ${
            mobileSidebarOpen
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
              className="relative bg-zinc-950 h-full w-full shadow-2xl flex flex-col"
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* HEADER DRAWER MOBILE */}
<div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">

  <h2 className="text-[16px] font-black uppercase tracking-wider text-white">
  {contactOpen ? t("contact.title") : t("sidebar.addItem")}
</h2>

  <button
    onClick={() => {
      if (contactOpen) {
        setContactOpen(false);
      } else {
        setMobileSidebarOpen(false);
      }
    }}
    className="text-white text-xl leading-none active:scale-95 transition"
  >
    ✕
  </button>
</div>

              {/* CONTENT */}
              <div className="flex-1 overflow-y-auto px-6 pb-24">
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
                  selectedPedal={undefined}
                  selectedBoardDetails={undefined}
                  selectedInstanceId={null}
                  selectedBoardInstanceId={null}
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

    {/* SETTINGS DRAWER */}
{settingsOpen && (
  <>
    {/* ================= DESKTOP ================= */}
    <div className="hidden lg:flex fixed inset-0 z-[200]">
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={() => setSettingsOpen(false)}
      />
      <div className="w-[85%] max-w-[420px] bg-zinc-950 border-l border-zinc-800 p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[16px] font-black uppercase tracking-wider text-white">
            {t("settings.title")}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            ✕
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

          <button
            onClick={() => setSettingsOpen(false)}
            className="text-white text-xl leading-none active:scale-95 transition"
          >
            ✕
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
          />
        </div>
      </div>
    </div>
  </>
)}

  </div>
);
}
