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

import SidebarLogo from "@/components/sidebar/SidebarLogo";
import BuyOnline from "@/components/sidebar/BuyOnline";
import { mmToIn, formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";
import PedalSpecs from "@/components/sidebar/PedalSpecs";
import BoardSpecs from "@/components/sidebar/BoardSpecs";
import SearchPedals from "@/components/sidebar/SearchPedals";
import SearchBoards from "@/components/sidebar/SearchBoards";
import CustomBuilder from "@/components/sidebar/CustomBuilder";


type AnyRow = Record<string, any>;

type Props = {
  // Data
  pedalsLibrary: AnyRow[];
  boardsLibrary: AnyRow[];
  lastSelectedPedal: AnyRow | null;
  lastSelectedBoard: AnyRow | null;

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
  hideLogo = false,
  lastSelectedPedal,
  lastSelectedBoard,
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
  const USA_COUNTRIES = ["US"];

  const EUROPE_COUNTRIES = [
    "FR","DE","NL","ES","IT","PT","BE","AT","DK","SE","NO","FI","PL","CZ","SK",
    "HU","RO","BG","HR","SI","EE","LV","LT","LU","IE","GR"
  ];

  const isUSA = USA_COUNTRIES.includes(country.toUpperCase());
  const isEurope = EUROPE_COUNTRIES.includes(country.toUpperCase());

React.useEffect(() => {
  let cancelled = false;

  const loadCountry = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");

      if (!res.ok) throw new Error("ipapi failed");

      const data = await res.json();

      if (!cancelled && data?.country) {
        setCountry(data.country);
      }
    } catch (err) {
      console.warn("Geo lookup failed, fallback to DE");
      if (!cancelled) setCountry("DE");
    }
  };

  loadCountry();

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
      setContactOpen(false);
    }, 2000);

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

const hasPedalCommercialLinks = Boolean(
  selectedPedal?.sweetwater ||
  selectedPedal?.woodbrass ||
  selectedPedal?.thomann
);

const hasBoardCommercialLinks = Boolean(
  selectedBoardDetails?.sweetwater ||
  selectedBoardDetails?.woodbrass ||
  selectedBoardDetails?.thomann
);

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
  bg-zinc-900
  px-6 py-4 flex flex-col gap-4 lg:gap-6
  overflow-y-auto no-scrollbar touch-pan-y
  h-full
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
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none"
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
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none resize-none"
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
          disabled={contactLoading || contactSuccess}
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
          className={`w-full mt-2 text-[10px] font-black uppercase py-2 rounded-lg transition-all duration-300 ${
          contactSuccess
            ? "bg-emerald-500 text-white animate-in zoom-in duration-300"
            : contactLoading
            ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 !text-white"
        }`}
        >
          {contactSuccess
            ? `✓ ${t("contact.sent")}`
            : contactLoading
            ? t("contact.sending")
            : t("contact.send")}
        </button>
</>
</div>

) : selectedPedal ? (

<PedalSpecs
  selectedPedal={selectedPedal}
  units={units}
  language={language}
  t={t}
  isCustomPedal={isCustomPedal}
  isUSA={isUSA}
  isEurope={isEurope}
  buildThomannUrl={buildThomannUrl}
/>


) : selectedBoardDetails ? (

<BoardSpecs
  selectedBoardDetails={selectedBoardDetails}
  units={units}
  language={language}
  t={t}
  isCustomBoard={isCustomBoard}
  buildThomannUrl={buildThomannUrl}
  getStoresForCountry={getStoresForCountry}
  hasBoardCommercialLinks={hasBoardCommercialLinks}
/>

) : (

  // LIBRARY (default view)
  <div className="px-1">

<SearchPedals
  pedalsLibrary={pedalsLibrary}
  pedalSearch={pedalSearch}
  setPedalSearch={setPedalSearch}
  showPedalResults={showPedalResults}
  setShowPedalResults={setShowPedalResults}
  setShowBoardResults={setShowBoardResults}
  addPedal={addPedal}
  pedalInputRef={pedalInputRef}
  t={t}
  groupItems={groupItems}
/>

<button
  onClick={() => {
    if (!lastSelectedPedal) return;
    addPedal(lastSelectedPedal);
  }}
  className="
    w-full mt-2
    text-[10px] font-black uppercase
    py-2 rounded-md
    bg-blue-500 !text-white
    hover:bg-blue-600 hover:brightness-110
    active:scale-[0.98]
    transition-all duration-150
    cursor-pointer
  "
>
  {t("sidebar.addPedal")}
</button>

<SearchBoards
  boardsLibrary={boardsLibrary}
  boardSearch={boardSearch}
  setBoardSearch={setBoardSearch}
  showBoardResults={showBoardResults}
  setShowBoardResults={setShowBoardResults}
  setShowPedalResults={setShowPedalResults}
  selectBoard={selectBoard}
  boardInputRef={boardInputRef}
  t={t}
  groupItems={groupItems}
/>

<button
  onClick={() => {
    if (!lastSelectedBoard) return;
    selectBoard(lastSelectedBoard);
  }}
  className="
    w-full mt-2
    text-[10px] font-black uppercase
    py-2 rounded-md
    bg-blue-500 !text-white
    hover:bg-blue-600 hover:brightness-110
    active:scale-[0.98]
    transition-all duration-150
    cursor-pointer
  "
>
  {t("sidebar.addBoard")}
</button>


<CustomBuilder
  customType={customType}
  setCustomType={setCustomType}
  customName={customName}
  setCustomName={setCustomName}
  customColor={customColor}
  setCustomColor={setCustomColor}
  customWidth={customWidth}
  setCustomWidth={setCustomWidth}
  customDepth={customDepth}
  setCustomDepth={setCustomDepth}
  addCustomItem={addCustomItem}
  isPedalValid={isPedalValid}
  isBoardValid={isBoardValid}
  minValue={minValue}
  maxValue={maxValue}
  displayMin={displayMin}
  displayMax={displayMax}
  units={units}
  unitLabel={unitLabel}
  withUnit={withUnit}
  t={t}
/>



        </div>
      )}
             {/* PUSH TO BOTTOM (desktop only) */}
<div className="mt-auto" />

{/* ================= MOBILE FOOTER ================= */}
{!selectedPedal && !selectedBoardDetails && !contactOpen && (
<div className="lg:hidden mt-6 px-6">
  <div className="sidebar-footer flex items-center justify-between ...">

    {/* FEEDBACK */}
    <button
  onClick={() => {
    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);

    setShowPedalResults(false);
    setShowBoardResults(false);

    setContactOpen(true);
  }}
  className="flex items-center gap-2 group"
  >
      <span className="text-[12px]">✉️</span>
      <span className="text-[10px] font-black uppercase text-white transition-colors duration-200">
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
      <span className="text-[12px]">❤️</span>
      <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors duration-200">
        {t("footer.donate")}
      </span>
    </a>

  </div>
</div>
)}

{/* ================= DESKTOP FOOTER ================= */}
<div className="hidden lg:flex mt-4 px-1 items-center justify-between">
  
{/* FEEDBACK */}
<button
  onClick={() => {
    setSelectedInstanceId(null);
    setSelectedBoardInstanceId(null);

    setShowPedalResults(false);
    setShowBoardResults(false);

    setContactOpen(true);
  }}
  className="flex items-center gap-2 group"
>
  <span className="text-[12px]">✉️</span>
  <span className="text-[10px] font-black uppercase text-white transition-all duration-200 group-hover:text-white group-hover:-translate-y-[1px] group-hover:scale-[1.03]">
    {t("footer.feedback")}
  </span>
</button>

{/* DONATE */}
<a
  href="https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-2 group cursor-pointer"
>
  <span className="text-[12px]">❤️</span>
  <span className="text-[10px] font-black uppercase text-white transition-all duration-200 group-hover:text-white group-hover:-translate-y-[1px] group-hover:scale-[1.03]">
    {t("footer.donate")}
  </span>
</a>

</div>

        </div>
  </>
);
}

