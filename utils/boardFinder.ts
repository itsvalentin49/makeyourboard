
/**
 * MakeYourBoard — Board Finder
 *
 * COMPATIBILITY RULES
 *
 * 2 pedals:
 * - Optimized physical arrangement.
 * - Independent of canvas spacing.
 * - Maximum additional width: 70 mm.
 * - Maximum additional depth: 30 mm.
 * - Cable clearance included.
 *
 * 3+ pedals:
 * - Actual canvas footprint.
 * - No theoretical rearrangement.
 * - 5 mm tolerance in width and depth.
 * - Width, depth and total area are checked.
 *
 * Power supplies:
 * - On the board: included.
 * - Under the board: excluded.
 *
 * Pedals are never moved automatically.
 */

type AnyRow = Record<string, any>;

export const JACK_CLEARANCE_MM = 10;
export const MAX_BODY_OVERHANG_MM = 12;

const EPSILON_MM = 0.001;

const MIN_GAP_MM = 5;

/* =========================
   TWO-PEDAL LIMITS
   ========================= */

const TWO_PEDAL_MAX_EXTRA_WIDTH_MM = 70;
const TWO_PEDAL_MAX_EXTRA_DEPTH_MM = 30;

/* =========================
   THREE OR MORE PEDALS
   ========================= */

// Maximum permitted dimensional shortfall.
// 5 mm total per axis, not 5 mm on each side.
const DIMENSION_TOLERANCE_MM = 5;

const MULTI_MAX_EXTRA_WIDTH_MM = 100;
const MULTI_MAX_EXTRA_DEPTH_MM = 100;

const MULTI_MAX_WIDTH_RATIO = 1.25;
const MULTI_MAX_DEPTH_RATIO = 1.20;

const MULTI_MAX_AREA_RATIO = 1.40;

/* =========================
   TYPES
   ========================= */

type Bounds = {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
};

type Footprint = {
    width: number;
    depth: number;

    bodyWidth: number;
    bodyDepth: number;

    totalPedalArea: number;
};

type PackingOption = {
    width: number;
    depth: number;
    area: number;
};

export type FinderLayout = {
    status:
    | "ready"
    | "too-few"
    | "missing-dimensions";

    pedalCount: number;
    powerCount: number;

    width: number;
    depth: number;

    centerX: number;
    centerY: number;

    hasOverlap: boolean;

    totalPedalArea: number;

    bodyWidth: number;
    bodyDepth: number;

    minX: number;
    maxX: number;
    minY: number;
    maxY: number;

    optimized?: Footprint;

    surfaceItems?: AnyRow[];

    packingOptions?: PackingOption[];

    currentBodies?: Bounds[];
    currentClearances?: Bounds[];
};

export type FinderMatch = {
    board: AnyRow;

    freeArea: number;

    requiresRearrangement: boolean;

    layoutMode:
    | "current"
    | "optimized";
};

/* =========================
   CLASSIFICATION
   ========================= */

export function isPowerSupply(
    item: AnyRow
): boolean {
    return (
        String(item.type || "")
            .trim()
            .toLowerCase() === "power"
    );
}

export function physicalPedals(
    items: AnyRow[]
): AnyRow[] {
    return items.filter(
        (item) => !isPowerSupply(item)
    );
}

/* =========================
   POWER SUPPLY POSITION
   ========================= */

export function isPowerUnderBoard(
    item: AnyRow,
    existingBoards: AnyRow[] = []
): boolean {
    if (!isPowerSupply(item)) {
        return false;
    }

    if (existingBoards.length !== 1) {
        return false;
    }

    const board = existingBoards[0];

    const itemZ = Number(
        item.zIndex ?? 0
    );

    const boardZ = Number(
        board.zIndex ?? -9999
    );

    if (
        !Number.isFinite(itemZ) ||
        !Number.isFinite(boardZ)
    ) {
        return false;
    }

    return itemZ < boardZ;
}

/**
 * Items occupying the board surface.
 *
 * Normal pedals are always included.
 * Under-board power supplies are excluded.
 */

export function finderSurfaceItems(
    items: AnyRow[],
    existingBoards: AnyRow[] = []
): AnyRow[] {
    return items.filter(
        (item) =>
            !isPowerUnderBoard(
                item,
                existingBoards
            )
    );
}

/* =========================
   DIMENSIONS
   ========================= */

function positive(
    value: unknown
): number | null {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
        ? number
        : null;
}

function normalizeAngle(
    angle: number
): number {
    return ((angle % 360) + 360) % 360;
}

/* =========================
   CONNECTOR CLEARANCE
   ========================= */

function getConnectorMargins(
    item: AnyRow
) {
    const jacks = String(
        item.jacksLocation ||
        item.jacks ||
        ""
    ).toLowerCase();

    return {
        left:
            jacks.includes("left") ||
                jacks.includes("side")
                ? JACK_CLEARANCE_MM
                : 0,

        right:
            jacks.includes("right") ||
                jacks.includes("side")
                ? JACK_CLEARANCE_MM
                : 0,

        top:
            jacks.includes("top")
                ? JACK_CLEARANCE_MM
                : 0,

        bottom:
            jacks.includes("down") ||
                jacks.includes("bottom")
                ? JACK_CLEARANCE_MM
                : 0,
    };
}

/* =========================
   ITEM BOUNDS
   ========================= */

function pedalBounds(
    item: AnyRow,
    includeClearance = true,
    rotationOverride?: number
): Bounds | null {
    const width = positive(item.width);
    const depth = positive(item.depth);

    const x = Number(item.x ?? 0);
    const y = Number(item.y ?? 0);

    const angle = Number(
        rotationOverride ??
        item.rotation ??
        0
    );

    if (
        width === null ||
        depth === null ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(angle)
    ) {
        return null;
    }

    const margins = includeClearance
        ? getConnectorMargins(item)
        : {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };

    const minX =
        -width / 2 - margins.left;

    const maxX =
        width / 2 + margins.right;

    const minY =
        -depth / 2 - margins.top;

    const maxY =
        depth / 2 + margins.bottom;

    const rad =
        (angle * Math.PI) / 180;

    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const corners = [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
    ].map(([localX, localY]) => ({
        x:
            x +
            localX * cos -
            localY * sin,

        y:
            y +
            localX * sin +
            localY * cos,
    }));

    return {
        minX: Math.min(
            ...corners.map((p) => p.x)
        ),

        maxX: Math.max(
            ...corners.map((p) => p.x)
        ),

        minY: Math.min(
            ...corners.map((p) => p.y)
        ),

        maxY: Math.max(
            ...corners.map((p) => p.y)
        ),
    };
}

function boundsWidth(
    bounds: Bounds
): number {
    return bounds.maxX - bounds.minX;
}

function boundsDepth(
    bounds: Bounds
): number {
    return bounds.maxY - bounds.minY;
}

function combineBounds(
    bounds: Bounds[]
): Bounds {
    return {
        minX: Math.min(
            ...bounds.map((b) => b.minX)
        ),

        maxX: Math.max(
            ...bounds.map((b) => b.maxX)
        ),

        minY: Math.min(
            ...bounds.map((b) => b.minY)
        ),

        maxY: Math.max(
            ...bounds.map((b) => b.maxY)
        ),
    };
}

function boundsOverlap(
    a: Bounds,
    b: Bounds
): boolean {
    return (
        a.minX < b.maxX - EPSILON_MM &&
        b.minX < a.maxX - EPSILON_MM &&
        a.minY < b.maxY - EPSILON_MM &&
        b.minY < a.maxY - EPSILON_MM
    );
}

/* =========================
   OPTIMIZED PACKING
   ========================= */

/**
 * Generates alternative layouts.
 *
 * Used only for two-pedal configurations.
 *
 * The algorithm tests:
 * - Different item orders.
 * - Horizontal arrangements.
 * - Vertical arrangements.
 * - Rotations of 0° and 90°.
 *
 * Connector clearance is included.
 *
 * The original canvas positions are not modified.
 */

function getPackingOptions(
    items: AnyRow[]
): PackingOption[] {
    if (!items.length) {
        return [];
    }

    const count = items.length;

    const original = items.map(
        (_, index) => index
    );

    const byArea = [...original].sort(
        (a, b) =>
            Number(items[b].width) *
            Number(items[b].depth) -
            Number(items[a].width) *
            Number(items[a].depth)
    );

    const byWidth = [...original].sort(
        (a, b) =>
            Number(items[b].width) -
            Number(items[a].width)
    );

    const byDepth = [...original].sort(
        (a, b) =>
            Number(items[b].depth) -
            Number(items[a].depth)
    );

    const orders = [
        original,
        [...original].reverse(),
        byArea,
        byWidth,
        byDepth,
        [...byWidth].reverse(),
        [...byDepth].reverse(),
    ];

    const uniqueOrders = Array.from(
        new Map(
            orders.map((order) => [
                order.join(","),
                order,
            ])
        ).values()
    );

    const options = new Map<
        string,
        PackingOption
    >();

    const fullRotationSearch = count <= 8;

    const rotationMasks = fullRotationSearch
        ? Array.from(
            { length: 2 ** count },
            (_, index) => index
        )
        : [
            0,
            2 ** Math.min(count, 20) - 1,
        ];

    const maxBreakMasks =
        count <= 8
            ? 2 ** Math.max(0, count - 1)
            : Math.min(
                32,
                2 ** Math.min(count - 1, 20)
            );

    for (const order of uniqueOrders) {
        for (const rotationMask of rotationMasks) {
            const measurements = order.map(
                (itemIndex, position) => {
                    const item = items[itemIndex];

                    const rotate = fullRotationSearch
                        ? (rotationMask >> position) & 1
                        : Number(rotationMask !== 0);

                    const rotation = normalizeAngle(
                        Number(item.rotation ?? 0) +
                        rotate * 90
                    );

                    const box = pedalBounds(
                        {
                            ...item,
                            x: 0,
                            y: 0,
                        },
                        true,
                        rotation
                    );

                    if (!box) {
                        return null;
                    }

                    return {
                        width: boundsWidth(box),
                        depth: boundsDepth(box),
                    };
                }
            );

            if (
                measurements.some(
                    (measurement) => measurement === null
                )
            ) {
                continue;
            }

            const dimensions = measurements as {
                width: number;
                depth: number;
            }[];

            for (
                let breakMask = 0;
                breakMask < maxBreakMasks;
                breakMask++
            ) {
                const rows: {
                    width: number;
                    depth: number;
                }[] = [];

                let rowWidth = 0;
                let rowDepth = 0;
                let rowCount = 0;

                const pushRow = () => {
                    if (!rowCount) {
                        return;
                    }

                    rows.push({
                        width: rowWidth,
                        depth: rowDepth,
                    });

                    rowWidth = 0;
                    rowDepth = 0;
                    rowCount = 0;
                };

                dimensions.forEach(
                    (dimension, index) => {
                        if (
                            index > 0 &&
                            ((breakMask >> (index - 1)) & 1)
                        ) {
                            pushRow();
                        }

                        rowWidth +=
                            dimension.width +
                            (rowCount > 0 ? MIN_GAP_MM : 0);

                        rowDepth = Math.max(
                            rowDepth,
                            dimension.depth
                        );

                        rowCount++;
                    }
                );

                pushRow();

                const width = Math.max(
                    ...rows.map((row) => row.width)
                );

                const depth =
                    rows.reduce(
                        (sum, row) => sum + row.depth,
                        0
                    ) +
                    Math.max(0, rows.length - 1) *
                    MIN_GAP_MM;

                if (
                    !Number.isFinite(width) ||
                    !Number.isFinite(depth) ||
                    width <= 0 ||
                    depth <= 0
                ) {
                    continue;
                }

                const key =
                    `${Math.round(width * 10)}:` +
                    `${Math.round(depth * 10)}`;

                options.set(key, {
                    width,
                    depth,
                    area: width * depth,
                });
            }
        }
    }

    return [...options.values()].sort(
        (a, b) =>
            a.area - b.area ||
            a.width - b.width ||
            a.depth - b.depth
    );
}

/* =========================
   FINDER LAYOUT
   ========================= */

export function getFinderLayout(
    items: AnyRow[],
    existingBoards: AnyRow[] = []
): FinderLayout {
    const pedals = physicalPedals(items);

    const pedalCount = pedals.length;

    const surfaceItems = finderSurfaceItems(
        items,
        existingBoards
    );

    const powerCount = surfaceItems.filter(
        isPowerSupply
    ).length;

    const base: FinderLayout = {
        status: "too-few",

        pedalCount,
        powerCount,

        width: 0,
        depth: 0,

        centerX: 0,
        centerY: 0,

        hasOverlap: false,

        totalPedalArea: 0,

        bodyWidth: 0,
        bodyDepth: 0,

        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0,

        surfaceItems,
        packingOptions: [],
    };

    /* MINIMUM TWO PEDALS */

    if (pedalCount < 2) {
        return base;
    }

    /* PHYSICAL BOUNDS */

    const physicalBounds = surfaceItems.map(
        (item) => pedalBounds(item, false)
    );

    /* CONNECTOR BOUNDS */

    const clearanceBounds = surfaceItems.map(
        (item) => pedalBounds(item, true)
    );

    if (
        physicalBounds.some((b) => b === null) ||
        clearanceBounds.some((b) => b === null)
    ) {
        return {
            ...base,
            status: "missing-dimensions",
        };
    }

    const bodies = physicalBounds as Bounds[];
    const boxes = clearanceBounds as Bounds[];

    const body = combineBounds(bodies);
    const clearance = combineBounds(boxes);

    /* OVERLAP DETECTION */

    let hasOverlap = false;

    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            if (
                boundsOverlap(
                    boxes[i],
                    boxes[j]
                )
            ) {
                hasOverlap = true;
            }
        }
    }

    /* TOTAL PHYSICAL AREA */

    const totalPedalArea = surfaceItems.reduce(
        (area, item) =>
            area +
            Number(item.width) *
            Number(item.depth),
        0
    );

    /* OPTIMIZED ARRANGEMENTS — TWO PEDALS ONLY */

    const packingOptions =
        pedalCount === 2
            ? getPackingOptions(surfaceItems)
            : [];

    const best = packingOptions[0];

    const optimized: Footprint | undefined = best
        ? {
            width: best.width,
            depth: best.depth,

            bodyWidth: best.width,
            bodyDepth: best.depth,

            totalPedalArea,
        }
        : undefined;

    return {
        status: "ready",

        pedalCount,
        powerCount,

        width: boundsWidth(body),
        depth: boundsDepth(body),

        centerX:
            (body.minX + body.maxX) / 2,

        centerY:
            (body.minY + body.maxY) / 2,

        hasOverlap,

        totalPedalArea,

        bodyWidth: boundsWidth(body),
        bodyDepth: boundsDepth(body),

        minX: clearance.minX,
        maxX: clearance.maxX,
        minY: clearance.minY,
        maxY: clearance.maxY,

        optimized,
        surfaceItems,
        packingOptions,

        currentBodies: bodies,
        currentClearances: boxes,
    };
}

/* =========================
   BOARD VALIDATION
   ========================= */

function isValidBoard(
    board: AnyRow
): boolean {
    const width = positive(board.width);
    const depth = positive(board.depth);

    if (
        width === null ||
        depth === null
    ) {
        return false;
    }

    const name = String(board.name || "");

    /* EXCLUDE ACCESSORIES */

    if (
        /\b(?:riser|extension)\b/i.test(name)
    ) {
        return false;
    }

    /* EXCLUDE DISCONTINUED */

    if (
        String(board.status || "")
            .toLowerCase()
            .includes("discontinued")
    ) {
        return false;
    }

    return true;
}

/* =========================
   PACKING COMPATIBILITY
   ========================= */

function getCompatiblePacking(
    layout: FinderLayout,
    board: AnyRow
): PackingOption | null {
    if (
        layout.status !== "ready" ||
        !isValidBoard(board)
    ) {
        return null;
    }

    const boardWidth = Number(board.width);
    const boardDepth = Number(board.depth);

    const boardArea =
        boardWidth * boardDepth;

    /* =========================
       THREE OR MORE PEDALS
  
       USE ACTUAL CANVAS FOOTPRINT
       ========================= */

    if (layout.pedalCount >= 3) {
        const requiredWidth = Math.ceil(
            layout.bodyWidth
        );

        const requiredDepth = Math.ceil(
            layout.bodyDepth
        );

        const footprintArea =
            requiredWidth * requiredDepth;

        /* =========================
           PHYSICAL FIT — 5 MM TOLERANCE
           ========================= */

        if (
            boardWidth +
            DIMENSION_TOLERANCE_MM +
            EPSILON_MM < requiredWidth ||

            boardDepth +
            DIMENSION_TOLERANCE_MM +
            EPSILON_MM < requiredDepth
        ) {
            return null;
        }

        /* TOTAL EQUIPMENT AREA */

        if (
            boardArea + EPSILON_MM <
            layout.totalPedalArea
        ) {
            return null;
        }

        /* MAXIMUM WIDTH */

        const maxWidth = Math.min(
            requiredWidth +
            MULTI_MAX_EXTRA_WIDTH_MM,

            requiredWidth *
            MULTI_MAX_WIDTH_RATIO
        );

        /* MAXIMUM DEPTH */

        const maxDepth = Math.min(
            requiredDepth +
            MULTI_MAX_EXTRA_DEPTH_MM,

            requiredDepth *
            MULTI_MAX_DEPTH_RATIO
        );

        /* MAXIMUM SURFACE */

        const maxArea =
            footprintArea *
            MULTI_MAX_AREA_RATIO;

        /* COMPACTNESS VALIDATION */

        if (
            boardWidth > maxWidth + EPSILON_MM ||
            boardDepth > maxDepth + EPSILON_MM ||
            boardArea > maxArea + EPSILON_MM
        ) {
            return null;
        }

        return {
            width: requiredWidth,
            depth: requiredDepth,
            area: footprintArea,
        };
    }

    /* =========================
       TWO PEDALS — COMPACT FIT
       ========================= */

    const surfaceItems =
        layout.surfaceItems || [];

    const measurements = surfaceItems.map(
        (item) => pedalBounds(item, false)
    );

    if (
        !measurements.length ||
        measurements.some((box) => box === null)
    ) {
        return null;
    }

    const boxes = measurements as Bounds[];

    /*
     * Reserve enough space between enclosures
     * for audio and power cables.
     */

    const cableGap = Math.max(
        MIN_GAP_MM,
        JACK_CLEARANCE_MM * 2
    );

    /*
     * Natural horizontal footprint.
     *
     * Independent of actual canvas positions.
     * Surface-mounted power supplies are included.
     */

    const naturalWidth =
        boxes.reduce(
            (sum, box) =>
                sum + boundsWidth(box),
            0
        ) +
        Math.max(
            0,
            surfaceItems.length - 1
        ) * cableGap;

    const naturalDepth = Math.max(
        ...boxes.map(
            (box) => boundsDepth(box)
        )
    );

    /*
     * Use the natural arrangement as reference.
     *
     * A compact existing layout may contribute
     * up to 20 mm of additional reference width.
     *
     * Large empty gaps on the canvas do not
     * increase the permitted board dimensions.
     */

    const referenceWidth = Math.max(
        naturalWidth,

        Math.min(
            layout.bodyWidth,
            naturalWidth + 20
        )
    );

    /* MAXIMUM BOARD DIMENSIONS */

    const maxWidth =
        Math.ceil(referenceWidth) +
        TWO_PEDAL_MAX_EXTRA_WIDTH_MM;

    const maxDepth =
        Math.ceil(naturalDepth) +
        TWO_PEDAL_MAX_EXTRA_DEPTH_MM;

    /* MINIMUM PHYSICAL FIT */

    if (
        boardWidth + EPSILON_MM < naturalWidth ||
        boardDepth + EPSILON_MM < naturalDepth
    ) {
        return null;
    }

    /* MAXIMUM COMPACTNESS */

    if (
        boardWidth > maxWidth + EPSILON_MM ||
        boardDepth > maxDepth + EPSILON_MM
    ) {
        return null;
    }

    /* TOTAL EQUIPMENT AREA */

    if (
        boardArea + EPSILON_MM <
        layout.totalPedalArea
    ) {
        return null;
    }

    /* COMPATIBLE */

    return {
        width: naturalWidth,
        depth: naturalDepth,

        area:
            naturalWidth * naturalDepth,
    };
}

/* =========================
   CURRENT ARRANGEMENT
   ========================= */

/**
 * Determines whether the current canvas arrangement
 * already fits the selected board.
 *
 * Does not affect the physical compatibility list.
 */

function currentArrangementFits(
    layout: FinderLayout,
    board: AnyRow
): boolean {
    if (
        layout.status !== "ready" ||
        layout.hasOverlap
    ) {
        return false;
    }

    const boardWidth = Number(board.width);
    const boardDepth = Number(board.depth);

    const boxes =
        layout.currentClearances || [];

    if (!boxes.length) {
        return false;
    }

    /* BOARD BOUNDS */

    const left =
        layout.centerX - boardWidth / 2;

    const right =
        layout.centerX + boardWidth / 2;

    const top =
        layout.centerY - boardDepth / 2;

    const bottom =
        layout.centerY + boardDepth / 2;

    /* CHECK ALL ITEMS */

    return boxes.every(
        (box) =>
            box.minX >= left - EPSILON_MM &&
            box.maxX <= right + EPSILON_MM &&
            box.minY >= top - EPSILON_MM &&
            box.maxY <= bottom + EPSILON_MM
    );
}

/* =========================
   MATCH MODE
   ========================= */

export function getBoardFitMode(
    layout: FinderLayout,
    board: AnyRow,
    compactOnly = true
): "current" | "optimized" | null {
    if (layout.status !== "ready") {
        return null;
    }

    const packing = getCompatiblePacking(
        layout,
        board
    );

    if (!packing) {
        return null;
    }

    /* THREE OR MORE PEDALS */

    if (layout.pedalCount >= 3) {
        return "current";
    }

    /* TWO PEDALS */

    if (
        currentArrangementFits(
            layout,
            board
        )
    ) {
        return "current";
    }

    return "optimized";
}

/* =========================
   PUBLIC COMPATIBILITY
   ========================= */

export function fitsBoard(
    layout: FinderLayout,
    board: AnyRow
): boolean {
    return (
        getBoardFitMode(
            layout,
            board,
            true
        ) !== null
    );
}

export function isCompactBoard(
    layout: FinderLayout,
    board: AnyRow
): boolean {
    return fitsBoard(
        layout,
        board
    );
}

/* =========================
   LEGACY ARRANGEMENT HELPER
   ========================= */

/**
 * Retained for compatibility with existing imports.
 *
 * The Finder never automatically moves pedals.
 */

export function arrangeFinderItems(
    items: AnyRow[],
    existingBoards: AnyRow[] = [],
    centerX?: number,
    centerY?: number,
    board?: AnyRow
): AnyRow[] {
    return items;
}

/* =========================
   BRAND PRIORITY
   ========================= */

function brandPriority(
    brand: string
): number {
    const normalized = brand
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    if (normalized === "pedaltrain") {
        return 0;
    }

    if (normalized === "temple audio") {
        return 1;
    }

    return 2;
}

/* =========================
   COMPATIBLE BOARDS
   ========================= */

export function findCompatibleBoards(
    layout: FinderLayout,
    boards: AnyRow[]
): FinderMatch[] {
    if (layout.status !== "ready") {
        return [];
    }

    const results: FinderMatch[] = [];

    for (const board of boards) {
        const brand = String(
            board.brand || ""
        )
            .trim()
            .toLowerCase();

        const name = String(
            board.name || ""
        )
            .trim()
            .toUpperCase();

        /* TEMPLE AUDIO — GM ONLY */

        if (
            brand === "temple audio" &&
            !name.endsWith(" GM")
        ) {
            continue;
        }

        /* COMPATIBILITY */

        const packing = getCompatiblePacking(
            layout,
            board
        );

        if (!packing) {
            continue;
        }

        /* MATCH MODE */

        const mode = getBoardFitMode(
            layout,
            board,
            true
        );

        if (!mode) {
            continue;
        }

        /* FREE AREA */

        const freeArea =
            Number(board.width) *
            Number(board.depth) -
            packing.area;

        /* SAVE RESULT */

        results.push({
            board,

            freeArea,

            requiresRearrangement:
                mode === "optimized",

            layoutMode: mode,
        });
    }

    /* =========================
       SORT RESULTS
       ========================= */

    return results.sort(
        (a, b) => {

            /* BRAND PRIORITY */

            const brandDifference =
                brandPriority(
                    String(a.board.brand || "")
                ) -
                brandPriority(
                    String(b.board.brand || "")
                );

            if (brandDifference !== 0) {
                return brandDifference;
            }

            /* CURRENT BEFORE OPTIMIZED */

            if (
                a.requiresRearrangement !==
                b.requiresRearrangement
            ) {
                return a.requiresRearrangement
                    ? 1
                    : -1;
            }

            /* MINIMUM UNUSED AREA */

            return (
                a.freeArea - b.freeArea ||

                Number(a.board.width) -
                Number(b.board.width) ||

                String(a.board.brand || "").localeCompare(
                    String(b.board.brand || "")
                ) ||

                String(a.board.name || "").localeCompare(
                    String(b.board.name || "")
                )
            );
        }
    );
}
