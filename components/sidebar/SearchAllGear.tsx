"use client";

import React, { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft, BatteryCharging, LayoutPanelTop, Plus, Search, SlidersHorizontal, WandSparkles, X } from "lucide-react";
import SearchBoards from "@/components/sidebar/SearchBoards";
import SearchPower from "@/components/sidebar/SearchPower";
import type { CatalogStatus } from "@/hooks/useLibrary";

type AnyRow = Record<string, any>;
type Category = "all" | "pedals" | "boards" | "power";
type View = "catalog" | "boardFinder" | "powerFinder" | "custom";

type Props = {
    pedalsLibrary: AnyRow[];
    boardsLibrary: AnyRow[];
    powerLibrary: AnyRow[];
    newPedals: AnyRow[];
    newPedalsLoading: boolean;
    libraryLoading: boolean;
    libraryError: string | null;
    boardsStatus: CatalogStatus;
    powerStatus: CatalogStatus;
    finderPedals: AnyRow[];
    existingBoards: AnyRow[];
    powerFinderBoards: AnyRow[];
    selectSuggestedBoard?: (board: AnyRow) => boolean;
    addPedal: (pedal: AnyRow) => void;
    selectBoard: (board: AnyRow) => void;
    addPower: (power: AnyRow) => void;
    customPanel: React.ReactNode;
    onOpenGear: () => void;
    t: (key: string) => string;
    units: "metric" | "imperial";
    groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

function dateKey(value: unknown): number | null {
    const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = +match[1], month = +match[2], day = +match[3];
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date.getTime();
}

function normalized(value: unknown) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function rank(row: AnyRow, query: string): number {
    const brand = normalized(row.brand), name = normalized(row.name), type = normalized(row.type);
    if (brand === query) return 0;
    if (name === query) return 1;
    if (brand.startsWith(query)) return 2;
    if (name.startsWith(query)) return 3;
    if (brand.includes(query)) return 4;
    if (name.includes(query)) return 5;
    if (type.includes(query)) return 6;
    return 7;
}

export default function SearchAllGear({
    pedalsLibrary, boardsLibrary, powerLibrary, newPedals, newPedalsLoading,
    libraryLoading, libraryError, boardsStatus, powerStatus, finderPedals,
    existingBoards, powerFinderBoards, selectSuggestedBoard, addPedal,
    selectBoard, addPower, customPanel, onOpenGear, t, units, groupItems,
}: Props) {
    const [category, setCategory] = useState<Category>("all");
    const [view, setView] = useState<View>("catalog");
    const [query, setQuery] = useState("");
    const [finderMenuOpen, setFinderMenuOpen] = useState(false);
    const [boardSearch, setBoardSearch] = useState("");
    const [powerSearch, setPowerSearch] = useState("");
    const [showBoardResults, setShowBoardResults] = useState(false);
    const [showPedalResults, setShowPedalResults] = useState(false);
    const [showPowerResults, setShowPowerResults] = useState(false);
    const boardInputRef = React.useRef<HTMLInputElement>(null);
    const powerInputRef = React.useRef<HTMLInputElement>(null);
    const powerDropdownRef = React.useRef<HTMLDivElement>(null);
    const deferredQuery = useDeferredValue(query);
    const search = normalized(deferredQuery.trim());
    const searching = query.trim().length > 0;

    const entries = useMemo(() => {
        const all: { kind: Exclude<Category, "all">; item: AnyRow }[] = [];
        const add = (kind: Exclude<Category, "all">, rows: AnyRow[]) => {
            if (category === "all" || category === kind) rows.forEach(item => all.push({ kind, item }));
        };
        if (searching) {
            add("pedals", pedalsLibrary);
            add("boards", boardsLibrary);
            add("power", powerLibrary);
            const terms = search.split(/\s+/).filter(Boolean);
            return all.filter(({ item, kind }) => {
                const type = kind === "pedals" ? t(`pedal.type.${item.type ?? ""}`) : "";
                const haystack = normalized(`${item.brand ?? ""} ${item.name ?? ""} ${item.type ?? ""} ${type}`);
                return terms.every(term => haystack.includes(term));
            }).sort((a, b) => rank(a.item, search) - rank(b.item, search) ||
                String(a.item.brand ?? "").localeCompare(String(b.item.brand ?? "")) ||
                String(a.item.name ?? "").localeCompare(String(b.item.name ?? "")));
        }
        const now = new Date(); now.setHours(23, 59, 59, 999);
        const days = (kind: Exclude<Category, "all">) => kind === "pedals" ? 30 : 365;
        const recent = (kind: Exclude<Category, "all">, rows: AnyRow[]) => rows
            .filter(item => normalized(item.status ?? "active") === "active")
            .filter(item => { const time = dateKey(item.year); return time !== null && time <= now.getTime() && time >= now.getTime() - days(kind) * 86400000; })
            .sort((a, b) => (dateKey(b.year) ?? 0) - (dateKey(a.year) ?? 0))
            .slice(0, 20);
        add("pedals", newPedals.length ? newPedals : recent("pedals", pedalsLibrary));
        add("boards", recent("boards", boardsLibrary));
        add("power", recent("power", powerLibrary));
        return all.sort((a, b) => (dateKey(b.item.year) ?? 0) - (dateKey(a.item.year) ?? 0)).slice(0, 30);
    }, [category, search, searching, pedalsLibrary, boardsLibrary, powerLibrary, newPedals, t]);

    const goBack = () => { setView("catalog"); setFinderMenuOpen(false); };
    const chooseCategory = (next: Category) => { setCategory(next); setView("catalog"); setFinderMenuOpen(false); };
    const openFinder = (next: "boardFinder" | "powerFinder") => {
        setFinderMenuOpen(false);
        setBoardSearch(""); setPowerSearch("");
        setView(next);
    };
    const categories: { id: Category; label: string }[] = [
        { id: "all", label: "All" }, { id: "pedals", label: t("sidebar.pedals") },
        { id: "boards", label: t("sidebar.boards") }, { id: "power", label: t("sidebar.power") },
    ];
    const finderButton = (kind: "boardFinder" | "powerFinder", label: string) => (
        <button type="button" onClick={() => openFinder(kind)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-2 text-[11px] font-bold text-white hover:bg-blue-500">
            <WandSparkles size={15} />{label}
        </button>
    );

    return <div className="mt-4 flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide">{view === "catalog" ? "Add Gear" : view === "custom" ? t("sidebar.custom") : view === "boardFinder" ? "Board Finder" : "Power Finder"}</span>
            {view !== "catalog" && <button type="button" onClick={goBack} className="flex items-center gap-1 text-[11px] font-bold"><ArrowLeft size={14} />Back</button>}
        </div>

        {view === "catalog" && <>
            <div className="relative shrink-0">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} type="search" autoComplete="off" spellCheck={false}
                    placeholder="Search pedals, boards, power..."
                    className="h-9 w-full rounded-md bg-white pl-9 pr-9 text-[12px] font-bold text-black outline-none placeholder:text-zinc-500" />
                {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"><X size={16} /></button>}
            </div>
            <div className="grid shrink-0 grid-cols-4 gap-1">
                {categories.map(tab => <button key={tab.id} type="button" onClick={() => chooseCategory(tab.id)} aria-pressed={category === tab.id}
                    className={`min-w-0 rounded-md px-1 py-2 text-[10px] font-bold transition-colors ${category === tab.id ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}>{tab.label}</button>)}
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2">
                <span className="text-[11px] font-bold">{searching ? `${entries.length} results` : "New releases"}</span>
                {category === "boards" ? finderButton("boardFinder", "Board Finder") : category === "power" ? finderButton("powerFinder", "Power Finder") :
                    category === "all" ? <div className="relative"><button type="button" onClick={() => setFinderMenuOpen(value => !value)} aria-expanded={finderMenuOpen}
                        className="flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-2 text-[11px] font-bold text-white"><WandSparkles size={15} />Finders</button>
                        {finderMenuOpen && <div className="absolute right-0 top-full z-30 mt-1 flex w-40 flex-col gap-1 rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
                            <button type="button" onClick={() => openFinder("boardFinder")} className="rounded p-2 text-left text-[11px] hover:bg-zinc-700">Board Finder</button>
                            <button type="button" onClick={() => openFinder("powerFinder")} className="rounded p-2 text-left text-[11px] hover:bg-zinc-700">Power Finder</button>
                        </div>}</div> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar pb-5">
                {(libraryLoading || newPedalsLoading) && !entries.length && <p className="p-3 text-[11px]">Loading...</p>}
                {libraryError && searching && <p className="p-3 text-[11px] text-red-400">{libraryError}</p>}
                {!entries.length && !libraryLoading && !newPedalsLoading && <p className="p-3 text-[11px] text-zinc-400">No results</p>}
                <div className="flex flex-col gap-1">
                    {entries.map(({ kind, item }, index) => {
                        const icon = kind === "pedals" ? <SlidersHorizontal size={19} /> : kind === "boards" ? <LayoutPanelTop size={19} /> : <BatteryCharging size={19} />;
                        const image = item.thumbnail || item.image_url || item.image || null;
                        return <button type="button" key={`${kind}-${item.id ?? `${item.brand}-${item.name}`}-${index}`}
                            onClick={() => kind === "pedals" ? addPedal(item) : kind === "boards" ? selectBoard(item) : addPower(item)}
                            className="flex min-h-[50px] w-full items-center gap-2 rounded-lg bg-zinc-800 p-1.5 text-left hover:bg-zinc-700">
                            <span className="flex h-[40px] w-[58px] shrink-0 items-center justify-center overflow-hidden text-zinc-400">
                                {image ? <img src={String(image)} alt="" loading="lazy" className="max-h-[38px] max-w-[56px] object-contain" /> : icon}
                            </span>
                            <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-black">{item.brand}</span>
                                <span className="block truncate text-[10px] font-bold text-zinc-300">{item.name}</span></span>
                            <span className="shrink-0 rounded bg-zinc-700 px-1.5 py-1 text-[9px] font-bold uppercase text-zinc-300">{kind === "pedals" ? "Pedal" : kind === "boards" ? "Board" : "Power"}</span>
                        </button>;
                    })}
                </div>
                <button type="button" onClick={() => setView("custom")} className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-3 py-3 text-left text-[11px] font-bold hover:bg-zinc-800"><Plus size={16} />{t("sidebar.custom")}</button>
                <button type="button" onClick={onOpenGear} className="mt-2 w-full text-left text-[10px] font-bold text-zinc-400 hover:text-white">Open gear catalog</button>
            </div>
        </>}

        {view === "custom" && <div className="min-h-0 flex-1 overflow-y-auto">{customPanel}</div>}
        {view === "boardFinder" && <div className="min-h-0 flex-1"><SearchBoards
            boardsLibrary={boardsLibrary} catalogStatus={boardsStatus} boardSearch={boardSearch} setBoardSearch={setBoardSearch}
            showBoardResults={showBoardResults} setShowBoardResults={setShowBoardResults} setShowPedalResults={setShowPedalResults}
            selectBoard={selectBoard} selectSuggestedBoard={selectSuggestedBoard} finderPedals={finderPedals}
            existingBoards={existingBoards} units={units} boardInputRef={boardInputRef} t={t} groupItems={groupItems} /></div>}
        {view === "powerFinder" && <div className="min-h-0 flex-1"><SearchPower
            catalogStatus={powerStatus} pedalsLoading={libraryLoading} finderPedals={finderPedals}
            existingBoards={powerFinderBoards} pedalsLibrary={pedalsLibrary} powerLibrary={powerLibrary}
            powerSearch={powerSearch} setPowerSearch={setPowerSearch} showPowerResults={showPowerResults}
            setShowPowerResults={setShowPowerResults} setShowPedalResults={setShowPedalResults}
            setShowBoardResults={setShowBoardResults} addPower={addPower} powerInputRef={powerInputRef}
            powerDropdownRef={powerDropdownRef} t={t} groupItems={groupItems} /></div>}
    </div>;
}
