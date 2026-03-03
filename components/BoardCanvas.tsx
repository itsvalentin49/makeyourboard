"use client";

import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { Stage, Layer, Group, Rect, Text } from "react-konva";
import { Zap, Weight, Minus, Plus } from "lucide-react";
import PedalImage from "@/components/PedalImage";
import { formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";
import { RotateCw, Trash2, X } from "lucide-react";

type AnyRow = Record<string, any>;

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
};

type Props = {
activeProject: {
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  zoom?: number;
  stageX?: number;
  stageY?: number;
};

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
}: Props) {

  const t = getTranslator(language);
  const currentZoom = activeProject.zoom || 100;
  const zoomPercent = Math.round(currentZoom);
  const MIN_ZOOM = 50;
  const MAX_ZOOM = 150;

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
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  
  

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
  const [hoveredBoardId, setHoveredBoardId] = useState<number | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<{
  x: number;
  y: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

}, [
  selectedInstanceId,
  selectedBoardInstanceId,
  activeProject.boardPedals,
  activeProject.selectedBoards,
  displaySizes,
  currentZoom,
  stagePos,
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
      className={`relative w-full h-full overflow-hidden ${isMobile ? "pb-6" : "pb-20"}`}
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
      {!(isMobile && mobileSidebarOpen) && (
  <div className="absolute bottom-6 left-6 flex items-center gap-4 z-50">



  {/* Desktop uniquement */}
  {!isMobile && (
    <>

    {/* ZOOM */}
      <div className="relative flex items-center justify-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl">

  {/* Icône gauche */}
  <span className="absolute left-3 text-sm">🔍</span>

  {/* % parfaitement centré */}
  <span className="text-[12px] font-black font-mono tabular-nums">
    {zoomPercent}%
  </span>

  {/* MIN / MAX toujours à droite */}
  {(isMinZoom || isMaxZoom) && (
    <span className="absolute right-3 text-[9px] text-zinc-500 tracking-wider uppercase">
      {isMinZoom ? "MIN" : "MAX"}
    </span>
  )}

</div>

      {/* TOTAL DRAW */}
      <div className="relative flex items-center justify-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">
        <Zap className="absolute left-3 size-4 text-yellow-500" />
        <span className="text-[12px] font-black font-mono tabular-nums">
          {totalDraw}
        </span>
        <span className="absolute right-3 text-[10px] text-zinc-500">
          mA
        </span>
      </div>

      {/* TOTAL WEIGHT */}
      <div className="relative flex items-center justify-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">
        <Weight className="absolute left-3 size-4 text-blue-500" />
        <span className="text-[12px] font-black font-mono tabular-nums">
          {weightValue}
        </span>
        <span className="absolute right-3 text-[10px] text-zinc-500">
          {weightUnit}
        </span>
      </div>
    </>
  )}

</div>
)}

      {stageSize.width > 0 && stageSize.height > 0 && (

<Stage
  ref={stageRef}
  width={stageSize.width}
  height={stageSize.height}
  draggable={false}
  x={activeProject.stageX || 0}
  y={activeProject.stageY || 0}
  scaleX={(activeProject.zoom || 100) / 100}
  scaleY={(activeProject.zoom || 100) / 100}
  onClick={handleStageClick}
  onWheel={(e: any) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;

    const newScale =
      direction > 0
        ? oldScale * scaleBy
        : oldScale / scaleBy;

    const clampedScale = Math.max(0.5, Math.min(1.5, newScale));

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
  }}
>
    <Layer>

{/* BOARDS */}
{(activeProject.selectedBoards || []).map((b: AnyRow) => (
  <Group
    key={b.instanceId}
    x={b.x}
    y={b.y}
    draggable
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
  e.cancelBubble = true;

  setSelectedBoardInstanceId(b.instanceId);
  setSelectedInstanceId(null);
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
}}

   onDragEnd={(e) => {
  setIsDragging(false);

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
              handleSizeUpdate(b.instanceId, w, h)
            }
            
          />

          <PedalImage
  url={b.image || b.image_url || b.photo || null}
  width={b.width}
  depth={b.depth}
  color={b.color}
  isBoard
  rotation={0}
  onSizeReady={(w, h) =>
    handleSizeUpdate(b.instanceId, w, h)
  }
/>

{/* 💎 Hover halo (desktop only) */}
{hoveredBoardId === b.instanceId &&
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

{selectedBoardInstanceId === b.instanceId &&
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

          
          {!isMobile &&
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
    key={p.instanceId}
    x={p.x}
    y={p.y}
    rotation={p.rotation || 0}
    draggable

    onDragStart={() => {
      setIsDragging(true);
    }}

    onMouseEnter={() => {
      if (!isMobile) setHoveredPedalId(p.instanceId);
    }}

    onMouseLeave={() => {
      if (!isMobile) setHoveredPedalId(null);
    }}

    onClick={(e) => {
  e.cancelBubble = true;

  setSelectedInstanceId(p.instanceId);
  setSelectedBoardInstanceId(null);
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
}}

    onDragEnd={(e) => {
  setIsDragging(false);

  updateActiveProject({
    boardPedals: activeProject.boardPedals.map((x: AnyRow) =>
      x.instanceId === p.instanceId
        ? {
            ...x,
            x: e.target.x(),
            y: e.target.y(),
          }
        : x
    ),
  });
}}
  >
          <PedalImage
            url={p.image || p.image_url || p.photo || null}
            width={p.width}
            depth={p.depth}
            color={p.color}
            rotation={0}
            onSizeReady={(nw, nh) =>
              handleSizeUpdate(p.instanceId, nw, nh)
            }
          />

          {/* 💎 Hover halo (desktop only) */}
{hoveredPedalId === p.instanceId &&
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

          {selectedInstanceId === p.instanceId &&
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

{overlayPosition && !isDragging && (
  <div
    style={{
      position: "absolute",
      left: overlayPosition.x,
      top: overlayPosition.y,
      transform: "translate(-50%, -100%)",
      zIndex: 100,
    }}
    className="pointer-events-auto"
  >
    <div className="flex items-center justify-between w-14 h-6 px-2 bg-black/90 backdrop-blur-md rounded-full shadow-lg">

      <button
  onClick={() => {
    if (selectedInstanceId !== null) {
      rotatePedal(selectedInstanceId);
    }
    if (selectedBoardInstanceId !== null) {
      rotateBoard(selectedBoardInstanceId);
    }
  }}
  className="text-white hover:text-blue-500 transition-colors duration-150"
>
  <RotateCw size={14} />
</button>

<button
  onClick={() => {
    if (selectedInstanceId !== null) {
      deletePedal(selectedInstanceId);
    }
    if (selectedBoardInstanceId !== null) {
      deleteBoard(selectedBoardInstanceId);
    }
  }}
  className="text-white hover:text-red-500 transition-colors"
>
  <Trash2 size={14} />
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