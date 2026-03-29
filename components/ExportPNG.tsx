"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTranslator } from "@/utils/i18n";

type AnyRow = Record<string, any>;

type Props = {
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  displaySizes: Record<number, { w: number; h: number }>;
  boardName?: string;
};

export default function ExportPNG({
  boardPedals,
  selectedBoards = [],
  displaySizes,
  boardName,
}: Props) {

    const language =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("myb_settings") || "{}")?.language || "en"
    : "en";

    const t = getTranslator(language);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(boardName || "pedalboard");

  // ✅ NEW: background option
  const [background, setBackground] = useState<"transparent" | "white">("transparent");

  // ✅ NEW: preview canvas ref
  const previewRef = useRef<HTMLCanvasElement | null>(null);

  const exportPNG = async (isPreview = false) => {
    if (!boardPedals?.length) return;

    if (!isPreview) setLoading(true);

    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      };

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      const allItems = [...boardPedals, ...selectedBoards];

      allItems.forEach((item) => {
        const size = displaySizes[Number(item.instanceId)];
        if (!size) return;

        const w = size.w;
        const h = size.h;

        minX = Math.min(minX, item.x - w / 2);
        minY = Math.min(minY, item.y - h / 2);
        maxX = Math.max(maxX, item.x + w / 2);
        maxY = Math.max(maxY, item.y + h / 2);
      });

const PADDING_X = 5;
const PADDING_TOP = 4;
const PADDING_BOTTOM = 6;

minX -= PADDING_X;
maxX += PADDING_X;

minY -= PADDING_TOP;
maxY += PADDING_BOTTOM;

      const width = maxX - minX;
      const height = maxY - minY;

      const loadedImages: Record<number, HTMLImageElement> = {};
      let maxScale = 1;

      for (const p of boardPedals) {
        if (!p.image) continue;

        const size = displaySizes[Number(p.instanceId)];
        if (!size) continue;

        const img = await loadImage(p.image);
        loadedImages[p.instanceId] = img;

        const ratio = img.naturalWidth / size.w;
        maxScale = Math.max(maxScale, ratio);
      }

      let SCALE = Math.min(5, maxScale);

      const MAX_CANVAS = 8000;
      if (width * SCALE > MAX_CANVAS) {
        SCALE = MAX_CANVAS / width;
      }

      const canvas = isPreview
        ? previewRef.current!
        : document.createElement("canvas");

      canvas.width = width * SCALE;
      canvas.height = height * SCALE;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(SCALE, SCALE);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // ✅ NEW: background handling
      if (background === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      // ===============================
      // 🟫 DRAW BOARDS
      // ===============================
      for (const b of selectedBoards) {
        if (!b.image) continue;

        const size = displaySizes[Number(b.instanceId)];
        if (!size) continue;

        const img = await loadImage(b.image);

        const w = size.w;
        const h = size.h;

        const drawX = b.x - minX;
        const drawY = b.y - minY;

        ctx.drawImage(
          img,
          drawX - w / 2,
          drawY - h / 2,
          w,
          h
        );
      }

      // ===============================
      // 🎸 DRAW PEDALS
      // ===============================
      for (const p of boardPedals) {
        const img = loadedImages[p.instanceId];
        if (!img) continue;

        const size = displaySizes[Number(p.instanceId)];
        if (!size) continue;

        const w = size.w;
        const h = size.h;

        const drawX = p.x - minX;
        const drawY = p.y - minY;

        const rotation = ((p.rotation || 0) * Math.PI) / 180;

        ctx.save();

        ctx.translate(drawX, drawY);
        ctx.rotate(rotation);

        ctx.shadowColor = "rgba(0,0,0,0.2)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        ctx.drawImage(
          img,
          -w / 2,
          -h / 2,
          w,
          h
        );

        ctx.restore();
      }

      // ===============================
      // 📥 EXPORT
      // ===============================
      if (!isPreview) {
        canvas.toBlob((blob) => {
          if (!blob) return;

          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download =
            background === "white" ? `${name}.jpg` : `${name}.png`;
          link.click();

          URL.revokeObjectURL(url);
        }, background === "white" ? "image/jpeg" : "image/png", 0.92);
      }

    } catch (e) {
      console.error("Export error:", e);
    }

    if (!isPreview) {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // ✅ NEW: auto preview refresh
  useEffect(() => {
    exportPNG(true);
  }, [background, boardPedals]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4">

      {/* ✅ TITLE */}
<div className="text-xs font-bold uppercase text-white tracking-wider">
  {t("export.title")}
</div>

      {/* NAME */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-white font-bold">
          {t("export.name")}
        </label>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="
            h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700
            text-[12px] font-mono text-white
            focus:outline-none focus:border-blue-500
          "
        />
      </div>

      {/* ✅ BACKGROUND */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-white font-bold">
          {t("export.background")}
        </label>

        <div className="flex flex-col gap-1 text-xs text-white">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={background === "transparent"}
              onChange={() => setBackground("transparent")}
            />
            {t("export.transparent")}
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={background === "white"}
              onChange={() => setBackground("white")}
            />
            {t("export.white")}
          </label>
        </div>
      </div>

      {/* ✅ PREVIEW */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-white font-bold">
          {t("export.preview")}
        </label>

        <div className="bg-zinc-800 rounded-md p-2 flex items-center justify-center">
          <canvas
            ref={previewRef}
            className="max-w-full max-h-40"
          />
        </div>
      </div>

      <button
  onClick={() => exportPNG(false)}
  className="
    w-full h-10
    bg-blue-500
    !text-white
    text-[12px] uppercase font-mono font-bold
    rounded-md
    flex items-center justify-center
    transition-all duration-150
    hover:bg-blue-600 hover:scale-[1.02] transform-gpu
    active:scale-95
  "
>
  <div className="relative flex items-center justify-center w-full">
    
    {/* TEXTE (toujours présent mais invisible en loading) */}
    <span className={loading ? "opacity-0" : "opacity-100"}>
      {t("export.download")}
    </span>

    {/* SPINNER (position absolue) */}
    {loading && (
      <div className="absolute w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    )}

  </div>
</button>
    </div>
  );
}