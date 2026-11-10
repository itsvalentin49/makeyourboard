"use client";

import { createPortal } from "react-dom";
import React, { useRef, useLayoutEffect, useEffect, useId, useState, useCallback } from "react";
import { Stage, Layer, Group, Rect, Text, Circle as KonvaCircle, Image as KonvaImage, } from "react-konva";
import { Zap, Weight, Minus, Cable, Plus, Check, Upload, AlertTriangle, RotateCw, Circle, Trash2, X, Share2, List, Settings, PanelsTopLeft, Download, ArrowUp, ArrowDown, CircleHelp, ChevronsLeft, ChevronsRight, Replace, CopyPlus, Ellipsis, Info } from "lucide-react";
import PedalImage from "@/components/PedalImage";
import pedalActions from "./PedalActions.module.css";
import { formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";
import useImage from "use-image";
import ExportPanel from "@/components/ExportPanel";
import Image from "next/image";
import type { Project } from "@/types/project";
import SettingsPanel from "@/components/SettingsPanel";
import PedalboardsPanel from "@/components/PedalboardsPanel";
import PowerSetup from "@/components/PowerSetup";
import CablesPanel from "@/components/CablesPanel";
import { HelpGuide } from "@/components/HelpGuide";
import SignalPath, { SignalPoint } from "@/components/SignalPath";
import type { Language } from "@/utils/i18n";
import { isPowerSupply, type ReplacementFit } from "@/utils/boardFinder";
import { ENCLOSURE_SIZING_BRANDS } from "@/utils/enclosureSizing";


import { resolveCustomPedalLayout, getPedalHardwareGeometry, getPedalJackGeometry, parsePedalJackLocations } from "@/utils/customPedalLayout";

const HELP_ENABLED = false;
const SIGNAL_PATH_ENABLED = false;

type AnyRow = Record<string, any>;

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
};

type Props = {
  desktopToolbarHost?: HTMLDivElement | null;
  viewer?: boolean;

  activeProject: {
    name?: string;
    boardPedals: AnyRow[];
    selectedBoards?: AnyRow[];
    zoom?: number;
    stageX?: number;
    stageY?: number;
    signalPath?: {
      id: string;
      from: number;
      to: number;
    }[];
  };

  projects?: Project[];
  activeProjectId?: number | null;
  setActiveProjectId?: (id: number | null) => void;
  createNewProject?: () => void;

  setMobileSidebarOpen: (v: boolean) => void;
  setSpecsOpen: (v: boolean) => void;
  setSettingsOpen?: (v: boolean) => void;
  setLanguage?: (v: Language) => void;
  setUnits?: (v: "metric" | "imperial") => void;

  units: "metric" | "imperial";
  language: Language;

  mobileSidebarOpen?: boolean;
  setMobileCanvasPanelOpen?: (v: boolean) => void;

  mobileCanvasPanelCloseRef?: React.MutableRefObject<
    (() => void) | null
  >;

  rotatePedal: (id: number) => void;
  deletePedal: (id: number) => void;
  duplicateCanvasItem: (id: number, kind: "board" | "pedal") => void;
  moveCanvasItemOneLayer?: (id: number, neighborId: number) => void;
  replacePedal?: (id: number) => void;
  replacementPreview?: {
    pedal: AnyRow;
    fit: ReplacementFit;
  };
  rotateBoard: (id: number) => void;
  deleteBoard: (id: number) => void;

  selectedInstanceId: number | null;
  setSelectedInstanceId: (v: number | null) => void;

  selectedBoardInstanceId: number | null;
  setSelectedBoardInstanceId: (v: number | null) => void;

  displaySizes: Record<number, { w: number; h: number }>;
  handleSizeUpdate: (id: number, w: number, h: number) => void;

  updateActiveProject: (updates: Partial<Props["activeProject"]>) => void;
  closeSearchMenus: () => void;
  setContactOpen: (v: boolean) => void;

  deleteProject?: (id: number, e: React.MouseEvent<HTMLElement>) => void;
  startEditing?: (project: Project) => void;
  editingProjectId?: number | null;
  tempName?: string;
  setTempName?: (v: string) => void;
  saveName?: () => void;

  BACKGROUNDS: Background[];
  canvasBg: string;
  selectedBackgroundSrc?: string;
  setCanvasBg: (v: string) => void;
  showIntro?: boolean;
  isMobile?: boolean;

  onStageSizeChange?: (size: { width: number; height: number }) => void;
  stagePos?: { x: number; y: number };
  setStagePos?: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  getCenterRef?: React.MutableRefObject<
    (() => { x: number; y: number }) | null
  >;
};


// ================== GEOMETRY (PRO) ==================

function getOrientedBox(p: any, size: { w: number; h: number }) {
  const angle = ((p.rotation || 0) * Math.PI) / 180;

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const hw = size.w / 2;
  const hh = size.h / 2;

  const cx = p.x;
  const cy = p.y;

  const axisX = { x: cos, y: sin };
  const axisY = { x: -sin, y: cos };

  const corners = [
    { x: cx + axisX.x * hw + axisY.x * hh, y: cy + axisX.y * hw + axisY.y * hh },
    { x: cx - axisX.x * hw + axisY.x * hh, y: cy - axisX.y * hw + axisY.y * hh },
    { x: cx - axisX.x * hw - axisY.x * hh, y: cy - axisX.y * hw - axisY.y * hh },
    { x: cx + axisX.x * hw - axisY.x * hh, y: cy + axisX.y * hw - axisY.y * hh },
  ];

  return { cx, cy, axisX, axisY, corners };
}

function projectBox(axis: any, box: any) {
  const dots = box.corners.map((p: any) => p.x * axis.x + p.y * axis.y);
  return {
    min: Math.min(...dots),
    max: Math.max(...dots),
  };
}

function getOverlap(projA: any, projB: any) {
  return Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min);
}



function getSATOverlap(boxA: any, boxB: any) {
  const axes = [boxA.axisX, boxA.axisY, boxB.axisX, boxB.axisY];

  let minOverlap = Infinity;
  let smallestAxis = null;

  for (const axis of axes) {
    const projA = projectBox(axis, boxA);
    const projB = projectBox(axis, boxB);

    const overlap = getOverlap(projA, projB);

    if (overlap < 0) return null;

    if (overlap < minOverlap) {
      minOverlap = overlap;
      smallestAxis = axis;
    }
  }

  return { overlap: minOverlap, axis: smallestAxis };
}

/* 🔥 ICI EXACTEMENT (EN DEHORS) */
function extractOutputs(details: string) {
  if (!details) return [];

  const outputs: {
    count: number;
    voltages: string[];
    currents: number[];
    isSwitch: boolean;
  }[] = [];

  const parts = details.split(",");

  parts.forEach(part => {
    const p = part.trim();

    const match = p.match(/(\d+)x(.+?):([\d\/]+)mA/i);
    if (!match) return;

    const count = Number(match[1]);

    const isSwitch = /switch/i.test(match[2]);

    const voltages = match[2]
      .replace(/switch:/gi, "")
      .replace(/DC/gi, "")
      .replace(/V/gi, "")
      .split("/")
      .map(v => v.trim());

    const currents = match[3]
      .split("/")
      .map(c => Number(c));

    outputs.push({
      count,
      voltages,
      currents,
      isSwitch,
    });
  });

  return outputs;
}


function CanvasPanelsPortal({ host, children }: { host: HTMLDivElement | null; children: React.ReactNode }) {
  return host ? createPortal(children, host) : <>{children}</>;
}

// Tint follows the source image alpha, including its real corners and soft edges.
function CustomPedalTint({ color, width, height }: { color: string; width: number; height: number }) {
  const [source] = useImage("/images/custom-pedal.webp");
  const tint = React.useMemo(() => {
    if (!source) return undefined;
    const mask = document.createElement("canvas");
    mask.width = source.naturalWidth || source.width;
    mask.height = source.naturalHeight || source.height;
    const context = mask.getContext("2d");
    if (!context) return undefined;
    context.drawImage(source, 0, 0, mask.width, mask.height);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = color;
    context.fillRect(0, 0, mask.width, mask.height);
    return mask;
  }, [source, color]);
  if (!tint) return null;
  return <KonvaImage image={tint} x={-width / 2} y={-height / 2}
    width={width} height={height} opacity={0.7} listening={false} />;
}

export default function BoardCanvas({
  desktopToolbarHost = null,
  activeProject,
  units,
  language,
  selectedInstanceId,
  setSelectedInstanceId,
  selectedBoardInstanceId,
  setSelectedBoardInstanceId,
  displaySizes,
  handleSizeUpdate,
  updateActiveProject,
  closeSearchMenus,
  setContactOpen,
  BACKGROUNDS = [],
  canvasBg,
  selectedBackgroundSrc,
  setCanvasBg,
  showIntro,
  isMobile = false,
  mobileSidebarOpen = false,
  setMobileCanvasPanelOpen,
  mobileCanvasPanelCloseRef,
  rotatePedal,
  deletePedal,
  duplicateCanvasItem,
  moveCanvasItemOneLayer,
  replacePedal,
  replacementPreview,
  rotateBoard,
  deleteBoard,
  onStageSizeChange,
  stagePos,
  setStagePos,
  getCenterRef,
  setMobileSidebarOpen,
  setSpecsOpen,
  viewer = false,
  projects = [],
  activeProjectId,
  setActiveProjectId,
  createNewProject,
  deleteProject,
  startEditing,
  editingProjectId,
  tempName = "",
  setTempName,
  saveName,
  setSettingsOpen,
  setLanguage,
  setUnits,
}: Props) {

  const t = getTranslator(language);
  const [desktopPanelHost, setDesktopPanelHost] = useState<HTMLDivElement | null>(null);
  const [railExpanded, setRailExpanded] = useState(false);
  const [itemMenuExpanded, setItemMenuExpanded] = useState(false);
  const itemActionsId = useId();
  const moreActionsButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setItemMenuExpanded(false);
  }, [selectedInstanceId, selectedBoardInstanceId]);
  const railWidth = 56;
  const railLabels: Record<Language, { expand: string; collapse: string }> = {
    fr: { expand: "Afficher les noms", collapse: "Masquer les noms" },
    en: { expand: "Show labels", collapse: "Hide labels" },
    de: { expand: "Beschriftungen anzeigen", collapse: "Beschriftungen ausblenden" },
    es: { expand: "Mostrar nombres", collapse: "Ocultar nombres" },
    it: { expand: "Mostra nomi", collapse: "Nascondi nomi" },
    pt: { expand: "Mostrar nomes", collapse: "Ocultar nomes" },
    zh: { expand: "显示名称", collapse: "隐藏名称" },
  };
  useEffect(() => {
    try { setRailExpanded(sessionStorage.getItem("myb-tool-rail-expanded") === "true"); }
    catch { /* Storage can be unavailable in private contexts. */ }
  }, []);
  const toggleRail = () => {
    setRailExpanded((expanded) => {
      const next = !expanded;
      try { sessionStorage.setItem("myb-tool-rail-expanded", String(next)); } catch { }
      return next;
    });
  };

  const [showSettings, setShowSettings] = useState(false);
  const [settingsContactVisible, setSettingsContactVisible] = useState(false);
  useEffect(() => { if (!showSettings) setSettingsContactVisible(false); }, [showSettings]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [renderMobileMenu, setRenderMobileMenu] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(true);
  const boardIconSrc = isLightTheme ? "/images/tab-board-dark.webp" : "/images/tab-board-light.webp";
  const settingsIconSrc = isLightTheme ? "/images/tab-settings-dark.webp" : "/images/tab-settings-light.webp";
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!HELP_ENABLED || !showIntro) return;

    const hidden = localStorage.getItem("myb_help_hidden");

    if (hidden !== "true") {
      setHelpOpen(true);
    }
  }, [showIntro]);

  useEffect(() => {
    const html = document.documentElement;

    const updateTheme = () => {
      setIsLightTheme(html.classList.contains("light"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);
  const closeBottomPanels = () => {
    setShowBoardsMenu(false);
    setShowCableMenu(false);
    setShowPower(false);
    setShowExportPanel(false);
    setShowSettings(false);
    setShowList(false);
    setHelpOpen(false);
  };
  const toggleUnifiedPanel = (panel: "boards" | "cables" | "power" | "settings" | "help" | "export") => {
    const wasOpen = panel === "boards" ? showBoardsMenu
      : panel === "cables" ? showCableMenu
        : panel === "power" ? showPower
          : panel === "settings" ? showSettings
            : panel === "help" ? helpOpen : showExportPanel;
    closeBottomPanels();
    if (wasOpen) return;
    if (panel === "boards") setShowBoardsMenu(true);
    else if (panel === "cables") setShowCableMenu(true);
    else if (panel === "power") setShowPower(true);
    else if (panel === "settings") setShowSettings(true);
    else if (panel === "help") setHelpOpen(true);
    else setShowExportPanel(true);
  };
  const [knob] = useImage("/images/knob.webp");
  const [footswitch] = useImage("/images/footswitch.webp");
  const [led] = useImage("/images/led.webp");

  const [jackLeft] = useImage("/images/jack-left.webp");
  const [jackRight] = useImage("/images/jack-right.webp");
  const [jackTop] = useImage("/images/jack-top.webp");
  const [jackDown] = useImage("/images/jack-down.webp");
  const currentZoom = activeProject.zoom || 100;
  const zoomPercent = Math.round(currentZoom);
  const displayZoomPercent = Math.round(zoomPercent * 0.75 - 25);
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 300;

  const ZOOM_STEP = 5;

  const applyZoom = (newZoomPercent: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const newScale = newZoomPercent / 100;

    const center = {
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    };

    const pointTo = {
      x: (center.x - stage.x()) / oldScale,
      y: (center.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: center.x - pointTo.x * newScale,
      y: center.y - pointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();

    updateActiveProject({
      zoom: newZoomPercent,
      stageX: newPos.x,
      stageY: newPos.y,
    });
  };

  const zoomIn = () => {
    if (zoomPercent >= MAX_ZOOM) return;
    const newZoom = Math.min(MAX_ZOOM, zoomPercent + ZOOM_STEP);
    applyZoom(newZoom);
  };

  const currentBackground = BACKGROUNDS.find(
    (b) => b.id === canvasBg
  );

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    const newScale =
      direction > 0
        ? oldScale * scaleBy
        : oldScale / scaleBy;

    const clampedScale = Math.max(0.5, Math.min(3, newScale));

    if (viewer) {
      // 🔥 ZOOM CENTRÉ ÉCRAN
      const center = {
        x: stageSize.width / 2,
        y: stageSize.height / 2,
      };

      const pointTo = {
        x: (center.x - stage.x()) / oldScale,
        y: (center.y - stage.y()) / oldScale,
      };

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: center.x - pointTo.x * clampedScale,
        y: center.y - pointTo.y * clampedScale,
      };

      stage.position(newPos);
      stage.batchDraw();

      updateActiveProject({
        zoom: clampedScale * 100,
        stageX: newPos.x,
        stageY: newPos.y,
      });

    } else {
      // zoom classique
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
      stage.batchDraw();

      updateActiveProject({
        zoom: clampedScale * 100,
        stageX: newPos.x,
        stageY: newPos.y,
      });
    }
  };

  const zoomOut = () => {
    if (zoomPercent <= MIN_ZOOM) return;
    const newZoom = Math.max(MIN_ZOOM, zoomPercent - ZOOM_STEP);
    applyZoom(newZoom);
  };

  const isMinZoom = zoomPercent <= MIN_ZOOM;
  const isMaxZoom = zoomPercent >= MAX_ZOOM;
  const effectiveStagePos = stagePos ?? { x: 0, y: 0 };

  // 1. Consommation (Pédales uniquement)
  const totalDraw = activeProject.boardPedals
    .filter(p => p.type !== "power")
    .reduce((acc, p) => acc + (Number(p.draw) || 0), 0);

  // 2. Capacité (Alims uniquement)
  const totalPowerCapacity = activeProject.boardPedals
    .filter(p => p.type === "power")
    .reduce((acc, p) => acc + (Number(p.capacity) || 0), 0);

  const hasPower = totalPowerCapacity > 0;
  const isOverloaded = hasPower && totalDraw > totalPowerCapacity;

  // ================= OUTPUT LOGIC (NEW UX) =================

  // pédales uniquement
  const pedals = activeProject.boardPedals

    .filter(p => p.type !== "power")
    .sort((a, b) => {
      const nameA = `${a.brand || ""} ${a.name || ""}`.toLowerCase();
      const nameB = `${b.brand || ""} ${b.name || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  const poweredPedals = pedals.filter((p) => {
    const powerType = String(p.power || "").toLowerCase();

    return (
      powerType !== "passive" &&
      powerType !== "battery"
    );
  });


  const hasPedals = pedals.length > 0;
  const powerUnits = activeProject.boardPedals.filter(p => p.type === "power");

  const allOutputs = powerUnits.flatMap(p => extractOutputs(p.details));

  const pedalAssignments = pedals.map(p => {
    const neededV = Number(p.voltage) || 9;
    const neededA = Number(p.draw) || 0;

    const match = allOutputs.find(o => {
      const voltages = o.voltages.map(v => {
        if (v.toUpperCase().includes("AC")) return "AC";
        return Number(v);
      });

      const currents = o.currents;

      const voltageMatch = voltages.includes(neededV);

      const currentMatch = currents.some(c => c >= neededA);

      return voltageMatch && currentMatch;
    });

    return {
      pedal: p,
      ok: !!match,
      output: match,
    };
  });

  const hasFailingPedal = pedalAssignments.some(a => !a.ok);

  const drawColor = !hasPower
    ? "text-white"
    : hasFailingPedal
      ? "text-red-500"
      : "text-green-600";

  // sorties dispo
  const totalOutputs = activeProject.boardPedals
    .filter(p => p.type === "power")
    .reduce((acc, p) => acc + (Number(p.outputs) || 0), 0);

  // séparer digital / analog
  const digitalPedals = poweredPedals.filter(p => {
    const circuit = (p.circuit || "").toLowerCase();
    return circuit.includes("digital") || circuit.includes("dsp");
  });

  const analogPedals = poweredPedals.filter(
    p => !digitalPedals.includes(p)
  );

  const daisyPedalNames = analogPedals
    .map((p) => p.name)
    .filter(Boolean)
    .join(", ");

  // 🔥 NOUVELLE LOGIQUE SIMPLE (UX PRO)

  const pedalCount = poweredPedals.length;
  const digitalCount = digitalPedals.length;

  // règles
  const isSinglePedal = pedalCount === 1;
  const singlePedal = isSinglePedal ? pedals[0] : null;

  const singlePedalVoltage = singlePedal
    ? Number(singlePedal.voltage) || 9
    : 9;

  const singlePedalDraw = singlePedal
    ? Number(singlePedal.draw) || 0
    : 0;

  const singlePedalCanUseBattery =
    singlePedal &&
    String(singlePedal.power || "").toLowerCase().includes("battery");
  const isAnalogOnlySmall = pedalCount >= 2 && pedalCount <= 4 && digitalCount === 0;
  const isMixedWithMultipleDigital = pedalCount >= 2 && pedalCount <= 4 && digitalCount >= 2;
  const isLargeBoard = pedalCount >= 5;
  const isMixedWithSingleDigital =
    pedalCount >= 2 && pedalCount <= 4 && digitalCount === 1;

  // 🔥 2. priorité digitale
  const outputsAfterDigital = totalOutputs - digitalPedals.length;

  // 🔥 3. analog restants
  const remainingAnalog = Math.max(
    0,
    analogPedals.length - outputsAfterDigital
  );
  const extraPedals = remainingAnalog;

  // 🔥 4. règles UX
  const notEnoughForDigital = outputsAfterDigital < 0;

  const shouldShowNotEnough =
    notEnoughForDigital || remainingAnalog >= 4;



  const shouldShowDaisy =
    !notEnoughForDigital &&
    remainingAnalog > 0 &&
    remainingAnalog <= 3;


  const currentPowerLevel = !hasPower
    ? 0
    : shouldShowNotEnough
      ? 2
      : shouldShowDaisy
        ? 1
        : 0;


  // 🔥 CONDITION UNIQUE POWER ISSUE
  const hasPowerIssue =
    hasPower && (
      hasFailingPedal ||
      shouldShowNotEnough ||
      shouldShowDaisy
    );

  const hasDaisyChainTuner = activeProject.boardPedals.some(p => {
    const name = (p.name || "").trim();

    return (
      name === "TU-3 Chromatic Tuner" ||
      name === "TU-3S Chromatic Tuner" ||
      name === "TU-3W Chromatic Tuner" ||
      name === "PolyTune 3" ||
      name === "Pitchblack X"
    );
  });


  let powerMessage: string | null = null;
  let powerMessageColor = "text-green-600";
  let powerStatus = "none";


  // 🔹 CAS 1 : PAS D'ALIM
  if (!hasPower) {
    powerMessage = null; // ❌ plus de message ici
  }

  // 🔹 CAS 2 : AVEC ALIM → CHECK COMPATIBILITÉ
  if (hasPower) {
    const failingPedals = pedalAssignments.filter(a => !a.ok);

    if (failingPedals.length > 0) {
      powerMessage = t("powerSetup.status.notCompatible");
      powerMessageColor = "text-red-500";
      powerStatus = "error";
    }
    else {
      // ✅ TOUJOURS OK ici
      powerMessage = t("powerSetup.status.compatible");
      powerMessageColor = "text-green-600 mt-2";

      // ⚠️ MAIS état warning si daisy
      if (shouldShowNotEnough) {
        powerStatus = "error";
      } else if (shouldShowDaisy) {
        powerStatus = "warning";
      } else {
        powerStatus = "ok";
      }
    }
  }
  const totalWeight =
    activeProject.boardPedals.reduce(
      (sum, p) => sum + (Number(p.weight) || 0),
      0
    ) +
    (activeProject.selectedBoards || []).reduce(
      (sum, b) => sum + (Number(b.weight) || 0),
      0
    );

  const formattedWeight = formatWeight(totalWeight, units, language);
  const weightValue = formattedWeight.replace(/ ?(kg|lb|oz|g)$/, "");
  const weightUnit = formattedWeight.match(/(kg|lb|oz|g)$/)?.[0] ?? "";

  const handleStageClick = (e: any) => {
    if (replacementPreview) return;
    if (e.target === e.target.getStage()) {
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
      closeSearchMenus();
      setContactOpen(false);
      setShowPower(false);
      setShowExportPanel(false);
      setShowList(false);
      setShowBoardsMenu(false);
      setShowSettings(false);
      setShowCableMenu(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const boardsMenuRef = useRef<HTMLDivElement>(null);
  const boardsButtonRef = useRef<HTMLButtonElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const wheelTimeout = useRef<any>(null);
  const marginRefs = useRef<Record<number, any>>({});
  const checkCollision = (id1: number, id2: number) => {
    const n1 = marginRefs.current[id1];
    const n2 = marginRefs.current[id2];

    if (!n1 || !n2) return false;

    const r1 = n1.getClientRect({ skipTransform: false });
    const r2 = n2.getClientRect({ skipTransform: false });

    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  };
  const lastRenderedPos = useRef<{ x: number; y: number } | null>(null);
  const draggingPedalId = useRef<number | null>(null);
  const lastStablePos = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const [isPinching, setIsPinching] = useState(false);

  const pinchAnchor = useRef<{ x: number; y: number } | null>(null);
  const pinchStartScale = useRef<number>(1);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const hasStage = stageSize.width > 0 && stageSize.height > 0;
  const showAlignmentGrid = !viewer && canvasBg === "neutral";

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!hasStage || !showAlignmentGrid || !stage || !container) return;

    function updateGrid() {
      if (!container) return;

      const step = 24 * stage.scaleX();
      // Keep dots on the same grid as the canvas zooms out.
      const visibleStep = step * 2 ** Math.max(0, Math.ceil(Math.log2(12 / step)));
      container.style.setProperty("--alignment-grid-step", `${visibleStep}px`);
      container.style.setProperty("--alignment-grid-x", `${stage.x()}px`);
      container.style.setProperty("--alignment-grid-y", `${stage.y()}px`);
    }

    updateGrid();
    stage.on("xChange.alignmentGrid yChange.alignmentGrid scaleXChange.alignmentGrid", updateGrid);
    return () => stage.off(".alignmentGrid");
  }, [hasStage, showAlignmentGrid]);


  useEffect(() => {
    if (!getCenterRef) return;



    getCenterRef.current = () => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };

      const scale = stage.scaleX();
      const stagePos = stage.position();

      const centerX =
        (stageSize.width / 2 - stagePos.x) / scale;

      const centerY =
        (stageSize.height / 2 - stagePos.y) / scale;

      return { x: centerX, y: centerY };
    };
  }, [getCenterRef, stageSize.width, stageSize.height]);


  const [hoveredPedalId, setHoveredPedalId] = useState<number | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showJacksMargin, setShowJacksMargin] = useState(false);
  const [showSignalChain, setShowSignalChain] = useState(false);
  const [signalOrder, setSignalOrder] = useState<number[]>([]);
  const [showSignalPath, setShowSignalPath] = useState(false);
  const [showCableMenu, setShowCableMenu] = useState(false);
  const [showBoardsMenu, setShowBoardsMenu] = useState(false);
  useEffect(() => {
    if (!showBoardsMenu) return;

    const handleClickOutsideBoards = (e: MouseEvent) => {
      const target = e.target as Node;

      if (boardsMenuRef.current?.contains(target)) return;
      if (boardsButtonRef.current?.contains(target)) return;
      if (desktopToolbarHost?.contains(target)) return;

      setShowBoardsMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutsideBoards);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideBoards);
    };
  }, [showBoardsMenu, desktopToolbarHost]);




  const [collisionReady, setCollisionReady] = useState(false);
  const [, forceCollisionRender] = useState<number>(0);
  const [showList, setShowList] = useState(false);
  const [showOutputs, setShowOutputs] = useState(false);
  const [showPower, setShowPower] = useState(false);
  const desktopRightPanelOpen =
    !isMobile &&
    (
      showBoardsMenu ||
      showCableMenu ||
      showPower ||
      showExportPanel ||
      showSettings ||
      (Boolean(desktopToolbarHost) && helpOpen)
    );

  useEffect(() => {
    if (!desktopRightPanelOpen) return;
    const handleOutsidePanel = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rightSidebarRef.current?.contains(target)) return;
      if (desktopPanelHost?.contains(target)) return;
      setShowBoardsMenu(false);
      setShowCableMenu(false);
      setShowPower(false);
      setShowExportPanel(false);
      setShowSettings(false);
      setShowList(false);
      setHelpOpen(false);
      setRailExpanded(false);
      try { sessionStorage.setItem("myb-tool-rail-expanded", "false"); } catch { }
    };
    document.addEventListener("pointerdown", handleOutsidePanel, true);
    return () => document.removeEventListener("pointerdown", handleOutsidePanel, true);
  }, [desktopRightPanelOpen, desktopPanelHost]);

  useLayoutEffect(() => {
    if (isMobile || !rightSidebarRef.current) return;

    const sidebarOpen =
      showBoardsMenu ||
      showCableMenu ||
      showPower ||
      showExportPanel ||
      showSettings ||
      (Boolean(desktopToolbarHost) && helpOpen);

    if (!sidebarOpen) return;

    const sidebar = rightSidebarRef.current;

    const animation = sidebar.animate(
      [
        {
          transform: "translateX(100%)",
        },
        {
          transform: "translateX(0)",
        },
      ],
      {
        duration: 550,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }
    );

    return () => {
      animation.cancel();
    };
  }, [
    isMobile,
    showBoardsMenu,
    showCableMenu,
    showPower,
    showExportPanel,
    showSettings,
    helpOpen,
    desktopToolbarHost,
  ]);

  const mobileCanvasPanelOpen =
    isMobile &&
    (
      showBoardsMenu ||
      showCableMenu ||
      showPower ||
      showExportPanel ||
      showSettings ||
      helpOpen
    );

  useEffect(() => {
    setMobileCanvasPanelOpen?.(mobileCanvasPanelOpen);

    if (mobileCanvasPanelCloseRef) {
      mobileCanvasPanelCloseRef.current = mobileCanvasPanelOpen
        ? () => {
          closeBottomPanels();
          setShowMobileMenu(false);
          setRenderMobileMenu(false);
        }
        : null;
    }

    if (mobileCanvasPanelOpen) {
      setShowMobileMenu(false);
      setRenderMobileMenu(false);
    }
  }, [
    mobileCanvasPanelOpen,
    setMobileCanvasPanelOpen,
    mobileCanvasPanelCloseRef,
  ]);
  const mobileFullPanelClass = `
  z-[100]
  fixed
  left-0
  right-0
  bottom-[env(safe-area-inset-bottom)]
  top-[calc(64px+env(safe-area-inset-top))]
  overflow-y-auto
  overflow-x-hidden
  bg-zinc-800
`;
  const desktopRightSidebarClass = `
  z-[100]
  absolute
  top-0
  right-0
  bottom-0
  w-[272px]
  box-border
  bg-zinc-800
  overflow-y-auto
  overflow-x-hidden
  overscroll-contain
  p-4
  [scrollbar-width:none]
  [-ms-overflow-style:none]
  [&::-webkit-scrollbar]:hidden
`;
  const desktopRightSidebarStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(140, 140, 150, 0.3)",
    position: desktopToolbarHost ? "absolute" : "fixed",
    top: 0,
    bottom: 0,
    right: 0,
    maxWidth: "100%",
    marginTop: 0,
    pointerEvents: "auto",
    width: "340px",
    boxSizing: "border-box",
  };
  const [hoveredBoardId, setHoveredBoardId] = useState<number | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<{
    x: number;
    y: number;
    halfWidth: number;
    bottom: number;
  } | null>(null);

  // Quand on change de pedalboard, une sélection appartenant à l'ancien
  // projet ne doit jamais survivre dans le nouveau canvas.
  // useLayoutEffect remet aussi l'overlay à zéro avant le paint suivant,
  // ce qui évite que les boutons d'action apparaissent brièvement au mauvais endroit.
  const previousActiveProjectIdRef = useRef(activeProjectId);

  useLayoutEffect(() => {
    if (previousActiveProjectIdRef.current === activeProjectId) {
      return;
    }

    previousActiveProjectIdRef.current = activeProjectId;

    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);
    setOverlayPosition(null);
  }, [
    activeProjectId,
    setSelectedInstanceId,
    setSelectedBoardInstanceId,
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [isStageDragging, setIsStageDragging] = useState(false);
  const [localSignalPath, setLocalSignalPath] = useState<any[]>(
    activeProject.signalPath || []
  );

  const [pendingSignalPoint, setPendingSignalPoint] =
    useState<SignalPoint | null>(null);

  useEffect(() => {
    setLocalSignalPath(activeProject.signalPath || []);
    setPendingSignalPoint(null);
  }, [activeProjectId]);

  const setSignalPath = (path: any[]) => {
    setLocalSignalPath(path);

    updateActiveProject({
      signalPath: path,
    });
  };

  useEffect(() => {
    const existingPedalIds = new Set(
      activeProject.boardPedals.map((p: AnyRow) => p.instanceId)
    );

    const cleanedSignalPath = localSignalPath.filter((c: any) => {
      return existingPedalIds.has(c.from) && existingPedalIds.has(c.to);
    });

    if (cleanedSignalPath.length === localSignalPath.length) return;

    setLocalSignalPath(cleanedSignalPath);
    setPendingSignalPoint(null);

    updateActiveProject({
      signalPath: cleanedSignalPath,
    } as any);
  }, [activeProject.boardPedals, localSignalPath]);

  const handleSignalPointClick = (point: SignalPoint) => {
    if (pendingSignalPoint === null) {
      setPendingSignalPoint(point);
      return;
    }

    if (
      pendingSignalPoint.id === point.id &&
      pendingSignalPoint.kind === point.kind
    ) {
      setPendingSignalPoint(null);
      return;
    }

    const newPath = [
      ...localSignalPath,
      {
        id: `${pendingSignalPoint.id}-${point.id}-${Date.now()}`,
        from: pendingSignalPoint.id,
        to: point.id,
        fromKind: pendingSignalPoint.kind,
        toKind: point.kind,
      },
    ];

    setSignalPath(newPath);
    setPendingSignalPoint(null);
  };

  const removeSignalConnection = (id: string) => {
    setSignalPath(localSignalPath.filter((c) => c.id !== id));
  };

  /* ================= MEASURE STAGE ================= */
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      setStageSize({
        width: rect.width,
        height: rect.height,
      });

      if (onStageSizeChange) {
        onStageSizeChange({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!showJacksMargin) {
      setCollisionReady(false);
      return;
    }

    const t = setTimeout(() => {
      setCollisionReady(true);
    }, 50);

    return () => clearTimeout(t);
  }, [showJacksMargin, activeProject.boardPedals.length]);

  /* ================= AUTO FIT + CENTER VIEWER ================= */
  useEffect(() => {
    if (!viewer) return;
    if (!stageRef.current) return;
    if (stageSize.width === 0) return;

    const stage = stageRef.current;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const allItems = [
      ...(activeProject.boardPedals || []),
      ...(activeProject.selectedBoards || [])
    ];

    if (!allItems.length) return;

    allItems.forEach((p: any) => {
      const size = displaySizes[p.instanceId];
      if (!size) return;

      const isVertical = (p.rotation || 0) % 180 !== 0;

      const w = isVertical ? size.h : size.w;
      const h = isVertical ? size.w : size.h;

      minX = Math.min(minX, p.x - w / 2);
      minY = Math.min(minY, p.y - h / 2);
      maxX = Math.max(maxX, p.x + w / 2);
      maxY = Math.max(maxY, p.y + h / 2);
    });

    if (!isFinite(minX) || !isFinite(minY)) return;

    const boardWidth = maxX - minX;
    const boardHeight = maxY - minY;

    if (boardWidth === 0 || boardHeight === 0) return;

    const scaleX = stageSize.width / boardWidth;
    const scaleY = stageSize.height / boardHeight;

    const scale = Math.min(scaleX, scaleY) * 0.75; // 🔥 un peu plus clean que 0.8

    stage.scale({ x: scale, y: scale });

    const boardCenterX = (minX + maxX) / 2;
    const boardCenterY = (minY + maxY) / 2;

    const newX = stageSize.width / 2 - boardCenterX * scale;
    const newY = stageSize.height / 2 - boardCenterY * scale;

    stage.position({ x: newX, y: newY });
    stage.batchDraw();

  }, [
    viewer,
    stageSize.width,
    stageSize.height,
    activeProject.boardPedals,
    activeProject.selectedBoards,
    displaySizes
  ]);

  /* ================= OVERLAY POSITION ================= */

  const updateOverlayPosition = useCallback(() => {
    const outline = stageRef.current?.findOne(".selected-item-outline");
    if (!outline) {
      setOverlayPosition(null);
      return;
    }

    const { x, y, width, height } = outline.getClientRect();
    setOverlayPosition({
      x: x + width / 2,
      y,
      halfWidth: width / 2,
      bottom: y + height,
    });
  }, []);

  useLayoutEffect(() => {
    updateOverlayPosition();
  }, [
    updateOverlayPosition,
    selectedInstanceId,
    selectedBoardInstanceId,
    activeProject.boardPedals,
    activeProject.selectedBoards,
    displaySizes,
    currentZoom,
    activeProject.stageX,
    activeProject.stageY,
    stageSize.width,
    stageSize.height,
    isDragging,
  ]);

  const getVisibleBounds = () => {
    const stage = stageRef.current;
    if (!stage) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const scale = stage.scaleX();

    const visibleWidth = stageSize.width / scale;
    const visibleHeight = stageSize.height / scale;

    const offsetX = -stage.x() / scale;
    const offsetY = -stage.y() / scale;

    return {
      minX: offsetX,
      minY: offsetY,
      maxX: offsetX + visibleWidth,
      maxY: offsetY + visibleHeight,
    };
  };


  const getDragBoundsLocal = (
    id: number,
    rotation: number,
    pos: { x: number; y: number }
  ) => {
    const size = displaySizes[id];
    if (!size) return pos;

    const scale = currentZoom / 100;
    const isVertical = (rotation / 90) % 2 !== 0;

    const w = isVertical ? size.h : size.w;
    const h = isVertical ? size.w : size.h;

    const stageW = stageSize.width / scale;
    const stageH = stageSize.height / scale;

    return {
      x: Math.max(w / 2, Math.min(stageW - w / 2, pos.x)),
      y: Math.max(h / 2, Math.min(stageH - h / 2, pos.y)),
    };
  };

  const pointInRotatedRect = (
    point: { x: number; y: number },
    item: AnyRow,
    size: { w: number; h: number }
  ) => {

    const angle = -((item.rotation || 0) * Math.PI) / 180;

    const dx = point.x - item.x;
    const dy = point.y - item.y;

    const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
    const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

    return (
      localX >= -size.w / 2 &&
      localX <= size.w / 2 &&
      localY >= -size.h / 2 &&
      localY <= size.h / 2
    );
  };

  const selectPedalBehindBoard = () => {
    const stage = stageRef.current;
    if (!stage) return false;

    const pointer = stage.getPointerPosition();
    if (!pointer) return false;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();

    const point = transform.point(pointer);

    const pedalsFromTop = [...activeProject.boardPedals].sort((a, b) => {
      return (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0);
    });

    const found = pedalsFromTop.find((p) => {
      const size = displaySizes[p.instanceId];
      if (!size) return false;

      return pointInRotatedRect(point, p, size);
    });

    if (!found) return false;

    setSelectedInstanceId(found.instanceId);
    setSelectedBoardInstanceId(null);

    return true;
  };

  const canvasItems: AnyRow[] = [
    ...(activeProject.selectedBoards || []).map((item: AnyRow) => ({
      ...item,
      kind: "board",
    })),
    ...(activeProject.boardPedals || []).map((item: AnyRow) => ({
      ...(replacementPreview && replacementPreview.pedal.instanceId === item.instanceId ? replacementPreview.pedal : item),
      kind: "pedal",
    })),
  ].sort((a: AnyRow, b: AnyRow) => {
    return (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0);
  });


  const menuTarget = canvasItems.find((item) => item.kind === "board"
    ? item.instanceId === selectedBoardInstanceId
    : item.instanceId === selectedInstanceId);
  const isBoardTarget = menuTarget?.kind === "board";
  const canReplace = Boolean(menuTarget && !isBoardTarget && !isPowerSupply(menuTarget) && replacePedal);
  const canShowMobileInfo = isMobile && menuTarget && !isBoardTarget &&
    !isPowerSupply(menuTarget) && menuTarget.brand !== "Custom" && menuTarget.slug !== "custom-upload";
  const actionHeight = stageSize.height - (isMobile ? 68 : 0);
  const quickWidth = Math.max(0, Math.min(isMobile ? 144 : 112, stageSize.width - 16));
  const quickHeight = isMobile ? 44 : 38;
  const menuWidth = Math.max(0, Math.min(isMobile ? 156 : 192, stageSize.width - 16));
  const menuHeight = isMobile ? (canReplace ? 233 : 196) + (canShowMobileInfo ? 37 : 0) : (canReplace ? 179 : 151);
  const menuGap = 6;
  const actionPositions = menuTarget && overlayPosition?.halfWidth !== undefined &&
    overlayPosition.bottom !== undefined && overlayPosition.bottom >= 0 &&
    overlayPosition.y < actionHeight && quickWidth > 0 && actionHeight >= quickHeight + 16 ? (() => {
      const right = overlayPosition.x + overlayPosition.halfWidth;
      const left = overlayPosition.x - overlayPosition.halfWidth;
      if (right < 0 || left >= stageSize.width) return null;

      const above = overlayPosition.y - menuGap - quickHeight;
      const quickTop = Math.max(8, Math.min(above >= 8 ? above : overlayPosition.bottom + menuGap, actionHeight - quickHeight - 8));
      const quickLeft = Math.max(8, Math.min(overlayPosition.x - quickWidth / 2, stageSize.width - quickWidth - 8));
      const rightMenuLeft = right + menuGap;
      const leftMenuLeft = left - menuGap - menuWidth;
      const fitsRight = rightMenuLeft + menuWidth <= stageSize.width - 8;
      const fitsLeft = leftMenuLeft >= 8;
      const maxHeight = Math.min(menuHeight, actionHeight - 16);
      const menuTop = Math.max(8, Math.min(overlayPosition.y, actionHeight - 46));
      const spaceBelow = actionHeight - quickTop - quickHeight - menuGap - 8;
      const spaceAbove = quickTop - menuGap - 8;
      const side = fitsRight ? "right" : fitsLeft ? "left" : spaceBelow >= spaceAbove ? "below" : "above";
      const menu = side === "right" || side === "left"
        ? {
          left: side === "right" ? rightMenuLeft : leftMenuLeft,
          top: menuTop,
          width: menuWidth,
          maxHeight: Math.min(maxHeight, actionHeight - menuTop - 8),
        }
        : {
          left: Math.min(quickLeft, stageSize.width - menuWidth - 8),
          top: side === "below" ? quickTop + quickHeight + menuGap : undefined,
          bottom: side === "above" ? stageSize.height - quickTop + menuGap : undefined,
          width: menuWidth,
          maxHeight: Math.min(maxHeight, side === "below" ? spaceBelow : spaceAbove),
        };

      return { quick: { left: quickLeft, top: quickTop, width: quickWidth }, menu };
    })() : null;

  const selectedLayer = menuTarget
    ? canvasItems.findIndex((item) => item.instanceId === menuTarget.instanceId) : -1;
  const selectedSize = menuTarget && displaySizes[menuTarget.instanceId];
  const selectedBox = menuTarget && selectedSize ? getOrientedBox(menuTarget, selectedSize) : null;

  function overlappingLayer(direction: -1 | 1): number | undefined {
    if (!selectedBox || selectedLayer < 0) return undefined;
    for (let i = selectedLayer + direction; i >= 0 && i < canvasItems.length; i += direction) {
      const item = canvasItems[i];
      const size = displaySizes[item.instanceId];
      if (size && (getSATOverlap(selectedBox, getOrientedBox(item, size))?.overlap ?? 0) > 0.001) {
        return item.instanceId;
      }
    }
    return undefined;
  }

  const forwardLayer = overlappingLayer(1);
  const backLayer = overlappingLayer(-1);

  const itemId = menuTarget?.instanceId;
  const itemActions = itemId === undefined ? [] : [
    { key: "pedal.actions.rotate", Icon: RotateCw, hint: "R", shortcut: "R", run: () => (isBoardTarget ? rotateBoard : rotatePedal)(itemId) },
    ...(canShowMobileInfo ? [
      { key: "pedal.actions.info", Icon: Info, run: () => openMobileItemInfo(), hint: "", shortcut: "" },
    ] : []),
    { key: "replacement.duplicate", Icon: CopyPlus, hint: "D", shortcut: "D", run: () => duplicateCanvasItem(itemId, isBoardTarget ? "board" : "pedal") },
    {
      key: "replacement.forward", Icon: ArrowUp, hint: "↑", shortcut: "ArrowUp",
      run: moveCanvasItemOneLayer && forwardLayer !== undefined ? () => moveCanvasItemOneLayer(itemId, forwardLayer) : undefined
    },
    {
      key: "replacement.back", Icon: ArrowDown, hint: "↓", shortcut: "ArrowDown",
      run: moveCanvasItemOneLayer && backLayer !== undefined ? () => moveCanvasItemOneLayer(itemId, backLayer) : undefined
    },
    ...(canReplace && replacePedal ? [
      {
        key: "replacement.replace", Icon: Replace, hint: "⇧R", shortcut: "Shift+R",
        run: () => replacePedal(itemId)
      },
    ] : []),
    {
      key: "pedal.actions.delete", Icon: Trash2, hint: "Del", shortcut: "Delete Backspace",
      run: () => (isBoardTarget ? deleteBoard : deletePedal)(itemId)
    },
  ];
  const showItemMenu = !viewer && !replacementPreview && menuTarget && actionPositions &&
    !isDragging && !isStageDragging && !isPinching &&
    !(isMobile && (mobileSidebarOpen || mobileCanvasPanelOpen));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (viewer || replacementPreview || event.defaultPrevented || event.isComposing || event.repeat ||
        !containerRef.current?.getClientRects().length || document.querySelector("dialog[open]")) return;
      const target = event.target;
      if (target instanceof HTMLElement &&
        (target.closest("input, textarea, select") || target.isContentEditable)) return;

      const key = event.key;
      const upperKey = key.toUpperCase();
      if (showItemMenu) {
        if (key === "Escape" && itemMenuExpanded) {
          event.preventDefault();
          setItemMenuExpanded(false);
          moreActionsButton.current?.focus();
          return;
        }

        const shortcut = [
          event.metaKey && "Meta", event.ctrlKey && "Control", event.altKey && "Alt",
          event.shiftKey && "Shift", key.length === 1 ? upperKey : key,
        ].filter(Boolean).join("+");
        const action = itemActions.find(({ shortcut: keys }) => keys.split(" ").includes(shortcut));
        if (action?.run) {
          event.preventDefault();
          action.run();
        }
        return;
      }

      // Preserve Backspace for boards and power supplies when the menu is offscreen.
      if (key === "Backspace" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        if (selectedInstanceId !== null && menuTarget && isPowerSupply(menuTarget)) {
          event.preventDefault();
          deletePedal(selectedInstanceId);
        } else if (selectedBoardInstanceId !== null) {
          event.preventDefault();
          deleteBoard(selectedBoardInstanceId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });


  const toolRailButtons = (
    ([
      { id: "boards", label: t("canvasControls.boards"), Icon: null, open: showBoardsMenu },
      { id: "cables", label: t("cables.title"), Icon: Cable, open: showCableMenu },
      { id: "power", label: t("canvasControls.power"), Icon: Zap, open: showPower },
      { id: "export", label: t("export.button"), Icon: Upload, open: showExportPanel },
      { id: "settings", label: t("settings.title"), Icon: null, open: showSettings },
    ] as const).map(({ id, label, Icon, open }) => (
      <React.Fragment key={id}>
        <button type="button" className="myb-tool-rail-button"
          aria-label={label} title={isMobile || railExpanded ? undefined : label} aria-expanded={open} data-active={open}
          ref={id === "boards" ? boardsButtonRef : undefined}
          onClick={() => toggleUnifiedPanel(id)}>
          {Icon ? (
            <Icon size={24} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Image
              src={id === "boards" ? boardIconSrc : settingsIconSrc}
              alt=""
              width={24}
              height={24}
              draggable={false}
              className="size-6 shrink-0 object-contain"
            />
          )}
          {!isMobile && railExpanded && <span className="myb-tool-rail-label">{label}</span>}
        </button>
      </React.Fragment>
    ))
  );

  function tapCanvasBoard(id: number) {
    if (isMobile && selectedBoardInstanceId === id) {
      setMobileCanvasPanelOpen?.(false);
      setMobileSidebarOpen(true);
    }
    setSelectedBoardInstanceId(id);
    setSelectedInstanceId(null);
  }

  function openMobileItemInfo() {
    setItemMenuExpanded(false);
    setMobileCanvasPanelOpen?.(false);
    setMobileSidebarOpen(true);
  }

  function tapCanvasPedal(id: number) {
    if (isMobile && selectedInstanceId === id && menuTarget?.instanceId === id) {
      openMobileItemInfo();
    }
    setSelectedInstanceId(id);
    setSelectedBoardInstanceId(null);
  }



  return (
    <div
      ref={containerRef}
      className={`
  relative w-full h-full overflow-hidden
  ${isMobile ? "pb-6 touch-none" : desktopToolbarHost ? "" : "pb-20"}
  ${canvasBg === "neutral" ? "bg-canvas" : ""}
  ${showAlignmentGrid ? pedalActions.neutralGrid : ""}
`}
      style={
        canvasBg === "neutral"
          ? undefined
          : {
            backgroundImage: `url(${selectedBackgroundSrc})`,
            backgroundSize: "auto 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }
      }
    >





      {!viewer && !isMobile && desktopToolbarHost && (
        <div ref={setDesktopPanelHost} className="absolute inset-0 z-[100] pointer-events-none" />
      )}

      {!viewer && !isMobile && desktopToolbarHost && !desktopRightPanelOpen && createPortal(
        <nav
          aria-label={t("canvasControls.boards")}
          className="myb-tool-rail"
          data-expanded={railExpanded}
          style={{
            position: "absolute", top: "50%", right: 12,
            transform: "translateY(-50%)", width: railWidth,
            pointerEvents: "auto", zIndex: 120,
            background: "var(--zinc-900)",
            color: "var(--foreground, #ededed)",
            border: "1px solid var(--zinc-700, #3f3f46)",
            borderRadius: 14, padding: 5, boxSizing: "border-box",
            maxHeight: "calc(100% - 24px)", overflowY: "auto",
            boxShadow: "0 6px 22px rgba(0,0,0,0.14)",
          }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          <style>{`
.myb-tool-rail {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  pointer-events: auto;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid var(--zinc-700);
  border-radius: 14px;
  background: var(--zinc-900);
  color: var(--foreground);
  box-shadow: 0 6px 22px rgb(0 0 0 / 14%);
  max-height: calc(100% - 24px);
  overflow-y: auto;
  scrollbar-width: none;
}
.myb-tool-rail::-webkit-scrollbar { display: none; }
.myb-tool-rail-actions { display: flex; flex-direction: column; gap: 4px; }
.myb-tool-rail-button, .myb-tool-rail-toggle {
  display: flex;
  align-items: center;
  width: 100%;
  height: 44px;
  flex-shrink: 0;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  transition: background-color 140ms, border-color 140ms;
}
.myb-tool-rail-button { gap: 12px; padding: 0 9px; text-align: left; }
.myb-tool-rail-button svg, .myb-tool-rail-toggle svg { flex-shrink: 0; }
.myb-tool-rail-header { display: flex; align-items: center; justify-content: space-between; height: 32px; margin-bottom: 5px; }
.myb-tool-rail-title { padding-left: 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--zinc-400); }
.myb-tool-rail-toggle { justify-content: center; width: 44px; height: 32px; margin: 0; margin-left: auto; padding: 0; color: var(--zinc-400); }

.myb-tool-rail-button:hover, .myb-tool-rail-toggle:hover { background: var(--zinc-700); }

.myb-tool-rail-button[data-active="true"] { background: var(--zinc-700); border-color: var(--zinc-500); }
.myb-tool-rail-button:focus-visible, .myb-tool-rail-toggle:focus-visible { outline: 2px solid var(--zinc-500); outline-offset: -2px; }
.myb-tool-rail-label { font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.myb-tool-rail-divider { height: 1px; background: var(--zinc-700); margin: 5px 4px; }
html.light .myb-tool-rail { box-shadow: 0 6px 22px rgb(0 0 0 / 8%); }

html.light .myb-tool-rail-button:hover,
html.light .myb-tool-rail-toggle:hover {
  background: var(--zinc-200);
}

html.light .myb-tool-rail-button[data-active="true"] { background: var(--zinc-700); border-color: var(--zinc-500); }
`}</style>
          <div id="myb-tool-rail-actions" className="myb-tool-rail-actions">
            {toolRailButtons}
          </div>
        </nav>, desktopToolbarHost
      )}

      {!viewer && isMobile && !mobileSidebarOpen && !mobileCanvasPanelOpen && (
        <nav
          className={`myb-tool-rail ${pedalActions.mobileRail}`}
          style={{ background: "var(--zinc-900)" }}
          aria-label={t("canvasControls.tools")}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="myb-tool-rail-actions">{toolRailButtons}</div>
        </nav>
      )}

      {/* --- MODE VIEWER (CENTER BOTTOM) --- */}
      {viewer && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
          {/* ZOOM */}
          <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <button onClick={zoomOut} disabled={isMinZoom} className="absolute left-2 flex items-center justify-center w-6 h-6 hover:text-blue-400 disabled:text-zinc-600">
              {isMinZoom ? <span className="text-[9px] tracking-wider text-zinc-500">{t("canvasControls.min")}</span> : <Minus size={14} />}
            </button>
            <span className="text-[12px] font-black font-mono tabular-nums">{displayZoomPercent}%</span>
            <button onClick={zoomIn} disabled={isMaxZoom} className="absolute right-2 flex items-center justify-center w-6 h-6 hover:text-blue-400 disabled:text-zinc-600">
              {isMaxZoom ? <span className="text-[9px] tracking-wider text-zinc-500">{t("canvasControls.max")}</span> : <Plus size={14} />}
            </button>
          </div>

          {/* TOTAL DRAW (mA) */}
          <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <Zap className="absolute left-3 size-4 text-yellow-500" />
            <span className="text-[12px] font-black font-mono tabular-nums">
            </span>
            <span className="absolute right-2 text-[9px] text-zinc-500 font-bold">mA</span>
          </div>

          {/* TOTAL WEIGHT */}
          <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
            <Weight className="absolute left-3 size-4 text-red-400" />
            <span className="text-[12px] font-black font-mono tabular-nums">{weightValue}</span>
            <span className="absolute right-3 text-[10px] text-zinc-500">{weightUnit}</span>
          </div>

          {/* LIST SETUP */}
          <div className="relative">
            <button onClick={() => {
              setShowList(v => !v);
              setShowBoardsMenu(false);
              setShowPower(false);
              setShowExportPanel(false);
              setShowSettings(false);
              setShowSignalPath(false);
            }} className="relative flex items-center justify-center gap-2 h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl text-[11px] font-mono font-bold uppercase transition-all hover:border-blue-500">
              <List size={16} className="text-blue-400" /> {t("canvasControls.setup")}
            </button>
            {showList && (
              <>
                <div className="fixed inset-0 z-40 pointer-events-none" />
                <div className="absolute bottom-12 left-0 z-50">
                  <div className="w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs uppercase tracking-wider font-bold">{t("canvasControls.pedalboard")}</div>
                    {[...activeProject.boardPedals].sort((a, b) => (a.brand || "").localeCompare(b.brand || "")).map((p, i) => (
                      <div key={i} className="text-sm "><span className="text-zinc-400">- {p.brand || "Custom"}</span> {p.name || "Unnamed"}</div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {showItemMenu && (
        <div
          role="group"
          aria-label={t("pedal.actions.title")}
          data-mobile={isMobile || undefined}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
        >
          <div className={pedalActions.quick} style={actionPositions.quick}>
            {itemActions.filter(({ key }) => key === "pedal.actions.rotate" || key === "pedal.actions.delete")
              .map(({ key, Icon, shortcut, run }) => (
                <button key={key} type="button" className={pedalActions.quickButton} onClick={run}
                  aria-label={t(key)} title={t(key)} aria-keyshortcuts={isMobile ? undefined : shortcut}
                  data-danger={key === "pedal.actions.delete" || undefined}>
                  <Icon size={17} aria-hidden="true" />
                </button>
              ))}
            <button
              ref={moreActionsButton}
              type="button"
              className={pedalActions.quickButton}
              aria-label={t("pedal.actions.more")}
              title={t("pedal.actions.more")}
              aria-expanded={itemMenuExpanded}
              aria-controls={itemMenuExpanded ? itemActionsId : undefined}
              onClick={() => setItemMenuExpanded((expanded) => !expanded)}
            >
              <Ellipsis size={19} aria-hidden="true" />
            </button>
          </div>
          {itemMenuExpanded && (
            <div id={itemActionsId} className={pedalActions.menu} style={actionPositions.menu}>
              {itemActions.map(({ key, Icon, hint, shortcut, run }) => (
                <button key={key} type="button" onClick={run} disabled={!run} aria-keyshortcuts={isMobile ? undefined : shortcut}
                  className={pedalActions.action} data-danger={key === "pedal.actions.delete" || undefined}>
                  <Icon size={17} aria-hidden="true" />
                  <span>{t(key)}</span>
                  {!isMobile && <kbd aria-hidden="true">{hint}</kbd>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODE EDITION (BAS GAUCHE & DROITE) --- */}
      {!viewer && !(isMobile && mobileSidebarOpen) && (
        <>
          <div
            className={!isMobile && desktopToolbarHost ? "contents" : "fixed bottom-6 left-0 right-0 lg:left-76 flex items-center justify-center gap-3 z-50 px-4"}
          >

            {!isMobile && !desktopToolbarHost && (
              <>



                {/* MENU */}
                <div
                  className={`
    z-50
    flex
    gap-2
${isMobile
                      ? "fixed bottom-6 right-4 items-end"
                      : "absolute bottom-0 left-4 flex-row items-center"
                    }
  `}
                >

                  {/* BOUTON MENU */}
                  <div
                    className={`
    relative
    w-[84px]
    h-9
    shrink-0
    flex
    items-center
    justify-center
  `}
                    onMouseEnter={(e) => {
                      const button = e.currentTarget.querySelector("button");

                      if (button) {
                        button.style.width = "76px";
                        button.style.height = "36px";
                      }
                    }}
                    onMouseLeave={(e) => {
                      const button = e.currentTarget.querySelector("button");

                      if (button) {
                        button.style.width = "72px";
                        button.style.height = "32px";
                      }
                    }}
                  >
                    {/* FOND DU BOUTON : lui seul grossit */}
                    <button
                      type="button"
                      onClick={() => {
                        if (showMobileMenu) {
                          // FERMETURE
                          setShowMobileMenu(false);
                          closeBottomPanels();

                          window.setTimeout(() => {
                            setRenderMobileMenu(false);
                          }, 400);
                        } else {
                          // OUVERTURE
                          setRenderMobileMenu(true);

                          requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                              setShowMobileMenu(true);
                            });
                          });
                        }
                      }}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "72px",
                        height: "32px",
                        transform: "translate(-50%, -50%)",
                        transition: "width 140ms ease-out, height 140ms ease-out",
                      }}
                      className="
      bg-zinc-900
      rounded-2xl
      p-0
      cursor-pointer
    "
                    />

                    {/* TEXTE : ne grossit jamais */}
                    <div
                      className="
      relative
      z-10
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                    >
                      Menu
                    </div>
                  </div>

                  {/* TRIANGLE DESKTOP */}
                  {!isMobile && renderMobileMenu && (
                    <div
                      className="w-[10px] h-9 shrink-0 flex items-center justify-center"
                      style={{
                        opacity: showMobileMenu ? 1 : 0,
                        transform: showMobileMenu
                          ? "translateX(0)"
                          : "translateX(-6px)",
                        transition:
                          "opacity 220ms ease-out, transform 220ms ease-out",
                      }}
                    >
                      <div
                        style={{
                          width: "10px",
                          height: "14px",
                          backgroundColor: "#18181b",
                          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                        }}
                      />
                    </div>
                  )}

                  {renderMobileMenu && (
                    <div
                      className={`
      flex
      gap-2
      ${isMobile
                          ? "absolute right-0 flex-col w-[150px]"
                          : "flex-row w-auto"
                        }
    `}
                      style={
                        isMobile
                          ? {
                            bottom: "calc(100% + 8px)",
                          }
                          : undefined
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* PEDALBOARDS */}
                      <div
                        className={`
  relative
  h-9
  shrink-0
  flex
  items-center
  px-4
  ${isMobile ? "w-full" : "w-auto"}
`}
                        style={{
                          opacity: showMobileMenu ? 1 : 0,
                          transform: showMobileMenu
                            ? "translate(0, 0)"
                            : isMobile
                              ? "translateY(16px)"
                              : "translateX(-24px)",
                          transition: "opacity 180ms ease-out, transform 180ms ease-out",
                          transitionDelay: isMobile
                            ? showMobileMenu ? "200ms" : "0ms"
                            : showMobileMenu ? "0ms" : "200ms",
                          pointerEvents: showMobileMenu ? "auto" : "none",
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "calc(100% + 4px)";
                            button.style.height = "36px";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "100%";
                            button.style.height = "32px";
                          }
                        }}
                      >
                        {/* FOND DU BOUTON : lui seul grossit */}
                        <button
                          type="button"
                          onClick={() => {
                            closeBottomPanels();
                            setShowBoardsMenu(true);
                          }}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "32px",
                            transform: "translate(-50%, -50%)",
                            transition: "width 140ms ease-out, height 140ms ease-out",
                          }}
                          className="
      bg-zinc-900
      border border-zinc-800
      rounded-2xl
      p-0
      cursor-pointer
    "
                        />

                        {/* CONTENU : ne grossit jamais */}
                        <div
                          className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                        >
                          <Image src={boardIconSrc} alt="" width={18} height={18}
                            draggable={false} className="size-[18px] shrink-0 object-contain" />

                          {t("canvasControls.boards")}
                        </div>
                      </div>

                      {/* CÂBLES */}
                      <div
                        className={`
  relative
  h-9
  shrink-0
  flex
  items-center
  px-4
  ${isMobile ? "w-full" : "w-auto"}
`}
                        style={{
                          opacity: showMobileMenu ? 1 : 0,
                          transform: showMobileMenu
                            ? "translateX(0)"
                            : isMobile
                              ? "translateX(16px)"
                              : "translateX(-24px)",
                          transition: "opacity 180ms ease-out, transform 180ms ease-out",
                          transitionDelay: isMobile
                            ? showMobileMenu ? "150ms" : "50ms"
                            : showMobileMenu ? "50ms" : "150ms",
                          pointerEvents: showMobileMenu ? "auto" : "none",
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "calc(100% + 4px)";
                            button.style.height = "36px";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "100%";
                            button.style.height = "32px";
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeBottomPanels();
                            setShowCableMenu(true);
                          }}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "32px",
                            transform: "translate(-50%, -50%)",
                            transition: "width 140ms ease-out, height 140ms ease-out",
                          }}
                          className="
      bg-zinc-900
      border border-zinc-800
      rounded-2xl
      p-0
      cursor-pointer
    "
                        />

                        <div
                          className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                        >
                          <Cable size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />

                          {t("canvasControls.cables")}
                        </div>
                      </div>
                      {/* ALIMENTATION */}
                      <div
                        className={`
  relative
  h-9
  shrink-0
  flex
  items-center
  px-4
  ${isMobile ? "w-full" : "w-auto"}
`}
                        style={{
                          opacity: showMobileMenu ? 1 : 0,
                          transform: showMobileMenu
                            ? "translateX(0)"
                            : isMobile
                              ? "translateX(16px)"
                              : "translateX(-24px)",
                          transition: "opacity 180ms ease-out, transform 180ms ease-out",
                          transitionDelay: "100ms",
                          pointerEvents: showMobileMenu ? "auto" : "none",
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "calc(100% + 4px)";
                            button.style.height = "36px";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "100%";
                            button.style.height = "32px";
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeBottomPanels();
                            setShowPower(true);
                          }}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "32px",
                            transform: "translate(-50%, -50%)",
                            transition: "width 140ms ease-out, height 140ms ease-out",
                          }}
                          className="
      bg-zinc-900
      border border-zinc-800
      rounded-2xl
      p-0
      cursor-pointer
    "
                        />

                        <div
                          className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                        >
                          <Zap size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />

                          {t("canvasControls.power")}
                        </div>
                      </div>

                      {/* EXPORT */}
                      <div
                        className={`
  relative
  h-9
  shrink-0
  flex
  items-center
  px-4
  ${isMobile ? "w-full" : "w-auto"}
`}
                        style={{
                          opacity: showMobileMenu ? 1 : 0,
                          transform: showMobileMenu
                            ? "translateX(0)"
                            : isMobile
                              ? "translateX(16px)"
                              : "translateX(-24px)",
                          transition: "opacity 180ms ease-out, transform 180ms ease-out",
                          transitionDelay: isMobile
                            ? showMobileMenu ? "50ms" : "150ms"
                            : showMobileMenu ? "150ms" : "50ms",
                          pointerEvents: showMobileMenu ? "auto" : "none",
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "calc(100% + 4px)";
                            button.style.height = "36px";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "100%";
                            button.style.height = "32px";
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeBottomPanels();
                            setShowExportPanel(true);
                          }}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "32px",
                            transform: "translate(-50%, -50%)",
                            transition: "width 140ms ease-out, height 140ms ease-out",
                          }}
                          className="
      bg-zinc-900
      border border-zinc-800
      rounded-2xl
      p-0
      cursor-pointer
    "
                        />

                        <div
                          className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                        >
                          <img
                            src={
                              isLightTheme
                                ? "/images/tab-export-dark.webp"
                                : "/images/tab-export-light.webp"
                            }
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className="w-[18px] h-[18px] object-contain shrink-0"
                          />

                          {t("export.button")}
                        </div>
                      </div>



                      {/* PARAMÈTRES */}
                      <div
                        className={`
  relative
  h-9
  shrink-0
  flex
  items-center
  px-4
  ${isMobile ? "w-full" : "w-auto"}
`}
                        style={{
                          opacity: showMobileMenu ? 1 : 0,
                          transform: showMobileMenu
                            ? "translateX(0)"
                            : isMobile
                              ? "translateX(16px)"
                              : "translateX(-24px)",
                          transition: "opacity 180ms ease-out, transform 180ms ease-out",
                          transitionDelay: isMobile
                            ? showMobileMenu ? "0ms" : "200ms"
                            : showMobileMenu ? "200ms" : "0ms",
                          pointerEvents: showMobileMenu ? "auto" : "none",
                        }}
                        onMouseEnter={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "calc(100% + 4px)";
                            button.style.height = "36px";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const button = e.currentTarget.querySelector("button");

                          if (button) {
                            button.style.width = "100%";
                            button.style.height = "32px";
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeBottomPanels();
                            setShowSettings(true);
                          }}
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            width: "100%",
                            height: "32px",
                            transform: "translate(-50%, -50%)",
                            transition: "width 140ms ease-out, height 140ms ease-out",
                          }}
                          className="
      bg-zinc-900
      border border-zinc-800
      rounded-2xl
      p-0
      cursor-pointer
    "
                        />

                        <div
                          className="
      relative
      z-10
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
      pointer-events-none
      text-[10px]
      font-bold
      uppercase
    "
                        >
                          <img
                            src={settingsIconSrc}
                            alt=""
                            aria-hidden="true"
                            draggable={false}
                            className="w-[18px] h-[18px] object-contain shrink-0"
                          />

                          {t("settings.title")}
                        </div>
                      </div>
                    </div>
                  )}




                </div>

              </>
            )}


            {/* BOARDS */}
            <div className="relative">
              <button
                ref={!isMobile && !desktopToolbarHost ? boardsButtonRef : undefined}
                onClick={() => {
                  setShowBoardsMenu((v) => !v);
                  setShowPower(false);
                  setShowExportPanel(false);
                  setShowList(false);
                  setShowSettings(false);
                  setShowSignalPath(false);
                  setShowCableMenu(false);
                }}
                className={`
  hidden
  items-center justify-center gap-2
  ${isMobile ? "h-8 w-20 text-[9px]" : "h-10 w-28 text-[11px]"}
  bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
  font-mono font-bold uppercase
  transition-all duration-200
  hover:scale-105 hover:border-blue-500 active:scale-95
  cursor-pointer
`}
              >
                <PanelsTopLeft
                  size={16}
                  className={showBoardsMenu ? "text-blue-500" : undefined}
                />

                {t("canvasControls.boards")}
              </button>

              {showBoardsMenu && (
                <>
                  <CanvasPanelsPortal host={!isMobile && desktopToolbarHost ? desktopPanelHost : null}>
                    <div
                      ref={(node) => {
                        boardsMenuRef.current = node;
                        rightSidebarRef.current = node;
                      }}
                      className={
                        isMobile
                          ? mobileFullPanelClass
                          : desktopRightSidebarClass
                      }
                      style={
                        isMobile
                          ? undefined
                          : desktopRightSidebarStyle
                      }
                    >
                      <PedalboardsPanel
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
                        language={language}
                        isLightTheme={isLightTheme}
                        isMobile={isMobile}
                      />
                    </div>
                  </CanvasPanelsPortal>
                </>
              )}
            </div>


            {/* CABLES */}
            <CablesPanel
              desktopPanelHost={desktopToolbarHost && !isMobile ? desktopPanelHost : null}
              t={t}
              isMobile={isMobile}
              isLightTheme={isLightTheme}
              showCableMenu={showCableMenu}
              onToggleCableMenu={() => {
                setShowCableMenu((v) => !v);
                setShowBoardsMenu(false);
                setShowPower(false);
                setShowExportPanel(false);
                setShowList(false);
                setShowSettings(false);
              }}
              showSignalPath={SIGNAL_PATH_ENABLED && showSignalPath}
              setShowSignalPath={setShowSignalPath}
              showJacksMargin={showJacksMargin}
              setShowJacksMargin={setShowJacksMargin}
              showSignalChain={showSignalChain}
              setShowSignalChain={setShowSignalChain}
              boardPedals={activeProject.boardPedals.filter(
                (p: AnyRow) =>
                  String(p.type || "").trim().toLowerCase() !== "power"
              )}
              signalOrder={signalOrder}
              setSignalOrder={setSignalOrder}
              rightSidebarRef={rightSidebarRef}
              mobileFullPanelClass={mobileFullPanelClass}
              desktopRightSidebarClass={desktopRightSidebarClass}
              desktopRightSidebarStyle={desktopRightSidebarStyle}
            />

            {/* POWER*/}


            {/* POWER*/}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPower(v => !v);
                  setShowBoardsMenu(false);
                  setShowExportPanel(false);
                  setShowList(false);
                  setShowCableMenu(false);
                  setShowSettings(false);
                }}
                className={`
  hidden
  items-center justify-center gap-2
  ${isMobile ? "h-8 w-20 text-[9px]" : "h-10 w-28 text-[11px]"}
  bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
  font-mono font-bold uppercase
  transition-all duration-200
  hover:scale-105 hover:border-blue-500 active:scale-95
  cursor-pointer
`}
              >
                <Zap
                  size={16}
                  className={showPower ? "text-yellow-500" : undefined}
                />

                {t("canvasControls.power")}
              </button>


              {showPower && (
                <>
                  <div className="fixed inset-0 z-40 pointer-events-none" />

                  <CanvasPanelsPortal host={!isMobile && desktopToolbarHost ? desktopPanelHost : null}>
                    <div
                      ref={rightSidebarRef}
                      className={
                        isMobile
                          ? `${mobileFullPanelClass}
         p-6 overscroll-contain
         [scrollbar-width:none]
         [-ms-overflow-style:none]
         [&::-webkit-scrollbar]:hidden`
                          : desktopRightSidebarClass
                      }
                      style={
                        isMobile
                          ? undefined
                          : desktopRightSidebarStyle
                      }
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <PowerSetup
                        t={t}
                        isLightTheme={isLightTheme}
                        isMobile={isMobile}
                        powerUnits={powerUnits}
                        pedalAssignments={pedalAssignments}
                        hasPower={hasPower}
                        hasPedals={hasPedals}
                        hasFailingPedal={hasFailingPedal}
                        powerMessage={powerMessage}
                        powerMessageColor={powerMessageColor}
                        isSinglePedal={isSinglePedal}
                        singlePedal={singlePedal}
                        singlePedalVoltage={singlePedalVoltage}
                        singlePedalDraw={singlePedalDraw}
                        singlePedalCanUseBattery={singlePedalCanUseBattery}
                        isAnalogOnlySmall={isAnalogOnlySmall}
                        isMixedWithSingleDigital={isMixedWithSingleDigital}
                        isMixedWithMultipleDigital={isMixedWithMultipleDigital}
                        isLargeBoard={isLargeBoard}
                        hasDaisyChainTuner={hasDaisyChainTuner}
                        extraPedals={extraPedals}
                        shouldShowNotEnough={shouldShowNotEnough}
                        shouldShowDaisy={shouldShowDaisy}
                        daisyPedalNames={daisyPedalNames}
                        extractOutputs={extractOutputs}
                      />
                    </div>
                  </CanvasPanelsPortal>
                </>
              )}
            </div>




            {/* EXPORT */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setShowExportPanel((v) => {
                    const next = !v;

                    if (next) {
                      setShowBoardsMenu(false);
                      setShowPower(false);
                      setShowList(false);
                      setShowSettings(false);
                      setShowSignalPath(false);
                      setShowCableMenu(false);
                    }

                    return next;
                  });
                }}
                className={`
  hidden
  items-center justify-center gap-2
  ${isMobile ? "h-8 w-20 text-[9px]" : "h-10 w-28 text-[11px]"}
  bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
  font-mono font-bold uppercase
  transition-all duration-200
  hover:scale-105 hover:border-blue-500 active:scale-95
  cursor-pointer
`}
              >
                <Share2 size={16} className={showExportPanel ? "text-blue-500" : undefined}
                />
                {t("export.button")}
              </button>

              {showExportPanel && (
                <>
                  <div className="fixed inset-0 z-40 pointer-events-none" />
                  <CanvasPanelsPortal host={!isMobile && desktopToolbarHost ? desktopPanelHost : null}>
                    <div
                      ref={rightSidebarRef}
                      className={
                        isMobile
                          ? mobileFullPanelClass
                          : desktopRightSidebarClass
                      }
                      style={
                        isMobile
                          ? undefined
                          : desktopRightSidebarStyle
                      }
                    >
                      <ExportPanel
                        isLightTheme={isLightTheme}
                        isMobile={isMobile}
                        boardPedals={activeProject.boardPedals}
                        selectedBoards={activeProject.selectedBoards}
                        displaySizes={displaySizes}
                        boardName={activeProject.name}
                        canvasBg={canvasBg}
                        currentBackground={currentBackground}
                        signalPath={activeProject.signalPath}
                        zoom={activeProject.zoom ?? 200}
                        stageX={activeProject.stageX}
                        stageY={activeProject.stageY}

                        onClose={() => setShowExportPanel(false)}
                      />
                    </div>
                  </CanvasPanelsPortal>
                </>
              )}
            </div>



            {/* SETTINGS */}
            <div className="relative">

              <button
                type="button"
                onClick={() => {
                  setShowSettings((v) => !v);
                  setShowBoardsMenu(false);
                  setShowPower(false);
                  setShowExportPanel(false);
                  setShowList(false);
                  setShowCableMenu(false);
                }}
                className={`
  hidden
  items-center justify-center gap-2
  ${isMobile ? "h-8 w-20 text-[9px]" : "h-10 w-28 text-[11px]"}
  bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
  font-mono font-bold uppercase
  transition-all duration-200
  hover:scale-105 hover:border-blue-500 active:scale-95
  cursor-pointer
`}
              >
                <Settings size={16} />
                {t("settings.title")}
              </button>

              {showSettings && (
                <>
                  <div className="fixed inset-0 z-40 pointer-events-none" />

                  <CanvasPanelsPortal host={!isMobile && desktopToolbarHost ? desktopPanelHost : null}>
                    <div
                      ref={rightSidebarRef}
                      className={
                        isMobile
                          ? mobileFullPanelClass
                          : desktopRightSidebarClass
                      }
                      style={
                        isMobile
                          ? undefined
                          : desktopRightSidebarStyle
                      }
                    >
                      <div
                        className={
                          isMobile
                            ? "w-full min-h-full bg-zinc-800 border-0 rounded-none p-6"
                            : "w-full bg-transparent border-0 rounded-none p-0"
                        }
                      >
                        {!settingsContactVisible && (
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold" style={{ marginBottom: 32, minHeight: 24 }}>
                            <Image src={settingsIconSrc} alt="" width={18} height={18}
                              draggable={false} className="size-[18px] shrink-0 object-contain" />
                            {t("settings.title")}
                          </div>
                        )}

                        <SettingsPanel
                          t={t}
                          canvasBg={canvasBg}
                          setCanvasBg={setCanvasBg}
                          language={language}
                          setLanguage={setLanguage ?? (() => { })}
                          units={units}
                          setUnits={setUnits ?? (() => { })}
                          backgrounds={BACKGROUNDS}
                          setContactOpen={setContactOpen}
                          onContactViewChange={setSettingsContactVisible}
                          supportUrl="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
                        />
                      </div>
                    </div>
                  </CanvasPanelsPortal>
                </>
              )}
            </div>
          </div>
        </>
      )
      }

      {/* --- LE STAGE (CANVAS) --- */}
      {hasStage && (

        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          draggable={!viewer && !isPinching && !replacementPreview}
          listening={!replacementPreview}
          onWheel={replacementPreview ? undefined : handleWheel}

          onDragStart={() => {
            setIsStageDragging(true);
          }}

          onDragMove={(e) => {
            if (e.target !== e.target.getStage()) return;

            updateOverlayPosition();
          }}

          x={viewer ? 0 : activeProject.stageX || 0}
          y={viewer ? 0 : activeProject.stageY || 0}

          scaleX={viewer ? 1 : (activeProject.zoom || 100) / 100}
          scaleY={viewer ? 1 : (activeProject.zoom || 100) / 100}

          onMouseDown={() => {
            if (viewer) return;

            // ferme Export dès qu'on clique sur le canvas
            if (showExportPanel) {
              setShowExportPanel(false);
            }
          }}

          onDragEnd={(e) => {
            const stage = e.target.getStage();
            if (!stage) return;

            if (e.target === stage && !viewer) {
              updateActiveProject({
                stageX: stage.x(),
                stageY: stage.y(),
              });

              updateOverlayPosition();
            }

            setIsStageDragging(false);
          }}

          onClick={handleStageClick}

          onTouchStart={(e: any) => {
            const stage = stageRef.current;
            if (!stage) return;

            const touches = e.evt.touches;

            // 1 doigt = comportement normal
            if (touches.length < 2) return;

            // 2 doigts = zoom uniquement
            e.evt.preventDefault();

            // Stoppe immédiatement le déplacement du canvas
            if (stage.isDragging()) {
              stage.stopDrag();
            }

            setIsStageDragging(false);
            setIsPinching(true);

            const touch1 = touches[0];
            const touch2 = touches[1];

            const rect = stage.container().getBoundingClientRect();

            const p1 = {
              x: touch1.clientX - rect.left,
              y: touch1.clientY - rect.top,
            };

            const p2 = {
              x: touch2.clientX - rect.left,
              y: touch2.clientY - rect.top,
            };

            const dist = Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
              Math.pow(p1.y - p2.y, 2)
            );

            const center = {
              x: (p1.x + p2.x) / 2,
              y: (p1.y + p2.y) / 2,
            };

            const scale = stage.scaleX();

            lastDist.current = dist;
            lastCenter.current = center;
            pinchStartScale.current = scale;

            pinchAnchor.current = {
              x: (center.x - stage.x()) / scale,
              y: (center.y - stage.y()) / scale,
            };
          }}

          onTouchMove={(e: any) => {
            const stage = stageRef.current;
            if (!stage) return;

            const touches = e.evt.touches;

            // Le pinch fonctionne uniquement avec 2 doigts
            if (touches.length !== 2) return;

            e.evt.preventDefault();

            // Le canvas ne doit jamais être déplacé pendant un pinch
            if (stage.isDragging()) {
              stage.stopDrag();
            }

            const touch1 = touches[0];
            const touch2 = touches[1];

            const rect = stage.container().getBoundingClientRect();

            const p1 = {
              x: touch1.clientX - rect.left,
              y: touch1.clientY - rect.top,
            };

            const p2 = {
              x: touch2.clientX - rect.left,
              y: touch2.clientY - rect.top,
            };

            const dist = Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
              Math.pow(p1.y - p2.y, 2)
            );

            if (
              lastDist.current === null ||
              lastCenter.current === null ||
              pinchAnchor.current === null
            ) {
              return;
            }

            const scaleBy = dist / lastDist.current;

            const newScale =
              pinchStartScale.current * scaleBy;

            const clampedScale = Math.max(
              0.5,
              Math.min(3, newScale)
            );

            // On garde le centre initial fixe :
            // avec 2 doigts, aucun déplacement du canvas.
            const center = lastCenter.current;
            const anchor = pinchAnchor.current;

            const newPos = {
              x: center.x - anchor.x * clampedScale,
              y: center.y - anchor.y * clampedScale,
            };

            stage.scale({
              x: clampedScale,
              y: clampedScale,
            });

            stage.position(newPos);
            stage.batchDraw();

            updateOverlayPosition();
          }}

          onTouchEnd={(e: any) => {
            const stage = stageRef.current;
            if (!stage) return;

            // S'il reste 2 doigts, le pinch continue
            if (e.evt.touches.length >= 2) return;

            if (stage.isDragging()) {
              stage.stopDrag();
            }

            // Sauvegarde la position et le zoom obtenus
            if (lastDist.current !== null && !viewer) {
              updateActiveProject({
                zoom: stage.scaleX() * 100,
                stageX: stage.x(),
                stageY: stage.y(),
              });
            }

            setIsPinching(false);
            setIsStageDragging(false);

            lastDist.current = null;
            lastCenter.current = null;
            pinchAnchor.current = null;
          }}

        >



          <Layer listening={true}>

            {canvasItems.map((item: AnyRow) => {

              // =========================
              // BOARDS
              // =========================
              if (item.kind === "board") {

                const b = item;

                return (
                  <Group
                    name="exportable"
                    key={b.instanceId}
                    boardInstanceId={b.instanceId}
                    x={b.x}
                    y={b.y}
                    draggable={!viewer && !isPinching}
                    rotation={b.rotation || 0}

                    onDragStart={() => {
                      setIsDragging(true);
                    }}

                    onMouseEnter={() => {
                      if (!isMobile) setHoveredBoardId(b.instanceId);
                    }}

                    onMouseLeave={() => {
                      if (!isMobile) setHoveredBoardId(null);
                    }}

                    onClick={(e) => {
                      if (viewer) return;
                      e.cancelBubble = true;

                      setSelectedBoardInstanceId(b.instanceId);
                      setSelectedInstanceId(null);
                    }}

                    onTap={(e) => {
                      if (viewer) return;
                      e.cancelBubble = true;

                      tapCanvasBoard(b.instanceId);
                    }}

                    onDragMove={(e) => {
                      const node = e.target;
                      const bounds = getVisibleBounds();
                      const box = node.getClientRect({ skipTransform: false });
                      const scale = stageRef.current?.scaleX() || 1;

                      const width = box.width / scale;
                      const height = box.height / scale;

                      let x = node.x();
                      let y = node.y();

                      if (x - width / 2 < bounds.minX) x = bounds.minX + width / 2;
                      if (y - height / 2 < bounds.minY) y = bounds.minY + height / 2;
                      if (x + width / 2 > bounds.maxX) x = bounds.maxX - width / 2;
                      if (y + height / 2 > bounds.maxY) y = bounds.maxY - height / 2;

                      node.position({ x, y });

                      lastRenderedPos.current = { x, y };
                    }}

                    onDragEnd={(e) => {
                      setTimeout(() => {
                        setIsDragging(false);
                      }, 0);

                      if (!viewer) {
                        updateActiveProject({
                          selectedBoards: (activeProject.selectedBoards || []).map(
                            (x: AnyRow) =>
                              x.instanceId === b.instanceId
                                ? {
                                  ...x,
                                  x: e.target.x(),
                                  y: e.target.y(),
                                }
                                : x
                          ),
                        });
                      }
                    }}
                  >

                    <PedalImage
                      url={b.image || b.image_url || b.photo || null}
                      width={b.width}
                      depth={b.depth}
                      color={b.color}
                      isBoard
                      rotation={0}
                      onSizeReady={(w, h) =>
                        handleSizeUpdate?.(b.instanceId, w, h)
                      }
                      showJacksMargin={showJacksMargin}
                      jacksLocation=""
                    />


                    {!isDragging &&
                      hoveredBoardId === b.instanceId &&
                      selectedBoardInstanceId !== b.instanceId &&
                      displaySizes[b.instanceId] && (
                        <Rect
                          x={-displaySizes[b.instanceId].w / 2}
                          y={-displaySizes[b.instanceId].h / 2}
                          width={displaySizes[b.instanceId].w}
                          height={displaySizes[b.instanceId].h}
                          stroke="white"
                          strokeWidth={0.5}
                          opacity={0.25}
                          cornerRadius={3}
                          listening={false}
                        />
                      )}

                    {!isDragging &&
                      selectedBoardInstanceId === b.instanceId &&
                      displaySizes[b.instanceId] && (
                        <Rect
                          name="selected-item-outline"
                          x={-displaySizes[b.instanceId].w / 2}
                          y={-displaySizes[b.instanceId].h / 2}
                          width={displaySizes[b.instanceId].w}
                          height={displaySizes[b.instanceId].h}
                          stroke="white"
                          strokeWidth={0.5}
                          cornerRadius={3}
                          listening={false}
                        />
                      )}

                  </Group>
                );
              }

              // =========================
              // PEDALS
              // =========================

              const p = item;
              const isReplacement = replacementPreview && replacementPreview.pedal.instanceId === p.instanceId;
              const imageUrl = p.image || p.image_url || p.photo || null;

              const pedalSize = displaySizes[p.instanceId];
              const outlineOpacity = selectedInstanceId === p.instanceId
                ? 1
                : !isDragging && hoveredPedalId === p.instanceId ? 0.25 : undefined;

              return (
                <Group
                  name="exportable"
                  key={`pedal-${p.instanceId}-${p.id ?? ""}-${p.imageId || imageUrl || ""}`}
                  opacity={isReplacement ? 0.85 : 1}
                  x={p.x}
                  y={p.y}
                  rotation={p.rotation || 0}
                  draggable={!viewer && !isPinching}
                  instanceId={p.instanceId}

                  onDragStart={(e) => {
                    setIsDragging(true);
                    draggingPedalId.current = p.instanceId;
                    lastRenderedPos.current = {
                      x: e.target.x(),
                      y: e.target.y(),
                    };
                  }}

                  onMouseEnter={() => {
                    if (!isMobile) setHoveredPedalId(p.instanceId);
                  }}

                  onMouseLeave={() => {
                    if (!isMobile) setHoveredPedalId(null);
                  }}

                  onClick={(e) => {
                    if (viewer) return;
                    e.cancelBubble = true;
                    setSelectedInstanceId(p.instanceId);
                    setSelectedBoardInstanceId(null);
                  }}

                  onTap={(e) => {
                    if (viewer) return;
                    e.cancelBubble = true;
                    tapCanvasPedal(p.instanceId);
                  }}

                  onDragMove={(e) => {
                    const node = e.target;
                    const bounds = getVisibleBounds();
                    const box = node.getClientRect({ skipTransform: false });
                    const scale = stageRef.current?.scaleX() || 1;
                    const width = box.width / scale;
                    const height = box.height / scale;

                    let x = node.x();
                    let y = node.y();

                    if (x - width / 2 < bounds.minX) x = bounds.minX + width / 2;
                    if (y - height / 2 < bounds.minY) y = bounds.minY + height / 2;
                    if (x + width / 2 > bounds.maxX) x = bounds.maxX - width / 2;
                    if (y + height / 2 > bounds.maxY) y = bounds.maxY - height / 2;

                    const hasMovedVisually =
                      !lastRenderedPos.current ||
                      Math.abs(lastRenderedPos.current.x - x) > 0.5 ||
                      Math.abs(lastRenderedPos.current.y - y) > 0.5;

                    node.position({ x, y });



                    if (!hasMovedVisually) return;

                    lastRenderedPos.current = { x, y };

                    updateActiveProject({
                      boardPedals: activeProject.boardPedals.map((item: AnyRow) =>
                        item.instanceId === p.instanceId ? { ...item, x, y } : item
                      ),
                    });
                  }}

                  onDragEnd={(e) => {
                    setTimeout(() => {
                      setIsDragging(false);
                    }, 0);

                    const node = e.target;
                    const finalX = node.x();
                    const finalY = node.y();

                    lastRenderedPos.current = null;

                    if (!viewer) {
                      updateActiveProject({
                        boardPedals: activeProject.boardPedals.map((x: AnyRow) =>
                          x.instanceId === p.instanceId
                            ? { ...x, x: finalX, y: finalY }
                            : x
                        ),
                      });
                    }
                  }}
                >
                  {/* Shared millimeter geometry: identical to the Custom preview. */}
                  {p.slug === "custom" && displaySizes[p.instanceId] && (() => {
                    const size = displaySizes[p.instanceId];
                    const images = { top: jackTop, bottom: jackDown, left: jackLeft, right: jackRight };
                    return getPedalJackGeometry(parsePedalJackLocations(p.jacksLocation || p.jacks),
                      Number(p.width), Number(p.depth), size.w, size.h).map((jack, index) => {
                        const image = images[jack.side];
                        if (!image) return null;
                        // Match CSS object-fit: contain in CustomPedalVisual, preserving the original image ratio.
                        const naturalWidth = image.naturalWidth || image.width;
                        const naturalHeight = image.naturalHeight || image.height;
                        if (!naturalWidth || !naturalHeight) return null;
                        const imageScale = Math.min(jack.width / naturalWidth, jack.height / naturalHeight);
                        const imageWidth = naturalWidth * imageScale;
                        const imageHeight = naturalHeight * imageScale;
                        return <KonvaImage key={`${jack.side}-${index}`} image={image}
                          width={imageWidth} height={imageHeight}
                          x={jack.x + (jack.width - imageWidth) / 2 - size.w / 2}
                          y={jack.y + (jack.height - imageHeight) / 2 - size.h / 2} listening={false} />;
                      });
                  })()}

                  <PedalImage
                    url={imageUrl}
                    imageId={p.imageId || null}
                    outlineOpacity={p.slug === "custom" ? undefined : outlineOpacity}
                    onSelectedOutlineChange={p.slug !== "custom" && outlineOpacity === 1 ? updateOverlayPosition : undefined}
                    width={p.width}
                    depth={p.depth}
                    color={p.color}
                    rotation={p.rotation || 0}
                    showJacksMargin={isReplacement ? ["fits", "collision", "outside"].includes(replacementPreview.fit) : showJacksMargin}
                    jacksLocation={
                      p.jacksLocation || p.jacks || ""
                    }
                    useEnclosureSizing={
                      p.slug === "custom-upload" || ENCLOSURE_SIZING_BRANDS.has(
                        String(p.brand || "").trim()
                      )
                    }
                    onSizeReady={isReplacement ? undefined : (nw, nh) => handleSizeUpdate?.(p.instanceId, nw, nh)}
                    marginRef={isReplacement ? undefined : (node) => {
                      if (node) {
                        marginRefs.current[p.instanceId] = node;
                      }
                    }}
                    isColliding={
                      isReplacement ? replacementPreview.fit === "collision" || replacementPreview.fit === "outside" :
                        !replacementPreview && collisionReady &&
                        showJacksMargin &&
                        activeProject.boardPedals.some((other) => {
                          if (other.instanceId === p.instanceId) return false;

                          // ✅ Si une alim est SOUS le board, elle ne gêne pas les pédales SUR le board
                          const pIsUnderBoard = p.type === "power" && Number(p.zIndex || 0) < 0;
                          const otherIsUnderBoard = other.type === "power" && Number(other.zIndex || 0) < 0;

                          if (pIsUnderBoard || otherIsUnderBoard) return false;

                          // ✅ Sinon, alim + pédale peuvent bien entrer en collision
                          return checkCollision(p.instanceId, other.instanceId);
                        })
                    }
                  />

                  {/* Stored profile supplies the actual knob/footswitch diameters and positions. */}
                  {p.slug === "custom" && displaySizes[p.instanceId] && (() => {
                    const size = displaySizes[p.instanceId];
                    const widthMm = Number(p.width);
                    const depthMm = Number(p.depth);
                    const layout = resolveCustomPedalLayout(p.customLayout, widthMm, depthMm);
                    const geometry = getPedalHardwareGeometry(layout, widthMm, depthMm, size.w, size.h);
                    const scale = Math.min(size.w / widthMm, size.h / depthMm);
                    return <>
                      {p.color && <CustomPedalTint color={p.color} width={size.w} height={size.h} />}
                      {knob && geometry.knobs.map((part, index) => (
                        <Group key={`knob-${index}`} x={part.x - size.w / 2} y={part.y - size.h / 2} listening={false}>
                          <KonvaImage image={knob} width={part.width} height={part.height} listening={false} />
                          <Rect x={part.width / 2 - Math.max(part.width * 0.03, 0.7 * scale) / 2}
                            y={part.height * 0.12} width={Math.max(part.width * 0.03, 0.7 * scale)} height={part.height * 0.38}
                            fill="#ffffff" cornerRadius={scale} listening={false} />
                        </Group>
                      ))}
                      {led && geometry.leds.map((part, index) => (
                        <KonvaImage key={`led-${index}`} image={led}
                          width={part.width} height={part.height} x={part.x - size.w / 2} y={part.y - size.h / 2} listening={false} />
                      ))}
                      {footswitch && geometry.footswitches.map((part, index) => (
                        <KonvaImage key={`footswitch-${index}`} image={footswitch}
                          width={part.width} height={part.height} x={part.x - size.w / 2} y={part.y - size.h / 2} listening={false} />
                      ))}
                    </>;
                  })()}

                  {p.slug === "custom" && p.name && displaySizes[p.instanceId] && (
                    <Text
                      text={p.name.toUpperCase()}
                      fontSize={8}
                      fill="#000000"
                      align="center"
                      verticalAlign="middle"
                      width={displaySizes[p.instanceId].w}
                      height={displaySizes[p.instanceId].h}
                      x={-displaySizes[p.instanceId].w / 2}
                      y={-displaySizes[p.instanceId].h / 2}
                      fontStyle="bold"
                      stroke="#000000"
                      strokeWidth={0.5}
                      letterSpacing={0.5}
                      listening={false}
                    />
                  )}

                  {p.slug === "custom" && outlineOpacity !== undefined && pedalSize && (
                    <Rect
                      name={outlineOpacity === 1 ? "selected-item-outline" : undefined}
                      x={-pedalSize.w / 2}
                      y={-pedalSize.h / 2}
                      width={pedalSize.w}
                      height={pedalSize.h}
                      stroke="white"
                      strokeWidth={0.5}
                      opacity={outlineOpacity}
                      cornerRadius={3}
                      listening={false}
                    />
                  )}

                  {/* ================= SIGNAL CHAIN NUMBER ================= */}
                  {showSignalChain &&
                    pedalSize &&
                    String(p.type || "").trim().toLowerCase() !== "power" &&
                    signalOrder.includes(p.instanceId) && (
                      <Group
                        x={-pedalSize.w / 2 + 14}
                        y={-pedalSize.h / 2 + 14}
                        rotation={-(Number(p.rotation) || 0)}
                        listening={false}
                      >
                        <KonvaCircle
                          radius={10}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth={1}
                          listening={false}
                        />

                        <Text
                          text={String(signalOrder.indexOf(p.instanceId) + 1)}
                          x={-10}
                          y={-10}
                          width={20}
                          height={20}
                          align="center"
                          verticalAlign="middle"
                          fill="#ffffff"
                          fontSize={10}
                          fontStyle="bold"
                          listening={false}
                        />
                      </Group>
                    )}
                </Group>
              );
            })}

          </Layer>




          {SIGNAL_PATH_ENABLED && showSignalPath && (
            <Layer listening={true}>
              <SignalPath
                mode="cables"
                pedals={activeProject.boardPedals}
                displaySizes={displaySizes}
                signalPath={localSignalPath}
                enabled={showSignalPath}
                pendingPoint={pendingSignalPoint}
                onPointClick={handleSignalPointClick}
                onRemoveConnection={removeSignalConnection}
                isDragging={isDragging || isStageDragging}
              />
            </Layer>
          )}

          <Layer listening={true}>
            {/* 1. HITBOX BOARDS EN PREMIER */}
            {(activeProject.selectedBoards || []).map((b: AnyRow) => {
              const size = displaySizes[b.instanceId];
              if (!size) return null;

              return (
                <Rect
                  key={`hit-board-${b.instanceId}`}
                  x={b.x}
                  y={b.y}
                  width={size.w}
                  height={size.h}
                  offsetX={size.w / 2}
                  offsetY={size.h / 2}
                  rotation={b.rotation || 0}
                  fill="rgba(0,0,0,0.01)"
                  draggable={!viewer && !isPinching}
                  onMouseEnter={() => {
                    if (!isMobile) {
                      setHoveredBoardId(b.instanceId);
                      setHoveredPedalId(null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!isMobile) setHoveredBoardId(null);
                  }}
                  onClick={(e) => {
                    if (viewer) return;
                    e.cancelBubble = true;
                    setSelectedBoardInstanceId(b.instanceId);
                    setSelectedInstanceId(null);
                  }}
                  onTap={(e) => {
                    if (viewer) return;
                    e.cancelBubble = true;
                    tapCanvasBoard(b.instanceId);
                  }}
                  onDragStart={() => {
                    setIsDragging(true);
                  }}
                  onDragMove={(e) => {
                    const x = e.target.x();
                    const y = e.target.y();

                    const stage = stageRef.current;
                    if (!stage) return;

                    const visualGroup = stage.findOne(
                      (node: any) =>
                        node.getAttr("boardInstanceId") === b.instanceId
                    );

                    if (visualGroup) {
                      visualGroup.position({ x, y });
                      visualGroup.getLayer()?.batchDraw();
                    }

                    updateOverlayPosition();
                  }}
                  onDragEnd={(e) => {
                    setTimeout(() => setIsDragging(false), 0);

                    updateActiveProject({
                      selectedBoards: (activeProject.selectedBoards || []).map((item: AnyRow) =>
                        item.instanceId === b.instanceId
                          ? { ...item, x: e.target.x(), y: e.target.y() }
                          : item
                      ),
                    });
                  }}
                />
              );
            })}

            {/* 2. HITBOX PÉDALES / ALIMS APRÈS */}
            {[...activeProject.boardPedals]
              .sort((a: AnyRow, b: AnyRow) => {
                return (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0);
              })
              .map((p: AnyRow) => {
                const size = displaySizes[p.instanceId];
                if (!size) return null;

                return (
                  <Rect
                    key={`hit-pedal-${p.instanceId}`}
                    x={p.x}
                    y={p.y}
                    width={size.w}
                    height={size.h}
                    offsetX={size.w / 2}
                    offsetY={size.h / 2}
                    rotation={p.rotation || 0}
                    fill="rgba(0,0,0,0.01)"
                    draggable={!viewer && !isPinching}
                    onMouseEnter={() => {
                      if (!isMobile) {
                        setHoveredPedalId(p.instanceId);
                        setHoveredBoardId(null);
                      }
                    }}
                    onMouseLeave={() => {
                      if (!isMobile) setHoveredPedalId(null);
                    }}
                    onClick={(e) => {
                      if (viewer) return;
                      e.cancelBubble = true;
                      setSelectedInstanceId(p.instanceId);
                      setSelectedBoardInstanceId(null);
                    }}
                    onTap={(e) => {
                      if (viewer) return;
                      e.cancelBubble = true;
                      tapCanvasPedal(p.instanceId);
                    }}
                    onDragStart={(e) => {
                      setIsDragging(true);
                      draggingPedalId.current = p.instanceId;
                      lastRenderedPos.current = {
                        x: e.target.x(),
                        y: e.target.y(),
                      };
                    }}
                    onDragMove={(e) => {
                      const x = e.target.x();
                      const y = e.target.y();

                      lastRenderedPos.current = { x, y };

                      const stage = stageRef.current;
                      if (!stage) return;

                      const visualGroup = stage.findOne(
                        (node: any) =>
                          node.getAttr("instanceId") === p.instanceId
                      );

                      if (visualGroup) {
                        visualGroup.position({ x, y });
                        visualGroup.getLayer()?.batchDraw();
                      }

                      forceCollisionRender(
                        (value) => value + 1
                      );

                      updateOverlayPosition();
                    }}
                    onDragEnd={(e) => {
                      setTimeout(() => setIsDragging(false), 0);
                      lastRenderedPos.current = null;
                      draggingPedalId.current = null;

                      updateActiveProject({
                        boardPedals: activeProject.boardPedals.map((item: AnyRow) =>
                          item.instanceId === p.instanceId
                            ? { ...item, x: e.target.x(), y: e.target.y() }
                            : item
                        ),
                      });
                    }}
                  />
                );
              })}
          </Layer>

          {SIGNAL_PATH_ENABLED && showSignalPath && (
            <Layer listening={true}>
              <SignalPath
                mode="points"
                pedals={activeProject.boardPedals}
                displaySizes={displaySizes}
                signalPath={localSignalPath}
                enabled={showSignalPath}
                pendingPoint={pendingSignalPoint}
                onPointClick={handleSignalPointClick}
                onRemoveConnection={removeSignalConnection}
                isDragging={isDragging || isStageDragging}
              />
            </Layer>
          )}

        </Stage>
      )}

      {/* ================= INFO / HELP ================= */}

      {!viewer &&
        !isMobile &&
        !desktopToolbarHost &&
        HELP_ENABLED && !helpOpen && (
          <div
            className="
        fixed
        top-4
        right-4
        z-[40]
        w-10
        h-10
        flex
        items-center
        justify-center
        pointer-events-auto
      "
            onMouseEnter={(e) => {
              const button = e.currentTarget.querySelector("button");

              if (button) {
                button.style.width = "40px";
                button.style.height = "40px";
              }
            }}
            onMouseLeave={(e) => {
              const button = e.currentTarget.querySelector("button");

              if (button) {
                button.style.width = "36px";
                button.style.height = "36px";
              }
            }}
          >
            <button
              type="button"
              aria-label={t("help.title")}
              onClick={(e) => {
                e.stopPropagation();

                closeBottomPanels();
                setShowMobileMenu(false);
                setRenderMobileMenu(false);
                setHelpOpen(true);
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "36px",
                height: "36px",
                transform: "translate(-50%, -50%)",
                transition:
                  "width 140ms ease-out, height 140ms ease-out",
              }}
              className="
          bg-zinc-900
          border border-zinc-800
          rounded-full
          p-0
          cursor-pointer
        "
            />

            <div
              className="
    relative
    z-10
    flex
    items-center
    justify-center
    pointer-events-none
  "
            >
              <span className="text-[20px] font-bold leading-none">
                ?
              </span>
            </div>
          </div>
        )}

      {/* ================= HELP GUIDE ================= */}

      {helpOpen && desktopToolbarHost && !isMobile ? (
        <CanvasPanelsPortal host={desktopPanelHost}>
          <div ref={rightSidebarRef} className={desktopRightSidebarClass} style={desktopRightSidebarStyle} onClick={(event) => event.stopPropagation()}>
            <HelpGuide
              embedded={Boolean(desktopToolbarHost) && !isMobile}
              t={t}
              mobile={isMobile}
              open={HELP_ENABLED && helpOpen}
              onClose={() => setHelpOpen(false)}
              onContact={() => {
                setHelpOpen(false);
                setContactOpen(true);

                if (isMobile) {
                  setMobileSidebarOpen(true);
                }
              }}
              supportUrl="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
            />
          </div>
        </CanvasPanelsPortal>
      ) : (
        <HelpGuide
          embedded={Boolean(desktopToolbarHost) && !isMobile}
          t={t}
          mobile={isMobile}
          open={HELP_ENABLED && helpOpen}
          onClose={() => setHelpOpen(false)}
          onContact={() => {
            setHelpOpen(false);
            setContactOpen(true);

            if (isMobile) {
              setMobileSidebarOpen(true);
            }
          }}
          supportUrl="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
        />
      )}

    </div>
  );
}
