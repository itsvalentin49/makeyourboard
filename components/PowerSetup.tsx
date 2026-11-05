"use client";
import React, { useMemo } from "react";
import { Zap } from "lucide-react";
import { label, planPowerSetup, type Row } from "@/utils/powerFinder";

type Props = {
  t: (key: string) => string;
  powerUnits: Row[];
  pedalAssignments: { pedal: Row;[key: string]: unknown }[];
  isLightTheme: boolean;
  isMobile?: boolean;
  [key: string]: unknown;
};

export default function PowerSetup({ t, powerUnits, pedalAssignments, isLightTheme }: Props) {
  const plan = useMemo(() => planPowerSetup(pedalAssignments.map(a => a.pedal), powerUnits), [pedalAssignments, powerUnits]);
  const tr = (key: string) => t(`powerSetupPlan.${key}`);
  const pedalName = (p: Row) => <><strong>{String(p.brand ?? "")}</strong>{p.brand ? " " : ""}{String(p.name ?? "")}</>;
  const muted = isLightTheme ? "#626975" : "#a1a1aa";
  const ok = isLightTheme ? "#15803d" : "#22c55e";
  const ko = isLightTheme ? "#dc2626" : "#f87171";
  const line = isLightTheme ? "#c4c8ce" : "#52525b";
  const small: React.CSSProperties = { fontSize: 11, lineHeight: 1.5, color: muted };
  return <section style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 12, lineHeight: 1.5, minWidth: 0 }}>
    <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
      <Zap size={18} style={{ flexShrink: 0 }} />{tr("title")}
    </h2>
    {!plan.count ? <p style={{ ...small, margin: 0 }}>{tr("empty")}</p> : <>
      {!powerUnits.length && <p style={{ ...small, margin: 0 }}>{tr("addSupply")}</p>}
      {powerUnits.map((s, si) => {
        const outputs = plan.outlets.filter(o => o.supplyIndex === si);
        const src = s.image || s.image_url;
        return <div key={si} style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {typeof src === "string" && src && <img src={src} alt="" style={{ display: "block", width: 160, height: 96, maxWidth: "100%", maxHeight: 96, minWidth: 0, objectFit: "contain", flexShrink: 0, margin: 0 }} />}
            <div style={{ minWidth: 0, textAlign: "center" }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, overflowWrap: "anywhere" }}>{String(s.brand ?? "")}</h3>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 400, overflowWrap: "anywhere" }}>{String(s.name ?? "")}</p>
              {powerUnits.length > 1 && <span style={small}>{tr("supply")} {si + 1}</span>}
            </div>
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {outputs.map(o => {
              const a = o.assignment;
              const freeMode = o.modes.find(m => m.voltage === 9) ?? o.modes[0];
              if (!a) return <li key={o.output} style={{ padding: "8px 0", borderBottom: `1px dashed ${line}` }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700 }}>{tr("output")} {o.output} · {tr("unused")}</span>
                  <span style={{ color: muted, fontSize: 11, fontWeight: 600 }}>0 / {freeMode.current} mA</span>
                </div>
              </li>;
              return <li key={o.output} style={{ padding: "8px 0", borderBottom: `1px dashed ${line}` }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700 }}>{tr("output")} {o.output} · {a.voltage} V</span>
                  <span style={{ color: a.draw <= a.capacity ? ok : ko, fontSize: 11, fontWeight: 600 }}>{a.draw} / {a.capacity} mA</span>
                </div>
                {a.pedals.map((p, i) => <div key={i} style={{ paddingLeft: 10, fontSize: 11, marginTop: 2, overflowWrap: "anywhere" }}>
                  – {pedalName(p)}
                </div>)}
                {a.via !== "individual" && <p style={{ ...small, margin: "3px 0 0 10px", color: isLightTheme ? "#a16207" : "#facc15" }}>{a.via === "tuner" ? tr("tuner").replace("{pedal}", String(a.pedals[1]?.name ?? "")) : tr("daisy")}</p>}
              </li>;
            })}
          </ul>
        </div>;
      })}
      {plan.unpowered.length > 0 && <div>
        <h3 style={{ margin: "0 0 5px", fontSize: 12, fontWeight: 700, color: ko }}>{tr("remaining")}</h3>
        {plan.unpowered.map((p, i) => <p key={i} style={{ margin: "2px 0", fontSize: 11 }}>– {pedalName(p)}</p>)}
      </div>}
      {plan.unsupported.length > 0 && <p style={{ ...small, color: ko, margin: 0 }}>{tr("unsupported")} {plan.unsupported.map(label).join(", ")}</p>}
      {plan.searchLimited && <p style={{ ...small, margin: 0 }}>{tr("limited")}</p>}
      {powerUnits.length > 0 && <p role="status" style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: plan.complete ? ok : ko }}>{tr(plan.complete ? "success" : "failure")}{plan.complete ? " 🤟" : ""}</p>}
    </>}
  </section>;
}
