
"use client";

import { useMemo, useEffect, useRef } from "react";
import type Konva from "konva";

import { Group, Path } from "react-konva";

import {
  routeSignalCable,
  roundedCablePath,
  cableSegments,
  type CableSegment,
} from "@/utils/SignalCableRouting";

import {
  getSignalJackPositions,
} from "@/utils/SignalJackPositions";

/* =========================================================
   TYPES
   ========================================================= */

type AnyRow = Record<string, any>;

type Size = {
  w: number;
  h: number;
};

type Props = {
  pedals: AnyRow[];
  displaySizes: Record<number, Size>;
};

type ResolvedConnector =
  ReturnType<typeof getSignalJackPositions>[number];

type ConnectorPair = {
  from: ResolvedConnector;
  to: ResolvedConnector;
};

const BOX_PADDING = 16;
const CABLE_COLOR = "#3288ff";
const CABLE_WIDTH = 1.8;
const CORNER_RADIUS = 5;

/* =========================================================
   PEDAL OBSTACLES
   ========================================================= */

function getPedalBox(
  pedal: AnyRow,
  size: Size
) {
  const rotation =
    ((Number(pedal.rotation) || 0) * Math.PI) / 180;

  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));

  const rotatedW =
    size.w * cos + size.h * sin;

  const rotatedH =
    size.w * sin + size.h * cos;

  return {
    id: pedal.instanceId,

    minX:
      Number(pedal.x) -
      rotatedW / 2 -
      BOX_PADDING,

    maxX:
      Number(pedal.x) +
      rotatedW / 2 +
      BOX_PADDING,

    minY:
      Number(pedal.y) -
      rotatedH / 2 -
      BOX_PADDING,

    maxY:
      Number(pedal.y) +
      rotatedH / 2 +
      BOX_PADDING,
  };
}

/* =========================================================
   AUDIO CONNECTION PAIRING
   ========================================================= */

function getConnectorPairs(
  outputs: ResolvedConnector[],
  inputs: ResolvedConnector[]
): ConnectorPair[] {
  const outMono = outputs.find(
    item => item.connector.channel === "mono"
  );

  const inMono = inputs.find(
    item => item.connector.channel === "mono"
  );

  const outLeft = outputs.find(
    item => item.connector.channel === "L"
  );

  const outRight = outputs.find(
    item => item.connector.channel === "R"
  );

  const inLeft = inputs.find(
    item => item.connector.channel === "L"
  );

  const inRight = inputs.find(
    item => item.connector.channel === "R"
  );

  const outStereo = outputs.find(
    item => item.connector.channel === "stereo"
  );

  const inStereo = inputs.find(
    item => item.connector.channel === "stereo"
  );

  /* TWO SEPARATE STEREO JACKS */

  if (
    outLeft &&
    outRight &&
    inLeft &&
    inRight
  ) {
    return [
      {
        from: outLeft,
        to: inLeft,
      },
      {
        from: outRight,
        to: inRight,
      },
    ];
  }

  /* SINGLE STEREO SOCKET */

  if (outStereo && inStereo) {
    return [
      {
        from: outStereo,
        to: inStereo,
      },
    ];
  }

  /* MONO CONNECTION */

  const from = outMono ?? outLeft;
  const to = inMono ?? inLeft;

  if (from && to) {
    return [
      {
        from,
        to,
      },
    ];
  }

  return [];
}

/* =========================================================
   AUTOMATIC SIGNAL CABLES
   ========================================================= */

export function AutomaticSignalCables({
  pedals,
  displaySizes,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);

  /* =====================================================
     COMPUTE CABLE ROUTES
     ===================================================== */

  const routes = useMemo(() => {
    const boxes = pedals.flatMap(pedal => {
      const size =
        displaySizes[pedal.instanceId];

      if (!size) return [];

      return [
        getPedalBox(pedal, size),
      ];
    });

    const used: CableSegment[] = [];

    const result: {
      id: string;
      data: string;
    }[] = [];

    for (
      let index = 1;
      index < pedals.length;
      index++
    ) {
      const previous = pedals[index - 1];
      const current = pedals[index];

      const fromSize =
        displaySizes[previous.instanceId];

      const toSize =
        displaySizes[current.instanceId];

      if (!fromSize || !toSize) {
        continue;
      }

      const outputs = getSignalJackPositions(
        previous,
        fromSize,
        "output"
      );

      const inputs = getSignalJackPositions(
        current,
        toSize,
        "input"
      );

      const pairs = getConnectorPairs(
        outputs,
        inputs
      );

      for (const pair of pairs) {
        const points = routeSignalCable(
          pair.from.jack,
          pair.to.jack,
          boxes,
          used
        );

        if (!points) {
          continue;
        }

        used.push(
          ...cableSegments(points)
        );

        result.push({
          id: [
            previous.instanceId,
            pair.from.connector.id,
            current.instanceId,
            pair.to.connector.id,
          ].join(":"),

          data: roundedCablePath(
            points,
            CORNER_RADIUS
          ),
        });
      }
    }

    return result;
  }, [pedals, displaySizes]);

  /* =====================================================
     SIGNAL FLOW ANIMATION
     ===================================================== */

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      return;
    }

    let frame = 0;
    let start: number | undefined;
    let last = 0;

    const tick = (now: number) => {
      start ??= now;

      if (now - last >= 32) {
        last = now;

        const nodes =
          groupRef.current?.find<Konva.Path>(
            ".signal-flow"
          ) ?? [];

        let distance = 0;

        for (const node of nodes) {
          node.dashOffset(
            distance -
            (now - start) * 0.008
          );

          distance += node.getLength();
        }

        groupRef.current
          ?.getLayer()
          ?.batchDraw();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  /* =====================================================
     RENDER
     ===================================================== */

  if (!routes.length) {
    return null;
  }

  return (
    <Group
      ref={groupRef}
      listening={false}
    >
      {routes.map(route => (
        <Path
          key={route.id}
          data={route.data}
          name="signal-flow"
          stroke={CABLE_COLOR}
          strokeWidth={CABLE_WIDTH}
          dash={[7, 5]}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
    </Group>
  );
}
