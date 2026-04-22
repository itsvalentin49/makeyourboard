"use client";

import React, { useEffect, useRef, useState } from "react";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";

const MARGIN_SIZE = 10; 

type PedalImageProps = {
  url?: string | null;
  width: number;
  depth: number;
  name?: string;
  color?: string;
  isBoard?: boolean;
  onSizeReady?: (w: number, h: number) => void;
  rotation?: number;
  showJacksMargin?: boolean;
  jacksLocation?: string; 
  isColliding?: boolean;
  marginRef?: (node: any) => void;
};

export default function PedalImage({
  url,
  width,
  depth,
  name,
  color,
  isBoard = false,
  onSizeReady,
  rotation = 0,
  showJacksMargin = false,
  jacksLocation = "",
  isColliding = false,
  marginRef,
}: PedalImageProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [proportionalHeight, setProportionalHeight] = useState(0);

  const imageRef = useRef<any>(null);
  const lastSize = useRef({ w: 0, h: 0 });

  const rawData = String(jacksLocation || "").toLowerCase();
  const hasLeft   = rawData.includes("left") || rawData.includes("side");
  const hasRight  = rawData.includes("right") || rawData.includes("side");
  const hasTop    = rawData.includes("top");
  const hasBottom = rawData.includes("down") || rawData.includes("bottom");

  // ✅ plus de ZOOM_FACTOR ici
  const scaledWidth = width;
  const scaledHeight = depth;

  const marginRect = {
    x: hasLeft ? -MARGIN_SIZE : 0,
    y: hasTop ? -MARGIN_SIZE : 0,
    w: scaledWidth + (hasLeft ? MARGIN_SIZE : 0) + (hasRight ? MARGIN_SIZE : 0),
    h: scaledHeight + (hasTop ? MARGIN_SIZE : 0) + (hasBottom ? MARGIN_SIZE : 0),
  };

  useEffect(() => {
    const finalW = width;
    const finalH = depth;

    // ✅ évite spam + stabilise displaySizes
    if (
      lastSize.current.w !== finalW ||
      lastSize.current.h !== finalH
    ) {
      lastSize.current = { w: finalW, h: finalH };
      setProportionalHeight(finalH);
      if (onSizeReady) onSizeReady(finalW, finalH);
    }

    if (!url) { 
      setImg(null); 
      return; 
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    image.onload = () => setImg(image);

  }, [url, width, depth]);

  return (
    <Group>
      {/* 1. Rectangle de contour centré */}
      {showJacksMargin && !isBoard && (
  <Rect
    ref={marginRef} // 👈 ICI
    x={marginRect.x - (scaledWidth / 2)}
    y={marginRect.y - (proportionalHeight / 2)}
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
          y={-proportionalHeight / 2}
          width={scaledWidth}
          height={proportionalHeight}
          fill={color || (isBoard ? "#18181b" : "#27272a")}
          stroke={color ? "rgba(255,255,255,0.3)" : "#3f3f46"}
          strokeWidth={1}
          cornerRadius={3}
        />
      ) : (
        <KonvaImage
          image={img}
          x={-scaledWidth / 2}
          y={-proportionalHeight / 2}
          width={scaledWidth}
          height={proportionalHeight}
          cornerRadius={3}
        />
      )}

      {/* 3. Texte centré */}
      {!img && name && (
        <Text
          x={-scaledWidth / 2}
          y={-proportionalHeight / 2}
          text={name}
          width={scaledWidth}
          height={proportionalHeight}
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