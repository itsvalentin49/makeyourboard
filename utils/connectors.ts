
/* =========================================================
   CONNECTOR TYPES
   ========================================================= */

export const CONNECTOR_TYPES = [
    "input",
    "output",
    "send",
    "return",
    "direct_output",
    "balanced_output",
    "headphones",
    "expression_input",
    "expression_output",
    "footswitch",
    "tap_tempo",
    "control_input",
    "control_output",
    "midi_input",
    "midi_output",
    "midi_thru",
    "usb",
    "spdif_input",
    "spdif_output",
    "power_input",
    "power_output",
    "other",
] as const;

export type ConnectorType =
    (typeof CONNECTOR_TYPES)[number];

/* =========================================================
   PHYSICAL FORMATS
   ========================================================= */

export const CONNECTOR_FORMATS = [
    "TS_635",
    "TRS_635",
    "TS_35",
    "TRS_35",
    "TRRS_35",
    "XLR",
    "XLR_TRS_COMBO",
    "DIN_5",
    "USB_A",
    "USB_B",
    "USB_C",
    "USB_MINI_B",
    "USB_MICRO_B",
    "RCA",
    "TOSLINK",
    "DC_BARREL",
    "IEC",
    "OTHER",
] as const;

export type ConnectorFormat =
    (typeof CONNECTOR_FORMATS)[number];

export type ConnectorSide =
    | "L"
    | "R"
    | "Top"
    | "Down";

export type ConnectorChannel =
    | "mono"
    | "L"
    | "R"
    | "stereo";

/* =========================================================
   CONNECTOR DATA
   ========================================================= */

export type PedalConnector = {
    id: string;
    type: ConnectorType;
    label: string;
    format: ConnectorFormat;
    channel: ConnectorChannel | null;
    side: ConnectorSide;
    position: number;
    loop?: number;
    alternateTypes?: ConnectorType[];
    notes?: string;
};

export type PedalConnectorData = {
    connectors?: PedalConnector[] | null;
    connectors_verified?: boolean;
};

/* =========================================================
   CONNECTOR LABELS
   ========================================================= */

export const CONNECTOR_LABELS: Record<
    ConnectorType,
    string
> = {
    input: "In",
    output: "Out",
    send: "Send",
    return: "Return",
    direct_output: "Direct Out",
    balanced_output: "Balanced Out",
    headphones: "Phones",
    expression_input: "EXP In",
    expression_output: "EXP Out",
    footswitch: "FS",
    tap_tempo: "Tap",
    control_input: "CTL In",
    control_output: "CTL Out",
    midi_input: "MIDI In",
    midi_output: "MIDI Out",
    midi_thru: "MIDI Thru",
    usb: "USB",
    spdif_input: "S/PDIF In",
    spdif_output: "S/PDIF Out",
    power_input: "Power In",
    power_output: "Power Out",
    other: "Other",
};

/* =========================================================
   CONNECTOR FAMILIES
   ========================================================= */

export type ConnectorFamily =
    | "audio"
    | "control"
    | "midi"
    | "digital"
    | "power"
    | "other";

export function getConnectorFamily(
    type: ConnectorType
): ConnectorFamily {
    switch (type) {
        case "input":
        case "output":
        case "send":
        case "return":
        case "direct_output":
        case "balanced_output":
        case "headphones":
            return "audio";

        case "expression_input":
        case "expression_output":
        case "footswitch":
        case "tap_tempo":
        case "control_input":
        case "control_output":
            return "control";

        case "midi_input":
        case "midi_output":
        case "midi_thru":
            return "midi";

        case "usb":
        case "spdif_input":
        case "spdif_output":
            return "digital";

        case "power_input":
        case "power_output":
            return "power";

        default:
            return "other";
    }
}

/* =========================================================
   CONNECTOR COLORS
   ========================================================= */

export function getConnectorColor(
    type: ConnectorType
): string {
    switch (type) {
        case "input":
        case "return":
            return "var(--color-blue-500)";

        case "output":
        case "send":
        case "direct_output":
        case "balanced_output":
        case "headphones":
            return "var(--color-green-500)";

        case "expression_input":
        case "expression_output":
        case "footswitch":
        case "tap_tempo":
        case "control_input":
        case "control_output":
            return "var(--color-purple-500)";

        case "midi_input":
        case "midi_output":
        case "midi_thru":
            return "var(--color-orange-500)";

        case "power_input":
        case "power_output":
            return "var(--color-red-500)";

        default:
            return "var(--color-zinc-400)";
    }
}

/* =========================================================
   DEFAULT PHYSICAL FORMAT
   ========================================================= */

export function getDefaultConnectorFormat(
    type: ConnectorType
): ConnectorFormat {
    switch (type) {
        case "input":
        case "output":
        case "send":
        case "return":
        case "direct_output":
            return "TS_635";

        case "expression_input":
        case "expression_output":
        case "footswitch":
        case "tap_tempo":
        case "control_input":
        case "control_output":
        case "headphones":
            return "TRS_635";

        case "balanced_output":
            return "XLR";

        case "midi_input":
        case "midi_output":
        case "midi_thru":
            return "DIN_5";

        case "usb":
            return "USB_C";

        case "spdif_input":
        case "spdif_output":
            return "RCA";

        case "power_input":
        case "power_output":
            return "DC_BARREL";

        default:
            return "OTHER";
    }
}

/* =========================================================
   AUTOMATIC LABEL
   ========================================================= */

export function getConnectorLabel(
    type: ConnectorType,
    channel: ConnectorChannel | null = null,
    loop?: number
): string {
    const label = CONNECTOR_LABELS[type];

    const loopLabel =
        loop !== undefined && loop > 0
            ? ` ${loop}`
            : "";

    const channelLabel =
        channel === "L" || channel === "R"
            ? ` ${channel}`
            : channel === "stereo"
                ? " Stereo"
                : "";

    return `${label}${loopLabel}${channelLabel}`;
}

/* =========================================================
   CREATE CONNECTOR
   ========================================================= */

export function createConnector(
    type: ConnectorType = "input",
    side: ConnectorSide = "R",
    position = 50,
    channel: ConnectorChannel | null = null
): PedalConnector {
    const family = getConnectorFamily(type);

    const resolvedChannel =
        channel ?? (family === "audio" ? "mono" : null);

    return {
        id: crypto.randomUUID(),
        type,
        label: getConnectorLabel(type, resolvedChannel),
        format:
            resolvedChannel === "stereo" &&
                getDefaultConnectorFormat(type) === "TS_635"
                ? "TRS_635"
                : getDefaultConnectorFormat(type),
        channel: resolvedChannel,
        side,
        position: Math.min(100, Math.max(0, position)),
    };
}

/* =========================================================
   NORMALIZED COORDINATES
   ========================================================= */

export function getConnectorPoint(
    connector: PedalConnector
): { x: number; y: number } {
    const position =
        Math.max(0, Math.min(100, connector.position)) / 100;

    switch (connector.side) {
        case "L":
            return {
                x: 0,
                y: position,
            };

        case "R":
            return {
                x: 1,
                y: position,
            };

        case "Top":
            return {
                x: position,
                y: 0,
            };

        case "Down":
            return {
                x: position,
                y: 1,
            };
    }
}

/* =========================================================
   CONNECTOR DIRECTION
   ========================================================= */

export function getConnectorDirection(
    side: ConnectorSide
): { x: number; y: number } {
    switch (side) {
        case "L":
            return { x: -1, y: 0 };

        case "R":
            return { x: 1, y: 0 };

        case "Top":
            return { x: 0, y: -1 };

        case "Down":
            return { x: 0, y: 1 };
    }
}

/* =========================================================
   ROTATED CONNECTOR GEOMETRY
   ========================================================= */

export function getRotatedConnectorPoint(
    connector: PedalConnector,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    rotation = 0
) {
    const point = getConnectorPoint(connector);

    const localX = (point.x - 0.5) * width;
    const localY = (point.y - 0.5) * height;

    const radians = (rotation * Math.PI) / 180;

    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const direction = getConnectorDirection(connector.side);

    return {
        x: centerX + localX * cos - localY * sin,
        y: centerY + localX * sin + localY * cos,

        directionX:
            direction.x * cos - direction.y * sin,

        directionY:
            direction.x * sin + direction.y * cos,
    };
}

/* =========================================================
   AUDIO INPUTS / OUTPUTS
   ========================================================= */

export function getAudioInputs(
    connectors: PedalConnector[]
): PedalConnector[] {
    return connectors.filter(
        connector => connector.type === "input"
    );
}

export function getAudioOutputs(
    connectors: PedalConnector[]
): PedalConnector[] {
    return connectors.filter(
        connector => connector.type === "output"
    );
}

/* =========================================================
   VALIDATION
   ========================================================= */

export function isValidConnector(
    value: unknown
): value is PedalConnector {
    if (!value || typeof value !== "object") {
        return false;
    }

    const item = value as Record<string, unknown>;

    return (
        typeof item.id === "string" &&
        item.id.length > 0 &&
        typeof item.label === "string" &&
        item.label.trim().length > 0 &&

        CONNECTOR_TYPES.includes(
            item.type as ConnectorType
        ) &&

        CONNECTOR_FORMATS.includes(
            item.format as ConnectorFormat
        ) &&

        ["L", "R", "Top", "Down"].includes(
            item.side as string
        ) &&

        [null, "mono", "L", "R", "stereo"].includes(
            item.channel as ConnectorChannel | null
        ) &&

        typeof item.position === "number" &&
        Number.isFinite(item.position) &&
        item.position >= 0 &&
        item.position <= 100 &&

        (
            item.loop === undefined ||
            (
                typeof item.loop === "number" &&
                Number.isInteger(item.loop) &&
                item.loop > 0
            )
        ) &&

        (
            item.alternateTypes === undefined ||
            (
                Array.isArray(item.alternateTypes) &&
                item.alternateTypes.every(type =>
                    CONNECTOR_TYPES.includes(type as ConnectorType)
                )
            )
        ) &&

        (
            item.notes === undefined ||
            typeof item.notes === "string"
        )
    );
}

export function parseConnectors(
    value: unknown
): PedalConnector[] | null {
    if (typeof value === "string") {
        try {
            value = JSON.parse(value);
        } catch {
            return null;
        }
    }

    if (!Array.isArray(value)) {
        return null;
    }

    if (!value.every(isValidConnector)) {
        return null;
    }

    const ids = new Set(value.map(item => item.id));

    if (ids.size !== value.length) {
        return null;
    }

    return value;
}

/* =========================================================
   CALIBRATION STATUS
   ========================================================= */

export function getCalibrationStatus(
    pedal: PedalConnectorData
): "missing" | "estimated" | "verified" {
    const connectors = parseConnectors(pedal.connectors);

    if (connectors === null) {
        return "missing";
    }

    return pedal.connectors_verified
        ? "verified"
        : "estimated";
}
