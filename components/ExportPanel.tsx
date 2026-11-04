"use client";
import { ENCLOSURE_SIZING_BRANDS } from "@/utils/enclosureSizing";
import { useEffect, useRef, useState, } from "react";
import { Check, Copy, Download, Share2, Upload, } from "lucide-react";
import { getCustomImageUrl } from "@/utils/customImageStore";
import { supabase } from "@/lib/supabase";
import { getTranslator } from "@/utils/i18n";
type AnyRow = Record<string, any>;
type Props = {
  isLightTheme: boolean;
  isMobile?: boolean;
  boardPedals: AnyRow[];
  selectedBoards?: AnyRow[];
  displaySizes: Record<number, {
    w: number;
    h: number;
  }>;
  boardName?: string;
  canvasBg: string;
  signalPath?: AnyRow[];
  zoom?: number;
  stageX?: number;
  stageY?: number;
  onClose: () => void;
  currentBackground?: {
    type: "css" | "image";
    src?: string;
  };
};
// Stored image URLs belong to this load only; never revoke URLs owned by the canvas.
async function loadExportItemImage(item: AnyRow, loadImage: (src: string) => Promise<HTMLImageElement>): Promise<HTMLImageElement | null> {
  if (item.imageId) {
    let temporaryUrl: string | null = null;
    try {
      temporaryUrl = await getCustomImageUrl(item.imageId);
      if (temporaryUrl) return await loadImage(temporaryUrl);
    } catch (error) {
      console.warn("Unable to load stored custom image for export", item.imageId, error);
    } finally {
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
    }
  }
  const sources = Array.from(new Set([item.image, item.image_url, item.photo].filter((src): src is string => typeof src === "string" && src.trim().length > 0)));
  let lastError: unknown;
  for (const src of sources) {
    try { return await loadImage(src); }
    catch (error) { lastError = error; }
  }
  if (lastError) throw lastError;
  return null;
}


const MARGIN_SIZE = 13;
const ALPHA_THRESHOLD = 10;
const MAX_ANALYSIS_SIZE = 420;
const enclosureCache = new Map<string, EnclosureBounds | null>();
const EDGE_SMOOTH_RADIUS_RATIO = 0.025;
const JACK_FILTER_RADIUS_RATIO = 0.10;
const JACK_PROTRUSION_RATIO = 0.025;
const MIN_VALID_LINE_RATIO = 0.08;
const RECTANGULAR_VARIATION_LIMIT = 1.10;
const BODY_OCCUPANCY_THRESHOLD = 0.65;
const TREADLE_DIMENSION_RATIO = 1.8;
const TREADLE_MIN_WIDTH = 65;
const TREADLE_MIN_DEPTH = 150;
const MINI_RECT_MAX_WIDTH = 45;
const MINI_RECT_MAX_DEPTH = 105;
const MINI_RECT_MIN_RATIO = 1.8;
type EnclosureBounds = {
  bodyLeft: number;
  bodyTop: number;
  bodyWidth: number;
  bodyHeight: number;
};
function longestColumnRun(pixels: Uint8ClampedArray, canvasWidth: number, x: number, minY: number, maxY: number) {
  let longest = 0;
  let current = 0;
  for (let y = minY; y <= maxY; y++) {
    const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
    if (alpha > ALPHA_THRESHOLD) {
      current++;
      if (current > longest) {
        longest = current;
      }
    }
    else {
      current = 0;
    }
  }
  return longest;
}
function getBandIndices(start: number, end: number) {
  const length = end - start + 1;
  const firstStart = start +
    Math.round(length * 0.14);
  const firstEnd = start +
    Math.round(length * 0.38);
  const secondStart = start +
    Math.round(length * 0.62);
  const secondEnd = start +
    Math.round(length * 0.86);
  return [
    {
      start: firstStart,
      end: firstEnd,
    },
    {
      start: secondStart,
      end: secondEnd,
    },
  ];
}
function detectStandardRectBounds(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number, ignoreTopProtrusions = false, ignoreBottomProtrusions = false): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const visibleHeight = maxY - minY + 1;
  if (visibleWidth < 20 ||
    visibleHeight < 20) {
    return null;
  }
  /*
   * Largeur principale du boîtier.
   *
   * Les colonnes appartenant aux jacks latéraux ont
   * une hauteur beaucoup plus faible que celles du corps.
   */
  const verticalRuns = new Array(visibleWidth).fill(0);
  for (let x = minX; x <= maxX; x++) {
    verticalRuns[x - minX] = longestColumnRun(pixels, canvasWidth, x, minY, maxY);
  }
  const maxVerticalRun = Math.max(...verticalRuns);
  const bodyRun = findLargestRun(verticalRuns, maxVerticalRun * 0.65);
  if (!bodyRun) {
    return null;
  }
  const bodyLeft = minX + bodyRun.start;
  const bodyRight = minX + bodyRun.end;
  const bodyWidth = bodyRight -
    bodyLeft +
    1;
  if (bodyWidth <
    visibleWidth * 0.45) {
    return null;
  }
  /*
   * Échantillonnage vertical du boîtier.
   */
  const colBands = getBandIndices(bodyLeft, bodyRight);
  const colSamples: Array<{
    top: number;
    bottom: number;
  }> = [];
  for (const band of colBands) {
    for (let x = band.start; x <= band.end; x++) {
      let top = -1;
      let bottom = -1;
      for (let y = minY; y <= maxY; y++) {
        const alpha = pixels[(y *
          canvasWidth +
          x) *
          4 +
          3];
        if (alpha >
          ALPHA_THRESHOLD) {
          if (top === -1) {
            top = y;
          }
          bottom = y;
        }
      }
      if (top !== -1 &&
        bottom !== -1) {
        const height = bottom -
          top +
          1;
        if (height >=
          visibleHeight *
          0.55) {
          colSamples.push({
            top,
            bottom,
          });
        }
      }
    }
  }
  if (colSamples.length < 8) {
    return null;
  }
  const topValues = colSamples.map((sample) => sample.top);
  const bottomValues = colSamples.map((sample) => sample.bottom);
  let bodyTop = Math.floor(quantile(topValues, 0.15));
  let bodyBottom = Math.ceil(quantile(bottomValues, 0.85));
  const bodyRowOccupancy = new Array(visibleHeight).fill(0);
  for (let y = minY; y <= maxY; y++) {
    let count = 0;
    for (let x = bodyLeft; x <= bodyRight; x++) {
      const alpha = pixels[(y *
        canvasWidth +
        x) *
        4 +
        3];
      if (alpha >
        ALPHA_THRESHOLD) {
        count++;
      }
    }
    bodyRowOccupancy[y - minY] = count;
  }
  /*
   * Flancs structurels du châssis.
   *
   * Les knobs / jacks situés au-dessus peuvent occuper une
   * grande partie de la largeur et tromper une simple mesure
   * d'occupation horizontale. Le vrai boîtier rectangulaire,
   * lui, possède deux flancs gauche + droit présents ensemble
   * sur une grande hauteur.
   *
   * On mesure donc de fines bandes à l'intérieur des deux
   * bords détectés. Une rangée n'est considérée comme faisant
   * partie du châssis que si LES DEUX bandes sont suffisamment
   * opaques. Les contrôles centraux, même très gros ou reliés
   * au boîtier par leur axe, ne peuvent plus définir bodyTop.
   */
  const sideBandWidth = Math.max(2, Math.round(bodyWidth *
    0.075));
  const sideWallSupport = new Array(visibleHeight).fill(0);
  for (let y = minY; y <= maxY; y++) {
    let leftCount = 0;
    let rightCount = 0;
    for (let offset = 0; offset < sideBandWidth; offset++) {
      const leftX = Math.min(bodyRight, bodyLeft +
        offset);
      const rightX = Math.max(bodyLeft, bodyRight -
        offset);
      const leftAlpha = pixels[(y *
        canvasWidth +
        leftX) *
        4 +
        3];
      const rightAlpha = pixels[(y *
        canvasWidth +
        rightX) *
        4 +
        3];
      if (leftAlpha >
        ALPHA_THRESHOLD) {
        leftCount++;
      }
      if (rightAlpha >
        ALPHA_THRESHOLD) {
        rightCount++;
      }
    }
    sideWallSupport[y - minY] = Math.min(leftCount, rightCount);
  }
  /*
   * Une moyenne locale très courte évite qu'un reflet ou un
   * pixel transparent coupe artificiellement un long flanc.
   */
  const smoothedSideWallSupport = sideWallSupport.map((_, index) => {
    let total = 0;
    let count = 0;
    for (let j = Math.max(0, index - 2); j <=
      Math.min(sideWallSupport.length -
        1, index + 2); j++) {
      total +=
        sideWallSupport[j];
      count++;
    }
    return count > 0
      ? total / count
      : 0;
  });
  const sideWallRun = findLargestRun(smoothedSideWallSupport, Math.max(0.8, sideBandWidth *
    0.28));
  if (sideWallRun) {
    const sideRunHeight = sideWallRun.end -
      sideWallRun.start +
      1;
    /*
     * On n'utilise les flancs que s'ils décrivent une vraie
     * structure longue. Cela évite qu'un jack ou une décoration
     * latérale devienne accidentellement le bord du boîtier.
     */
    if (sideRunHeight >=
      Math.max(10, visibleHeight *
        0.38)) {
      let structuralTop = minY +
        sideWallRun.start;
      let structuralBottom = minY +
        sideWallRun.end;
      /*
       * Les coins supérieurs/inférieurs peuvent être arrondis :
       * on autorise une petite remontée/descente autour du long
       * segment de flanc, mais jamais jusqu'à une rangée de knobs.
       */
      const cornerAllowance = Math.max(3, Math.round(Math.min(bodyWidth *
        0.07, visibleHeight *
      0.035)));
      for (let step = 0; step < cornerAllowance; step++) {
        const candidate = structuralTop - 1;
        if (candidate < minY) {
          break;
        }
        const occupancy = bodyRowOccupancy[candidate - minY] || 0;
        if (occupancy <
          bodyWidth *
          0.42) {
          break;
        }
        structuralTop =
          candidate;
      }
      for (let step = 0; step < cornerAllowance; step++) {
        const candidate = structuralBottom + 1;
        if (candidate > maxY) {
          break;
        }
        const occupancy = bodyRowOccupancy[candidate - minY] || 0;
        if (occupancy <
          bodyWidth *
          0.42) {
          break;
        }
        structuralBottom =
          candidate;
      }
      bodyTop =
        Math.max(bodyTop, structuralTop);
      bodyBottom =
        Math.min(bodyBottom, structuralBottom);
    }
  }
  /*
   * 75 % est volontairement assez élevé :
   *
   * - une fine tranche supérieure est généralement
   *   beaucoup moins large ;
   * - la vraie façade occupe presque toute la largeur ;
   * - les petits jacks / switches sont ignorés.
   */
  const solidBodyRun = findLargestRun(bodyRowOccupancy, bodyWidth * 0.75);
  if (solidBodyRun) {
    const solidTop = minY +
      solidBodyRun.start;
    const topDifference = solidTop -
      bodyTop;
    const minLipHeight = Math.max(3, Math.round(visibleHeight *
      0.008));
    const maxLipHeight = Math.max(8, Math.round(visibleHeight *
      0.12));
    /*
     * Le sommet du boîtier ne doit pas dépendre de la taille
     * des contrôles qui dépassent au-dessus.
     *
     * Ancien comportement : on ne coupait une protrusion que
     * si elle faisait au maximum 12 % de la hauteur visible.
     * De gros knobs pouvaient donc être intégrés au boîtier.
     *
     * Nouveau comportement générique :
     * - les petites différences continuent d'utiliser le seuil
     *   historique, ce qui préserve les coins arrondis ;
     * - pour une grande différence, on vérifie que la zone
     *   située avant le rectangle plein reste structurellement
     *   plus étroite que le châssis ;
     * - dans ce cas, peu importe sa hauteur : knob, jack ou
     *   switch reste une protrusion et peut dépasser du contour.
     */
    let maxLeadingOccupancy = 0;
    const leadingStart = Math.max(0, bodyTop -
      minY);
    const leadingEnd = Math.min(bodyRowOccupancy.length -
      1, solidBodyRun.start -
    1);
    for (let i = leadingStart; i <= leadingEnd; i++) {
      maxLeadingOccupancy =
        Math.max(maxLeadingOccupancy, bodyRowOccupancy[i] ||
          0);
    }
    const solidRunHeight = solidBodyRun.end -
      solidBodyRun.start +
      1;
    const hasStructuralBodyBelow = solidRunHeight >=
      Math.max(8, visibleHeight *
        0.42);
    const leadingAreaIsProtrusion = topDifference >=
      minLipHeight &&
      maxLeadingOccupancy <
      bodyWidth *
      0.72;
    if (topDifference >=
      minLipHeight &&
      (topDifference <=
        maxLipHeight ||
        (hasStructuralBodyBelow &&
          leadingAreaIsProtrusion))) {
      bodyTop =
        solidTop;
    }
    /*
     * Même protection en bas, mais uniquement lorsqu'après
     * la dernière ligne pleine il ne reste que des éléments
     * étroits. Cela retire des pieds / jacks / ergots locaux
     * sans couper un véritable bord inférieur ou des coins
     * arrondis qui occupent encore une grande partie du boîtier.
     */
    const solidBottom = minY +
      solidBodyRun.end;
    const bottomDifference = bodyBottom -
      solidBottom;
    if (bottomDifference >=
      minLipHeight) {
      const trailingStart = solidBodyRun.end +
        1;
      const trailingEnd = Math.min(bodyRowOccupancy.length -
        1, bodyBottom -
      minY);
      let maxTrailingOccupancy = 0;
      for (let i = trailingStart; i <= trailingEnd; i++) {
        maxTrailingOccupancy =
          Math.max(maxTrailingOccupancy, bodyRowOccupancy[i] ||
            0);
      }
      const trailingAreaIsProtrusion = maxTrailingOccupancy <
        bodyWidth *
        0.55;
      if (trailingAreaIsProtrusion &&
        (bottomDifference <=
          maxLipHeight ||
          hasStructuralBodyBelow)) {
        bodyBottom =
          solidBottom;
      }
    }
  }
  if (ignoreTopProtrusions ||
    ignoreBottomProtrusions) {
    const protrusionRun = findLargestRun(bodyRowOccupancy, bodyWidth * 0.62);
    if (protrusionRun) {
      if (ignoreTopProtrusions) {
        bodyTop =
          Math.max(bodyTop, minY +
            protrusionRun.start);
      }
      if (ignoreBottomProtrusions) {
        bodyBottom =
          Math.min(bodyBottom, minY +
            protrusionRun.end);
      }
    }
  }
  const bodyHeight = bodyBottom -
    bodyTop +
    1;
  if (bodyHeight <
    visibleHeight *
    0.55) {
    return null;
  }
  return {
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight,
  };
}
function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length %
    2 ===
    1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] +
    sorted[middle]) / 2;
}
function quantile(values: number[], q: number) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) *
    q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  const weight = index - lower;
  return (sorted[lower] *
    (1 - weight) +
    sorted[upper] *
    weight);
}
function findLargestRun(values: number[], threshold: number) {
  let bestStart = -1;
  let bestEnd = -1;
  let currentStart = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] >=
      threshold) {
      if (currentStart ===
        -1) {
        currentStart = i;
      }
    }
    else if (currentStart !== -1) {
      const currentEnd = i - 1;
      if (bestStart === -1 ||
        currentEnd -
        currentStart >
        bestEnd -
        bestStart) {
        bestStart =
          currentStart;
        bestEnd =
          currentEnd;
      }
      currentStart = -1;
    }
  }
  if (currentStart !== -1) {
    const currentEnd = values.length - 1;
    if (bestStart === -1 ||
      currentEnd -
      currentStart >
      bestEnd -
      bestStart) {
      bestStart =
        currentStart;
      bestEnd =
        currentEnd;
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
function longestRowRun(pixels: Uint8ClampedArray, canvasWidth: number, y: number, minX: number, maxX: number) {
  let longest = 0;
  let current = 0;
  for (let x = minX; x <= maxX; x++) {
    const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
    if (alpha > ALPHA_THRESHOLD) {
      current++;
      if (current > longest)
        longest = current;
    }
    else {
      current = 0;
    }
  }
  return longest;
}
function isRectangularEnclosureCandidate(pixels: Uint8ClampedArray, canvasWidth: number, bounds: EnclosureBounds) {
  const { bodyLeft, bodyTop, bodyWidth, bodyHeight } = bounds;
  if (bodyWidth < 20 || bodyHeight < 20)
    return false;
  const bodyRight = bodyLeft + bodyWidth - 1;
  const insetY = Math.max(2, Math.round(bodyHeight * 0.08));
  const startY = bodyTop + insetY;
  const endY = bodyTop + bodyHeight - 1 - insetY;
  const widths: number[] = [];
  const leftEdges: number[] = [];
  const rightEdges: number[] = [];
  for (let y = startY; y <= endY; y++) {
    let left = -1;
    let right = -1;
    for (let x = bodyLeft; x <= bodyRight; x++) {
      const alpha = pixels[(y * canvasWidth + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (left === -1)
          left = x;
        right = x;
      }
    }
    if (left === -1 || right === -1)
      continue;
    const rowWidth = right - left + 1;
    if (rowWidth < bodyWidth * 0.55)
      continue;
    widths.push(rowWidth);
    leftEdges.push(left);
    rightEdges.push(right);
  }
  if (widths.length < Math.max(8, bodyHeight * 0.55)) {
    return false;
  }
  const widthP20 = quantile(widths, 0.20);
  const widthP80 = quantile(widths, 0.80);
  const leftSpread = quantile(leftEdges, 0.90) - quantile(leftEdges, 0.10);
  const rightSpread = quantile(rightEdges, 0.90) - quantile(rightEdges, 0.10);
  const nearlyFullRows = widths.filter((value) => value >= bodyWidth * 0.90).length / widths.length;
  return (widthP20 >= bodyWidth * 0.88 &&
    widthP80 / Math.max(1, widthP20) <= 1.08 &&
    leftSpread <= bodyWidth * 0.055 &&
    rightSpread <= bodyWidth * 0.055 &&
    nearlyFullRows >= 0.62);
}
function isStableTallRectangleCandidate(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number, bounds: EnclosureBounds) {
  /*
   * Un grand boîtier ne doit être considéré comme rectangulaire
   * que si sa largeur structurelle reste réellement stable.
   *
   * Cas visés :
   * - rectangle long + quelques jacks/knobs : seules quelques
   *   lignes dépassent la largeur du châssis -> rectangle ;
   * - châssis long trapézoïdal / type wah : une partie importante
   *   des lignes est progressivement plus large que le noyau
   *   rectangulaire détecté -> on laisse detectTreadleBounds gérer
   *   la largeur maximale réelle du châssis.
   *
   * Aucun nom de marque/modèle n'intervient ici.
   */
  const visibleWidth = maxX - minX + 1;
  const visibleHeight = maxY - minY + 1;
  if (visibleWidth < 20 ||
    visibleHeight < 20 ||
    bounds.bodyWidth < 20) {
    return true;
  }
  const candidateCenter = bounds.bodyLeft +
    bounds.bodyWidth / 2;
  const centerTolerance = Math.max(3, visibleWidth * 0.065);
  const widths: number[] = [];
  for (let y = minY; y <= maxY; y++) {
    let left = -1;
    let right = -1;
    for (let x = minX; x <= maxX; x++) {
      const alpha = pixels[(y * canvasWidth + x) *
        4 +
        3];
      if (alpha >
        ALPHA_THRESHOLD) {
        if (left === -1) {
          left = x;
        }
        right = x;
      }
    }
    if (left === -1 ||
      right === -1) {
      continue;
    }
    const rowWidth = right - left + 1;
    const rowCenter = (left + right) / 2;
    /*
     * On ignore les petits contrôles centraux ainsi que les
     * excroissances très décentrées. Les lignes conservées doivent
     * pouvoir appartenir au châssis principal.
     */
    if (rowWidth <
      bounds.bodyWidth * 0.55 ||
      Math.abs(rowCenter -
        candidateCenter) >
      centerTolerance) {
      continue;
    }
    widths.push(rowWidth);
  }
  if (widths.length <
    Math.max(12, visibleHeight * 0.35)) {
    return true;
  }
  const clearlyWiderFraction = widths.filter((value) => value >
    bounds.bodyWidth * 1.055).length /
    widths.length;
  const robustWideWidth = quantile(widths, 0.90);
  /*
   * Un jack latéral produit quelques lignes larges. Un châssis
   * trapézoïdal en produit beaucoup et son 90e percentile reste
   * sensiblement supérieur à la largeur du noyau rectangulaire.
   */
  const hasProgressiveWidthChange = clearlyWiderFraction >= 0.22 &&
    robustWideWidth >
    bounds.bodyWidth * 1.075;
  return !hasProgressiveWidthChange;
}
function detectMainBodyBounds(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const visibleHeight = maxY - minY + 1;
  if (visibleWidth < 20 || visibleHeight < 20)
    return null;
  const verticalRuns = new Array(visibleWidth).fill(0);
  for (let x = minX; x <= maxX; x++) {
    verticalRuns[x - minX] = longestColumnRun(pixels, canvasWidth, x, minY, maxY);
  }
  const horizontalRuns = new Array(visibleHeight).fill(0);
  for (let y = minY; y <= maxY; y++) {
    horizontalRuns[y - minY] = longestRowRun(pixels, canvasWidth, y, minX, maxX);
  }
  const maxVerticalRun = Math.max(...verticalRuns);
  const maxHorizontalRun = Math.max(...horizontalRuns);
  const xCore = findLargestRun(verticalRuns, maxVerticalRun * 0.35);
  const yCore = findLargestRun(horizontalRuns, maxHorizontalRun * 0.35);
  if (!xCore || !yCore)
    return null;
  let xStart = xCore.start;
  let xEnd = xCore.end;
  let yStart = yCore.start;
  let yEnd = yCore.end;
  const xExpandThreshold = maxVerticalRun * 0.22;
  const yExpandThreshold = maxHorizontalRun * 0.22;
  while (xStart > 0 && verticalRuns[xStart - 1] >= xExpandThreshold)
    xStart--;
  while (xEnd < verticalRuns.length - 1 && verticalRuns[xEnd + 1] >= xExpandThreshold)
    xEnd++;
  while (yStart > 0 && horizontalRuns[yStart - 1] >= yExpandThreshold)
    yStart--;
  while (yEnd < horizontalRuns.length - 1 && horizontalRuns[yEnd + 1] >= yExpandThreshold)
    yEnd++;
  const bodyLeft = minX + xStart;
  const bodyTop = minY + yStart;
  const bodyWidth = xEnd - xStart + 1;
  const bodyHeight = yEnd - yStart + 1;
  if (bodyWidth < visibleWidth * 0.45 ||
    bodyHeight < visibleHeight * 0.45) {
    return null;
  }
  return { bodyLeft, bodyTop, bodyWidth, bodyHeight };
}
function isMostlyRectangular(occupancies: number[]) {
  const valid = occupancies.filter((value) => value > 0);
  if (valid.length < 8) {
    return true;
  }
  const p20 = quantile(valid, 0.20);
  const p80 = quantile(valid, 0.80);
  if (p20 <= 0) {
    return true;
  }
  return (p80 / p20 <=
    RECTANGULAR_VARIATION_LIMIT);
}
function smoothEdge(values: Array<number | null>, radius: number) {
  return values.map((value, index) => {
    if (value === null) {
      return null;
    }
    const window: number[] = [];
    for (let i = Math.max(0, index -
      radius); i <=
      Math.min(values.length -
        1, index +
      radius); i++) {
      const candidate = values[i];
      if (candidate !==
        null) {
        window.push(candidate);
      }
    }
    if (window.length ===
      0) {
      return value;
    }
    return median(window);
  });
}
function removeLocalProtrusions(values: Array<number | null>, radius: number, threshold: number, edge: "min" | "max") {
  return values.map((value, index) => {
    if (value === null) {
      return null;
    }
    const window: number[] = [];
    for (let i = Math.max(0, index -
      radius); i <=
      Math.min(values.length -
        1, index +
      radius); i++) {
      if (i === index) {
        continue;
      }
      const candidate = values[i];
      if (candidate !==
        null) {
        window.push(candidate);
      }
    }
    if (window.length < 3) {
      return value;
    }
    const localMedian = median(window);
    const isOutwardProtrusion = edge === "min"
      ? value <
      localMedian -
      threshold
      : value >
      localMedian +
      threshold;
    return isOutwardProtrusion
      ? localMedian
      : value;
  });
}
function detectTreadleBounds(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const visibleHeight = maxY - minY + 1;
  if (visibleWidth < 20 ||
    visibleHeight < 20) {
    return null;
  }
  /*
   * 1. Détection générique des châssis longs à flancs progressifs.
   */
  const rows: Array<{
    y: number;
    left: number;
    right: number;
    center: number;
    width: number;
  }> = [];
  const leftEdges: Array<number | null> = new Array(visibleHeight).fill(null);
  const rightEdges: Array<number | null> = new Array(visibleHeight).fill(null);
  for (let y = minY; y <= maxY; y++) {
    let left = -1;
    let right = -1;
    for (let x = minX; x <= maxX; x++) {
      const alpha = pixels[(y *
        canvasWidth +
        x) *
        4 +
        3];
      if (alpha >
        ALPHA_THRESHOLD) {
        if (left === -1) {
          left = x;
        }
        right = x;
      }
    }
    if (left !== -1 &&
      right !== -1) {
      const width = right -
        left +
        1;
      const index = y - minY;
      leftEdges[index] =
        left;
      rightEdges[index] =
        right;
      rows.push({
        y,
        left,
        right,
        center: (left +
          right) /
          2,
        width,
      });
    }
  }
  if (rows.length < 8) {
    return null;
  }
  const centerMedian = median(rows.map((row) => row.center));
  const centerTolerance = Math.max(2, visibleWidth *
    0.035);
  const centeredRows = rows.filter((row) => Math.abs(row.center -
    centerMedian) <=
    centerTolerance);
  if (centeredRows.length < 8) {
    return null;
  }
  const centeredWidths = centeredRows.map((row) => row.width);
  const normalWidth = quantile(centeredWidths, 0.70);
  const extremeWidth = quantile(centeredWidths, 0.985);
  /*
   * Largeur structurelle du châssis.
   *
   * Contrairement à une simple comparaison entre la largeur
   * "normale" et la largeur maximale, cette mesure détecte
   * aussi les petits jacks qui ne dépassent que de quelques
   * pourcents. Le vrai flanc du boîtier reste opaque sur une
   * grande partie de la hauteur ; un jack latéral, non.
   */
  const verticalRuns = new Array(visibleWidth).fill(0);
  for (let x = minX; x <= maxX; x++) {
    verticalRuns[x - minX] = longestColumnRun(pixels, canvasWidth, x, minY, maxY);
  }
  const maxVerticalRun = Math.max(...verticalRuns);
  const structuralRun = findLargestRun(verticalRuns, maxVerticalRun *
    0.55);
  const structuralWidth = structuralRun
    ? structuralRun.end -
    structuralRun.start +
    1
    : 0;
  const structuralWidthIsValid = structuralRun !== null &&
    structuralWidth >=
    visibleWidth *
    0.35 &&
    structuralWidth >=
    normalWidth *
    0.92 &&
    structuralWidth <=
    normalWidth *
    1.05;
  const widerThanStructuralFraction = structuralWidthIsValid
    ? centeredRows.filter((row) => row.width >
      structuralWidth *
      1.025).length /
    centeredRows.length
    : 1;
  const structuralShowsSideProtrusions = structuralWidthIsValid &&
    extremeWidth >
    structuralWidth *
    1.025 &&
    widerThanStructuralFraction <=
    0.15;
  /*
   * On conserve le seuil historique de 10 % pour les cas
   * généraux. Le nouveau test structurel ajoute seulement
   * les protrusions courtes et peu profondes (comme les
   * jacks de quelques millimètres), sans confondre un
   * châssis réellement trapézoïdal avec un jack.
   */
  const hasSideProtrusions = structuralShowsSideProtrusions ||
    (normalWidth > 0 &&
      extremeWidth >
      normalWidth *
      1.10);
  let bodyLeft: number;
  let bodyRight: number;
  if (!hasSideProtrusions) {
    const targetWidth = extremeWidth;
    const widestRows = centeredRows.filter((row) => row.width >=
      targetWidth -
      1);
    if (widestRows.length === 0) {
      return null;
    }
    bodyLeft =
      Math.round(median(widestRows.map((row) => row.left)));
    bodyRight =
      Math.round(median(widestRows.map((row) => row.right)));
  }
  else {
    /*
     * 2. Cas avec boutons / jacks latéraux.
     *
     * Si la largeur structurelle confirme que seules quelques
     * lignes sont plus larges, elle devient directement la
     * largeur du châssis. Sinon on conserve le filtre médian
     * historique pour les treadles à flancs progressifs.
     */
    if (structuralRun &&
      structuralShowsSideProtrusions) {
      bodyLeft =
        minX +
        structuralRun.start;
      bodyRight =
        minX +
        structuralRun.end;
    }
    else {
      /*
       * Deuxième passe : comportement historique pour les
       * treadles dont les flancs évoluent progressivement.
       * Le filtre médian retire les protrusions locales tout
       * en conservant la forme générale du châssis.
       */
      const robustRadius = Math.max(8, Math.round(visibleHeight *
        0.14));
      const filteredLeft = smoothEdge(leftEdges, robustRadius);
      const filteredRight = smoothEdge(rightEdges, robustRadius);
      const filteredRows: Array<{
        left: number;
        right: number;
        center: number;
        width: number;
      }> = [];
      for (let i = 0; i < visibleHeight; i++) {
        const left = filteredLeft[i];
        const right = filteredRight[i];
        if (left === null ||
          right === null) {
          continue;
        }
        const width = right -
          left +
          1;
        if (width <= 0) {
          continue;
        }
        const center = (left +
          right) /
          2;
        if (Math.abs(center -
          centerMedian) >
          visibleWidth *
          0.06) {
          continue;
        }
        filteredRows.push({
          left,
          right,
          center,
          width,
        });
      }
      if (filteredRows.length < 8) {
        return null;
      }
      /*
       * On prend les limites extérieures robustes du
       * châssis filtré. Les 3 % extrêmes restants sont
       * ignorés pour ne jamais récupérer un bouton.
       */
      bodyLeft =
        Math.round(quantile(filteredRows.map((row) => row.left), 0.03));
      bodyRight =
        Math.round(quantile(filteredRows.map((row) => row.right), 0.97));
    }
  }
  const bodyWidth = bodyRight -
    bodyLeft +
    1;
  if (bodyWidth <
    visibleWidth *
    0.35) {
    return null;
  }
  /*
   * 3. Hauteur du vrai boîtier.
   *
   * On regarde seulement l'occupation à l'intérieur
   * de la largeur détectée. Les boutons, jacks et
   * switches isolés n'occupent pas assez de largeur
   * pour être considérés comme le châssis.
   */
  /*
   * Pour la hauteur, on mesure la plus longue bande opaque
   * CONTINUE sur chaque ligne, et non la somme de tous les
   * pixels opaques. Plusieurs knobs / jacks séparés peuvent
   * occuper ensemble une grande partie de la largeur sans
   * constituer le châssis ; un vrai bord de boîtier, lui,
   * forme une bande horizontale continue.
   */
  const rowStructuralRuns = new Array(visibleHeight).fill(0);
  for (let y = minY; y <= maxY; y++) {
    rowStructuralRuns[y - minY] = longestRowRun(pixels, canvasWidth, y, bodyLeft, bodyRight);
  }
  const solidRun = findLargestRun(rowStructuralRuns, bodyWidth *
    0.42);
  if (!solidRun) {
    return null;
  }
  let bodyTop = minY +
    solidRun.start;
  let bodyBottom = minY +
    solidRun.end;
  /*
   * Récupération des coins arrondis immédiatement
   * adjacents, sans remonter jusqu'aux contrôles.
   */
  const cornerThreshold = bodyWidth *
    0.22;
  while (bodyTop > minY &&
    rowStructuralRuns[bodyTop -
    minY -
    1] >=
    cornerThreshold) {
    bodyTop--;
  }
  while (bodyBottom < maxY &&
    rowStructuralRuns[bodyBottom -
    minY +
    1] >=
    cornerThreshold) {
    bodyBottom++;
  }
  const bodyHeight = bodyBottom -
    bodyTop +
    1;
  if (bodyHeight <
    visibleHeight *
    0.45) {
    return null;
  }
  return {
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight,
  };
}
function detectMiniRectBounds(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const rows: Array<{
    y: number;
    left: number;
    right: number;
    center: number;
    width: number;
  }> = [];
  for (let y = minY; y <= maxY; y++) {
    let left = -1;
    let right = -1;
    for (let x = minX; x <= maxX; x++) {
      const alpha = pixels[(y *
        canvasWidth +
        x) *
        4 +
        3];
      if (alpha >
        ALPHA_THRESHOLD) {
        if (left === -1) {
          left = x;
        }
        right = x;
      }
    }
    if (left !== -1 &&
      right !== -1) {
      rows.push({
        y,
        left,
        right,
        center: (left +
          right) /
          2,
        width: right -
          left +
          1,
      });
    }
  }
  if (rows.length < 8) {
    return null;
  }
  const centerMedian = median(rows.map((row) => row.center));
  const centeredRows = rows.filter((row) => Math.abs(row.center -
    centerMedian) <=
    Math.max(2, visibleWidth *
      0.03));
  if (centeredRows.length <
    8) {
    return null;
  }
  const bodyWidthEstimate = quantile(centeredRows.map((row) => row.width), 0.75);
  const bodyRows = centeredRows.filter((row) => row.width >=
    bodyWidthEstimate *
    0.88 &&
    row.width <=
    bodyWidthEstimate *
    1.08);
  if (bodyRows.length < 6) {
    return null;
  }
  const bodyLeft = Math.round(median(bodyRows.map((row) => row.left)));
  const bodyRight = Math.round(median(bodyRows.map((row) => row.right)));
  const bodyWidth = bodyRight -
    bodyLeft +
    1;
  if (bodyWidth <
    visibleWidth *
    0.45) {
    return null;
  }
  /*
   * Hauteur du vrai boîtier.
   *
   * On garde les lignes suffisamment larges pour appartenir
   * au châssis, mais on autorise les coins arrondis.
   *
   * Les protrusions étroites (jack en haut, footswitch qui
   * dépasse, etc.) sont automatiquement exclues car elles
   * n'occupent pas assez de largeur.
   */
  const heightRows = centeredRows.filter((row) => row.width >=
    bodyWidth *
    0.55 &&
    row.width <=
    bodyWidth *
    1.12);
  if (heightRows.length < 6) {
    return null;
  }
  const bodyTop = Math.min(...heightRows.map((row) => row.y));
  const bodyBottom = Math.max(...heightRows.map((row) => row.y));
  const bodyHeight = bodyBottom -
    bodyTop +
    1;
  if (bodyHeight <= 0) {
    return null;
  }
  return {
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight,
  };
}
function getVisiblePixelBounds(pixels: Uint8ClampedArray, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = pixels[(y *
        width +
        x) *
        4 +
        3];
      if (alpha >
        ALPHA_THRESHOLD) {
        minX =
          Math.min(minX, x);
        minY =
          Math.min(minY, y);
        maxX =
          Math.max(maxX, x);
        maxY =
          Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX ||
    maxY < minY) {
    return null;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}
function detectRoundBounds(pixels: Uint8ClampedArray, canvasWidth: number, minX: number, minY: number, maxX: number, maxY: number): EnclosureBounds | null {
  const visibleWidth = maxX - minX + 1;
  const visibleHeight = maxY - minY + 1;
  if (visibleWidth < 20 ||
    visibleHeight < 20) {
    return null;
  }
  /*
   * Détection générique d'un boîtier circulaire.
   *
   * IMPORTANT : on ne mesure jamais le cercle avec le premier
   * et le dernier pixel opaque d'une ligne. Deux boutons ou jacks
   * latéraux pourraient alors être inclus dans le diamètre.
   *
   * On mesure à la place la plus longue portion opaque CONTINUE
   * sur chaque ligne et chaque colonne. Le corps circulaire reste
   * continu sur presque tout son diamètre, tandis qu'une commande
   * qui dépasse n'est présente que localement.
   */
  const rowRuns = new Array(visibleHeight).fill(0);
  for (let y = minY; y <= maxY; y++) {
    rowRuns[y - minY] = longestRowRun(pixels, canvasWidth, y, minX, maxX);
  }
  const columnRuns = new Array(visibleWidth).fill(0);
  for (let x = minX; x <= maxX; x++) {
    columnRuns[x - minX] = longestColumnRun(pixels, canvasWidth, x, minY, maxY);
  }
  const maxRowRun = Math.max(...rowRuns);
  const maxColumnRun = Math.max(...columnRuns);
  /*
   * Une protrusion horizontale peut gonfler maxRowRun ; une
   * protrusion verticale peut gonfler maxColumnRun. Le plus petit
   * des deux reste donc l'estimation la plus sûre du diamètre du
   * corps principal. Le profil circulaire ci-dessous doit ensuite
   * confirmer cette estimation.
   */
  const diameter = Math.min(maxRowRun, maxColumnRun);
  if (diameter < 20) {
    return null;
  }
  /*
   * Le corps détecté doit tenir dans l'image, mais les commandes
   * peuvent dépasser largement sur les côtés ou en haut/bas.
   * On ne limite donc plus la silhouette complète à ~118 % du
   * diamètre, ce qui excluait précisément les pédales rondes avec
   * de gros boutons latéraux.
   */
  if (visibleWidth <
    diameter * 0.90 ||
    visibleHeight <
    diameter * 0.90 ||
    visibleWidth >
    diameter * 2.20 ||
    visibleHeight >
    diameter * 2.20) {
    return null;
  }
  /*
   * Centre horizontal : les colonnes traversant le milieu du disque
   * ont une très grande continuité verticale. Les boutons latéraux
   * ont au contraire des runs verticaux beaucoup plus courts.
   */
  const centralColumns: number[] = [];
  for (let i = 0; i < columnRuns.length; i++) {
    if (columnRuns[i] >=
      diameter * 0.90) {
      centralColumns.push(minX + i);
    }
  }
  /*
   * Centre vertical : même principe avec les lignes traversant le
   * milieu du disque. Une commande en haut ou en bas ne peut pas
   * déplacer ce centre puisqu'elle n'occupe pas presque tout le
   * diamètre horizontal.
   */
  const centralRows: number[] = [];
  for (let i = 0; i < rowRuns.length; i++) {
    if (rowRuns[i] >=
      diameter * 0.90) {
      centralRows.push(minY + i);
    }
  }
  if (centralColumns.length < 3 ||
    centralRows.length < 3) {
    return null;
  }
  const centerX = median(centralColumns);
  const centerY = median(centralRows);
  const bodyLeft = centerX -
    diameter / 2;
  const bodyRight = centerX +
    diameter / 2;
  const bodyTop = centerY -
    diameter / 2;
  const bodyBottom = centerY +
    diameter / 2;
  const positionTolerance = diameter * 0.10;
  if (bodyLeft <
    minX -
    positionTolerance ||
    bodyRight >
    maxX +
    positionTolerance ||
    bodyTop <
    minY -
    positionTolerance ||
    bodyBottom >
    maxY +
    positionTolerance) {
    return null;
  }
  const widthAt = (targetY: number) => {
    const index = Math.max(0, Math.min(rowRuns.length - 1, Math.round(targetY - minY)));
    return rowRuns[index] || 0;
  };
  const heightAt = (targetX: number) => {
    const index = Math.max(0, Math.min(columnRuns.length - 1, Math.round(targetX - minX)));
    return columnRuns[index] || 0;
  };
  /*
   * Profil attendu d'un cercle sur les DEUX axes.
   *
   * Tester les runs continus horizontalement et verticalement évite
   * qu'une forme organique quasi carrée soit prise pour un cercle,
   * tout en restant insensible aux petites excroissances locales.
   */
  const upperMid = widthAt(centerY -
    diameter * 0.30) /
    diameter;
  const lowerMid = widthAt(centerY +
    diameter * 0.30) /
    diameter;
  const upperEdge = widthAt(centerY -
    diameter * 0.42) /
    diameter;
  const lowerEdge = widthAt(centerY +
    diameter * 0.42) /
    diameter;
  const leftMid = heightAt(centerX -
    diameter * 0.30) /
    diameter;
  const rightMid = heightAt(centerX +
    diameter * 0.30) /
    diameter;
  const leftEdge = heightAt(centerX -
    diameter * 0.42) /
    diameter;
  const rightEdge = heightAt(centerX +
    diameter * 0.42) /
    diameter;
  const horizontalMidProfileOk = upperMid >= 0.58 &&
    upperMid <= 0.96 &&
    lowerMid >= 0.58 &&
    lowerMid <= 0.96;
  const horizontalEdgeProfileOk = upperEdge >= 0.28 &&
    upperEdge <= 0.82 &&
    lowerEdge >= 0.28 &&
    lowerEdge <= 0.82;
  const verticalMidProfileOk = leftMid >= 0.58 &&
    leftMid <= 0.96 &&
    rightMid >= 0.58 &&
    rightMid <= 0.96;
  const verticalEdgeProfileOk = leftEdge >= 0.28 &&
    leftEdge <= 0.82 &&
    rightEdge >= 0.28 &&
    rightEdge <= 0.82;
  const symmetryOk = Math.abs(upperMid -
    lowerMid) <= 0.18 &&
    Math.abs(upperEdge -
      lowerEdge) <= 0.22 &&
    Math.abs(leftMid -
      rightMid) <= 0.18 &&
    Math.abs(leftEdge -
      rightEdge) <= 0.22;
  if (!horizontalMidProfileOk ||
    !horizontalEdgeProfileOk ||
    !verticalMidProfileOk ||
    !verticalEdgeProfileOk ||
    !symmetryOk) {
    return null;
  }
  return {
    bodyLeft,
    bodyTop,
    bodyWidth: diameter,
    bodyHeight: diameter,
  };
}
function detectEnclosure(image: HTMLImageElement, detectHorizontal: boolean, detectVertical: boolean, treadleMode = false, miniRectMode = false, standardRectMode = false, hasTopJacks = false, hasBottomJacks = false, roundCandidateMode = false): EnclosureBounds | null {
  try {
    const canvas = document.createElement("canvas");
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;
    const analysisScale = Math.min(1, MAX_ANALYSIS_SIZE /
      Math.max(naturalWidth, naturalHeight));
    canvas.width =
      Math.max(1, Math.round(naturalWidth *
        analysisScale));
    canvas.height =
      Math.max(1, Math.round(naturalHeight *
        analysisScale));
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!ctx) {
      return null;
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const visibleBounds = getVisiblePixelBounds(pixels, canvas.width, canvas.height);
    if (!visibleBounds) {
      return null;
    }
    const { minX, minY, maxX, maxY, } = visibleBounds;
    const visibleWidth = maxX -
      minX +
      1;
    const visibleHeight = maxY -
      minY +
      1;
    const silhouetteRowOccupancy = new Array(visibleHeight).fill(0);
    for (let y = minY; y <= maxY; y++) {
      let count = 0;
      for (let x = minX; x <= maxX; x++) {
        const alpha = pixels[(y *
          canvas.width +
          x) *
          4 +
          3];
        if (alpha >
          ALPHA_THRESHOLD) {
          count++;
        }
      }
      silhouetteRowOccupancy[y - minY] = count;
    }
    const silhouetteIsRectangular = isMostlyRectangular(silhouetteRowOccupancy);
    /*
     * Les boîtiers circulaires ne doivent jamais passer
     * dans la logique de correction rectangulaire : cela
     * transformerait le cercle en ellipse.
     */
    if (roundCandidateMode &&
      !silhouetteIsRectangular) {
      const roundBounds = detectRoundBounds(pixels, canvas.width, minX, minY, maxX, maxY);
      if (roundBounds) {
        const inverseScale = 1 /
          analysisScale;
        return {
          bodyLeft: roundBounds.bodyLeft *
            inverseScale,
          bodyTop: roundBounds.bodyTop *
            inverseScale,
          bodyWidth: roundBounds.bodyWidth *
            inverseScale,
          bodyHeight: roundBounds.bodyHeight *
            inverseScale,
        };
      }
    }
    if (miniRectMode) {
      const miniRect = detectMiniRectBounds(pixels, canvas.width, minX, minY, maxX, maxY);
      if (miniRect) {
        const inverseScale = 1 /
          analysisScale;
        return {
          bodyLeft: miniRect.bodyLeft *
            inverseScale,
          bodyTop: miniRect.bodyTop *
            inverseScale,
          bodyWidth: miniRect.bodyWidth *
            inverseScale,
          bodyHeight: miniRect.bodyHeight *
            inverseScale,
        };
      }
    }
    if (standardRectMode) {
      const standardRect = detectStandardRectBounds(pixels, canvas.width, minX, minY, maxX, maxY, hasTopJacks, hasBottomJacks);
      if (standardRect &&
        isRectangularEnclosureCandidate(pixels, canvas.width, standardRect)) {
        const inverseScale = 1 /
          analysisScale;
        return {
          bodyLeft: standardRect.bodyLeft *
            inverseScale,
          bodyTop: standardRect.bodyTop *
            inverseScale,
          bodyWidth: standardRect.bodyWidth *
            inverseScale,
          bodyHeight: standardRect.bodyHeight *
            inverseScale,
        };
      }
      /*
       * Forme réellement non rectangulaire : on ne la force jamais
       * dans un rectangle. On récupère seulement les dimensions
       * maximales du corps principal en ignorant les excroissances
       * courtes (jacks, boutons, switches).
       */
      if (!silhouetteIsRectangular) {
        const mainBody = detectMainBodyBounds(pixels, canvas.width, minX, minY, maxX, maxY);
        if (mainBody) {
          const inverseScale = 1 /
            analysisScale;
          return {
            bodyLeft: mainBody.bodyLeft *
              inverseScale,
            bodyTop: mainBody.bodyTop *
              inverseScale,
            bodyWidth: mainBody.bodyWidth *
              inverseScale,
            bodyHeight: mainBody.bodyHeight *
              inverseScale,
          };
        }
      }
    }
    if (treadleMode) {
      /*
       * Le ratio physique seul ne suffit pas à reconnaître un
       * treadle : certaines pédales classiques sont simplement
       * longues (par exemple un grand boîtier rectangulaire).
       *
       * Avant d'utiliser la logique wah/expression, on donne donc
       * la priorité à un vrai rectangle structurel confirmé par
       * sa silhouette. Un châssis trapézoïdal échoue naturellement
       * à ce test et conserve la détection à flancs progressifs.
       */
      const tallRect = detectStandardRectBounds(pixels, canvas.width, minX, minY, maxX, maxY, hasTopJacks, hasBottomJacks);
      if (tallRect &&
        isRectangularEnclosureCandidate(pixels, canvas.width, tallRect) &&
        isStableTallRectangleCandidate(pixels, canvas.width, minX, minY, maxX, maxY, tallRect)) {
        const inverseScale = 1 /
          analysisScale;
        return {
          bodyLeft: tallRect.bodyLeft *
            inverseScale,
          bodyTop: tallRect.bodyTop *
            inverseScale,
          bodyWidth: tallRect.bodyWidth *
            inverseScale,
          bodyHeight: tallRect.bodyHeight *
            inverseScale,
        };
      }
      const treadle = detectTreadleBounds(pixels, canvas.width, minX, minY, maxX, maxY);
      if (treadle) {
        const inverseScale = 1 /
          analysisScale;
        return {
          bodyLeft: treadle.bodyLeft *
            inverseScale,
          bodyTop: treadle.bodyTop *
            inverseScale,
          bodyWidth: treadle.bodyWidth *
            inverseScale,
          bodyHeight: treadle.bodyHeight *
            inverseScale,
        };
      }
    }
    let bodyLeft = minX;
    let bodyRight = maxX;
    let bodyTop = minY;
    let bodyBottom = maxY;
    if (detectHorizontal) {
      const leftEdges: Array<number | null> = new Array(visibleHeight).fill(null);
      const rightEdges: Array<number | null> = new Array(visibleHeight).fill(null);
      const rowOccupancy = new Array(visibleHeight).fill(0);
      for (let y = minY; y <= maxY; y++) {
        let first = -1;
        let last = -1;
        let count = 0;
        for (let x = minX; x <= maxX; x++) {
          const alpha = pixels[(y *
            canvas.width +
            x) *
            4 +
            3];
          if (alpha >
            ALPHA_THRESHOLD) {
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
      const maxRowOccupancy = Math.max(...rowOccupancy);
      const minRowOccupancy = maxRowOccupancy *
        MIN_VALID_LINE_RATIO;
      for (let i = 0; i <
        rowOccupancy.length; i++) {
        if (rowOccupancy[i] <
          minRowOccupancy) {
          leftEdges[i] = null;
          rightEdges[i] = null;
        }
      }
      const horizontalIsRectangular = isMostlyRectangular(rowOccupancy.filter((value) => value >=
        minRowOccupancy));
      if (horizontalIsRectangular) {
        const columnOccupancy = new Array(visibleWidth).fill(0);
        for (let x = minX; x <= maxX; x++) {
          let count = 0;
          for (let y = minY; y <= maxY; y++) {
            const alpha = pixels[(y *
              canvas.width +
              x) *
              4 +
              3];
            if (alpha >
              ALPHA_THRESHOLD) {
              count++;
            }
          }
          columnOccupancy[x -
            minX] = count;
        }
        const maxColumnOccupancy = Math.max(...columnOccupancy);
        const run = findLargestRun(columnOccupancy, maxColumnOccupancy *
          BODY_OCCUPANCY_THRESHOLD);
        if (run) {
          const detectedWidth = run.end -
            run.start +
            1;
          if (detectedWidth >
            visibleWidth *
            0.45) {
            bodyLeft =
              minX +
              run.start;
            bodyRight =
              minX +
              run.end;
          }
        }
      }
      else {
        const jackFilterRadius = Math.max(4, Math.round(visibleHeight *
          JACK_FILTER_RADIUS_RATIO));
        const horizontalThreshold = Math.max(3, visibleWidth *
          JACK_PROTRUSION_RATIO);
        const cleanedLeft = removeLocalProtrusions(leftEdges, jackFilterRadius, horizontalThreshold, "min");
        const cleanedRight = removeLocalProtrusions(rightEdges, jackFilterRadius, horizontalThreshold, "max");
        const horizontalRadius = Math.max(2, Math.round(visibleHeight *
          EDGE_SMOOTH_RADIUS_RATIO));
        const smoothedLeft = smoothEdge(cleanedLeft, horizontalRadius);
        const smoothedRight = smoothEdge(cleanedRight, horizontalRadius);
        const validLeft = smoothedLeft.filter((value): value is number => value !==
          null);
        const validRight = smoothedRight.filter((value): value is number => value !==
          null);
        if (validLeft.length >
          0 &&
          validRight.length >
          0) {
          bodyLeft =
            Math.round(Math.min(...validLeft));
          bodyRight =
            Math.round(Math.max(...validRight));
        }
      }
    }
    if (detectVertical) {
      const topEdges: Array<number | null> = new Array(visibleWidth).fill(null);
      const bottomEdges: Array<number | null> = new Array(visibleWidth).fill(null);
      const columnOccupancy = new Array(visibleWidth).fill(0);
      for (let x = minX; x <= maxX; x++) {
        let first = -1;
        let last = -1;
        let count = 0;
        for (let y = minY; y <= maxY; y++) {
          const alpha = pixels[(y *
            canvas.width +
            x) *
            4 +
            3];
          if (alpha >
            ALPHA_THRESHOLD) {
            if (first === -1) {
              first = y;
            }
            last = y;
            count++;
          }
        }
        const columnIndex = x -
          minX;
        columnOccupancy[columnIndex] = count;
        if (first !== -1) {
          topEdges[columnIndex] = first;
          bottomEdges[columnIndex] = last;
        }
      }
      const maxColumnOccupancy = Math.max(...columnOccupancy);
      const minColumnOccupancy = maxColumnOccupancy *
        MIN_VALID_LINE_RATIO;
      for (let i = 0; i <
        columnOccupancy.length; i++) {
        if (columnOccupancy[i] <
          minColumnOccupancy) {
          topEdges[i] = null;
          bottomEdges[i] = null;
        }
      }
      const verticalIsRectangular = isMostlyRectangular(columnOccupancy.filter((value) => value >=
        minColumnOccupancy));
      if (verticalIsRectangular) {
        const rowOccupancy = new Array(visibleHeight).fill(0);
        for (let y = minY; y <= maxY; y++) {
          let count = 0;
          for (let x = minX; x <= maxX; x++) {
            const alpha = pixels[(y *
              canvas.width +
              x) *
              4 +
              3];
            if (alpha >
              ALPHA_THRESHOLD) {
              count++;
            }
          }
          rowOccupancy[y -
            minY] = count;
        }
        const maxRowOccupancy = Math.max(...rowOccupancy);
        const run = findLargestRun(rowOccupancy, maxRowOccupancy *
          BODY_OCCUPANCY_THRESHOLD);
        if (run) {
          const detectedHeight = run.end -
            run.start +
            1;
          if (detectedHeight >
            visibleHeight *
            0.45) {
            bodyTop =
              minY +
              run.start;
            bodyBottom =
              minY +
              run.end;
          }
        }
      }
      else {
        const jackFilterRadius = Math.max(4, Math.round(visibleWidth *
          JACK_FILTER_RADIUS_RATIO));
        const verticalThreshold = Math.max(3, visibleHeight *
          JACK_PROTRUSION_RATIO);
        const cleanedTop = removeLocalProtrusions(topEdges, jackFilterRadius, verticalThreshold, "min");
        const cleanedBottom = removeLocalProtrusions(bottomEdges, jackFilterRadius, verticalThreshold, "max");
        const verticalRadius = Math.max(2, Math.round(visibleWidth *
          EDGE_SMOOTH_RADIUS_RATIO));
        const smoothedTop = smoothEdge(cleanedTop, verticalRadius);
        const smoothedBottom = smoothEdge(cleanedBottom, verticalRadius);
        const validTop = smoothedTop.filter((value): value is number => value !==
          null);
        const validBottom = smoothedBottom.filter((value): value is number => value !==
          null);
        if (validTop.length >
          0 &&
          validBottom.length >
          0) {
          bodyTop =
            Math.round(Math.min(...validTop));
          bodyBottom =
            Math.round(Math.max(...validBottom));
        }
      }
    }
    const bodyWidth = bodyRight -
      bodyLeft +
      1;
    const bodyHeight = bodyBottom -
      bodyTop +
      1;
    if (bodyWidth <= 0 ||
      bodyHeight <= 0) {
      return null;
    }
    if (bodyWidth <
      visibleWidth *
      0.45 ||
      bodyHeight <
      visibleHeight *
      0.45) {
      const inverseScale = 1 /
        analysisScale;
      return {
        bodyLeft: minX *
          inverseScale,
        bodyTop: minY *
          inverseScale,
        bodyWidth: visibleWidth *
          inverseScale,
        bodyHeight: visibleHeight *
          inverseScale,
      };
    }
    const inverseScale = 1 /
      analysisScale;
    return {
      bodyLeft: bodyLeft *
        inverseScale,
      bodyTop: bodyTop *
        inverseScale,
      bodyWidth: bodyWidth *
        inverseScale,
      bodyHeight: bodyHeight *
        inverseScale,
    };
  }
  catch {
    return null;
  }
}
export default function ExportPanel({ isLightTheme, isMobile = false, boardPedals, selectedBoards = [], displaySizes, boardName, canvasBg, signalPath = [], zoom = 200, stageX, stageY, currentBackground, }: Props) {
  const language = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("myb_settings") || "{}")?.language || "en"
    : "en";
  const t = getTranslator(language);
  /* =========================================================
     STATE
     ========================================================= */
  const [downloadLoading, setDownloadLoading,] = useState(false);
  const [shareLoading, setShareLoading,] = useState(false);
  const [shareUrl, setShareUrl,] = useState<string | null>(null);
  const [copied, setCopied,] = useState(false);
  const [name, setName,] = useState(boardName ||
    "pedalboard");
  const [background, setBackground,] = useState<"transparent" | "white" | "current">("current");
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const previewRenderIdRef = useRef(0);
  /* =========================================================
     RENDER ITEMS
     ========================================================= */
  const getRenderItems = (): AnyRow[] => [
    ...(selectedBoards ||
      []).map((item: AnyRow) => ({
        ...item,
        kind: "board",
      })),
    ...(boardPedals ||
      []).map((item: AnyRow) => ({
        ...item,
        kind: "pedal",
      })),
  ].sort((a: AnyRow, b: AnyRow) => (Number(a.zIndex) || 0) -
    (Number(b.zIndex) || 0));
  /* =========================================================
     CUSTOM PEDAL
     ========================================================= */
  const drawCustomPedal = (ctx: CanvasRenderingContext2D, item: AnyRow, w: number, h: number, knobImg: HTMLImageElement, footswitchImg: HTMLImageElement, img?: HTMLImageElement | null) => {
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
    }
    else {
      ctx.fillStyle =
        item.color ||
        "#888";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    if (hasColor) {
      ctx.globalAlpha =
        0.7;
      ctx.fillStyle =
        item.color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.globalAlpha =
        1;
    }
    ctx.restore();
    const knobSize = 25;
    const footswitchSize = 18;
    const knobCount = Number(item.width) < 70
      ? 1
      : Number(item.width) <= 100
        ? 2
        : 3;
    const knobY = -h / 2 + 14;
    const spacing = w /
      (knobCount + 1);
    const spread = 1.25;
    for (let i = 0; i < knobCount; i++) {
      const offsetFromCenter = (i -
        (knobCount -
          1) /
        2) *
        spacing *
        spread;
      ctx.drawImage(knobImg, offsetFromCenter -
        knobSize / 2, knobY, knobSize, knobSize);
    }
    ctx.drawImage(footswitchImg, -footswitchSize /
      2, h / 2 - 30, footswitchSize, footswitchSize);
    if (item.name) {
      ctx.fillStyle =
        "#000000";
      ctx.strokeStyle =
        "#000000";
      ctx.lineWidth =
        0.5;
      ctx.font =
        "bold 8px Arial";
      ctx.textAlign =
        "center";
      ctx.textBaseline =
        "middle";
      ctx.strokeText(item.name.toUpperCase(), 0, 0);
      ctx.fillText(item.name.toUpperCase(), 0, 0);
    }
  };
  /* =========================================================
     DRAW ITEMS
     ========================================================= */
  const drawItems = async (ctx: CanvasRenderingContext2D, minX: number, minY: number, loadImage: (src: string) => Promise<HTMLImageElement>) => {
    let customAssets: Promise<HTMLImageElement[]> | null = null;
    for (const item of getRenderItems()) {
      const size = displaySizes[Number(item.instanceId)];
      if (!size) {
        continue;
      }
      const img = await loadExportItemImage(item, loadImage);
      const w = size.w;
      const h = size.h;
      const drawX = item.x - minX;
      const drawY = item.y - minY;
      const rotation = ((item.rotation ||
        0) *
        Math.PI) /
        180;
      ctx.save();
      try {
        ctx.translate(drawX, drawY);
        ctx.rotate(rotation);
        if (item.kind ===
          "board") {
          if (img) {
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
          }
          continue;
        }
        if (item.slug ===
          "custom") {
          customAssets ??= Promise.all([loadImage("/images/knob.webp"), loadImage("/images/footswitch.webp")]);
          const [knobImg, footswitchImg] = await customAssets;
          drawCustomPedal(ctx, item, w, h, knobImg, footswitchImg, img);
        }
        else if (img) {
          // Match PedalImage.tsx: the physical dimensions apply to the
          // detected enclosure, not necessarily to the whole PNG (which
          // can contain transparent margins, knobs and protruding jacks).
          const bodyW = Number(item.width) || 80;
          const bodyH = Number(item.depth) || 120;
          const useEnclosureSizing = item.slug === "custom-upload" || ENCLOSURE_SIZING_BRANDS.has(String(item.brand || "").trim());
          let placement = { x: -bodyW / 2, y: -bodyH / 2, width: bodyW, height: bodyH };
          if (useEnclosureSizing) {
            const ratio = bodyH / bodyW;
            const miniRectMode = bodyW <= MINI_RECT_MAX_WIDTH &&
              bodyH <= MINI_RECT_MAX_DEPTH && ratio >= MINI_RECT_MIN_RATIO;
            const treadleMode = ratio >= TREADLE_DIMENSION_RATIO &&
              bodyW >= TREADLE_MIN_WIDTH && bodyH >= TREADLE_MIN_DEPTH;
            const standardRectMode = !miniRectMode && !treadleMode;
            const bodyAspect = Math.max(bodyW, bodyH) /
              Math.max(1, Math.min(bodyW, bodyH));
            const roundCandidateMode = bodyAspect <= 1.08;
            const jacks = String(item.jacksLocation || item.jacks || "").toLowerCase();
            const hasTop = jacks.includes("top");
            const hasBottom = jacks.includes("down") || jacks.includes("bottom");
            const enclosure = detectEnclosure(img, true, true, treadleMode, miniRectMode, standardRectMode, hasTop, hasBottom, roundCandidateMode);
            if (enclosure) {
              const scaleX = bodyW / enclosure.bodyWidth;
              const scaleY = bodyH / enclosure.bodyHeight;
              placement = {
                x: -(enclosure.bodyLeft + enclosure.bodyWidth / 2) * scaleX,
                y: -(enclosure.bodyTop + enclosure.bodyHeight / 2) * scaleY,
                width: img.naturalWidth * scaleX,
                height: img.naturalHeight * scaleY,
              };
            }
          }
          ctx.drawImage(img, placement.x, placement.y, placement.width, placement.height);
        }
      } finally { ctx.restore(); }
    }
  };
  /* =========================================================
     BOUNDS
     ========================================================= */
  const getExportBounds = () => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    getRenderItems().forEach((item) => {
      const size = displaySizes[Number(item.instanceId)];
      if (!size) {
        return;
      }
      const w = size.w;
      const h = size.h;
      const rotation = ((Number(item.rotation) || 0) *
        Math.PI) /
        180;
      const corners = [
        {
          x: -w / 2,
          y: -h / 2,
        },
        {
          x: w / 2,
          y: -h / 2,
        },
        {
          x: w / 2,
          y: h / 2,
        },
        {
          x: -w / 2,
          y: h / 2,
        },
      ];
      corners.forEach((corner) => {
        const rotatedX = corner.x *
          Math.cos(rotation) -
          corner.y *
          Math.sin(rotation);
        const rotatedY = corner.x *
          Math.sin(rotation) +
          corner.y *
          Math.cos(rotation);
        const worldX = item.x +
          rotatedX;
        const worldY = item.y +
          rotatedY;
        minX =
          Math.min(minX, worldX);
        minY =
          Math.min(minY, worldY);
        maxX =
          Math.max(maxX, worldX);
        maxY =
          Math.max(maxY, worldY);
      });
    });
    const PADDING = 20;
    minX -=
      PADDING;
    minY -=
      PADDING;
    maxX +=
      PADDING;
    maxY +=
      PADDING;
    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  /* =========================================================
     BACKGROUND
     ========================================================= */
  const drawBackground = async (ctx: CanvasRenderingContext2D, width: number, height: number, loadImage: (src: string) => Promise<HTMLImageElement>, preview = false) => {
    if (background ===
      "transparent" &&
      preview) {
      const CHECKER = 10;
      for (let y = 0; y < height; y += CHECKER) {
        for (let x = 0; x < width; x += CHECKER) {
          ctx.fillStyle =
            (Math.floor(x / CHECKER) +
              Math.floor(y /
                CHECKER)) %
              2 ===
              0
              ? "#5f6068"
              : "#777982";
          ctx.fillRect(x, y, CHECKER, CHECKER);
        }
      }
    }
    if (background ===
      "white") {
      ctx.fillStyle =
        "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    if (background ===
      "current" &&
      currentBackground) {
      if (currentBackground.type ===
        "css") {
        const color = getComputedStyle(document.documentElement)
          .getPropertyValue(document.documentElement.classList.contains("light")
            ? "--zinc-200"
            : "--zinc-600")
          .trim();
        ctx.fillStyle =
          color;
        ctx.fillRect(0, 0, width, height);
      }
      if (currentBackground.type ===
        "image" &&
        currentBackground.src) {
        const bgImg = await loadImage(currentBackground.src);
        ctx.drawImage(bgImg, 0, 0, width, height);
      }
    }
  };
  /* =========================================================
     PREVIEW
     ========================================================= */
  const renderPreview = async () => {
    const hasItems = !!boardPedals?.length ||
      !!selectedBoards?.length;
    if (hasItems &&
      (!displaySizes ||
        Object.keys(displaySizes).length ===
        0)) {
      return;
    }
    const renderId = ++previewRenderIdRef.current;
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin =
          "anonymous";
        img.onload =
          () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      if (!hasItems) {
        const visibleCanvas = previewRef.current;
        if (!visibleCanvas) {
          return;
        }
        const visibleCtx = visibleCanvas.getContext("2d");
        if (!visibleCtx) {
          return;
        }
        const width = 240;
        const height = 135;
        const SCALE = 3;
        visibleCanvas.width =
          width *
          SCALE;
        visibleCanvas.height =
          height *
          SCALE;
        visibleCtx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
        visibleCtx.clearRect(0, 0, width, height);
        visibleCtx.imageSmoothingEnabled =
          true;
        await drawBackground(visibleCtx, width, height, loadImage, true);
        return;
      }
      const { minX, minY, width, height, } = getExportBounds();
      if (!isFinite(width) ||
        !isFinite(height)) {
        return;
      }
      const visibleCanvas = previewRef.current;
      if (!visibleCanvas) {
        return;
      }
      const visibleCtx = visibleCanvas.getContext("2d");
      if (!visibleCtx) {
        return;
      }
      const SCALE = 6;
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) {
        return;
      }
      tempCanvas.width =
        width *
        SCALE;
      tempCanvas.height =
        height *
        SCALE;
      tempCtx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      tempCtx.clearRect(0, 0, width, height);
      tempCtx.imageSmoothingEnabled =
        true;
      await drawBackground(tempCtx, width, height, loadImage, true);
      if (renderId !==
        previewRenderIdRef.current) {
        return;
      }
      await drawItems(tempCtx, minX, minY, loadImage);
      if (renderId !==
        previewRenderIdRef.current) {
        return;
      }
      visibleCanvas.width =
        tempCanvas.width;
      visibleCanvas.height =
        tempCanvas.height;
      visibleCtx.setTransform(1, 0, 0, 1, 0, 0);
      visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);
      visibleCtx.drawImage(tempCanvas, 0, 0);
    }
    catch (e) {
      console.error(e);
    }
  };
  /* =========================================================
     DOWNLOAD IMAGE
     ========================================================= */
  const exportImage = async () => {
    if (downloadLoading) {
      return;
    }
    setDownloadLoading(true);
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin =
          "anonymous";
        img.onload =
          () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      const { minX, minY, width, height, } = getExportBounds();
      if (!isFinite(width) ||
        !isFinite(height)) {
        setDownloadLoading(false);
        return;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setDownloadLoading(false);
        return;
      }
      const SCALE = 6;
      canvas.width =
        width *
        SCALE;
      canvas.height =
        height *
        SCALE;
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      ctx.imageSmoothingEnabled =
        true;
      await drawBackground(ctx, width, height, loadImage, false);
      await drawItems(ctx, minX, minY, loadImage);
      canvas.toBlob((blob) => {
        if (!blob) {
          setDownloadLoading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href =
          url;
        link.download =
          background ===
            "white"
            ? `${name}.jpg`
            : `${name}.png`;
        link.click();
        URL.revokeObjectURL(url);
        window.setTimeout(() => {
          setDownloadLoading(false);
        }, 300);
      }, background ===
        "white"
        ? "image/jpeg"
        : "image/png", 0.95);
    }
    catch (e) {
      console.error(e);
      setDownloadLoading(false);
    }
  };
  /* =========================================================
     CREATE SHARE LINK
     ========================================================= */
  const createShareLink = async () => {
    if (shareLoading) {
      return;
    }
    setShareLoading(true);
    try {
      const id = crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 12);
      const selectedBackgroundSrc = currentBackground?.type ===
        "image"
        ? currentBackground.src ||
        null
        : null;
      const snapshot = {
        version: 1,
        project: {
          name: name.trim() ||
            "My Pedalboard",
          boardPedals,
          selectedBoards,
          signalPath,
          zoom,
          stageX: typeof stageX ===
            "number"
            ? stageX
            : 0,
          stageY: typeof stageY ===
            "number"
            ? stageY
            : 0,
        },
        displaySizes,
        appearance: {
          canvasBg,
          selectedBackgroundSrc,
        },
      };
      const { error: insertError, } = await supabase
        .from("shared_boards")
        .insert({
          id,
          name: name.trim() ||
            "My Pedalboard",
          data: snapshot,
        });
      if (insertError) {
        throw insertError;
      }
      const url = `${window.location.origin}/board/${id}`;
      setShareUrl(url);
    }
    catch (err) {
      console.error("Error creating shared board:", err);
    }
    finally {
      setShareLoading(false);
    }
  };
  /* =========================================================
     COPY SHARE LINK
     ========================================================= */
  const copyShareLink = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    }
    catch (err) {
      console.error("Unable to copy link:", err);
    }
  };
  /* =========================================================
     AUTO PREVIEW
     ========================================================= */
  useEffect(() => {
    renderPreview();
  }, [
    background,
    boardPedals,
    selectedBoards,
    displaySizes,
    currentBackground,
    isLightTheme,
  ]);
  /* =========================================================
     UI
     ========================================================= */
  return (<div ref={containerRef} className={isMobile
    ? "w-full min-h-full bg-zinc-800 border-0 rounded-none shadow-none p-6 flex flex-col gap-6"
    : "w-full bg-transparent border-0 rounded-none shadow-none p-0 flex flex-col gap-6"}>
    {/* TITLE */}

    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
      <Upload size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />

      {t("export.title")}
    </div>

    {/* NAME */}

    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.name")}
      </label>

      <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="
            h-9
            px-3
            rounded-md
            bg-zinc-950
            border
            border-zinc-700
            text-[12px]
            font-mono
            outline-none
            focus:border-blue-500
          "/>
    </div>

    {/* PREVIEW */}

    <div className="flex flex-col gap-2 -mt-2">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.preview")}
      </label>

      <div className="w-full overflow-hidden flex justify-center">
        <canvas ref={previewRef} className={isMobile
          ? "block w-full h-auto rounded-md"
          : "block max-w-full max-h-40 rounded-md"} />
      </div>
    </div>

    {/* DOWNLOAD */}

    <div className="flex flex-col gap-3">
      <label className="text-[10px] uppercase tracking-wider font-bold">
        {t("export.downloadTitle")}
      </label>

      <div className="flex flex-col gap-1 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={background ===
            "current"} onChange={() => setBackground("current")} />

          {t("export.canvas")}
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={background ===
            "transparent"} onChange={() => setBackground("transparent")} />

          {t("export.transparent")}
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={background ===
            "white"} onChange={() => setBackground("white")} />

          {t("export.white")}
        </label>
      </div>

      <button type="button" onClick={exportImage} disabled={downloadLoading} className="
            w-full
            h-[35px]
            px-3
            rounded-lg
            border-0
            bg-blue-600
            !text-white
            text-[10px]
            font-black
            uppercase
            flex
            items-center
            justify-center
            gap-2
            transition-colors
            hover:bg-blue-500
            disabled:opacity-50
            disabled:cursor-not-allowed
          ">
        {downloadLoading ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<>
          <Download size={15} />

          {t("export.download")}
        </>)}
      </button>
    </div>

    {/* SHARE */}

    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider font-bold">
          {t("export.shareTitle")}
        </label>

        <p className="text-[11px] leading-relaxed text-zinc-400 m-0">
          {t("export.shareDescription")}
        </p>
      </div>

      {!shareUrl ? (<>
        <button type="button" onClick={createShareLink} disabled={shareLoading} className="
                w-full
                h-[35px]
                px-3
                rounded-lg
                border-0
                bg-blue-600
                !text-white
                text-[10px]
                font-black
                uppercase
                flex
                items-center
                justify-center
                gap-2
                transition-colors
                hover:bg-blue-500
                disabled:opacity-50
                disabled:cursor-not-allowed
              ">
          {shareLoading ? (<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<>
            <Share2 size={15} />

            {t("export.createLink")}
          </>)}
        </button>
      </>) : (<>
        {/* SHARE LINK */}

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="
                    min-w-0
                    flex-1
                    h-9
                    px-3
                    rounded-md
                    bg-zinc-950
                    border
                    border-zinc-700
                    flex
                    items-center
                    text-[11px]
                    font-mono
                    overflow-hidden
                  ">
              <span className="truncate">
                {shareUrl}
              </span>
            </div>

            <button type="button" onClick={copyShareLink} className="
                    w-9
                    h-9
                    rounded-md
                    bg-zinc-950
                    border
                    border-zinc-700
                    flex
                    items-center
                    justify-center
                    hover:border-blue-500
                  ">
              {copied ? (<Check size={15} className="text-green-500" />) : (<Copy size={15} />)}
            </button>
          </div>
        </div>

        <div className="text-[11px] leading-relaxed text-zinc-400">
          {t("export.ready")}
        </div>
      </>)}
    </div>
  </div>);
}
