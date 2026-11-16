
import {
    parseConnectors,
    getAudioInputs,
    getAudioOutputs,
    getRotatedConnectorPoint,
    type PedalConnector,
} from "./connectors";

import type { Jack } from "./SignalCableRouting";

type AnyRow = Record<string, any>;

type Size = {
    w: number;
    h: number;
};

type JackKind = "input" | "output";

/* =========================================================
   SUPABASE CONNECTORS
   ========================================================= */

export function getPedalConnectors(
    pedal: AnyRow
): PedalConnector[] {
    if (pedal.connectors_verified !== true) {
        return [];
    }

    return parseConnectors(pedal.connectors) ?? [];
}

/* =========================================================
   AUDIO CONNECTORS
   ========================================================= */

export function getSignalConnectors(
    pedal: AnyRow,
    kind: JackKind
): PedalConnector[] {
    const connectors = getPedalConnectors(pedal);

    return kind === "input"
        ? getAudioInputs(connectors)
        : getAudioOutputs(connectors);
}

/* =========================================================
   CONNECTOR POSITION
   ========================================================= */

export function resolveConnectorPosition(
    pedal: AnyRow,
    size: Size,
    connector: PedalConnector
): Jack {
    const geometry = getRotatedConnectorPoint(
        connector,
        Number(pedal.x),
        Number(pedal.y),
        size.w,
        size.h,
        Number(pedal.rotation) || 0
    );

    const clean = (value: number) =>
        Math.abs(value) < 1e-8 ? 0 : value;

    return {
        x: geometry.x,
        y: geometry.y,

        direction: {
            x: clean(geometry.directionX),
            y: clean(geometry.directionY),
        },

        ownerId: pedal.instanceId,
    };
}

/* =========================================================
   ALL AUDIO JACK POSITIONS
   ========================================================= */

export function getSignalJackPositions(
    pedal: AnyRow,
    size: Size,
    kind: JackKind
) {
    return getSignalConnectors(pedal, kind).map(
        connector => ({
            connector,
            jack: resolveConnectorPosition(
                pedal,
                size,
                connector
            ),
        })
    );
}

/* =========================================================
   MAIN AUDIO JACK
   ========================================================= */

export function getSignalJackPosition(
    pedal: AnyRow,
    size: Size,
    kind: JackKind
): Jack | null {
    const connectors = getSignalConnectors(
        pedal,
        kind
    );

    const connector =
        connectors.find(c => c.channel === "mono") ??
        connectors.find(c => c.channel === "L") ??
        connectors.find(c => c.channel === "stereo");

    if (!connector) {
        return null;
    }

    return resolveConnectorPosition(
        pedal,
        size,
        connector
    );
}
