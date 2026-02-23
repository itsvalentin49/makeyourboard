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
  dimensions: { width: number; height: number };

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
  getDragBounds: (
    id: number,
    rotation: number,
    pos: { x: number; y: number }
  ) => { x: number; y: number };
  closeSearchMenus: () => void;

  BACKGROUNDS: Background[];
  canvasBg: string;
  setCanvasBg: (v: string) => void;
};

export default function BoardCanvas({
  dimensions,
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
  getDragBounds,
  closeSearchMenus,
  BACKGROUNDS,
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

  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
      closeSearchMenus();
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

  const ZOOM_FACTOR = 1.5;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-x-visible overflow-y-hidden pb-20"
      style={
        canvasBg === "neutral"
          ? undefined
          : {
              backgroundImage: `url(${
                BACKGROUNDS.find((b) => b.id === canvasBg)?.src
              })`,
              backgroundSize: "cover",
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
    {formatWeight(totalWeight, units, language).replace(/ ?(kg|lb|g)$/, "")}
  </span>

  {/* Unité à droite */}
  <span className="absolute right-3 text-[10px] text-zinc-500">
    {units === "metric" ? "kg" : "lb"}
  </span>

</div>
</div>

      {stageSize.width > 0 && stageSize.height > 0 && (
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={currentZoom / 100}
          scaleY={currentZoom / 100}
          onClick={handleStageClick}
        >
          <Layer>
            {(activeProject.selectedBoards || []).map((b: AnyRow) => (
              <Group
                key={b.instanceId}
                x={b.x}
                y={b.y}
                draggable
                rotation={b.rotation || 0}
                onClick={(e: any) => {
                  e.cancelBubble = true;
                  setSelectedBoardInstanceId(b.instanceId);
                  setSelectedInstanceId(null);
                }}
                dragBoundFunc={(pos: any) =>
                  getDragBounds(b.instanceId, b.rotation || 0, pos)
                }
                onDragEnd={(e: any) => {
                  const pos = getDragBounds(
                    b.instanceId,
                    b.rotation || 0,
                    e.target.position()
                  );
                  updateActiveProject({
                    selectedBoards: (activeProject.selectedBoards || []).map(
                      (x: AnyRow) =>
                        x.instanceId === b.instanceId
                          ? { ...x, x: pos.x, y: pos.y }
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
                      cornerRadius={8}
                      shadowColor="white"
                      shadowBlur={8}
                      shadowOpacity={0.6}
                      listening={false}
                    />
                  )}
              </Group>
            ))}

            {activeProject.boardPedals.map((p: AnyRow) => {
              const size = displaySizes[p.instanceId];
              const w = size?.w ?? p.width * ZOOM_FACTOR;
              const h = size?.h ?? p.depth * ZOOM_FACTOR;

              return (
                <Group
                  key={p.instanceId}
                  x={p.x}
                  y={p.y}
                  rotation={p.rotation || 0}
                  draggable
                  onClick={(e: any) => {
                    e.cancelBubble = true;
                    setSelectedInstanceId(p.instanceId);
                    setSelectedBoardInstanceId(null);
                  }}
                  onTap={(e: any) => {
                    e.cancelBubble = true;
                    setSelectedInstanceId(p.instanceId);
                    setSelectedBoardInstanceId(null);
                  }}
                  dragBoundFunc={(pos: any) =>
                    getDragBounds(p.instanceId, p.rotation || 0, pos)
                  }
                  onDragEnd={(e: any) => {
                    const pos = getDragBounds(
                      p.instanceId,
                      p.rotation || 0,
                      e.target.position()
                    );
                    updateActiveProject({
                      boardPedals: activeProject.boardPedals.map(
                        (x: AnyRow) =>
                          x.instanceId === p.instanceId
                            ? { ...x, x: pos.x, y: pos.y }
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

                  {selectedInstanceId === p.instanceId && (
                    <Rect
                      x={-w / 2}
                      y={-h / 2}
                      width={w}
                      height={h}
                      stroke="white"
                      strokeWidth={2}
                      cornerRadius={8}
                      shadowColor="white"
                      shadowBlur={8}
                      shadowOpacity={0.6}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
}