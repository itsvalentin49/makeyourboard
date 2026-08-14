"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import type { Language } from "@/utils/i18n";

type Output = {
  count: number;
  voltages: string[];
  currents: number[];
  isSwitch: boolean;
};

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

/* =========================
   HELPERS
   ========================= */

function hasValue(value: any) {
  if (value == null) return false;

  const v = String(value).trim();

  return v !== "" && v.toUpperCase() !== "N/A";
}

function formatYear(value: any) {
  if (!hasValue(value)) return null;

  return String(value).split("-")[0];
}

function getLocalizedOverview(
  item: any,
  language: Language
) {
  const overviewByLanguage: Record<Language, string> = {
    en: "overview",
    fr: "overview_fr",
    es: "overview_es",
    de: "overview_de",
    it: "overview_it",
    pt: "overview_pt",
    zh: "overview_zh",
  };

  const fieldName =
    overviewByLanguage[language] || "overview";

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

/* =========================
   PARSER DETAILS
   ========================= */

function extractOutputs(details: string): Output[] {
  if (!hasValue(details)) return [];

  const parts = String(details)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const outputs: Output[] = [];

  for (const part of parts) {
    const normalized = part
      .replace(/\s+/g, "")
      .replace(/×/g, "x")
      .toLowerCase();

    /*
     * Ex:
     * 2xswitch:9/12/18V:500/375/250mA
     */
    const multiSwitchMatch = normalized.match(
      /^(\d+)xswitch:([\d./]+)v:([\d./]+)ma/
    );

    if (multiSwitchMatch) {
      const count = Number(
        multiSwitchMatch[1]
      );

      const voltages = multiSwitchMatch[2]
        .split("/")
        .filter(Boolean);

      const currents = multiSwitchMatch[3]
        .split("/")
        .map(Number)
        .filter(
          (value) =>
            !Number.isNaN(value)
        );

      outputs.push({
        count,
        voltages,
        currents,
        isSwitch: true,
      });

      continue;
    }

    /*
     * Ex:
     * 2xswitch:9/12V:1000mA
     */
    const switchMatch = normalized.match(
      /^(\d+)xswitch:([\d./]+)v:(\d+)ma/
    );

    if (switchMatch) {
      const count = Number(
        switchMatch[1]
      );

      const voltages = switchMatch[2]
        .split("/")
        .filter(Boolean);

      const current = Number(
        switchMatch[3]
      );

      outputs.push({
        count,
        voltages,
        currents: voltages.map(
          () => current
        ),
        isSwitch: true,
      });

      continue;
    }

    /*
     * Variante :
     * 2x9/12V:1000mA switch
     */
    const switchAfterMatch = normalized.match(
      /^(\d+)x([\d./]+)v:(\d+)ma.*switch/
    );

    if (switchAfterMatch) {
      const count = Number(
        switchAfterMatch[1]
      );

      const voltages = switchAfterMatch[2]
        .split("/")
        .filter(Boolean);

      const current = Number(
        switchAfterMatch[3]
      );

      outputs.push({
        count,
        voltages,
        currents: voltages.map(
          () => current
        ),
        isSwitch: true,
      });

      continue;
    }

    /*
     * Ex:
     * 7x9V:500mA
     */
    const fixedMatch = normalized.match(
      /^(\d+)x([\d.]+)v:(\d+)ma/
    );

    if (fixedMatch) {
      outputs.push({
        count: Number(
          fixedMatch[1]
        ),
        voltages: [
          fixedMatch[2],
        ],
        currents: [
          Number(
            fixedMatch[3]
          ),
        ],
        isSwitch: false,
      });
    }
  }

  return outputs;
}

/* =========================
   FORMAT D'UNE SORTIE
   ========================= */

function formatOutputLine(
  output: Output,
  t: (key: string) => string
) {
  if (
    output.voltages.length === 0 ||
    output.currents.length === 0
  ) {
    return "";
  }

  const voltages =
    output.voltages.join("-");

  const currents =
    output.currents.join("-");

  const outputLabel =
    output.count === 1
      ? t("powerSetup.output")
      : t("powerSetup.outputs");

  return `${output.count}x ${outputLabel} ${voltages}V DC / ${currents} mA`;
}

/* =========================
   CARACTÉRISTIQUE
   ========================= */

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

/* =========================
   REVENDEURS
   ========================= */

function StoreLogos({
  selectedPower,
  buildThomannUrl,
}: {
  selectedPower: any;
  buildThomannUrl: (
    slug: string
  ) => string;
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
      logo:
        "/logos/thomann.webp",
      url:
        buildThomannUrl(
          selectedPower.thomann
        ),
    });
  }

  if (selectedPower?.sweetwater) {
    stores.push({
      key: "sweetwater",
      label: "Sweetwater",
      logo:
        "/logos/sweetwater.webp",
      url:
        selectedPower.sweetwater,
    });
  }

  if (selectedPower?.woodbrass) {
    stores.push({
      key: "woodbrass",
      label: "Woodbrass",
      logo:
        "/logos/woodbrass.webp",
      url:
        selectedPower.woodbrass,
    });
  }

  stores.push({
    key: "reverb",
    label: "Reverb",
    logo:
      "/logos/reverb.webp",
    url: `https://reverb.com/marketplace?query=${encodeURIComponent(
      `${selectedPower.brand ||
      ""} ${selectedPower.name ||
      ""}`
    )}`,
  });

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {stores.map(
        (store) => (
          <a
            key={
              store.key
            }
            href={
              store.url
            }
            target="_blank"
            rel="noopener noreferrer"
            title={
              store.label
            }
            aria-label={
              store.label
            }
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
              src={
                store.logo
              }
              alt={
                store.label
              }
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
        )
      )}
    </div>
  );
}

/* =========================
   COMPONENT
   ========================= */

export default function SpecsPower({
  selectedPower,
  units,
  language,
  t,
  buildThomannUrl,
}: Props) {
  if (!selectedPower) {
    return null;
  }

  const image =
    selectedPower.image ||
    selectedPower.image_url ||
    selectedPower.photo ||
    null;

  const brand =
    selectedPower.brand ||
    "Custom";

  const name =
    selectedPower.name ||
    "Power Supply";

  const year =
    formatYear(
      selectedPower.year
    );

  const status =
    hasValue(
      selectedPower.status
    )
      ? String(
        selectedPower.status
      )
      : null;

  const isActive =
    status
      ?.toLowerCase()
      .includes(
        "active"
      ) ||
    status
      ?.toLowerCase()
      .includes(
        "production"
      );

  const overview =
    getLocalizedOverview(
      selectedPower,
      language
    );

  const outputs =
    extractOutputs(
      selectedPower.details ||
      ""
    );

  const dimensions =
    units === "metric"
      ? [
        selectedPower.width,
        selectedPower.depth,
        selectedPower.height,
      ]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .join(" x ") + " mm"
      : [
        selectedPower.width,
        selectedPower.depth,
        selectedPower.height,
      ]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => mmToIn(Number(value)).toFixed(2))
        .join(" x ") + " in";

  const weight =
    formatWeight(
      selectedPower.weight ||
      0,
      units,
      language
    );

  const isolated =
    selectedPower.isolated ===
      true
      ? t(
        "power.yes"
      )
      : selectedPower.isolated ===
        false
        ? t(
          "power.no"
        )
        : hasValue(
          selectedPower.isolated
        )
          ? selectedPower.isolated
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
      {/* =========================
          HERO PRODUIT
          ========================= */}

      <div className="shrink-0 flex flex-col items-center pt-2">
        {image && (
          <div
            className="
              w-full
              min-h-[150px]
              flex
              items-center
              justify-center
              mb-4
            "
          >
            <img
              src={image}
              alt={`${brand} ${name}`}
              className="object-contain"
              style={{
                width:
                  "180px",
                height:
                  "auto",
                maxHeight:
                  "135px",
                maxWidth:
                  "100%",
              }}
              loading="lazy"
              decoding="async"
              draggable={
                false
              }
            />
          </div>
        )}

        <div className="w-full min-w-0">
          {/* MARQUE + BADGE */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-3
              min-w-0
            "
          >
            <div
              className="
                text-[15px]
                font-black
                truncate
                min-w-0
              "
            >
              {brand}
            </div>

            <span
              className="
                shrink-0
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
                "pedal.type.Power Supply"
              )}
            </span>
          </div>

          {/* NOM */}

          <div
            className="
              text-[12px]
              truncate
              mt-0.5
            "
          >
            {name}
          </div>

          {/* =========================
              SORTIES
              ========================= */}

          {outputs.length > 0 && (
            <div
              className="
                mt-1
                flex
                flex-col
                gap-0.5
                text-[12px]
                leading-[1.3]
              "
            >
              {outputs.map(
                (output, index) => (
                  <div
                    key={index}
                    className="
                      flex
                      items-start
                      gap-1.5
                    "
                  >
                    <span
                      className="
                        shrink-0
                        leading-[1.3]
                      "
                    >
                      •
                    </span>

                    <span>
                      {formatOutputLine(
                        output,
                        t
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================
          DESCRIPTION
          ========================= */}

      {hasValue(overview) && (
        <div
          className="
      shrink-0
      flex
      flex-col
      gap-2
      w-full
      max-w-none
    "
        >
          <div
            className="
        text-[15px]
        font-black
      "
          >
            {t(
              "pedal.description"
            )}
          </div>

          <p
            className="
        w-full
        max-w-none
        text-[12px]
        leading-relaxed
      "
          >
            {overview}
          </p>
        </div>
      )}

      {/* =========================
          CARACTÉRISTIQUES
          ========================= */}

      <div
        className="
          shrink-0
          flex
          flex-col
          gap-2
        "
      >
        <div
          className="
            text-[15px]
            font-black
          "
        >
          {t(
            "power.features"
          )}
        </div>

        <div>
          {/* STATUT */}

          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[12px]">
                {t(
                  "power.status.label"
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
                {t(
                  `power.status.${status.toLowerCase()}`
                )}
              </span>
            </div>
          )}

          {/* ANNÉE */}

          <SpecRow
            label={t(
              "power.year"
            )}
            value={year}
          />

          {/* TENSION */}

          <SpecRow
            label={t(
              "power.voltage"
            )}
            value={
              hasValue(
                selectedPower.voltage
              )
                ? selectedPower.voltage
                : null
            }
          />

          {/* NOMBRE DE SORTIES */}

          <SpecRow
            label={t(
              "power.outputs"
            )}
            value={
              hasValue(
                selectedPower.outputs
              )
                ? selectedPower.outputs
                : null
            }
          />

          {/* SORTIES ISOLÉES */}

          <SpecRow
            label={t(
              "power.isolated"
            )}
            value={
              isolated
            }
          />

          {/* DIMENSIONS */}

          <SpecRow
            label={t(
              "power.dimensions"
            )}
            value={
              dimensions
            }
          />

          {/* POIDS */}

          <SpecRow
            label={t(
              "power.weight"
            )}
            value={
              weight
            }
          />

          {/* ORIGINE */}

          <SpecRow
            label={t(
              "power.origin"
            )}
            value={
              hasValue(
                selectedPower.origin
              )
                ? selectedPower.origin
                : null
            }
          />

          {/* MANUEL */}

          {hasValue(
            selectedPower.manual
          ) && (
              <div className="flex items-center py-[1px]">
                <span className="text-[12px]">
                  {t(
                    "power.manual"
                  )}
                </span>

                <div className="flex-1 border-b border-dotted border-zinc-600 mx-2 translate-y-[3.5px]" />

                <a
                  href={
                    selectedPower.manual
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

                  <ExternalLink
                    size={10}
                  />
                </a>
              </div>
            )}
        </div>
      </div>

      {/* =========================
          ACHETER EN LIGNE
          ========================= */}

      <div
        className="
          shrink-0
          flex
          flex-col
          gap-2
        "
      >
        <div
          className="
            text-[15px]
            font-black
          "
        >
          {t(
            "sidebar.buyOnline"
          )}
        </div>

        <StoreLogos
          selectedPower={
            selectedPower
          }
          buildThomannUrl={
            buildThomannUrl
          }
        />
      </div>
    </div>
  );
}