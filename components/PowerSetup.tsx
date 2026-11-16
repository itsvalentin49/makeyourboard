"use client";

import React, { useMemo } from "react";

import {
  Zap,
  X,
  Check,
  CircleCheck,
  CircleX,
  Info,
} from "lucide-react";

import {
  label,
  planPowerSetup,
  type Row,
} from "@/utils/powerFinder";

import pedalActions from "./PedalActions.module.css";

type Props = {
  t: (key: string) => string;
  powerUnits: Row[];
  pedalAssignments: {
    pedal: Row;
    [key: string]: unknown;
  }[];
  isLightTheme: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  [key: string]: unknown;
};

export default function PowerSetup({
  t,
  powerUnits,
  pedalAssignments,
  isLightTheme,
  isMobile = false,
  onClose,
}: Props) {

  const plan = useMemo(
    () =>
      planPowerSetup(
        pedalAssignments.map((a) => a.pedal),
        powerUnits
      ),
    [pedalAssignments, powerUnits]
  );

  const tr = (key: string) =>
    t(`powerSetupPlan.${key}`);

  const muted = isLightTheme
    ? "text-zinc-600"
    : "text-zinc-400";

  const ok = isLightTheme
    ? "text-green-600"
    : "text-green-500";

  const ko = "text-red-500";

  const warning = isLightTheme
    ? "#a16207"
    : "#eab308";

  const pedalName = (p: Row) => (
    <>
      {String(p.brand ?? "")}
      {p.brand ? " " : ""}
      {String(p.name ?? "")}
    </>
  );

  const cardClass =
    "flex min-w-0 flex-col gap-2 rounded-xl bg-zinc-950 p-3";

  return (
    <section
      className={
        isMobile
          ? "flex w-full min-w-0 flex-col gap-3 rounded-none border-0 bg-transparent"
          : "flex w-full min-w-0 flex-col gap-3 bg-transparent"
      }
      style={{
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >

      {/* HEADER */}

      <h2
        className="
    relative
    flex
    items-center
    gap-2
    text-[18px]
    font-bold
    uppercase
    tracking-wider
    m-0
  "
      >
        <Zap
          size={20}
          strokeWidth={2}
          className="shrink-0"
        />

        {tr("title")}

        {isMobile && (
          <button
            type="button"
            aria-label={t("gear.closeDetails")}
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className={pedalActions.mobilePanelClose}
          >
            <X
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        )}
      </h2>

      {!plan.count ? (
        <p className="m-0 text-[11px]">
          {tr("empty")}
        </p>
      ) : (
        <>

          {!powerUnits.length && (
            <p className={`m-0 text-[11px] ${muted}`}>
              {tr("addSupply")}
            </p>
          )}

          {powerUnits.map((s, si) => {

            const outputs = plan.outlets.filter(
              (o) => o.supplyIndex === si
            );

            const src = s.image || s.image_url;

            return (
              <div
                key={si}
                className="flex min-w-0 flex-col gap-3"
              >

                {/* POWER SUPPLY CARD */}

                <div
                  className="
                    flex
                    w-full
                    min-w-0
                    flex-col
                    items-center
                    gap-2
                    rounded-xl
                    border-0
                    bg-zinc-950
                    p-4
                  "
                >

                  {typeof src === "string" && src && (
                    <img
                      src={src}
                      alt=""
                      style={{
                        display: "block",
                        width: 160,
                        height: 96,
                        maxWidth: "100%",
                        maxHeight: 96,
                        minWidth: 0,
                        objectFit: "contain",
                        flexShrink: 0,
                        margin: 0,
                      }}
                    />
                  )}

                  <div className="min-w-0 text-center">

                    <h3
                      className="
                        m-0
                        break-words
                        text-[12px]
                        font-bold
                        uppercase
                      "
                    >
                      {String(s.brand ?? "")}
                    </h3>

                    <p
                      className="
                        m-0
                        break-words
                        text-[12px]
                        font-normal
                      "
                    >
                      {String(s.name ?? "")}
                    </p>

                    {powerUnits.length > 1 && (
                      <span className={`text-[11px] ${muted}`}>
                        {tr("supply")} {si + 1}
                      </span>
                    )}

                  </div>

                </div>

                {/* OUTPUT CARDS */}

                <ul
                  className="
                    m-0
                    flex
                    min-w-0
                    list-none
                    flex-col
                    gap-3
                    p-0
                  "
                >

                  {outputs.map((o) => {

                    const a = o.assignment;

                    const freeMode =
                      o.modes.find(
                        (m) => m.voltage === 9
                      ) ?? o.modes[0];

                    const voltage =
                      a?.voltage ??
                      freeMode?.voltage;

                    const draw =
                      a?.draw ?? 0;

                    const capacity =
                      a?.capacity ??
                      freeMode?.current ??
                      0;

                    const isValid =
                      draw <= capacity;

                    const percentage =
                      capacity > 0
                        ? Math.max(
                          0,
                          Math.min(
                            100,
                            (draw / capacity) * 100
                          )
                        )
                        : draw > 0
                          ? 100
                          : 0;

                    const currentColor = !a
                      ? muted
                      : isValid
                        ? ok
                        : ko;

                    return (
                      <li
                        key={o.output}
                        className={cardClass}
                      >

                        {/* OUTPUT HEADER */}

                        <div
                          className="
                            flex
                            min-w-0
                            flex-wrap
                            items-baseline
                            justify-between
                            gap-x-2
                            gap-y-1
                          "
                        >

                          <div
                            className="
                              flex
                              min-w-0
                              items-baseline
                              gap-2
                            "
                          >

                            <span
                              className="
                                whitespace-nowrap
                                text-[12px]
                                font-semibold
                              "
                            >
                              {tr("output")} {o.output}
                            </span>

                            {voltage !== undefined && (
                              <span
                                className={`
                                  whitespace-nowrap
                                  text-[11px]
                                  font-normal
                                  ${muted}
                                `}
                              >
                                {voltage} V
                              </span>
                            )}

                          </div>

                          <span
                            className={`
                              whitespace-nowrap
                              text-[11px]
                              font-medium
                              tabular-nums
                              ${currentColor}
                            `}
                          >
                            {draw} / {capacity} mA
                          </span>

                        </div>

                        {/* CURRENT PROGRESS BAR */}

                        <div
                          role="progressbar"
                          aria-label={`${tr("output")} ${o.output}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(percentage)}
                          aria-valuetext={`${draw} / ${capacity} mA`}
                          style={{
                            display: "block",
                            width: "100%",
                            height: 4,
                            minHeight: 4,
                            flexShrink: 0,
                            borderRadius: 999,
                            overflow: "hidden",
                            backgroundColor: isLightTheme
                              ? "#d4d4d8"
                              : "#27272a",
                          }}
                        >
                          <div
                            style={{
                              display: "block",
                              width: `${percentage}%`,
                              height: "100%",
                              borderRadius: 999,
                              backgroundColor: isValid
                                ? "#22c55e"
                                : "#ef4444",
                              transition: "width 300ms ease",
                            }}
                          />
                        </div>

                        {/* UNUSED OUTPUT */}

                        {!a && (
                          <div className={`text-[11px] ${muted}`}>
                            {tr("unused")}
                          </div>
                        )}

                        {/* CONNECTED PEDALS */}

                        {a && (
                          <div
                            className="
                              flex
                              min-w-0
                              flex-col
                              gap-2
                            "
                          >

                            {a.pedals.map((p, i) => (
                              <div
                                key={i}
                                className="
                                  flex
                                  min-w-0
                                  items-center
                                  gap-2
                                "
                              >

                                {isValid ? (
                                  <Check
                                    size={12}
                                    strokeWidth={2}
                                    className={`shrink-0 ${ok}`}
                                  />
                                ) : (
                                  <X
                                    size={12}
                                    strokeWidth={2}
                                    className={`shrink-0 ${ko}`}
                                  />
                                )}

                                <span
                                  className="
                                    min-w-0
                                    break-words
                                    text-[11px]
                                    font-normal
                                  "
                                >
                                  {pedalName(p)}
                                </span>

                              </div>
                            ))}

                            {/* TUNER / DAISY CHAIN */}

                            {a.via !== "individual" && (
                              <div
                                className="
                                  flex
                                  min-w-0
                                  items-start
                                  gap-2
                                  text-[11px]
                                "
                                style={{
                                  color: warning,
                                  lineHeight: "16px",
                                }}
                              >

                                <Info
                                  size={12}
                                  strokeWidth={2}
                                  className="shrink-0"
                                  style={{
                                    color: warning,
                                    marginTop: 2,
                                    flexShrink: 0,
                                  }}
                                />

                                <span
                                  className="min-w-0 break-words"
                                  style={{
                                    color: warning,
                                    lineHeight: "16px",
                                  }}
                                >
                                  {a.via === "tuner"
                                    ? tr("tuner").replace(
                                      "{pedal}",
                                      String(a.pedals[1]?.name ?? "")
                                    )
                                    : tr("daisy")}
                                </span>

                              </div>
                            )}

                          </div>
                        )}

                      </li>
                    );
                  })}

                </ul>

              </div>
            );
          })}



          {/* UNSUPPORTED PEDALS */}

          {plan.unsupported.length > 0 && (
            <div className={`${cardClass} ${ko}`}>

              <div
                className="
                  flex
                  items-start
                  gap-2
                  text-[11px]
                "
              >

                <Info
                  size={13}
                  className="mt-[2px] shrink-0"
                />

                <span className="min-w-0 break-words">
                  {tr("unsupported")}{" "}
                  {plan.unsupported.map(label).join(", ")}
                </span>

              </div>

            </div>
          )}

          {/* SEARCH LIMIT */}

          {plan.searchLimited && (
            <p className={`m-0 text-[11px] ${muted}`}>
              {tr("limited")}
            </p>
          )}

          {/* FINAL STATUS */}

          {powerUnits.length > 0 && (
            <div className={cardClass}>

              <h3 className="m-0 text-[14px] font-semibold">
                {t("powerSetup.sections.recommendation")}
              </h3>

              {plan.unpowered.length > 0 && (
                <div className="flex flex-col gap-1">

                  {plan.unpowered.map((p, i) => (
                    <div
                      key={i}
                      className="flex min-w-0 items-center gap-2 text-[11px]"
                    >
                      <CircleX
                        size={12}
                        strokeWidth={2}
                        className="shrink-0 text-red-500"
                      />

                      <span className="min-w-0 break-words">
                        {pedalName(p)}
                      </span>
                    </div>
                  ))}

                </div>
              )}

              <div
                role="status"
                className={`
        flex
        flex-col
        text-[12px]
        leading-relaxed
        ${plan.complete ? ok : ko}
      `}
              >
                {plan.complete ? (
                  <>
                    <span>
                      {tr("success")
                        .replace(/Let[’']s Rock\s*!?/i, "")
                        .trim()}
                    </span>

                    <span>Let's Rock! 🤟</span>
                  </>
                ) : (
                  <span>{tr("failure")}</span>
                )}
              </div>

            </div>
          )}
        </>
      )}

    </section>
  );
}