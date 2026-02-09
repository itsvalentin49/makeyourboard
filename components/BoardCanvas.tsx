"use client";

import React, { useRef, useLayoutEffect, useState } from "react";
import { Stage, Layer, Group, Rect } from "react-konva";
import { Zap, Weight, Minus, Plus, Square } from "lucide-react";
import PedalImage from "@/components/PedalImage";
import { formatWeight } from "@/utils/units";

type AnyRow = Record<string, any>;

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
};

type Props = {
  // sizing
  dimensions: { width: number; height: number };

  // project / board data
  activeProject: {
    boardPedals: AnyRow[];
    selectedBoards?: AnyRow[];
    zoom?: number;
  };

  // units
  units: "metric" | "imperial";

  // selection
  selectedInstanceId: number | null;
  setSelectedInstanceId: (v: number | null) => void;

  selectedBoardInstanceId: number | null;
  setSelectedBoardInstanceId: (v: number | null) => void;

  // helpers from page
  displaySizes: Record<number, { w: number; h: number }>;
  handleSizeUpdate: (id: number, w: number, h: number) => void;

  updateActiveProject: (updates: Partial<Props["activeProject"]>) => void;
  getDragBounds: (id: number, rotation: number, pos: { x: number; y: number }) => { x: number; y: number };
  closeSearchMenus: () => void;

  // background selector
  BACKGROUNDS: Background[];
  canvasBg: string;
  setCanvasBg: (v: string) => void;
};

export default function BoardCanvas({
  dimensions,
  activeProject,
  units,
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
  setCanvasBg,
}: Props) {
  const currentZoom = activeProject.zoom || 100;

  const totalDraw = activeProject.boardPedals.reduce((sum, p) => sum + (Number(p.draw) || 0), 0);
  const totalWeight =
    activeProject.boardPedals.reduce((sum, p) => sum + (Number(p.weight) || 0), 0) +
    ((activeProject.selectedBoards || []).reduce((sum, b) => sum + (Number(b.weight) || 0), 0) || 0);

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


  measure(); // mesure au chargement
  window.addEventListener("resize", measure);

  return () => {
    window.removeEventListener("resize", measure);
  };
}, []);


  const ZOOM_FACTOR = 1.5;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden pb-20"
      style={
        canvasBg === "neutral"
          ? undefined
          : {
              backgroundImage: `url(${BACKGROUNDS.find((b) => b.id === canvasBg)?.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
      }
    >
      

      {/* ZOOM CONTROLS */}
      <div className="absolute bottom-6 left-6 flex items-center bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-1.5 shadow-2xl z-50">
        <button
          onClick={() => updateActiveProject({ zoom: Math.max(25, currentZoom - 5) })}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={() => updateActiveProject({ zoom: 100 })}
          className="px-2 text-[10px] font-black w-12 text-center text-zinc-400 hover:text-white transition-colors"
        >
          {currentZoom}%
        </button>

        <button
          onClick={() => updateActiveProject({ zoom: Math.min(200, currentZoom + 5) })}
          className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* INDICATORS */}
      <div className="absolute bottom-6 right-6 flex gap-4 pointer-events-none z-50">
        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Zap className="size-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">
              Total Draw
            </p>
            <p className="text-lg font-black font-mono leading-none">
              {totalDraw} <span className="text-[10px] text-zinc-500">mA</span>
            </p>
          </div>
        </div>

        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Weight className="size-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">
              Total Weight
            </p>
            <p className="text-lg font-black font-mono leading-none">
  {units === "metric"
    ? (totalWeight / 1000).toFixed(2)
    : totalWeight / 453.592 < 1
    ? (totalWeight / 28.3495).toFixed(1)
    : (totalWeight / 453.592).toFixed(1)}
  <span className="text-[10px] text-zinc-500 ml-1">
    {units === "metric"
      ? "kg"
      : totalWeight / 453.592 < 1
      ? "oz"
      : "lb"}
  </span>
</p>


          </div>
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
              onClick={(e: any) => {
                e.cancelBubble = true;
                setSelectedBoardInstanceId(b.instanceId);
                setSelectedInstanceId(null);
              }}
              dragBoundFunc={(pos: any) => getDragBounds(b.instanceId, b.rotation || 0, pos)}
              onDragEnd={(e: any) => {
                const pos = getDragBounds(b.instanceId, b.rotation || 0, e.target.position());
                updateActiveProject({
                  selectedBoards: (activeProject.selectedBoards || []).map((x: AnyRow) =>
                    x.instanceId === b.instanceId ? { ...x, x: pos.x, y: pos.y } : x
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
                rotation={b.rotation || 0}
                onSizeReady={(w, h) => handleSizeUpdate(b.instanceId, w, h)}
              />

              {selectedBoardInstanceId === b.instanceId && displaySizes[b.instanceId] && (
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
                dragBoundFunc={(pos: any) => getDragBounds(p.instanceId, p.rotation || 0, pos)}
                onDragEnd={(e: any) => {
                  const pos = getDragBounds(p.instanceId, p.rotation || 0, e.target.position());
                  updateActiveProject({
                    boardPedals: activeProject.boardPedals.map((x: AnyRow) =>
                      x.instanceId === p.instanceId ? { ...x, x: pos.x, y: pos.y } : x
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
                  onSizeReady={(nw, nh) => handleSizeUpdate(p.instanceId, nw, nh)}
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
