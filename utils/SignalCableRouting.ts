export type Point = { x: number; y: number };
export type Jack = Point & { direction: Point; ownerId?: number };
export type Obstacle = { id?: number; minX: number; maxX: number; minY: number; maxY: number };
export type CableSegment = { a: Point; b: Point };
const GAP = 6;
const CORNER = 5;
export function cableSegments(points: Point[]): CableSegment[] { return points.slice(1).map((b, i) => ({ a: points[i], b })); }
const EPS = 1e-6;
const same = (a: Point, b: Point) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
const dist = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const inside = (p: Point, b: Obstacle) => p.x > b.minX + EPS && p.x < b.maxX - EPS && p.y > b.minY + EPS && p.y < b.maxY - EPS;
function clear(a: Point, b: Point, boxes: Obstacle[]) {
    return !boxes.some(o => Math.abs(a.x - b.x) < EPS
        ? a.x > o.minX + EPS && a.x < o.maxX - EPS && Math.max(a.y, b.y) > o.minY + EPS && Math.min(a.y, b.y) < o.maxY - EPS
        : a.y > o.minY + EPS && a.y < o.maxY - EPS && Math.max(a.x, b.x) > o.minX + EPS && Math.min(a.x, b.x) < o.maxX - EPS);
}
// Parallel runs must remain separated; crossings may only occur on straight interiors.
function cableClear(a: Point, b: Point, used: CableSegment[]) {
    const horizontal = Math.abs(a.y - b.y) < EPS;
    return used.every(({ a: c, b: d }) => {
        const otherHorizontal = Math.abs(c.y - d.y) < EPS;
        const lo = (x: number, y: number) => Math.min(x, y), hi = (x: number, y: number) => Math.max(x, y);
        if (horizontal === otherHorizontal) {
            const gap = horizontal ? Math.abs(a.y - c.y) : Math.abs(a.x - c.x);
            const [p, q, r, s] = horizontal ? [a.x, b.x, c.x, d.x] : [a.y, b.y, c.y, d.y];
            return gap >= GAP - EPS || hi(p, q) < lo(r, s) - EPS || hi(r, s) < lo(p, q) - EPS;
        }
        const h = horizontal ? { a, b } : { a: c, b: d };
        const v = horizontal ? { a: c, b: d } : { a, b };
        const x = v.a.x, y = h.a.y;
        if (x < lo(h.a.x, h.b.x) - EPS || x > hi(h.a.x, h.b.x) + EPS || y < lo(v.a.y, v.b.y) - EPS || y > hi(v.a.y, v.b.y) + EPS) return true;
        // Allow a crossing at a temporary grid node, but not near an existing bend/end.
        const margin = horizontal ? Math.min(Math.abs(y - c.y), Math.abs(y - d.y)) : Math.min(Math.abs(x - c.x), Math.abs(x - d.x));
        return margin >= CORNER + EPS;
    });
}
// Count orthogonal crossings. A crossing on an intermediate grid node
// contributes half on each adjoining edge, rather than being counted twice.
function crossingCount(a: Point, b: Point, used: CableSegment[]): number {
    if (same(a, b)) return 0;
    const horizontal = Math.abs(a.y - b.y) < EPS;
    let count = 0;
    for (const { a: c, b: d } of used) {
        if (horizontal === (Math.abs(c.y - d.y) < EPS)) continue;
        const h = horizontal ? { a, b } : { a: c, b: d };
        const v = horizontal ? { a: c, b: d } : { a, b };
        const p = { x: v.a.x, y: h.a.y };
        if (p.x < Math.min(h.a.x, h.b.x) - EPS || p.x > Math.max(h.a.x, h.b.x) + EPS ||
            p.y < Math.min(v.a.y, v.b.y) - EPS || p.y > Math.max(v.a.y, v.b.y) + EPS) continue;
        count += same(p, a) || same(p, b) ? 0.5 : 1;
    }
    return count;
}
function nearCable(p: Point, used: CableSegment[]) {
    return used.some(({ a, b }) => {
        const x = Math.max(Math.min(a.x, b.x), Math.min(p.x, Math.max(a.x, b.x)));
        const y = Math.max(Math.min(a.y, b.y), Math.min(p.y, Math.max(a.y, b.y)));
        return Math.hypot(p.x - x, p.y - y) < CORNER + EPS;
    });
}
function stub(j: Jack, length: number): Point {
    const d = j.direction;
    return { x: j.x + d.x * length, y: j.y + d.y * length };
}
function simplify(points: Point[]) {
    const out: Point[] = [];
    for (const p of points) {
        if (out.length && same(out[out.length - 1], p)) continue;
        while (out.length >= 2) {
            const a = out[out.length - 2], b = out[out.length - 1];
            if (Math.abs(dist(a, b) + dist(b, p) - dist(a, p)) < EPS && (Math.abs(a.x - b.x) < EPS && Math.abs(b.x - p.x) < EPS || Math.abs(a.y - b.y) < EPS && Math.abs(b.y - p.y) < EPS)) out.pop(); else break;
        }
        out.push(p);
    }
    return out;
}
// Rectilinear visibility grid; adjacent nodes only. Penalize turns.
function search(start: Point, end: Point, boxes: Obstacle[], fromDir: Point, toDir: Point, used: CableSegment[]): Point[] | null {
    const xs = [...new Set([start.x, end.x, ...boxes.flatMap(b => [b.minX, b.maxX, b.minX - GAP, b.maxX + GAP]), ...used.flatMap(({ a, b }) => [a.x - GAP, a.x + GAP, b.x - GAP, b.x + GAP])])].sort((a, b) => a - b);
    const ys = [...new Set([start.y, end.y, ...boxes.flatMap(b => [b.minY, b.maxY, b.minY - GAP, b.maxY + GAP]), ...used.flatMap(({ a, b }) => [a.y - GAP, a.y + GAP, b.y - GAP, b.y + GAP])])].sort((a, b) => a - b);
    const w = xs.length, h = ys.length;
    const nodes = ys.flatMap(y => xs.map(x => ({ x, y })));
    const valid = nodes.map(p => !boxes.some(b => inside(p, b)));
    const s = ys.indexOf(start.y) * w + xs.indexOf(start.x), t = ys.indexOf(end.y) * w + xs.indexOf(end.x);
    if (s === t) return [start];
    if (!valid[s] || !valid[t]) return null;
    const initial = fromDir.x ? 0 : 1;
    const startKey = s * 2 + initial;
    // This weight exceeds the maximum length + turn cost of a simple
    // path through the direction-state grid: crossing count comes first.
    const crossingWeight = 4 * nodes.length * (xs[w - 1] - xs[0] + ys[h - 1] - ys[0] + 13) + 1;
    const costs = new Map<number, number>([[startKey, 0]]), parents = new Map<number, number>();
    const open = new Set([startKey]);
    while (open.size) {
        let best = -1, score = Infinity;
        for (const k of open) { const f = costs.get(k)! + dist(nodes[Math.floor(k / 2)], end); if (f < score) { best = k; score = f; } }
        open.delete(best);
        const i = Math.floor(best / 2), axis = best % 2, p = nodes[i];
        if (i === t) { const route: Point[] = []; let k: number | undefined = best; while (k !== undefined) { route.push(nodes[Math.floor(k / 2)]); k = parents.get(k); } return route.reverse(); }
        const x = i % w, y = Math.floor(i / w);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy; if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const j = ny * w + nx, q = nodes[j]; if (!valid[j] || !clear(p, q, boxes) || !cableClear(p, q, used)) continue;
            if (i === s && dx * fromDir.x + dy * fromDir.y < -EPS) continue;
            if (j === t && dx * toDir.x + dy * toDir.y > EPS) continue;
            const nextAxis = dx ? 0 : 1, key = j * 2 + nextAxis;
            if (axis !== nextAxis && nearCable(p, used)) continue;
            if (j === t && nextAxis !== (toDir.x ? 0 : 1) && nearCable(q, used)) continue;
            const cost = costs.get(best)! + dist(p, q) + (axis === nextAxis ? 0 : 12) + crossingWeight * crossingCount(p, q, used);
            if (cost < (costs.get(key) ?? Infinity)) { costs.set(key, cost); parents.set(key, best); open.add(key); }
        }
    }
    return null;
}
export function routeSignalCable(from: Jack, to: Jack, boxes: Obstacle[], used: CableSegment[] = []): Point[] | null {
    // The padded boxes include the rounding radius and half the stroke.
    // Keep the lead outside the padding; only its own enclosure is exempt.
    let best: Point[] | null = null;
    let bestCrossings = Infinity;
    let bestCost = Infinity;
    for (const length of [12, 14, 16, 18, 20, 24, 30, 36]) {
        const a = stub(from, length), b = stub(to, length);
        const fromOthers = boxes.filter(o => o.id === undefined || o.id !== from.ownerId);
        const toOthers = boxes.filter(o => o.id === undefined || o.id !== to.ownerId);
        if (!clear(from, a, fromOthers) || !clear(to, b, toOthers) || !cableClear(from, a, used) || !cableClear(to, b, used) || nearCable(a, used) || nearCable(b, used)) continue;
        const route = search(a, b, boxes, from.direction, to.direction, used);
        if (route) {
            const points = simplify([from, ...route, to]);
            if (points.slice(1, -1).some(p => nearCable(p, used))) continue;
            if (cableSegments(points).every(({ a, b }) => cableClear(a, b, used))) {
                const segments = cableSegments(points);
                const crossings = segments.reduce((n, { a, b }) => n + crossingCount(a, b, used), 0);
                const cost = segments.reduce((n, { a, b }) => n + dist(a, b), 0) + 12 * Math.max(0, segments.length - 1);
                // The standard lead is preferred if it already yields zero crossings.
                if (crossings === 0 && best === null) return points;
                if (crossings < bestCrossings || (crossings === bestCrossings && cost < bestCost)) {
                    best = points; bestCrossings = crossings; bestCost = cost;
                }
            }
        }
    }
    return best;
}
export function roundedCablePath(points: Point[], radius = 6): string {
    if (!points.length) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
        const a = points[i - 1], b = points[i], c = points[i + 1];
        const ab = Math.hypot(b.x - a.x, b.y - a.y), bc = Math.hypot(c.x - b.x, c.y - b.y);
        const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
        if (ab < EPS || bc < EPS || Math.abs(dot) > EPS * ab * bc) { path += ` L ${b.x} ${b.y}`; continue; }
        const r = Math.min(radius, ab / 2, bc / 2);
        const p = { x: b.x + (a.x - b.x) * r / ab, y: b.y + (a.y - b.y) * r / ab };
        const q = { x: b.x + (c.x - b.x) * r / bc, y: b.y + (c.y - b.y) * r / bc };
        path += ` L ${p.x} ${p.y} Q ${b.x} ${b.y} ${q.x} ${q.y}`;
    }
    const last = points[points.length - 1]; return `${path} L ${last.x} ${last.y}`;
}