"use client";

import React from "react";
import { ChevronDown, ArrowLeft, X } from "lucide-react";

type Background = {
  id: string;
  label: string;
  type: "css" | "image";
  src?: string;
};

type Props = {
  t: (key: string) => string;

  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: "en" | "fr" | "es" | "de" | "it" | "pt";
  setLanguage: (v: "en" | "fr" | "es" | "de" | "it" | "pt") => void;

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

  const LANGUAGE_LABELS: Record<string, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
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
    style={{ color: "#71717a", cursor: "pointer" }} // gris
    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
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
            className={`text-zinc-500 transition-transform ${
              contactTypeOpen ? "rotate-180" : ""
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
  className={`w-full mt-2 text-[10px] font-black uppercase py-2 rounded-lg transition-all duration-300 ${
    contactSuccess
      ? "bg-emerald-500 text-white"
      : contactLoading
      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-500 text-white"
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
            className="w-full h-[36px] px-4 text-left text-[10px] text-white flex items-center hover:bg-canvas"
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
                ? "bg-canvas text-white"
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
                ? "bg-canvas text-white"
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

{/* BACKGROUND */}
<div className="flex items-start gap-4 pt-5 border-t border-zinc-800/60">

  <span className="w-28 text-[10px] text-white uppercase font-black tracking-widest">
    {t("settings.background")}
  </span>

  <div className="flex-1">
    <div className="grid grid-cols-2 gap-3">

      {(backgrounds ?? []).map((bg) => {
        const isActive = canvasBg === bg.id;

        return (
          <button
            key={bg.id}
            onClick={() => setCanvasBg(bg.id)}
            className={`
              relative
              w-full
              h-[80px]
              rounded-lg
              overflow-hidden
              border
              transition-all
              duration-200
              cursor-pointer
              ${isActive 
                ? "border-blue-500" 
                : "border-[var(--zinc-600)] hover:border-[var(--zinc-400)]"
              }
            `}
          >

            {/* IMAGE */}
            {bg.type === "image" ? (
              <img
                src={bg.src}
                alt={bg.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-canvas" />
            )}

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-black/20" />

          </button>
        );
      })}

    </div>
  </div>
</div>

{/* ================= CONTACT / SUPPORT ================= */}
<div className="pt-6 border-t border-zinc-800/60 flex items-center justify-between">

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
  <span className="text-[10px] font-black uppercase text-white">
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
  <span className="text-[10px] font-black uppercase text-white">
    {t("footer.donate")}
  </span>
</a>

</div>

  </div>
);
}