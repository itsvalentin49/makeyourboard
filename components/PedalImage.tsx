"use client";

import React, { useEffect, useRef, useState } from "react";
import { Group, Rect, Text, Image as KonvaImage } from "react-konva";

const ZOOM_FACTOR = 1.5;

type PedalImageProps = {
  url?: string | null;
  width: number;
  depth: number;
  name?: string;
  color?: string;
  isBoard?: boolean;
  onSizeReady?: (w: number, h: number) => void;
  rotation?: number;
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
}: PedalImageProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [proportionalHeight, setProportionalHeight] = useState(0);

  const imageRef = useRef<any>(null);
  const lastSize = useRef({ w: 0, h: 0 });

  // applique la rotation si on l’utilise (optionnel)
  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.rotation(rotation);
    }
  }, [rotation]);

  useEffect(() => {
    const finalW = width * ZOOM_FACTOR;
    const finalH = depth * ZOOM_FACTOR;

    const notifySize = () => {
      if (!onSizeReady) return;
      if (lastSize.current.w === finalW && lastSize.current.h === finalH) return;
      lastSize.current = { w: finalW, h: finalH };
      onSizeReady(finalW, finalH);
    };

    setProportionalHeight(finalH);

    // pas d’URL → fallback rectangle + texte
    if (!url) {
      setImg(null);
      notifySize();
      return;
    }

    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = url;

    image.onload = () => {
      setImg(image);
      notifySize();
    };

    image.onerror = () => {
      setImg(null);
      notifySize();
    };

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [url, width, depth, onSizeReady]);

  const scaledWidth = width * ZOOM_FACTOR;

  // Fallback (rectangle) si pas d’image
  if (!img) {
    return (
      <Group offsetX={scaledWidth / 2} offsetY={proportionalHeight / 2} rotation={rotation}>
        <Rect
          width={scaledWidth}
          height={proportionalHeight}
          fill={color || (isBoard ? "#18181b" : "#27272a")}
          stroke={color ? "rgba(255,255,255,0.3)" : "#3f3f46"}
          strokeWidth={1}
          cornerRadius={6}
        />

        {name && (
          <Text
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

  // Image OK
  return (
    <Group offsetX={scaledWidth / 2} offsetY={proportionalHeight / 2} rotation={rotation}>
      <KonvaImage image={img} width={scaledWidth} height={proportionalHeight} ref={imageRef} cornerRadius={6} />

      {name && (
        <Text
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
