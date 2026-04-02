"use client";

import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { Stage, Layer, Group, Rect, Text, Image as KonvaImage } from "react-konva";
import { Zap, Weight, Minus, Plus, Upload, RotateCw, Trash2, X, Download, Info, List } from "lucide-react";
import PedalImage from "@/components/PedalImage";
import { formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";
import useImage from "use-image";
import ExportPNG from "@/components/ExportPNG";
import ShareBoard from "@/components/ShareBoard";

type AnyRow = Record<string, any>;

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
};

type Props = {
viewer?: boolean;

activeProject: {
  name?: string;
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  zoom?: number;
  stageX?: number;
  stageY?: number;
};

setMobileSidebarOpen: (v: boolean) => void;
setSpecsOpen: (v: boolean) => void;

  units: "metric" | "imperial";
  language: "en" | "fr" | "es" | "de" | "it" | "pt";

  mobileSidebarOpen?: boolean;

  rotatePedal: (id: number) => void;
  deletePedal: (id: number) => void;
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

  BACKGROUNDS: Background[];
  canvasBg: string;
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

    if (overlap <= 0) return null;

    if (overlap < minOverlap) {
      minOverlap = overlap;
      smallestAxis = axis;
    }
  }

  return { overlap: minOverlap, axis: smallestAxis };
}

export default function BoardCanvas({
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
  showIntro,
  isMobile = false,
  mobileSidebarOpen = false,
  rotatePedal,
  deletePedal,
  rotateBoard,
  deleteBoard,
  onStageSizeChange,
  stagePos,
  setStagePos,
  getCenterRef,
  setMobileSidebarOpen,
  setSpecsOpen,
  viewer = false,
}: Props) {

  const t = getTranslator(language);
  const [knob] = useImage("/images/knob.png");
  const [footswitch] = useImage("/images/footswitch.png");
  const currentZoom = activeProject.zoom || 100;
  const zoomPercent = Math.round(currentZoom);
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 200;

const ZOOM_STEP = 10;

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

  const clampedScale = Math.max(0.5, Math.min(2, newScale));

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

  const totalDraw = activeProject.boardPedals.reduce(
    (sum, p) => sum + (Number(p.draw) || 0),
    0
  );

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
    if (e.target === e.target.getStage()) {
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
      closeSearchMenus();
      setContactOpen(false);
      setShowExport(false);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const lastRenderedPos = useRef<{ x: number; y: number } | null>(null);
  const lastStablePos = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number | null>(null);
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });


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
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showList, setShowList] = useState(false);
  const [hoveredBoardId, setHoveredBoardId] = useState<number | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<{
  x: number;
  y: number;
  } | null>(null);
  const [infoPosition, setInfoPosition] = useState<{
  x: number;
  y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isStageDragging, setIsStageDragging] = useState(false);

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
useEffect(() => {
  const stage = stageRef.current;
  if (!stage) return;

  const scale = stage.scaleX();
  const stageX = stage.x();
  const stageY = stage.y();

  // 🟣 PEDAL sélectionnée
if (selectedInstanceId !== null) {
  const pedal = activeProject.boardPedals.find(
    (p) => p.instanceId === selectedInstanceId
  );
  if (!pedal) return;

  const size = displaySizes[selectedInstanceId];
  if (!size) return;

  setOverlayPosition({
    x: pedal.x * scale + stageX,
    y:
      pedal.y * scale +
      stageY -
      (size.h * scale) / 2 -
      8,
  });

  // position du bouton info (mobile seulement)
  if (isMobile) {
    setInfoPosition({
      x:
        pedal.x * scale +
        stageX +
        (size.w * scale) / 2 +
        10,
      y:
        pedal.y * scale +
        stageY -
        (size.h * scale) / 2 -
        10,
    });
  }

  return;
}

  // 🟢 BOARD sélectionné
  if (selectedBoardInstanceId !== null) {
    const board = (activeProject.selectedBoards || []).find(
      (b) => b.instanceId === selectedBoardInstanceId
    );
    if (!board) return;

    const size = displaySizes[selectedBoardInstanceId];
    if (!size) return;

    setOverlayPosition({
      x: board.x * scale + stageX,
      y:
        board.y * scale +
        stageY -
        (size.h * scale) / 2 -
        8,
    });

    return;
  }

  setOverlayPosition(null);
  setInfoPosition(null);

}, [
  selectedInstanceId,
  selectedBoardInstanceId,
  activeProject.boardPedals,
  activeProject.selectedBoards ?? [],
  displaySizes,
  currentZoom,
  activeProject.stageX,
  activeProject.stageY
]);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    if (e.key === "Backspace") {
      if (selectedInstanceId !== null) {
        deletePedal(selectedInstanceId);
        return;
      }

      if (selectedBoardInstanceId !== null) {
        deleteBoard(selectedBoardInstanceId);
        return;
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [
  selectedInstanceId,
  selectedBoardInstanceId,
  deletePedal,
  deleteBoard,
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

  return (
  <div
    ref={containerRef}
    className={`
      relative w-full h-full overflow-hidden
      ${isMobile ? "pb-6" : "pb-20"}
      ${canvasBg === "neutral" ? "bg-canvas" : ""}
    `}
    style={
      canvasBg === "neutral"
        ? undefined
        : {
            backgroundImage: `url(${
              BACKGROUNDS.find((b) => b.id === canvasBg)?.src
            })`,
            backgroundSize: "auto 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }
    }
  >

{viewer && (
  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">

    {/* ZOOM */}
    <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">

  {/* MINUS */}
  <button
    onClick={zoomOut}
    disabled={isMinZoom}
    className="absolute left-2 flex items-center justify-center w-6 h-6 text-white hover:text-blue-400 disabled:text-zinc-600"
  >
    {isMinZoom ? (
      <span className="text-[9px] tracking-wider text-zinc-500">MIN</span>
    ) : (
      <Minus size={14} />
    )}
  </button>

  {/* % */}
  <span className="text-[12px] font-black font-mono tabular-nums text-white">
    {zoomPercent}%
  </span>

  {/* PLUS */}
  <button
    onClick={zoomIn}
    disabled={isMaxZoom}
    className="absolute right-2 flex items-center justify-center w-6 h-6 text-white hover:text-blue-400 disabled:text-zinc-600"
  >
    {isMaxZoom ? (
      <span className="text-[9px] tracking-wider text-zinc-500">MAX</span>
    ) : (
      <Plus size={14} />
    )}
  </button>

</div>

    {/* TOTAL DRAW */}
    <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <Zap className="absolute left-3 size-4 text-yellow-500" />
      <span className="text-[12px] font-black font-mono tabular-nums text-white">
        {totalDraw}
      </span>
      <span className="absolute right-3 text-[10px] text-zinc-500">
        mA
      </span>
    </div>

    {/* TOTAL WEIGHT */}
    <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <Weight className="absolute left-3 size-4 text-red-400" />
      <span className="text-[12px] font-black font-mono tabular-nums text-white">
        {weightValue}
      </span>
      <span className="absolute right-3 text-[10px] text-zinc-500">
        {weightUnit}
      </span>
    </div>

{/* LIST */}
<div className="relative">

  <button
    onClick={() => {
      setShowList((v) => !v);
      setShowExport(false);
      setShowShare(false);
    }}
    className="
      relative flex items-center justify-center gap-2
      h-9 w-24 md:h-10 md:w-28
      bg-zinc-900 border border-zinc-800
      rounded-2xl shadow-2xl
      text-[11px] md:text-[11px] font-mono font-bold text-white uppercase
      transition-all duration-150
      hover:border-blue-500 hover:scale-[1.02]
      active:scale-95
    "
  >
    <List size={16} className="text-blue-400" />
    SETUP
  </button>

{showList && (
  <>
    {/* OVERLAY */}
    <div
      className="fixed inset-0 z-40"
      onClick={() => setShowList(false)}
    />

    {/* POPUP */}
    <div className="absolute bottom-12 left-0 z-50">

      <div
        className="w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()} // 🔥 IMPORTANT
      >

        <div className="text-xs uppercase tracking-wider text-white font-bold">
          PEDALBOARD
        </div>

        {/* PEDALS TRI ALPHABÉTIQUE */}
        {[...activeProject.boardPedals]
          .sort((a, b) => {
            const nameA = `${a.brand || ""} ${a.name || ""}`.toLowerCase();
            const nameB = `${b.brand || ""} ${b.name || ""}`.toLowerCase();
            return nameA.localeCompare(nameB);
          })
          .map((p, i) => (
            <div key={i} className="text-sm text-white">
              <span className="text-zinc-400">
                - {p.brand || "Custom"}
              </span>{" "}
              {p.name || "Unnamed"}
            </div>
          ))}

          {/* BOARD */}
        {(activeProject.selectedBoards || []).map((b, i) => (
          <div key={`board-${i}`} className="text-sm text-white">
            <span className="text-zinc-400">
              - {b.brand || "Board"}
            </span>{" "}
            {b.name || "Custom"}
          </div>
        ))}

      </div>

    </div>
  </>
)}

</div>
  </div>
)}

    {/* 🔽 TON CODE EXISTANT — INCHANGÉ */}
    {!viewer && !(isMobile && mobileSidebarOpen) && (
      <div className="absolute bottom-6 left-6 flex items-center gap-4 z-50">

        {/* Desktop uniquement */}
        <>

        {/* ZOOM */}
        <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl">

          {/* LEFT BUTTON */}
          <button
            onClick={zoomOut}
            disabled={isMinZoom}
            className="absolute left-2 flex items-center justify-center w-6 h-6 text-white hover:text-blue-400 disabled:text-zinc-600"
          >
            {isMinZoom ? (
              <span className="text-[9px] tracking-wider text-zinc-500">MIN</span>
            ) : (
              <Minus size={14} />
            )}
          </button>

          {/* % CENTER */}
          <span className="text-[12px] font-black font-mono tabular-nums">
            {zoomPercent}%
          </span>

          {/* RIGHT BUTTON */}
          <button
            onClick={zoomIn}
            disabled={isMaxZoom}
            className="absolute right-2 flex items-center justify-center w-6 h-6 text-white hover:text-blue-400 disabled:text-zinc-600"
          >
            {isMaxZoom ? (
              <span className="text-[9px] tracking-wider text-zinc-500">MAX</span>
            ) : (
              <Plus size={14} />
            )}
          </button>

        </div>

        {/* TOTAL DRAW */}
        <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">
          <Zap className="absolute left-3 size-4 text-yellow-500" />
          <span className="text-[12px] font-black font-mono tabular-nums">
            {totalDraw}
          </span>
          <span className="absolute right-3 text-[10px] text-zinc-500">
            mA
          </span>
        </div>

        {/* TOTAL WEIGHT */}
        <div className="relative flex items-center justify-center h-9 w-24 md:h-10 md:w-28 bg-zinc-900 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">
          <Weight className="absolute left-3 size-4 text-red-400" />
          <span className="text-[12px] font-black font-mono tabular-nums">
            {weightValue}
          </span>
          <span className="absolute right-3 text-[10px] text-zinc-500">
            {weightUnit}
          </span>
        </div>

        </>

        {/* EXPORT */}
        <div className="relative">

          <button
            onClick={() => setShowExport((v) => !v)}
            className="
              relative flex items-center justify-center gap-2
              h-9 w-24 md:h-10 md:w-28
              bg-zinc-900 backdrop-blur-md border border-zinc-800
              rounded-2xl shadow-2xl
              text-[11px] font-mono font-bold text-white uppercase
              transition-all duration-150
              hover:border-blue-500 hover:scale-[1.02]
              active:scale-95
            "
          >
            <Download size={16} className="text-green-600" />
            {t("export.button")}
          </button>


{showExport && (
  <div className="absolute bottom-12 left-0 z-50">
    <ExportPNG
      boardPedals={activeProject.boardPedals}
      selectedBoards={activeProject.selectedBoards}
      displaySizes={displaySizes}
      boardName={activeProject.name}
      canvasBg={canvasBg}
      currentBackground={currentBackground}
    />
  </div>
)}
        </div>

        {/* SHARE */}
        <div className="relative">

          <button
            onClick={() => {
              setShowShare((v) => !v);
              setShowExport(false);
            }}
            className="
              relative flex items-center justify-center gap-2
              h-9 w-24 md:h-10 md:w-28
              bg-zinc-900 backdrop-blur-md border border-zinc-800
              rounded-2xl shadow-2xl
              text-[11px] font-mono font-bold text-white uppercase
              transition-all duration-150
              hover:border-blue-500 hover:scale-[1.02] transform-gpu
              active:scale-95
            "
          >
            <Upload size={16} className="text-blue-500" />
            {t("share.button")}
          </button>

          {showShare && (
            <div className="absolute bottom-12 left-0 z-50">
              <ShareBoard
                boardPedals={activeProject.boardPedals}
                selectedBoards={activeProject.selectedBoards}
                displaySizes={displaySizes}
                boardName={activeProject.name}
                onClose={() => setShowShare(false)}
              />
            </div>
          )}

        </div>

      </div>
    )}

      {stageSize.width > 0 && stageSize.height > 0 && (

<Stage
  ref={stageRef}
  width={stageSize.width}
  height={stageSize.height}
  draggable={!viewer}
  onWheel={handleWheel}

  onDragStart={() => {
  setIsStageDragging(true);
}}

x={viewer ? 0 : activeProject.stageX || 0}
y={viewer ? 0 : activeProject.stageY || 0}

scaleX={viewer ? 1 : (activeProject.zoom || 100) / 100}
scaleY={viewer ? 1 : (activeProject.zoom || 100) / 100}

onMouseDown={(e) => {
  if (viewer) return;

  const stage = stageRef.current;
  if (!stage) return;

  if (e.target === stage) {
    stage.draggable(true);
  }
}}

onMouseUp={() => {
  if (viewer) return;

  const stage = stageRef.current;
  if (!stage) return;
  stage.draggable(false);
}}

  onDragEnd={(e) => {
  const stage = e.target.getStage();
  if (!stage) return;

if (!viewer) {
  updateActiveProject({
    stageX: stage.x(),
    stageY: stage.y(),
  });
}

  setIsStageDragging(false);
}}

  onClick={handleStageClick}


  

  



  

  onTouchMove={(e: any) => {
  const stage = stageRef.current;
  if (!stage) return;

  const touch1 = e.evt.touches[0];
  const touch2 = e.evt.touches[1];

  // On ne fait rien si pas 2 doigts
  if (!touch1 || !touch2) {
    lastDist.current = null;
    return;
  }

  e.evt.preventDefault();

  // Distance entre les 2 doigts
  const dist = Math.sqrt(
    Math.pow(touch1.clientX - touch2.clientX, 2) +
    Math.pow(touch1.clientY - touch2.clientY, 2)
  );

  // Centre entre les 2 doigts
  const center = {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };

  if (!lastDist.current) {
    lastDist.current = dist;
    lastCenter.current = center;
    return;
  }

  const oldScale = stage.scaleX();
  const scaleBy = dist / lastDist.current;
  const newScale = oldScale * scaleBy;

  const clampedScale = Math.max(0.5, Math.min(2, newScale));

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

  if (!viewer) {
  updateActiveProject({
    zoom: clampedScale * 100,
    stageX: newPos.x,
    stageY: newPos.y,
  });}

  lastDist.current = dist;
  lastCenter.current = center;
}}

>
    <Layer>

{/* BOARDS */}
{(activeProject.selectedBoards || []).map((b: AnyRow) => (
  <Group
    name="exportable"
    key={b.instanceId}
    x={b.x}
    y={b.y}
    draggable={!viewer}
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

  setSelectedBoardInstanceId(b.instanceId);
  setSelectedInstanceId(null);
}}

    onDragMove={(e) => {
  const node = e.target;

  const MOVE_THRESHOLD = 3;

  if (lastStablePos.current) {
    const dxMove = Math.abs(node.x() - lastStablePos.current.x);
    const dyMove = Math.abs(node.y() - lastStablePos.current.y);



    // ✅ vrai mouvement → on valide la position
    lastStablePos.current = {
      x: node.x(),
      y: node.y(),
    };
  }

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
}}}



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
/>

{/* 💎 Hover halo (desktop only) */}

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
      strokeWidth={1}
      opacity={0.25}
      cornerRadius={6}
      listening={false}
    />
)}

{!isDragging &&
  selectedBoardInstanceId === b.instanceId &&
  displaySizes[b.instanceId] && (
    
    <Rect
      x={-displaySizes[b.instanceId].w / 2}
      y={-displaySizes[b.instanceId].h / 2}
      width={displaySizes[b.instanceId].w}
      height={displaySizes[b.instanceId].h}
      stroke="white"
      strokeWidth={1}
      cornerRadius={6}
      listening={false}
    />
)}

          
{!isDragging &&
  !isMobile &&
  selectedBoardInstanceId === b.instanceId &&
  displaySizes[b.instanceId] && (

    <Rect
      x={-displaySizes[b.instanceId].w / 2}
      y={-displaySizes[b.instanceId].h / 2}
      width={displaySizes[b.instanceId].w}
      height={displaySizes[b.instanceId].h}
      stroke="white"
      strokeWidth={1}
      cornerRadius={6}
      listening={false}
    />
)}
        </Group>
      ))}

{/* PEDALS */}
{activeProject.boardPedals.map((p: AnyRow) => (
  <Group
    name="exportable"
    key={p.instanceId}
    x={p.x}
    y={p.y}
    rotation={p.rotation || 0}
    draggable={!viewer}
    instanceId={p.instanceId}

onDragStart={(e) => {
  setIsDragging(true);

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

  setSelectedInstanceId(p.instanceId);
  setSelectedBoardInstanceId(null);
}}



// MOVE ON CANVAS
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
}}

onDragEnd={(e) => {
  setTimeout(() => {
    setIsDragging(false);
  }, 0);

  const node = e.target;

  let finalX = node.x();
  let finalY = node.y();

  lastRenderedPos.current = null;

  if (!viewer) {
  updateActiveProject({
    boardPedals: activeProject.boardPedals.map((x: AnyRow) =>
      x.instanceId === p.instanceId
        ? {
            ...x,
            x: finalX,
            y: finalY,
          }
        : x
    ),
  });
}}}
>
<PedalImage
  url={p.image || p.image_url || p.photo || null}
  width={p.width}
  depth={p.depth}
  color={p.color}
  rotation={0}
onSizeReady={(nw, nh) => handleSizeUpdate?.(p.instanceId, nw, nh)}
/>

{/* 🎛 CUSTOM CONTROLS */}
{p.slug === "custom" &&
  displaySizes[p.instanceId] &&
  knob &&
  footswitch && (() => {

    const size = displaySizes[p.instanceId];

    // 🎛 tailles CUSTOM
    const SMALL_KNOB = 30;
    const MEDIUM_KNOB = 32;
    const LARGE_KNOB = 40;

    let knobSize =
      p.width < 50 ? SMALL_KNOB :
      p.width <= 100 ? MEDIUM_KNOB :
      LARGE_KNOB;

    const footswitchSize = 25;

    const knobCount =
      p.width < 50 ? 1 :
      p.width <= 100 ? 2 :
      3;

    // 📍 position verticale
    const knobY = -size.h / 2 + 20;

    // 👉 espacement contrôlé (centré)
    const spacing = size.w / (knobCount + 1);
    const spread = 1.25;

    return (
      <>
        {/* KNOBS */}
        {Array.from({ length: knobCount }).map((_, i) => {
          const offsetFromCenter =
            (i - (knobCount - 1) / 2) * spacing * spread;

          return (
            <KonvaImage
              key={i}
              image={knob}
              width={knobSize}
              height={knobSize}
              x={offsetFromCenter - knobSize / 2}
              y={knobY}
              listening={false}
            />
          );
        })}

        {/* FOOTSWITCH */}
        <KonvaImage
          image={footswitch}
          width={footswitchSize}
          height={footswitchSize}
          x={-footswitchSize / 2}
          y={size.h / 2 - 35}
          listening={false}
        />
      </>
    );
})()}

{p.slug === "custom" && p.name && displaySizes[p.instanceId] && (
  <Text
    text={p.name.toUpperCase()}
    fontSize={12}    
    fill="#000000"
    align="center"
    verticalAlign="middle"
    width={displaySizes[p.instanceId].w}
    height={displaySizes[p.instanceId].h}
    x={-displaySizes[p.instanceId].w / 2}
    y={-displaySizes[p.instanceId].h / 2}
    fontStyle="bold"      
    stroke="#000000"       
    strokeWidth={0.8}   
    letterSpacing={1}        
    listening={false}
  />
)}

         {/* 💎 Hover halo (desktop only) */}
{!isDragging &&
  hoveredPedalId === p.instanceId &&
  selectedInstanceId !== p.instanceId &&
  displaySizes[p.instanceId] && (
    <Rect
      x={-displaySizes[p.instanceId].w / 2}
      y={-displaySizes[p.instanceId].h / 2}
      width={displaySizes[p.instanceId].w}
      height={displaySizes[p.instanceId].h}
      stroke="white"
      strokeWidth={1}
      opacity={0.25}
      cornerRadius={6}
      listening={false}
    />
)}

{!isDragging &&
  selectedInstanceId === p.instanceId &&
  displaySizes[p.instanceId] && (
    
  <Rect
    x={-displaySizes[p.instanceId].w / 2}
    y={-displaySizes[p.instanceId].h / 2}
    width={displaySizes[p.instanceId].w}
    height={displaySizes[p.instanceId].h}
    stroke="white"
    strokeWidth={1}
    cornerRadius={6}
    listening={false}
  />
)}



        </Group>
      ))}

        </Layer>
  </Stage>
)}

{!viewer && overlayPosition && !isDragging && !isStageDragging && (
  <div
    style={{
      position: "absolute",
      left: overlayPosition.x,
      top: overlayPosition.y,
      transform: "translate(-50%, -100%)",
      zIndex: 10,
    }}
    className="pointer-events-auto"
  >
    <div className="flex items-center justify-between w-20 lg:w-14 h-6 px-2 bg-black/90 backdrop-blur-md rounded-full shadow-lg">

      <button
  onClick={() => {
    if (selectedInstanceId !== null) {
      rotatePedal(selectedInstanceId);
    }
    if (selectedBoardInstanceId !== null) {
      rotateBoard(selectedBoardInstanceId);
    }
  }}
  className="text-white"
>
  <RotateCw
    size={14}
    className="transition-colors duration-150 hover:text-blue-500"
  />
</button>

{isMobile && (selectedInstanceId !== null || selectedBoardInstanceId !== null) && (
  <button
    onClick={() => {
      setSpecsOpen(true);
    }}
    className="text-white"
  >
    <Info
      size={14}
      className="transition-colors hover:text-blue-500"
    />
  </button>
)}

<button
  onClick={() => {
    if (selectedInstanceId !== null) {
      deletePedal(selectedInstanceId);
    }
    if (selectedBoardInstanceId !== null) {
      deleteBoard(selectedBoardInstanceId);
    }
  }}
  className="text-white"
>
  <Trash2
    size={14}
    className="transition-colors hover:text-red-500"
  />
</button>

    </div>
  </div>
)}

{showIntro && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div className="max-w-2xl text-center px-8">

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-8">
        {t("canvasIntro.title")}
      </h2>

      {/* Main text */}
      <p className="whitespace-pre-line text-[15px] text-zinc-300 leading-relaxed">
        {isMobile
          ? t("canvasIntro.mobileText")
          : t("canvasIntro.desktopText")}
      </p>

      {!isMobile && (
        <p className="text-[15px] text-zinc-300 leading-relaxed mt-4">
          {t("canvasIntro.desktopExtra")}
        </p>
      )}

      {/* Punchline */}
      <p className="mt-10 text-[10px] tracking-widest uppercase text-zinc-400">
        {t("canvasIntro.text3")}
      </p>

    </div>
  </div>
)}

</div>
);
}