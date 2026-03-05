"use client";

import React from "react";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Plus,
  RotateCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import SidebarLogo from "@/components/SidebarLogo";
import { mmToIn, formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";

const HAMMOND_RATIOS: Record<
  "1590LB" | "1590A" | "1590B" | "125B" | "1590BB" | "1590XX" | "1590DD",
  number
> = {
  "1590LB": 51 / 51,
  "1590A": 93 / 39,
  "1590B": 112 / 60,
  "125B": 121 / 66,
  "1590BB": 119 / 94,
  "1590XX": 114 / 114,
  "1590DD": 130 / 171,
};

type AnyRow = Record<string, any>;

type Props = {
  // Data
  pedalsLibrary: AnyRow[];
  boardsLibrary: AnyRow[];

  // UI state
  showPedalResults: boolean;
  setShowPedalResults: (v: boolean) => void;
  showBoardResults: boolean;
  setShowBoardResults: (v: boolean) => void;

  pedalSearch: string;
  setPedalSearch: (v: string) => void;
  boardSearch: string;
  setBoardSearch: (v: string) => void;

  // Selection
  selectedPedal: AnyRow | undefined;
  selectedBoardDetails: AnyRow | undefined;
  selectedInstanceId: number | null;
  selectedBoardInstanceId: number | null;
  setSelectedInstanceId: (v: number | null) => void;
  setSelectedBoardInstanceId: (v: number | null) => void;

  // Custom item
  customName: string;
  setCustomName: (v: string) => void;
  customWidth: string;
  setCustomWidth: (v: string) => void;
  customDepth: string;
  setCustomDepth: (v: string) => void;
  customColor: string;
  setCustomColor: (v: string) => void;
  customType: "pedal" | "board" | null;
  setCustomType: (v: "pedal" | "board" | null) => void;
  makeOpen: boolean;
  setMakeOpen: (v: boolean) => void;
  contactOpen: boolean;
  setContactOpen: (v: boolean) => void;

  // Actions
  addPedal: (p: AnyRow) => void;
  selectBoard: (b: AnyRow) => void;
  addCustomItem: (item: AnyRow) => void;
  rotatePedal: (id: number) => void;
  deletePedal: (id: number) => void;
  rotateBoard: (id: number) => void;
  deleteBoard: (id: number) => void;

  // Settings
  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: "en" | "fr" | "es" | "de" | "it" | "pt";
  setLanguage: (v: "en" | "fr" | "es" | "de" | "it" | "pt") => void;

  units: "metric" | "imperial";
  setUnits: (v: "metric" | "imperial") => void;

  // NEW
  hideLogo?: boolean;
};

export default function Sidebar({
  pedalsLibrary,
  boardsLibrary,
  showPedalResults,
  setShowPedalResults,
  showBoardResults,
  setShowBoardResults,
  pedalSearch,
  setPedalSearch,
  boardSearch,
  setBoardSearch,
  selectedPedal,
  selectedBoardDetails,
  selectedInstanceId,
  selectedBoardInstanceId,
  setSelectedInstanceId,
  setSelectedBoardInstanceId,
  customName,
  setCustomName,
  customWidth,
  setCustomWidth,
  customDepth,
  setCustomDepth,
  customColor,
  setCustomColor,
  customType,
  setCustomType,
  addPedal,
  selectBoard,
  addCustomItem,
  rotatePedal,
  deletePedal,
  rotateBoard,
  deleteBoard,
  canvasBg,
  setCanvasBg,
  language,
  setLanguage,
  units,
  setUnits,
  makeOpen,
  setMakeOpen,
  contactOpen,
  setContactOpen,
  hideLogo = false,   // 👈 important
}: Props) {

  const t = getTranslator(language);
  const LANGUAGE_LABELS: Record<string, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
  };
  const mmToIn = (mm: number) => mm / 25.4;
  const minMm = customType === "pedal" ? 30 : 100;
  const maxMm = customType === "pedal" ? 300 : 1000;

  // Convert for display (rounded to 1 decimal in inches)
  const displayMin =
    units === "metric"
      ? minMm
      : Math.round(mmToIn(minMm) * 10) / 10;

  const displayMax =
    units === "metric"
      ? maxMm
      : Math.round(mmToIn(maxMm) * 10) / 10;

  const minValue =
  units === "metric" ? minMm : mmToIn(minMm);
  const maxValue =
  units === "metric" ? maxMm : mmToIn(maxMm);

  // Convert UI values to mm for validation
  const widthMm =
    units === "metric"
      ? Number(customWidth)
      : Number(customWidth) * 25.4;

  const depthMm =
    units === "metric"
      ? Number(customDepth)
      : Number(customDepth) * 25.4;

  const isPedalValid =
    widthMm >= 30 &&
    widthMm <= 300 &&
    depthMm >= 30 &&
    depthMm <= 300;

  const isBoardValid =
    widthMm >= 100 &&
    widthMm <= 1000 &&
    depthMm >= 100 &&
    depthMm <= 1000;

  const unitLabel = units === "metric" ? "mm" : "in";
  const withUnit = (label: string) =>
    `${label} (${unitLabel})`;
  const isCustomPedal = selectedPedal?.brand === "Custom";
  const isCustomBoard = selectedBoardDetails?.brand === "Custom";
  const [country, setCountry] = React.useState<string>("FR");

React.useEffect(() => {
  let cancelled = false;

  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {
      if (!cancelled && data?.country) {
        setCountry(data.country);
      }
    })
    .catch(() => {
      setCountry("DE");
    });

  return () => {
    cancelled = true;
  };
}, []);

  
  const [bgOpen, setBgOpen] = React.useState(false);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = React.useState(false);
  const langRef = React.useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const pedalDropdownRef = React.useRef<HTMLDivElement>(null);
  const boardDropdownRef = React.useRef<HTMLDivElement>(null);
  const pedalInputRef = React.useRef<HTMLInputElement>(null);
  const boardInputRef = React.useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [formatOpen, setFormatOpen] = React.useState(false);
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactType, setContactType] = React.useState("question");
  const [contactTypeOpen, setContactTypeOpen] = React.useState(false);
  const contactTypeRef = React.useRef<HTMLDivElement>(null);
  

  const CONTACT_TYPES = [
  { value: "question", label: t("contact.types.question") },
  { value: "request", label: t("contact.types.request") },
  { value: "bug", label: t("contact.types.bug") },
  { value: "other", label: t("contact.types.other") },
];
  const [contactMessage, setContactMessage] = React.useState("");
  const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const [contactLoading, setContactLoading] = React.useState(false);
  const [contactSuccess, setContactSuccess] = React.useState(false);
  React.useEffect(() => {
  if (contactSuccess) {
    const timer = setTimeout(() => {
      setContactSuccess(false);
    }, 10000);

    return () => clearTimeout(timer);
  }
}, [contactSuccess]);
  const [contactError, setContactError] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");


  const getStoresForCountry = () => {
  const c = country.toUpperCase();

  const americas = ["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE"];
  if (americas.includes(c)) {
    return ["sweetwater"];
  }

  if (c === "FR") {
    return ["woodbrass", "thomann"];
  }

  if (c === "NL") return ["thomann_nl"];
  if (c === "DE") return ["thomann_de"];
  if (c === "ES") return ["thomann_es"];
  if (c === "IT") return ["thomann_it"];
  if (c === "PT") return ["thomann_pt"];

  return ["thomann_de"];
};

const isDiscontinued =
  (selectedPedal?.status || "")
    .toLowerCase()
    .includes("discontinued");


const buildThomannUrl = (slug: string) => {
  const map: Record<string, string> = {
    FR: "thomann.fr",
    NL: "thomann.nl",
    DE: "thomann.de",
    ES: "thomann.es",
    IT: "thomann.it",
    PT: "thomann.pt",
  };


  const domain = map[country.toUpperCase()] || "thomann.de";

  return `https://www.${domain}/${slug}`;
};

React.useEffect(() => {
  if (showPedalResults) {
    pedalInputRef.current?.focus();
  }
}, [showPedalResults]);

React.useEffect(() => {
  if (showBoardResults) {
    boardInputRef.current?.focus();
  }
}, [showBoardResults]);

  React.useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;

    if (bgRef.current && !bgRef.current.contains(target)) {
      setBgOpen(false);
    }

    if (langRef.current && !langRef.current.contains(target)) {
      setLangOpen(false);
    }


    if (contactTypeRef.current && !contactTypeRef.current.contains(target)) {
      setContactTypeOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);




  const groupItems = (items: AnyRow[], filter: string) => {
  return items.reduce((acc: Record<string, AnyRow[]>, item) => {
    if (filter) {
  const terms = filter
    .toLowerCase()
    .split(" ")
    .filter(Boolean);

  const haystack = `${item.brand ?? ""} ${item.name ?? ""} ${item.type ?? ""}`.toLowerCase();


  const matchesAll = terms.every((t) => haystack.includes(t));

  if (!matchesAll) {
    return acc;
  }
}



    const key = item.brand || "Other";

    if (!acc[key]) acc[key] = [];
    acc[key].push(item);

    return acc;
    }, {});
  };

  return (
  <>

    <div
  className="
  relative z-40 w-full lg:w-72 shrink-0
  bg-zinc-950
  px-6 py-4 flex flex-col gap-4 lg:gap-6
  overflow-y-auto no-scrollbar touch-pan-y
"
  style={{ WebkitOverflowScrolling: "touch" }}
  onClick={(e) => {
    e.stopPropagation();
    setShowPedalResults(false);
    setShowBoardResults(false);
  }}
    >

      {!hideLogo && <SidebarLogo t={t} />}


      {contactOpen ? (
  <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300 px-1">
    
    {/* TITLE → DESKTOP ONLY */}
<div className="hidden lg:block">
  <div className="space-y-1 mt-4">
    <h2 className="text-[16px] font-black leading-tight">
      {t("contact.title")}
    </h2>
  </div>
</div>

    {contactSuccess ? (
  <div className="flex items-center gap-2 text-white text-[11px] font-bold animate-in fade-in duration-300">
  <span className="text-emerald-400">✓</span>
  <span>
  {t("contact.success")}
  <br />
  {t("contact.thanks")}
</span>
</div>

) : (
      <>
        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-black tracking-widest">
            {t("contact.email")}
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none"
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
    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2
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
          className="w-full px-3 py-2 text-left text-[11px] hover:bg-zinc-800"
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
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none resize-none"
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

        {contactError && (
          <div className="text-red-500 text-[11px] font-bold">
            {contactError}
          </div>
        )}

        {/* SEND BUTTON */}
        <button
          disabled={contactLoading}
          onClick={async () => {
            setContactError("");
            // Anti-spam check
            if (honeypot) {
              return;
            }

            if (!contactEmail || !contactMessage) {
              setContactError(t("contact.errorRequired"));
              return;
            }

            if (!isValidEmail(contactEmail)) {
              setContactError(t("contact.errorInvalidEmail"));
              return;
            }

            try {
              setContactLoading(true);

              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                email: contactEmail,
                subject: "MakeYourBoard Contact",
                message: contactMessage,
                type: contactType,
                honeypot,
              }),
              });

              if (!res.ok) {
                throw new Error("Failed to send message");
              }

              setContactSuccess(true);
              setContactEmail("");
              setContactMessage("");
            } catch (err) {
              setContactError(t("contact.errorGeneric"));
            } finally {
              setContactLoading(false);
            }
          }}
          className={`w-full mt-2 text-[10px] font-black uppercase py-2 rounded-lg transition-all ${
          contactLoading
            ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
        >
          {contactLoading ? t("contact.sending") : t("contact.send")}
        </button>
      </>
    )}
  </div>

) : selectedPedal ? (

  <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300 px-1">

    {/* PEDAL INFO */}
    <div className="space-y-0.5 border-zinc-900">

      <div className="mt-4 mb-4 flex items-center gap-3">
  <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
  <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
    {t("pedal.features")}
  </span>
</div>

  {/* STATUT */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.status.label")}
      </span>
      <span
        className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
          (selectedPedal.status || "").toLowerCase().includes("active")
            ? "bg-green-500/10 text-green-500"
            : "bg-red-500/10 text-red-500"
        }`}
      >
        {selectedPedal.status
          ? t(`pedal.status.${selectedPedal.status.toLowerCase()}`)
          : "N/A"}
      </span>
    </div>
  )}

  {/* MARQUE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.brand")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.brand || "N/A"}
      </span>
    </div>
  )}

  {/* MODÈLE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.model")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.name || "N/A"}
      </span>
    </div>
  )}

    {/* MODÈLE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.year")}
      </span>
      <span className="text-[11px] font-bold text-zinc-400">
        {selectedPedal.year || "N/A"}
      </span>
    </div>
  )}


  {/* TYPE */}
  {!isCustomPedal && (
    <div className="flex justify-between items-center py-2 border-b border-zinc-900">
      <span className="text-[10px] text-white uppercase font-bold tracking-wider">
        {t("pedal.type.label")}
      </span>
      <span className="text-[11px] font-bold font-mono text-zinc-400">
        {selectedPedal.type
          ? t(`pedal.type.${selectedPedal.type}`)
          : "N/A"}
      </span>
    </div>
  )}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.circuit.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.circuit
                ? t(`pedal.circuit.${selectedPedal.circuit}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.bypass.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.bypass
                ? t(`pedal.bypass.${selectedPedal.bypass}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.power.label")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.power
                ? t(`pedal.power.${selectedPedal.power}`)
                : "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.draw")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-400">
                {selectedPedal.draw || 0} mA
              </span>
            </div>)}

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-white uppercase font-bold tracking-wider">
              {t("pedal.dimensions")}
            </span>
            <span className="text-[11px] font-bold font-mono text-zinc-400">
              {units === "metric"
                ? `${selectedPedal.width} x ${selectedPedal.depth || 0} mm`
                : `${mmToIn(selectedPedal.width).toFixed(2)} x ${mmToIn(
                    selectedPedal.depth || 0
                  ).toFixed(2)} in`}
            </span>
            </div>

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-white uppercase font-bold tracking-wider">
              {t("pedal.weight")}
            </span>
            <span className="text-[11px] font-bold font-mono text-zinc-400">
              {formatWeight(selectedPedal.weight || 0, units, language)}
            </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
               {t("pedal.origin")}
              </span>
              <span className="text-[11px] font-bold text-zinc-400">
                {selectedPedal.origin || "N/A"}
              </span>
            </div>)}

            {!isCustomPedal && (
            <div className="flex justify-between items-center py-2 border-zinc-900">
              <span className="text-[10px] text-white uppercase font-bold tracking-wider">
                {t("pedal.manual")}
              </span>
              {selectedPedal.manual ? (
                <a
                  href={selectedPedal.manual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  PDF <ExternalLink size={10} />
                </a>
              ) : (
                <span className="text-[11px] font-bold text-zinc-400">N/A</span>
              )}
            </div>)}

{/* BUY ONLINE */}
{!isCustomPedal && (
  <div className="mt-8">

    <div className="mb-4 flex items-center gap-3">
      <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
      <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
        {t("sidebar.buyOnline")}
      </span>
    </div>

    <div className="space-y-3">
      {(
        (selectedPedal.status || "").toLowerCase().includes("discontinued")
          ? ["reverb"]
          : getStoresForCountry()
      ).map((store) => {

        let url = "";

        if (store === "reverb") {
          url = `https://reverb.com/marketplace?query=${encodeURIComponent(
            selectedPedal.brand + " " + selectedPedal.name
          )}`;
        }

        if (store === "sweetwater") {
          url = selectedPedal.sweetwater;
        }

        if (store === "woodbrass") {
          url = selectedPedal.woodbrass;
        }

        if (store.includes("thomann")) {
          url = buildThomannUrl(selectedPedal.thomann);
        }

        if (!url) return null;

        const storeData = {
          sweetwater: { label: "Sweetwater", logo: "/logos/sweetwater.png" },
          woodbrass: { label: "Woodbrass", logo: "/logos/woodbrass.png" },
          reverb: { label: "Reverb", logo: "/logos/reverb.png" },
          thomann: { label: "Thomann", logo: "/logos/thomann.png" },
        };

        const key =
          store.includes("thomann") ? "thomann" : store;

        const data = storeData[key as keyof typeof storeData];

        return (
          <a
  key={store}
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  className="
    flex items-center gap-3
    px-3 py-3
    rounded-lg
    transition-all duration-200 ease-out
    hover:bg-zinc-900
    hover:scale-[1.02]
    active:scale-[0.98]
    group
  "
>
  <img
    src={data.logo}
    alt={data.label}
    className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
  />
  <span className="
    text-[12px] font-semibold text-zinc-300
    transition-all duration-200
    group-hover:text-white
    group-hover:translate-x-1
  ">
    {data.label}
  </span>
</a>
        );
      })}
    </div>

  </div>
)}

          </div>
        </div>
) : selectedBoardDetails ? (
  // BOARD DETAILS
  <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300 px-1">

    <div className="space-y-0.5 border-zinc-900">

      {/* HEADER (identique aux pédales) */}
      <div className="mt-4 mb-4 flex items-center gap-3">
        <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
        <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
          {t("pedal.features")}
        </span>
      </div>

      {/* STATUT */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.status.label")}
          </span>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
              (selectedBoardDetails.status || "").toLowerCase().includes("active")
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            }`}
          >
            {selectedBoardDetails.status
              ? t(`board.status.${selectedBoardDetails.status.toLowerCase()}`)
              : "N/A"}
          </span>
        </div>
      )}

      {/* MARQUE */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.brand")}
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {selectedBoardDetails.brand || "N/A"}
          </span>
        </div>
      )}

      {/* MODÈLE */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.model")}
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {selectedBoardDetails.name || "N/A"}
          </span>
        </div>
      )}

      {/* YEAR */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.year")}
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {selectedBoardDetails.year || "N/A"}
          </span>
        </div>
      )}

      {/* MATÉRIAU */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.material.label")}
          </span>
          <span className="text-[11px] font-bold font-mono text-zinc-400">
            {selectedBoardDetails.material
              ? t(`board.material.${selectedBoardDetails.material}`)
              : "N/A"}
          </span>
        </div>
      )}

      {/* PROFIL */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.profile.label")}
          </span>
          <span className="text-[11px] font-bold font-mono text-zinc-400">
            {selectedBoardDetails.profile
              ? t(`board.profile.${selectedBoardDetails.profile}`)
              : "N/A"}
          </span>
        </div>
      )}

      {/* DIMENSIONS */}
      <div className="flex justify-between items-center py-2 border-b border-zinc-900">
        <span className="text-[10px] text-white uppercase font-bold tracking-wider">
          {t("board.dimensions")}
        </span>
        <span className="text-[11px] font-bold font-mono text-zinc-400">
          {units === "metric"
            ? `${selectedBoardDetails.width} x ${selectedBoardDetails.depth || 0} mm`
            : `${mmToIn(selectedBoardDetails.width).toFixed(2)} x ${mmToIn(
                selectedBoardDetails.depth || 0
              ).toFixed(2)} in`}
        </span>
      </div>

      {/* POIDS */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-b border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.weight")}
          </span>
          <span className="text-[11px] font-bold font-mono text-zinc-400">
            {formatWeight(selectedBoardDetails.weight || 0, units, language)}
          </span>
        </div>
      )}

      {/* ORIGINE */}
      {!isCustomBoard && (
        <div className="flex justify-between items-center py-2 border-zinc-900">
          <span className="text-[10px] text-white uppercase font-bold tracking-wider">
            {t("board.origin")}
          </span>
          <span className="text-[11px] font-bold text-zinc-400">
            {selectedBoardDetails.origin || "N/A"}
          </span>
        </div>
      )}
    </div>

    {/* BUY ONLINE */}
    {!isCustomBoard && (
      <div className="mt-8">

        <div className="mb-4 flex items-center gap-3">
          <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
          <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
            {t("sidebar.buyOnline")}
          </span>
        </div>

        <div className="space-y-3">
          {(
            (selectedBoardDetails.status || "")
              .toLowerCase()
              .includes("discontinued")
              ? ["reverb"]
              : getStoresForCountry()
          ).map((store) => {

            let url = "";

            if (store === "reverb") {
              url = `https://reverb.com/marketplace?query=${encodeURIComponent(
                selectedBoardDetails.brand + " " + selectedBoardDetails.name
              )}`;
            }

            if (store === "sweetwater") {
              url = selectedBoardDetails.sweetwater;
            }

            if (store === "woodbrass") {
              url = selectedBoardDetails.woodbrass;
            }

            if (store.includes("thomann")) {
              url = buildThomannUrl(selectedBoardDetails.thomann);
            }

            if (!url) return null;

            const storeData = {
              sweetwater: { label: "Sweetwater", logo: "/logos/sweetwater.png" },
              woodbrass: { label: "Woodbrass", logo: "/logos/woodbrass.png" },
              reverb: { label: "Reverb", logo: "/logos/reverb.png" },
              thomann: { label: "Thomann", logo: "/logos/thomann.png" },
            };

            const key = store.includes("thomann") ? "thomann" : store;
            const data = storeData[key as keyof typeof storeData];

            return (
              <a
                key={store}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center gap-3
                  px-3 py-3
                  rounded-lg
                  transition-all duration-200 ease-out
                  hover:bg-zinc-900
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  group
                "
              >
                <img
                  src={data.logo}
                  alt={data.label}
                  className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
                />
                <span className="
                  text-[12px] font-semibold text-zinc-300
                  transition-all duration-200
                  group-hover:text-white
                  group-hover:translate-x-1
                ">
                  {data.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    )}

  </div>

      ) : (

  // LIBRARY (default view)
  <div className="px-1">

{/* ADD A PEDAL */}
<div className="flex flex-col gap-2">

  <div className="mt-3 mb-1 flex items-center gap-3">
    <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
    <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
      {t("sidebar.addPedal")}
    </span>
  </div>

  <div className="relative" style={{ zIndex: showPedalResults ? 60 : 10 }}>
    <div className="relative flex items-center">
      <input
  ref={pedalInputRef}
  type="text"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  placeholder={`${t("sidebar.searchPedal")}...`}
        className={`w-full bg-zinc-900 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-zinc-200 placeholder:text-zinc-500 outline-none transition-all ${
          showPedalResults
            ? "border-zinc-500"
            : "border-zinc-700"
        }`}
        value={pedalSearch}
        onClick={(e) => {
          e.stopPropagation();
          setShowBoardResults(false);
          setShowPedalResults(true);
        }}
        onChange={(e) => {
          setPedalSearch(e.target.value);
          setShowPedalResults(true);
        }}
      />
      <ChevronDown
  onClick={(e) => {
    e.stopPropagation();
    setShowPedalResults(!showPedalResults);
    setShowBoardResults(false);
  }}
  className={`absolute right-3 size-4 cursor-pointer transition-transform ${
    showPedalResults
      ? "rotate-180 text-zinc-400"
      : "text-zinc-500"
  }`}
/>
    </div>

    {showPedalResults && (
      <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
        {Object.keys(groupItems(pedalsLibrary, pedalSearch)).length > 0 ? (
          Object.keys(groupItems(pedalsLibrary, pedalSearch)).map((brand) => (
            <div key={brand} className="flex flex-col">
  <div className="px-4 h-10 flex items-center bg-zinc-950">
  <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
    {brand}
  </span>
</div>
              {groupItems(pedalsLibrary, pedalSearch)[brand].map((p) => (
                <button
                  key={p.id}
                  onClick={() => addPedal(p)}
                  className="w-full px-5 py-2 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                >
                  <span className="font-semibold opacity-50 mr-2">{brand}</span>
                  {p.name}
                </button>
              ))}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">
            No pedals found
          </div>
        )}
      </div>
    )}
  </div>
</div>


{/* ADD A BOARD */}
<div className="flex flex-col gap-2 mt-8">

  <div className="mb-1 flex items-center gap-3">
    <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
    <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
      {t("sidebar.addBoard")}
    </span>
  </div>

  <div className="relative" style={{ zIndex: showBoardResults ? 60 : 5 }}>
    <div className="relative flex items-center">
      <input
  ref={boardInputRef}
  type="text"
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  placeholder={`${t("sidebar.searchBoard")}...`}
        className={`w-full bg-zinc-900 border rounded-lg py-2 pl-4 pr-10 text-[11px] text-zinc-200 placeholder:text-zinc-500 outline-none transition-all ${
          showBoardResults
            ? "border-zinc-500"
            : "border-zinc-700"
        }`}
        value={boardSearch}
        onClick={(e) => {
          e.stopPropagation();
          setShowPedalResults(false);
          setShowBoardResults(true);
        }}
        onChange={(e) => {
          setBoardSearch(e.target.value);
          setShowBoardResults(true);
        }}
      />
      <ChevronDown
  onClick={(e) => {
    e.stopPropagation();
    setShowBoardResults(!showBoardResults);
    setShowPedalResults(false);
  }}
  className={`absolute right-3 size-4 cursor-pointer transition-transform ${
    showBoardResults
      ? "rotate-180 text-zinc-400"
      : "text-zinc-500"
  }`}
/>
    </div>

    {showBoardResults && (
      <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
        {Object.keys(groupItems(boardsLibrary, boardSearch)).length > 0 ? (
          Object.keys(groupItems(boardsLibrary, boardSearch)).map((brand) => (
            <div key={brand} className="flex flex-col">
  <div className="px-4 h-10 flex items-center bg-zinc-950">
  <span className="text-[11px] font-bold text-zinc-100 uppercase tracking-widest">
    {brand}
  </span>
</div>
              {groupItems(boardsLibrary, boardSearch)[brand].map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBoard(b)}
                  className="w-full px-5 py-2 text-left hover:bg-zinc-700 text-zinc-300 text-[12px] transition-colors"
                >
                  <span className="font-semibold opacity-50 mr-2">{brand}</span>
                  {b.name}
                </button>
              ))}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">
            No boards found
          </div>
        )}
      </div>
    )}
  </div>
</div>


{/* MAKE YOUR OWN */}
<div className="flex flex-col gap-2 mt-8">

  <div className="mb-2 flex items-center gap-3">
    <div className="w-[3px] h-5 bg-blue-500 rounded-full" />
    <span className="text-[12px] uppercase font-bold tracking-[0.18em] text-white">
      {t("custom.title")}
    </span>
  </div>

  {/* GREY CONTAINER */}
  <div className="flex flex-col gap-6">

    {/* SELECT TYPE */}
    <div className="flex flex-col gap-2">
      <span className="text-[9px] text-white uppercase font-black tracking-widest">
        {t("custom.selectType")}
      </span>

      <div className="flex w-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">

  {/* PEDAL */}
  <button
  onClick={() => {
    setCustomType("pedal");
    setCustomWidth("");
    setCustomDepth("");
  }}
  className={`
    flex-1 py-2 text-[10px] font-black uppercase tracking-widest
    transition-all duration-200
    ${
      customType === "pedal"
        ? "bg-blue-500 text-white"
        : "bg-zinc-900 text-zinc-500 hover:text-white"
    }
  `}
>
  {t("custom.pedal")}
</button>

<button
  onClick={() => {
    setCustomType("board");
    setCustomWidth("");
    setCustomDepth("");
  }}
  className={`
    flex-1 py-2 text-[10px] font-black uppercase tracking-widest
    transition-all duration-200
    border-l border-zinc-800
    ${
      customType === "board"
        ? "bg-blue-500 text-white"
        : "bg-zinc-900 text-zinc-500 hover:text-white"
    }
  `}
>
  {t("custom.board")}
</button>

</div>
    </div>

    {/* PEDAL FLOW */}
    {customType === "pedal" && (
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-0.5">
  <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
    {t("custom.enterDimensions")}
  </span>

  <span className="text-[9px] text-zinc-500 font-mono leading-tight">
    min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
  </span>
</div>

        <div className="grid grid-cols-2 gap-2 mt-2">

          <input
            type="number"
            min={minValue}
            max={maxValue}
            step={units === "metric" ? 1 : 0.1}
            placeholder={withUnit(t("custom.width"))}
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:outline-none focus:ring-0 focus:border-zinc-600 transition-colors"
          />

          <input
            type="number"
            min={minValue}
            max={maxValue}
            step={units === "metric" ? 1 : 0.1}
            placeholder={withUnit(t("custom.depth"))}
            value={customDepth}
            onChange={(e) => setCustomDepth(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:outline-none focus:ring-0 focus:border-zinc-600 transition-colors"
          />

        </div>

        <button
  onClick={addCustomItem}
  disabled={!isPedalValid}
  className="w-full text-[10px] mt-2 font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white transition-all disabled:cursor-not-allowed"
>
  {t("custom.addPedal")}
</button>

      </div>
    )}

    {/* BOARD FLOW */}
{customType === "board" && (
  <div className="flex flex-col gap-1">

    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-white uppercase font-black tracking-widest leading-tight">
        {t("custom.enterDimensions")}
      </span>

      <span className="text-[9px] text-zinc-500 font-mono leading-tight">
        min: {displayMin} {unitLabel} / max: {displayMax} {unitLabel}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2 mt-2">

      <input
        type="number"
        min={minValue}
        max={maxValue}
        step={units === "metric" ? 1 : 0.1}
        placeholder={withUnit(t("custom.width"))}
        value={customWidth}
        onChange={(e) => setCustomWidth(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:outline-none focus:ring-0 focus:border-zinc-600 transition-colors"
      />

      <input
        type="number"
        min={minValue}
        max={maxValue}
        step={units === "metric" ? 1 : 0.1}
        placeholder={withUnit(t("custom.depth"))}
        value={customDepth}
        onChange={(e) => setCustomDepth(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-md py-2 px-3 text-[10px] outline-none focus:outline-none focus:ring-0 focus:border-zinc-600 transition-colors"
      />

    </div>

    <button
  onClick={addCustomItem}
  disabled={!isBoardValid}
  className="w-full mt-2 text-[10px] font-black uppercase py-2 rounded-md bg-blue-500 hover:bg-blue-400 text-white transition-all disabled:cursor-not-allowed"
>
  {t("custom.addBoard")}
</button>

  </div>
)}

  </div>
</div>

        </div>
      )}
             {/* PUSH TO BOTTOM (desktop only) */}
<div className="hidden lg:block mt-auto" />

{/* ================= MOBILE FOOTER ================= */}
<div className="lg:hidden mt-6 px-6">
  <div className="flex items-center justify-between">

    {/* FEEDBACK */}
    <button
      onClick={() => setContactOpen(true)}
      className="flex items-center gap-2 group"
    >
      <span className="text-[12px]">💬</span>
      <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors duration-200">
        {t("footer.feedback")}
      </span>
    </button>

    {/* DONATE */}
    <a
      href="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 group"
    >
      <span className="text-[12px]">☕️</span>
      <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors duration-200">
        {t("footer.donate")}
      </span>
    </a>

  </div>
</div>

{/* ================= DESKTOP FOOTER ================= */}
<div className="hidden lg:flex mt-4 px-1 items-center justify-between">
  
  <button
    onClick={() => setContactOpen(true)}
    className="flex items-center gap-2 group cursor-pointer"
  >
    <span className="text-[12px]">💬</span>
    <span className="text-[10px] font-black uppercase tracking-light text-zinc-500 group-hover:text-white transition-colors duration-200">
      {t("footer.feedback")}
    </span>
  </button>

  <a
    href="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 group cursor-pointer"
  >
    <span className="text-[12px]">☕️</span>
    <span className="text-[10px] font-black uppercase tracking-light text-zinc-500 group-hover:text-white transition-colors duration-200">
      {t("footer.donate")}
    </span>
  </a>

</div>

        </div>
  </>
);
}

