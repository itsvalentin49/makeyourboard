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
const MAX_ANALYSIS_SIZE = 420;
const enclosureCache = new Map<string, EnclosureBounds | null>();
const EDGE_SMOOTH_RADIUS_RATIO = 0.025;
const JACK_FILTER_RADIUS_RATIO = 0.10;
const JACK_PROTRUSION_RATIO = 0.025;
const MIN_VALID_LINE_RATIO = 0.08;
const RECTANGULAR_VARIATION_LIMIT = 1.10;
const BODY_OCCUPANCY_THRESHOLD = 0.65;
const TREADLE_DIMENSION_RATIO = 2.15;
const TREADLE_MIN_WIDTH = 65;
const TREADLE_MIN_DEPTH = 150;
const MINI_RECT_MAX_WIDTH = 45;
const MINI_RECT_MAX_DEPTH = 105;
const MINI_RECT_MIN_RATIO = 1.8;
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
  useEnclosureSizing?: boolean;
};
type ImagePlacement = {
  width: number;
  height: number;
  x: number;
  y: number;
};
type EnclosureBounds = {
  bodyLeft: number;
  bodyTop: number;
  bodyWidth: number;
  bodyHeight: number;
};
function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
}
function quantile(values: number[], q: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return (
    sorted[lower] * (1 - weight) +
    sorted[upper] * weight
  );
}
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
function isMostlyRectangular(
  occupancies: number[]
) {
  const valid = occupancies.filter(
    value => value > 0
  );
  if (valid.length < 8) {
    return true;
  }
  const p20 = quantile(valid, 0.20);
  const p80 = quantile(valid, 0.80);
  if (p20 <= 0) {
    return true;
  }
  return (
    p80 / p20 <=
    RECTANGULAR_VARIATION_LIMIT
  );
}
function smoothEdge(
  values: Array<number | null>,
  radius: number
) {
  return values.map((value, index) => {
    if (value === null) return null;
    const window: number[] = [];
    for (
      let i = Math.max(0, index - radius);
      i <= Math.min(values.length - 1, index + radius);
      i++
    ) {
      const candidate = values[i];
      if (candidate !== null) {
        window.push(candidate);
      }
    }
    if (window.length === 0) {
      return value;
    }
    return median(window);
  });
}
function removeLocalProtrusions(
  values: Array<number | null>,
  radius: number,
  threshold: number,
  edge: "min" | "max"
) {
  return values.map((value, index) => {
    if (value === null) return null;
    const window: number[] = [];
    for (
      let i = Math.max(0, index - radius);
      i <= Math.min(values.length - 1, index + radius);
      i++
    ) {
      if (i === index) continue;
      const candidate = values[i];
      if (candidate !== null) {
        window.push(candidate);
      }
    }
    if (window.length < 3) {
      return value;
    }
    const localMedian = median(window);
    const isOutwardProtrusion =
      edge === "min"
        ? value < localMedian - threshold
        : value > localMedian + threshold;
    return isOutwardProtrusion
      ? localMedian
      : value;
  });
}
function detectTreadleBounds(
  pixels: Uint8ClampedArray,
  canvasWidth: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const rows: Array<{ left: number; right: number; center: number; width: number }> = [];
  for (let y = minY; y <= maxY; y++) {
    let left = -1;
    let right = -1;
    for (let x = minX; x <= maxX; x++) {
      const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (left === -1) left = x;
        right = x;
      }
    }
    if (left !== -1 && right !== -1) {
      const width = right - left + 1;
      rows.push({
        left,
        right,
        center: (left + right) / 2,
        width,
      });
    }
  }
  if (rows.length < 8) return null;
  const centerMedian = median(rows.map(row => row.center));
  const centerTolerance = Math.max(2, visibleWidth * 0.035);
  const centeredRows = rows.filter(
    row => Math.abs(row.center - centerMedian) <= centerTolerance
  );
  if (centeredRows.length < 8) return null;
  const targetWidth = quantile(
    centeredRows.map(row => row.width),
    0.985
  );
  const widestRows = centeredRows.filter(
    row => row.width >= targetWidth - 1
  );
  const bodyLeft = Math.round(
    median(widestRows.map(row => row.left))
  );
  const bodyRight = Math.round(
    median(widestRows.map(row => row.right))
  );
  if (bodyRight - bodyLeft + 1 < visibleWidth * 0.35) return null;
  let bodyTop = maxY;
  let bodyBottom = minY;
  for (let x = bodyLeft; x <= bodyRight; x++) {
    let top = -1;
    let bottom = -1;
    for (let y = minY; y <= maxY; y++) {
      const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (top === -1) top = y;
        bottom = y;
      }
    }
    if (top !== -1) bodyTop = Math.min(bodyTop, top);
    if (bottom !== -1) bodyBottom = Math.max(bodyBottom, bottom);
  }
  if (bodyBottom < bodyTop) return null;
  return {
    bodyLeft,
    bodyTop,
    bodyWidth: bodyRight - bodyLeft + 1,
    bodyHeight: bodyBottom - bodyTop + 1,
  };
}
function detectMiniRectBounds(
  pixels: Uint8ClampedArray,
  canvasWidth: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const rows: Array<{ left: number; right: number; center: number; width: number }> = [];
  for (let y = minY; y <= maxY; y++) {
    let left = -1;
    let right = -1;
    for (let x = minX; x <= maxX; x++) {
      const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (left === -1) left = x;
        right = x;
      }
    }
    if (left !== -1 && right !== -1) {
      rows.push({
        left,
        right,
        center: (left + right) / 2,
        width: right - left + 1,
      });
    }
  }
  if (rows.length < 8) return null;
  const centerMedian = median(rows.map(row => row.center));
  const centered = rows.filter(
    row => Math.abs(row.center - centerMedian) <= Math.max(2, visibleWidth * 0.025)
  );
  if (centered.length < 8) return null;
  const widthMedian = median(centered.map(row => row.width));
  const bodyRows = centered.filter(
    row => row.width >= widthMedian * 0.88 && row.width <= widthMedian * 1.08
  );
  if (bodyRows.length < 6) return null;
  const bodyLeft = Math.round(median(bodyRows.map(row => row.left)));
  const bodyRight = Math.round(median(bodyRows.map(row => row.right)));
  const bodyWidth = bodyRight - bodyLeft + 1;
  if (bodyWidth < visibleWidth * 0.45) return null;
  const inset = Math.max(2, Math.round(bodyWidth * 0.22));
  const scanLeft = bodyLeft + inset;
  const scanRight = bodyRight - inset;
  let bodyTop = maxY;
  let bodyBottom = minY;
  for (let x = scanLeft; x <= scanRight; x++) {
    let top = -1;
    let bottom = -1;
    for (let y = minY; y <= maxY; y++) {
      const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (top === -1) top = y;
        bottom = y;
      }
    }
    if (top !== -1) bodyTop = Math.min(bodyTop, top);
    if (bottom !== -1) bodyBottom = Math.max(bodyBottom, bottom);
  }
  if (bodyBottom < bodyTop) return null;
  return {
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight: bodyBottom - bodyTop + 1,
  };
}
function getVisiblePixelBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha =
        pixels[(y * width + x) * 4 + 3];
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
  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}
function detectEnclosure(
  image: HTMLImageElement,
  detectHorizontal: boolean,
  detectVertical: boolean,
  treadleMode = false,
  miniRectMode = false
): EnclosureBounds | null {
  try {
    const canvas =
      document.createElement("canvas");
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const analysisScale = Math.min(
      1,
      MAX_ANALYSIS_SIZE /
      Math.max(naturalWidth, naturalHeight)
    );
    canvas.width = Math.max(
      1,
      Math.round(naturalWidth * analysisScale)
    );
    canvas.height = Math.max(
      1,
      Math.round(naturalHeight * analysisScale)
    );
    const ctx =
      canvas.getContext("2d", {
        willReadFrequently: true,
      });
    if (!ctx) return null;
    ctx.drawImage(
      image,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const imageData =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
    const pixels = imageData.data;
    const visibleBounds =
      getVisiblePixelBounds(
        pixels,
        canvas.width,
        canvas.height
      );
    if (!visibleBounds) {
      return null;
    }
    const {
      minX,
      minY,
      maxX,
      maxY,
    } = visibleBounds;
    const visibleWidth =
      maxX - minX + 1;
    const visibleHeight =
      maxY - minY + 1;
    if (miniRectMode) {
      const miniRect = detectMiniRectBounds(
        pixels,
        canvas.width,
        minX,
        minY,
        maxX,
        maxY
      );
      if (miniRect) {
        const inverseScale = 1 / analysisScale;
        return {
          bodyLeft: miniRect.bodyLeft * inverseScale,
          bodyTop: miniRect.bodyTop * inverseScale,
          bodyWidth: miniRect.bodyWidth * inverseScale,
          bodyHeight: miniRect.bodyHeight * inverseScale,
        };
      }
    }
    if (treadleMode) {
      const treadle = detectTreadleBounds(
        pixels,
        canvas.width,
        minX,
        minY,
        maxX,
        maxY
      );
      if (treadle) {
        const inverseScale = 1 / analysisScale;
        return {
          bodyLeft: treadle.bodyLeft * inverseScale,
          bodyTop: treadle.bodyTop * inverseScale,
          bodyWidth: treadle.bodyWidth * inverseScale,
          bodyHeight: treadle.bodyHeight * inverseScale,
        };
      }
    }
    let bodyLeft = minX;
    let bodyRight = maxX;
    let bodyTop = minY;
    let bodyBottom = maxY;
    if (detectHorizontal) {
      const leftEdges:
        Array<number | null> =
        new Array(visibleHeight).fill(null);
      const rightEdges:
        Array<number | null> =
        new Array(visibleHeight).fill(null);
      const rowOccupancy =
        new Array(visibleHeight).fill(0);
      for (
        let y = minY;
        y <= maxY;
        y++
      ) {
        let first = -1;
        let last = -1;
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
            if (first === -1) {
              first = x;
            }
            last = x;
            count++;
          }
        }
        const rowIndex = y - minY;
        rowOccupancy[rowIndex] = count;
        if (first !== -1) {
          leftEdges[rowIndex] = first;
          rightEdges[rowIndex] = last;
        }
      }
      const maxRowOccupancy =
        Math.max(...rowOccupancy);
      const minRowOccupancy =
        maxRowOccupancy *
        MIN_VALID_LINE_RATIO;
      for (
        let i = 0;
        i < rowOccupancy.length;
        i++
      ) {
        if (
          rowOccupancy[i] <
          minRowOccupancy
        ) {
          leftEdges[i] = null;
          rightEdges[i] = null;
        }
      }
      const horizontalIsRectangular =
        isMostlyRectangular(
          rowOccupancy.filter(
            value =>
              value >= minRowOccupancy
          )
        );
      if (horizontalIsRectangular) {
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
        const maxColumnOccupancy =
          Math.max(...columnOccupancy);
        const run =
          findLargestRun(
            columnOccupancy,
            maxColumnOccupancy *
            BODY_OCCUPANCY_THRESHOLD
          );
        if (run) {
          const detectedWidth =
            run.end - run.start + 1;
          if (
            detectedWidth >
            visibleWidth * 0.45
          ) {
            bodyLeft =
              minX + run.start;
            bodyRight =
              minX + run.end;
          }
        }
      } else {
        const jackFilterRadius =
          Math.max(
            4,
            Math.round(
              visibleHeight *
              JACK_FILTER_RADIUS_RATIO
            )
          );
        const horizontalThreshold =
          Math.max(
            3,
            visibleWidth *
            JACK_PROTRUSION_RATIO
          );
        const cleanedLeft =
          removeLocalProtrusions(
            leftEdges,
            jackFilterRadius,
            horizontalThreshold,
            "min"
          );
        const cleanedRight =
          removeLocalProtrusions(
            rightEdges,
            jackFilterRadius,
            horizontalThreshold,
            "max"
          );
        const horizontalRadius =
          Math.max(
            2,
            Math.round(
              visibleHeight *
              EDGE_SMOOTH_RADIUS_RATIO
            )
          );
        const smoothedLeft =
          smoothEdge(
            cleanedLeft,
            horizontalRadius
          );
        const smoothedRight =
          smoothEdge(
            cleanedRight,
            horizontalRadius
          );
        const validLeft =
          smoothedLeft.filter(
            (value): value is number =>
              value !== null
          );
        const validRight =
          smoothedRight.filter(
            (value): value is number =>
              value !== null
          );
        if (
          validLeft.length > 0 &&
          validRight.length > 0
        ) {
          bodyLeft =
            Math.round(
              Math.min(...validLeft)
            );
          bodyRight =
            Math.round(
              Math.max(...validRight)
            );
        }
      }
    }
    if (detectVertical) {
      const topEdges:
        Array<number | null> =
        new Array(visibleWidth).fill(null);
      const bottomEdges:
        Array<number | null> =
        new Array(visibleWidth).fill(null);
      const columnOccupancy =
        new Array(visibleWidth).fill(0);
      for (
        let x = minX;
        x <= maxX;
        x++
      ) {
        let first = -1;
        let last = -1;
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
            if (first === -1) {
              first = y;
            }
            last = y;
            count++;
          }
        }
        const columnIndex = x - minX;
        columnOccupancy[columnIndex] =
          count;
        if (first !== -1) {
          topEdges[columnIndex] = first;
          bottomEdges[columnIndex] = last;
        }
      }
      const maxColumnOccupancy =
        Math.max(...columnOccupancy);
      const minColumnOccupancy =
        maxColumnOccupancy *
        MIN_VALID_LINE_RATIO;
      for (
        let i = 0;
        i < columnOccupancy.length;
        i++
      ) {
        if (
          columnOccupancy[i] <
          minColumnOccupancy
        ) {
          topEdges[i] = null;
          bottomEdges[i] = null;
        }
      }
      const verticalIsRectangular =
        isMostlyRectangular(
          columnOccupancy.filter(
            value =>
              value >= minColumnOccupancy
          )
        );
      if (verticalIsRectangular) {
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
        const maxRowOccupancy =
          Math.max(...rowOccupancy);
        const run =
          findLargestRun(
            rowOccupancy,
            maxRowOccupancy *
            BODY_OCCUPANCY_THRESHOLD
          );
        if (run) {
          const detectedHeight =
            run.end - run.start + 1;
          if (
            detectedHeight >
            visibleHeight * 0.45
          ) {
            bodyTop =
              minY + run.start;
            bodyBottom =
              minY + run.end;
          }
        }
      } else {
        const jackFilterRadius =
          Math.max(
            4,
            Math.round(
              visibleWidth *
              JACK_FILTER_RADIUS_RATIO
            )
          );
        const verticalThreshold =
          Math.max(
            3,
            visibleHeight *
            JACK_PROTRUSION_RATIO
          );
        const cleanedTop =
          removeLocalProtrusions(
            topEdges,
            jackFilterRadius,
            verticalThreshold,
            "min"
          );
        const cleanedBottom =
          removeLocalProtrusions(
            bottomEdges,
            jackFilterRadius,
            verticalThreshold,
            "max"
          );
        const verticalRadius =
          Math.max(
            2,
            Math.round(
              visibleWidth *
              EDGE_SMOOTH_RADIUS_RATIO
            )
          );
        const smoothedTop =
          smoothEdge(
            cleanedTop,
            verticalRadius
          );
        const smoothedBottom =
          smoothEdge(
            cleanedBottom,
            verticalRadius
          );
        const validTop =
          smoothedTop.filter(
            (value): value is number =>
              value !== null
          );
        const validBottom =
          smoothedBottom.filter(
            (value): value is number =>
              value !== null
          );
        if (
          validTop.length > 0 &&
          validBottom.length > 0
        ) {
          bodyTop =
            Math.round(
              Math.min(...validTop)
            );
          bodyBottom =
            Math.round(
              Math.max(...validBottom)
            );
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
    if (
      bodyWidth < visibleWidth * 0.45 ||
      bodyHeight < visibleHeight * 0.45
    ) {
      const inverseScale =
        1 / analysisScale;
      return {
        bodyLeft:
          minX * inverseScale,
        bodyTop:
          minY * inverseScale,
        bodyWidth:
          visibleWidth * inverseScale,
        bodyHeight:
          visibleHeight * inverseScale,
      };
    }
    const inverseScale =
      1 / analysisScale;
    return {
      bodyLeft:
        bodyLeft * inverseScale,
      bodyTop:
        bodyTop * inverseScale,
      bodyWidth:
        bodyWidth * inverseScale,
      bodyHeight:
        bodyHeight * inverseScale,
    };
  } catch {
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
  const [renderSize, setRenderSize] =
    useState({
      w: Number(width) || 80,
      h: Number(depth) || 120,
    });
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
          if (isBoard) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });
            return;
          }
          if (!useEnclosureSizing) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });
            return;
          }
          const ratio = bodyH / bodyW;
          const miniRectMode =
            bodyW <= MINI_RECT_MAX_WIDTH &&
            bodyH <= MINI_RECT_MAX_DEPTH &&
            ratio >= MINI_RECT_MIN_RATIO;
          const treadleMode =
            ratio >= TREADLE_DIMENSION_RATIO &&
            bodyW >= TREADLE_MIN_WIDTH &&
            bodyH >= TREADLE_MIN_DEPTH;
          const cacheKey = [
            "enclosure-v10",
            miniRectMode ? "mini-rect" : treadleMode ? "treadle" : "standard",
            finalUrl,
          ].join("|");
          let enclosure:
            EnclosureBounds | null;
          if (
            enclosureCache.has(cacheKey)
          ) {
            enclosure =
              enclosureCache.get(
                cacheKey
              ) ?? null;
          } else {
            enclosure =
              detectEnclosure(
                image,
                true,
                true,
                treadleMode,
                miniRectMode
              );
            enclosureCache.set(
              cacheKey,
              enclosure
            );
          }
          if (!enclosure) {
            setImagePlacement({
              width: bodyW,
              height: bodyH,
              x: -bodyW / 2,
              y: -bodyH / 2,
            });
            return;
          }
          const scaleX =
            bodyW /
            enclosure.bodyWidth;
          const scaleY =
            bodyH /
            enclosure.bodyHeight;
          const fullWidth =
            image.naturalWidth *
            scaleX;
          const fullHeight =
            image.naturalHeight *
            scaleY;
          const bodyCenterX =
            enclosure.bodyLeft +
            enclosure.bodyWidth /
            2;
          const bodyCenterY =
            enclosure.bodyTop +
            enclosure.bodyHeight /
            2;
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
