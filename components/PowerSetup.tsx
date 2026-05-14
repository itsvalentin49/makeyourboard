"use client";

import React from "react";
import { Zap } from "lucide-react";

type AnyRow = Record<string, any>;

type Output = {
  count: number;
  voltages: string[];
  currents: number[];
  isSwitch: boolean;
};

type Props = {
  t: (key: string) => string;

  powerUnits: AnyRow[];
  pedalAssignments: {
    pedal: AnyRow;
    ok: boolean;
    output: Output | undefined;
  }[];

  hasPower: boolean;
  hasPedals: boolean;
  hasFailingPedal: boolean;

  powerMessage: string | null;
  powerMessageColor: string;

  isSinglePedal: boolean;
  singlePedal: AnyRow | null;
  singlePedalVoltage: number;
  singlePedalDraw: number;
  singlePedalCanUseBattery: any;

  isAnalogOnlySmall: boolean;
  isMixedWithSingleDigital: boolean;
  isMixedWithMultipleDigital: boolean;
  isLargeBoard: boolean;
  hasDaisyChainTuner: boolean;

  extraPedals: number;
  shouldShowNotEnough: boolean;
  shouldShowDaisy: boolean;

  extractOutputs: (details: string) => Output[];
};

export default function PowerSetup({
  t,
  powerUnits,
  pedalAssignments,
  hasPower,
  hasPedals,
  hasFailingPedal,
  powerMessage,
  powerMessageColor,
  isSinglePedal,
  singlePedal,
  singlePedalVoltage,
  singlePedalDraw,
  singlePedalCanUseBattery,
  isAnalogOnlySmall,
  isMixedWithSingleDigital,
  isMixedWithMultipleDigital,
  isLargeBoard,
  hasDaisyChainTuner,
  extraPedals,
  shouldShowNotEnough,
  shouldShowDaisy,
  extractOutputs,
}: Props) {
  return (
    <div className="w-[420px] max-w-[90vw] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
          <Zap size={14} className="text-yellow-500" />
          {t("powerSetup.title")}
        </div>
      </div>

      {powerUnits.length > 0 && (
        <div className="mb-5">
          <div className="space-y-6">
            {powerUnits.map((p, index) => {
              const outputs = extractOutputs(p.details);

              return (
                <div key={index} className="space-y-4">
                  <div className="w-full flex justify-center">
                    <div className="overflow-hidden rounded-md">
                      <img
                        src={p.image || p.image_url || p.photo}
                        alt={p.name}
                        className="w-full max-w-[200px] object-contain"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[14px] font-semibold leading-tight mb-3">
                      {p.brand} {p.name}
                    </div>

                    <div
                      className={`
                        grid gap-6 justify-center
                        ${outputs.length === 1 ? "grid-cols-1" : ""}
                        ${outputs.length === 2 ? "grid-cols-2" : ""}
                        ${outputs.length >= 3 ? "grid-cols-3" : ""}
                      `}
                    >
                      {outputs.map((o, i) => {
                        const pairs = o.voltages.map((v, idx) => ({
                          voltage: v,
                          current: o.currents[idx] ?? o.currents[0],
                        }));

                        return (
                          <div key={i} className="space-y-2 text-center">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                              {o.count}{" "}
                              {o.isSwitch
                                ? t(
                                    o.count > 1
                                      ? "powerSetup.outputs.switchable_plural"
                                      : "powerSetup.outputs.switchable"
                                  )
                                : t(
                                    o.count > 1
                                      ? "powerSetup.outputs.fixed_plural"
                                      : "powerSetup.outputs.fixed"
                                  )}
                            </div>

                            <div className="space-y-[2px]">
                              {pairs.map((pair, j) => (
                                <div
                                  key={j}
                                  className="flex items-center justify-center gap-2 text-[11px] leading-none"
                                >
                                  <span className="font-semibold w-[28px] text-right">
                                    {pair.voltage}V
                                  </span>

                                  <span className="text-zinc-500">→</span>

                                  <span className="text-zinc-400 w-[70px] text-left">
                                    {pair.current}mA
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-1 mt-6 text-[12px] uppercase tracking-wider font-bold">
  {t("powerSetup.sections.pedals")}
</div>

{!hasPedals && (
  <div className="mb-4 text-[12px] text-blue-500">
    {t("powerSetup.empty.noPedals")}
  </div>
)}

{hasPedals && (
  <div className="mb-5">
    <div className="space-y-2">
      {pedalAssignments.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr_auto] items-end text-[11px] leading-none"
            >
              <div className="flex items-center gap-1 whitespace-nowrap">
                <span className="text-zinc-500 font-bold">
                  {a.pedal.brand || "Custom"}
                </span>
                <span>{a.pedal.name}</span>
              </div>

              <div className="mx-2 border-b border-dotted border-zinc-600 mb-[2px]" />

              <div className="text-[11px] whitespace-nowrap text-right">
                <span
                  className={
                    !hasPower
                      ? ""
                      : a.ok
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {Number(a.pedal.voltage) || 9}V /{" "}
                  {Number(a.pedal.draw) || 0}mA
                </span>
              </div>
            </div>
      ))}
    </div>
  </div>
)}

      <div className="flex items-center justify-between -mt-4">
        <div className={`text-[12px] ${powerMessageColor}`}>
          {powerMessage}
        </div>
      </div>

      <div className="mb-2 mt-6 text-[12px] uppercase tracking-wider font-bold">
        {t("powerSetup.sections.recommendation")}
      </div>

      <div className="space-y-3 text-[12px]">
        {!hasPedals && (
          <>
            <div className="text-blue-400">
              {t("powerSetup.empty.title")}
            </div>
            <div className="-mt-3">
              {t("powerSetup.empty.subtitle")}
            </div>
          </>
        )}

        {hasPedals && (
          <>
            {!hasPower && (
              <>
                {isSinglePedal && singlePedal && (
                  <div className="space-y-2">
                    <div className="text-green-600">
                      {t("powerSetup.recommendation.singleAdapter")
                        .replace("{voltage}", String(singlePedalVoltage))
                        .replace("{draw}", String(singlePedalDraw))}
                    </div>

                    {singlePedalCanUseBattery && (
                      <div className="text-zinc-400">
                        {t("powerSetup.recommendation.battery9v")}
                      </div>
                    )}
                  </div>
                )}

                {!isSinglePedal && (
                  <>
                    {isAnalogOnlySmall && (
                      <div className="text-green-600">
                        {t("powerSetup.recommendation.daisySimple")}
                      </div>
                    )}

                    {isMixedWithSingleDigital && (
                      <div className="text-green-600">
                        {t("powerSetup.recommendation.daisy")}
                      </div>
                    )}

                    {isMixedWithMultipleDigital && (
                      <div className="text-yellow-400">
                        {t("powerSetup.recommendation.isolated")}
                      </div>
                    )}

                    {isLargeBoard && (
                      <div className="text-yellow-400">
                        {t("powerSetup.recommendation.isolated")}
                      </div>
                    )}
                  </>
                )}

                {hasDaisyChainTuner && !isSinglePedal && (
                  <div className="text-zinc-400 -mt-2">
                    {t("powerSetup.recommendation.tuner")}
                  </div>
                )}
              </>
            )}

            {hasPower && hasFailingPedal && (
              <div className="text-yellow-500">
                {t("powerSetup.recommendation.upgrade")}
              </div>
            )}

            {!hasFailingPedal && (
              <>
                {extraPedals === 0 && (
                  <div className="text-green-600">
                    {t("powerSetup.recommendation.perfect")}
                  </div>
                )}

                {shouldShowNotEnough && (
                  <div>
                    <div className="text-red-500">
                      {t("powerSetup.recommendation.full")}
                    </div>
                    <div className="text-zinc-400">
                      {t("powerSetup.recommendation.fullHint")}
                    </div>
                  </div>
                )}

                {shouldShowDaisy && (
                  <div>
                    <div className="text-yellow-500">
                      {t("powerSetup.recommendation.daisy")}
                    </div>
                    <div className="text-zinc-400">
                      {t("powerSetup.recommendation.daisyHint")}
                    </div>
                  </div>
                )}

                {extraPedals > 0 && hasDaisyChainTuner && (
                  <div className="text-zinc-400 -mt-3">
                    {t("powerSetup.recommendation.tuner")}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}