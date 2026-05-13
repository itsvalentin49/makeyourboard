"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTranslator } from "@/utils/i18n";
import { Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type AnyRow = Record<string, any>;

type Props = {
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  displaySizes: Record<number, { w: number; h: number }>;
  boardName?: string;
  canvasBg: string;
  onClose: () => void;

  currentBackground?: {
    type: "css" | "image";
    src?: string;
  };
};

export default function ExportPanel({
  boardPedals,
  selectedBoards = [],
  displaySizes,
  boardName,
  currentBackground,
  canvasBg,
  onClose,
}: Props) {
  const language =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myb_settings") || "{}")?.language || "en"
      : "en";

  const t = getTranslator(language);

    const [loading, setLoading] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [name, setName] = useState(boardName || "pedalboard");
  const [background, setBackground] = useState<
  "transparent" | "white" | "current"
>("current");
const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);


const getRenderItems = (): AnyRow[] =>
  [
    ...(selectedBoards || []).map((item: AnyRow) => ({
      ...item,
      kind: "board",
    })),

    ...(boardPedals || []).map((item: AnyRow) => ({
      ...item,
      kind: "pedal",
    })),
  ].sort(
    (a: AnyRow, b: AnyRow) =>
      (Number(a.zIndex) || 0) -
      (Number(b.zIndex) || 0)
  );

// ===============================
// 🔒 CLICK OUTSIDE
// ===============================
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (!containerRef.current) return;

    if (!containerRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [onClose]);

  // ===============================
  // 🖼️ PREVIEW RENDER
  // ===============================
  const renderPreview = async () => {
  if (!boardPedals?.length && !selectedBoards?.length) return;
  if (!displaySizes || Object.keys(displaySizes).length === 0) return;

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

    const itemsToRender = getRenderItems();

    itemsToRender.forEach((item) => {
      const size = displaySizes[Number(item.instanceId)];
      if (!size) return;

      const w = size.w;
      const h = size.h;

      minX = Math.min(minX, item.x - w / 2);
      minY = Math.min(minY, item.y - h / 2);
      maxX = Math.max(maxX, item.x + w / 2);
      maxY = Math.max(maxY, item.y + h / 2);
    });

    const PADDING = 10;

    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    if (!isFinite(minX) || !isFinite(maxX)) return;
    if (!isFinite(minY) || !isFinite(maxY)) return;

    const width = maxX - minX;
    const height = maxY - minY;

    const canvas = previewRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SCALE = 6;

    canvas.width = width * SCALE;
    canvas.height = height * SCALE;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(SCALE, SCALE);
    ctx.clearRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;

    if (background === "transparent") {
  const CHECKER = 10;

  for (let y = 0; y < height; y += CHECKER) {
    for (let x = 0; x < width; x += CHECKER) {
      ctx.fillStyle =
        (Math.floor(x / CHECKER) + Math.floor(y / CHECKER)) % 2 === 0
          ? "#5f6068"
          : "#777982";

      ctx.fillRect(x, y, CHECKER, CHECKER);
    }
  }
}

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

    const getImageSrc = (item: any) =>
      item.image || item.image_url || item.photo || null;

    for (const item of itemsToRender) {
      const src = getImageSrc(item);
      if (!src) continue;

      loadedImages[Number(item.instanceId)] = await loadImage(src);
    }

    for (const item of itemsToRender) {
      const img = loadedImages[Number(item.instanceId)];
      const size = displaySizes[Number(item.instanceId)];
      if (!size) continue;

      const w = size.w;
      const h = size.h;

      const drawX = item.x - minX;
      const drawY = item.y - minY;

      const rotation = ((item.rotation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(rotation);

      if (item.kind === "board") {
        if (img) {
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }

        ctx.restore();
        continue;
      }

      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;

      if (item.slug === "custom") {
        const radius = 12;

        ctx.save();

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

        ctx.fillStyle = item.color || "#888";
        ctx.fillRect(-w / 2, -h / 2, w, h);

        if (img) {
          ctx.globalAlpha = 0.25;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.globalAlpha = 1;
        }

        ctx.restore();

        const knobSize =
          item.width < 50 ? 30 :
          item.width <= 100 ? 32 :
          40;

        const knobCount =
          item.width < 50 ? 1 :
          item.width <= 100 ? 2 :
          3;

        const spacing = w / (knobCount + 1);
        const spread = 1.25;
        const knobY = -h / 2 + 20;

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

        const footswitchSize = 25;

        ctx.drawImage(
          footswitchImg,
          -footswitchSize / 2,
          h / 2 - 35,
          footswitchSize,
          footswitchSize
        );

        if (item.name) {
          ctx.fillStyle = "#000";
          ctx.font = "bold 10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.name.toUpperCase(), 0, 0);
        }
      } else {
        if (img) {
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
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
const allItems = getRenderItems();

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

    const PADDING = 10;

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

// ITEMS
for (const item of getRenderItems()) {
  const size = displaySizes[Number(item.instanceId)];
  if (!size) continue;

  const imgSrc =
    item.image ||
    item.image_url ||
    item.photo;

  const w = size.w;
  const h = size.h;

  const drawX = item.x - minX;
  const drawY = item.y - minY;

  const rotation =
    ((item.rotation || 0) * Math.PI) / 180;

  ctx.save();

  ctx.translate(drawX, drawY);
  ctx.rotate(rotation);

  // BOARD
  if (item.kind === "board") {
    if (imgSrc) {
      const img = await loadImage(imgSrc);

      ctx.drawImage(
        img,
        -w / 2,
        -h / 2,
        w,
        h
      );
    }

    ctx.restore();
    continue;
  }

  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  // CUSTOM BACKGROUND
  if (item.slug === "custom") {
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

    ctx.fillStyle = item.color || "#888";
    ctx.fill();

    const img =
      loadedImages[item.instanceId] ||
      (imgSrc
        ? await loadImage(imgSrc)
        : null);

    if (img) {
      ctx.globalAlpha = 0.25;

      ctx.drawImage(
        img,
        -w / 2,
        -h / 2,
        w,
        h
      );

      ctx.globalAlpha = 1;
    }
  }

  // NORMAL PEDAL
  if (item.slug !== "custom") {
    const img =
      loadedImages[item.instanceId] ||
      (imgSrc
        ? await loadImage(imgSrc)
        : null);

    if (img) {
      ctx.drawImage(
        img,
        -w / 2,
        -h / 2,
        w,
        h
      );
    }
  }

  // CUSTOM CONTROLS
  if (item.slug === "custom") {
    const knobSize =
      item.width < 50 ? 30 :
      item.width <= 100 ? 32 :
      40;

    const footswitchSize = 25;

    const knobCount =
      item.width < 50 ? 1 :
      item.width <= 100 ? 2 :
      3;

    const knobY = -h / 2 + 20;
    const spacing = w / (knobCount + 1);
    const spread = 1.25;

    for (let i = 0; i < knobCount; i++) {
      const offset =
        (i - (knobCount - 1) / 2) *
        spacing *
        spread;

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

    if (item.name) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        item.name.toUpperCase(),
        0,
        0
      );
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
// 🔗 SHARE
// ===============================
const createShareLink = async (): Promise<string | null> => {
  const { data, error } = await supabase
    .from("shared_boards")
    .insert([
      {
        name: name || "My pedalboard",
        data: {
          pedals: boardPedals,
          boards: selectedBoards,
        },
      },
    ])
    .select()
    .single();

  if (error || !data?.id) {
    console.error(error);
    alert("Error creating link");
    return null;
  }

  const url = `${window.location.origin}/s/${data.id}`;
  setGeneratedUrl(url);
  return url;
};

const openShareLink = async (key: string) => {
  const url = generatedUrl || (await createShareLink());
  if (!url) return;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(name || "My pedalboard");

  let finalLink = "";

  switch (key) {
    case "facebook":
      finalLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      break;

    case "x":
      finalLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
      break;

    case "reddit":
      finalLink = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`;
      break;

    case "whatsapp":
      finalLink = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      break;

    case "messenger":
      finalLink = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=123456789`;
      break;

    case "mail": {
      const link = document.createElement("a");
      link.href = `mailto:?subject=${encodedText}&body=${url}`;
      link.click();
      return;
    }

    case "discord":
      window.open("https://discord.com/channels/@me", "_blank");
      return;

    case "instagram":
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
      window.open("https://www.instagram.com/", "_blank");
      return;

    default:
      return;
  }

  window.open(finalLink, "_blank");
};



  // ===============================
  // AUTO PREVIEW
  // ===============================
useEffect(() => {
  renderPreview();
}, [background, boardPedals, selectedBoards, displaySizes]);

return (
  <div
    ref={containerRef}
    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4"
  >
    {/* TITLE */}
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
      <Share2 size={14} />
      {t("export.title")}
    </div>

    {/* NAME */}
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.name")}
      </label>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-9 px-3 rounded-md bg-zinc-950 border border-zinc-700 text-[12px] font-mono focus:outline-none focus:border-blue-500"
      />
    </div>

    {/* BACKGROUND */}
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.background")}
      </label>

      <div className="flex flex-col gap-1 text-xs">
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="radio"
      checked={background === "current"}
      onChange={() => setBackground("current")}
    />
    Canvas (PNG)
  </label>

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

    {/* SHARE VIA */}
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("share.social")}
      </label>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "discord", label: "Discord", logo: "/logos/discord.png" },
          { key: "facebook", label: "Facebook", logo: "/logos/facebook.png" },
          { key: "instagram", label: "Instagram", logo: "/logos/instagram.png" },
          { key: "mail", label: "Mail", logo: "/logos/mail.png" },
          { key: "messenger", label: "Messenger", logo: "/logos/messenger.png" },
          { key: "reddit", label: "Reddit", logo: "/logos/reddit.png" },
          { key: "whatsapp", label: "WhatsApp", logo: "/logos/whatsapp.png" },
          { key: "x", label: "X", logo: "/logos/twitter.png" },
        ].map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => openShareLink(item.key)}
            className="flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-200 ease-out hover:bg-canvas hover:scale-[1.02] active:scale-[0.98] group"
          >
            <img
              src={item.logo}
              alt={item.label}
              className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
            />

            <span className="text-[11px] font-semibold text-zinc-300 transition-all duration-200 group-hover:text-white group-hover:translate-x-1">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>

    {/* PREVIEW */}
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.preview")}
      </label>

<div className="flex items-center justify-center overflow-hidden">
  <canvas
    ref={previewRef}
    className="max-w-full max-h-40 rounded-md"
  />
</div>
    </div>

    {/* DOWNLOAD */}
    <button
      onClick={() => exportPNG()}
      className="w-full bg-blue-600 !text-white text-[11px] uppercase font-mono font-bold rounded-lg py-2 flex items-center justify-center transition-all duration-150 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transform-gpu"
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