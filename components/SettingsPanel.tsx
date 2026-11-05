"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, Sun, Moon, Check, Send, FileText, Heart, ExternalLink, X } from "lucide-react";
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
  onContactViewChange?: (open: boolean) => void;
  supportUrl?: string;
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
  onContactViewChange,
  supportUrl,

}: Props) {
  const [contactVisible, setContactVisible] = React.useState(false);
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


  if (contactVisible) return <SettingsContactForm t={t} onBack={() => { setContactVisible(false); onContactViewChange?.(false); }} />;
  return (
    <div className="myb-settings-panel flex flex-col gap-4">
      <style>{`
        .light .myb-settings-panel [data-settings-selection="true"] {
          border-color: var(--color-canvas, var(--canvas, #adb5bd)) !important;
        }
        .light .myb-settings-panel .myb-settings-hover:hover,
        .light .myb-settings-panel .myb-settings-hover:focus-visible {
          background-color: var(--zinc-700, #f4f4f5) !important;
        }
      `}</style>

      {/* LANGUAGE */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider">
          {t("settings.language")}
        </span>

        <div ref={langRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setLangOpen((v) => !v)}
            className="w-full h-[36px] bg-zinc-950 border border-zinc-800 rounded-lg px-4 text-[10px] text-left flex items-center justify-between hover:border-zinc-600 transition-colors"
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
                  className="w-full h-[25px] px-4 text-left text-[10px] flex items-center myb-settings-hover hover:bg-canvas"
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
              aria-hidden="true"
              data-settings-selection="true"
              style={{ border: "1px solid #111111", boxSizing: "border-box" }}
              className={`
    absolute
    top-0
    h-full
    w-1/2
    rounded-md
    pointer-events-none
    bg-canvas
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
                  type="button"
                  aria-pressed={isActive}
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
            aria-hidden="true"
            data-settings-selection="true"
            style={{ border: "1px solid #111111", boxSizing: "border-box" }}
            className={`
    absolute
    top-0
    h-full
    w-1/2
    rounded-md
    pointer-events-none
    bg-canvas
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
                aria-pressed={isActive}
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
        h-[36px]
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
                  myb-settings-hover hover:bg-canvas
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
      <div className="mt-2 flex flex-col gap-4 border-t border-zinc-700 pt-4">
        <div className="flex flex-col gap-1">
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider">{t("settings.resources")}</h3>
          <Link href="/docs" className="flex min-h-9 items-center gap-3 rounded-md px-2 py-2 text-[11px] myb-settings-hover hover:bg-canvas">
            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(145deg,#60a5fa,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={16} style={{ color: "white" }} /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span>{t("help.documentation")}</span><span className="text-[10px] leading-relaxed text-zinc-400">{t("settings.documentationDescription")}</span></span>
          </Link>
          <button type="button" onClick={() => { setContactVisible(true); onContactViewChange?.(true); }} className="flex min-h-9 items-center gap-3 rounded-md px-2 py-2 text-left text-[11px] myb-settings-hover hover:bg-canvas">
            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(145deg,#38bdf8,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Send size={15} strokeWidth={2} style={{ color: "white" }} /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span>{t("footer.feedback")}</span><span className="text-[10px] leading-relaxed text-zinc-400">{t("settings.contactDescription")}</span></span>
          </button>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="mb-1 text-[10px] font-bold uppercase tracking-wider">{t("settings.project")}</h3>
          <a href="https://www.instagram.com/makeyourboard_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-md px-2 py-2 text-[11px] myb-settings-hover hover:bg-canvas">
            <img src="/logos/instagram.png" alt="" aria-hidden="true" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span>Instagram</span><span className="text-[10px] leading-relaxed text-zinc-400">{t("settings.instagramDescription")}</span></span>
            <ExternalLink size={13} style={{ color: "#3b82f6" }} className="shrink-0" aria-hidden="true" />
          </a>
          {supportUrl && <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-9 items-center gap-3 rounded-md px-2 py-2 text-[11px] myb-settings-hover hover:bg-canvas">
            <Heart size={20} fill="#ef4444" stroke="#ef4444" aria-hidden="true" /><span className="flex min-w-0 flex-1 flex-col gap-0.5"><span>{t("settings.supportProject")}</span><span className="text-[10px] leading-relaxed text-zinc-400">{t("settings.supportDescription")}</span></span><ExternalLink size={13} style={{ color: "#3b82f6" }} aria-hidden="true" />
          </a>}
        </div>
      </div>
    </div>
  );
}
function SettingsContactForm({ t, onBack }: { t: (key: string) => string; onBack: () => void }) {
  const [email, setEmail] = React.useState("");
  const [type, setType] = React.useState("question");
  const [typeOpen, setTypeOpen] = React.useState(false);
  const typeRef = React.useRef<HTMLDivElement>(null);
  const typeButtonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    const outside = (event: MouseEvent) => { if (typeRef.current && !typeRef.current.contains(event.target as Node)) setTypeOpen(false); };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);
  const [message, setMessage] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const id = React.useId();
  const field = "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px]";
  return <form noValidate className="myb-settings-contact flex flex-col gap-4" onSubmit={async event => {
    event.preventDefault(); if (loading || success || honeypot) return;
    setError(""); setEmailError("");
    if (!email.trim() || !message.trim()) { setError(t("contact.errorRequired")); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError(t("contact.errorInvalidEmail")); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), subject: "MakeYourBoard Contact", message: message.trim(), type, honeypot }) });
      if (!response.ok) throw new Error("Contact request failed");
      setSuccess(true); setEmail(""); setMessage("");
    } catch { setError(t("contact.errorGeneric")); } finally { setLoading(false); }
  }}>
    <style>{`
      .myb-settings-contact input:focus,
      .myb-settings-contact input:focus-visible,
      .myb-settings-contact select:focus,
      .myb-settings-contact select:focus-visible,
      .myb-settings-contact textarea:focus,
      .myb-settings-contact textarea:focus-visible {
        outline: none !important;
        box-shadow: none !important;
        border-color: var(--zinc-800, #27272a) !important;
      }
      .myb-contact-close { cursor:pointer; transition:background-color 140ms ease,opacity 140ms ease; }
      .myb-contact-close:hover { background-color:rgba(140,140,150,.18); }
      .myb-contact-type-option:hover, .myb-contact-type-option:focus-visible { background-color:rgba(140,140,150,.18); }
      .myb-contact-type-button:focus, .myb-contact-type-button:focus-visible { outline:none !important; box-shadow:none !important; }
      .myb-contact-send { cursor: pointer; transition: background-color 140ms ease; }
      .myb-contact-send:hover:not(:disabled) { background-color: #3b82f6 !important; }
      .myb-contact-send:disabled { cursor: not-allowed; }
      .myb-contact-send[data-success="true"] {background-color:#10b981 !important;color:white !important;opacity:1 !important;cursor:default;}
    `}</style>
    <div className="flex items-center justify-between gap-3" style={{ marginBottom: 16, minHeight: 24 }}>
      <h2 className="m-0 text-xs font-bold uppercase tracking-wider">{t("contact.title")}</h2>
      <button type="button" onClick={onBack} aria-label={t("sidebar.back")} className="myb-contact-close flex h-6 w-6 items-center justify-center rounded-md"><X size={18} aria-hidden="true" /></button>
    </div>
    <div className="flex flex-col" style={{ gap: 4 }}>
      <label htmlFor={id + "-email"} className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider">{t("contact.email")}<input style={{ height: 36, minHeight: 36, boxSizing: "border-box" }} id={id + "-email"} type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError(""); }} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? id + "-email-error" : undefined} placeholder={t("contact.placeholderEmail")} className={field + " font-normal normal-case tracking-normal"} /></label>
      {emailError && <p id={id + "-email-error"} role="alert" className="m-0 text-[11px] leading-relaxed text-red-500" style={{ margin: 0 }}>{emailError}</p>}
    </div>
    <div ref={typeRef} className="relative flex flex-col gap-2" onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setTypeOpen(false); typeButtonRef.current?.focus(); } }}>
      <span id={id + "-type-label"} className="text-[10px] font-bold uppercase tracking-wider">{t("contact.type")}</span>
      <button ref={typeButtonRef} id={id + "-type"} type="button" aria-labelledby={id + "-type-label " + id + "-type-value"} aria-expanded={typeOpen} aria-controls={id + "-type-menu"} onClick={() => setTypeOpen(open => !open)} className={field + " myb-contact-type-button flex items-center justify-between gap-2 text-left"} style={{ height: 36, minHeight: 36, boxSizing: "border-box", cursor: "pointer" }}>
        <span id={id + "-type-value"}>{t("contact.types." + type)}</span><ChevronDown size={14} style={{ transform: typeOpen ? "rotate(180deg)" : "none", transition: "transform 140ms ease" }} aria-hidden="true" />
      </button>
      {typeOpen && <div id={id + "-type-menu"} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950" style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 50 }}>
        {["question", "request", "bug", "other"].map(value => <button key={value} type="button" aria-pressed={type === value} className="myb-contact-type-option flex w-full items-center justify-between px-3 text-left text-[11px]" style={{ height: 32, cursor: "pointer" }} onClick={() => { setType(value); setTypeOpen(false); typeButtonRef.current?.focus(); }}><span>{t("contact.types." + value)}</span></button>)}
      </div>}
    </div>
    <label htmlFor={id + "-message"} className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider">{t("contact.message")}<textarea id={id + "-message"} value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder={t("contact.placeholderMessage")} className={field + " resize-none font-normal normal-case tracking-normal"} /></label>
    <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: "none" }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
    {error && <p role="alert" className="text-[11px] text-red-500">{error}</p>}
    <button type="submit" style={{ height: 36, minHeight: 36, maxHeight: 36, boxSizing: "border-box", paddingTop: 0, paddingBottom: 0 }} aria-live="polite" data-success={success ? "true" : "false"} disabled={loading || success} className="myb-contact-send h-9 rounded-lg bg-blue-600 text-[10px] font-black uppercase !text-white disabled:opacity-50">{success ? t("contact.sent") : loading ? t("contact.sending") : t("contact.send")}</button>
  </form>;
}
