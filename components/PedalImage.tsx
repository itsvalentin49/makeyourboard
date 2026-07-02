"use client";

import React, { useEffect, useRef, useState } from "react";
import { getCustomImageUrl } from "@/utils/customImageStore";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";

const MARGIN_SIZE = 10; 

type PedalImageProps = {
  url?: string | null;
  imageId?: string | null;
  width: number;
  depth: number;
  name?: string;
  color?: string;
  isBoard?: boolean;
  onSizeReady?: (w: number, h: number) => void;
  rotation?: number;
  listening?: boolean;
  showJacksMargin?: boolean;
  jacksLocation?: string; 
  isColliding?: boolean;
  marginRef?: (node: any) => void;
};

export default function PedalImage({
  url,
  imageId,
  width,
  depth,
  name,
  color,
  isBoard = false,
  onSizeReady,
  rotation = 0,
  listening = true,
  showJacksMargin = false,
  jacksLocation = "",
  isColliding = false,
  marginRef,
}: PedalImageProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [renderSize, setRenderSize] = useState({w: width, h: depth,});
  const lastSize = useRef({ w: 0, h: 0 });

  const rawData = String(jacksLocation || "").toLowerCase();
  const hasLeft   = rawData.includes("left") || rawData.includes("side");
  const hasRight  = rawData.includes("right") || rawData.includes("side");
  const hasTop    = rawData.includes("top");
  const hasBottom = rawData.includes("down") || rawData.includes("bottom");


  const scaledWidth = renderSize.w;
  const scaledHeight = renderSize.h;

  const marginRect = {
    x: hasLeft ? -MARGIN_SIZE : 0,
    y: hasTop ? -MARGIN_SIZE : 0,
    w: scaledWidth + (hasLeft ? MARGIN_SIZE : 0) + (hasRight ? MARGIN_SIZE : 0),
    h: scaledHeight + (hasTop ? MARGIN_SIZE : 0) + (hasBottom ? MARGIN_SIZE : 0),
  };



  useEffect(() => {
  let objectUrl: string | null = null;
  let cancelled = false;

  const loadImage = async () => {
    let finalUrl = url || null;

if (imageId) {
  const indexedDbUrl = await getCustomImageUrl(imageId);

  if (indexedDbUrl) {
    finalUrl = indexedDbUrl;
    objectUrl = indexedDbUrl;
  }
}

    if (!finalUrl) {
      setImg(null);
      return;
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = finalUrl;

image.onload = () => {
  if (cancelled) return;

  const finalW = Number(width) || 80;

  const isFreeSizeCustom =
    finalUrl?.includes("custom-board") ||
    finalUrl?.includes("custom-pedal");

  const finalH = isFreeSizeCustom
    ? Number(depth) || 120
    : Math.round(finalW * (image.naturalHeight / image.naturalWidth));

  setImg(image);
  setRenderSize({ w: finalW, h: finalH });

  if (
    lastSize.current.w !== finalW ||
    lastSize.current.h !== finalH
  ) {
    lastSize.current = { w: finalW, h: finalH };
    if (onSizeReady) onSizeReady(finalW, finalH);
  }
};

image.onerror = () => {
  if (cancelled) return;

  setImg(null);

  const finalW = Number(width) || 80;
  const finalH = Number(depth) || 120;

  setRenderSize({ w: finalW, h: finalH });

  if (onSizeReady) onSizeReady(finalW, finalH);
};
  };

  loadImage();

  return () => {
    cancelled = true;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [url, imageId, width, depth]);





  return (
    <Group>
      {/* 1. Rectangle de contour centré */}
      {showJacksMargin && !isBoard && (
  <Rect
    ref={marginRef} // 👈 ICI
    x={marginRect.x - (scaledWidth / 2)}
    y={marginRect.y - (scaledHeight / 2)}
          width={marginRect.w}
          height={marginRect.h}
          stroke={isColliding ? "#ef4444" : "#22c55e"} 
          strokeWidth={1.5}
          dash={[4, 2]}
          cornerRadius={4}
          listening={false} 
        />
      )}

      {/* 2. Image ou Rect centré */}
      {!img ? (
        <Rect
          x={-scaledWidth / 2}
          y={-scaledHeight / 2}
          height={scaledHeight}
          width={scaledWidth}
          fill={color || (isBoard ? "#18181b" : "#27272a")}
          stroke={color ? "rgba(255,255,255,0.3)" : "#3f3f46"}
          strokeWidth={1}
          cornerRadius={isBoard ? 0 : 3}
        />
      ) : (
        <KonvaImage
          image={img}
          x={-scaledWidth / 2}
          y={-scaledHeight / 2}
          height={scaledHeight}
          width={scaledWidth}
          listening={listening}
          cornerRadius={isBoard ? 0 : 3}
        />
      )}

      {/* 3. Texte centré */}
      {!img && name && (
        <Text
          x={-scaledWidth / 2}
          y={-scaledHeight / 2}
          height={scaledHeight}
          text={name}
          width={scaledWidth}
          align="center"
          verticalAlign="middle"
          fill="white"
          fontSize={10}
          fontStyle="bold"
          padding={5}
          wrap="char"
        />
      )}
    </Group>
  );
}