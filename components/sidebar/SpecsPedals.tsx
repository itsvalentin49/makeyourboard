"use client";
import React from "react";
import { ExternalLink, Plus } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import gearStyles from "./GearCatalog.module.css";
import type { Language } from "@/utils/i18n";
type Props = {
  selectedPedal: any;
  onAddToBoard?: (pedal: any) => void;
  embedded?: { header: React.ReactNode; footer: React.ReactNode };
  selectedInstanceId: number | null;
  units: "metric" | "imperial";
  language: Language;
  t: (key: string) => string;
  isCustomPedal: boolean;
  isImportedPedal: boolean;
  isUSA: boolean;
  isEurope: boolean;
  buildThomannUrl: (slug: string) => string;
};
function hasValue(value: any) {
  if (value == null) return false;
  const normalizedValue = String(value).trim();
  return (
    normalizedValue !== "" &&
    normalizedValue.toUpperCase() !== "N/A"
  );
}
function formatYear(value: any) {
  if (!hasValue(value)) return null;
  return String(value).split("-")[0];
}
function getLocalizedOverview(
  item: any,
  language: Language
) {
  const overviewByLanguage: Record<
    Language,
    string
  > = {
    en: "overview_en",
    fr: "overview_fr",
    es: "overview_es",
    de: "overview_de",
    it: "overview_it",
    pt: "overview_pt",
    zh: "overview_zh",
  };
  const fieldName =
    overviewByLanguage[language] ||
    "overview";
  if (hasValue(item?.[fieldName])) {
    return item[fieldName];
  }
  if (hasValue(item?.overview)) {
    return item.overview;
  }
  if (hasValue(item?.description)) {
    return item.description;
  }
  if (hasValue(item?.desc)) {
    return item.desc;
  }
  return "";
}
export function splitTags(value: any) {
  if (!hasValue(value)) return [];
  // The slash in A/B Box belongs to the label. Other slashes separate tags.
  return String(value)
    .replace(/\bA\s*\/\s*B(?=\s+Box\b)/gi, "AB")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((tag) => /^AB\s+Box$/i.test(tag) ? "A/B Box" : tag);
}
function safeTranslate(
  key: string,
  value: any,
  t: (key: string) => string
) {
  if (!hasValue(value)) return null;
  const translated = t(`${key}.${value}`);
  return translated || String(value);
}
function SpecRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === false
  ) {
    return null;
  }
  return (
    <div className="flex items-center py-[1px]">
      <span className="text-[14px]">
        {label}
      </span>
      <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />
      <span className="text-[14px] leading-relaxed font-normal text-zinc-300 whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}
function StoreLogos({
  selectedPedal,
  buildThomannUrl,
  detailed,
}: {
  selectedPedal: any;
  detailed: boolean;
  buildThomannUrl: (slug: string) => string;
}) {
  const stores: {
    key: string;
    label: string;
    logo: string;
    url: string;
  }[] = [];
  if (selectedPedal?.thomann) {
    stores.push({
      key: "thomann",
      label: "Thomann",
      logo: "/logos/thomann.webp",
      url: buildThomannUrl(
        selectedPedal.thomann
      ),
    });
  }
  if (selectedPedal?.sweetwater) {
    stores.push({
      key: "sweetwater",
      label: "Sweetwater",
      logo: "/logos/sweetwater.webp",
      url: selectedPedal.sweetwater,
    });
  }
  if (selectedPedal?.woodbrass) {
    stores.push({
      key: "woodbrass",
      label: "Woodbrass",
      logo: "/logos/woodbrass.webp",
      url: selectedPedal.woodbrass,
    });
  }
  stores.push({
    key: "reverb",
    label: "Reverb",
    logo: "/logos/reverb.webp",
    url: `https://reverb.com/marketplace?query=${encodeURIComponent(
      `${selectedPedal.brand || ""} ${selectedPedal.name || ""
      }`
    )}`,
  });
  return (
    <div className={detailed ? gearStyles.storeList : "flex items-center gap-3 flex-wrap"}>
      {stores.map((store) => (
        <a
          key={store.key}
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          title={detailed ? undefined : store.label}
          aria-label={detailed ? undefined : store.label}
          className={detailed ? gearStyles.storeLink : "inline-flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95"}
        >
          <img
            src={store.logo}
            alt={detailed ? "" : store.label}
            className="
              w-7
              h-7
              rounded-full
              object-contain
            "
            loading="lazy"
            decoding="async"
          />
          {detailed && (
            <>
              <span>{store.label}</span>
              <ExternalLink size={13} className="text-blue-500" aria-hidden="true" />
            </>
          )}
        </a>
      ))}
    </div>
  );
}
export function PedalRetailers({
  selectedPedal,
  buildThomannUrl,
  t,
  detailed = false,
}: Pick<Props, "selectedPedal" | "buildThomannUrl" | "t"> & {
  detailed?: boolean;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className={detailed ? gearStyles.storeTitle : "text-[18px] font-black"}>
        {t("sidebar.buyOnline")}
      </h2>
      <StoreLogos selectedPedal={selectedPedal} buildThomannUrl={buildThomannUrl} detailed={detailed} />
    </section>
  );
}
export function getHeroImageCandidates(
  pedal: any
) {
  const candidates = [
    pedal?.image,
    pedal?.image_url,
    pedal?.photo,
  ]
    .filter(hasValue)
    .map((value) =>
      String(value).trim()
    );
  return candidates.filter(
    (value, index) =>
      candidates.indexOf(value) ===
      index
  );
}
function PedalHeroPreview({
  selectedPedal,
  compact = false,
}: {
  selectedPedal: any;
  selectedInstanceId: number | null;
  compact?: boolean;
}) {
  const imageCandidates =
    getHeroImageCandidates(
      selectedPedal
    );
  const image =
    imageCandidates[0] || null;
  const pedalWidth =
    Number(selectedPedal?.width) || 0;

  const pedalDepth =
    Number(selectedPedal?.depth) || 0;

  const isHorizontalPedal =
    pedalWidth > pedalDepth;

  const HERO_WIDTH = compact ? 140 : 200;

  const HERO_HEIGHT = compact
    ? isHorizontalPedal
      ? Math.min(160, 140 * (pedalDepth / pedalWidth))
      : 160
    : 170;

  const imageBoxWidth = compact
    ? 140
    : (isHorizontalPedal ? 180 : 140);

  const imageBoxHeight = compact ? HERO_HEIGHT : 140;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: HERO_WIDTH,
        height: HERO_HEIGHT,
      }}
    >
      {image && (
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            width: imageBoxWidth,
            height: imageBoxHeight,
          }}
        >
          <img
            key={image}
            src={image}
            alt=""
            className="!block !h-full !w-full !max-h-full !max-w-full object-contain select-none pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            draggable={false}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            onError={(event) => {
              const element =
                event.currentTarget;
              const nextIndex =
                Number(
                  element.dataset
                    .fallbackIndex || "1"
                );
              const nextImage =
                imageCandidates[nextIndex];
              if (!nextImage) {
                element.style.display =
                  "none";
                return;
              }
              element.dataset.fallbackIndex =
                String(nextIndex + 1);
              element.src = nextImage;
            }}
          />
        </div>
      )}
    </div>
  );
}
export default function PedalSpecs({
  selectedPedal,
  onAddToBoard,
  embedded,
  selectedInstanceId,
  units,
  language,
  t,
  isCustomPedal,
  isImportedPedal,
  buildThomannUrl,
}: Props) {
  /*
    Les pédales Custom et Import sont uniquement
    manipulées depuis les boutons d’action du canvas.
    Aucun contenu de caractéristiques n’est affiché
    dans la sidebar pour ces éléments.
  */
  if (
    !selectedPedal ||
    isCustomPedal ||
    isImportedPedal
  ) {
    return null;
  }
  const brand =
    selectedPedal.brand || "";
  const name =
    selectedPedal.name || "";
  const year = formatYear(
    selectedPedal.year
  );
  const typeTags = splitTags(
    selectedPedal.type
  );
  const circuit = safeTranslate(
    "pedal.circuit",
    selectedPedal.circuit,
    t
  );
  const bypass = safeTranslate(
    "pedal.bypass",
    selectedPedal.bypass,
    t
  );
  const power = safeTranslate(
    "pedal.power",
    selectedPedal.power,
    t
  );
  const status = hasValue(
    selectedPedal.status
  )
    ? String(selectedPedal.status)
    : null;
  const normalizedStatus =
    status?.toLowerCase() || "";
  const isActive =
    normalizedStatus.includes("active") ||
    normalizedStatus.includes(
      "production"
    );
  const translatedStatus = status
    ? t(
      `pedal.status.${normalizedStatus}`
    )
    : null;
  const overview =
    getLocalizedOverview(
      selectedPedal,
      language
    );
  const width =
    Number(selectedPedal.width) || 0;
  const depth =
    Number(selectedPedal.depth) || 0;
  const dimensions =
    units === "metric"
      ? `${width} x ${depth} mm`
      : `${mmToIn(width).toFixed(
        2
      )} x ${mmToIn(depth).toFixed(
        2
      )} in`;
  const draw = hasValue(
    selectedPedal.draw
  )
    ? `${Number(
      selectedPedal.draw
    )} mA`
    : null;
  const weight = hasValue(
    selectedPedal.weight
  )
    ? formatWeight(
      Number(selectedPedal.weight),
      units,
      language
    )
    : null;
  const sidebarCardStyle: React.CSSProperties = {
    background: "var(--zinc-950)",
    border: "none",
    borderRadius: 26,
    padding: 24,
    boxSizing: "border-box",
    minWidth: 0,
  };
  return (
    <div
      className={embedded ? gearStyles.detailText : "w-full min-w-0 flex flex-col gap-5 px-1 pb-0"}
    >
      {embedded?.header}
      {/* HERO PRODUIT */}

      {!embedded && (
        <div
          className="w-full min-w-0 shrink-0"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Same identity presentation on desktop as on mobile.
            Explicit sizes prevent desktop/global CSS overrides. */}
          <div
            className="w-full min-w-0"
            style={{ display: "flex", flex: "1 1 0", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}
          >
            {brand && (
              <p
                style={{
                  margin: 0,
                  maxWidth: "100%",
                  color: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  lineHeight: 1.5,
                  overflowWrap: "anywhere",
                }}
              >
                {brand}
              </p>
            )}
            {name && (
              <h2
                style={{
                  margin: "4px 0 0",
                  width: "100%",
                  minWidth: 0,
                  color: "var(--foreground)",
                  fontSize: 34,
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: "-0.035em",
                  whiteSpace: "normal",
                  overflowWrap: "anywhere",
                }}
              >
                {name}
              </h2>
            )}
            {typeTags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                  width: "100%",
                }}
              >
                {typeTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      width: "max-content",
                      maxWidth: "100%",
                      padding: "3px 10px",
                      borderRadius: 9999,
                      backgroundColor: "#ffffff",
                      color: "#09090b",
                      fontSize: 11,
                      fontWeight: 900,
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    {t(`pedal.type.${tag}`)}
                  </span>
                ))}
              </div>
            )}
            {onAddToBoard && (
              <button
                type="button"
                onClick={() => onAddToBoard(selectedPedal)}
                className={`${gearStyles.addToBoardHover} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`} style={{
                  display: "inline-flex",
                  flex: "0 0 auto",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "flex-start",
                  gap: 6,
                  width: "max-content",
                  minWidth: "max-content",
                  minHeight: 34,
                  marginTop: 16,
                  padding: "7px 11px",
                  border: 0,
                  borderRadius: 9,
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: "20px",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap" }}>{t("customPanel.addToBoard")}</span>
              </button>
            )}
          </div>
          <div
            className="shrink-0 flex items-center justify-end"
            style={{ width: 140, maxWidth: "38%", background: "transparent", minWidth: 0 }}
          >
            <PedalHeroPreview
              selectedPedal={selectedPedal}
              selectedInstanceId={selectedInstanceId}
              compact
            />
          </div>
        </div>
      )}
      {/* DESCRIPTION */}
      {hasValue(overview) && (
        <div className={embedded ? "w-full min-w-0 shrink-0 flex flex-col gap-2" : "w-full min-w-0 shrink-0 flex flex-col gap-3 rounded-[26px] border-0 bg-zinc-950 p-5"} data-pedal-specs={embedded ? "description" : undefined} style={embedded ? undefined : sidebarCardStyle}>
          <div className="text-[18px] font-black">
            {t("pedal.description")}
          </div>
          <p className="w-full max-w-none text-[14px] leading-relaxed whitespace-normal break-words">
            {overview}
          </p>
        </div>
      )}
      {/* CARACTÉRISTIQUES */}
      <div className={embedded ? "min-w-0 shrink-0 flex flex-col gap-2" : "min-w-0 shrink-0 flex flex-col gap-3 rounded-[26px] border-0 bg-zinc-950 p-5"} data-pedal-specs={embedded ? "features" : undefined} style={embedded ? undefined : sidebarCardStyle}>
        <div className="text-[18px] font-black">
          {t("pedal.features")}
        </div>
        <div>
          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[14px]">
                {t(
                  "pedal.status.label"
                )}
              </span>
              <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />
              <span
                className={`
                  text-[9px]
                  px-2
                  py-1
                  rounded-full
                  font-black
                  uppercase
                  ${isActive
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                  }
                `}
              >
                {translatedStatus}
              </span>
            </div>
          )}
          <SpecRow
            label={t("pedal.year")}
            value={year}
          />
          <SpecRow
            label={t(
              "pedal.circuit.label"
            )}
            value={circuit}
          />
          <SpecRow
            label={t(
              "pedal.bypass.label"
            )}
            value={bypass}
          />
          <SpecRow
            label={t(
              "pedal.power.label"
            )}
            value={power}
          />
          <SpecRow
            label={t("pedal.draw")}
            value={draw}
          />
          <SpecRow
            label={t(
              "pedal.dimensions"
            )}
            value={dimensions}
          />
          <SpecRow
            label={t("pedal.weight")}
            value={weight}
          />
          <SpecRow
            label={t("pedal.origin")}
            value={
              hasValue(
                selectedPedal.origin
              )
                ? selectedPedal.origin
                : null
            }
          />
          {hasValue(
            selectedPedal.manual
          ) && (
              <div className="flex items-center py-[1px]">
                <span className="text-[14px]">
                  {t("pedal.manual")}
                </span>
                <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />
                <a
                  href={
                    selectedPedal.manual
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={gearStyles.pdfLink}
                >
                  PDF
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
        </div>
      </div>
      {embedded?.footer}
      {!embedded && (
        <div
          className={`w-full min-w-0 shrink-0 ${gearStyles.retailersCard}`}
          style={sidebarCardStyle}
          data-pedal-specs="retailers"
        >
          <PedalRetailers selectedPedal={selectedPedal} buildThomannUrl={buildThomannUrl} t={t} detailed />
        </div>
      )}
    </div>
  );
}
