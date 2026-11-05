/** Strict electrical planner. Unknown fields never produce a verified recommendation. */
export type Translator = (key: string) => string;
const untranslated: Translator = key => key;

export type Row = Record<string, any>;
export type Mode = { voltage: number; current: number };
export type Output = { index: number; modes: Mode[] };
type Pedal = { row: Row; index: number; modes: Mode[]; currentType: string; polarity: string; connector: string; analog: boolean; tuner: boolean; issues: string[] };
export type Assignment = { output: number; voltage: number; capacity: number; draw: number; pedals: Row[]; via: "individual" | "daisy" | "tuner"; alternatives: number[] };
export type Result = { supply: Row; status: "verified" | "pending" | "excluded" | "unknown"; reasons: string[]; assignments: Assignment[]; shared: number; spare: number; flexibility: number };
export const label = (r: Row) => `${r.brand ?? ""} ${r.name ?? ""}`.trim() || "powerFinder.unnamed";
const text = (v: unknown) => String(v ?? "").trim().toLowerCase();
const number = (v: unknown): number | null => {
    const s = String(v ?? "").trim();
    if (!/^\d+(?:\.\d+)?$/.test(s)) return null;
    const n = Number(s); return Number.isFinite(n) && n > 0 ? n : null;
};
const bool = (v: unknown) => v === true || text(v) === "true";
function currentType(v: unknown) {
    const s = text(v);
    if (/^(?:\d+(?:\.\d+)?(?:\s*[-–—/]\s*\d+(?:\.\d+)?)*\s*v\s*)?dc$/i.test(s)) return "dc";
    if (/^(?:\d+(?:\.\d+)?(?:\s*[-–—/]\s*\d+(?:\.\d+)?)*\s*v\s*)?ac$/i.test(s)) return "ac";
    return "";
}
function polarity(v: unknown) {
    const s = text(v).replace(/[ _]/g, "-");
    return ["center-negative", "centre-negative", "negative"].includes(s) ? "negative" : ["center-positive", "centre-positive", "positive"].includes(s) ? "positive" : "";
}
function connector(v: unknown) { return text(v).replace(/\s/g, "").replace(/×/g, "x"); }
export function voltages(v: unknown): number[] {
    if (typeof v === "number") return number(v) ? [v] : [];
    const s = text(v).replace(/\s*(?:DC|AC)\s*$/i, "").replace(/[–—]/g, "-").replace(/\s/g, "").replace(/v/g, "");
    if (/^\d+(?:\.\d+)?$/.test(s)) return [Number(s)].filter(n => n > 0);
    // Catalogue draw is used only at the minimum declared supply voltage.
    // Never assume the same current draw at a higher voltage in the range.
    const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if (range) {
        const minimum = Number(range[1]), maximum = Number(range[2]);
        return minimum > 0 && maximum >= minimum ? [minimum] : [];
    }
    if (/^\d+(?:\.\d+)?(?:[/,]\d+(?:\.\d+)?)+$/.test(s)) return [...new Set(s.split(/[/,]/).map(Number))].filter(n => n > 0);
    return []; // Other ambiguous formats are not silently coerced to 9 V.
}
export function parseOutputs(details: unknown, expected: unknown, t: Translator = untranslated): Output[] {
    const parts = String(details ?? "").split(/\s*[;,|]\s*/);
    const out: Output[] = [];
    for (const part of parts) {
        const m = part.trim().match(/^(\d+)\s*x\s*(switch\s*:)?\s*([\d./\s]+)V\s*:\s*([\d./\s]+)mA$/i);
        if (!m) throw new Error(t("powerFinder.diagnostics.outputFormat").replace("{value}", part));
        const count = Number(m[1]); const vs = m[3].replace(/\s/g, "").split("/").map(Number);
        const cs = m[4].replace(/\s/g, "").split("/").map(Number);
        if (!Number.isSafeInteger(count) || count < 1 || count > 64 || vs.some(v => !number(v)) || cs.some(c => !number(c)) || new Set(vs).size !== vs.length || (cs.length !== 1 && cs.length !== vs.length)) throw new Error(t("powerFinder.diagnostics.outputsInvalid"));
        for (let i = 0; i < count; i++) out.push({ index: out.length + 1, modes: vs.map((voltage, j) => ({ voltage, current: cs[j] ?? cs[0] })) });
    }
    if (out.length !== number(expected)) throw new Error(t("powerFinder.diagnostics.outputCountMismatch"));
    return out;
}
const defined = (r: Row): Row => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined && v !== null && v !== ""));
export function hydratePedals(items: Row[], library: Row[]): Row[] {
    return items.map(item => {
        const matches = library.filter(p => item.id != null && String(p.id) === String(item.id) && text(p.brand) === text(item.brand) && text(p.name) === text(item.name));
        const canonical = matches.length === 1 && text(item.brand) !== "custom" ? matches[0] : undefined;
        const keys = ["voltage", "draw", "power", "circuit", "current_type", "polarity", "connector", "power_modes", "ground", "requires_isolation"];
        const electrical = canonical ? defined(Object.fromEntries(keys.map(k => [k, canonical[k]]))) : {};
        // The real Supabase schema stores voltage in power, e.g. "9V DC".
        if (canonical && canonical.voltage == null) electrical.voltage = canonical.power;
        const snapshot = defined(item.powerFinderElectrical ?? {});
        return { ...item, ...electrical, ...snapshot };
    });
}
function pedalProfile(r: Row): Row {
    const brand = text(r.brand); const name = text(r.name);
    const bossTuner = brand === "boss" && /^(tu-3|tu-3w|tu-3s)(?: chromatic tuner)?$/.test(name);
    const bossComp = brand === "boss" && /^(bc-1x|bc-1x bass comp)$/.test(name);
    const sansamp = brand === "tech 21" && /^sansamp bass driver di (?:v2|\(v2\))$/.test(name);
    const muff = brand === "electro-harmonix" && name === "bass big muff pi";
    if (!bossTuner && !bossComp && !sansamp && !muff) return r;
    return {
        current_type: currentType(r.current_type ?? r.power) || "DC", polarity: "center-negative", connector: "5.5x2.1mm", ...defined(r),
        draw: Math.max(number(r.draw) ?? 0, bossTuner ? 85 : bossComp ? 90 : sansamp || muff ? 100 : 0) || r.draw
    };
}
/** Known negative-ground analogue circuits; draw always comes from the catalogue.
 * RAT 2 connector varies by revision: the wiring UI explicitly requires a suitable cable.
 * Never override explicit electrical metadata supplied by the catalogue.
 */
function setupPedalProfile(input: Row): Row {
    const r = pedalProfile(input);
    const brand = text(r.brand).replace(/[^a-z0-9]/g, "");
    const rat = brand === "proco" && /^rat\s*2$/.test(text(r.name));
    const centavo = brand === "warmaudio" && /^centavo(?:\s|$)/.test(text(r.name));
    const sansamp = brand === "tech21" && /^sansamp bass driver di (?:v2|\(v2\))$/.test(text(r.name));
    const muff = brand === "electroharmonix" && text(r.name) === "bass big muff pi";
    if (!rat && !centavo && !sansamp && !muff) return r;
    return {
        circuit: "analog", ground: "negative", requires_isolation: false,
        current_type: "DC", polarity: "center-negative", ...defined(r)
    };
}
function isOriginalOneSpot(r: Row): boolean {
    return text(r.brand).replace(/[^a-z0-9]/g, "") === "truetone" &&
        /^1\s*spot(?:\s+original)?$/.test(text(r.name));
}
function supplyProfile(r: Row): Row {
    // Manufacturer: https://www.truetone.com/1SPOT/ — 9 V DC, 1700 mA,
    // 2.1 mm centre negative. This profile never changes isolated=false.
    if (isOriginalOneSpot(r) && String(r.outputs) === "1" &&
        String(r.details).replace(/\s/g, "").toLowerCase() === "1x9v:1700ma") {
        return { current_type: "DC", polarity: "center-negative", connector: "5.5x2.1mm", capacity_watts: 15.3, ...defined(r) };
    }
    if (text(r.brand) === "cioks" && /^(dc7|dc7 v2)$/.test(text(r.name)) && String(r.outputs) === "7" && String(r.details).replace(/\s/g, "").toLowerCase() === "7xswitch:9/12/15/18v:660/500/400/330ma") {
        return { current_type: "DC", polarity: "center-negative", connector: "5.5x2.1mm", capacity_watts: 42, ...defined(r) };
    }
    return r;
}
function pedal(input: Row, index: number, t: Translator = untranslated): Pedal {
    const row = pedalProfile(input);
    const issues: string[] = [];
    let modes: Mode[] = [];
    if (Array.isArray(row.power_modes)) {
        modes = row.power_modes.map((m: Row) => ({ voltage: number(m.voltage) ?? 0, current: number(m.current) ?? 0 }));
        if (!modes.length || modes.some(m => !m.voltage || !m.current) || new Set(modes.map(m => m.voltage)).size !== modes.length) { issues.push(t("powerFinder.diagnostics.invalidModes")); modes = []; }
    } else {
        const vs = voltages(row.voltage ?? row.power); const draw = number(row.draw);
        if (!vs.length) issues.push(t("powerFinder.diagnostics.missingVoltage"));
        if (!draw) issues.push(t("powerFinder.diagnostics.missingDraw"));
        // A scalar draw for several voltages has no defined worst-case semantics.
        if (vs.length > 1) issues.push(t("powerFinder.diagnostics.multipleVoltages"));
        if (vs.length === 1 && draw) modes = [{ voltage: vs[0], current: draw }];
    }
    const ct = currentType(row.current_type ?? row.power);
    const pol = polarity(row.polarity); const con = connector(row.connector);
    if (!ct) issues.push(t("powerFinder.diagnostics.missingCurrentType"));
    if (ct !== "ac" && !pol) issues.push(t("powerFinder.diagnostics.missingPolarity"));
    if (!con) issues.push(t("powerFinder.diagnostics.missingConnector"));
    const tuner = text(row.brand) === "boss" && /^tu-3(?:w|s)?(?:\s|$)/i.test(String(row.name ?? ""));
    if (tuner) modes = modes.map(m => ({ ...m, current: Math.max(85, m.current) }));
    return { row, index, modes, currentType: ct, polarity: pol, connector: con, tuner, analog: text(row.circuit) === "analog" && text(row.ground) === "negative" && row.requires_isolation === false, issues };
}
function ignored(r: Row) { return ["passive", "battery-only", "none"].includes(text(r.power)); }
function isSupply(r: Row) { return text(r.type) === "power" || (r.capacity != null && r.outputs != null && r.details != null); }
export function findPowerSupplies(items: Row[], supplies: Row[], maxNodes = 60000, t: Translator = untranslated): { results: Result[]; issues: string[]; count: number; incompleteElectricalData: boolean } {
    const pedals = items.filter(r => !isSupply(r) && !ignored(r)).map((r, i) => pedal(r, i, t));
    const issues = pedals.flatMap(p => p.issues.map(i => `${label(p.row)} : ${i}`));
    if (!pedals.length) return { results: [], issues: [t("powerFinder.diagnostics.noPoweredPedals")], count: 0, incompleteElectricalData: false };
    const results = supplies.map((input): Result => {
        const supply = supplyProfile(input);
        const result: Result = { supply, status: "excluded", reasons: [], assignments: [], shared: 0, spare: 0, flexibility: 0 };
        if (/shared/i.test(String(supply.details ?? ""))) {
            result.reasons.push(t("powerFinder.diagnostics.sharedExcluded"));
            return result;
        }
        const smallRigAdapter = isOriginalOneSpot(supply) && pedals.length >= 1 && pedals.length <= 2;
        if (!bool(supply.isolated) && !smallRigAdapter) { result.reasons.push(t("powerFinder.diagnostics.isolationUnknown")); return result; }
        let outputs: Output[];
        try { outputs = parseOutputs(supply.details, supply.outputs, t); } catch (e) { result.status = "unknown"; result.reasons.push(String((e as Error).message)); return result; }
        if (pedals.some(p => !p.modes.length)) { result.status = "unknown"; result.reasons.push(...issues); return result; }
        const ct = currentType(supply.current_type); const pol = polarity(supply.polarity); const con = connector(supply.connector);
        const pending = [...issues];
        const budgetWatts = number(supply.capacity_watts);
        if (!budgetWatts) pending.push(t("powerFinder.diagnostics.missingBudget"));
        if (!ct) pending.push(t("powerFinder.diagnostics.supplyCurrentType"));
        if (ct !== "ac" && !pol) pending.push(t("powerFinder.diagnostics.supplyPolarity"));
        if (!con) pending.push(t("powerFinder.diagnostics.supplyConnector"));
        // This V1 supports uniform electrical metadata across outputs only.
        if (supply.output_metadata != null || supply.shared_banks != null) { result.status = "unknown"; result.reasons.push(t("powerFinder.diagnostics.unsupportedMetadata")); return result; }
        const eligible = (p: Pedal) => !(ct && p.currentType && ct !== p.currentType) && !(ct !== "ac" && pol && p.polarity && pol !== p.polarity) && !(con && p.connector && con !== p.connector);
        if (pedals.some(p => !eligible(p))) { result.reasons.push(t("powerFinder.diagnostics.electricalMismatch")); return result; }
        type Group = { output: Output; mode: Mode; pedals: Pedal[]; draw: number };
        let nodes = 0; let exhausted = false;
        const order = [...pedals].sort((a, b) => {
            const choices = (p: Pedal) => outputs.reduce((n, o) => n + o.modes.filter(m => p.modes.some(pm => pm.voltage === m.voltage && pm.current <= m.current)).length, 0);
            return choices(a) - choices(b) || Number(b.tuner) - Number(a.tuner) || a.index - b.index;
        });
        const sharedOK = (ps: Pedal[], v: number) => {
            if (v !== 9 || !ct || !pol || !con || ct !== "dc" || pol !== "negative") return false;
            if (ps.some(p => p.issues.length || p.currentType !== "dc" || p.polarity !== "negative" || p.connector !== con)) return false;
            if (smallRigAdapter) {
                // Both pedals share the same ground. Unknown ground or an
                // individual-isolation requirement must never be bypassed.
                return ps.length <= 2 && ps.every(p => text(p.row.ground) === "negative" && p.row.requires_isolation === false);
            }
            const tuners = ps.filter(p => p.tuner);
            return tuners.length === 0 ? ps.length <= 4 && ps.every(p => p.analog) : tuners.length === 1 && ps.length <= 4 && ps.filter(p => !p.tuner).every(p => p.analog);
        };
        const solve = (allowShare: boolean): Group[] | null => {
            const groups: Group[] = [];
            const visit = (i: number): Group[] | null => {
                if (++nodes > maxNodes) { exhausted = true; return null; }
                if (i === order.length) {
                    const mw = groups.reduce((n, g) => n + g.mode.voltage * g.draw, 0);
                    // Do not guess the unit of the legacy capacity field.
                    if (budgetWatts != null && mw > budgetWatts * 1000 + 1e-7) return null;
                    return groups.map(g => ({ ...g, pedals: [...g.pedals] }));
                }
                const p = order[i];
                for (const output of outputs) {
                    if (groups.some(g => g.output === output)) continue;
                    for (const mode of [...output.modes].sort((a, b) => a.voltage - b.voltage)) {
                        const pm = p.modes.find(m => m.voltage === mode.voltage);
                        if (!pm || pm.current > mode.current) continue;
                        groups.push({ output, mode, pedals: [p], draw: pm.current });
                        const found = visit(i + 1); groups.pop(); if (found) return found;
                        if (exhausted) return null;
                    }
                }
                if (allowShare) for (const group of groups) {
                    const pm = p.modes.find(m => m.voltage === group.mode.voltage);
                    if (!pm || group.draw + pm.current > group.mode.current || !sharedOK([...group.pedals, p], group.mode.voltage)) continue;
                    group.pedals.push(p); group.draw += pm.current;
                    const found = visit(i + 1); group.draw -= pm.current; group.pedals.pop(); if (found) return found;
                    if (exhausted) return null;
                }
                return null;
            };
            return visit(0);
        };
        const found = (pedals.length <= outputs.length ? solve(false) : null) ?? (!exhausted ? solve(true) : null);
        if (!found) { result.status = exhausted ? "unknown" : "excluded"; result.reasons.push(exhausted ? t("powerFinder.diagnostics.searchLimit") : t("powerFinder.diagnostics.noAssignment")); return result; }
        result.assignments = found.map(g => ({ output: g.output.index, voltage: g.mode.voltage, capacity: g.mode.current, draw: g.draw, pedals: g.pedals.map(p => p.row), via: g.pedals.length === 1 ? "individual" : g.pedals.some(p => p.tuner) ? "tuner" : "daisy", alternatives: g.output.modes.filter(m => m.voltage !== g.mode.voltage && g.pedals.length === 1 && g.pedals[0].modes.some(pm => pm.voltage === m.voltage && pm.current <= m.current) && found.reduce((n, other) => n + (other === g ? m.voltage * g.pedals[0].modes.find(pm => pm.voltage === m.voltage)!.current : other.mode.voltage * other.draw), 0) <= (budgetWatts == null ? Infinity : budgetWatts * 1000)).map(m => m.voltage) }));
        result.shared = found.reduce((n, g) => n + g.pedals.length - 1, 0); result.spare = outputs.length - found.length;
        result.flexibility = result.assignments.filter(a => a.voltage === 9 && a.alternatives.includes(18)).length;
        result.status = pending.length ? "pending" : "verified"; result.reasons = [...new Set(pending)];
        return result;
    });
    const area = (r: Row) => number(r.width) && number(r.depth) ? Number(r.width) * Number(r.depth) : Infinity;
    const tier = (r: Result) => r.status === "verified" ? r.shared ? 1 : 0 : r.status === "pending" ? 2 : 3;
    results.sort((a, b) => tier(a) - tier(b) || a.shared - b.shared || reservePenalty(a.spare) - reservePenalty(b.spare) || area(a.supply) - area(b.supply) || b.flexibility - a.flexibility || comparePowerSize(a.supply, b.supply) || label(a.supply).localeCompare(label(b.supply)));
    return { results, issues, count: pedals.length, incompleteElectricalData: pedals.some(p => !p.modes.length) };
}

const positive = (v: unknown): number | null => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
};
const normalize = (v: unknown) => String(v ?? "").trim().toLowerCase();
export function flatPedaltrain(boards: Row[]): Row | null {
    if (boards.length !== 1) return null;
    const b = boards[0];
    return normalize(b.brand) === "pedaltrain" && /^(nano|metro)(?:\b|\+)/.test(normalize(b.name)) ? b : null;
}
export function lowProfileCandidate(supply: Row, boards: Row[]): boolean {
    const board = boards.length === 1 && normalize(boards[0].profile) === "flat" ? boards[0] : null;
    const height = positive(supply.height);
    if (!board || height == null || height >= 28) return false;
    const w = positive(supply.width), d = positive(supply.depth);
    const bw = positive(board.width), bd = positive(board.depth);
    return w != null && d != null && bw != null && bd != null &&
        ((w <= bw && d <= bd) || (d <= bw && w <= bd));
}
export const POWER_BRAND_PRIORITY = [
    "Cioks", "Strymon", "Voodoo Lab", "Walrus Audio", "Truetone",
    "MXR", "Fender", "Harley Benton", "Ernie Ball", "The GigRig",
    "Free The Tone", "Carl Martin", "T-Rex", "Anasounds", "Mezzabarba",
    "Engl", "Ibanez", "Nux", "One Control", "BBE", "Joyo", "Klowra", "Tone City",
];
function brandPriority(brand: unknown): number {
    const key = normalize(brand).replace(/[^a-z0-9]/g, "");
    const index = POWER_BRAND_PRIORITY.findIndex(b => normalize(b).replace(/[^a-z0-9]/g, "") === key);
    return index === -1 ? POWER_BRAND_PRIORITY.length : index;
}
export function powerMountingHint(supply: Row, boards: Row[] = []): string | null {
    if (isOriginalOneSpot(supply)) return null;
    if (boards.length !== 1) return null;
    const profile = normalize(boards[0].profile);
    if (profile === "angled") return null;
    if (profile !== "flat") return "powerFinder.mountingUnknown";
    const height = positive(supply.height);
    if (height == null) return "powerFinder.mountingUnknown";
    return height < 28 ? "powerFinder.mountingPossible" : null;
}
const fitsFlatHeight = (supply: Row, boards: Row[]) =>
    boards.length === 1 && normalize(boards[0].profile) === "flat" &&
    positive(supply.height) != null && Number(supply.height) < 28;
/** Catalogue selection only; never changes the electrical assignment of a model. */
function standardActivePower(r: Row): boolean {
    if (normalize(r.status) !== "active") return false;
    const name = normalize(r.name);
    const edition = normalize(r.edition ?? r.finish_type ?? r.variant_type);
    if (edition && !["standard", "regular", "original", "stock"].includes(edition)) return false;
    if (r.is_special_edition === true || normalize(r.is_special_edition) === "true") return false;
    if (/\b(vhs[ -]?tape|limited(?: edition)?|special edition|anniversary|signature|custom finish|exclusive|collector(?:'s)? edition)\b/.test(name)) return false;
    return true;
}
function powerFamily(r: Row): string {
    const brand = normalize(r.brand).replace(/[^a-z0-9]/g, "");
    const family = normalize(r.model_family) || (brand === "cioks" && /^dc7(?:\s+v\d+)?$/.test(normalize(r.name)) ? "dc7" : normalize(r.name));
    return `${brand}|${family}`;
}
function revision(r: Row): number {
    return Number(normalize(r.name).match(/\bv(\d+)\b/)?.[1] ?? 0);
}
function reservePenalty(spare: number): number {
    // Prefer the closest fit: zero unused outputs, then one, then two, etc.
    return Math.max(0, spare);
}

function excessCurrentCapacity(r: Result): number {
    const needed = r.assignments.reduce((n, a) => n + a.voltage * a.draw, 0);
    if (!(needed > 0)) return Infinity;
    try {
        const outputs = parseOutputs(r.supply.details, r.supply.outputs);
        const provisioned = outputs.reduce((n, output) => {
            const assigned = r.assignments.find(a => a.output === output.index);
            const mode = assigned
                ? output.modes.find(m => m.voltage === assigned.voltage)
                : output.modes.find(m => m.voltage === 9) ?? [...output.modes].sort((a, b) => a.voltage - b.voltage)[0];
            return mode ? n + mode.voltage * mode.current : Infinity;
        }, 0);
        // Up to 25% capacity margin is neutral; unnecessary excess ranks later.
        return Math.max(0, provisioned / needed - 1.25);
    } catch { return Infinity; }
}
function compareCurrentCapacity(a: Result, b: Result): number {
    const x = excessCurrentCapacity(a), y = excessCurrentCapacity(b);
    return x === y ? 0 : x < y ? -1 : 1;
}
/** Size priority before excess capacity: volume, then footprint, then height. */
function comparePowerSize(a: Row, b: Row): number {
    const metric = (r: Row, volume: boolean) => {
        const w = positive(r.width), d = positive(r.depth), h = positive(r.height);
        return w != null && d != null && (!volume || h != null)
            ? w * d * (volume ? h! : 1) : Infinity;
    };
    const compare = (x: number, y: number) => x === y ? 0 : x < y ? -1 : 1;
    return compare(metric(a, true), metric(b, true)) ||
        compare(metric(a, false), metric(b, false)) ||
        compare(positive(a.height) ?? Infinity, positive(b.height) ?? Infinity);
}
export function recommendPower(results: Result[], boards: Row[] = []): Result[] {
    const eligible = results.filter(r =>
        (r.status === "verified" || r.status === "pending") &&
        r.assignments.length > 0 && standardActivePower(r.supply)
    );
    if (!eligible.length) return [];
    const families = new Map<string, Result>();
    for (const r of eligible) {
        const key = powerFamily(r.supply);
        const previous = families.get(key);
        if (!previous || revision(r.supply) > revision(previous.supply) ||
            (revision(r.supply) === revision(previous.supply) && r.shared < previous.shared)) families.set(key, r);
    }
    const distinct = [...families.values()];
    const minShared = Math.min(...distinct.map(r => r.shared));
    const best = distinct.filter(r => r.shared === minShared ||
        (isOriginalOneSpot(r.supply) && r.assignments.reduce((n, a) => n + a.pedals.length, 0) <= 2));
    // Allow a sensible expansion margin: seven pedals can use seven to eleven
    // outlets, including nine-outlet models. Reserve affects ranking, not brand admission.
    const used = Math.max(...best.map(r => r.assignments.length));
    const spareLimit = Math.max(2, Math.ceil(used / 2));
    const fitted = best.filter(r => r.spare <= spareLimit);
    const pool = fitted.length ? fitted : best;
    const compareRecommendations = (a: Result, b: Result): number =>
        Number(fitsFlatHeight(b.supply, boards)) - Number(fitsFlatHeight(a.supply, boards)) ||
        brandPriority(a.supply.brand) - brandPriority(b.supply.brand) ||
        reservePenalty(a.spare) - reservePenalty(b.spare) ||
        comparePowerSize(a.supply, b.supply) ||
        compareCurrentCapacity(a, b) ||
        b.flexibility - a.flexibility ||
        label(a.supply).localeCompare(label(b.supply));
    pool.sort(compareRecommendations);
    const chosen: Result[] = [];
    const brands = new Set<string>();
    for (const r of pool) {
        const brand = normalize(r.supply.brand).replace(/[^a-z0-9]/g, "");
        if (brands.has(brand)) continue;
        brands.add(brand); chosen.push(r);
        if (chosen.length === 10) return chosen.sort(compareRecommendations);
    }
    for (const r of pool) {
        if (!chosen.includes(r)) chosen.push(r);
        if (chosen.length === 10) break;
    }
    return chosen.sort(compareRecommendations);
}


/** Canvas planner: supply instances and physical outlets are never merged. */
export type SetupOutlet = { supplyIndex: number; output: number; modes: Mode[]; assignment: Assignment | null };
export type SetupPlan = { outlets: SetupOutlet[]; unpowered: Row[]; passive: Row[]; unsupported: Row[]; count: number; powered: number; complete: boolean; searchLimited: boolean };
export function planPowerSetup(items: Row[], supplies: Row[], maxNodes = 100000): SetupPlan {
    // Explicit zero only: blank / absent consumption must not be treated as passive.
    const zeroDraw = (r: Row) => r.draw === 0 || (typeof r.draw === "string" && /^0+(?:[.,]0+)?\s*(?:mA)?$/i.test(r.draw.trim()));
    const passive = items.filter(r => !isSupply(r) && (ignored(r) || zeroDraw(r)));
    const ps = items.filter(r => !isSupply(r) && !ignored(r) && !zeroDraw(r)).map((r, i) => pedal(setupPedalProfile(r), i));
    const unsupported: Row[] = [];
    const profiles = supplies.map(supplyProfile);
    const outlets: SetupOutlet[] = [];
    profiles.forEach((s, supplyIndex) => {
        try {
            if (/shared/i.test(String(s.details ?? "")) || s.shared_banks != null || s.output_metadata != null) throw new Error();
            if (!bool(s.isolated) && !isOriginalOneSpot(s)) throw new Error();
            parseOutputs(s.details, s.outputs).forEach(o => outlets.push({ supplyIndex, output: o.index, modes: o.modes, assignment: null }));
        } catch { unsupported.push(supplies[supplyIndex]); }
    });
    const eligible = (p: Pedal, o: SetupOutlet, m: Mode) => {
        const s = profiles[o.supplyIndex];
        const ct = currentType(s.current_type), pol = polarity(s.polarity), con = connector(s.connector);
        return p.modes.some(pm => pm.voltage === m.voltage && pm.current <= m.current) &&
            !!p.currentType && !(ct && ct !== p.currentType) &&
            !(pol && p.polarity && pol !== p.polarity) && !(con && p.connector && con !== p.connector);
    };
    const ordered = [...ps].sort((a, b) => {
        const choices = (p: Pedal) => outlets.reduce((n, o) => n + o.modes.filter(m => eligible(p, o, m)).length, 0);
        return choices(a) - choices(b) || Number(b.tuner) - Number(a.tuner) || a.index - b.index;
    });
    type Group = { outlet: number; mode: Mode; members: Pedal[] };
    let nodes = 0, searchLimited = false, best: Group[] = [], bestCount = 0, bestShared = Infinity;
    const draw = (g: Group) => g.members.reduce((n, p) => n + (p.modes.find(m => m.voltage === g.mode.voltage)?.current ?? Infinity), 0);
    const withinBudget = (groups: Group[]) => profiles.every((s, i) => {
        const limit = number(s.capacity_watts);
        return !limit || groups.filter(g => outlets[g.outlet].supplyIndex === i).reduce((n, g) => n + draw(g) * g.mode.voltage / 1000, 0) <= limit + 1e-9;
    });
    const shareable = (members: Pedal[], mode: Mode) => {
        if (mode.voltage !== 9) return false;
        // Use the catalogue circuit field. Optional ground/polarity columns are
        // absent from legacy rows; explicit conflicts still prohibit sharing.
        const safe = (p: Pedal) => p.currentType === "dc" &&
            p.modes.some(m => m.voltage === 9 && m.current > 0) &&
            p.polarity !== "positive" && text(p.row.ground) !== "positive" && !bool(p.row.requires_isolation);
        if (members.some(p => !safe(p))) return false;
        const knownConnectors = members.map(p => p.connector).filter(Boolean);
        if (new Set(knownConnectors).size > 1) return false;
        const tuners = members.filter(p => p.tuner);
        const others = members.filter(p => !p.tuner);
        if (others.some(p => text(p.row.circuit) !== "analog")) return false;
        if (!tuners.length) return members.length <= 3;
        // Conservative application policy. The upstream outlet must ALSO carry
        // the tuner itself plus every downstream pedal (checked by draw()).
        return tuners.length === 1 && others.length <= 1 && others.reduce((n, p) =>
            n + (p.modes.find(m => m.voltage === 9)?.current ?? Infinity), 0) <= 200;
    };
    const visit = (at: number, groups: Group[], count: number, allowShare: boolean, partial: boolean): boolean => {
        if (++nodes > maxNodes) { searchLimited = true; return false; }
        const shared = groups.reduce((n, g) => n + g.members.length - 1, 0);
        if (count > bestCount || (count === bestCount && shared < bestShared)) {
            bestCount = count; bestShared = shared; best = groups.map(g => ({ ...g, members: [...g.members] }));
        }
        if (at === ordered.length) return count === ps.length;
        if (partial && count + ordered.length - at < bestCount) return false;
        const p = ordered[at];
        const seen = new Set<string>();
        for (let oi = 0; oi < outlets.length; oi++) {
            if (groups.some(g => g.outlet === oi)) continue;
            const o = outlets[oi];
            const signature = JSON.stringify([o.supplyIndex, o.modes]);
            if (seen.has(signature)) continue;
            seen.add(signature);
            for (const mode of o.modes) {
                if (!eligible(p, o, mode)) continue;
                const next = [...groups, { outlet: oi, mode, members: [p] }];
                if (withinBudget(next) && visit(at + 1, next, count + 1, allowShare, partial)) return true;
            }
        }
        if (allowShare) for (let gi = 0; gi < groups.length; gi++) {
            const g = groups[gi], o = outlets[g.outlet];
            const members = [...g.members, p];
            if (!eligible(p, o, g.mode) || !shareable(members, g.mode)) continue;
            const changed = { ...g, members };
            if (draw(changed) > g.mode.current) continue;
            const next = groups.map((v, i) => i === gi ? changed : v);
            if (withinBudget(next) && visit(at + 1, next, count + 1, allowShare, partial)) return true;
        }
        return partial ? visit(at + 1, groups, count, allowShare, partial) : false;
    };
    if (!visit(0, [], 0, false, false) && !searchLimited) {
        if (!visit(0, [], 0, true, false) && !searchLimited) visit(0, [], 0, true, true);
    }
    const allocated = new Set<number>();
    best.forEach(g => {
        g.members.forEach(p => allocated.add(p.index));
        const members = [...g.members].sort((a, b) => Number(b.tuner) - Number(a.tuner) || a.index - b.index);
        outlets[g.outlet].assignment = { output: outlets[g.outlet].output, voltage: g.mode.voltage, capacity: g.mode.current, draw: draw(g), pedals: members.map(p => p.row), via: members.length === 1 ? "individual" : members.some(p => p.tuner) ? "tuner" : "daisy", alternatives: outlets[g.outlet].modes.map(m => m.voltage) };
    });
    return { outlets, passive, unsupported, unpowered: ps.filter(p => !allocated.has(p.index)).map(p => p.row), count: ps.length, powered: allocated.size, complete: allocated.size === ps.length && ps.length > 0, searchLimited };
}
