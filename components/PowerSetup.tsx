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
  isLightTheme: boolean;
  isMobile?: boolean;
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
  daisyPedalNames: string;

  extractOutputs: (details: string) => Output[];
};

export default function PowerSetup({
  t,
  isMobile = false,
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
  daisyPedalNames,
  isLightTheme,
  extractOutputs,
}: Props) {
  const normalize = (value: any) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const getTypes = (pedal: AnyRow): string[] => {
    const rawType = pedal.type;

    if (Array.isArray(rawType)) {
      return rawType.map((type) => normalize(type)).filter(Boolean);
    }

    return String(rawType ?? "")
      .split(/[,;/|]/)
      .map((type) => normalize(type))
      .filter(Boolean);
  };

  const formatPedalName = (pedal: AnyRow) =>
    `${pedal.brand || "Custom"} ${pedal.name || ""}`.trim();

  const getPedalVoltage = (pedal: AnyRow) =>
    Number(pedal.voltage) || 9;

  const getPedalDraw = (pedal: AnyRow) =>
    Math.max(0, Number(pedal.draw) || 0);

  const isExternallyPoweredPedal = (pedal: AnyRow) => {
    const powerType = normalize(pedal.power);

    return !["passive", "battery", "usb", "n/a"].includes(powerType);
  };

  const isAnalogPedal = (pedal: AnyRow) =>
    normalize(pedal.circuit) === "analog";

  const isDigitalPedal = (pedal: AnyRow) =>
    normalize(pedal.circuit) === "digital";

  const isOverdrivePedal = (pedal: AnyRow) =>
    getTypes(pedal).includes("overdrive");

  const isBossTunerWithDCOut = (pedal: AnyRow) => {
    const brand = normalize(pedal.brand);
    const name = normalize(pedal.name);

    if (brand !== "boss") {
      return false;
    }

    const model = name.split(/\s+/)[0];

    return ["tu-3", "tu-3w", "tu-3s"].includes(model);
  };

  const poweredPedals = pedalAssignments
    .map((assignment) => assignment.pedal)
    .filter(isExternallyPoweredPedal);

  /*
   * Transforme les groupes de sorties de l'alimentation en sorties
   * physiques individuelles.
   *
   * Exemple Canvas Power 5 :
   * 4x 9V / 500 mA
   * 1x 9/12/18V
   *
   * devient cinq sorties 9V utilisables.
   */
  const physicalOutputs = powerUnits.flatMap((powerUnit) => {
    const outputs = extractOutputs(powerUnit.details || "");

    return outputs.flatMap((output) => {
      const result: {
        voltage: number;
        current: number;
      }[] = [];

      for (let outputIndex = 0; outputIndex < output.count; outputIndex++) {
        output.voltages.forEach((voltage, voltageIndex) => {
          const numericVoltage = Number(voltage);

          if (!Number.isFinite(numericVoltage)) {
            return;
          }

          const current =
            Number(output.currents[voltageIndex] ?? output.currents[0]) || 0;

          result.push({
            voltage: numericVoltage,
            current,
          });
        });
      }

      return result;
    });
  });

  /*
   * Pour les recommandations de splitter, on privilégie :
   *
   * 1. Overdrive analogique
   * 2. Autre pédale analogique
   * 3. Consommation la plus faible
   *
   * Les pédales numériques ne sont pas proposées en daisy chain.
   */
  const analogCandidates = poweredPedals
    .filter(isAnalogPedal)
    .sort((a, b) => {
      const aOverdrivePriority = isOverdrivePedal(a) ? 0 : 1;
      const bOverdrivePriority = isOverdrivePedal(b) ? 0 : 1;

      if (aOverdrivePriority !== bOverdrivePriority) {
        return aOverdrivePriority - bOverdrivePriority;
      }

      return getPedalDraw(a) - getPedalDraw(b);
    });

  const bossTunerWithDCOut =
    poweredPedals.find(isBossTunerWithDCOut) || null;

  /*
   * Retrouve l'assignation électrique du TU-3 / TU-3W / TU-3S
   * afin de connaître la capacité de la sortie qui l'alimente.
   */
  const bossTunerAssignment = bossTunerWithDCOut
    ? pedalAssignments.find(
      (assignment) => assignment.pedal === bossTunerWithDCOut
    )
    : undefined;

  /*
   * Courant disponible à 9V sur la sortie qui alimente l'accordeur.
   */
  const tunerOutputCapacity = (() => {
    const output = bossTunerAssignment?.output;

    if (!output) {
      return 0;
    }

    const voltageIndex = output.voltages.findIndex(
      (voltage) => Number(voltage) === 9
    );

    if (voltageIndex === -1) {
      return 0;
    }

    return Number(
      output.currents[voltageIndex] ?? output.currents[0]
    ) || 0;
  })();

  /*
   * Consommation propre de l'accordeur.
   * Elle doit être incluse dans le courant total utilisé
   * sur la sortie de l'alimentation.
   */
  const tunerDraw = bossTunerWithDCOut
    ? getPedalDraw(bossTunerWithDCOut)
    : 0;

  /*
   * Candidats pouvant être alimentés depuis le DC OUT :
   * - analogiques
   * - 9V
   * - l'accordeur lui-même est exclu
   *
   * analogCandidates est déjà trié :
   * 1. overdrives analogiques
   * 2. autres analogiques
   * 3. consommation la plus faible
   */
  const tunerCandidates =
    bossTunerWithDCOut && extraPedals > 0
      ? analogCandidates.filter(
        (pedal) =>
          pedal !== bossTunerWithDCOut &&
          getPedalVoltage(pedal) === 9
      )
      : [];

  /*
   * On autorise au maximum 3 pédales supplémentaires
   * sur le DC OUT du tuner.
   *
   * On ne prend que le nombre nécessaire pour résoudre
   * le manque de sorties.
   */
  const maxTunerPedals = Math.min(
    3,
    extraPedals,
    tunerCandidates.length
  );

  const tunerPoweredPedals: AnyRow[] = [];

  let tunerChainDraw = tunerDraw;

  for (const pedal of tunerCandidates) {
    if (tunerPoweredPedals.length >= maxTunerPedals) {
      break;
    }

    const pedalDraw = getPedalDraw(pedal);

    if (
      tunerOutputCapacity > 0 &&
      tunerChainDraw + pedalDraw <= tunerOutputCapacity
    ) {
      tunerPoweredPedals.push(pedal);
      tunerChainDraw += pedalDraw;
    }
  }

  /*
   * Chaque pédale alimentée depuis le DC OUT économise
   * une sortie sur l'alimentation principale.
   */
  const tunerSavedOutputs = tunerPoweredPedals.length;

  let remainingOutputsToSave = Math.max(
    0,
    extraPedals - tunerSavedOutputs
  );

  /*
   * Les pédales déjà alimentées par le tuner sont retirées
   * des candidats au splitter.
   */
  const splitterCandidates = analogCandidates.filter(
    (pedal) =>
      pedal !== bossTunerWithDCOut &&
      !tunerPoweredPedals.includes(pedal)
  );

  const availableOutputCapacities = physicalOutputs
    .filter((output) => output.voltage === 9)
    .map((output) => output.current)
    .filter((current) => current > 0)
    .sort((a, b) => b - a);

  type SplitterGroup = {
    pedals: AnyRow[];
    totalDraw: number;
    outputCapacity: number;
    savedOutputs: number;
  };

  const splitterGroups: SplitterGroup[] = [];

  const unusedCandidates = [...splitterCandidates];

  /*
   * Chaque pédale supplémentaire placée sur une même sortie
   * économise une sortie.
   *
   * 2 pédales = 1 sortie économisée
   * 3 pédales = 2 sorties économisées
   * 4 pédales = 3 sorties économisées
   * etc.
   */
  for (const outputCapacity of availableOutputCapacities) {
    if (remainingOutputsToSave <= 0) {
      break;
    }

    if (unusedCandidates.length < 2) {
      break;
    }

    const group: AnyRow[] = [];
    let groupDraw = 0;

    /*
     * Pour économiser N sorties, il faut au maximum N + 1 pédales
     * dans le groupe courant.
     */
    const maxPedalsNeeded = Math.min(
      3,
      remainingOutputsToSave + 1
    );

    for (let i = 0; i < unusedCandidates.length;) {
      const pedal = unusedCandidates[i];

      if (getPedalVoltage(pedal) !== 9) {
        i++;
        continue;
      }

      const pedalDraw = getPedalDraw(pedal);

      if (
        group.length < maxPedalsNeeded &&
        groupDraw + pedalDraw <= outputCapacity
      ) {
        group.push(pedal);
        groupDraw += pedalDraw;
        unusedCandidates.splice(i, 1);
      } else {
        i++;
      }

      if (group.length >= maxPedalsNeeded) {
        break;
      }
    }

    if (group.length >= 2) {
      const savedOutputs = group.length - 1;

      splitterGroups.push({
        pedals: group,
        totalDraw: groupDraw,
        outputCapacity,
        savedOutputs,
      });

      remainingOutputsToSave = Math.max(
        0,
        remainingOutputsToSave - savedOutputs
      );
    } else {
      /*
       * Si on n'a pas réussi à former un groupe, on remet
       * l'éventuelle pédale retirée dans les candidats.
       */
      unusedCandidates.unshift(...group);
    }
  }

  const recommendationCanSolve =
    extraPedals > 0 &&
    remainingOutputsToSave === 0;

  const formatPedalList = (pedals: AnyRow[]) => {
    const names = pedals.map(formatPedalName);

    if (names.length === 0) {
      return "";
    }

    if (names.length === 1) {
      return names[0];
    }

    if (names.length === 2) {
      return `${names[0]} et ${names[1]}`;
    }

    return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]
      }`;
  };

  const renderPedalName = (pedal: AnyRow) => (
    <>
      <span className="font-bold">
        {pedal.brand || "Custom"}
      </span>{" "}
      <span>
        {pedal.name || ""}
      </span>
    </>
  );

  const renderPedalList = (pedals: AnyRow[]) => (
    <>
      {pedals.map((pedal, index) => (
        <React.Fragment key={index}>
          {index > 0 &&
            (index === pedals.length - 1
              ? " et "
              : ", ")}
          {renderPedalName(pedal)}
        </React.Fragment>
      ))}
    </>
  );

  const renderPedalSentence = (
    text: string,
    pedals: AnyRow[]
  ) => {
    const [before, after = ""] = text.split("{pedals}");

    return (
      <>
        {before}
        {renderPedalList(pedals)}
        {after}
      </>
    );
  };

  const splitterPoweredPedals = splitterGroups.flatMap(
    (group) => group.pedals
  );

  const individuallyPoweredPedals = poweredPedals.filter(
    (pedal) =>
      !tunerPoweredPedals.includes(pedal) &&
      !splitterPoweredPedals.includes(pedal)
  );

  const splitterRecommendationText = splitterGroups
    .map((group) =>
      t("powerSetup.recommendation.splitterGroup")
        .replace("{pedals}", formatPedalList(group.pedals))
        .replace("{draw}", String(group.totalDraw))
        .replace("{capacity}", String(group.outputCapacity))
    )
    .join(" ");

  return (
    <div
      className={
        isMobile
          ? "w-full min-h-full bg-zinc-800 border-0 rounded-none p-6"
          : "w-full bg-transparent border-0 rounded-none p-0"
      }
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
          <img
            src={
              isLightTheme
                ? "/images/tab-power2-dark.webp"
                : "/images/tab-power2-light.webp"
            }
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-[18px] h-[18px] object-contain shrink-0"
          />

          {t("powerSetup.title")}
        </div>
      </div>

      {powerUnits.length > 0 && (
        <div className="mb-1">
          <div className="space-y-6">
            {powerUnits.map((p, index) => {
              const outputs = extractOutputs(p.details);

              return (
                <div key={index} className="space-y-4">
                  <div className="w-full flex justify-center">
                    <div className="overflow-hidden rounded-sm">
                      <img
                        src={p.image || p.image_url || p.photo}
                        alt={p.name}
                        className="w-full max-w-[150px] object-contain"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[14px] leading-tight mb-3">
                      <span className="font-bold">
                        {p.brand}
                      </span>{" "}
                      <span className="font-normal">
                        {p.name}
                      </span>
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
                          <div key={i} className="space-y-1 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-wide">
                              {o.count}{" "}
                              {o.isSwitch
                                ? t(
                                  o.count > 1
                                    ? "powerSetup.outputs_other.switchable_plural"
                                    : "powerSetup.outputs_other.switchable"
                                )
                                : t(
                                  o.count > 1
                                    ? "powerSetup.outputs_other.fixed_plural"
                                    : "powerSetup.outputs_other.fixed"
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

      <div className="mb-1 mt-6 text-[11px] uppercase tracking-wide font-bold">
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
                  <span className="shrink-0">
                    •
                  </span>

                  <span className="font-bold">
                    {a.pedal.brand || "Custom"}
                  </span>

                  <span>
                    {a.pedal.name}
                  </span>
                </div>

                <div className="mx-2 border-b border-dotted border-zinc-600 mb-[2px]" />

                <div
                  className={`
    text-[11px]
    font-bold
    whitespace-nowrap
    text-right
    ${a.ok ? "text-green-600" : "text-red-500"}
  `}
                >
                  {a.ok ? "OK" : "KO"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasPedals && powerMessage && (
        <div className="flex items-center justify-between -mt-3">
          <div
            className={`text-[12px] ${hasFailingPedal
                ? "text-red-500"
                : extraPedals > 0
                  ? recommendationCanSolve
                    ? "text-green-600"
                    : "text-red-500"
                  : powerMessageColor
              }`}
          >
            {hasFailingPedal
              ? t("powerSetup.status.notCompatible")
              : extraPedals > 0
                ? recommendationCanSolve
                  ? splitterGroups.length === 1
                    ? t("powerSetup.status.requiresSplitter")
                    : t("powerSetup.status.requiresSplitters")
                  : t("powerSetup.status.notEnoughOutputs")
                : powerMessage}
          </div>
        </div>
      )}

      <div className="mb-1 mt-6 text-[11px] uppercase tracking-wide font-bold">
        {t("powerSetup.sections.recommendation")}
      </div>

      <div className="space-y-2 text-[11px] -mt-1">
        {!hasPedals && (
          <>
            <div className="text-blue-400">
              {t("powerSetup.empty.title")}
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
                      <div className="text-yellow-500">
                        {t("powerSetup.recommendation.isolated")}
                      </div>
                    )}

                    {isLargeBoard && (
                      <div className="text-green-600">
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

                {extraPedals > 0 && (
                  <>
                    {recommendationCanSolve ? (
                      <div className="space-y-3">
                        {bossTunerWithDCOut && tunerPoweredPedals.length > 0 && (
                          <div className="flex gap-2">
                            <span className="text-[11px] font-bold shrink-0">1.</span>

                            <div>
                              <div className="text-[11px] font-bold">
                                {t("powerSetup.recommendation.stepTunerTitle")}
                              </div>

                              <div>
                                {(() => {
                                  const text = t("powerSetup.recommendation.stepTuner");

                                  const [beforeTuner, afterTuner = ""] =
                                    text.split("{tuner}");

                                  const [betweenTunerAndPedals, afterPedals = ""] =
                                    afterTuner.split("{pedals}");

                                  return (
                                    <>
                                      {beforeTuner}

                                      {renderPedalName(bossTunerWithDCOut)}

                                      {betweenTunerAndPedals}

                                      {renderPedalList(tunerPoweredPedals)}

                                      {afterPedals}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {splitterGroups.map((group, index) => {
                          const stepNumber =
                            (tunerPoweredPedals.length > 0 ? 2 : 1) + index;

                          return (
                            <div key={index} className="flex gap-2">
                              <span className="text-[11px] font-bold shrink-0">
                                {stepNumber}.
                              </span>

                              <div>
                                <div className="text-[11px] font-bold">
                                  {t("powerSetup.recommendation.stepSplitterTitle")
                                    .replace("{count}", String(group.pedals.length))}
                                </div>

                                <div>
                                  {renderPedalSentence(
                                    t("powerSetup.recommendation.stepSplitter"),
                                    group.pedals
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div className="flex gap-2">
                          <span className="text-[11px] font-bold shrink-0">
                            {(tunerPoweredPedals.length > 0 ? 1 : 0) +
                              splitterGroups.length +
                              1}.
                          </span>

                          <div>
                            <div className="text-[11px] font-bold">
                              {t("powerSetup.recommendation.stepOthersTitle")}
                            </div>

                            <div>
                              {renderPedalSentence(
                                t("powerSetup.recommendation.individualOthers"),
                                individuallyPoweredPedals
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {t("powerSetup.recommendation.cannotSolve")}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}