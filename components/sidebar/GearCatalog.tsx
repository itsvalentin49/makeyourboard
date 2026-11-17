"use client";

import { createPortal } from "react-dom";
import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, List, LoaderCircle, Minus, Play, Plus, Search, X } from "lucide-react"; import type { AnyRow, BoardItem } from "@/types/project";
import type { Language } from "@/utils/i18n";
import { getCustomImageUrl } from "@/utils/customImageStore";
import { parsePedalJackLocations, resolveCustomPedalLayout } from "@/utils/customPedalLayout";
import { CustomPedalVisual } from "./CustomPanel";
import PedalSpecs, { getHeroImageCandidates, PedalRetailers, splitTags } from "./SpecsPedals";
import SidebarLogo from "./SidebarLogo";
import styles from "./GearCatalog.module.css";
import BoardSpecs from "./SpecsBoards";
import PowerSpecs from "./SpecsPower";
import type { CatalogStatus } from "@/hooks/useLibrary";
import { compareGearRelease, gearEntries, gearKey, gearKinds, normalizeGear as normalize, type GearCategory, type GearEntry, type GearKind } from "@/utils/gearCatalog";

type Props = {
  pedals: AnyRow[];
  boards: AnyRow[];
  power: AnyRow[];
  newPedals: AnyRow[];
  newBoards: AnyRow[];
  newPower: AnyRow[];
  newGearLoading: boolean;
  boardsStatus: CatalogStatus;
  powerStatus: CatalogStatus;
  initialCategory?: GearCategory;
  initialDetailItem?: AnyRow | null;
  loading: boolean;
  error: string | null;
  initialQuery: string;
  language: Language;
  units: "metric" | "imperial";
  isUSA: boolean;
  embedded?: boolean;
  isEurope: boolean;
  onDetailChange?: (isOpen: boolean) => void;
  compactPedalDetails?: boolean;
  onCatalogPedalChange?: (pedal: AnyRow | null, kind?: GearKind) => void;
  desktopSidebarMode?: boolean;
  catalogVisible?: boolean;
  preserveInitialSelection?: boolean;
  onFirstCatalogPedal?: (pedal: AnyRow) => void;
  relatedSidebarHost?: HTMLDivElement | null;
  sidebarRecommendationPedal?: AnyRow | null;
  detailBackRef?: React.MutableRefObject<(() => void) | null>;
  buildThomannUrl: (slug: string) => string;
  t: (key: string) => string;
  onClose: () => void;
  onOpenCustom?: () => void;
  customOpen?: boolean;
  customPanel?: React.ReactNode;
  onAdd: (kind: GearKind, item: AnyRow) => void;
  replacement?: { pedal: BoardItem };
};

const PAGE_SIZE = 36;
function levenshteinDistance(a: string, b: string): number {
  let previous = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= a.length; i++) {
    const current = [i];

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] +
        (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    previous = current;
  }

  return previous[b.length];
}
const SPEC_FILTERS = [
  { field: "circuit", label: "pedal.circuit.label" },
  { field: "bypass", label: "pedal.bypass.label" },
  { field: "origin", label: "pedal.origin" },
] as const;

type SpecField = (typeof SPEC_FILTERS)[number]["field"];
type SpecSelection = Partial<Record<SpecField, string[]>>;

function specValue(value: unknown) {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return text.toUpperCase() === "N/A" ? "" : text;
}

function blockImageMenu(event: MouseEvent) {
  event.preventDefault();
}

function GearImage({ pedal, detail = false, customUrl }: { pedal: AnyRow; detail?: boolean; customUrl?: string }) {
  const sources = [...new Set([customUrl, ...getHeroImageCandidates(pedal), pedal.thumbnail])]
    .filter((source): source is string => typeof source === "string" && Boolean(source.trim()) && source.trim().toUpperCase() !== "N/A");
  const [index, setIndex] = useState(0);

  return sources[index] ? (
    <img
      className={styles.gearPhoto}
      src={sources[index]}
      alt=""
      draggable={false}
      loading={detail ? "eager" : "lazy"}
      decoding="async"
      onError={() => setIndex(index + 1)}
    />
  ) : <BookOpen size={30} className={styles.placeholder} aria-hidden="true" />;
}

function ReplacementArt({ pedal }: { pedal: BoardItem }) {
  const [customUrl, setCustomUrl] = useState<string>();
  const imageId = typeof pedal.imageId === "string" ? pedal.imageId : undefined;

  useEffect(() => {
    if (!imageId) return;
    let active = true;
    let objectUrl: string | null = null;

    getCustomImageUrl(imageId).then((url) => {
      if (!url) return;
      if (!active) {
        URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setCustomUrl(url);
    }).catch(() => { /* The image renderer provides a fallback. */ });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  const width = Number(pedal.width);
  const depth = Number(pedal.depth);
  const renderCustom = pedal.slug === "custom" && Number.isFinite(width) && width > 0 && Number.isFinite(depth) && depth > 0;

  return (
    <div className={styles.replacementArt} aria-hidden="true" onContextMenu={blockImageMenu}>
      <div className={styles.replacementSource}>
        {renderCustom ? (
          <CustomPedalVisual widthMm={width} depthMm={depth} scale={Math.min(118 / width, 142 / depth)}
            customColor={String(pedal.color ?? "")} customName={String(pedal.name ?? "")}
            jackLocations={parsePedalJackLocations(pedal.jacksLocation || pedal.jacks)}
            layout={resolveCustomPedalLayout(pedal.customLayout, width, depth)} />
        ) : <GearImage key={customUrl ?? "default"} pedal={pedal} detail customUrl={customUrl} />}
      </div>
      <ArrowRight className={styles.replacementArrow} size={28} />
      <div className={styles.replacementSilhouette}>
        <span>?</span>
      </div>
    </div>
  );
}

const TU3_BOSS_VIDEO = "37jXn9KUL44";

const TU3_ARTISTS = [
  "John Frusciante",
  "Dave Grohl",
  "Jack White",
  "Slash",
  "James Hetfield",
  "Kevin Parker",
  "Alex Turner",
  "Billie Joe Armstrong",
  "Flea",
  "Matthew Bellamy",
  "Tom Morello",
  "Mac DeMarco",
  "Dan Auerbach",
  "Johnny Marr",
  "Steve Vai",
  "Ed Sheeran",
  "John Petrucci",
  "Robert Smith",
];

function Tu3OfficialDemo({ t }: { t: Props["t"] }) {
  const [playing, setPlaying] = useState(false);
  const title = t("gearTu3.officialDemo");

  return (
    <section className={styles.tu3Video}>
      <h2 className={styles.storeTitle}>{title}</h2>
      {playing ? (
        <iframe
          className={styles.pilotPlayer}
          src={`https://www.youtube-nocookie.com/embed/${TU3_BOSS_VIDEO}?autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button type="button" className={styles.pilotPlay} aria-label={title} onClick={() => setPlaying(true)}>
          <img src={`https://i.ytimg.com/vi/${TU3_BOSS_VIDEO}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" draggable={false} />
          <span className={styles.pilotPlayIcon}><Play size={22} fill="currentColor" aria-hidden="true" /></span>
        </button>
      )}
    </section>
  );
}

type FilterOption = { value: string; label: string };

function MultiFilter({ label, all, options, selected, onChange, searchLabel, single = false, hideSearch = false }: {
  label: string;
  all: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchLabel: string;
  single?: boolean;
  hideSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const term = normalize(query.trim());
  const summary = options.filter(({ value }) => selected.includes(value)).map(({ label }) => label).join(", ");

  return (
    <div className={styles.filterField}>
      <span>{label}</span>
      <details className={styles.multiFilter}>
        <summary aria-label={label} title={summary || all}>
          <span>{summary || all}</span>
          {selected.length > 1 && <small>{selected.length}</small>}
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className={styles.filterPanel}>
          {!hideSearch && (
            <input
              className={styles.filterSearch}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchLabel}
              aria-label={`${label} · ${searchLabel}`}
            />
          )}
          <fieldset className={styles.filterOptions} aria-label={label}>
            <label className={styles.filterOption}>
              <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
              <span>{all}</span>
            </label>
            {options.filter(({ label }) => normalize(label).includes(term)).map(({ value, label }) => (
              <label key={value} className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={selected.includes(value)}
                  onChange={(event) =>
                    onChange(
                      single
                        ? event.target.checked ? [value] : []
                        : event.target.checked
                          ? [...selected, value]
                          : selected.filter((item) => item !== value)
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </details>
    </div>
  );
}

export default function GearCatalog({
  pedals, boards, power, newPedals, newBoards, newPower, newGearLoading,
  loading, error, boardsStatus, powerStatus, initialCategory = "all", initialDetailItem = null, initialQuery, language, units, isUSA, isEurope,
  buildThomannUrl, t, onClose, onAdd, replacement, embedded = false,
  onDetailChange,
  compactPedalDetails = false,
  onCatalogPedalChange,
  desktopSidebarMode = false,
  catalogVisible = false,
  preserveInitialSelection = false,
  onFirstCatalogPedal,
  relatedSidebarHost = null,
  sidebarRecommendationPedal = null,
  detailBackRef,
  onOpenCustom,
  customOpen = false,
  customPanel,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const detailHeading = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [gridColumns, setGridColumns] = useState(8);
  const [coveredCards, setCoveredCards] = useState(0);
  const previousCard = useRef<string | null>(null);
  const catalogScroll = useRef(0);
  const [query, setQuery] = useState(initialQuery);
  const [selectedBrands, setBrands] = useState<string[]>([]);
  const [typeSelection, setTypes] = useState<string[] | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<SpecSelection>({});
  const [sort, setSort] = useState("recent");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [sameBrandRows, setSameBrandRows] = useState(2);
  const [sameTypeRows, setSameTypeRows] = useState(4);
  const sameBrandGrid = useRef<HTMLDivElement>(null);
  const sameTypeGrid = useRef<HTMLDivElement>(null);
  const [relatedColumns, setRelatedColumns] = useState({ sameBrand: 8, sameType: 8 });
  const [selection, setSelected] = useState<GearEntry | null>(null);
  const [category, setCategory] = useState<GearCategory>(replacement ? "pedals" : initialCategory);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const selected = selection?.item;
  const replacementId = replacement?.pedal.instanceId;
  const previousReplacementId = useRef(replacementId);
  useEffect(() => {
    const wasReplacing = previousReplacementId.current !== undefined;
    previousReplacementId.current = replacementId;
    if (replacementId === undefined && !wasReplacing) return;
    setQuery(initialQuery);
    setCategory(replacementId === undefined ? initialCategory : "pedals");
    setSelected(null);
    setBrands([]);
    // Keep the exact primary effect type for the initial replacement search.
    // A manual query change releases the automatic type filter.
    setTypes(replacementId === undefined ? [] : null);
    setSelectedSpecs({});
    setLimit(PAGE_SIZE);
    if (content.current) content.current.scrollTop = 0;
  }, [replacementId, initialQuery, initialCategory]);
  // Keep the desktop specifications sidebar synced with the catalog selection.
  useEffect(() => {
    // Desktop selection is sent explicitly when opening or clicking a card.
    // Hidden catalog state must not override a canvas selection.
    if (desktopSidebarMode) return;
    onCatalogPedalChange?.(selection?.kind === "pedals" ? selection.item : null);
  }, [selection, onCatalogPedalChange, desktopSidebarMode]);
  useEffect(() => {
    if (!detailBackRef) return;

    detailBackRef.current = () => {
      if (initialDetailItem) {
        onClose();
      } else {
        setSelected(null);
      }
    };

    return () => {
      detailBackRef.current = null;
    };
  }, [detailBackRef, initialDetailItem, onClose]);
  useEffect(() => {
    onDetailChange?.(selection !== null);
  }, [selection, onDetailChange]);
  const statuses = category === "all" ? [boardsStatus, powerStatus] :
    category === "boards" ? [boardsStatus] : category === "power" ? [powerStatus] : [];
  const catalogLoading = (category === "all" || category === "pedals") && loading || statuses.includes("loading");
  const catalogError = ((category === "all" || category === "pedals") && Boolean(error)) || statuses.includes("error");
  const searchLabel = t(replacement ? "gear.search" : "gear.searchAll");
  const addSelected = () => {
    if (selection) onAdd(selection.kind, selection.item);
  };

  const selectSimilarBoard = (board: AnyRow) => {
    const entry = catalog.find(
      (entry) =>
        entry.kind === "boards" &&
        (
          entry.item === board ||
          (
            entry.item.id != null &&
            board.id != null &&
            String(entry.item.id) === String(board.id)
          ) ||
          (
            entry.item.brand === board.brand &&
            entry.item.name === board.name
          )
        )
    );

    if (!entry) return;

    setSelected(entry);

    if (desktopSidebarMode) {
      onCatalogPedalChange?.(entry.item, "boards");
    }
  };
  const addLabel = t(replacement ? "replacement.previewAction" : "customPanel.addToBoard");
  const deferredQuery = useDeferredValue(query);
  const hasReplacementType = splitTags(replacement?.pedal.type).length > 0;
  const showTu3Pilot = !replacement && selection?.kind === "pedals" && selected &&
    normalize(String(selected.brand ?? "").trim()) === "boss" &&
    /^tu-3(?: chromatic tuner)?$/i.test(String(selected.name ?? "").trim());
  const labelType = (tag: string) => {
    const key = `pedal.type.${tag}`;
    const label = t(key);
    return label === key ? tag : label;
  };

  useLayoutEffect(() => {
    if (embedded) return;

    const element = dialog.current;
    element?.showModal();
    heading.current?.focus({ preventScroll: true });

    return () => element?.close();
  }, [embedded]);

  useLayoutEffect(() => {
    if (!desktopSidebarMode || !catalogVisible) return;

    const frame = window.requestAnimationFrame(() => {
      search.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [desktopSidebarMode, catalogVisible]);

  useLayoutEffect(() => {
    const scroller = content.current;
    if (!scroller || desktopSidebarMode) return;

    if (selected) {
      scroller.scrollTop = 0;
      detailHeading.current?.focus({ preventScroll: true });
    } else if (previousCard.current) {
      scroller.scrollTop = catalogScroll.current;
      scroller.querySelector<HTMLButtonElement>(
        `[data-gear-card="${CSS.escape(previousCard.current)}"]`,
      )?.focus({ preventScroll: true });
    }
  }, [selected, desktopSidebarMode]);

  useLayoutEffect(() => {
    const element = grid.current;
    if (!element || !selected) return;
    const update = () => {
      if (!element.clientWidth) return;
      const columns = getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length;
      setCoveredCards(columns * 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [selected]);

  const catalog = useMemo(() => gearEntries({
    pedals,
    boards: replacement ? [] : boards,
    power: replacement ? [] : power,
  }, t), [pedals, boards, power, replacement, t]);

  const newCatalog = useMemo(() => gearEntries({
    pedals: newPedals,
    boards: replacement ? [] : newBoards,
    power: replacement ? [] : newPower,
  }, t), [newPedals, newBoards, newPower, replacement, t]);

  const fullCatalogReady =
    !loading &&
    boardsStatus !== "loading" &&
    powerStatus !== "loading";

  const displayCatalog = useMemo(() => {
    if (replacement || fullCatalogReady) return catalog;

    const merged = new Map<string, GearEntry>();

    for (const entry of newCatalog) {
      merged.set(gearKey(entry), entry);
    }

    return [...merged.values()].sort(compareGearRelease);
  }, [replacement, fullCatalogReady, catalog, newCatalog]);

  // Ouvre une fiche demandée depuis le canvas mobile, une seule fois.
  const initialDetailHandled = useRef(false);
  useEffect(() => {
    if (!initialDetailItem || initialDetailHandled.current) return;

    const slug = normalize(String(initialDetailItem.slug ?? ""));
    const brand = normalize(String(initialDetailItem.brand ?? ""));
    const name = normalize(String(initialDetailItem.name ?? ""));

    const match = catalog.find((entry) => {
      if (entry.kind !== "pedals") return false;
      const item = entry.item;
      const entrySlug = normalize(String(item.slug ?? ""));
      const entryBrand = normalize(String(item.brand ?? ""));
      const entryName = normalize(String(item.name ?? ""));
      if (slug && entrySlug && slug === entrySlug && brand === entryBrand) return true;
      return Boolean(brand && name && entryBrand === brand && entryName === name);
    });

    if (match) {
      initialDetailHandled.current = true;
      previousCard.current = null;
      setSelected(match);
    } else if (fullCatalogReady) {
      initialDetailHandled.current = true;
    }
  }, [initialDetailItem, catalog, fullCatalogReady]);

  const categoryEntries = useMemo(() => category === "all" ? displayCatalog :
    displayCatalog.filter((entry) => entry.kind === category), [displayCatalog, category]);

  const collator = useMemo(() => new Intl.Collator(language, { sensitivity: "base", numeric: true }), [language]);
  const brands = useMemo(() =>
    [...new Set(categoryEntries.map((entry) => entry.brand).filter(Boolean))]
      .sort(collator.compare).map((value) => ({ value, label: value })), [categoryEntries, collator]);
  const types = useMemo(() =>
    [...new Set(categoryEntries.flatMap((entry) => entry.tags))]
      .map((value) => {
        const key = `pedal.type.${value}`;
        const label = t(key);
        return { value, label: label === key ? value : label };
      })
      .sort((a, b) => collator.compare(a.label, b.label)), [categoryEntries, collator, t]);

  const specOptions = useMemo(() => SPEC_FILTERS.map(({ field, label }) => {
    const options = new Map<string, FilterOption>();
    for (const { item } of categoryEntries) {
      const raw = specValue(item[field]);
      if (!raw) continue;

      const value = raw.toLowerCase();
      if (options.has(value)) continue;
      const key = `pedal.${field}.${raw}`;
      const translated = field === "origin" ? raw : t(key);
      options.set(value, { value, label: translated === key ? raw : translated });
    }
    return { field, label: t(label), options: [...options.values()].sort((a, b) => collator.compare(a.label, b.label)) };
  }), [categoryEntries, collator, t]);

  const selectedTypes = useMemo(() => {
    if (typeSelection) return typeSelection;
    const defaultType = splitTags(replacement?.pedal.type)
      .map((tag) => types.find(({ value }) => value.toLowerCase() === tag.toLowerCase())?.value)
      .find(Boolean);
    return defaultType ? [defaultType] : [];
  }, [replacement?.pedal.type, types, typeSelection]);

  const results = useMemo(() => {
    const terms = normalize(deferredQuery).trim().split(/\s+/).filter(Boolean);
    const activeSpecs = SPEC_FILTERS.filter(({ field }) => selectedSpecs[field]?.length);
    const filtered = categoryEntries.filter((entry) =>
      (!selectedBrands.length || selectedBrands.includes(entry.brand)) &&
      (!selectedTypes.length || entry.tags.some((tag) => selectedTypes.includes(tag))) &&
      activeSpecs.every(({ field }) => selectedSpecs[field]?.includes(specValue(entry.item[field]).toLowerCase())) &&
      (terms.every((term) => entry.searchText.includes(term)) || (() => {
        // Fallback when the displayed, translated effect type is not already indexed.
        const translatedTags = entry.tags.map((tag) => {
          const key = `pedal.type.${tag}`;
          const label = t(key);
          return label === key ? tag : label;
        }).join(" ");
        const searchText = normalize(`${entry.searchText} ${entry.tags.join(" ")} ${translatedTags}`);
        return terms.every((term) => searchText.includes(term));
      })()));
    return filtered.sort((a, b) => {
      const releaseOrder = sort === "recent"
        ? compareGearRelease(a, b)
        : 0;
      return releaseOrder || collator.compare(a.brand, b.brand) ||
        collator.compare(String(a.item.name ?? ""), String(b.item.name ?? ""));
    });
  }, [categoryEntries, deferredQuery, selectedBrands, selectedTypes, selectedSpecs, sort, collator, t]);

  // Only choose the newest database pedal when opening with an empty sidebar.
  const initialCatalogSelectionDone = useRef(false);
  useEffect(() => {
    if (!desktopSidebarMode || !catalogVisible) {
      initialCatalogSelectionDone.current = false;
      return;
    }
    if (initialCatalogSelectionDone.current) return;
    if (preserveInitialSelection || replacement) {
      initialCatalogSelectionDone.current = true;
      return;
    }
    // Use the same recent entries as the visible grid, without waiting for
    // unrelated board/power requests to finish.
    if (!fullCatalogReady && newGearLoading) return;
    const firstPedal = [...displayCatalog]
      .filter((entry) => entry.kind === "pedals")
      .sort((a, b) => compareGearRelease(a, b) || collator.compare(a.brand, b.brand) ||
        collator.compare(String(a.item.name ?? ""), String(b.item.name ?? "")))[0];
    if (!firstPedal) return;
    initialCatalogSelectionDone.current = true;
    setSelected(firstPedal);
    onFirstCatalogPedal?.(firstPedal.item);
  }, [desktopSidebarMode, catalogVisible, preserveInitialSelection, replacement, fullCatalogReady, newGearLoading, displayCatalog, collator, onFirstCatalogPedal]);

  // On desktop, recommendations follow the product displayed in the left sidebar.
  // The All Gear grid selection, filters and scroll position remain independent.
  const recommendationSelection = useMemo(() => {
    if (!desktopSidebarMode) return selection;
    if (!sidebarRecommendationPedal) return null;
    const target = sidebarRecommendationPedal;
    const slug = normalize(String(target.slug ?? ""));
    const brand = normalize(String(target.brand ?? ""));
    const name = normalize(String(target.name ?? ""));
    const targetKind =
      target.type === "power" ? "power" : "pedals";

    return catalog.find((entry) => entry.kind === targetKind &&
      ((slug && normalize(String(entry.item.slug ?? "")) === slug && normalize(entry.brand) === brand) ||
        (normalize(entry.brand) === brand && normalize(String(entry.item.name ?? "")) === name))) ?? null;
  }, [desktopSidebarMode, sidebarRecommendationPedal, selection, catalog]);

  useEffect(() => {
    setSameBrandRows(2);
    setSameTypeRows(4);
  }, [recommendationSelection]);

  const relatedPedals = useMemo(() => {
    if (recommendationSelection?.kind === "power") {
      const selectedKey = gearKey(recommendationSelection);
      const brand = normalize(recommendationSelection.brand);

      return {
        sameBrand: catalog
          .filter(entry =>
            entry.kind === "power" &&
            gearKey(entry) !== selectedKey &&
            normalize(entry.brand) === brand
          )
          .sort(compareGearRelease),

        sameType: [],
        hasSameBrandAndType: false,
        typeLabel: "",
      };
    }
    if (!recommendationSelection || recommendationSelection.kind !== "pedals") {
      return {
        sameBrand: [],
        sameType: [],
        hasSameBrandAndType: false,
        typeLabel: "",
      };
    }

    const selectedKey = gearKey(recommendationSelection);
    const brand = normalize(recommendationSelection.brand);
    const selectedTags = splitTags(recommendationSelection.item.type).map(normalize);
    const primaryType = selectedTags[0] ?? "";

    const candidates = catalog
      .filter((entry) =>
        entry.kind === "pedals" &&
        gearKey(entry) !== selectedKey
      )
      .sort(compareGearRelease);

    const brandPedals = candidates.filter(
      (entry) => normalize(entry.brand) === brand
    );

    const sameBrandAndType = primaryType
      ? brandPedals.filter((entry) =>
        entry.tags.some((tag) => normalize(tag) === primaryType)
      )
      : [];

    const hasSameBrandAndType = sameBrandAndType.length > 0;

    const sameBrand = hasSameBrandAndType
      ? sameBrandAndType
      : brandPedals;

    // Other brands: recommend one pedal per brand (newest first).
    const seenBrands = new Set<string>();
    const sameType = primaryType
      ? candidates.filter((entry) => {
        const candidateBrand = normalize(entry.brand);
        if (
          !candidateBrand ||
          candidateBrand === brand ||
          seenBrands.has(candidateBrand) ||
          !entry.tags.some((tag) => normalize(tag) === primaryType)
        ) return false;
        seenBrands.add(candidateBrand);
        return true;
      })
      : [];

    return {
      sameBrand,
      sameType,
      hasSameBrandAndType,
      typeLabel: primaryType
        ? labelType(
          splitTags(recommendationSelection.item.type)[0]
        )
        : "",
    };
  }, [recommendationSelection, catalog, language, t]);

  // Each related gallery reserves its last cell for the "Show more" card.
  // Detect each grid separately so responsive layouts remain aligned.
  useLayoutEffect(() => {
    const measure = () => {
      const getColumns = (
        element: HTMLDivElement | null,
        fallback: number
      ) => {
        if (!element || !element.clientWidth) return fallback;

        const template = getComputedStyle(element)
          .gridTemplateColumns.trim();

        return template && template !== "none"
          ? Math.max(1, template.split(/\s+/).length)
          : fallback;
      };

      setRelatedColumns((previous) => {
        const next = {
          sameBrand: getColumns(
            sameBrandGrid.current,
            previous.sameBrand
          ),
          sameType: getColumns(
            sameTypeGrid.current,
            previous.sameType
          ),
        };

        return previous.sameBrand === next.sameBrand &&
          previous.sameType === next.sameType
          ? previous
          : next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);

    if (sameBrandGrid.current)
      observer.observe(sameBrandGrid.current);

    if (sameTypeGrid.current)
      observer.observe(sameTypeGrid.current);

    return () => observer.disconnect();
  }, [
    selection,
    recommendationSelection,
    relatedSidebarHost,
    relatedPedals.sameBrand.length,
    relatedPedals.sameType.length,
  ]);

  const relatedVisibleCount = (rows: number, total: number, columns: number) => {
    const slots = rows * Math.max(1, columns);
    // Reserve one slot for the Show more card only when items remain.
    return total >= slots ? slots - 1 : total;
  };

  const visibleSameBrand = relatedVisibleCount(
    sameBrandRows, relatedPedals.sameBrand.length, relatedColumns.sameBrand
  );
  const visibleSameType = relatedVisibleCount(
    sameTypeRows, relatedPedals.sameType.length, relatedColumns.sameType
  );

  // Reserve the final slot of a complete grid row for Show More Gear.
  // ResizeObserver keeps this correct when the responsive column count changes.
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;

    const updateColumns = () => {
      const template = getComputedStyle(element).gridTemplateColumns.trim();
      const columns = template ? template.split(/\s+/).length : 1;
      setGridColumns(Math.max(1, columns));
    };

    updateColumns();
    const observer = new ResizeObserver(updateColumns);
    observer.observe(element);
    return () => observer.disconnect();
  }, [results.length, selected, view]);

  const firstVisibleCard = selected && !desktopSidebarMode && !replacement ? coveredCards : 0;
  const requestedCards = Math.max(0, limit - firstVisibleCard);
  const fullRowsWithMore = Math.ceil((requestedCards + 1) / gridColumns);
  const visibleEnd = Math.min(
    results.length,
    firstVisibleCard + fullRowsWithMore * gridColumns - 1
  );

  const searchSuggestion = useMemo(() => {
    const term = normalize(deferredQuery).trim();

    if (
      term.length < 3 ||
      results.length > 0 ||
      !fullCatalogReady ||
      catalogError
    ) {
      return null;
    }

    const candidates = new Set<string>();

    for (const entry of categoryEntries) {
      if (entry.brand) {
        candidates.add(entry.brand);
      }

      if (entry.item.name) {
        candidates.add(String(entry.item.name));
      }

      if (entry.brand && entry.item.name) {
        candidates.add(
          `${entry.brand} ${entry.item.name}`
        );
      }
    }

    let bestMatch: string | null = null;
    let bestDistance = Infinity;

    const maxDistance =
      term.length <= 4 ? 1 :
        term.length <= 8 ? 2 : 3;

    for (const candidate of candidates) {
      const normalizedCandidate =
        normalize(candidate).trim();

      if (
        Math.abs(
          normalizedCandidate.length - term.length
        ) > maxDistance
      ) {
        continue;
      }

      const distance = levenshteinDistance(
        term,
        normalizedCandidate
      );

      if (distance === 0 || distance > maxDistance) {
        continue;
      }

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }, [
    deferredQuery,
    results.length,
    categoryEntries,
    fullCatalogReady,
    catalogError,
  ]);

  const isFiltered = Boolean(query.trim() || selectedBrands.length || selectedTypes.length ||
    Object.values(selectedSpecs).some((values) => values.length > 0));

  function changeCategory(next: GearCategory) {
    setCategory(next);
    setBrands([]);
    setTypes([]);
    setSelectedSpecs({});
    setLimit(PAGE_SIZE);
    if (selected) {
      previousCard.current = null;
      setSelected(null);
    }
  }

  function clearFilters() {
    if (!replacement) setCategory("all");
    setQuery("");
    setBrands([]);
    setTypes([]);
    setSelectedSpecs({});
    setLimit(PAGE_SIZE);
    search.current?.focus();
  }

  function renderTypeBadges(pedal: AnyRow) {
    const tags = [...new Set(splitTags(pedal.type))];
    if (!tags.length) return null;

    return (
      <span className={styles.tags}>
        {tags.map((tag) => (
          <span key={tag} className={styles.tag}>{labelType(tag)}</span>
        ))}
      </span>
    );
  }


  function card(entry: GearEntry) {
    const { item: pedal } = entry;
    const cardId = gearKey(entry);

    return (
      <button
        key={cardId}
        type="button"
        data-gear-card={cardId}
        className={styles.card}
        style={{ position: "relative" }}
        onMouseEnter={() => setHoveredCard(cardId)}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => {
          if (desktopSidebarMode && catalogVisible) {
            setHoveredCard(null);
            onAdd(entry.kind, entry.item);
            return;
          }

          previousCard.current = cardId;
          catalogScroll.current = content.current?.scrollTop ?? 0;
          setSelected(entry);

          if (desktopSidebarMode) {
            onCatalogPedalChange?.(entry.item, entry.kind);
          }
        }}
      >
        <span
          className={styles.cardImage}
          data-board={entry.kind === "boards" ? "true" : undefined}
          onContextMenu={blockImageMenu}
        >
          <GearImage pedal={pedal} />
        </span>

        <span className={styles.cardText}>
          <span className={styles.brand}>{pedal.brand}</span>
          <strong>{pedal.name}</strong>
        </span>

        {desktopSidebarMode &&
          catalogVisible &&
          hoveredCard === cardId && (
            <span
              aria-hidden="true"
              className="bg-blue-600 text-white"
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 20,
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 4V20M4 12H20"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </svg>
            </span>
          )}
      </button>
    );
  }


  const relatedContent =
    (
      recommendationSelection?.kind === "pedals" ||
      recommendationSelection?.kind === "power"
    ) && !replacement ? (
      <div className={styles.relatedSections} data-sidebar-recommendations={desktopSidebarMode ? "" : undefined}>
        {relatedPedals.sameBrand.length > 0 && (
          <section className={styles.relatedSection}>
            <h3 className={styles.relatedTitle}>
              {recommendationSelection.kind === "power"
                ? t("gear.morePowerFromBrand")
                  .replace("{brand}", recommendationSelection.brand)
                : relatedPedals.hasSameBrandAndType
                  ? t("gear.moreTypeFromBrand")
                    .replace("{type}", relatedPedals.typeLabel)
                    .replace("{brand}", recommendationSelection.brand)
                  : t("gear.moreFromBrand")
                    .replace("{brand}", recommendationSelection.brand)}
            </h3>

            <div ref={sameBrandGrid} className={styles.grid} data-view="grid">
              {relatedPedals.sameBrand.slice(0, visibleSameBrand).map(card)}

              {relatedPedals.sameBrand.length > visibleSameBrand && (
                <button
                  type="button"
                  className={`${styles.card} ${styles.moreCard}`}
                  onClick={() => setSameBrandRows((value) => value + 2)}
                >
                  <span className={styles.moreCardImage}>
                    <Plus size={48} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <span className={styles.cardText}>
                    <span className={styles.brand}>{t("gear.label")}</span>
                    <strong>{t("gear.moreAll")}</strong>
                  </span>
                </button>
              )}
            </div>

          </section>
        )}

        {relatedPedals.sameType.length > 0 && (
          <section className={styles.relatedSection}>
            <h3 className={styles.relatedTitle}>
              {t("gear.moreTypeFromOtherBrands")
                .replace("{type}", relatedPedals.typeLabel)}
            </h3>

            <div ref={sameTypeGrid} className={styles.grid} data-view="grid">
              {relatedPedals.sameType.slice(0, visibleSameType).map(card)}

              {relatedPedals.sameType.length > visibleSameType && (
                <button
                  type="button"
                  className={`${styles.card} ${styles.moreCard}`}
                  onClick={() => setSameTypeRows((value) => value + 4)}
                >
                  <span className={styles.moreCardImage}>
                    <Plus size={48} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <span className={styles.cardText}>
                    <span className={styles.brand}>{t("gear.label")}</span>
                    <strong>{t("gear.moreAll")}</strong>
                  </span>
                </button>
              )}
            </div>

          </section>
        )}
      </div>
    ) : null;

  if (desktopSidebarMode && !catalogVisible) {
    return relatedSidebarHost && relatedContent
      ? createPortal(relatedContent, relatedSidebarHost)
      : null;
  }

  return (
    <dialog
      ref={dialog}
      open={embedded ? true : undefined}
      data-embedded={embedded ? "" : undefined}
      aria-labelledby={selected && !desktopSidebarMode ? "myb-gear-detail-title" : "myb-gear-title"}
      className={styles.dialog}
      onClick={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        if (desktopSidebarMode) onClose();
        else if (selected) setSelected(null);
        else onClose();
      }}
    >

      <div ref={content} className={styles.scroller}>
        <div className={styles.content} data-library={!replacement || embedded ? "" : undefined} data-detail={selected && !desktopSidebarMode ? "" : undefined}>
          {selected && !desktopSidebarMode && (
            <button
              type="button"
              className={styles.mobileDetailBack}
              onClick={() => {
                if (initialDetailItem) {
                  onClose();
                } else {
                  setSelected(null);
                }
              }}
              aria-label={t("gear.closeDetails")}
            >
              <ArrowLeft
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          )}
          <div className={styles.hero} data-variant={replacement ? "replace" : "library"}>
            <button
              type="button"
              className={styles.heroClose}
              onClick={onClose}
              aria-label={t("gear.returnToBoard")}
            >
              <X size={21} aria-hidden="true" />
            </button>

            <div className={styles.heroCopy}>
              {replacement ? (
                <h1 id="myb-gear-title" ref={heading} tabIndex={-1}>
                  {t("replacement.choose")}
                </h1>
              ) : (
                <h1
                  id="myb-gear-title"
                  ref={heading}
                  tabIndex={-1}
                  className={styles.heroLogo}
                  aria-label="MakeYourBoard"
                >
                  <SidebarLogo />
                </h1>
              )}
              {(!replacement || hasReplacementType) && (
                <p className={styles.subtitle}>{t(replacement ? "replacement.subtitle" : "gear.subtitleAll")}</p>
              )}
              {hasReplacementType && (
                <button type="button" className={styles.replacementScope} onClick={() => {
                  setTypes(selectedTypes.length ? [] : null);
                  setLimit(PAGE_SIZE);
                }}>
                  {t(selectedTypes.length ? "gear.allTypes" : "replacement.sameType")}
                </button>
              )}

            </div>
            {replacement ? (
              <ReplacementArt key={replacement.pedal.instanceId} pedal={replacement.pedal} />
            ) : (
              <div className={styles.libraryArt} aria-hidden="true" onContextMenu={blockImageMenu}>
                <img className={styles.gearPhoto} src="/images/gear-boss-board.jpg" alt="" draggable={false} />
              </div>
            )}
          </div>
          <div className={styles.catalogHeader}>
            <h2 id="myb-gear-filters">{t("gear.filters")}</h2>
            <div className={styles.catalogControls}>
              {(!selected || desktopSidebarMode) && (
                <div className={styles.search}>
                  <Search size={20} aria-hidden="true" />
                  <input
                    ref={search}
                    type="search"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="none"
                    autoComplete="off"
                    value={query}
                    aria-label={searchLabel}
                    placeholder={searchLabel}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      if (customOpen) onOpenCustom?.();
                      if (replacement) setTypes([]);
                      setLimit(PAGE_SIZE);
                    }}
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label={t("powerMenu.clearSearch")}
                      onClick={() => {
                        setQuery("");
                        if (replacement) setTypes([]);
                        setLimit(PAGE_SIZE);
                        search.current?.focus();
                      }}
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
              {(!selected || desktopSidebarMode) && (
                <>
                  <h2>{t(replacement ? "replacement.choose" : "gear.allGear")}</h2>
                  {!replacement && onOpenCustom && (
                    <button
                      type="button"
                      onClick={onOpenCustom}
                      aria-expanded={customOpen}
                      className={styles.catalogCustomButton}
                    >
                      {customOpen ? <Minus size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                      {t("sidebar.custom")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {customOpen && customPanel}
          <div className={styles.catalogLayout} style={customOpen ? { display: "none" } : undefined}>
            <div className={styles.filters} role="group" aria-labelledby="myb-gear-filters">
              {!replacement && (
                <MultiFilter
                  label={t("gear.category")}
                  all={t("gear.allCategories")}
                  options={gearKinds.map((kind) => ({
                    value: kind,
                    label: t(`sidebar.${kind}`),
                  }))}
                  selected={category === "all" ? [] : [category]}
                  onChange={(values) =>
                    changeCategory((values[0] ?? "all") as GearCategory)
                  }
                  searchLabel={t("pedalsMenu.searchPlaceholder")}
                  single
                  hideSearch
                />
              )}
              <MultiFilter label={t("gear.brand")} all={t("gear.allBrands")}
                options={brands} selected={selectedBrands} searchLabel={t("pedalsMenu.searchPlaceholder")}
                onChange={(values) => { setBrands(values); setLimit(PAGE_SIZE); }} />
              {types.length > 0 && <MultiFilter label={t("pedal.type.label")} all={t("gear.allTypes")}
                options={types} selected={selectedTypes} searchLabel={t("pedalsMenu.searchPlaceholder")}
                onChange={(values) => { setTypes(values); setLimit(PAGE_SIZE); }} />}
              {specOptions.filter(({ options }) => options.length > 0).map(({ field, label, options }) => (
                <MultiFilter
                  key={field}
                  label={label}
                  all={t("gear.anyValue")}
                  options={options}
                  selected={selectedSpecs[field] ?? []}
                  searchLabel={t("pedalsMenu.searchPlaceholder")}
                  hideSearch
                  onChange={(values) => {
                    setSelectedSpecs((current) => ({ ...current, [field]: values }));
                    setLimit(PAGE_SIZE);
                  }}
                />
              ))}
              {(isFiltered || (!replacement && category !== "all")) && <button type="button" className={styles.reset} onClick={clearFilters}>{t("gear.reset")}</button>}

            </div>
            <section className={styles.results} aria-label={t("gear.catalog")}>
              {selection && selected && compactPedalDetails && selection.kind === "pedals" && !desktopSidebarMode ? (
                <div
                  className={styles.compactPedalDetail}
                  key={gearKey(selection)}
                  id="myb-gear-detail-title"
                  ref={detailHeading}
                  tabIndex={-1}
                  aria-label={`${selected.brand} ${selected.name}`}
                >
                  <div className={styles.compactPedalIdentity}>
                    <p className={styles.eyebrow}>{selected.brand}</p>
                    <h2 title={String(selected.name ?? "")}>{selected.name}</h2>
                    {renderTypeBadges(selected)}
                  </div>
                  <button
                    type="button"
                    className={styles.detailHeaderAdd}
                    onClick={addSelected}
                    aria-label={addLabel}
                    title={addLabel}
                  >
                    <Plus size={19} strokeWidth={2.5} aria-hidden="true" />
                    <span>{addLabel}</span>
                  </button>
                </div>
              ) : selection && selected && !desktopSidebarMode && selection.kind !== "pedals" ? (
                <div key={gearKey(selection)} id="myb-gear-detail-title" ref={detailHeading} tabIndex={-1} style={{ width: "100%", minWidth: 0, paddingTop: 20 }}>
                  {selection.kind === "boards" ? <BoardSpecs
                    selectedBoardDetails={selected}
                    boardsLibrary={boards}
                    onSelectBoard={selectSimilarBoard}
                    onAddToBoard={addSelected} units={units} language={language} t={t} isCustomBoard={false}
                    isUSA={isUSA} isEurope={isEurope} buildThomannUrl={buildThomannUrl} /> :
                    <PowerSpecs selectedPower={selected} onAddToBoard={addSelected} units={units} language={language}
                      t={t} isUSA={isUSA} isEurope={isEurope} buildThomannUrl={buildThomannUrl} />}
                </div>
              ) : selection && selected && !desktopSidebarMode && (
                <div className={styles.detail} key={gearKey(selection)} id="myb-gear-detail-title" ref={detailHeading} tabIndex={-1} aria-label={`${selected.brand} ${selected.name}`}>

                  {selection.kind !== "pedals" && <div className={styles.detailImage} onContextMenu={blockImageMenu}>
                    <GearImage pedal={selected} detail />


                    <button
                      type="button"
                      className={styles.detailImageClose}
                      aria-label={t("gear.closeDetails")}
                      onClick={() => setSelected(null)}
                    >
                      <X size={18} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>}

                  {selection.kind === "pedals" ? <PedalSpecs
                    selectedPedal={selected} selectedInstanceId={null} units={units} language={language}
                    t={t} isCustomPedal={false} isImportedPedal={false} isUSA={isUSA} isEurope={isEurope}
                    buildThomannUrl={buildThomannUrl}
                    embedded={{
                      header: (
                        <header className={`${styles.detailHeader} ${styles.pedalInlineHeader}`}>
                          <div className={styles.detailIdentity}>
                            <p className={styles.eyebrow}>{selected.brand}</p>

                            <div className={styles.detailNameRow}>
                              <h2 title={String(selected.name ?? "")}>
                                {selected.name}
                              </h2>
                            </div>

                            <div className={styles.detailMobileActions}>
                              {renderTypeBadges(selected)}

                              <button
                                type="button"
                                className={styles.detailHeaderAdd}
                                onClick={addSelected}
                                aria-label={addLabel}
                                title={addLabel}
                              >
                                <Plus size={19} strokeWidth={2.5} aria-hidden="true" />
                                <span>{addLabel}</span>
                              </button>
                            </div>
                          </div>
                          <div className={styles.pedalInlineArt} onContextMenu={blockImageMenu}>
                            <GearImage pedal={selected} detail />
                          </div>
                        </header>
                      ),
                      footer: (
                        <div className={styles.detailRetailers}>
                          <PedalRetailers
                            selectedPedal={selected}
                            buildThomannUrl={buildThomannUrl}
                            t={t}
                            detailed
                          />
                          {showTu3Pilot && (
                            <>
                              <Tu3OfficialDemo t={t} />
                              <section className={styles.tu3Artists}>
                                <h2 className={styles.storeTitle}>{t("gearTu3.artists")}</h2>
                                <ul className={styles.tu3ArtistList} role="list">
                                  {TU3_ARTISTS.map((name) => <li key={name}>{name}</li>)}
                                  <li>…</li>
                                </ul>
                              </section>
                            </>
                          )}
                        </div>
                      ),
                    }}
                  /> : (
                    <div className={styles.nonPedalDetail}>
                      {selection.kind === "boards" ? <BoardSpecs
                        embedded
                        selectedBoardDetails={selected}
                        boardsLibrary={boards}
                        onSelectBoard={selectSimilarBoard}
                        units={units} language={language} t={t} isCustomBoard={false} buildThomannUrl={buildThomannUrl} />
                        : <PowerSpecs embedded selectedPower={selected} units={units} language={language}
                          t={t} buildThomannUrl={buildThomannUrl} />}
                    </div>
                  )}
                </div>
              )}
              {(
                selection?.kind === "pedals" ||
                selection?.kind === "power"
              ) && !replacement && !desktopSidebarMode ? (
                relatedContent
              ) : selected && !desktopSidebarMode && !replacement ? null : (
                <div className={styles.resultList}>
                  {catalogLoading && (newGearLoading || results.length === 0) ? (
                    <p
                      className={styles.status}
                      role="status"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        paddingTop: 24,
                        textAlign: "center",
                      }}
                    >
                      {t(replacement ? "pedalsMenu.loading" : "gear.loadingAll")}
                    </p>
                  ) : catalogError && !results.length ? (
                    <p className={styles.status} role="alert">
                      {t(replacement ? "pedalsMenu.loadError" : "gear.loadError")}
                    </p>
                  ) : results.length === 0 ? (
                    <div
                      role="status"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 6,
                        marginTop: 16,
                        padding: 0,
                        color: "var(--foreground)",
                        fontSize: 14,
                        lineHeight: 1.4,
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        {t(replacement ? "gear.empty" : "gear.emptyAll")}
                      </p>

                      {searchSuggestion && (
                        <p style={{ margin: 0 }}>
                          {t("gear.didYouMean")}{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(searchSuggestion);
                              setLimit(PAGE_SIZE);
                              search.current?.focus();
                            }}
                            className="cursor-pointer font-semibold text-blue-500 hover:underline"
                            style={{
                              padding: 0,
                              border: 0,
                              background: "transparent",
                              fontSize: "inherit",
                              lineHeight: "inherit",
                            }}
                          >
                            {searchSuggestion}
                          </button>
                          {language === "fr" ? " ?" : "?"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div ref={grid} className={styles.grid} data-view={view}>
                        {results.slice(firstVisibleCard, visibleEnd).map(card)}

                        {visibleEnd < results.length && (
                          <button
                            type="button"
                            className={`${styles.card} ${styles.moreCard}`}
                            onClick={() => setLimit((value) => value + PAGE_SIZE)}
                          >
                            <span className={styles.moreCardImage}>
                              <Plus size={48} strokeWidth={1.8} aria-hidden="true" />
                            </span>

                            <span className={styles.cardText}>
                              <span className={styles.brand}>{t("gear.label")}</span>
                              <strong>{t(replacement ? "gear.more" : "gear.moreAll")}</strong>
                            </span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
            {desktopSidebarMode && relatedSidebarHost && relatedContent &&
              createPortal(relatedContent, relatedSidebarHost)}
          </div>
        </div>
      </div>
    </dialog>
  );
}