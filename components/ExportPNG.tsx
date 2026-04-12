"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTranslator } from "@/utils/i18n";

type AnyRow = Record<string, any>;

type Props = {
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  displaySizes: Record<number, { w: number; h: number }>;
  boardName?: string;
  canvasBg: string;

  currentBackground?: {
    type: "css" | "image";
    src?: string;
  };
};

export default function ExportPNG({
  boardPedals,
  selectedBoards = [],
  displaySizes,
  boardName,
  currentBackground,
  canvasBg,
  
}: Props) {
  const language =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myb_settings") || "{}")?.language || "en"
      : "en";

  const t = getTranslator(language);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(boardName || "pedalboard");
  const [background, setBackground] = useState<
  "transparent" | "white" | "current"
>("transparent");

  const previewRef = useRef<HTMLCanvasElement | null>(null);

  // ===============================
  // 🖼️ PREVIEW RENDER
  // ===============================
  const renderPreview = async () => {
    if (!boardPedals?.length) return;

try {
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  const knobImg = await loadImage("/images/knob.png");
  const footswitchImg = await loadImage("/images/footswitch.png");

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

  const allItems = [...boardPedals, ...selectedBoards];

allItems.forEach((item) => {
  const size = displaySizes[Number(item.instanceId)];
  if (!size) return;

  const isVertical = (item.rotation || 0) % 180 !== 0;

  const w = isVertical ? size.h : size.w;
  const h = isVertical ? size.w : size.h;

        minX = Math.min(minX, item.x - w / 2);
        minY = Math.min(minY, item.y - h / 2);
        maxX = Math.max(maxX, item.x + w / 2);
        maxY = Math.max(maxY, item.y + h / 2);
      });

      const PADDING = 5;

      minX -= PADDING;
      minY -= PADDING;
      maxX += PADDING;
      maxY += PADDING;

      const width = maxX - minX;
      const height = maxY - minY;

      const canvas = previewRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const SCALE = 2;

      canvas.width = width * SCALE;
      canvas.height = height * SCALE;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(SCALE, SCALE);
      ctx.clearRect(0, 0, width, height);

      // 🎨 BACKGROUND
if (background === "white") {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

if (background === "current" && currentBackground) {
  if (currentBackground.type === "css") {
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--zinc-600");
    ctx.fillRect(0, 0, width, height);
  }

  if (currentBackground.type === "image" && currentBackground.src) {
    const bgImg = await loadImage(currentBackground.src);
    ctx.drawImage(bgImg, 0, 0, width, height);
  }
}

      ctx.imageSmoothingEnabled = true;

      const loadedImages: Record<number, HTMLImageElement> = {};

      for (const p of boardPedals) {
        if (!p.image) continue;
        loadedImages[p.instanceId] = await loadImage(p.image);
      }

      // BOARDS
      for (const b of selectedBoards) {
        if (!b.image) continue;

        const size = displaySizes[Number(b.instanceId)];
        if (!size) continue;

        const img = await loadImage(b.image);

        const w = size.w;
        const h = size.h;

        const drawX = b.x - minX;
        const drawY = b.y - minY;

        ctx.drawImage(img, drawX - w / 2, drawY - h / 2, w, h);
      }

      // PEDALS
for (const p of boardPedals) {
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

  // 🎨 CUSTOM BACKGROUND
if (p.slug === "custom") {
  const radius = 12;

  ctx.beginPath();
  ctx.moveTo(-w / 2 + radius, -h / 2);
  ctx.lineTo(w / 2 - radius, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
  ctx.lineTo(w / 2, h / 2 - radius);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
  ctx.lineTo(-w / 2 + radius, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
  ctx.lineTo(-w / 2, -h / 2 + radius);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
  ctx.closePath();
  ctx.clip();

  // 🎨 couleur
  ctx.fillStyle = p.color || "#888";
  ctx.fill();

  // 🧱 texture par-dessus
  const img = loadedImages[p.instanceId];
  if (img) {
    ctx.globalAlpha = 0.25; // 🔥 ajuste ici (0.2 → 0.4)
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;
  }
}

  // IMAGE
if (p.slug !== "custom") {
  const img = loadedImages[p.instanceId];
  if (img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
}

  // CUSTOM CONTROLS
  if (p.slug === "custom") {
    const knobSize =
      p.width < 50 ? 30 :
      p.width <= 100 ? 32 :
      40;

    const footswitchSize = 25;

    const knobCount =
      p.width < 50 ? 1 :
      p.width <= 100 ? 2 :
      3;

    const knobY = -h / 2 + 20;
    const spacing = w / (knobCount + 1);
    const spread = 1.25;

    for (let i = 0; i < knobCount; i++) {
      const offset =
        (i - (knobCount - 1) / 2) * spacing * spread;

      ctx.drawImage(
        knobImg,
        offset - knobSize / 2,
        knobY,
        knobSize,
        knobSize
      );
    }

    ctx.drawImage(
      footswitchImg,
      -footswitchSize / 2,
      h / 2 - 35,
      footswitchSize,
      footswitchSize
    );

    if (p.name) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(p.name.toUpperCase(), 0, 0);
    }
  }

  ctx.restore();
}
    } catch (e) {
      console.error(e);
    }
  };

  // ===============================
  // 📥 EXPORT
  // ===============================
const exportPNG = async () => {
  setLoading(true);

  try {
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
const knobImg = await loadImage("/images/knob.png");
const footswitchImg = await loadImage("/images/footswitch.png");
    const allItems = [...boardPedals, ...selectedBoards];

allItems.forEach((item) => {
  const size = displaySizes[Number(item.instanceId)];
  if (!size) return;

  const isVertical = (item.rotation || 0) % 180 !== 0;

  const w = isVertical ? size.h : size.w;
  const h = isVertical ? size.w : size.h;

  minX = Math.min(minX, item.x - w / 2);
  minY = Math.min(minY, item.y - h / 2);
  maxX = Math.max(maxX, item.x + w / 2);
  maxY = Math.max(maxY, item.y + h / 2);
});

    const PADDING = 5;

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = maxX - minX;
    const height = maxY - minY;

    // 🔥 CANVAS HAUTE QUALITÉ
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SCALE = 6; // 🔥 🔥 🔥 QUALITÉ MAX

    canvas.width = width * SCALE;
    canvas.height = height * SCALE;

    ctx.scale(SCALE, SCALE);
    ctx.imageSmoothingEnabled = true;

    // 🎨 BACKGROUND EXPORT
if (background === "white") {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
}

if (background === "current" && currentBackground) {
  if (currentBackground.type === "css") {
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--zinc-600");
    ctx.fillRect(0, 0, width, height);
  }

  if (currentBackground.type === "image" && currentBackground.src) {
    const bgImg = await loadImage(currentBackground.src);
    ctx.drawImage(bgImg, 0, 0, width, height);
  }
}

    const loadedImages: Record<number, HTMLImageElement> = {};

    for (const p of boardPedals) {
      if (!p.image) continue;
      loadedImages[p.instanceId] = await loadImage(p.image);
    }

    // BOARDS
    for (const b of selectedBoards) {
      if (!b.image) continue;

      const size = displaySizes[Number(b.instanceId)];
      if (!size) continue;

      const img = await loadImage(b.image);

      const w = size.w;
      const h = size.h;

      const drawX = b.x - minX;
      const drawY = b.y - minY;

      ctx.drawImage(img, drawX - w / 2, drawY - h / 2, w, h);
    }

    // PEDALS
for (const p of boardPedals) {
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
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  // 🎨 CUSTOM BACKGROUND
if (p.slug === "custom") {
  const radius = 12;

  ctx.beginPath();
  ctx.moveTo(-w / 2 + radius, -h / 2);
  ctx.lineTo(w / 2 - radius, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
  ctx.lineTo(w / 2, h / 2 - radius);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
  ctx.lineTo(-w / 2 + radius, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
  ctx.lineTo(-w / 2, -h / 2 + radius);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
  ctx.closePath();
  ctx.clip();

  // 🎨 couleur
  ctx.fillStyle = p.color || "#888";
  ctx.fill();

  // 🧱 texture par-dessus
  const img = loadedImages[p.instanceId];
  if (img) {
    ctx.globalAlpha = 0.25; // 🔥 ajuste ici (0.2 → 0.4)
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;
  }
}

  // IMAGE
if (p.slug !== "custom") {
  const img = loadedImages[p.instanceId];
  if (img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  }
}

  // 🎛 CUSTOM CONTROLS
  if (p.slug === "custom") {
    const knobSize =
      p.width < 50 ? 30 :
      p.width <= 100 ? 32 :
      40;

    const footswitchSize = 25;

    const knobCount =
      p.width < 50 ? 1 :
      p.width <= 100 ? 2 :
      3;

    const knobY = -h / 2 + 20;
    const spacing = w / (knobCount + 1);
    const spread = 1.25;

    // KNOBS
    for (let i = 0; i < knobCount; i++) {
      const offset =
        (i - (knobCount - 1) / 2) * spacing * spread;

      ctx.drawImage(
        knobImg,
        offset - knobSize / 2,
        knobY,
        knobSize,
        knobSize
      );
    }

    // FOOTSWITCH
    ctx.drawImage(
      footswitchImg,
      -footswitchSize / 2,
      h / 2 - 35,
      footswitchSize,
      footswitchSize
    );

    // TEXT
    if (p.name) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(p.name.toUpperCase(), 0, 0);
    }
  }

  ctx.restore();
}

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download =
          background === "white" ? `${name}.jpg` : `${name}.png`;
        link.click();

        URL.revokeObjectURL(url);
        setTimeout(() => setLoading(false), 300);
      },
      background === "white" ? "image/jpeg" : "image/png",
      0.95
    );
  } catch (e) {
    console.error(e);
    setLoading(false);
  }
};

  // ===============================
  // AUTO PREVIEW
  // ===============================
  useEffect(() => {
    renderPreview();
  }, [background, boardPedals, selectedBoards]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4">

      {/* TITLE */}
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
          className="h-9 px-3 rounded-md bg-zinc-800 border border-zinc-700 text-[12px] font-mono text-white focus:outline-none focus:border-blue-500"
        />
      </div>

{/* BACKGROUND */}
<div className="flex flex-col gap-2">
  <label className="text-[10px] uppercase tracking-wider text-white font-bold">
    {t("export.background")}
  </label>

  {/* ✅ TOUT DANS LE MÊME BLOC */}
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

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={background === "current"}
        onChange={() => setBackground("current")}
      />
      Canvas (PNG)
    </label>

  </div>
</div>

{/* PREVIEW */}
<div className="flex flex-col gap-2">
  <label className="text-[10px] uppercase tracking-wider text-white font-bold">
    {t("export.preview")}
  </label>

  <div className="bg-zinc-800 rounded-md p-2 flex items-center justify-center">
    <canvas ref={previewRef} className="max-w-full max-h-40" />
  </div>
</div>

{/* DOWNLOAD */}
<button
  onClick={() => exportPNG()}
  className="w-full bg-blue-500 !text-white text-[11px] uppercase font-mono font-bold rounded-lg py-2 flex items-center justify-center transition-all duration-150 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transform-gpu"
>
  <div className="relative flex items-center justify-center w-full">
    <span
      className={loading ? "opacity-0" : "opacity-100"}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {t("export.download")}
    </span>

    {loading && (
      <div className="absolute w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    )}
  </div>
</button>
    </div>
  );
}