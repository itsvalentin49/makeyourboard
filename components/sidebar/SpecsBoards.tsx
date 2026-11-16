"use client";

import React from "react";
import { ExternalLink, Plus } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import gearStyles from "./GearCatalog.module.css";
import type { Language } from "@/utils/i18n";

type Props = {
  embedded?: boolean;
  onAddToBoard?: (item: any) => void;
  selectedBoardDetails: any;
  boardsLibrary?: any[];
  onSelectBoard?: (board: any) => void;

  units: "metric" | "imperial";
  language: Language;

  t: (key: string) => string;

  isCustomBoard: boolean;

  buildThomannUrl: (slug: string) => string;
  getStoresForCountry?: () => string[];

  hasBoardCommercialLinks?: boolean;
  selectedBoardInstanceId?: number | null;
  rotateBoard?: (id: number) => void;
  moveBoardFront?: (id: number) => void;
  moveBoardBack?: (id: number) => void;
  deleteBoard?: (id: number) => void;
  isUSA?: boolean;
  isEurope?: boolean;
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

function safeTranslate(
  key: string,
  value: any,
  t: (key: string) => string
) {
  if (!hasValue(value)) return null;

  const fullKey = `${key}.${value}`;
  const translated = t(fullKey);

  if (
    !translated ||
    translated === fullKey
  ) {
    return String(value);
  }

  return translated;
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
  selectedBoardDetails,
  buildThomannUrl,
}: {
  selectedBoardDetails: any;
  buildThomannUrl: (slug: string) => string;
}) {
  const stores: {
    key: string;
    label: string;
    logo: string;
    url: string;
  }[] = [];

  if (selectedBoardDetails?.thomann) {
    stores.push({
      key: "thomann",
      label: "Thomann",
      logo: "/logos/thomann.webp",
      url: buildThomannUrl(
        selectedBoardDetails.thomann
      ),
    });
  }

  if (selectedBoardDetails?.sweetwater) {
    stores.push({
      key: "sweetwater",
      label: "Sweetwater",
      logo: "/logos/sweetwater.webp",
      url: selectedBoardDetails.sweetwater,
    });
  }

  if (selectedBoardDetails?.woodbrass) {
    stores.push({
      key: "woodbrass",
      label: "Woodbrass",
      logo: "/logos/woodbrass.webp",
      url: selectedBoardDetails.woodbrass,
    });
  }

  stores.push({
    key: "reverb",
    label: "Reverb",
    logo: "/logos/reverb.webp",
    url: `https://reverb.com/marketplace?query=${encodeURIComponent(
      `${selectedBoardDetails.brand || ""} ${selectedBoardDetails.name || ""
      }`
    )}`,
  });

  return (
    <div className={gearStyles.storeList}>
      {stores.map((store) => (
        <a key={store.key} href={store.url} target="_blank" rel="noopener noreferrer"
          className={gearStyles.storeLink}>
          <img src={store.logo} alt="" loading="lazy" decoding="async"
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "contain" }} />
          <span>{store.label}</span>
          <ExternalLink size={13} color="#3b82f6" aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}

export default function BoardSpecs({
  selectedBoardDetails,
  boardsLibrary = [],
  onSelectBoard,
  embedded = false,
  onAddToBoard,
  units,
  language,
  t,
  isCustomBoard,
  buildThomannUrl,
}: Props) {
  if (
    !selectedBoardDetails ||
    isCustomBoard
  ) {
    return null;
  }

  const image =
    selectedBoardDetails.image ||
    selectedBoardDetails.image_url ||
    selectedBoardDetails.photo ||
    null;

  const brand =
    selectedBoardDetails.brand || "";

  const name =
    selectedBoardDetails.name || "";

  const year = formatYear(
    selectedBoardDetails.year
  );

  const status = hasValue(
    selectedBoardDetails.status
  )
    ? String(selectedBoardDetails.status)
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
      `board.status.${normalizedStatus}`
    )
    : null;

  const overview =
    getLocalizedOverview(
      selectedBoardDetails,
      language
    );

  const material = safeTranslate(
    "board.material",
    selectedBoardDetails.material,
    t
  );

  const profile = safeTranslate(
    "board.profile",
    selectedBoardDetails.profile,
    t
  );

  const width =
    Number(selectedBoardDetails.width) ||
    0;

  const depth =
    Number(selectedBoardDetails.depth) ||
    0;

  const dimensions =
    units === "metric"
      ? `${width} x ${depth} mm`
      : `${mmToIn(width).toFixed(
        2
      )} x ${mmToIn(depth).toFixed(
        2
      )} in`;

  const weight = hasValue(
    selectedBoardDetails.weight
  )
    ? formatWeight(
      Number(
        selectedBoardDetails.weight
      ),
      units,
      language
    )
    : null;

  const boardType = hasValue(
    selectedBoardDetails.type
  )
    ? selectedBoardDetails.type
    : "Pedalboard";

  const normalizeBrand = (value: unknown) =>
    String(value ?? "").trim().toLowerCase();

  const selectedBrand = normalizeBrand(brand);
  const similarBoards = Number.isFinite(width) && Number.isFinite(depth) &&
    width > 0 && depth > 0 && selectedBrand
    ? boardsLibrary
      .filter((board) => {
        const candidateBrand = normalizeBrand(board.brand);
        const w = Number(board.width);
        const d = Number(board.depth);
        return candidateBrand && candidateBrand !== "custom" &&
          candidateBrand !== selectedBrand &&
          Number.isFinite(w) && Number.isFinite(d) &&
          w > 0 && d > 0 &&
          Math.abs(w - width) / width <= 0.2 &&
          Math.abs(d - depth) / depth <= 0.2;
      })
      .map((board) => ({
        board,
        score: Math.abs(Number(board.width) - width) / width +
          Math.abs(Number(board.depth) - depth) / depth,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 6)
      .map(({ board }) => board)
    : [];

  const sidebarCardStyle: React.CSSProperties = {
    backgroundColor: "var(--zinc-950)",
    border: "none",
    borderRadius: 26,
    padding: 24,
    boxSizing: "border-box",
    minWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flexShrink: 0,
  };
  return (
    <div className="w-full min-w-0" style={{ display: "flex", flexDirection: "column", gap: 20, background: "transparent", paddingInline: embedded ? 0 : 4 }}>
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        minWidth: 0,
      }}>
        <div style={{ display: "flex", flex: "1 1 0", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.5 }}>{brand}</p>
          <h2 style={{ margin: "4px 0 0", fontSize: 34, fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.035em", overflowWrap: "anywhere" }}>{name}</h2>
          <span style={{ display: "inline-flex", marginTop: 12, padding: "3px 10px", borderRadius: 9999, backgroundColor: "#fff", color: "#09090b", fontSize: 11, fontWeight: 900, lineHeight: 1.2 }}>{boardType}</span>
          {onAddToBoard && (
            <button type="button" className={gearStyles.addToBoardHover} onClick={() => onAddToBoard(selectedBoardDetails)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 34, marginTop: 12, padding: "7px 11px", border: 0, borderRadius: 9, color: "white", fontSize: 12, fontWeight: 700, lineHeight: "20px", cursor: "pointer" }}>
              <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
              {t("customPanel.addToBoard")}
            </button>
          )}
        </div>
        {!embedded && image && (
          <div style={{ width: 140, maxWidth: "38%", flexShrink: 0, display: "flex", justifyContent: "flex-end", background: "transparent" }}>
            <img src={image} alt={`${brand} ${name}`} draggable={false}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 160, objectFit: "contain" }} />
          </div>
        )}
      </div>
      {hasValue(overview) && (
        <div style={sidebarCardStyle}>
          <div className="text-[18px] font-black">
            {t("pedal.description")}
          </div>

          <p className="w-full max-w-none text-[14px] leading-relaxed whitespace-normal break-words">
            {overview}
          </p>
        </div>
      )}

      {/* CARACTÉRISTIQUES */}
      <div style={sidebarCardStyle}>
        <div className="text-[18px] font-black">
          {t("pedal.features")}
        </div>

        <div>
          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[14px]">
                {t("board.status.label")}
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
            label={t("board.year")}
            value={year}
          />

          <SpecRow
            label={t(
              "board.material.label"
            )}
            value={material}
          />

          <SpecRow
            label={t(
              "board.profile.label"
            )}
            value={profile}
          />

          <SpecRow
            label={t(
              "board.dimensions"
            )}
            value={dimensions}
          />

          <SpecRow
            label={t("board.weight")}
            value={weight}
          />

          <SpecRow
            label={t("board.origin")}
            value={
              hasValue(
                selectedBoardDetails.origin
              )
                ? selectedBoardDetails.origin
                : null
            }
          />

          {hasValue(
            selectedBoardDetails.manual
          ) && (
              <div className="flex items-center py-[1px]">
                <span className="text-[14px]">
                  {t("pedal.manual")}
                </span>

                <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

                <a
                  href={
                    selectedBoardDetails.manual
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

      {/* ACHETER EN LIGNE */}
      <div style={sidebarCardStyle}>
        <div className="text-[18px] font-black">
          {t("sidebar.buyOnline")}
        </div>

        <StoreLogos
          selectedBoardDetails={
            selectedBoardDetails
          }
          buildThomannUrl={
            buildThomannUrl
          }
        />
      </div>


      {/* SIMILAR PEDALBOARDS */}
      {similarBoards.length > 0 && (
        <div style={sidebarCardStyle}>
          <div className="text-[18px] font-black">
            {t("board.similarBoards")}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 10,
          }}>
            {similarBoards.map((board) => {
              const boardImage = [
                board.image, board.image_url, board.photo, board.thumbnail,
              ].find((value) => typeof value === "string" && hasValue(value));
              const boardDimensions = units === "metric"
                ? `${Number(board.width)} × ${Number(board.depth)} mm`
                : `${mmToIn(Number(board.width)).toFixed(2)} × ${mmToIn(Number(board.depth)).toFixed(2)} in`;

              return (
                <button
                  key={board.id ?? `${board.brand}-${board.name}`}
                  type="button"
                  className={`${gearStyles.card} ${gearStyles.similarBoardCard}`}
                  onClick={() => onSelectBoard?.(board)}
                  disabled={!onSelectBoard}
                  style={{ width: "100%" }}
                >
                  <div
                    className={gearStyles.cardImage}
                    style={{
                      height: 100,
                      padding: 14,
                      background: "var(--zinc-300)",
                    }}
                  >
                    {boardImage && (
                      <img src={boardImage} alt="" draggable={false}
                        loading="lazy" decoding="async" />
                    )}
                  </div>
                  <div className={gearStyles.cardText} style={{ width: "100%", minWidth: 0 }}>
                    <span className={gearStyles.brand}>{board.brand}</span>
                    <strong>{board.name}</strong>
                    <span className="text-[11px] text-zinc-400">
                      {boardDimensions}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}