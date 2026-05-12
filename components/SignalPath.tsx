"use client";

import React, { useMemo, useState } from "react";
import { Circle, Line, Group } from "react-konva";

type AnyRow = Record<string, any>;

export type SignalPoint = {
  id: number;
  kind: "input" | "output";
};

export type SignalConnection = {
  id: string;
  from: number;
  to: number;
  fromKind?: "input" | "output";
  toKind?: "input" | "output";
};

type Props = {
  mode: "cables" | "points";
  pedals: AnyRow[];
  displaySizes: Record<number, { w: number; h: number }>;
  signalPath: SignalConnection[];
  enabled: boolean;
  pendingPoint: SignalPoint | null;
  onPointClick: (point: SignalPoint) => void;
  onRemoveConnection: (id: string) => void;
  isDragging?: boolean;
};

const CABLE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#db2777",
  "#0ea5e9",
];

const STUB = 10;
const BOX_PADDING = 10;
const LANE_GAP = 14;
const PATH_OFFSET_STEP = 12;
const CABLE_CLEARANCE = 18;

type Point = { x: number; y: number };
type Box = { id: number; minX: number; minY: number; maxX: number; maxY: number };
type Segment = {
  a: Point;
  b: Point;
};

function pointKey(point: SignalPoint) {
  return `${point.id}:${point.kind}`;
}

function isTopMounted(p: AnyRow) {
  const jacks = String(p.jacks || "").toLowerCase();
  return jacks.includes("top") && !jacks.includes("left") && !jacks.includes("right");
}

function rotatePoint(x: number, y: number, rotation = 0): Point {
  const angle = (rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function getLocalJackPoint(
  size: { w: number; h: number },
  topMounted: boolean,
  kind: "input" | "output"
): Point {
  if (topMounted) {
    return {
      x: kind === "input" ? size.w * 0.22 : -size.w * 0.22,
      y: -size.h / 2,
    };
  }

  return {
    x: kind === "input" ? size.w / 2 : -size.w / 2,
    y: 0,
  };
}

function getJackPoint(
  p: AnyRow,
  size: { w: number; h: number },
  kind: "input" | "output"
): Point {
  const topMounted = isTopMounted(p);
  const local = getLocalJackPoint(size, topMounted, kind);
  const rotated = rotatePoint(local.x, local.y, p.rotation || 0);

  return {
    x: p.x + rotated.x,
    y: p.y + rotated.y,
  };
}

function getJackDirection(p: AnyRow, kind: "input" | "output"): Point {
  const topMounted = isTopMounted(p);

  if (topMounted) return rotatePoint(0, -1, p.rotation || 0);

  return rotatePoint(kind === "input" ? 1 : -1, 0, p.rotation || 0);
}

function getStubPoint(
  p: AnyRow,
  size: { w: number; h: number },
  kind: "input" | "output"
): Point {
  const jack = getJackPoint(p, size, kind);
  const dir = getJackDirection(p, kind);

  return {
    x: jack.x + dir.x * STUB,
    y: jack.y + dir.y * STUB,
  };
}

function getPedalBox(
  p: AnyRow,
  size: { w: number; h: number },
  padding = BOX_PADDING
): Box {
  const rotation = ((p.rotation || 0) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  const rotatedW = size.w * cos + size.h * sin;
  const rotatedH = size.w * sin + size.h * cos;

  return {
    id: p.instanceId,
minX: p.x - rotatedW / 2 - padding,
maxX: p.x + rotatedW / 2 + padding,
minY: p.y - rotatedH / 2 - padding,
maxY: p.y + rotatedH / 2 + padding,
  };
}

function segmentHitsBox(a: Point, b: Point, box: Box) {
  const isVertical = Math.abs(a.x - b.x) < 0.001;
  const isHorizontal = Math.abs(a.y - b.y) < 0.001;

  if (!isVertical && !isHorizontal) return false;

  if (isVertical) {
    const x = a.x;
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);

    return x >= box.minX && x <= box.maxX && maxY >= box.minY && minY <= box.maxY;
  }

  const y = a.y;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);

  return y >= box.minY && y <= box.maxY && maxX >= box.minX && minX <= box.maxX;
}

function segmentIsClear(a: Point, b: Point, boxes: Box[]) {
  return !boxes.some((box) => segmentHitsBox(a, b, box));
}

function rangesOverlap(a1: number, a2: number, b1: number, b2: number) {
  const minA = Math.min(a1, a2);
  const maxA = Math.max(a1, a2);
  const minB = Math.min(b1, b2);
  const maxB = Math.max(b1, b2);

  return maxA >= minB && maxB >= minA;
}

function segmentConflictsWithUsed(a: Point, b: Point, usedSegments: Segment[]) {
  const isVertical = Math.abs(a.x - b.x) < 0.001;
  const isHorizontal = Math.abs(a.y - b.y) < 0.001;

  return usedSegments.some((seg) => {
    const otherVertical = Math.abs(seg.a.x - seg.b.x) < 0.001;
    const otherHorizontal = Math.abs(seg.a.y - seg.b.y) < 0.001;

    // croisement perpendiculaire autorisé
    if (isVertical !== otherVertical) return false;
    if (isHorizontal !== otherHorizontal) return false;

    // verticales parallèles trop proches
    if (isVertical && otherVertical) {
      return (
        Math.abs(a.x - seg.a.x) < CABLE_CLEARANCE &&
        rangesOverlap(a.y, b.y, seg.a.y, seg.b.y)
      );
    }

    // horizontales parallèles trop proches
    if (isHorizontal && otherHorizontal) {
      return (
        Math.abs(a.y - seg.a.y) < CABLE_CLEARANCE &&
        rangesOverlap(a.x, b.x, seg.a.x, seg.b.x)
      );
    }

    return false;
  });
}

function pointsToSegments(points: Point[]) {
  const segments: Segment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      a: points[i],
      b: points[i + 1],
    });
  }

  return segments;
}

function distance(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function cleanPath(points: Point[]) {
  const cleaned: Point[] = [];

  points.forEach((p) => {
    const last = cleaned[cleaned.length - 1];

    if (!last || Math.abs(last.x - p.x) > 0.001 || Math.abs(last.y - p.y) > 0.001) {
      cleaned.push(p);
    }
  });

  return cleaned;
}

function pointId(p: Point) {
  return `${Math.round(p.x * 1000) / 1000}:${Math.round(p.y * 1000) / 1000}`;
}

function firstMoveIsAllowed(fromStub: Point, next: Point, fromDir: Point) {
  const move = {
    x: next.x - fromStub.x,
    y: next.y - fromStub.y,
  };

  const dot = move.x * fromDir.x + move.y * fromDir.y;

  return dot >= -0.001;
}

function makeOrthogonalPath(
  from: Point,
  fromStub: Point,
  toStub: Point,
  to: Point,
  fromDir: Point,
  boxes: Box[],
  offset: number,
  usedSegments: Segment[]
) {

  const xs = new Set<number>();
  const ys = new Set<number>();

  xs.add(fromStub.x);
  xs.add(toStub.x);

  ys.add(fromStub.y);
  ys.add(toStub.y);

  boxes.forEach((b) => {
  xs.add(b.minX - 6);
  xs.add(b.maxX + 6);
  xs.add(b.minX - 18);
  xs.add(b.maxX + 18);

  ys.add(b.minY - 6);
  ys.add(b.maxY + 6);
  ys.add(b.minY - 18);
  ys.add(b.maxY + 18);

  xs.add(b.minX - 6 - offset);
  xs.add(b.maxX + 6 + offset);
  xs.add(b.minX - 18 - offset);
  xs.add(b.maxX + 18 + offset);

  ys.add(b.minY - 6 - offset);
  ys.add(b.maxY + 6 + offset);
  ys.add(b.minY - 18 - offset);
  ys.add(b.maxY + 18 + offset);
  });

    usedSegments.forEach((seg) => {
    const isVertical = Math.abs(seg.a.x - seg.b.x) < 0.001;
    const isHorizontal = Math.abs(seg.a.y - seg.b.y) < 0.001;

    if (isHorizontal) {
      ys.add(seg.a.y - CABLE_CLEARANCE);
      ys.add(seg.a.y + CABLE_CLEARANCE);
    }

    if (isVertical) {
      xs.add(seg.a.x - CABLE_CLEARANCE);
      xs.add(seg.a.x + CABLE_CLEARANCE);
    }
  });

  const xList = [...xs].sort((a, b) => a - b);
  const yList = [...ys].sort((a, b) => a - b);

  const nodes: Point[] = [];

  xList.forEach((x) => {
    yList.forEach((y) => {
      nodes.push({ x, y });
    });
  });

  const start = fromStub;
  const end = toStub;

  nodes.push(start);
  nodes.push(end);

  const allNodes = nodes;
  const startKey = pointId(start);
  const endKey = pointId(end);

  const open = new Set<string>([startKey]);
  const cameFrom = new Map<string, string>();
  const pointMap = new Map<string, Point>();

  allNodes.forEach((p) => pointMap.set(pointId(p), p));

  const g = new Map<string, number>();
  g.set(startKey, 0);

  while (open.size > 0) {
    const currentKey = [...open].sort((a, b) => {
      const pa = pointMap.get(a)!;
      const pb = pointMap.get(b)!;

      return (g.get(a) || 0) + distance(pa, end) - ((g.get(b) || 0) + distance(pb, end));
    })[0];

    if (currentKey === endKey) break;

    open.delete(currentKey);

    const current = pointMap.get(currentKey)!;

    const neighbors = allNodes.filter((n) => {
      if (pointId(n) === currentKey) return false;

      const sameX = Math.abs(n.x - current.x) < 0.001;
      const sameY = Math.abs(n.y - current.y) < 0.001;

      if (!sameX && !sameY) return false;

      if (currentKey === startKey && !firstMoveIsAllowed(start, n, fromDir)) {
        return false;
      }

      return (
  segmentIsClear(current, n, boxes) &&
  !segmentConflictsWithUsed(current, n, usedSegments)
);
    });

    neighbors.forEach((neighbor) => {
      const neighborKey = pointId(neighbor);
      const tentativeG = (g.get(currentKey) || 0) + distance(current, neighbor);

      if (tentativeG < (g.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentKey);
        g.set(neighborKey, tentativeG);
        open.add(neighborKey);
      }
    });
  }

  const path: Point[] = [];

  if (cameFrom.has(endKey)) {
    let currentKey = endKey;

    while (currentKey) {
      path.unshift(pointMap.get(currentKey)!);
      const previous = cameFrom.get(currentKey);
      if (!previous) break;
      currentKey = previous;
    }
  }

const finalPath =
  path.length > 0
    ? cleanPath([
        from,
        fromStub,
        ...path,
        toStub,
        to,
      ])
: cleanPath([
    from,
    fromStub,
    {
      x: fromStub.x,
      y: Math.min(fromStub.y, toStub.y) - CABLE_CLEARANCE - Math.abs(offset),
    },
    {
      x: toStub.x,
      y: Math.min(fromStub.y, toStub.y) - CABLE_CLEARANCE - Math.abs(offset),
    },
    toStub,
    to,
  ]);

  return finalPath;
}

export default function SignalPath({
  mode,
  pedals,
  displaySizes,
  signalPath,
  enabled,
  pendingPoint,
  onPointClick,
  onRemoveConnection,
  isDragging = false,
}: Props) {


  const [deletePendingPoint, setDeletePendingPoint] = useState<SignalPoint | null>(null);

  const visiblePedals = useMemo(() => {
    return pedals.filter((p) => p.type !== "power" && displaySizes[p.instanceId]);
  }, [pedals, displaySizes]);

const allObstacleBoxes = useMemo(() => {
  return visiblePedals.map((p) =>
    getPedalBox(p, displaySizes[p.instanceId], BOX_PADDING)
  );
}, [visiblePedals, displaySizes]);

  const occupiedMap = useMemo(() => {
    const map = new Map<string, SignalConnection>();

    signalPath.forEach((connection) => {
      const fromKind = connection.fromKind || "output";
      const toKind = connection.toKind || "input";

      map.set(pointKey({ id: connection.from, kind: fromKind }), connection);
      map.set(pointKey({ id: connection.to, kind: toKind }), connection);
    });

    return map;
  }, [signalPath]);

  const handlePointClick = (point: SignalPoint) => {
    if (!enabled) return;

    const key = pointKey(point);
    const existingConnection = occupiedMap.get(key);

    if (existingConnection) {
      if (!deletePendingPoint) {
        setDeletePendingPoint(point);
        return;
      }

      const pendingConnection = occupiedMap.get(pointKey(deletePendingPoint));

      if (
        pendingConnection &&
        pendingConnection.id === existingConnection.id &&
        pointKey(deletePendingPoint) !== key
      ) {
        onRemoveConnection(existingConnection.id);
        setDeletePendingPoint(null);
        return;
      }

      if (pointKey(deletePendingPoint) === key) {
        setDeletePendingPoint(null);
        return;
      }

      setDeletePendingPoint(point);
      return;
    }

    setDeletePendingPoint(null);
    onPointClick(point);
  };

if (mode === "cables") {
  if (isDragging) return null;

  const usedSegments: Segment[] = [];

  return (
      <>
        {signalPath.map((connection, index) => {
          const fromPedal = pedals.find((p) => p.instanceId === connection.from);
          const toPedal = pedals.find((p) => p.instanceId === connection.to);

          if (!fromPedal || !toPedal) return null;

          const fromSize = displaySizes[fromPedal.instanceId];
          const toSize = displaySizes[toPedal.instanceId];

          if (!fromSize || !toSize) return null;

          const fromKind = connection.fromKind || "output";
          const toKind = connection.toKind || "input";

          const from = getJackPoint(fromPedal, fromSize, fromKind);
          const to = getJackPoint(toPedal, toSize, toKind);

          const fromStub = getStubPoint(fromPedal, fromSize, fromKind);
          const toStub = getStubPoint(toPedal, toSize, toKind);
          const fromDir = getJackDirection(fromPedal, fromKind);

const obstacleBoxes = visiblePedals.map((p) => {
  const isEndpoint =
    p.instanceId === fromPedal.instanceId ||
    p.instanceId === toPedal.instanceId;

  return getPedalBox(
    p,
    displaySizes[p.instanceId],
    isEndpoint ? 2 : 8
  );
});

const laneOffset = ((index % 7) - 3) * PATH_OFFSET_STEP;

const pathPoints = makeOrthogonalPath(
  from,
  fromStub,
  toStub,
  to,
  fromDir,
  obstacleBoxes,
  laneOffset,
  usedSegments
);

usedSegments.push(...pointsToSegments(pathPoints));

          return (
            <Line
              key={connection.id}
              points={pathPoints.flatMap((p) => [p.x, p.y])}
              stroke={CABLE_COLORS[index % CABLE_COLORS.length]}
              strokeWidth={1.5}
              opacity={0.95}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={16}
              listening={enabled}
              onClick={(e) => {
                e.cancelBubble = true;
                onRemoveConnection(connection.id);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                onRemoveConnection(connection.id);
              }}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      {enabled &&
        visiblePedals.map((p) => {
          const size = displaySizes[p.instanceId];

          const input = getJackPoint(p, size, "input");
          const output = getJackPoint(p, size, "output");

          const outputPoint: SignalPoint = { id: p.instanceId, kind: "output" };
          const inputPoint: SignalPoint = { id: p.instanceId, kind: "input" };

          const outputTaken = occupiedMap.has(pointKey(outputPoint));
          const inputTaken = occupiedMap.has(pointKey(inputPoint));

          const isOutputPending =
            pendingPoint?.id === p.instanceId && pendingPoint?.kind === "output";

          const isInputPending =
            pendingPoint?.id === p.instanceId && pendingPoint?.kind === "input";

          const isOutputDeletePending =
            deletePendingPoint?.id === p.instanceId &&
            deletePendingPoint?.kind === "output";

          const isInputDeletePending =
            deletePendingPoint?.id === p.instanceId &&
            deletePendingPoint?.kind === "input";

          return (
            <Group key={`signal-points-${p.instanceId}`}>
              <Circle
                x={output.x}
                y={output.y}
                radius={7}
                fill={
                  isOutputPending || isOutputDeletePending
                    ? "#16a34a"
                    : outputTaken
                    ? "#1d4ed8"
                    : "#2563eb"
                }
                stroke="white"
                strokeWidth={1.5}
                shadowBlur={0}
                opacity={outputTaken ? 0.85 : 1}
                listening
                onClick={(e) => {
                  e.cancelBubble = true;
                  handlePointClick(outputPoint);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  handlePointClick(outputPoint);
                }}
              />

              <Circle
                x={input.x}
                y={input.y}
                radius={7}
                fill={
                  isInputPending || isInputDeletePending
                    ? "#16a34a"
                    : inputTaken
                    ? "#1d4ed8"
                    : "#2563eb"
                }
                stroke="white"
                strokeWidth={2}
                shadowBlur={0}
                opacity={inputTaken ? 0.85 : 1}
                listening
                onClick={(e) => {
                  e.cancelBubble = true;
                  handlePointClick(inputPoint);
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  handlePointClick(inputPoint);
                }}
              />
            </Group>
          );
        })}
    </>
  );
}