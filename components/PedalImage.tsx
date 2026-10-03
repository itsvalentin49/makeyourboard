"use client";

import React, { useEffect, useRef, useState } from "react";
import { getCustomImageUrl } from "@/utils/customImageStore";
import {
  Group,
  Rect,
  Text,
  Image as KonvaImage,
} from "react-konva";

const MARGIN_SIZE = 10;
const ALPHA_THRESHOLD = 10;
const BODY_THRESHOLD = 0.65;

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

  // Nouveau système de dimensionnement.
  // Désactivé par défaut pour permettre une migration marque par marque.
  useEnclosureSizing?: boolean;
};

type ImagePlacement = {
  width: number;
  height: number;
  x: number;
  y: number;
};

/**
 * Trouve le plus grand groupe continu de valeurs
 * dépassant un certain seuil.
 */
function findLargestRun(
  values: number[],
  threshold: number
) {
  let bestStart = -1;
  let bestEnd = -1;

  let currentStart = -1;

  for (let i = 0; i < values.length; i++) {
    if (values[i] >= threshold) {
      if (currentStart === -1) {
        currentStart = i;
      }
    } else if (currentStart !== -1) {
      const currentEnd = i - 1;

      if (
        bestStart === -1 ||
        currentEnd - currentStart >
        bestEnd - bestStart
      ) {
        bestStart = currentStart;
        bestEnd = currentEnd;
      }

      currentStart = -1;
    }
  }

  if (currentStart !== -1) {
    const currentEnd = values.length - 1;

    if (
      bestStart === -1 ||
      currentEnd - currentStart >
      bestEnd - bestStart
    ) {
      bestStart = currentStart;
      bestEnd = currentEnd;
    }
  }

  if (bestStart === -1) {
    return null;
  }

  return {
    start: bestStart,
    end: bestEnd,
  };
}

/**
 * Détecte le rectangle principal du boîtier dans l'image.
 *
 * Les petites protubérances comme les jacks sont ignorées.
 */
function detectEnclosure(
  image: HTMLImageElement,
  detectHorizontal: boolean,
  detectVertical: boolean
) {
  try {
    const canvas =
      document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx =
      canvas.getContext("2d", {
        willReadFrequently: true,
      });

    if (!ctx) return null;

    ctx.drawImage(image, 0, 0);

    const imageData =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    const pixels = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    /*
     * Bounding box de tous les pixels visibles.
     */
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha =
          pixels[
          (y * canvas.width + x) * 4 + 3
          ];

        if (alpha > ALPHA_THRESHOLD) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (
      maxX < minX ||
      maxY < minY
    ) {
      return null;
    }

    const visibleWidth =
      maxX - minX + 1;

    const visibleHeight =
      maxY - minY + 1;

    let bodyLeft = minX;
    let bodyRight = maxX;
    let bodyTop = minY;
    let bodyBottom = maxY;

    /*
     * Détection gauche / droite :
     * le corps du boîtier occupe une grande partie
     * de la hauteur, contrairement aux jacks.
     */
    if (detectHorizontal) {
      const columnOccupancy =
        new Array(visibleWidth).fill(0);

      for (
        let x = minX;
        x <= maxX;
        x++
      ) {
        let count = 0;

        for (
          let y = minY;
          y <= maxY;
          y++
        ) {
          const alpha =
            pixels[
            (y * canvas.width + x) * 4 + 3
            ];

          if (alpha > ALPHA_THRESHOLD) {
            count++;
          }
        }

        columnOccupancy[x - minX] =
          count;
      }

      const maxColumn =
        Math.max(...columnOccupancy);

      const run =
        findLargestRun(
          columnOccupancy,
          maxColumn * BODY_THRESHOLD
        );

      if (run) {
        const detectedWidth =
          run.end - run.start + 1;

        /*
         * Sécurité :
         * on refuse une détection trop petite.
         */
        if (
          detectedWidth >
          visibleWidth * 0.55
        ) {
          bodyLeft =
            minX + run.start;

          bodyRight =
            minX + run.end;
        }
      }
    }

    /*
     * Détection haut / bas :
     * le corps du boîtier occupe une grande partie
     * de la largeur, contrairement aux jacks.
     */
    if (detectVertical) {
      const rowOccupancy =
        new Array(visibleHeight).fill(0);

      for (
        let y = minY;
        y <= maxY;
        y++
      ) {
        let count = 0;

        for (
          let x = minX;
          x <= maxX;
          x++
        ) {
          const alpha =
            pixels[
            (y * canvas.width + x) * 4 + 3
            ];

          if (alpha > ALPHA_THRESHOLD) {
            count++;
          }
        }

        rowOccupancy[y - minY] =
          count;
      }

      const maxRow =
        Math.max(...rowOccupancy);

      const run =
        findLargestRun(
          rowOccupancy,
          maxRow * BODY_THRESHOLD
        );

      if (run) {
        const detectedHeight =
          run.end - run.start + 1;

        if (
          detectedHeight >
          visibleHeight * 0.55
        ) {
          bodyTop =
            minY + run.start;

          bodyBottom =
            minY + run.end;
        }
      }
    }

    const bodyWidth =
      bodyRight - bodyLeft + 1;

    const bodyHeight =
      bodyBottom - bodyTop + 1;

    if (
      bodyWidth <= 0 ||
      bodyHeight <= 0
    ) {
      return null;
    }

    return {
      bodyLeft,
      bodyTop,
      bodyWidth,
      bodyHeight,
    };
  } catch {
    /*
     * Si l'analyse des pixels est impossible,
     * on conservera simplement l'ancien rendu.
     */
    return null;
  }
}

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
  useEnclosureSizing = false,
}: PedalImageProps) {
  const [img, setImg] =
    useState<HTMLImageElement | null>(null);

  /*
   * renderSize = dimensions du BOÎTIER.
   * Il reste toujours exactement aux dimensions BDD.
   */
  const [renderSize, setRenderSize] =
    useState({
      w: Number(width) || 80,
      h: Number(depth) || 120,
    });

  /*
   * Dimensions et position de l'image entière.
   * Les jacks peuvent dépasser du boîtier.
   */
  const [imagePlacement, setImagePlacement] =
    useState<ImagePlacement | null>(
      null
    );

  const lastSize = useRef({
    w: 0,
    h: 0,
  });

  const rawData =
    String(
      jacksLocation || ""
    ).toLowerCase();

  const hasLeft =
    rawData.includes("left") ||
    rawData.includes("side");

  const hasRight =
    rawData.includes("right") ||
    rawData.includes("side");

  const hasTop =
    rawData.includes("top");

  const hasBottom =
    rawData.includes("down") ||
    rawData.includes("bottom");

  const hasHorizontalJacks =
    hasLeft || hasRight;

  const hasVerticalJacks =
    hasTop || hasBottom;

  const scaledWidth =
    renderSize.w;

  const scaledHeight =
    renderSize.h;

  /*
   * La marge câble reste basée sur le boîtier,
   * comme avant.
   */
  const marginRect = {
    x:
      hasLeft
        ? -MARGIN_SIZE
        : 0,

    y:
      hasTop
        ? -MARGIN_SIZE
        : 0,

    w:
      scaledWidth +
      (hasLeft
        ? MARGIN_SIZE
        : 0) +
      (hasRight
        ? MARGIN_SIZE
        : 0),

    h:
      scaledHeight +
      (hasTop
        ? MARGIN_SIZE
        : 0) +
      (hasBottom
        ? MARGIN_SIZE
        : 0),
  };

  useEffect(() => {
    let objectUrl:
      | string
      | null = null;

    let cancelled = false;

    const loadImage =
      async () => {
        let finalUrl =
          url || null;

        if (imageId) {
          const indexedDbUrl =
            await getCustomImageUrl(
              imageId
            );

          if (indexedDbUrl) {
            finalUrl =
              indexedDbUrl;

            objectUrl =
              indexedDbUrl;
          }
        }

        const bodyW =
          Number(width) || 80;

        const bodyH =
          Number(depth) || 120;

        /*
         * Le boîtier garde TOUJOURS
         * les dimensions BDD.
         */
        setRenderSize({
          w: bodyW,
          h: bodyH,
        });

        if (
          lastSize.current.w !==
          bodyW ||
          lastSize.current.h !==
          bodyH
        ) {
          lastSize.current = {
            w: bodyW,
            h: bodyH,
          };

          onSizeReady?.(
            bodyW,
            bodyH
          );
        }

        if (!finalUrl) {
          setImg(null);
          setImagePlacement(null);

          return;
        }

        const image =
          new window.Image();

        image.crossOrigin =
          "anonymous";

        image.src =
          finalUrl;

        image.onload = () => {
          if (cancelled) return;

          setImg(image);

          /*
           * Pedalboards :
           * comportement strictement identique à avant.
           */
          if (isBoard) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });

            return;
          }

          /*
           * IMPORTANT :
           *
           * Nouveau système désactivé.
           * On conserve exactement l'ancien comportement.
           *
           * Cela permet de migrer les marques
           * progressivement.
           */
          if (!useEnclosureSizing) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });

            return;
          }

          /*
           * Pas de jacks indiqués :
           * aucun ajustement nécessaire.
           */
          if (
            !hasHorizontalJacks &&
            !hasVerticalJacks
          ) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });

            return;
          }

          /*
           * Nouveau système :
           * détection du boîtier dans l'image HD.
           */
          const enclosure =
            detectEnclosure(
              image,
              hasHorizontalJacks,
              hasVerticalJacks
            );

          /*
           * Si la détection échoue,
           * on revient automatiquement
           * à l'ancien comportement.
           */
          if (!enclosure) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });

            return;
          }

          /*
           * La largeur détectée du boîtier
           * correspond exactement à width BDD.
           */
          const scaleX =
            bodyW /
            enclosure.bodyWidth;

          /*
           * La hauteur détectée du boîtier
           * correspond exactement à depth BDD.
           */
          const scaleY =
            bodyH /
            enclosure.bodyHeight;

          /*
           * Taille complète de l'image.
           * Les jacks dépassent naturellement.
           */
          const fullWidth =
            image.naturalWidth *
            scaleX;

          const fullHeight =
            image.naturalHeight *
            scaleY;

          /*
           * Centre du boîtier dans l'image source.
           */
          const bodyCenterX =
            enclosure.bodyLeft +
            enclosure.bodyWidth /
            2;

          const bodyCenterY =
            enclosure.bodyTop +
            enclosure.bodyHeight /
            2;

          /*
           * Le centre du BOÎTIER est placé en 0,0.
           * Les jacks restent à l'extérieur.
           */
          const x =
            -bodyCenterX *
            scaleX;

          const y =
            -bodyCenterY *
            scaleY;

          setImagePlacement({
            width: fullWidth,
            height: fullHeight,
            x,
            y,
          });
        };

        image.onerror = () => {
          if (cancelled) return;

          setImg(null);
          setImagePlacement(null);
        };
      };

    loadImage();

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [
    url,
    imageId,
    width,
    depth,
    isBoard,
    useEnclosureSizing,
    hasHorizontalJacks,
    hasVerticalJacks,
  ]);

  return (
    <Group>
      {/* MARGE JACKS */}
      {showJacksMargin &&
        !isBoard && (
          <Rect
            ref={marginRef}
            x={
              marginRect.x -
              scaledWidth / 2
            }
            y={
              marginRect.y -
              scaledHeight / 2
            }
            width={
              marginRect.w
            }
            height={
              marginRect.h
            }
            stroke={
              isColliding
                ? "#ef4444"
                : "#22c55e"
            }
            strokeWidth={1.5}
            dash={[4, 2]}
            cornerRadius={4}
            listening={false}
          />
        )}

      {/* IMAGE OU RECTANGLE */}
      {!img ||
        !imagePlacement ? (
        <Rect
          x={
            -scaledWidth / 2
          }
          y={
            -scaledHeight / 2
          }
          height={
            scaledHeight
          }
          width={
            scaledWidth
          }
          fill={
            color ||
            (isBoard
              ? "#18181b"
              : "#27272a")
          }
          stroke={
            color
              ? "rgba(255,255,255,0.3)"
              : "#3f3f46"
          }
          strokeWidth={1}
          cornerRadius={
            isBoard ? 0 : 3
          }
        />
      ) : (
        <KonvaImage
          image={img}
          x={
            imagePlacement.x
          }
          y={
            imagePlacement.y
          }
          width={
            imagePlacement.width
          }
          height={
            imagePlacement.height
          }
          listening={
            listening
          }
          cornerRadius={
            isBoard ? 0 : 3
          }
        />
      )}

      {/* TEXTE */}
      {!img &&
        name && (
          <Text
            x={
              -scaledWidth / 2
            }
            y={
              -scaledHeight / 2
            }
            height={
              scaledHeight
            }
            text={name}
            width={
              scaledWidth
            }
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