"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";

import Sidebar from "@/components/sidebar/Sidebar";
import SidebarFilter from "@/components/sidebar/SidebarFilter";
import BoardCanvas from "@/components/BoardCanvas";
import { resolveCustomPedalLayout } from "@/utils/customPedalLayout";
import SettingsMenu from "@/components/SettingsMenu";
import { Plus, Minus } from "lucide-react";
import { useLibrary } from "@/hooks/useLibrary";
import type { AnyRow, BoardItem, Project } from "@/types/project";
import { getTranslator, type Language } from "@/utils/i18n";
import { useRef } from "react";
import SidebarLogo from "@/components/sidebar/SidebarLogo";
import CatalogBanner from "@/components/CatalogBanner";
import OnboardingTour from "@/components/OnboardingTour";
import GearCatalog from "@/components/sidebar/GearCatalog";
import { splitTags } from "@/components/sidebar/SpecsPedals";
import CustomPanel from "@/components/sidebar/CustomPanel";
import { mmToIn } from "@/utils/units";
import pedalActions from "./PedalActions.module.css";


import {
  checkReplacementFit,
  getFinderLayout,
  getBoardFitMode,
  getCanvasBoardFit,
  isPowerSupply,
} from "@/utils/boardFinder";


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


const MAX_PROJECTS = 7;
const DESKTOP_SIDEBAR_WIDTH = 450;
const STORAGE_KEY = "guitar-sandbox-data";
const SETTINGS_STORAGE_KEY = "myb_settings";
const SHARED_IMPORT_KEY = "myb_shared_board_import";


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

type BoardEditorProps = {
  initialCountry?: string;
};

const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  // Français
  FR: "fr",
  MC: "fr",

  // Espagnol
  ES: "es",
  AR: "es",
  MX: "es",
  CL: "es",
  CO: "es",
  PE: "es",
  VE: "es",
  UY: "es",
  PY: "es",
  BO: "es",
  EC: "es",
  CR: "es",
  PA: "es",
  GT: "es",
  HN: "es",
  SV: "es",
  NI: "es",
  DO: "es",
  CU: "es",

  // Allemand
  DE: "de",
  AT: "de",
  LI: "de",

  // Italien
  IT: "it",
  SM: "it",
  VA: "it",

  // Portugais
  PT: "pt",
  BR: "pt",
  AO: "pt",
  MZ: "pt",

  // Chinois
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
};

function getLanguageFromCountry(country?: string): Language {
  if (!country) return "en";

  return COUNTRY_TO_LANGUAGE[country.toUpperCase()] || "en";
}

function getUnitsFromCountry(country?: string): Units {
  if (!country) return "metric";

  return country.toUpperCase() === "US"
    ? "imperial"
    : "metric";
}


export default function BoardEditor({
  initialCountry,
}: BoardEditorProps) {
  const desktopCanvasRef = useRef<HTMLDivElement | null>(null);
  const mobileCanvasRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    pedalsLibrary,
    boardsLibrary,
    powerLibrary,
    boardsStatus,
    powerStatus,
    newPedals,
    newBoards,
    newPower,
    newGearLoading,
    newPedalsLoading,
    loading: libraryLoading,
    libraryError,
  } = useLibrary();

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
      src: "/backgrounds/wood-full.webp",
    },
    {
      id: "steel",
      label: "Steel",
      type: "image" as const,
      thumbSrc: "/backgrounds/steel-thumb.webp",
      src: "/backgrounds/steel-full.webp",
    },
  ], []);

  const selectedBackgroundSrc =
    canvasBg === "wood"
      ? "/backgrounds/wood-full.webp"
      : canvasBg === "steel"
        ? "/backgrounds/steel-full.webp"
        : undefined;

  const [language, setLanguage] = useState<Language>(() =>
    getLanguageFromCountry(initialCountry)
  );

  const t = useMemo(() => getTranslator(language), [language]);
  const country =
    typeof window !== "undefined"
      ? (window as any).__MYB_COUNTRY__ || "FR"
      : "FR";

  const isUSA = country.toUpperCase() === "US";

  const isEurope = [
    "FR", "DE", "NL", "ES", "IT", "PT", "BE", "AT",
    "DK", "SE", "NO", "FI", "PL", "CZ", "SK",
    "HU", "RO", "BG", "HR", "SI", "EE", "LV",
    "LT", "LU", "IE", "GR",
  ].includes(country.toUpperCase());

  const buildThomannUrl = (slug: string) => {
    const domains: Record<string, string> = {
      FR: "thomann.fr",
      NL: "thomann.nl",
      DE: "thomann.de",
      ES: "thomann.es",
      IT: "thomann.it",
      PT: "thomann.pt",
    };

    const domain = domains[country.toUpperCase()] || "thomann.de";

    return `https://www.${domain}/${slug}`;
  };

  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [units, setUnits] = useState<Units>(() =>
    getUnitsFromCountry(initialCountry)
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [desktopInfoOpen, setDesktopInfoOpen] = useState(false);
  const [desktopRightPanelOpen, setDesktopRightPanelOpen] = useState(false);
  const [catalogSelectedPedal, setCatalogSelectedPedal] = useState<AnyRow | null>(null);
  const [catalogSelectedKind, setCatalogSelectedKind] = useState<"pedals" | "boards" | "power">("pedals");
  const [catalogRecommendationsHost, setCatalogRecommendationsHost] = useState<HTMLDivElement | null>(null);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);
  const [customCatalogOpen, setCustomCatalogOpen] = useState(false);
  const [mobileInfoPedal, setMobileInfoPedal] = useState<AnyRow | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const mobileDetailBackRef = useRef<(() => void) | null>(null);

  const [mobileCanvasPanelOpen, setMobileCanvasPanelOpen] = useState(false);

  const mobileCanvasPanelCloseRef =
    useRef<(() => void) | null>(null);

  const [specsOpen, setSpecsOpen] = useState(false);
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

        if (parsed.canvasBg) {
          setCanvasBg(parsed.canvasBg);
        }

        if (parsed.language) {
          const allowed: Language[] = [
            "en",
            "fr",
            "es",
            "de",
            "it",
            "pt",
            "zh",
          ];

          const normalizedLanguage = String(parsed.language)
            .replace("Chinese", "zh")
            .replace("中文", "zh") as Language;

          if (allowed.includes(normalizedLanguage)) {
            setLanguage(normalizedLanguage);
          }
        }

        if (parsed.units) {
          setUnits(parsed.units);
        }
      }

      // THEME : LIGHT PAR DÉFAUT
      const savedTheme = localStorage.getItem("theme");

      const initialTheme =
        savedTheme === "dark" ? "dark" : "light";

      document.documentElement.classList.toggle(
        "light",
        initialTheme === "light"
      );

      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark"
      );

      if (!savedTheme) {
        localStorage.setItem("theme", "light");
      }
    } catch {
      // storage corrompu → on ignore
    } finally {
      setSettingsLoaded(true);
    }
  }, []);


  /* ================= SETTINGS SAVE ================= */
  useEffect(() => {
    if (!settingsLoaded) return;

    const data = {
      canvasBg,
      language,
      units,
    };

    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(data)
    );
  }, [settingsLoaded, canvasBg, language, units]);


  /* ================= FORCE CLOSE MOBILE DRAWER ON DESKTOP ================= */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  const replacementDialogRef = useRef<HTMLDialogElement>(null);
  const [replacement, setReplacement] = useState<{
    projectId: number | null;
    targetId: number;
    candidate?: AnyRow;
  } | null>(null);
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

    const sharedImportPending =
      sessionStorage.getItem(SHARED_IMPORT_KEY);

    if (sharedImportPending) return;

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

  const customMinMm = customType === "board" ? 100 : 30;
  const customMaxMm = customType === "board" ? 1000 : 300;
  const customUnitLabel = units === "metric" ? "mm" : "in";
  const customMinValue = units === "metric" ? customMinMm : mmToIn(customMinMm);
  const customMaxValue = units === "metric" ? customMaxMm : mmToIn(customMaxMm);
  const customDisplayMin = units === "metric" ? customMinMm : Math.round(mmToIn(customMinMm) * 10) / 10;
  const customDisplayMax = units === "metric" ? customMaxMm : Math.round(mmToIn(customMaxMm) * 10) / 10;
  const customWidthMm = units === "metric" ? Number(customWidth) : Number(customWidth) * 25.4;
  const customDepthMm = units === "metric" ? Number(customDepth) : Number(customDepth) * 25.4;
  const customPedalValid = customWidthMm >= 30 && customWidthMm <= 300 && customDepthMm >= 30 && customDepthMm <= 300;
  const customBoardValid = customWidthMm >= 100 && customWidthMm <= 1000 && customDepthMm >= 100 && customDepthMm <= 1000;




  /**
   * Active project (toujours un Project valide)
   */


  /* ================= CONNECTORS SYNC ================= */

  const connectorsLibrary = useMemo(() => {
    const map = new Map<string, AnyRow>();

    pedalsLibrary.forEach(pedal => {
      if (pedal.id != null) {
        map.set(String(pedal.id), pedal);
      }
    });

    return map;
  }, [pedalsLibrary]);

  useEffect(() => {
    if (!hydrated || libraryLoading || libraryError) {
      return;
    }

    if (connectorsLibrary.size === 0) {
      return;
    }

    const syncProject = (project: Project): Project => {
      let changed = false;

      const boardPedals = project.boardPedals.map(pedal => {
        if (
          isPowerSupply(pedal) ||
          pedal.slug === "custom" ||
          pedal.slug === "custom-upload"
        ) {
          return pedal;
        }

        if (pedal.id == null) {
          return pedal;
        }

        const source = connectorsLibrary.get(
          String(pedal.id)
        );

        if (!source) {
          return pedal;
        }

        const connectors = source.connectors ?? null;

        const verified =
          source.connectors_verified === true;

        const sameConnectors =
          JSON.stringify(pedal.connectors ?? null) ===
          JSON.stringify(connectors);

        const sameVerified =
          (pedal.connectors_verified === true) ===
          verified;

        if (sameConnectors && sameVerified) {
          return pedal;
        }

        changed = true;

        return {
          ...pedal,
          connectors,
          connectors_verified: verified,
        };
      });

      return changed
        ? { ...project, boardPedals }
        : project;
    };

    setProjects(previous => {
      const next = previous.map(syncProject);

      return next.some(
        (project, index) => project !== previous[index]
      )
        ? next
        : previous;
    });

    setWorkingBoard(syncProject);

  }, [
    hydrated,
    libraryLoading,
    libraryError,
    connectorsLibrary,
    projects,
    workingBoard,
  ]);

  const activeProject: Project = projects.find((p) => p.id === activeProjectId) ?? workingBoard;
  const isFirstBoard = projects.findIndex(p => p.id === activeProjectId) === 0;

  const isBoardEmpty =
    activeProject?.boardPedals?.length === 0 &&
    activeProject?.selectedBoards?.length === 0;

  /**
   * Helpers
   */
  const [desktopToolbarHost, setDesktopToolbarHost] = useState<HTMLDivElement | null>(null);
  const [mobileToolbarHost, setMobileToolbarHost] = useState<HTMLDivElement | null>(null);

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

  /* ================= SHARED BOARD IMPORT ================= */
  useEffect(() => {
    if (!hydrated) return;

    const rawSharedImport =
      sessionStorage.getItem(SHARED_IMPORT_KEY);

    if (!rawSharedImport) return;

    try {
      const sharedImport = JSON.parse(rawSharedImport);

      const sharedProjectData =
        sharedImport?.data?.project;

      if (!sharedProjectData) {
        console.error("Invalid shared board data.");
        sessionStorage.removeItem(SHARED_IMPORT_KEY);
        return;
      }

      const sharedName =
        typeof sharedProjectData.name === "string" &&
          sharedProjectData.name.trim()
          ? sharedProjectData.name.trim()
          : typeof sharedImport.name === "string" &&
            sharedImport.name.trim()
            ? sharedImport.name.trim()
            : "Shared Pedalboard";

      const currentProject =
        projects.find((p) => p.id === activeProjectId) ?? null;

      const currentProjectHasContent =
        !!currentProject &&
        (
          currentProject.boardPedals.length > 0 ||
          currentProject.selectedBoards.length > 0
        );

      /*
        Si le projet actuel est vide, on le remplace directement.
        Sinon, on crée un nouveau projet local.
      */

      if (currentProject && !currentProjectHasContent) {
        const importedProject = {
          ...currentProject,

          name: sharedName,

          zoom:
            typeof sharedProjectData.zoom === "number"
              ? sharedProjectData.zoom
              : 200,

          stageX:
            typeof sharedProjectData.stageX === "number"
              ? sharedProjectData.stageX
              : 0,

          stageY:
            typeof sharedProjectData.stageY === "number"
              ? sharedProjectData.stageY
              : 0,

          boardPedals:
            Array.isArray(sharedProjectData.boardPedals)
              ? sharedProjectData.boardPedals
              : [],

          selectedBoards:
            Array.isArray(sharedProjectData.selectedBoards)
              ? sharedProjectData.selectedBoards
              : [],

          ...(Array.isArray(sharedProjectData.signalPath)
            ? { signalPath: sharedProjectData.signalPath }
            : {}),
        } as Project;

        setProjects((prev) =>
          prev.map((project) =>
            project.id === currentProject.id
              ? importedProject
              : project
          )
        );

        setActiveProjectId(currentProject.id);
      } else {
        /*
          Le projet actuel contient déjà du matériel :
          on ne touche à rien et on ajoute le board partagé.
        */

        if (projects.length >= MAX_PROJECTS) {
          alert(
            `You already have ${MAX_PROJECTS} pedalboards. Delete one before opening this shared board.`
          );
          return;
        }

        const newId = Date.now();

        const importedProject = {
          id: newId,
          name: sharedName,

          zoom:
            typeof sharedProjectData.zoom === "number"
              ? sharedProjectData.zoom
              : 200,

          stageX:
            typeof sharedProjectData.stageX === "number"
              ? sharedProjectData.stageX
              : 0,

          stageY:
            typeof sharedProjectData.stageY === "number"
              ? sharedProjectData.stageY
              : 0,

          boardPedals:
            Array.isArray(sharedProjectData.boardPedals)
              ? sharedProjectData.boardPedals
              : [],

          selectedBoards:
            Array.isArray(sharedProjectData.selectedBoards)
              ? sharedProjectData.selectedBoards
              : [],

          ...(Array.isArray(sharedProjectData.signalPath)
            ? { signalPath: sharedProjectData.signalPath }
            : {}),
        } as Project;

        setProjects((prev) => [
          ...prev,
          importedProject,
        ]);

        setActiveProjectId(newId);
      }

      /*
        Restaure les dimensions utilisées par le snapshot.
      */
      const sharedDisplaySizes =
        sharedImport?.data?.displaySizes;

      if (
        sharedDisplaySizes &&
        typeof sharedDisplaySizes === "object"
      ) {
        setDisplaySizes(sharedDisplaySizes);
      }

      /*
        Restaure le fond du board partagé.
      */
      const sharedCanvasBg =
        sharedImport?.data?.appearance?.canvasBg;

      if (
        typeof sharedCanvasBg === "string" &&
        BACKGROUNDS.some(
          (background) =>
            background.id === sharedCanvasBg
        )
      ) {
        setCanvasBg(sharedCanvasBg);
      }

      /*
        Important :
        le snapshot a maintenant été importé localement.
        On le retire pour éviter de l'importer une deuxième fois.
      */
      sessionStorage.removeItem(SHARED_IMPORT_KEY);

      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
    } catch (error) {
      console.error(
        "Unable to import shared board:",
        error
      );

      sessionStorage.removeItem(SHARED_IMPORT_KEY);
    }
  }, [hydrated]);

  useEffect(() => {
    const check = () => {
      setIsMobileDevice(window.innerWidth < 1024);
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
  // A catalog/recommendation choice is a product to inspect, not a canvas instance.
  // In the absence of such a choice, keep the canvas selection visible.
  const sidebarPedal = catalogSelectedPedal
    ? catalogSelectedKind === "boards" ? undefined : catalogSelectedKind === "power"
      ? { ...catalogSelectedPedal, type: "power" } : catalogSelectedPedal
    : selectedPedal;

  const handleCanvasPedalSelection = React.useCallback((id: number | null) => {
    setDesktopInfoOpen(false);
    setCatalogSelectedPedal(null);
    setSelectedInstanceId(id);
  }, []);
  const handleCanvasBoardSelection = React.useCallback((id: number | null) => {
    setDesktopInfoOpen(false);
    setCatalogSelectedPedal(null);
    setSelectedBoardInstanceId(id);
  }, []);
  const handleCatalogSelection = React.useCallback((item: AnyRow | null, kind: "pedals" | "boards" | "power" = "pedals") => {
    setCatalogSelectedKind(kind);
    setCatalogSelectedPedal(item);
    // Do not keep actions for an unrelated canvas instance visible.
    if (item) {
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
    }
  }, []);
  const handleFirstCatalogPedal = React.useCallback((pedal: AnyRow) => {
    handleCatalogSelection(pedal, "pedals");
  }, [handleCatalogSelection]);
  const replacementTarget = replacement && replacement.projectId === activeProjectId
    ? activeProject.boardPedals.find((pedal) => pedal.instanceId === replacement.targetId)
    : undefined;
  const replacementCandidate = replacementTarget ? replacement?.candidate : undefined;
  const replacementCatalog = useMemo(() =>
    replacementTarget && !replacementCandidate ? { pedal: replacementTarget } : undefined,
    [replacementTarget, replacementCandidate]);
  const replacementQuery = useMemo(() => {
    const tag = splitTags(replacementTarget?.type)[0];
    if (!tag || !replacementCatalog) return "";
    const key = `pedal.type.${tag}`;
    const label = t(key);
    return label && label !== key ? label : tag;
  }, [replacementTarget?.type, replacementCatalog, t]);

  useEffect(() => {
    if (replacement && !replacementTarget) setReplacement(null);
  }, [replacement, replacementTarget]);

  const replacementReview = useMemo(() => {
    if (!replacementTarget || !replacementCandidate) return undefined;
    const pedal = makeCatalogPedal(replacementCandidate, {
      instanceId: replacementTarget.instanceId,
      x: replacementTarget.x,
      y: replacementTarget.y,
      rotation: replacementTarget.rotation,
      zIndex: Number(replacementTarget.zIndex) || 0,
    });
    const items = activeProject.boardPedals;
    const fit = checkReplacementFit(replacementTarget, pedal, items, activeProject.selectedBoards);
    return { pedal, fit };
  }, [replacementTarget, replacementCandidate, activeProject.boardPedals, activeProject.selectedBoards]);

  const hasReplacementPreview = Boolean(replacementReview);
  useLayoutEffect(() => {
    if (!hasReplacementPreview) return;
    const dialog = replacementDialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [hasReplacementPreview]);

  const startReplacement = (id: number) => {
    const target = activeProject.boardPedals.find((pedal) => pedal.instanceId === id);
    if (!target || isPowerSupply(target)) return;
    setCatalogSelectedPedal(null);
    setSelectedInstanceId(id);
    setSelectedBoardInstanceId(null);
    setReplacement({ projectId: activeProjectId, targetId: id });
    setCustomCatalogOpen(false);
    closeSearchMenus();
    if (isMobileDevice) {
      setMobileSidebarOpen(false);
      setMobileInfoPedal(null);
      setMobileDetailOpen(false);
      setMobileCatalogOpen(true);
    } else {
      setCatalogOpen(true);
    }
  };

  const chooseReplacementCandidate = (item: AnyRow) => {
    if (!replacementTarget || !replacement || replacementCandidate) return;
    setReplacement({ ...replacement, candidate: item });
    setCatalogOpen(false);
    setMobileCatalogOpen(false);
    setMobileInfoPedal(null);
    setMobileDetailOpen(false);
    setCustomCatalogOpen(false);
    setCatalogSelectedPedal(null);
    setSelectedInstanceId(replacementTarget.instanceId);
    setSelectedBoardInstanceId(null);
  };

  const confirmReplacement = () => {
    if (!replacementReview || !replacementCandidate) return;
    const { pedal } = replacementReview;
    const replaceInProject = (project: Project) => ({
      ...project,
      boardPedals: project.boardPedals.map((item) => item.instanceId === pedal.instanceId ? {
        ...pedal,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        zIndex: item.zIndex,
      } : item),
    });
    if (activeProject === workingBoard) {
      setWorkingBoard(replaceInProject);
    } else {
      setProjects((current) => current.map((project) =>
        project.id === activeProject.id ? replaceInProject(project) : project));
    }
    handleSizeUpdate(pedal.instanceId, Number(replacementCandidate.width) || 80, Number(replacementCandidate.depth) || 120);
    setLastSelectedPedal(replacementCandidate);
    setSelectedInstanceId(pedal.instanceId);
    setSelectedBoardInstanceId(null);
    setReplacement(null);
  };

  const selectedBoardDetails = activeProject.selectedBoards.find(
    (b) => b.instanceId === selectedBoardInstanceId
  );


  const sidebarBoard = catalogSelectedPedal
    ? catalogSelectedKind === "boards" ? catalogSelectedPedal : undefined
    : selectedBoardDetails;

  const closeDesktopCatalog = () => {
    setCatalogOpen(false);
    setCatalogSelectedPedal(null);
    setCustomCatalogOpen(false);
    if (replacementCatalog) setReplacement(null);
  };

  const addCatalogItem = (kind: "pedals" | "boards" | "power", item: AnyRow, mobile = false) => {
    if (replacementCatalog) {
      if (kind === "pedals") chooseReplacementCandidate(item);
      return;
    }
    if (kind === "boards") {
      selectBoard(item);
    } else if (kind === "power") {
      const powerItem = { ...item, type: "power" };
      setLastSelectedPower(powerItem);
      addPedal(powerItem);
    } else {
      addPedal(item);
    }
    if (mobile) {
      setMobileCatalogOpen(false);
      return;
    }
    setCatalogOpen(false);
    setCustomCatalogOpen(false);
    setCatalogSelectedPedal(null);
    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);
  };

  const isCustomPedal =
    selectedPedal?.slug === "custom";

  const isImportedPedal =
    selectedPedal?.slug === "custom-upload";

  const isUserCreatedPedal =
    isCustomPedal || isImportedPedal;

  const isCustomBoard =
    selectedBoardDetails?.slug === "custom";

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

    setProjects((prev) => {
      const savedProjects =
        editingProjectId !== null
          ? prev.map((p) =>
            p.id === editingProjectId
              ? { ...p, name: tempName.trim() || p.name }
              : p
          )
          : prev;

      const newProject: Project = {
        id: newId,
        name: `Pedalboard ${savedProjects.length + 1}`,
        zoom: 200,
        stageX: 0,
        stageY: 0,
        boardPedals: [],
        selectedBoards: [],
      };

      return [...savedProjects, newProject];
    });

    setEditingProjectId(null);
    setActiveProjectId(newId);
  };

  const duplicateProject = (id: number) => {
    if (projects.length >= MAX_PROJECTS) return;

    const source = projects.find((p) => p.id === id);

    if (!source) return;

    const newId = Math.max(
      Date.now(),
      ...projects.map((p) => p.id + 1)
    );

    const newProject: Project = {
      ...structuredClone(source),
      id: newId,
      name: `${source.name} (Copy)`,
    };

    setProjects((prev) => {
      if (prev.length >= MAX_PROJECTS) return prev;

      return [...prev, newProject];
    });

    setEditingProjectId(null);
    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);
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

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setTempName(project.name);
  };

  const updateProjectName = (name: string) => {
    setTempName(name);

    if (editingProjectId === null) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === editingProjectId
          ? { ...p, name }
          : p
      )
    );
  };

  const saveName = () => {
    setEditingProjectId(null);
  };

  function makeCatalogPedal(pedal: AnyRow, placement: Pick<BoardItem, "instanceId" | "x" | "y" | "rotation"> & { zIndex: number }): BoardItem {
    return {
      ...pedal,
      ...placement,
      powerFinderElectrical: {
        voltage: pedal.voltage, draw: pedal.draw, power: pedal.power, circuit: pedal.circuit,
        current_type: pedal.current_type, polarity: pedal.polarity, connector: pedal.connector,
        power_modes: pedal.power_modes, ground: pedal.ground, requires_isolation: pedal.requires_isolation,
      },
      draw: Number(pedal.draw) || 0,
      weight: Number(pedal.weight) || 0,
    };
  }

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

    const newPedal = makeCatalogPedal(pedal, {
      instanceId: now,
      zIndex: now,
      x: newX,
      y: newY,
      rotation: 0,
    });

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

  // BOARD FINDER V1 — separate from the existing manual board selection.



  const selectSuggestedBoard = (
    board: AnyRow,
    allowRearrangement?: boolean,
    powerUnderBoard?: boolean,
  ): boolean => {
    const existingBoards =
      activeProject.selectedBoards || [];

    if (existingBoards.length > 1) return false;

    const originalItems =
      activeProject.boardPedals;

    const layout = getFinderLayout(
      originalItems,
      existingBoards,
      powerUnderBoard,
    );

    const fit = allowRearrangement === undefined ? null : getCanvasBoardFit(layout, board, allowRearrangement);
    if (allowRearrangement === undefined ? !getBoardFitMode(layout, board) : !fit) return false;

    const now = Date.now();

    // Preserve the existing board layer.
    // Under-board power supplies stay underneath.
    const boardZIndex =
      existingBoards.length === 1
        ? Number(
          existingBoards[0].zIndex ?? -9999
        )
        : Math.min(
          -9999,
          ...originalItems.map(
            (item) => Number(item.zIndex) || 0
          )
        ) - 1;

    const newBoard: BoardItem = {
      ...board,

      instanceId: now,

      x: fit?.centerX ?? layout.centerX,
      y: fit?.centerY ?? layout.centerY,

      rotation: 0,

      zIndex: boardZIndex,
    };

    updateActiveProject({
      selectedBoards: [newBoard],
      boardPedals: originalItems.map((item) => {
        const position = fit?.placements?.get(item.instanceId);
        const zIndex = Number(item.zIndex ?? 0);
        if (powerUnderBoard !== undefined && isPowerSupply(item) && (zIndex < boardZIndex) !== powerUnderBoard) {
          return { ...item, ...position, zIndex: powerUnderBoard ? boardZIndex - 1 : Math.max(0, boardZIndex + 1) };
        }
        return position ? { ...item, ...position } : item;
      }),
    });

    setLastSelectedBoard(board);

    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);

    closeSearchMenus();
    setMobileSidebarOpen(false);

    return true;
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
      name: item?.name?.trim() || customName.trim() || (itemType === "pedal" ? "" : "Custom"),

      width: widthMm,
      depth: depthMm,
      customLayout: itemType === "pedal" && !isUploadedImage
        ? resolveCustomPedalLayout(item.customLayout, widthMm, depthMm)
        : undefined,

      imageId: item?.imageId || null,

      image:
        item?.imageId
          ? ""
          : item?.image ||
          item?.image_url ||
          item?.photo ||
          (itemType === "pedal"
            ? "/images/custom-pedal.webp"
            : "/images/board-black.webp"
          ),

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

      ...{ powerFinderElectrical: { voltage: item?.voltage, draw: item?.draw, power: item?.power, circuit: item?.circuit, current_type: item?.current_type, polarity: item?.polarity, connector: item?.connector, power_modes: item?.power_modes, ground: item?.ground, requires_isolation: item?.requires_isolation } },
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

  const duplicateCanvasItem = (id: number, kind: "board" | "pedal") => {
    const isBoard = kind === "board";
    const collection = isBoard ? "selectedBoards" : "boardPedals";
    const source = activeProject[collection].find((item) => item.instanceId === id);
    if (!source) return;

    const items = [...activeProject.boardPedals, ...activeProject.selectedBoards];
    let instanceId = Date.now();
    while (items.some((item) => item.instanceId === instanceId)) instanceId++;
    const zIndex = isBoard || isPowerSupply(source)
      ? source.zIndex
      : Math.max(0, ...items.map((item) => Number(item.zIndex) || 0)) + 1;
    const copy = { ...source, instanceId, x: source.x + 24, y: source.y + 24, zIndex };
    updateActiveProject({ [collection]: [...activeProject[collection], copy] });
    setSelectedBoardInstanceId(isBoard ? instanceId : null);
    setSelectedInstanceId(isBoard ? null : instanceId);
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

  const moveCanvasItemOneLayer = (id: number, neighborId: number) => {
    const ordered = [...activeProject.selectedBoards, ...activeProject.boardPedals]
      .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));
    const index = ordered.findIndex((item) => item.instanceId === id);
    const neighbor = ordered.findIndex((item) => item.instanceId === neighborId);
    if (index < 0 || neighbor < 0 || index === neighbor) return;

    const ranks = ordered.map((item) => Number(item.zIndex) || 0);
    // Preserve the existing ranks, breaking ties so the one-step move is visible.
    for (let start = 0; start < ranks.length;) {
      let end = start + 1;
      while (end < ranks.length && ranks[end] === ranks[start]) end++;
      const step = ((ranks[end] ?? ranks[start] + 1) - ranks[start]) / (end - start);
      for (let i = start + 1; i < end; i++) ranks[i] = ranks[start] + (i - start) * step;
      start = end;
    }
    const [pedal] = ordered.splice(index, 1);
    ordered.splice(neighbor, 0, pedal);
    const rankById = new Map(ordered.map((item, i) => [item.instanceId, ranks[i]]));
    const withRank = (item: BoardItem) => {
      const zIndex = rankById.get(item.instanceId);
      return zIndex === (Number(item.zIndex) || 0) ? item : { ...item, zIndex };
    };
    updateActiveProject({
      boardPedals: activeProject.boardPedals.map(withRank),
      selectedBoards: activeProject.selectedBoards.map(withRank),
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


  const customCatalogPanel = (mobile: boolean) => (
    <CustomPanel
      embeddedCatalog
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
      addCustomItem={(item) => {
        addCustomItem(item);
        setCustomCatalogOpen(false);
        if (mobile) {
          setMobileCatalogOpen(false);
          setMobileInfoPedal(null);
          setMobileDetailOpen(false);
        } else {
          closeDesktopCatalog();
        }
      }}
      isPedalValid={customPedalValid}
      isBoardValid={customBoardValid}
      minValue={customMinValue}
      maxValue={customMaxValue}
      displayMin={customDisplayMin}
      displayMax={customDisplayMax}
      units={units}
      unitLabel={customUnitLabel}
      withUnit={(label) => `${label} (${customUnitLabel})`}
      t={t}
    />
  );

  return (
    <div
      className={`${pedalActions.editorViewport} bg-[var(--background)] text-[var(--foreground)] font-sans select-none overflow-hidden h-screen`}
      onClick={closeSearchMenus}
    >

      <div className="h-full w-full">

        <OnboardingTour t={t} />

        {/* ================= DESKTOP ≥1024 ================= */}
        <div className="hidden lg:flex h-full flex-col">
          <CatalogBanner actions={
            <>
              <button
                type="button"
                aria-label={t("gear.allGear")}
                title={t("gear.allGear")}
                aria-expanded={catalogOpen}
                onClick={() => {
                  if (catalogOpen) {
                    closeDesktopCatalog();
                    return;
                  }
                  // Keep the currently displayed canvas product; only an empty
                  // sidebar needs the newest database pedal as a fallback.
                  setCatalogOpen(true);
                }}
                data-tour="catalogue"
                className="myb-catalog-trigger flex h-9 w-9 shrink-0 items-center justify-center rounded-lg cursor-pointer"
              >
                <span
                  className="flex items-center justify-center rounded-full bg-blue-600 text-white"
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    flexShrink: 0,
                    aspectRatio: "1 / 1",
                  }}
                >
                  {catalogOpen ? (
                    <Minus size={18} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                  )}
                </span>
              </button>

              <SettingsMenu
                t={t}
                canvasBg={canvasBg}
                setCanvasBg={setCanvasBg}
                language={language}
                setLanguage={setLanguage}
                units={units}
                setUnits={setUnits}
                backgrounds={BACKGROUNDS}
                placement="top"
              />
            </>
          } />
          <div className="flex flex-1 min-h-0 min-w-0">

            <div
              ref={desktopCanvasRef}
              className={`flex-1 min-w-0 flex flex-col overflow-hidden ${catalogOpen ? "bg-transparent" : "bg-[#323234]"
                }`}
            >
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {/* One continuous blur for catalog and sidebar: no seam or doubled blur. */}
                {catalogOpen && (
                  <div aria-hidden="true" className="absolute inset-0 z-[110] pointer-events-none backdrop-blur-[12px]" />
                )}
                <div
                  className={`absolute inset-0 ${catalogOpen ? "pointer-events-none" : ""
                    }`}
                >
                  <div
                    ref={setDesktopToolbarHost}
                    className="absolute inset-0 z-[130] pointer-events-none"
                  />
                  <BoardCanvas
                    desktopToolbarHost={desktopToolbarHost}
                    desktopCatalogOpen={catalogOpen}
                    onMobileItemInfo={() => {
                      setCatalogOpen(false);
                      setCustomCatalogOpen(false);
                      setDesktopInfoOpen(true);
                    }}
                    onDesktopRightPanelChange={setDesktopRightPanelOpen}
                    activeProject={activeProject}
                    duplicateCanvasItem={duplicateCanvasItem}
                    moveCanvasItemOneLayer={moveCanvasItemOneLayer}
                    replacementPreview={replacementReview}
                    units={units}
                    language={language}
                    setMobileSidebarOpen={setMobileSidebarOpen}
                    setSpecsOpen={setSpecsOpen}
                    selectedInstanceId={selectedInstanceId}
                    setSelectedInstanceId={handleCanvasPedalSelection}
                    selectedBoardInstanceId={selectedBoardInstanceId}
                    setSelectedBoardInstanceId={handleCanvasBoardSelection}
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
                    rotateBoard={rotateBoard}
                    deleteBoard={deleteBoard}
                    onStageSizeChange={setCanvasSize}
                    getCenterRef={getCenterRef}
                    projects={projects}
                    activeProjectId={activeProjectId}
                    setActiveProjectId={setActiveProjectId}
                    createNewProject={createNewProject}
                    duplicateProject={duplicateProject}
                    deleteProject={deleteProject}
                    startEditing={startEditing}
                    editingProjectId={editingProjectId}
                    tempName={tempName}
                    setTempName={updateProjectName}
                    saveName={saveName}

                    setLanguage={setLanguage}
                    setUnits={setUnits}

                  />
                </div>

                <div
                  className="absolute top-0 bottom-0 z-[120] min-h-0 min-w-0 overflow-hidden"
                  style={{
                    left: 0,
                    right: 0,
                    visibility: catalogOpen ? "visible" : "hidden",
                    pointerEvents: catalogOpen ? "auto" : "none",
                  }}
                >
                  <GearCatalog
                    compactPedalDetails
                    desktopSidebarMode
                    catalogVisible={catalogOpen}
                    relatedSidebarHost={catalogRecommendationsHost}
                    sidebarRecommendationPedal={sidebarPedal ?? null}
                    onCatalogPedalChange={(pedal, kind) => {
                      if (pedal) {
                        handleCatalogSelection(pedal, kind ?? "pedals");
                      }
                    }}
                    embedded
                    pedals={pedalsLibrary}
                    boards={boardsLibrary}
                    power={powerLibrary}
                    newPedals={newPedals}
                    newBoards={newBoards}
                    newPower={newPower}
                    newGearLoading={newGearLoading}
                    boardsStatus={boardsStatus}
                    powerStatus={powerStatus}
                    loading={libraryLoading}
                    error={libraryError}
                    initialCategory="all"
                    initialQuery={replacementQuery}
                    replacement={replacementCatalog}
                    language={language}
                    units={units}
                    isUSA={isUSA}
                    isEurope={isEurope}
                    buildThomannUrl={buildThomannUrl}
                    t={t}
                    onClose={closeDesktopCatalog}
                    onOpenCustom={() => setCustomCatalogOpen(open => !open)}
                    customOpen={customCatalogOpen}
                    customPanel={customCatalogOpen ? customCatalogPanel(false) : undefined}
                    onAdd={addCatalogItem}
                  />
                </div>

                {!catalogOpen && desktopInfoOpen && (sidebarPedal || sidebarBoard) && (
                  <aside
                    className="absolute top-0 left-0 bottom-0 z-[130] isolate overflow-hidden bg-transparent"
                    style={{
                      width: DESKTOP_SIDEBAR_WIDTH,
                      minWidth: DESKTOP_SIDEBAR_WIDTH,
                      maxWidth: DESKTOP_SIDEBAR_WIDTH,
                      right: "auto",
                      boxSizing: "border-box",
                    }}
                  >
                    <div className="relative z-10 h-full min-h-0">
                      <SidebarFilter
                        boardsLibrary={boardsLibrary}
                        onSelectBoard={(board) => handleCatalogSelection(board, "boards")}
                        onRecommendationsHostChange={setCatalogRecommendationsHost}
                        selectedPedal={sidebarPedal ?? undefined}
                        replacementMode={Boolean(replacementCatalog)}
                        onAddToBoard={replacementCatalog && !catalogSelectedPedal ? undefined : (item) => {
                          const kind = sidebarBoard ? "boards" : sidebarPedal && isPowerSupply(sidebarPedal) ? "power" : "pedals";
                          addCatalogItem(kind, item);
                        }}
                        selectedBoardDetails={sidebarBoard}
                        selectedInstanceId={catalogSelectedPedal ? null : selectedInstanceId}
                        selectedBoardInstanceId={catalogSelectedPedal ? null : selectedBoardInstanceId}
                        language={language}
                        units={units}
                        country={country}
                        isUSA={isUSA}
                        isEurope={isEurope}
                        rotatePedal={rotatePedal}
                        movePedalFront={movePedalFront}
                        movePedalBack={movePedalBack}
                        deletePedal={deletePedal}
                        rotateBoard={rotateBoard}
                        moveBoardFront={moveBoardFront}
                        moveBoardBack={moveBoardBack}
                        deleteBoard={deleteBoard}
                      />
                    </div>
                  </aside>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ================= MOBILE <1024 ================= */}
        <div className="flex lg:hidden flex-col h-full relative">

          <CatalogBanner actions={<>
            <button
              type="button"
              data-tour="catalogue"
              aria-label={t("gear.allGear")}
              title={t("gear.allGear")}
              aria-expanded={mobileCatalogOpen}
              onClick={() => {
                if (mobileCanvasPanelOpen) {
                  mobileCanvasPanelCloseRef.current?.();
                  setMobileCanvasPanelOpen(false);
                }
                setMobileSidebarOpen(false);
                setMobileInfoPedal(null);
                setMobileDetailOpen(false);
                setCustomCatalogOpen(false);
                if (mobileCatalogOpen && replacementCatalog) setReplacement(null);
                setMobileCatalogOpen((open) => !open);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg cursor-pointer transition-colors duration-150 hover:bg-zinc-800"
            >
              <span
                className="flex items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700"
                style={{
                  width: 24,
                  height: 24,
                  minWidth: 24,
                  minHeight: 24,
                  flexShrink: 0,
                  aspectRatio: "1 / 1",
                }}
              >
                {mobileCatalogOpen ? (
                  <Minus size={18} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                )}
              </span>
            </button>
            <SettingsMenu t={t} canvasBg={canvasBg} setCanvasBg={setCanvasBg}
              language={language} setLanguage={setLanguage} units={units} setUnits={setUnits}
              backgrounds={BACKGROUNDS} placement="top" />
          </>} />


          {/* CANVAS MOBILE */}
          <div
            ref={mobileCanvasRef}
            className="flex-1 min-h-0 relative bg-[#323234] overflow-hidden"
          >
            <BoardCanvas
              activeProject={activeProject}
              mobileCatalogOpen={mobileCatalogOpen}
              mobileToolbarHost={mobileToolbarHost}
              onMobileItemInfo={(item) => {
                if (item.kind === "board" || isPowerSupply(item)) {
                  setMobileInfoPedal(null);
                  setMobileCatalogOpen(false);
                  setMobileSidebarOpen(true);
                  return;
                }

                setMobileInfoPedal(item);
                setMobileSidebarOpen(false);
                setMobileCatalogOpen(true);
              }}
              duplicateCanvasItem={duplicateCanvasItem}
              moveCanvasItemOneLayer={moveCanvasItemOneLayer}
              replacementPreview={replacementReview}
              units={units}
              language={language}
              setMobileSidebarOpen={setMobileSidebarOpen}
              setSpecsOpen={setSpecsOpen}
              selectedInstanceId={selectedInstanceId}
              setSelectedInstanceId={handleCanvasPedalSelection}
              selectedBoardInstanceId={selectedBoardInstanceId}
              setSelectedBoardInstanceId={handleCanvasBoardSelection}
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
              rotateBoard={rotateBoard}
              deleteBoard={deleteBoard}
              isMobile
              mobileSidebarOpen={mobileSidebarOpen}
              setMobileCanvasPanelOpen={setMobileCanvasPanelOpen}
              mobileCanvasPanelCloseRef={mobileCanvasPanelCloseRef}
              getCenterRef={getCenterRef}
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
              createNewProject={createNewProject}
              duplicateProject={duplicateProject}
              deleteProject={deleteProject}
              startEditing={startEditing}
              editingProjectId={editingProjectId}
              tempName={tempName}
              setTempName={updateProjectName}
              saveName={saveName}

              setLanguage={setLanguage}
              setUnits={setUnits}
            />

            <div ref={setMobileToolbarHost} className="absolute inset-0 z-[130] pointer-events-none" />

            {mobileCatalogOpen && (
              <div className="absolute inset-0 z-[120] min-h-0 min-w-0 overflow-hidden bg-transparent backdrop-blur-xl">
                <GearCatalog
                  embedded
                  initialDetailItem={mobileInfoPedal}
                  pedals={pedalsLibrary}
                  boards={boardsLibrary}
                  power={powerLibrary}
                  newPedals={newPedals}
                  newBoards={newBoards}
                  newPower={newPower}
                  newGearLoading={newGearLoading}
                  boardsStatus={boardsStatus}
                  powerStatus={powerStatus}
                  onDetailChange={setMobileDetailOpen}
                  detailBackRef={mobileDetailBackRef}
                  loading={libraryLoading}
                  error={libraryError}
                  initialCategory="all"
                  initialQuery={replacementQuery}
                  replacement={replacementCatalog}
                  language={language}

                  units={units}
                  isUSA={isUSA}
                  isEurope={isEurope}
                  buildThomannUrl={buildThomannUrl}
                  t={t}
                  onOpenCustom={() => setCustomCatalogOpen(open => !open)}
                  customOpen={customCatalogOpen}
                  customPanel={customCatalogOpen ? customCatalogPanel(true) : undefined}
                  onClose={() => {
                    setCustomCatalogOpen(false);
                    setMobileCatalogOpen(false);
                    setMobileInfoPedal(null);
                    setMobileDetailOpen(false);
                    if (replacementCatalog) setReplacement(null);
                  }}
                  onAdd={(kind, item) => addCatalogItem(kind, item, true)}
                />
              </div>
            )}
          </div>

          {/* MOBILE SIDEBAR DRAWER */}
          <div
            className={`absolute top-[calc(64px+env(safe-area-inset-top))] left-0 right-0 bottom-0 z-40 overflow-hidden transition-opacity duration-300 ${mobileSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
              }`}
            inert={!mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div
              className={`absolute inset-0 w-full ${contactOpen
                ? "translate-y-0"
                : `transition-transform duration-300 ${mobileSidebarOpen ? "translate-y-0" : "translate-y-full"
                }`
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
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pt-2 pb-2">

                  <Sidebar
                    pedalsLibrary={pedalsLibrary}
                    finderPedals={activeProject.boardPedals}
                    newPedals={newPedals}

                    newBoards={newBoards}
                    newPower={newPower}
                    newGearLoading={newGearLoading}

                    newPedalsLoading={newPedalsLoading}
                    libraryLoading={libraryLoading}
                    libraryError={libraryError}
                    boardsLibrary={boardsLibrary}
                    powerLibrary={powerLibrary}
                    boardsStatus={boardsStatus}
                    powerStatus={powerStatus}
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
                    selectSuggestedBoard={selectSuggestedBoard}
                    existingBoards={activeProject.selectedBoards || []}
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
                    onReturnToCanvas={() => setMobileSidebarOpen(false)}
                    hideLogo
                    isMobile
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
                finderPedals={activeProject.boardPedals}
                newPedals={newPedals}

                newBoards={newBoards}
                newPower={newPower}
                newGearLoading={newGearLoading}

                newPedalsLoading={newPedalsLoading}
                libraryLoading={libraryLoading}
                libraryError={libraryError}
                boardsLibrary={boardsLibrary}
                powerLibrary={powerLibrary}
                boardsStatus={boardsStatus}
                powerStatus={powerStatus}
                setLastSelectedPedal={setLastSelectedPedal}
                lastSelectedPower={lastSelectedPower}
                setLastSelectedPower={setLastSelectedPower}
                showPedalResults={false}
                setShowPedalResults={() => { }}
                showBoardResults={false}
                setShowBoardResults={() => { }}
                pedalSearch=""
                setPedalSearch={() => { }}
                boardSearch=""
                setBoardSearch={() => { }}
                selectedPedal={selectedPedal}
                selectedBoardDetails={selectedBoardDetails}
                lastSelectedPedal={lastSelectedPedal}
                lastSelectedBoard={lastSelectedBoard}
                selectedInstanceId={selectedInstanceId}
                selectedBoardInstanceId={null}
                setSelectedInstanceId={() => { }}
                setSelectedBoardInstanceId={() => { }}

                customName=""
                setCustomName={() => { }}

                customWidth=""
                setCustomWidth={() => { }}

                customDepth=""
                setCustomDepth={() => { }}

                customColor="#000"
                setCustomColor={() => { }}

                addPedal={() => { }}
                selectBoard={() => { }}
                addCustomItem={() => { }}

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
                setCustomType={() => { }}

                makeOpen={false}
                setMakeOpen={() => { }}

                contactOpen={false}
                setContactOpen={() => { }}

                hideLogo
              />

            </div>

          </div>
        </div>
      )}

      {replacementReview && (
        <dialog
          ref={replacementDialogRef}
          className={pedalActions.confirmDialog}
          aria-labelledby="replacement-preview-heading"
          onClick={(event) => event.stopPropagation()}
          onCancel={(event) => {
            event.preventDefault();
            setReplacement(null);
          }}
        >
          <h2 id="replacement-preview-heading">{t("replacement.review")}</h2>
          <p>{[replacementReview.pedal.brand, replacementReview.pedal.name].filter(Boolean).join(" ")}</p>
          <div className={pedalActions.confirmButtons}>
            <button type="button" onClick={() => setReplacement(null)}>{t("replacement.cancel")}</button>
            <button type="button" onClick={confirmReplacement}>{t("replacement.confirm")}</button>
          </div>
        </dialog>
      )}

    </div>
  );
}