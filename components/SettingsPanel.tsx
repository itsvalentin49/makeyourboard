"use client";

import React from "react";
import { ChevronDown, ArrowLeft, Sun, Moon, Check } from "lucide-react";
import type { Language } from "@/utils/i18n";

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
  thumbSrc?: string;
};

type Props = {
  t: (key: string) => string;

  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: Language;
  setLanguage: (v: Language) => void;

  units: "metric" | "imperial";
  setUnits: (v: "metric" | "imperial") => void;

  backgrounds: Background[];
  setContactOpen: (v: boolean) => void;
};

export default function SettingsPanel({
  t,
  canvasBg,
  setCanvasBg,
  language,
  setLanguage,
  units,
  setUnits,
  backgrounds,
  setContactOpen,

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

    if (!savedTheme || savedTheme === "light") {
      document.documentElement.classList.add("light");
      setTheme("light");
      localStorage.setItem("theme", "light");
      return;
    }

    document.documentElement.classList.remove("light");
    setTheme("dark");
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

  const LANGUAGE_LABELS: Record<Language, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    zh: "中文",
  };

  const selectedBackground =
    backgrounds.find(
      (background) =>
        background.id === canvasBg
    ) || backgrounds[0];

  const getBackgroundLabel = (
    background: Background
  ) => {
    const translated = t(
      `backgrounds.${background.id}`
    );

    if (
      translated &&
      translated !==
      `backgrounds.${background.id}`
    ) {
      return translated;
    }

    return background.label;
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
    <div className="flex flex-col gap-4">

      {/* LANGUAGE */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.language")}
        </span>

        <div ref={langRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="w-full h-[35px] bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-[10px] text-left flex items-center justify-between hover:border-zinc-600 transition-colors"
          >
            <span>{LANGUAGE_LABELS[language]}</span>
            <ChevronDown className={`size-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>

          {langOpen && (
            <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLanguage(l);
                    setLangOpen(false);
                  }}
                  className="w-full h-[25px] px-4 text-left text-[10px] flex items-center hover:bg-canvas"
                >
                  {LANGUAGE_LABELS[l]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* UNITS */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.units")}
        </span>

        <div>
          <div
            className="
        relative grid grid-cols-2
        h-[36px]
        rounded-lg
        bg-zinc-950 border border-zinc-800
        overflow-hidden
      "
          >
            {/* OPTION SÉLECTIONNÉE */}
            <div
              className={`
    absolute
    top-0
    h-full
    w-1/2
    rounded-md
    border
    border-blue-500
    bg-blue-500/10
    transition-transform
    duration-200
    ease-out
    ${units === "imperial"
                  ? "translate-x-full"
                  : "translate-x-0"
                }
  `}
            />

            {[
              {
                key: "metric",
                label: t("settings.unitsOptions.metric"),
                sub: "mm · g · kg",
              },
              {
                key: "imperial",
                label: t("settings.unitsOptions.imperial"),
                sub: "in · oz · lb",
              },
            ].map((u) => {
              const isActive = units === u.key;

              return (
                <button
                  key={u.key}
                  onClick={() => setUnits(u.key as any)}
                  className="
              relative z-10
              flex flex-col items-center justify-center
              h-full leading-tight
            "
                >
                  <span className="text-[10px] font-bold">
                    {u.label}
                  </span>

                  <span className="text-[8px] tracking-wide">
                    {u.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* THEME */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.theme")}
        </span>

        <div
          className="
      relative grid grid-cols-2
      h-[36px]
      rounded-lg
      bg-zinc-950 border border-zinc-800
      overflow-hidden
    "
        >
          {/* OPTION SÉLECTIONNÉE */}
          <div
            className={`
    absolute
    top-0
    h-full
    w-1/2
    rounded-md
    border
    border-blue-500
    bg-blue-500/10
    transition-transform
    duration-200
    ease-out
    ${theme === "dark"
                ? "translate-x-full"
                : "translate-x-0"
              }
  `}
          />

          {[
            {
              key: "light",
              label: t("settings.themeOptions.light"),
              icon: Sun,
            },
            {
              key: "dark",
              label: t("settings.themeOptions.dark"),
              icon: Moon,
            },
          ].map((item) => {
            const isActive = theme === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  handleThemeChange(item.key as "dark" | "light")
                }
                className="
            relative z-10
            flex items-center justify-center gap-1.5
            h-full
            text-[10px]
          "
              >
                <Icon
                  size={15}
                  className="transition-colors duration-200"
                />

                <span className="transition-colors duration-200 font-bold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>


      {/* BACKGROUND */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.background")}
        </span>

        <div
          ref={bgRef}
          className="relative"
        >
          {/* VALEUR SÉLECTIONNÉE */}
          <button
            type="button"
            onClick={() => {
              setBgOpen(
                (current) => !current
              );

              setLangOpen(false);
            }}
            className="
        w-full
        h-[40px]
        px-3
        bg-zinc-950
        border
        border-zinc-800
        rounded-lg
        text-[10px]
        text-left
        flex
        items-center
        justify-between
        hover:border-zinc-600
        transition-colors
      "
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="
            w-[48px]
            h-[24px]
            rounded-[4px]
            border
            border-zinc-700
            overflow-hidden
            shrink-0
            bg-zinc-900
          "
              >
                {selectedBackground?.type ===
                  "image" &&
                  selectedBackground.thumbSrc ? (
                  <img
                    src={
                      selectedBackground.thumbSrc
                    }
                    alt=""
                    draggable={false}
                    className="
                block
                w-full
                h-full
                object-cover
                pointer-events-none
              "
                  />
                ) : (
                  <div className="w-full h-full bg-canvas" />
                )}
              </div>

              <span className="truncate font-bold">
                {selectedBackground
                  ? getBackgroundLabel(
                    selectedBackground
                  )
                  : ""}
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`
          ml-3
          shrink-0
          text-zinc-500
          transition-transform
          ${bgOpen ? "rotate-180" : ""}
        `}
            />
          </button>

          {/* LISTE DES FONDS */}
          {bgOpen && (
            <div
              className="
          absolute
          z-50
          top-full
          mt-1
          left-0
          w-full
          bg-zinc-950
          border
          border-zinc-800
          rounded-lg
          overflow-hidden
          shadow-2xl
        "
            >
              {backgrounds.map(
                (background) => {
                  const active =
                    canvasBg === background.id;

                  return (
                    <button
                      key={background.id}
                      type="button"
                      onClick={() => {
                        setCanvasBg(
                          background.id
                        );

                        setBgOpen(false);
                      }}
                      className={`
                  w-full
                  h-[42px]
                  px-3
                  flex
                  items-center
                  justify-between
                  text-left
                  text-[10px]
                  hover:bg-canvas
                  transition-colors
                  ${active
                          ? "font-black"
                          : "font-normal"
                        }
                `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="
                      w-[48px]
                      h-[24px]
                      rounded-[4px]
                      border
                      border-zinc-700
                      overflow-hidden
                      shrink-0
                      bg-zinc-900
                    "
                        >
                          {background.type ===
                            "image" &&
                            background.thumbSrc ? (
                            <img
                              src={
                                background.thumbSrc
                              }
                              alt=""
                              draggable={false}
                              className="
                          block
                          w-full
                          h-full
                          object-cover
                          pointer-events-none
                        "
                            />
                          ) : (
                            <div className="w-full h-full bg-canvas" />
                          )}
                        </div>

                        <span className="truncate">
                          {getBackgroundLabel(
                            background
                          )}
                        </span>
                      </div>

                      <span
                        className={`
                    w-[16px]
                    h-[16px]
                    rounded-full
                    border
                    flex
                    items-center
                    justify-center
                    shrink-0
                    ${active
                            ? "border-blue-500 bg-blue-500"
                            : "border-zinc-500 bg-transparent"
                          }
                  `}
                      >
                        {active && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}