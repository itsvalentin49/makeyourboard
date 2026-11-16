"use client";

import React from "react";
import { ExternalLink, Plus } from "lucide-react";
import { mmToIn, formatWeight } from "@/utils/units";
import gearStyles from "./GearCatalog.module.css";
import type { Language } from "@/utils/i18n";

type Output = {
  count: number;
  voltages: string[];
  currents: number[];
  isSwitch: boolean;
};

type Props = {
  embedded?: boolean;
  onAddToBoard?: (item: any) => void;
  selectedPower: any;

  units: "metric" | "imperial";
  language: Language;

  t: (key: string) => string;

  isUSA?: boolean;
  isEurope?: boolean;

  buildThomannUrl: (slug: string) => string;

  selectedInstanceId?: number | null;
  rotatePedal?: (id: number) => void;
  movePedalFront?: (id: number) => void;
  movePedalBack?: (id: number) => void;
  deletePedal?: (id: number) => void;
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
    en: "overview_en",
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
   VOLTAGE COLORS
   ========================= */

function getVoltageColor(voltage: string) {
  switch (Number(voltage)) {
    case 9:
      return "text-green-500";

    case 12:
      return "text-blue-500";

    case 18:
      return "text-yellow-500";

    default:
      return "text-zinc-300";
  }
}

function OutputValue({
  voltage,
  current,
}: {
  voltage: string;
  current?: number;
}) {
  return (
    <>
      <span className={getVoltageColor(voltage)}>
        {voltage}V
      </span>

      {current !== undefined && (
        <span className="text-zinc-300">
          {" / "}
          {current} mA
        </span>
      )}
    </>
  );
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

/* =========================
   OUTPUTS
   ========================= */

function OutputRows({
  outputs,
  t,
}: {
  outputs: Output[];
  t: (key: string) => string;
}) {
  const individualOutputs = outputs.flatMap(
    (output) =>
      Array.from(
        { length: output.count },
        () => output
      )
  );

  return (
    <div className="w-full min-w-0">
      {individualOutputs.map((output, index) => {
        const values = output.voltages.map(
          (voltage, voltageIndex) => {
            const current =
              output.currents.length === 1
                ? output.currents[0]
                : output.currents[voltageIndex];

            return {
              voltage,
              current,
            };
          }
        );

        if (values.length === 0) {
          return null;
        }

        return (
          <div
            key={index}
            className="w-full min-w-0"
          >
            <SpecRow
              label={`${t("powerSetup.output")} ${index + 1}`}
              value={
                <OutputValue
                  voltage={values[0].voltage}
                  current={values[0].current}
                />
              }
            />

            {values.slice(1).map((value, valueIndex) => (
              <div
                key={valueIndex}
                className="flex items-center justify-end py-[1px]"
              >
                <span className="text-[14px] leading-relaxed font-normal text-zinc-300 whitespace-nowrap">
                  <OutputValue
                    voltage={value.voltage}
                    current={value.current}
                  />
                </span>
              </div>
            ))}
          </div>
        );
      })}
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
    <div className={gearStyles.storeList}>
      {stores.map((store) => (
        <a
          key={store.key}
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          className={gearStyles.storeLink}
        >
          <img
            src={store.logo}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "contain",
            }}
          />

          <span>{store.label}</span>

          <ExternalLink
            size={13}
            color="#3b82f6"
            aria-hidden="true"
          />
        </a>
      ))}
    </div>
  );
}

/* =========================
   COMPONENT
   ========================= */

export default function SpecsPower({
  selectedPower,
  embedded = false,
  onAddToBoard,
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
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )
        .join(" x ") + " mm"
      : [
        selectedPower.width,
        selectedPower.depth,
        selectedPower.height,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== ""
        )
        .map(
          (value) =>
            mmToIn(Number(value)).toFixed(2)
        )
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

  const sidebarCardStyle: React.CSSProperties = {
    background: "var(--zinc-950)",
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
    <div
      className="w-full min-w-0"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        background: "transparent",
        paddingInline: embedded ? 0 : 4,
      }}
    >

      {/* =========================
          HERO PRODUIT
          ========================= */}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: "1 1 0",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              lineHeight: 1.5,
            }}
          >
            {brand}
          </p>

          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              overflowWrap: "anywhere",
            }}
          >
            {name}
          </h2>

          <span
            style={{
              display: "inline-flex",
              marginTop: 12,
              padding: "3px 10px",
              borderRadius: 9999,
              backgroundColor: "#fff",
              color: "#09090b",
              fontSize: 11,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {t("pedal.type.Power Supply")}
          </span>

          {onAddToBoard && (
            <button
              type="button"
              className={gearStyles.addToBoardHover}
              onClick={() => onAddToBoard(selectedPower)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                minHeight: 34,
                marginTop: 12,
                padding: "7px 11px",
                border: 0,
                borderRadius: 9,
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: "20px",
                cursor: "pointer",
              }}
            >
              <Plus
                size={15}
                strokeWidth={2.5}
                aria-hidden="true"
              />

              {t("customPanel.addToBoard")}
            </button>
          )}
        </div>

        {!embedded && image && (
          <div
            style={{
              width: 140,
              maxWidth: "38%",
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
              background: "transparent",
            }}
          >
            <img
              src={image}
              alt={`${brand} ${name}`}
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: 160,
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>

      {/* =========================
          DESCRIPTION
          ========================= */}

      {hasValue(overview) && (
        <div style={sidebarCardStyle}>
          <div
            className="
              text-[18px]
              font-black
            "
          >
            {t("pedal.description")}
          </div>

          <p
            className="
              w-full
              max-w-none
              text-[14px]
              leading-relaxed
            "
          >
            {overview}
          </p>
        </div>
      )}

      {/* =========================
          OUTPUTS
          ========================= */}

      {outputs.length > 0 && (
        <div style={sidebarCardStyle}>
          <div className="text-[18px] font-black">
            {t("powerSetup.outputs")}
          </div>

          <OutputRows
            outputs={outputs}
            t={t}
          />
        </div>
      )}

      {/* =========================
          CARACTÉRISTIQUES
          ========================= */}

      <div style={sidebarCardStyle}>
        <div
          className="
            text-[18px]
            font-black
          "
        >
          {t("power.features")}
        </div>

        <div>

          {/* STATUT */}

          {status && (
            <div className="flex items-center py-[1px]">
              <span className="text-[14px]">
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

          {/* SORTIES ISOLÉES */}

          <SpecRow
            label={t(
              "power.isolated"
            )}
            value={isolated}
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
                <span className="text-[14px]">
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
                  className={gearStyles.pdfLink}
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

      <div style={sidebarCardStyle}>
        <div
          className="
            text-[18px]
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