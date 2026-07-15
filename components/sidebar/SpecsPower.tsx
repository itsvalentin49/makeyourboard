"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import type { Language } from "@/utils/i18n";

type Props = {
  selectedPower: any;

  units: "metric" | "imperial";
  language: Language;

  t: (key: string) => string;

  isUSA: boolean;
  isEurope: boolean;

  buildThomannUrl: (slug: string) => string;

  selectedInstanceId: number | null;
  rotatePedal: (id: number) => void;
  movePedalFront: (id: number) => void;
  movePedalBack: (id: number) => void;
  deletePedal: (id: number) => void;
};

function hasValue(value: any) {
  if (value == null) return false;

  const v = String(value).trim();

  return v !== "" && v.toUpperCase() !== "N/A";
}

function formatYear(value: any) {
  if (!hasValue(value)) return null;

  return String(value).split("-")[0];
}

function getLocalizedOverview(item: any, language: Language) {
  const overviewByLanguage: Record<Language, string> = {
    en: "overview",
    fr: "overview_fr",
    es: "overview_es",
    de: "overview_de",
    it: "overview_it",
    pt: "overview_pt",
    zh: "overview_zh",
  };

  const fieldName = overviewByLanguage[language] || "overview";

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
  selectedPower,
  buildThomannUrl,
}: {
  selectedPower: any;
  buildThomannUrl: (slug: string) => string;
}) {
  const stores: {
    key: string;
    label: string;
    logo: string;
    url: string;
  }[] = [];

  if (selectedPower?.thomann) {
    stores.push({
      key: "thomann",
      label: "Thomann",
      logo: "/logos/thomann.webp",
      url: buildThomannUrl(selectedPower.thomann),
    });
  }

  if (selectedPower?.sweetwater) {
    stores.push({
      key: "sweetwater",
      label: "Sweetwater",
      logo: "/logos/sweetwater.webp",
      url: selectedPower.sweetwater,
    });
  }

  if (selectedPower?.woodbrass) {
    stores.push({
      key: "woodbrass",
      label: "Woodbrass",
      logo: "/logos/woodbrass.webp",
      url: selectedPower.woodbrass,
    });
  }

  stores.push({
    key: "reverb",
    label: "Reverb",
    logo: "/logos/reverb.webp",
    url: `https://reverb.com/marketplace?query=${encodeURIComponent(
      `${selectedPower.brand || ""} ${selectedPower.name || ""}`
    )}`,
  });

  if (stores.length === 0) return null;

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
            inline-flex items-center justify-center
            transition-transform duration-150
            hover:scale-110
            active:scale-95
          "
        >
          <img
            src={store.logo}
            alt={store.label}
            className="w-7 h-7 rounded-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </a>
      ))}
    </div>
  );
}

export default function SpecsPower({
  selectedPower,
  units,
  language,
  t,
  buildThomannUrl,
}: Props) {
  if (!selectedPower) return null;

  const image =
    selectedPower.image ||
    selectedPower.image_url ||
    selectedPower.photo ||
    null;

  const brand = selectedPower.brand || "Custom";
  const name = selectedPower.name || "Power Supply";

  const year = formatYear(selectedPower.year);

  const status = hasValue(selectedPower.status)
    ? String(selectedPower.status)
    : null;

  const isActive =
    status?.toLowerCase().includes("active") ||
    status?.toLowerCase().includes("production");

  const overview = getLocalizedOverview(
    selectedPower,
    language
  );

  const dimensions =
    units === "metric"
      ? `${selectedPower.width} x ${selectedPower.depth || 0} mm`
      : `${mmToIn(selectedPower.width).toFixed(2)} x ${mmToIn(
        selectedPower.depth || 0
      ).toFixed(2)} in`;

  const weight = formatWeight(
    selectedPower.weight || 0,
    units,
    language
  );

  const isolated =
    selectedPower.isolated === true
      ? t("power.yes")
      : selectedPower.isolated === false
        ? t("power.no")
        : hasValue(selectedPower.isolated)
          ? selectedPower.isolated
          : null;

  return (
    <div
      className="
        h-full min-h-0
        overflow-y-auto overflow-x-hidden
        flex flex-col gap-5
        animate-in slide-in-from-left duration-300
        px-1 pb-8

        [scrollbar-width:thin]
        [scrollbar-color:#3f3f46_transparent]

        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-thumb]:rounded-full
        hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600
      "
    >
      {/* HERO PRODUIT */}
      <div className="shrink-0 flex flex-col items-center pt-2">
        {image && (
          <div className="w-full flex items-center justify-center mb-4">
            <img
              src={image}
              alt={`${brand} ${name}`}
              className="
                max-w-[170px]
                max-h-[140px]
                object-contain
              "
              loading="lazy"
              decoding="async"
            />
          </div>
        )}

        <div className="w-full min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* MARQUE */}
            <div className="text-[15px] font-black truncate">
              {brand}
            </div>

            {/* NOM DE L'ALIMENTATION */}
            <div className="text-[12px] truncate">
              {name}
            </div>

            {/* BADGE TYPE */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span
                className="
                  px-2.5 py-1
                  rounded-full
                  bg-white
                  text-zinc-950
                  text-[9px]
                  font-black
                  leading-none
                  whitespace-nowrap
                "
              >
                {t("pedal.type.Power Supply")}
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
          {t("power.features")}
        </div>

        <div>
          {/* STATUT */}
          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[12px]">
                {t("power.status.label")}
              </span>

              <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

              <span
                className={`
                  text-[9px]
                  px-2 py-1
                  rounded-full
                  font-black
                  uppercase
                  ${isActive
                    ? "bg-green-500/20 text-green-500"
                    : "bg-red-500/20 text-red-500"
                  }
                `}
              >
                {t(
                  `power.status.${status.toLowerCase()}`
                )}
              </span>
            </div>
          )}

          {/* ANNÉE */}
          <SpecRow
            label={t("power.year")}
            value={year}
          />

          {/* SORTIES */}
          <SpecRow
            label={t("power.outputs")}
            value={
              hasValue(selectedPower.outputs)
                ? selectedPower.outputs
                : null
            }
          />

          {/* SORTIES ISOLÉES */}
          <SpecRow
            label={t("power.isolated")}
            value={isolated}
          />

          {/* CAPACITÉ TOTALE */}
          <SpecRow
            label={t("power.capacity")}
            value={
              hasValue(selectedPower.capacity)
                ? `${selectedPower.capacity} mA`
                : null
            }
          />

          {/* TENSION */}
          <SpecRow
            label={t("power.voltage")}
            value={
              hasValue(selectedPower.voltage)
                ? selectedPower.voltage
                : null
            }
          />

          {/* DIMENSIONS */}
          <SpecRow
            label={t("power.dimensions")}
            value={dimensions}
          />

          {/* POIDS */}
          <SpecRow
            label={t("power.weight")}
            value={weight}
          />

          {/* ORIGINE */}
          <SpecRow
            label={t("power.origin")}
            value={
              hasValue(selectedPower.origin)
                ? selectedPower.origin
                : null
            }
          />

          {/* MANUEL */}
          {hasValue(selectedPower.manual) && (
            <div className="flex items-center py-[1px]">
              <span className="text-[12px]">
                {t("power.manual")}
              </span>

              <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

              <a
                href={selectedPower.manual}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  text-[12px]
                  leading-relaxed
                  font-bold
                  text-blue-400
                  hover:text-blue-300
                  transition-colors
                  flex items-center gap-1
                "
              >
                PDF <ExternalLink size={10} />
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
          selectedPower={selectedPower}
          buildThomannUrl={buildThomannUrl}
        />
      </div>
    </div>
  );
}