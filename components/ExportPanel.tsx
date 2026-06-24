"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTranslator } from "@/utils/i18n";
import { ChevronDown, Link, Download } from "lucide-react";
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
const previewRenderIdRef = useRef(0);
const [shareOpen, setShareOpen] = useState(false);
const [copied, setCopied] = useState(false);

const [selectedShare, setSelectedShare] = useState({
  key: "instagram",
  label: "Instagram",
  logo: "/logos/instagram.png",
});



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

  const drawCustomPedal = (
  ctx: CanvasRenderingContext2D,
  item: AnyRow,
  w: number,
  h: number,
  knobImg: HTMLImageElement,
  footswitchImg: HTMLImageElement,
  img?: HTMLImageElement | null
) => {
  const radius = 5;
  const hasColor = !!item.color;

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

  if (img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = item.color || "#888";
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  if (hasColor) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = item.color;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  const knobSize = 25;
  const footswitchSize = 18;

  const knobCount =
    Number(item.width) < 70 ? 1 : Number(item.width) <= 100 ? 2 : 3;

  const knobY = -h / 2 + 14;
  const spacing = w / (knobCount + 1);
  const spread = 1.25;

  for (let i = 0; i < knobCount; i++) {
    const offsetFromCenter =
      (i - (knobCount - 1) / 2) * spacing * spread;

    ctx.drawImage(
      knobImg,
      offsetFromCenter - knobSize / 2,
      knobY,
      knobSize,
      knobSize
    );
  }

  ctx.drawImage(
    footswitchImg,
    -footswitchSize / 2,
    h / 2 - 30,
    footswitchSize,
    footswitchSize
  );

  if (item.name) {
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 0.5;
    ctx.font = "bold 8px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.strokeText(item.name.toUpperCase(), 0, 0);
    ctx.fillText(item.name.toUpperCase(), 0, 0);
  }
};

    const drawItems = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    minX: number,
    minY: number,
    loadImage: (src: string) => Promise<HTMLImageElement>
  ) => {
    const knobImg = await loadImage("/images/knob.webp");
    const footswitchImg = await loadImage("/images/footswitch.webp");

    for (const item of getRenderItems()) {
      const size = displaySizes[Number(item.instanceId)];
      if (!size) continue;

      const imgSrc = item.image || item.image_url || item.photo || null;

      const w = size.w;
      const h = size.h;

      const drawX = item.x - minX;
      const drawY = item.y - minY;

      const rotation = ((item.rotation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(drawX, drawY);
      ctx.rotate(rotation);

      if (item.kind === "board") {
        if (imgSrc) {
          const img = await loadImage(imgSrc);
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }

        ctx.restore();
        continue;
      }

      const img = imgSrc ? await loadImage(imgSrc) : null;

      if (item.slug === "custom") {
        drawCustomPedal(ctx, item, w, h, knobImg, footswitchImg, img);
      } else if (img) {
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }

      ctx.restore();
    }
  };

  const getExportBounds = () => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  getRenderItems().forEach((item) => {
    const size = displaySizes[Number(item.instanceId)];
    if (!size) return;

    const w = size.w;
    const h = size.h;

    const rotation = ((Number(item.rotation) || 0) * Math.PI) / 180;

    const corners = [
      { x: -w / 2, y: -h / 2 },
      { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ];

    corners.forEach((corner) => {
      const rotatedX =
        corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation);

      const rotatedY =
        corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation);

      const worldX = item.x + rotatedX;
      const worldY = item.y + rotatedY;

      minX = Math.min(minX, worldX);
      minY = Math.min(minY, worldY);
      maxX = Math.max(maxX, worldX);
      maxY = Math.max(maxY, worldY);
    });
  });

  const PADDING = 20;

  minX -= PADDING;
  minY -= PADDING;
  maxX += PADDING;
  maxY += PADDING;

  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

  const drawBackground = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    loadImage: (src: string) => Promise<HTMLImageElement>,
    preview = false
  ) => {
    if (background === "transparent" && preview) {
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
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(
      document.documentElement.classList.contains("light")
        ? "--zinc-200"
        : "--zinc-600"
    )
    .trim();

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

      if (currentBackground.type === "image" && currentBackground.src) {
        const bgImg = await loadImage(currentBackground.src);
        ctx.drawImage(bgImg, 0, 0, width, height);
      }
    }
  };

  const drawExportLogo = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  loadImage: (src: string) => Promise<HTMLImageElement>
) => {
  const logo = await loadImage("/logos/logo-export.png");

  const LOGO_SIZE = Math.max(20, Math.min(width, height) * 0.06);
  const MARGIN = 5;

  ctx.save();

  ctx.globalAlpha = 0.9;

  ctx.drawImage(
    logo,
    width - LOGO_SIZE - MARGIN,
    height - LOGO_SIZE - MARGIN,
    LOGO_SIZE,
    LOGO_SIZE
  );

  ctx.restore();
};

  // ===============================
  // 🖼️ PREVIEW RENDER
  // ===============================
const renderPreview = async () => {
  const hasItems = !!boardPedals?.length || !!selectedBoards?.length;

  if (hasItems && (!displaySizes || Object.keys(displaySizes).length === 0)) {
    return;
  }

  const renderId = ++previewRenderIdRef.current;

    try {
      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });

        if (!hasItems) {
  const visibleCanvas = previewRef.current;
  if (!visibleCanvas) return;

  const visibleCtx = visibleCanvas.getContext("2d");
  if (!visibleCtx) return;

  const width = 240;
  const height = 135;
  const SCALE = 3;

  visibleCanvas.width = width * SCALE;
  visibleCanvas.height = height * SCALE;

  visibleCtx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  visibleCtx.clearRect(0, 0, width, height);
  visibleCtx.imageSmoothingEnabled = true;

  await drawBackground(visibleCtx, width, height, loadImage, true);

  return;
}

      const { minX, minY, width, height } = getExportBounds();

      if (!isFinite(width) || !isFinite(height)) return;

      const visibleCanvas = previewRef.current;
      if (!visibleCanvas) return;

      const visibleCtx = visibleCanvas.getContext("2d");
      if (!visibleCtx) return;

      const SCALE = 6;

      // ✅ on dessine d'abord sur un canvas temporaire
      // comme ça un ancien rendu ne peut pas polluer le preview visible
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return;

      tempCanvas.width = width * SCALE;
      tempCanvas.height = height * SCALE;

      tempCtx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      tempCtx.clearRect(0, 0, width, height);
      tempCtx.imageSmoothingEnabled = true;

      await drawBackground(tempCtx, width, height, loadImage, true);
      if (renderId !== previewRenderIdRef.current) return;

      await drawItems(tempCtx, width, height, minX, minY, loadImage);
      await drawExportLogo(tempCtx, width, height, loadImage);
      if (renderId !== previewRenderIdRef.current) return;

      // ✅ seulement le dernier rendu autorisé est copié dans le preview
      visibleCanvas.width = tempCanvas.width;
      visibleCanvas.height = tempCanvas.height;

      visibleCtx.setTransform(1, 0, 0, 1, 0, 0);
      visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
      visibleCtx.drawImage(tempCanvas, 0, 0);
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

      const { minX, minY, width, height } = getExportBounds();

      if (!isFinite(width) || !isFinite(height)) {
        setLoading(false);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setLoading(false);
        return;
      }

      const SCALE = 6;

      canvas.width = width * SCALE;
      canvas.height = height * SCALE;

      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      ctx.imageSmoothingEnabled = true;

      await drawBackground(ctx, width, height, loadImage, false);
      await drawItems(ctx, width, height, minX, minY, loadImage);
      await drawExportLogo(ctx, width, height, loadImage);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setLoading(false);
            return;
          }

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

const shareOptions = [
  { key: "discord", label: "Discord", logo: "/logos/discord.png" },
  { key: "facebook", label: "Facebook", logo: "/logos/facebook.png" },
  { key: "instagram", label: "Instagram", logo: "/logos/instagram.png" },
  { key: "mail", label: "Mail", logo: "/logos/mail.png" },
  { key: "messenger", label: "Messenger", logo: "/logos/messenger.png" },
  { key: "reddit", label: "Reddit", logo: "/logos/reddit.png" },
  { key: "whatsapp", label: "WhatsApp", logo: "/logos/whatsapp.png" },
  { key: "x", label: "X", logo: "/logos/twitter.png" },
];

return (
  <div
    ref={containerRef}
    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-6"
  >
    {/* TITLE */}
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
      <Download size={14} className= "text-green-500" />
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
    <div className="flex flex-col gap-2 -mt-2">
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
{/*<div className="flex flex-col gap-2 -mt-2 relative">
  <label className="text-[10px] uppercase tracking-wider font-bold">
    {t("share.social")}
  </label>

  <div className="relative">
    <button
      type="button"
      onClick={() => setShareOpen((v) => !v)}
      className="
        w-full h-10
        bg-zinc-950 border border-zinc-700
        rounded-md
        px-3
        flex items-center justify-between
        hover:border-zinc-500
        transition-colors
      "
    >
      <span className="flex items-center gap-2">
        <img
          src={selectedShare.logo}
          alt={selectedShare.label}
          className="w-5 h-5 object-contain"
        />

        <span className="text-[11px] font-bold text-zinc-300">
          {selectedShare.label}
        </span>
      </span>

      <ChevronDown
        size={14}
        className={`text-zinc-400 transition-transform ${
          shareOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    {shareOpen && (
      <div
        className="
          absolute z-50 mt-1 w-full
          bg-zinc-950 border border-zinc-700
          rounded-md overflow-hidden
          shadow-xl
        "
      >
        {shareOptions.map((item) => (
          <button
            type="button"
            key={item.key}
            onClick={() => {
              setSelectedShare(item);
              setShareOpen(false);
              openShareLink(item.key);
            }}
            className="
              w-full h-9 px-3
              flex items-center gap-2
              text-left
              hover:bg-canvas
              transition-colors
            "
          >
            <img
              src={item.logo}
              alt={item.label}
              className="w-5 h-5 object-contain"
            />

            <span className="text-[11px] font-bold text-zinc-300">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    )}
  </div>
</div>*/}

    {/* PREVIEW */}
    <div className="flex flex-col gap-2 -mt-2">
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