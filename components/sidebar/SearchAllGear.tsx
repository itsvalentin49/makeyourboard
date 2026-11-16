
"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, BookOpen, LoaderCircle, Plus, Search, WandSparkles, X } from "lucide-react";
import SearchBoards from "./SearchBoards";
import SearchPower from "./SearchPower";
import { compareGearRelease, gearEntries, gearKey, gearSearchScore, normalizeGear, type GearCategory, type GearKind } from "@/utils/gearCatalog"; import { isPowerSupply, isPowerUnderBoard, physicalPedals } from "@/utils/boardFinder";
import type { CatalogStatus } from "@/hooks/useLibrary";
import type { AnyRow } from "@/types/project";
import styles from "./GearCatalog.module.css";


type Props = {
  pedalsLibrary: AnyRow[];
  boardsLibrary: AnyRow[];
  powerLibrary: AnyRow[];
  newPedals: AnyRow[];
  newBoards: AnyRow[];
  newPower: AnyRow[];
  newGearLoading: boolean;
  libraryLoading: boolean;
  libraryError: string | null;
  boardsStatus: CatalogStatus;
  powerStatus: CatalogStatus;
  finderPedals: AnyRow[];
  existingBoards: AnyRow[];
  powerFinderBoards: AnyRow[];
  selectSuggestedBoard?: (board: AnyRow, allowRearrangement?: boolean, powerUnderBoard?: boolean) => boolean;
  addItem: (kind: GearKind, item: AnyRow) => void;
  customPanel: ReactNode;
  onOpenGear: (query: string, category: GearCategory) => void;
  t: (key: string) => string;
  units: "metric" | "imperial";
  groupItems: (items: AnyRow[], filter: string) => Record<string, AnyRow[]>;
};

const PAGE_SIZE = 24;
const ignore = () => { };

const compareStableGearRelease = (
  a: ReturnType<typeof gearEntries>[number],
  b: ReturnType<typeof gearEntries>[number]
) => {
  const releaseOrder = compareGearRelease(a, b);
  if (releaseOrder !== 0) return releaseOrder;
  return gearKey(a).localeCompare(gearKey(b));
};

export default function SearchAllGear({
  pedalsLibrary, boardsLibrary, powerLibrary, newPedals, newBoards, newPower, newGearLoading,
  libraryLoading, libraryError, boardsStatus, powerStatus, finderPedals, existingBoards,
  powerFinderBoards, selectSuggestedBoard, addItem, customPanel, onOpenGear, t, units, groupItems,
}: Props) {
  const [category, setCategory] = useState<GearCategory>("all");
  const [view, setView] = useState<"catalog" | "boardFinder" | "powerFinder" | "custom">("catalog");
  const [allowRearrangement, setAllowRearrangement] = useState(false);
  const [powerUnderBoard, setPowerUnderBoard] = useState<boolean>();
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const finderInput = useRef<HTMLInputElement>(null);
  const finderDropdown = useRef<HTMLDivElement>(null);
  const deferredQuery = query;
  const hasQuery = query.trim().length > 0;

  const status = { pedals: libraryLoading ? "loading" : libraryError ? "error" : "ready", boards: boardsStatus, power: powerStatus };
  const relevantStatuses = category === "all" ? Object.values(status) : [status[category]];
  const loading = relevantStatuses.includes("loading");
  const failed = relevantStatuses.includes("error");
  const allCatalogsSettled = !libraryLoading && boardsStatus !== "loading" && powerStatus !== "loading";


  const entries = useMemo(() =>
    gearEntries({ pedals: pedalsLibrary, boards: boardsLibrary, power: powerLibrary }, t).sort(compareStableGearRelease),
    [pedalsLibrary, boardsLibrary, powerLibrary, t]);

  const newEntries = useMemo(() =>
    gearEntries({ pedals: newPedals, boards: newBoards, power: newPower }, t).sort(compareStableGearRelease),
    [newPedals, newBoards, newPower, t]);


  const displayEntries = useMemo(() => {
    if (hasQuery) return entries;
    if (!allCatalogsSettled) return newGearLoading ? [] : newEntries;

    const merged = new Map<string, (typeof entries)[number]>();
    for (const entry of entries) merged.set(gearKey(entry), entry);
    for (const entry of newEntries) {
      const key = gearKey(entry);
      if (!merged.has(key)) merged.set(key, entry);
    }
    return Array.from(merged.values()).sort(compareStableGearRelease)
  }, [hasQuery, entries, newEntries, newGearLoading, allCatalogsSettled]);


  const results = useMemo(() => {
    const terms = normalizeGear(deferredQuery).trim().split(/\s+/).filter(Boolean);

    const filtered = displayEntries.filter(
      (entry) =>
        (category === "all" || entry.kind === category) &&
        terms.every((term) => entry.searchText.includes(term))
    );

    if (!terms.length) return filtered;

    return filtered.sort((a, b) => {
      const scoreA = gearSearchScore(a, deferredQuery);
      const scoreB = gearSearchScore(b, deferredQuery);

      if (scoreA !== scoreB) return scoreB - scoreA;

      return compareStableGearRelease(a, b);
    });
  }, [category, deferredQuery, displayEntries]);


  const showResults = hasQuery || !newGearLoading || allCatalogsSettled;
  const canFind = physicalPedals(finderPedals).length >= 2;
  const isBoardFinder = view === "boardFinder";
  const isPowerFinder = view === "powerFinder";
  const isFinder = isBoardFinder || isPowerFinder;
  const powerSupplies = finderPedals.filter(isPowerSupply);
  const allPowerUnderBoard = powerSupplies.length > 0 &&
    powerSupplies.every((supply) => isPowerUnderBoard(supply, existingBoards));
  const back = () => setView("catalog");
  const updateQuery = (value: string) => {
    if (isFinder) back();
    setQuery(value);
    setLimit(PAGE_SIZE);
    list.current?.scrollTo(0, 0);
  };

  if (view === "custom") return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <button type="button" onClick={back} className={styles.sidebarUtility}><ArrowLeft size={15} />{t("gear.allGear")}</button>
      <div className="min-h-0 flex-1 overflow-y-auto">{customPanel}</div>
    </div>
  );

  return (
    <div className={styles.sidebarLibrary}>
      <h2 className="text-[11px] font-black uppercase tracking-wide">{t("gear.allGear")}</h2>
      <div className={styles.sidebarSearchRow}>
        <div className={styles.sidebarSearch}>
          <Search size={15} aria-hidden="true" />
          <input ref={input} type="search" value={query} autoComplete="off" spellCheck={false}
            aria-label={t("gear.searchAll")} placeholder={t("gear.searchAll")}
            onChange={(event) => updateQuery(event.target.value)} />
          {query && <button type="button" onClick={() => { updateQuery(""); input.current?.focus(); }}
            aria-label={t("powerMenu.clearSearch")}><X size={16} /></button>}
        </div>
        <button type="button" className={styles.shortcut}
          onClick={() => isFinder ? back() : onOpenGear(query, category)}
          aria-label={t(isFinder ? "sidebar.back" : "gear.openAll")}
          title={t(isFinder ? "sidebar.back" : "gear.openAll")}>
          {isFinder ? <ArrowLeft size={20} aria-hidden="true" /> : <BookOpen size={20} aria-hidden="true" />}
        </button>
      </div>

      {isBoardFinder ? (
        <div className={styles.sidebarFinders}>
          <label className={styles.sidebarRearrange}>
            <input type="checkbox" checked={allowRearrangement} className="accent-blue-600"
              onChange={(event) => setAllowRearrangement(event.target.checked)} />
            {t("boardFinder.allowRearrangement")}
          </label>
          {powerSupplies.length > 0 && (
            <label className={styles.sidebarRearrange}>
              <input type="checkbox" checked={powerUnderBoard ?? allPowerUnderBoard} className="accent-blue-600"
                onChange={(event) => setPowerUnderBoard(event.target.checked)} />
              {t("boardFinder.powerUnderBoard")}
            </label>
          )}
        </div>
      ) : isPowerFinder ? (
        <div className={styles.sidebarFinderSpacer} aria-hidden="true" />
      ) : canFind && (
        <div className={styles.sidebarFinders}>
          <button type="button" className={styles.sidebarUtility} disabled={!selectSuggestedBoard || boardsStatus !== "ready"}
            onClick={() => {
              setAllowRearrangement(false);
              setPowerUnderBoard(undefined);
              setView("boardFinder");
            }}><WandSparkles size={14} />{t("boardFinder.button")}</button>
          <button type="button" className={styles.sidebarUtility} disabled={libraryLoading || powerStatus !== "ready"}
            onClick={() => setView("powerFinder")}><WandSparkles size={14} />{t("gear.powerFinder")}</button>
        </div>
      )}

      {isBoardFinder ? (
        <SearchBoards boardsLibrary={boardsLibrary} catalogStatus={boardsStatus}
          boardSearch="" setBoardSearch={ignore} showBoardResults={false} setShowBoardResults={ignore}
          setShowPedalResults={ignore} selectBoard={ignore} selectSuggestedBoard={selectSuggestedBoard}
          finderPedals={finderPedals} existingBoards={existingBoards} units={units}
          boardInputRef={finderInput} t={t} groupItems={groupItems}
          finderRearrangement={allowRearrangement} powerUnderBoard={powerUnderBoard} />
      ) : isPowerFinder ? (
        <SearchPower catalogStatus={powerStatus} pedalsLoading={libraryLoading} finderPedals={finderPedals}
          existingBoards={powerFinderBoards} pedalsLibrary={pedalsLibrary} powerLibrary={powerLibrary}
          powerSearch="" setPowerSearch={ignore} showPowerResults={false} setShowPowerResults={ignore}
          setShowPedalResults={ignore} setShowBoardResults={ignore} addPower={(item) => addItem("power", item)}
          powerInputRef={finderInput} powerDropdownRef={finderDropdown} t={t} groupItems={groupItems}
          embeddedFinder />
      ) : (
        <>
          <div ref={list} className={`${styles.sidebarResults} mt-4`}>
            {!hasQuery && <p className="mb-2 text-[11px] font-bold">{t("gear.newestFirst")}</p>}

            {loading && hasQuery && (
              <p className={`${styles.loading} text-[11px] font-bold`} role="status">
                <LoaderCircle size={16} className="animate-spin" />
                {t("gear.loadingAll")}
              </p>
            )}
            {failed && hasQuery && <p className={`${styles.status} text-[11px] font-bold`} role="status">{t("gear.loadError")}</p>}
            {hasQuery && !loading && !failed && !results.length &&
              <p className={`${styles.status} text-[11px] font-bold`} role="status">{t("gear.emptyAll")}</p>}

            {showResults && results.slice(0, limit).map((entry) => {
              const { item, kind } = entry;
              const source = [item.thumbnail, item.image, item.image_url, item.photo]
                .find((value) => typeof value === "string" && value.trim() && value.trim().toUpperCase() !== "N/A");
              return (
                <button type="button" key={gearKey(entry)} className={styles.sidebarCard} onClick={() => addItem(kind, item)}>
                  <span className={styles.sidebarPhoto} onContextMenu={(event) => event.preventDefault()}>
                    {source && <img src={source} alt="" loading="lazy" draggable={false} />}
                  </span>
                  <span className={styles.sidebarCardText}>
                    <strong>{item.name}</strong>
                    <span>{entry.brand}</span>
                  </span>
                  <Plus size={15} aria-hidden="true" className={styles.sidebarAddIcon} />
                </button>
              );
            })}
            {showResults && results.length > limit &&
              <button type="button" className={styles.more} onClick={() => setLimit(limit + PAGE_SIZE)}>{t("gear.moreAll")}</button>}
          </div>
          <button type="button" className={styles.sidebarCustom} onClick={() => setView("custom")}>
            <Plus size={16} aria-hidden="true" />{t("sidebar.custom")}
          </button>
        </>
      )}
    </div>
  );
}
