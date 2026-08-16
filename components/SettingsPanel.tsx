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
  const [contactOpenLocal, setContactOpenLocal] = React.useState(false);
  const [contactEmail, setContactEmail] = React.useState<string>("");
  const [contactMessage, setContactMessage] = React.useState<string>("");
  const [contactType, setContactType] = React.useState<string>("question");
  const [contactTypeOpen, setContactTypeOpen] = React.useState(false);
  const [honeypot, setHoneypot] = React.useState("");
  const [contactLoading, setContactLoading] = React.useState(false);
  const [contactSuccess, setContactSuccess] = React.useState(false);
  const [contactError, setContactError] = React.useState("");
  const contactTypeRef = React.useRef<HTMLDivElement>(null);
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
        contactTypeRef.current &&
        !contactTypeRef.current.contains(e.target as Node)
      ) {
        setContactTypeOpen(false);
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

  const CONTACT_TYPES = [
    { value: "question", label: t("contact.types.question") },
    { value: "request", label: t("contact.types.request") },
    { value: "bug", label: t("contact.types.bug") },
    { value: "other", label: t("contact.types.other") },
  ];

  const handleThemeChange = (value: "dark" | "light") => {
    setTheme(value);

    if (value === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    localStorage.setItem("theme", value);
  };

  if (contactOpenLocal) {
    return (
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black uppercase">
            {t("contact.title")}
          </span>

          <button onClick={() => setContactOpenLocal(false)} className="p-1">
            <ArrowLeft
              size={18}
              style={{ color: "#71717a", cursor: "pointer" }}
              onMouseEnter={(e) => {
                const isLight = document.documentElement.classList.contains("light");
                e.currentTarget.style.color = isLight ? "#000000" : "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#71717a";
              }}
            />
          </button>
        </div>

        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-black tracking-widest">
            {t("contact.email")}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] outline-none focus:outline-none focus:ring-0"
            placeholder={t("contact.placeholderEmail")}
          />
        </div>

        {/* TYPE */}
        <div className="flex flex-col gap-1 relative" ref={contactTypeRef}>
          <label className="text-[10px] uppercase font-black tracking-widest">
            {t("contact.type")}
          </label>

          <button
            type="button"
            onClick={() => setContactTypeOpen((v) => !v)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2
                    text-[11px] text-left text-zinc-400
                    flex items-center justify-between
                    hover:border-zinc-600 transition-colors"
          >
            <span>
              {CONTACT_TYPES.find(t => t.value === contactType)?.label}
            </span>

            <ChevronDown
              size={14}
              className={`text-zinc-500 transition-transform ${contactTypeOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {contactTypeOpen && (
            <div className="absolute top-full mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden z-50">
              {CONTACT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setContactType(type.value);
                    setContactTypeOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-canvas"
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MESSAGE */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-black tracking-widest">
            {t("contact.message")}
          </label>
          <textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            rows={5}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] outline-none focus:outline-none focus:ring-0"
            placeholder={t("contact.placeholderMessage")}
          />
        </div>

        {/* HONEYPOT (anti-spam) */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />

        <button
          disabled={contactLoading || contactSuccess}
          onClick={async () => {
            setContactError("");

            if (honeypot) return;

            if (!contactEmail || !contactMessage) {
              setContactError("Missing fields");
              return;
            }

            try {
              setContactLoading(true);

              const res = await fetch("/api/contact", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: contactEmail,
                  subject: "MakeYourBoard Contact",
                  message: contactMessage,
                  type: contactType,
                  honeypot,
                }),
              });

              if (!res.ok) {
                throw new Error("Failed");
              }

              setContactSuccess(true);
              setContactEmail("");
              setContactMessage("");

              setTimeout(() => {
                setContactSuccess(false);
                setContactOpenLocal(false);
              }, 2000);

            } catch (err) {
              setContactError("Error sending message");
            } finally {
              setContactLoading(false);
            }
          }}
          className={`w-full mt-2 text-[10px] font-black uppercase py-2 rounded-lg transition-all duration-300 ${contactSuccess
            ? "bg-emerald-500 !text-white"
            : contactLoading
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 !text-white"
            }`}
        >
          {contactSuccess
            ? "✓ Message envoyé"
            : contactLoading
              ? "Envoi..."
              : t("contact.send")}
        </button>

      </div>
    );
  }

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
    rounded-lg
    border-0
    bg-blue-600
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
                  <span
                    className={`text-[10px] font-bold ${isActive ? "!text-white" : ""
                      }`}
                  >
                    {u.label}
                  </span>

                  <span
                    className={`text-[8px] tracking-wide ${isActive ? "!text-white" : ""
                      }`}
                  >
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
    rounded-lg
    border-0
    bg-blue-600
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
                  className={`transition-colors duration-200 ${isActive ? "!text-white" : ""
                    }`}
                />

                <span
                  className={`transition-colors duration-200 font-bold ${isActive ? "!text-white" : ""
                    }`}
                >
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
              setContactTypeOpen(false);
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

      {/* ABOUT */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.about")}
        </span>

        <div className="flex items-center justify-between pt-2">

          {/* CONTACT (GAUCHE) */}
          <button
            onClick={() => setContactOpenLocal(true)}
            className="
    flex items-center gap-2
    transition-all duration-200
    hover:-translate-y-[1px]
    hover:scale-[1.03]
  "
          >
            <span className="text-[12px]">✉️</span>
            <span className="text-[10px] font-bold ">
              {t("footer.feedback")}
            </span>
          </button>

          {/* DONATE (DROITE) */}
          <a
            href="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
            target="_blank"
            rel="noopener noreferrer"
            className="
    flex items-center gap-2
    transition-all duration-200
    hover:-translate-y-[1px]
    hover:scale-[1.03]
    active:scale-95
  "
          >
            <span className="text-[12px]">❤️</span>
            <span className="text-[10px] font-bold">
              {t("footer.donate")}
            </span>
          </a>

        </div>
      </div>

    </div>
  );
}