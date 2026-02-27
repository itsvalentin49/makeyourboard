"use client";

import React, { useRef, useLayoutEffect, useState } from "react";
import { Stage, Layer, Group, Rect } from "react-konva";
import { Zap, Weight, Minus, Plus } from "lucide-react";
import PedalImage from "@/components/PedalImage";
import { formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";

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
  };

  units: "metric" | "imperial";
  language: "en" | "fr" | "es" | "de" | "it" | "pt";

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
}: Props) {
  const t = getTranslator(language);
  const currentZoom = activeProject.zoom || 100;

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
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      setStageSize({
        width: rect.width,
        height: rect.height,
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  

  const getDragBoundsLocal = (
  id: number,
  rotation: number,
  pos: { x: number; y: number }
) => {
  const size = displaySizes[id];
  if (!size) return pos;

  const scale = currentZoom / 100;

  const isVertical = (rotation / 90) % 2 !== 0;

  const w = (isVertical ? size.h : size.w);
  const h = (isVertical ? size.w : size.h);

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
      className="flex-1 relative overflow-hidden pb-20"
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
      {/* ZOOM + TOTAL DRAW + TOTAL WEIGHT */}
<div className="absolute bottom-6 left-6 flex items-end gap-4 z-50">

  {/* ZOOM */}
<div className="flex items-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl">

  <button
    onClick={() =>
      updateActiveProject({ zoom: Math.max(25, currentZoom - 5) })
    }
    className="w-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
  >
    <Minus size={14} />
  </button>

  <div className="w-12 text-center text-[12px] font-black font-mono tabular-nums text-zinc-300">
    {currentZoom}
    <span className="ml-1">%</span>
  </div>

  <button
    onClick={() =>
      updateActiveProject({ zoom: Math.min(200, currentZoom + 5) })
    }
    className="w-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
  >
    <Plus size={14} />
  </button>

</div>

  {/* TOTAL DRAW */}
<div className="relative flex items-center justify-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">

  {/* Icône à gauche */}
  <Zap className="absolute left-3 size-4 text-yellow-500" />

  {/* Valeur centrée */}
  <span className="text-[12px] font-black font-mono tabular-nums">
    {totalDraw}
  </span>

  {/* Unité à droite */}
  <span className="absolute right-3 text-[10px] text-zinc-500">
    mA
  </span>

</div>

{/* TOTAL WEIGHT */}
<div className="relative flex items-center justify-center h-10 w-28 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-2xl pointer-events-none">

  {/* Icône à gauche */}
  <Weight className="absolute left-3 size-4 text-blue-500" />

  {/* Valeur centrée */}
  <span className="text-[12px] font-black font-mono tabular-nums">
    {weightValue}
  </span>

  {/* Unité à droite */}
  <span className="absolute right-3 text-[10px] text-zinc-500">
    {weightUnit}
  </span>

</div>
</div>

      {stageSize.width > 0 && stageSize.height > 0 && (
  <Stage
    width={stageSize.width}
    height={stageSize.height}
    scaleX={currentZoom / 100}
    scaleY={currentZoom / 100}
    onPointerDown={handleStageClick}
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

  onPointerDown={(e) => {
    e.cancelBubble = true; // empêche le stage de désélectionner
    setSelectedBoardInstanceId(b.instanceId);
    setSelectedInstanceId(null);
  }}

          

          onDragMove={(e) => {
            const node = e.target;
            const scale = currentZoom / 100;

            const stageW = stageSize.width;
            const stageH = stageSize.height;

            const box = node.getClientRect({ skipTransform: false });

            const width = box.width / scale;
            const height = box.height / scale;

            let x = node.x();
            let y = node.y();

            if (x - width / 2 < 0) x = width / 2;
            if (y - height / 2 < 0) y = height / 2;
            if (x + width / 2 > stageW / scale)
              x = stageW / scale - width / 2;
            if (y + height / 2 > stageH / scale)
              y = stageH / scale - height / 2;

            node.position({ x, y });
          }}

          onDragEnd={(e) => {
            updateActiveProject({
              selectedBoards: (activeProject.selectedBoards || []).map(
                (x: AnyRow) =>
                  x.instanceId === b.instanceId
                    ? { ...x, x: e.target.x(), y: e.target.y() }
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
          {selectedBoardInstanceId === b.instanceId &&
  displaySizes[b.instanceId] && (
    <Rect
      x={-displaySizes[b.instanceId].w / 2}
      y={-displaySizes[b.instanceId].h / 2}
      width={displaySizes[b.instanceId].w}
      height={displaySizes[b.instanceId].h}
      stroke="white"
      strokeWidth={2}
      cornerRadius={12}
      shadowColor="white"
      shadowBlur={12}
      shadowOpacity={0.9}
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

  onPointerDown={(e) => {
    e.cancelBubble = true; // empêche le stage click
    setSelectedInstanceId(p.instanceId);
    setSelectedBoardInstanceId(null);
  }}

          onDragMove={(e) => {
            const node = e.target;
            const scale = currentZoom / 100;

            const stageW = stageSize.width;
            const stageH = stageSize.height;

            const box = node.getClientRect({ skipTransform: false });

            const width = box.width / scale;
            const height = box.height / scale;

            let x = node.x();
            let y = node.y();

            if (x - width / 2 < 0) x = width / 2;
            if (y - height / 2 < 0) y = height / 2;
            if (x + width / 2 > stageW / scale)
              x = stageW / scale - width / 2;
            if (y + height / 2 > stageH / scale)
              y = stageH / scale - height / 2;

            node.position({ x, y });
          }}

          onDragEnd={(e) => {
            updateActiveProject({
              boardPedals: activeProject.boardPedals.map(
                (x: AnyRow) =>
                  x.instanceId === p.instanceId
                    ? { ...x, x: e.target.x(), y: e.target.y() }
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
          {selectedInstanceId === p.instanceId && displaySizes[p.instanceId] && (
  <Rect
    x={-displaySizes[p.instanceId].w / 2}
    y={-displaySizes[p.instanceId].h / 2}
    width={displaySizes[p.instanceId].w}
    height={displaySizes[p.instanceId].h}
    stroke="white"
    strokeWidth={2}
    cornerRadius={12}
    shadowColor="white"
    shadowBlur={12}
    shadowOpacity={0.9}
    listening={false}
  />
)}
          
        </Group>
      ))}

    </Layer>
  </Stage>
)}
    </div>
  );
}