"use client";

import React, { useState, useEffect, useRef } from "react";
import { getTranslator } from "@/utils/i18n";
import { supabase } from "@/lib/supabase";

type AnyRow = Record<string, any>;

type Props = {
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  displaySizes: Record<number, { w: number; h: number }>;
  boardName?: string;
  onClose: () => void; // ✅ NEW
};

export default function ShareBoard({
  boardPedals,
  selectedBoards = [],
  displaySizes,
  boardName,
  onClose, // ✅ NEW
}: Props) {
  const language =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("myb_settings") || "{}")?.language || "en"
      : "en";

  const t = getTranslator(language);

  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null);
  const createShareLink = async (): Promise<string | null> => {
  const { data } = await supabase
    .from("shared_boards")
    .insert([
      {
        name: boardName || "My pedalboard",
        data: {
          pedals: boardPedals,
          boards: selectedBoards,
        },
      },
    ])
    .select()
    .single();

  if (!data?.id) {
    alert("Error creating link");
    return null;
  }

  const url = `${window.location.origin}/s/${data.id}`;
  setGeneratedUrl(url); // 🔥 stocke l’URL
  return url;
};
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ✅ NEW: container ref
  const containerRef = useRef<HTMLDivElement>(null);

  // ===============================
  // 🔒 CLICK OUTSIDE
  // ===============================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(e.target as Node)) {
        onClose(); // 👈 ferme
      }
    };

document.addEventListener("mousedown", handleClickOutside);

return () => {
  document.removeEventListener("mousedown", handleClickOutside);
};
  }, [onClose]);

  // ===============================
  // 🔗 SHARE URL (MVP simple)
  // ===============================
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}`
      : "";

  const finalUrl = generatedUrl || shareUrl;
  const encodedUrl = encodeURIComponent(finalUrl);
  const encodedText = encodeURIComponent(boardName || "My pedalboard");

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=123456789`, // ⚠️ mets ton app_id plus tard
    discord: `https://discord.com/channels/@me`, // ⚠️ pas d’API directe → fallback
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`,
    mail: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
  };

  // ===============================
  // 🖼️ PREVIEW RENDER (reuse export)
  // ===============================
  const renderPreview = async () => {
if (!boardPedals?.length) return;
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

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

const allItems = [
  ...(boardPedals || []),
  ...(selectedBoards || [])
];

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

      const PADDING = 5;

      minX -= PADDING;
      minY -= PADDING;
      maxX += PADDING;
      maxY += PADDING;

      if (!isFinite(minX) || !isFinite(maxX)) return;
if (!isFinite(minY) || !isFinite(maxY)) return;

      const width = maxX - minX;
      const height = maxY - minY;

      const canvas = previewRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const SCALE = 6;

canvas.width = width * SCALE;
canvas.height = height * SCALE;

// 🔥 EXACT SAME AS EXPORT
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.scale(SCALE, SCALE);
ctx.clearRect(0, 0, width, height);

ctx.imageSmoothingEnabled = true;

      const loadedImages: Record<number, HTMLImageElement> = {};

const getImageSrc = (p: any) =>
  p.image || p.image_url || p.photo || null;

const itemsToRender = [
  ...(selectedBoards || []),
  ...(boardPedals || [])
];

// LOAD IMAGES
for (const p of itemsToRender) {
  const src = getImageSrc(p);
  if (!src) continue;

  loadedImages[p.instanceId] = await loadImage(src);
}

// DRAW
for (const p of itemsToRender) {
  const img = loadedImages[p.instanceId];
  if (!img) continue;

  const size = displaySizes[Number(p.instanceId)];
  if (!size) continue;

  const isVertical = (p.rotation || 0) % 180 !== 0;

  const w = isVertical ? size.h : size.w;
  const h = isVertical ? size.w : size.h;

  const drawX = p.x - minX;
  const drawY = p.y - minY;

  const rotation = ((p.rotation || 0) * Math.PI) / 180;

  ctx.save();
  ctx.translate(drawX, drawY);
  ctx.rotate(rotation);

  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.drawImage(img, -size.w / 2, -size.h / 2, size.w, size.h);

  ctx.restore();
}
    } catch (e) {
      console.error(e);
    }
  };

useEffect(() => {
  renderPreview();
}, [boardPedals, displaySizes]);


  // 📋 COPY LINK
const copyLink = async () => {
  const url = generatedUrl || await createShareLink();
  if (!url) return;

  let copied = false;

  // ✅ 1. MÉTHODE ULTRA FIABLE (Safari OK)
  try {
    const textarea = document.createElement("textarea");
    textarea.value = url;

    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    copied = document.execCommand("copy");

    document.body.removeChild(textarea);
  } catch (err) {
    copied = false;
  }

  // ✅ 2. BONUS moderne (Chrome etc.)
  if (!copied && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch (err) {
      copied = false;
    }
  }

  // ❌ 3. dernier fallback
  if (!copied) {
    prompt("Copy this link:", url);
    return;
  }

  // ✅ UX
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};


  // ===============================
  // 📱 MOBILE SHARE
  // ===============================
  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: boardName || "My pedalboard",
          url: shareUrl,
        });
      } else {
        copyLink();
      }
    } catch (e) {
      console.log("Share cancelled");
    }
  };

  return (
    <div
      ref={containerRef} // ✅ NEW
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-64 shadow-2xl flex flex-col gap-4"
    >

      {/* TITLE */}
      <div className="text-xs font-bold uppercase tracking-wider text-white">
        {t("share.title")}
      </div>

      {/* PREVIEW */}
<div className="flex flex-col gap-2">

  <label className="text-[10px] uppercase tracking-wider text-white font-bold">
    {t("share.preview")}
  </label>

  <div className="bg-zinc-800 rounded-md p-2 flex items-center justify-center">
    <canvas
      ref={previewRef}
      className="max-w-full max-h-40"
    />
  </div>

</div>

{/* ACTIONS */}
<div className="flex flex-col gap-2">

  {/* SOCIAL LIST */}
  <div className="flex flex-col gap-2">

    <label className="text-[10px] uppercase tracking-wider text-white font-bold">
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
        <a
          key={item.key}
          href="#"
          onClick={async (e) => {
            e.preventDefault();

            const url = generatedUrl || await createShareLink();
            if (!url) return;

            const encodedUrl = encodeURIComponent(url);
            const encodedText = encodeURIComponent(boardName || "My pedalboard");

            let finalLink = "";

            switch (item.key) {
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
              case "pinterest":
                finalLink = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`;
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
            }

            window.open(finalLink, "_blank");
          }}
          className="
            flex items-center gap-2
            px-2 py-2
            rounded-lg
            transition-all duration-200 ease-out
            hover:bg-canvas
            hover:scale-[1.02]
            active:scale-[0.98]
            group
          "
        >
          <img
            src={item.logo}
            alt={item.label}
            className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
          />

          <span className="
            text-[11px] font-semibold text-zinc-300
            transition-all duration-200
            group-hover:text-white
            group-hover:translate-x-1
          ">
            {item.label}
          </span>
        </a>
      ))}
    </div>
  </div>

  {/* COPY */}
  <button
  onClick={copyLink}
  className="w-full bg-blue-500 !text-white text-[11px] uppercase font-mono font-bold rounded-lg py-2 flex items-center justify-center transition-all duration-150 hover:bg-blue-600 hover:scale-[1.02] active:scale-95 transform-gpu"
>
  <span
    style={{
      transform: "translateZ(0)",
      backfaceVisibility: "hidden",
      WebkitFontSmoothing: "antialiased",
    }}
  >
    {copied ? t("share.copied") : t("share.copy")}
  </span>
</button>

</div>
</div>
);
}