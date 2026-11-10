"use client";

import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, BookOpen, ChevronDown, Grid2X2, List, LoaderCircle, Play, Plus, Search, X } from "lucide-react";
import type { AnyRow, BoardItem } from "@/types/project";
import type { Language } from "@/utils/i18n";
import { getCustomImageUrl } from "@/utils/customImageStore";
import { parsePedalJackLocations, resolveCustomPedalLayout } from "@/utils/customPedalLayout";
import { CustomPedalVisual } from "./CustomPanel";
import PedalSpecs, { getHeroImageCandidates, PedalRetailers, splitTags } from "./SpecsPedals";
import SidebarLogo from "./SidebarLogo";
import styles from "./GearCatalog.module.css";

type Props = {
  pedals: AnyRow[];
  loading: boolean;
  error: string | null;
  initialQuery: string;
  language: Language;
  units: "metric" | "imperial";
  isUSA: boolean;
  isEurope: boolean;
  buildThomannUrl: (slug: string) => string;
  t: (key: string) => string;
  onClose: () => void;
  onAdd: (pedal: AnyRow) => void;
  replacement?: { pedal: BoardItem };
};

const PAGE_SIZE = 36;
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

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function isPedal(pedal: AnyRow) {
  return !splitTags(pedal.type).some((tag) => ["power", "power supply"].includes(tag.toLowerCase()));
}

function releaseDate(value: unknown) {
  return typeof value === "string" && /^\d{4}(?:-\d{2}-\d{2})?$/.test(value) ? value : "";
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

type CatalogEntry = { pedal: AnyRow; brand: string; tags: string[]; searchText: string };

type FilterOption = { value: string; label: string };

function MultiFilter({ label, all, options, selected, onChange, searchLabel }: {
  label: string;
  all: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchLabel: string;
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
          <input className={styles.filterSearch} type="search" value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchLabel} aria-label={`${label} · ${searchLabel}`} />
          <fieldset className={styles.filterOptions} aria-label={label}>
            <label className={styles.filterOption}>
              <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
              <span>{all}</span>
            </label>
            {options.filter(({ label }) => normalize(label).includes(term)).map(({ value, label }) => (
              <label key={value} className={styles.filterOption}>
                <input type="checkbox" checked={selected.includes(value)} onChange={(event) =>
                  onChange(event.target.checked ? [...selected, value] : selected.filter((item) => item !== value))} />
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
  pedals, loading, error, initialQuery, language, units, isUSA, isEurope,
  buildThomannUrl, t, onClose, onAdd, replacement,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [coveredCards, setCoveredCards] = useState(0);
  const previousCard = useRef<string | null>(null);
  const catalogScroll = useRef(0);
  const [query, setQuery] = useState(initialQuery);
  const [selectedBrands, setBrands] = useState<string[]>([]);
  const [typeSelection, setTypes] = useState<string[] | null>(null);
  const [selectedSpecs, setSelectedSpecs] = useState<SpecSelection>({});
  const [sort, setSort] = useState("recent");
  const [catalogView, setCatalogView] = useState<"grid" | "list">("grid");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<AnyRow | null>(null);
  const addLabel = t(replacement ? "replacement.previewAction" : "customPanel.addToBoard");
  const viewLabel = t(catalogView === "grid" ? "gear.showList" : "gear.showGrid");
  const ViewIcon = catalogView === "grid" ? List : Grid2X2;
  const deferredQuery = useDeferredValue(query);
  const hasReplacementType = splitTags(replacement?.pedal.type).length > 0;
  const showTu3Pilot = !replacement && selected &&
    normalize(String(selected.brand ?? "").trim()) === "boss" &&
    /^tu-3(?: chromatic tuner)?$/i.test(String(selected.name ?? "").trim());
  const labelType = (tag: string) => {
    const key = `pedal.type.${tag}`;
    const label = t(key);
    return label === key ? tag : label;
  };

  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => element?.close();
  }, []);

  useLayoutEffect(() => {
    const scroller = content.current;
    if (!scroller) return;

    if (selected) {
      scroller.scrollTop = 0;
      detailHeading.current?.focus({ preventScroll: true });
    } else if (previousCard.current) {
      scroller.scrollTop = catalogScroll.current;
      scroller.querySelector<HTMLButtonElement>(
        `[data-gear-card="${CSS.escape(previousCard.current)}"]`,
      )?.focus({ preventScroll: true });
    }
  }, [selected]);

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
  }, [selected, catalogView]);

  const catalog = useMemo(() => {
    return pedals.filter(isPedal).map((pedal): CatalogEntry => {
      const brand = String(pedal.brand ?? "").trim();
      const tags = splitTags(pedal.type);
      const localizedTags = tags.map((tag) => t(`pedal.type.${tag}`));
      return {
        pedal, brand, tags,
        searchText: normalize([brand, pedal.name, ...tags, ...localizedTags].join(" ")),
      };
    });
  }, [pedals, t]);

  const collator = useMemo(() => new Intl.Collator(language, { sensitivity: "base", numeric: true }), [language]);
  const brands = useMemo(() =>
    [...new Set(catalog.map((entry) => entry.brand).filter(Boolean))]
      .sort(collator.compare).map((value) => ({ value, label: value })), [catalog, collator]);
  const types = useMemo(() =>
    [...new Set(catalog.flatMap((entry) => entry.tags))]
      .map((value) => {
        const key = `pedal.type.${value}`;
        const label = t(key);
        return { value, label: label === key ? value : label };
      })
      .sort((a, b) => collator.compare(a.label, b.label)), [catalog, collator, t]);

  const specOptions = useMemo(() => SPEC_FILTERS.map(({ field, label }) => {
    const options = new Map<string, FilterOption>();
    for (const { pedal } of catalog) {
      const raw = specValue(pedal[field]);
      if (!raw) continue;

      const value = raw.toLowerCase();
      if (options.has(value)) continue;
      const key = `pedal.${field}.${raw}`;
      const translated = field === "origin" ? raw : t(key);
      options.set(value, { value, label: translated === key ? raw : translated });
    }
    return { field, label: t(label), options: [...options.values()].sort((a, b) => collator.compare(a.label, b.label)) };
  }), [catalog, collator, t]);

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
    const filtered = catalog.filter((entry) =>
      (!selectedBrands.length || selectedBrands.includes(entry.brand)) &&
      (!selectedTypes.length || entry.tags.some((tag) => selectedTypes.includes(tag))) &&
      activeSpecs.every(({ field }) => selectedSpecs[field]?.includes(specValue(entry.pedal[field]).toLowerCase())) &&
      terms.every((term) => entry.searchText.includes(term)));
    return filtered.sort((a, b) => {
      const releaseOrder = sort === "recent"
        ? releaseDate(b.pedal.year).localeCompare(releaseDate(a.pedal.year))
        : 0;
      return releaseOrder || collator.compare(a.brand, b.brand) ||
        collator.compare(String(a.pedal.name ?? ""), String(b.pedal.name ?? ""));
    });
  }, [catalog, deferredQuery, selectedBrands, selectedTypes, selectedSpecs, sort, collator]);

  const isFiltered = Boolean(query.trim() || selectedBrands.length || selectedTypes.length ||
    Object.values(selectedSpecs).some((values) => values.length > 0));

  function clearFilters() {
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

  function card(pedal: AnyRow) {
    const cardId = String(pedal.id);
    return (
      <button
        key={pedal.id}
        type="button"
        data-gear-card={cardId}
        className={styles.card}
        onClick={() => {
          previousCard.current = cardId;
          catalogScroll.current = content.current?.scrollTop ?? 0;
          setSelected(pedal);
        }}
      >
        <span className={styles.cardImage} onContextMenu={blockImageMenu}><GearImage pedal={pedal} /></span>
        <span className={styles.cardText}>
          <span className={styles.brand}>{pedal.brand}</span>
          <strong>{pedal.name}</strong>
        </span>
      </button>
    );
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={selected ? "myb-gear-detail-title" : "myb-gear-title"}
      className={styles.dialog}
      onClick={(event) => event.stopPropagation()}
      onCancel={(event) => {
        event.preventDefault();
        if (selected) setSelected(null);
        else onClose();
      }}
    >
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={`${styles.headerLogo} font-sans`}><SidebarLogo /></div>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("gear.returnToBoard")}>
            <X size={21} aria-hidden="true" />
          </button>
        </div>
      </header>
      <div ref={content} className={styles.scroller}>
        <div className={styles.content} data-library={!replacement ? "" : undefined} data-detail={selected ? "" : undefined}>
          <div className={styles.hero} data-variant={replacement ? "replace" : "library"}>
            <div className={styles.heroCopy}>
              <h1 id="myb-gear-title" ref={heading} tabIndex={-1}>{t(replacement ? "replacement.choose" : "gear.title")}</h1>
              {(!replacement || hasReplacementType) && (
                <p className={styles.subtitle}>{t(replacement ? "replacement.subtitle" : "gear.subtitle")}</p>
              )}
              {hasReplacementType && (
                <button type="button" className={styles.replacementScope} onClick={() => {
                  setTypes(selectedTypes.length ? [] : null);
                  setLimit(PAGE_SIZE);
                }}>
                  {t(selectedTypes.length ? "gear.allTypes" : "replacement.sameType")}
                </button>
              )}
              <div className={styles.search}>
                <Search size={20} aria-hidden="true" />
                <input
                  ref={search} type="search" value={query}
                  aria-label={t("gear.search")} placeholder={t("gear.search")}
                  onChange={(event) => { setQuery(event.target.value); setLimit(PAGE_SIZE); }}
                />
                {query && (
                  <button type="button" aria-label={t("powerMenu.clearSearch")} onClick={() => {
                    setQuery("");
                    setLimit(PAGE_SIZE);
                    search.current?.focus();
                  }}><X size={17} aria-hidden="true" /></button>
                )}
              </div>
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
              {selected ? (
                <div className={styles.detailActions}>
                  <button type="button" className={`${styles.primary} ${styles.desktopAdd}`} onClick={() => onAdd(selected)}>
                    <Plus size={16} aria-hidden="true" /> {addLabel}
                  </button>
                  <button type="button" className={styles.detailClose} aria-label={t("gear.closeDetails")}
                    onClick={() => setSelected(null)}>
                    <X size={18} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <>
                  <span className={styles.resultCount} role="status">
                    {loading ? (
                      <span className={styles.loading}>
                        <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                        {t("pedalsMenu.loading")}
                      </span>
                    ) : isFiltered && !error &&
                      t(new Intl.PluralRules(language).select(results.length) === "one" ? "gear.resultOne" : "gear.resultOther")
                        .replace("{count}", results.length.toLocaleString(language))}
                  </span>
                  <div className={styles.catalogOptions}>
                    <label className={styles.sort}>
                      {t("gear.sort")}
                      <select value={sort} onChange={(event) => { setSort(event.target.value); setLimit(PAGE_SIZE); }}>
                        <option value="alphabetical">{t("gear.alphabetical")}</option>
                        <option value="recent">{t("gear.newestFirst")}</option>
                      </select>
                    </label>
                    <button type="button" className={styles.viewToggle} aria-label={viewLabel} title={viewLabel}
                      onClick={() => setCatalogView((view) => view === "grid" ? "list" : "grid")}>
                      <ViewIcon size={18} aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={styles.catalogLayout}>
            <div className={styles.filters} role="group" aria-labelledby="myb-gear-filters">
              <MultiFilter label={t("gear.brand")} all={t("gear.allBrands")}
                options={brands} selected={selectedBrands} searchLabel={t("pedalsMenu.searchPlaceholder")}
                onChange={(values) => { setBrands(values); setLimit(PAGE_SIZE); }} />
              <MultiFilter label={t("pedal.type.label")} all={t("gear.allTypes")}
                options={types} selected={selectedTypes} searchLabel={t("pedalsMenu.searchPlaceholder")}
                onChange={(values) => { setTypes(values); setLimit(PAGE_SIZE); }} />
              {specOptions.map(({ field, label, options }) => (
                <MultiFilter key={field} label={label} all={t("gear.anyValue")}
                  options={options} selected={selectedSpecs[field] ?? []} searchLabel={t("pedalsMenu.searchPlaceholder")}
                  onChange={(values) => {
                    setSelectedSpecs((current) => ({ ...current, [field]: values }));
                    setLimit(PAGE_SIZE);
                  }} />
              ))}
              {isFiltered && <button type="button" className={styles.reset} onClick={clearFilters}>{t("gear.reset")}</button>}
            </div>
            <section className={styles.results} aria-label={t("gear.catalog")}>
              {selected && (
                <div className={styles.detail} key={selected.id}>
                  <div className={styles.detailImage} onContextMenu={blockImageMenu}>
                    <GearImage pedal={selected} detail />
                    <button type="button" className={`${styles.primary} ${styles.mobileAdd}`} aria-label={addLabel}
                      onClick={() => onAdd(selected)}>
                      <Plus size={21} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                  <PedalSpecs
                    selectedPedal={selected} selectedInstanceId={null} units={units} language={language}
                    t={t} isCustomPedal={false} isImportedPedal={false} isUSA={isUSA} isEurope={isEurope}
                    buildThomannUrl={buildThomannUrl}
                    embedded={{
                      header: (
                        <header className={styles.detailHeader}>
                          <p className={styles.eyebrow}>{selected.brand}</p>
                          <h2 id="myb-gear-detail-title" ref={detailHeading} tabIndex={-1}>{selected.name}</h2>
                          {renderTypeBadges(selected)}
                        </header>
                      ),
                      footer: (
                        <div className={styles.detailRetailers}>
                          <PedalRetailers
                            selectedPedal={selected} buildThomannUrl={buildThomannUrl} t={t}
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
                  />
                </div>
              )}
              <div className={styles.resultList}>
                {loading ? null : error ? (
                  <p className={styles.status} role="alert">{t("pedalsMenu.loadError")}</p>
                ) : results.length === 0 ? (
                  <p className={styles.status} role="status">{t("gear.empty")}</p>
                ) : (
                  <>
                    <div ref={grid} className={styles.grid} data-view={catalogView}>
                      {results.slice(selected ? coveredCards : 0, limit).map(({ pedal }) => card(pedal))}
                    </div>
                    {limit < results.length && (
                      <button type="button" className={styles.more} onClick={() => setLimit((value) => value + PAGE_SIZE)}>
                        {t("gear.more")}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </dialog>
  );
}
