"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import type { Language } from "@/utils/i18n";

type Props = {
  selectedBoardDetails: any;

  units: "metric" | "imperial";
  language: Language;

  t: (key: string) => string;

  isCustomBoard: boolean;

  buildThomannUrl: (slug: string) => string;
  getStoresForCountry: () => string[];

  hasBoardCommercialLinks: boolean;
  selectedBoardInstanceId: number | null;
  rotateBoard: (id: number) => void;
  moveBoardFront: (id: number) => void;
  moveBoardBack: (id: number) => void;
  deleteBoard: (id: number) => void;
  isUSA: boolean;
  isEurope: boolean;
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
    en: "overview",
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

export default function BoardSpecs({
  selectedBoardDetails,
  units,
  language,
  t,
  isCustomBoard,
  buildThomannUrl,
}: Props) {
  /*
    Les boards Custom sont uniquement manipulés
    depuis les boutons d’action du canvas.

    Aucun contenu n’est affiché dans la sidebar.
  */
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
        pb-8

        [scrollbar-width:thin]
        [scrollbar-color:#3f3f46_transparent]

        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600
      "
    >
      {/* HERO BOARD */}
      <div className="shrink-0 flex flex-col items-center pt-2">
        {image && (
          <div className="w-full flex items-center justify-center mb-4">
            <img
              src={image}
              alt={`${brand} ${name}`}
              className="
                max-w-[250px]
                max-h-[170px]
                object-contain
              "
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        )}

        <div className="w-full min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* MARQUE */}
            {brand && (
              <div className="text-[15px] font-black truncate">
                {brand}
              </div>
            )}

            {/* NOM DU BOARD */}
            {name && (
              <div className="text-[12px] truncate">
                {name}
              </div>
            )}

            {/* BADGE TYPE */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span
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
                {boardType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {hasValue(overview) && (
        <div className="shrink-0 flex flex-col gap-2">
          <div className="text-[15px] font-black">
            {t("pedal.description")}
          </div>

          <p className="text-[12px] leading-relaxed text-pretty">
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
                <span className="text-[12px]">
                  {t("pedal.manual")}
                </span>

                <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

                <a
                  href={
                    selectedBoardDetails.manual
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
          selectedBoardDetails={
            selectedBoardDetails
          }
          buildThomannUrl={
            buildThomannUrl
          }
        />
      </div>
    </div>
  );
}