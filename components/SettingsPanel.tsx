"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  t: (key: string) => string;

  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: "en" | "fr" | "es" | "de" | "it" | "pt";
  setLanguage: (v: "en" | "fr" | "es" | "de" | "it" | "pt") => void;

  units: "metric" | "imperial";
  setUnits: (v: "metric" | "imperial") => void;
};

export default function SettingsPanel({
  t,
  canvasBg,
  setCanvasBg,
  language,
  setLanguage,
  units,
  setUnits,
}: Props) {
  const [bgOpen, setBgOpen] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
  if (typeof window === "undefined") return "light";

  const isLight = document.documentElement.classList.contains("light");
  return isLight ? "light" : "dark";
});

  const bgRef = React.useRef<HTMLDivElement>(null);
  const langRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
  document.documentElement.classList.remove("light");
  setTheme("dark");
} else {
  document.documentElement.classList.add("light");
  setTheme("light");
}
}, []);

  React.useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (
      langRef.current &&
      !langRef.current.contains(e.target as Node)
    ) {
      setLangOpen(false);
    }

    if (
      bgRef.current &&
      !bgRef.current.contains(e.target as Node)
    ) {
      setBgOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const LANGUAGE_LABELS: Record<string, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
  };

  const handleThemeChange = (value: "dark" | "light") => {
  setTheme(value);

if (value === "light") {
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
}

  localStorage.setItem("theme", value);
};

  return (
  <div className="space-y-6">

   {/* LANGUAGE */}
<div className="flex items-center gap-4">
  <span className="w-28 text-[10px] text-white uppercase font-black tracking-widest">
    {t("settings.language")}
  </span>

  <div ref={langRef} className="relative flex-1">
    <button
      type="button"
      onClick={() => setLangOpen((v) => !v)}
      className="w-full h-[36px] bg-zinc-950 font-black border border-zinc-800 rounded-lg px-4 text-[10px] text-left text-white flex items-center justify-between hover:border-zinc-600 transition-colors"
    >
      <span>{LANGUAGE_LABELS[language]}</span>
      <ChevronDown className={`size-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
    </button>

    {langOpen && (
      <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        {Object.keys(LANGUAGE_LABELS).map((l) => (
          <button
            key={l}
            onClick={() => {
              setLanguage(l as any);
              setLangOpen(false);
            }}
            className="w-full h-[36px] px-4 text-left text-[10px] text-white flex items-center hover:bg-zinc-800"
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}
      </div>
    )}
  </div>
</div>

{/* UNITS */}
<div className="flex items-center gap-4 pt-5 border-t border-zinc-800/60">
  <span className="w-28 text-[10px] text-white uppercase font-black tracking-widest">
    {t("settings.units")}
  </span>

  <div className="flex-1">
    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
      {[
        { key: "metric", label: t("settings.unitsOptions.metric"), sub: "mm · g · kg" },
        { key: "imperial", label: t("settings.unitsOptions.imperial"), sub: "in · oz · lb" },
      ].map((u) => {
        const isActive = units === u.key;

        return (
          <button
            key={u.key}
            onClick={() => setUnits(u.key as any)}
            className={`flex-1 h-[36px] rounded-md ${
              isActive
                ? "bg-zinc-800 text-white"
                : "text-white"
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full leading-tight">
              <span className="text-[10px] font-black tracking-wide">
                {u.label}
              </span>
              <span className="mt-[3px] text-[8px] font-semibold tracking-wide">
                {u.sub}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
</div>

{/* THEME */}
<div className="flex items-center gap-4 pt-5 border-t border-zinc-800/60">
  <span className="w-28 text-[10px] text-white uppercase font-black tracking-widest">
    {t("settings.theme")}
  </span>

  <div className="flex-1">
    <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
      {[
        { key: "dark", label: t("settings.themeOptions.dark") },
        { key: "light", label: t("settings.themeOptions.light") },
      ].map((t) => {
        const isActive = theme === t.key;

        return (
          <button
            key={t.key}
            onClick={() => handleThemeChange(t.key as any)}
            className={`flex-1 h-[36px] rounded-md ${
              isActive
                ? "bg-zinc-800 text-white"
                : "text-white"
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full leading-tight">
              <span className="text-[10px] font-black tracking-wide">
                {t.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </div>
</div>

   {/* BACKGROUND TEMP DISABLED */}
{false && (
  <div className="flex items-center gap-4 pt-5 border-t border-zinc-800/60">
    <span className="w-28 text-[10px] text-white uppercase font-black tracking-widest">
      {t("settings.background")}
    </span>

    <div ref={bgRef} className="relative flex-1">
      <button
        type="button"
        onClick={() => setBgOpen((v) => !v)}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-[11px] text-left text-white flex items-center justify-between hover:border-zinc-600 transition-colors"
      >
        <span>{t(`backgrounds.${canvasBg}`)}</span>
        <ChevronDown
          className={`size-3 transition-transform ${
            bgOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {bgOpen && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          {["neutral", "wood", "marble", "rug", "stage", "flightcase"].map(
            (bg) => (
              <button
                key={bg}
                onClick={() => {
                  setCanvasBg(bg);
                  setBgOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-[11px] hover:bg-zinc-800"
              >
                {t(`backgrounds.${bg}`)}
              </button>
            )
          )}
        </div>
      )}
    </div>
  </div>
)}

  </div>
);
}