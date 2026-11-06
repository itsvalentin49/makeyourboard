export type LocationValue = "top" | "bottom" | "left" | "right";
export type HardwarePoint = { x: number; y: number };
export type CustomPedalLayout = {
    version: 1 | 2 | 3 | 4;
    formatId: string;
    knobs: readonly HardwarePoint[];
    footswitches: readonly HardwarePoint[];
    knobSizeMm: number;
    footswitchSizeMm: number;
};
export type PedalFormat = {
    id: string; width: number; depth: number; labelKey: string;
    jackLocations: LocationValue[]; layout: CustomPedalLayout;
};
const singleFootswitch = [{ x: 0.5, y: 0.8 }];
const threeKnobs = [{ x: 0.22, y: 0.22 }, { x: 0.5, y: 0.22 }, { x: 0.78, y: 0.22 }];
const makeLayout = (formatId: string, knobs: HardwarePoint[], footswitches: HardwarePoint[] = singleFootswitch): CustomPedalLayout => ({
    version: 4, formatId, knobs, footswitches,
    knobSizeMm: ({ mini: 16, compact: 20, standard: 20, large: 24, double: 24, horizontal: 26 } as Record<string, number>)[formatId] ?? 16,
    footswitchSizeMm: 16,
});
export const PEDAL_FORMATS: readonly PedalFormat[] = [
    { id: "mini", width: 38, depth: 92, labelKey: "mini", jackLocations: ["left", "right"], layout: makeLayout("mini", [{ x: 0.5, y: 0.2 }]) },
    { id: "compact", width: 60, depth: 112, labelKey: "compact", jackLocations: ["left", "right"], layout: makeLayout("compact", [{ x: 0.27, y: 0.2 }, { x: 0.73, y: 0.2 }]) },
    { id: "standard", width: 66, depth: 122, labelKey: "standard", jackLocations: ["left", "right"], layout: makeLayout("standard", [{ x: 0.27, y: 0.17 }, { x: 0.73, y: 0.17 }, { x: 0.27, y: 0.37 }, { x: 0.73, y: 0.37 }]) },
    { id: "large", width: 94, depth: 119, labelKey: "large", jackLocations: ["left", "right"], layout: makeLayout("large", threeKnobs) },
    { id: "double", width: 102, depth: 114, labelKey: "double", jackLocations: ["top"], layout: makeLayout("double", threeKnobs, [{ x: 0.27, y: 0.8 }, { x: 0.73, y: 0.8 }]) },
    { id: "horizontal", width: 171, depth: 127, labelKey: "horizontal", jackLocations: ["top"], layout: makeLayout("horizontal", threeKnobs, [{ x: 0.22, y: 0.8 }, { x: 0.78, y: 0.8 }]) },
];

// Scale the physical knob diameter with the edited enclosure, without overlapping knobs.
export function getSizedPedalLayout(layout: CustomPedalLayout, referenceWidth: number, referenceDepth: number, width: number, depth: number): CustomPedalLayout {
    const requestedDiameter = layout.knobSizeMm * Math.sqrt((width * depth) / (referenceWidth * referenceDepth));
    let maxDiameter = 32;
    for (const point of layout.knobs) {
        maxDiameter = Math.min(maxDiameter,
            1.84 * Math.min(point.x * width, (1 - point.x) * width, point.y * depth, (1 - point.y) * depth));
    }
    for (let i = 0; i < layout.knobs.length; i++) {
        for (let j = i + 1; j < layout.knobs.length; j++) {
            maxDiameter = Math.min(maxDiameter, 0.92 * Math.hypot(
                (layout.knobs[i].x - layout.knobs[j].x) * width,
                (layout.knobs[i].y - layout.knobs[j].y) * depth));
        }
    }
    return { ...layout, knobSizeMm: Math.round(Math.max(1, Math.min(requestedDiameter, maxDiameter)) * 100) / 100 };
}

export function resolveCustomPedalLayout(value: unknown, width: number, depth: number): CustomPedalLayout {
    if (value && typeof value === "object") {
        const row = value as Partial<CustomPedalLayout>;
        const pointsValid = (points: unknown): points is HardwarePoint[] => Array.isArray(points)
            && points.length <= 24 && points.every(point => point && Number.isFinite(point.x) && Number.isFinite(point.y)
                && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
        if ((row.version === 1 || row.version === 2 || row.version === 3 || row.version === 4) && typeof row.formatId === "string" && pointsValid(row.knobs) && pointsValid(row.footswitches)
            && typeof row.knobSizeMm === "number" && Number.isFinite(row.knobSizeMm) && row.knobSizeMm > 0 && row.knobSizeMm <= 100
            && typeof row.footswitchSizeMm === "number" && Number.isFinite(row.footswitchSizeMm) && row.footswitchSizeMm > 0 && row.footswitchSizeMm <= 100) {
            const footswitchSizeMm = row.version === 1 && row.footswitchSizeMm === 12
                && PEDAL_FORMATS.some(format => format.id === row.formatId) ? 16 : row.footswitchSizeMm;
            const previousThreeKnobLayout = [{ x: 0.27, y: 0.2 }, { x: 0.73, y: 0.2 }, { x: 0.5, y: 0.39 }];
            const updatePreset = row.version < 3 && (row.formatId === "standard" || row.formatId === "compact") && row.knobs.length === 3
                && row.knobs.every((point, index) => Math.abs(point.x - previousThreeKnobLayout[index].x) < 0.000001
                    && Math.abs(point.y - previousThreeKnobLayout[index].y) < 0.000001);
            const previousStandard = [{ x: 0.27, y: 0.2 }, { x: 0.73, y: 0.2 }, { x: 0.27, y: 0.4 }, { x: 0.73, y: 0.4 }];
            const updateStandard = row.version < 4 && row.formatId === "standard" && (updatePreset
                || (row.knobs.length === 4 && row.knobs.every((point, index) => Math.abs(point.x - previousStandard[index].x) < 0.000001
                    && Math.abs(point.y - previousStandard[index].y) < 0.000001)));
            const updateKnobs = updatePreset || updateStandard;
            const resolved: CustomPedalLayout = {
                version: 4, formatId: row.formatId,
                knobs: (updateKnobs ? PEDAL_FORMATS.find(format => format.id === row.formatId)!.layout.knobs : row.knobs).map(point => ({ ...point })),
                footswitches: row.footswitches.map(point => ({ ...point })),
                knobSizeMm: updateStandard ? row.knobSizeMm * 20 / 22 : row.knobSizeMm, footswitchSizeMm
            };
            return updateKnobs ? getSizedPedalLayout(resolved, width, depth, width, depth) : resolved;
        }
    }
    const format = PEDAL_FORMATS.find(item => Math.abs(item.width - width) < 0.02 && Math.abs(item.depth - depth) < 0.02) || PEDAL_FORMATS[2];
    return getSizedPedalLayout(format.layout, format.width, format.depth, width, depth);
}
export type HardwareGeometry = { x: number; y: number; width: number; height: number };
export function getPedalHardwareGeometry(layout: CustomPedalLayout, widthMm: number, depthMm: number, renderWidth: number, renderHeight: number) {
    const scale = Math.min(renderWidth / widthMm, renderHeight / depthMm);
    const place = (points: readonly HardwarePoint[], diameterMm: number): HardwareGeometry[] => points.map(point => ({
        x: point.x * renderWidth - diameterMm * scale / 2,
        y: point.y * renderHeight - diameterMm * scale / 2,
        width: diameterMm * scale, height: diameterMm * scale,
    }));
    const footswitches = place(layout.footswitches, layout.footswitchSizeMm);
    const ledSize = 5 * scale;
    const leds = footswitches.map(footswitch => ({
        x: footswitch.x + footswitch.width / 2 - ledSize / 2,
        y: footswitch.y - 4 * scale - ledSize,
        width: ledSize, height: ledSize,
    }));
    return { knobs: place(layout.knobs, layout.knobSizeMm), footswitches, leds };
}
export function getPedalJackGeometry(locations: readonly LocationValue[], widthMm: number, depthMm: number, renderWidth: number, renderHeight: number) {
    const scale = Math.min(renderWidth / widthMm, renderHeight / depthMm);
    return locations.flatMap(side => {
        const horizontal = side === "top" || side === "bottom";
        const width = (horizontal ? 18 : 14) * scale;
        const height = (horizontal ? 14 : 18) * scale;
        return (side === "top" ? [0.3, 0.7] : [0.5]).map(position => ({
            side, src: `/images/jack-${side === "bottom" ? "down" : side}.webp`, width, height,
            x: horizontal ? renderWidth * position - width / 2 : side === "left" ? -7.7 * scale : renderWidth - width + 7.7 * scale,
            y: horizontal ? side === "top" ? -7.7 * scale : renderHeight - height + 7.7 * scale : renderHeight * position - height / 2,
        }));
    });
}
export function parsePedalJackLocations(value: unknown): LocationValue[] {
    const raw = String(value || "").toLowerCase();
    return (["top", "bottom", "left", "right"] as const).filter(side => raw.includes(side) || (side === "bottom" && raw.includes("down")));
}
