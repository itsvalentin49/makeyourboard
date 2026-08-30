"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import type { Language } from "@/utils/i18n";

type Props = {
  selectedPedal: any;
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

function splitTags(value: any) {
  if (!hasValue(value)) return [];

  return String(value)
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
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
      <span className="text-[12px]">
        {label}
      </span>

      <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

      <span className="text-[12px] leading-relaxed font-normal text-zinc-300 whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

function StoreLogos({
  selectedPedal,
  buildThomannUrl,
}: {
  selectedPedal: any;
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
    <div className="flex items-center gap-3 flex-wrap">
      {stores.map((store) => (
        <a
          key={store.key}
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          title={store.label}
          aria-label={store.label}
          className="
            inline-flex
            items-center
            justify-center
            transition-transform
            duration-150
            hover:scale-110
            active:scale-95
          "
        >
          <img
            src={store.logo}
            alt={store.label}
            className="
              w-7
              h-7
              rounded-full
              object-contain
            "
            loading="lazy"
            decoding="async"
          />
        </a>
      ))}
    </div>
  );
}

export default function PedalSpecs({
  selectedPedal,
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

  const image =
    selectedPedal.image ||
    selectedPedal.image_url ||
    selectedPedal.photo ||
    null;

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

  const normalizedPower = String(
    selectedPedal.power || ""
  )
    .trim()
    .toLowerCase();

  const shouldShowDraw = ![
    "ac",
    "passive",
    "usb",
    "battery",
  ].includes(normalizedPower);

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

  const isHorizontalPedal =
    width > 0 &&
    depth > 0 &&
    width > depth;

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

  return (
    <div
      className="
    h-full
    min-h-0
    overflow-y-auto
    overflow-x-hidden
    flex
    flex-col
    gap-5
    animate-in
    slide-in-from-left
    duration-300
    px-1
    pb-0

    [scrollbar-width:none]
    [-ms-overflow-style:none]
    [&::-webkit-scrollbar]:hidden
  "
    >
      {/* HERO PRODUIT */}
      <div className="shrink-0 flex flex-col items-center pt-1">
        <div className="w-full min-h-[150px] flex items-center justify-center mb-4">
          {image && (
            <img
              src={image}
              alt={`${brand} ${name}`}
              className="object-contain"
              style={
                isHorizontalPedal
                  ? {
                    width: "180px",
                    height: "auto",
                    maxHeight: "140px",
                  }
                  : {
                    width: "auto",
                    height: "140px",
                    maxWidth: "140px",
                  }
              }
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          )}
        </div>

        <div className="w-full min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* MARQUE */}
            {brand && (
              <div className="text-[15px] font-black truncate">
                {brand}
              </div>
            )}

            {/* NOM */}
            {name && (
              <div className="text-[12px] truncate">
                {name}
              </div>
            )}

            {/* TYPES */}
            {typeTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {typeTags
                  .map((tag) => (
                    <span
                      key={tag}
                      className="
                        px-2.5
                        py-1
                        rounded-full
                        bg-white
                        text-zinc-950
                        text-[9px]
                        font-black
                        leading-none
                        whitespace-nowrap
                      "
                    >
                      {t(
                        `pedal.type.${tag}`
                      )}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {hasValue(overview) && (
        <div className="w-full min-w-0 shrink-0 flex flex-col gap-2">
          <div className="text-[15px] font-black">
            {t("pedal.description")}
          </div>

          <p className="w-full max-w-none text-[12px] leading-relaxed whitespace-normal break-words">
            {overview}
          </p>
        </div>
      )}

      {/* CARACTÉRISTIQUES */}
      <div className="shrink-0 flex flex-col gap-2">
        <div className="text-[15px] font-black">
          {t("pedal.features")}
        </div>

        <div>
          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[12px]">
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

          {shouldShowDraw && (
            <SpecRow
              label={t("pedal.draw")}
              value={draw}
            />
          )}

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
                <span className="text-[12px]">
                  {t("pedal.manual")}
                </span>

                <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

                <a
                  href={
                    selectedPedal.manual
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                  text-[12px]
                  leading-relaxed
                  font-bold
                  text-blue-400
                  hover:text-blue-300
                  transition-colors
                  flex
                  items-center
                  gap-1
                "
                >
                  PDF
                  <ExternalLink size={10} />
                </a>
              </div>
            )}
        </div>
      </div>

      {/* ACHETER EN LIGNE */}
      <div className="shrink-0 flex flex-col gap-2">
        <div className="text-[15px] font-black">
          {t("sidebar.buyOnline")}
        </div>

        <StoreLogos
          selectedPedal={selectedPedal}
          buildThomannUrl={
            buildThomannUrl
          }
        />
      </div>
    </div>
  );
}