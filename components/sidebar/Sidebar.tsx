"use client";
import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronDown, ExternalLink, Mail, Plus, RotateCw, ShoppingCart, Trash2, } from "lucide-react";
import type { BoardItem } from "@/types/project";
import type { Language } from "@/utils/i18n";
import { mmToIn, formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";
import SpecsPedal from "@/components/sidebar/SpecsPedals";
import SpecsBoards from "@/components/sidebar/SpecsBoards";
import SpecsPower from "@/components/sidebar/SpecsPower";
import GearCatalog from "@/components/sidebar/GearCatalog";
import SearchAllGear from "@/components/sidebar/SearchAllGear";
import type { GearCategory, GearKind } from "@/utils/gearCatalog";
import CustomPanel from "@/components/sidebar/CustomPanel";
import type { CatalogStatus } from "@/hooks/useLibrary";
type AnyRow = Record<string, any>;
type Props = {
  // Data
  pedalsLibrary: AnyRow[];
  boardsLibrary: AnyRow[];
  powerLibrary: AnyRow[];
  boardsStatus: CatalogStatus;
  powerStatus: CatalogStatus;
  newPedals: AnyRow[];
  newBoards: AnyRow[];
  newPower: AnyRow[];
  newGearLoading: boolean;
  newPedalsLoading: boolean;
  libraryLoading?: boolean;
  libraryError?: string | null;
  lastSelectedPedal: AnyRow | null;
  lastSelectedBoard: AnyRow | null;
  lastSelectedPower: AnyRow | null;
  setLastSelectedPower: (p: AnyRow) => void;
  setLastSelectedPedal: (p: AnyRow) => void;
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
  replacement?: { pedal: BoardItem; onChoose: (pedal: AnyRow) => void; onClose: () => void };
  selectBoard: (b: AnyRow) => void;
  selectSuggestedBoard?: (b: AnyRow, allowRearrangement?: boolean, powerUnderBoard?: boolean) => boolean;
  finderPedals?: AnyRow[];
  existingBoards?: AnyRow[];
  addCustomItem: (item: AnyRow) => void;
  rotatePedal: (id: number) => void;
  movePedalFront: (id: number) => void;
  movePedalBack: (id: number) => void;
  deletePedal: (id: number) => void;
  rotateBoard: (id: number) => void;
  deleteBoard: (id: number) => void;
  moveBoardFront: (id: number) => void;
  moveBoardBack: (id: number) => void;
  // Settings
  canvasBg: string;
  setCanvasBg: (v: string) => void;
  language: Language;
  setLanguage: (v: Language) => void;
  units: "metric" | "imperial";
  setUnits: (v: "metric" | "imperial") => void;
  // NEW
  isMobile?: boolean;
  hideLogo?: boolean;
  onReturnToCanvas?: () => void;
};
export default function Sidebar({ pedalsLibrary, boardsLibrary, newPedals, newBoards, newPower, newGearLoading, newPedalsLoading, libraryLoading = false, libraryError = null, powerLibrary, boardsStatus, powerStatus, showPedalResults, setShowPedalResults, showBoardResults, setShowBoardResults, pedalSearch, setPedalSearch, boardSearch, setBoardSearch, selectedPedal, selectedBoardDetails, selectedInstanceId, selectedBoardInstanceId, setSelectedInstanceId, setSelectedBoardInstanceId, customName, setCustomName, customWidth, setCustomWidth, customDepth, setCustomDepth, customColor, setCustomColor, customType, setCustomType, addPedal, replacement, selectBoard, selectSuggestedBoard, finderPedals = [], existingBoards = [], addCustomItem, rotatePedal, deletePedal, rotateBoard, movePedalFront, movePedalBack, deleteBoard, moveBoardFront, moveBoardBack, canvasBg, setCanvasBg, language, setLanguage, units, setUnits, makeOpen, setMakeOpen, contactOpen, setContactOpen, onReturnToCanvas, isMobile = false, lastSelectedPedal, lastSelectedBoard, setLastSelectedPedal, lastSelectedPower, setLastSelectedPower, }: Props) {
  const t = React.useMemo(() => getTranslator(language), [language]);
  const [gearView, setGearView] = React.useState<{ query: string; category: GearCategory } | null>(null);
  // Older saved projects may not contain the profile column. Recover it from
  // the current catalogue without replacing the board instance or its geometry.
  const powerFinderBoards = React.useMemo(() => existingBoards.map(board => {
    const matches = boardsLibrary.filter(candidate => board.id != null && String(candidate.id) === String(board.id) &&
      String(candidate.brand ?? "").trim().toLowerCase() === String(board.brand ?? "").trim().toLowerCase() &&
      String(candidate.name ?? "").trim().toLowerCase() === String(board.name ?? "").trim().toLowerCase());
    const canonical = matches.length === 1 ? matches[0] : undefined;
    const profile = canonical?.profile ?? board.profile;
    return { ...board, profile };
  }), [existingBoards, boardsLibrary]);
  const LANGUAGE_LABELS: Record<Language, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    it: "Italiano",
    pt: "Português",
    zh: "中文",
  };
  const minMm = customType === "pedal" ? 30 : 100;
  const maxMm = customType === "pedal" ? 300 : 1000;
  // Convert for display (rounded to 1 decimal in inches)
  const displayMin = units === "metric"
    ? minMm
    : Math.round(mmToIn(minMm) * 10) / 10;
  const displayMax = units === "metric"
    ? maxMm
    : Math.round(mmToIn(maxMm) * 10) / 10;
  const minValue = units === "metric" ? minMm : mmToIn(minMm);
  const maxValue = units === "metric" ? maxMm : mmToIn(maxMm);
  // Convert UI values to mm for validation
  const widthMm = units === "metric"
    ? Number(customWidth)
    : Number(customWidth) * 25.4;
  const depthMm = units === "metric"
    ? Number(customDepth)
    : Number(customDepth) * 25.4;
  const isPedalValid = widthMm >= 30 &&
    widthMm <= 300 &&
    depthMm >= 30 &&
    depthMm <= 300;
  const isBoardValid = widthMm >= 100 &&
    widthMm <= 1000 &&
    depthMm >= 100 &&
    depthMm <= 1000;
  const unitLabel = units === "metric" ? "mm" : "in";
  const withUnit = (label: string) => `${label} (${unitLabel})`;
  const isImportedPedal = selectedPedal?.slug === "custom-upload";
  const isCustomPedal = selectedPedal?.brand === "Custom" &&
    !isImportedPedal;
  const isCustomBoard = selectedBoardDetails?.brand === "Custom";
  const [country] = React.useState<string>(() => {
    if (typeof window === "undefined")
      return "FR";
    return (window as any).__MYB_COUNTRY__ || "FR";
  });
  const USA_COUNTRIES = ["US"];
  const EUROPE_COUNTRIES = [
    "FR", "DE", "NL", "ES", "IT", "PT", "BE", "AT", "DK", "SE", "NO", "FI", "PL", "CZ", "SK",
    "HU", "RO", "BG", "HR", "SI", "EE", "LV", "LT", "LU", "IE", "GR"
  ];
  const isUSA = USA_COUNTRIES.includes(country.toUpperCase());
  const isEurope = EUROPE_COUNTRIES.includes(country.toUpperCase());
  const [bgOpen, setBgOpen] = React.useState(false);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = React.useState(false);
  const langRef = React.useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
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
    if (c === "NL")
      return ["thomann_nl"];
    if (c === "DE")
      return ["thomann_de"];
    if (c === "ES")
      return ["thomann_es"];
    if (c === "IT")
      return ["thomann_it"];
    if (c === "PT")
      return ["thomann_pt"];
    return ["thomann_de"];
  };
  const isDiscontinued = (selectedPedal?.status || "")
    .toLowerCase()
    .includes("discontinued");
  const hasPedalCommercialLinks = Boolean(selectedPedal?.sweetwater ||
    selectedPedal?.woodbrass ||
    selectedPedal?.thomann);
  const hasBoardCommercialLinks = Boolean(selectedBoardDetails?.sweetwater ||
    selectedBoardDetails?.woodbrass ||
    selectedBoardDetails?.thomann);
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
  const addPower = (p: any) => {
    const currentLastPedal = lastSelectedPedal; // On sauvegarde la pédale actuelle
    const powerItem = { ...p, type: "power" };
    setLastSelectedPower(powerItem);
    addPedal(powerItem);
    // On restaure immédiatement la pédale pour que le bouton bleu Pedal ne change pas
    if (currentLastPedal) {
      setTimeout(() => setLastSelectedPedal(currentLastPedal), 0);
    }
  };
  const addGear = (kind: GearKind, item: AnyRow) => {
    if (kind === "boards") selectBoard(item);
    else if (kind === "power") addPower(item);
    else {
      setLastSelectedPedal(item);
      addPedal(item);
    }
  };
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
      if (!acc[key])
        acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };
  return (<div className={`
  relative z-40 w-full lg:w-76 shrink-0 min-h-0
  bg-zinc-900
  px-6 pt-3 pb-6 flex flex-col gap-4
  overflow-hidden touch-pan-y
  h-full
`} style={{ WebkitOverflowScrolling: "touch", boxSizing: "border-box" }} onClick={(e) => {
      e.stopPropagation();
      setShowPedalResults(false);
      setShowBoardResults(false);
    }}>
    {contactOpen ? (<div className="flex flex-col gap-6 px-1">
      {/* CONTACT TITLE */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mt-4">
        <Mail size={18} strokeWidth={2} className="shrink-0" />
        {t("contact.title")}
      </div>
      <>
        {/* EMAIL */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider font-bold">
            {t("contact.email")}
          </label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none" placeholder={t("contact.placeholderEmail")} />
        </div>
        {/* TYPE */}
        <div className="flex flex-col gap-1 relative" ref={contactTypeRef}>
          <label className="text-[10px] uppercase tracking-wider font-bold">
            {t("contact.type")}
          </label>
          <button type="button" onClick={() => setContactTypeOpen((v) => !v)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2
               text-[11px] text-left text-zinc-400
               flex items-center justify-between
               hover:border-zinc-600 transition-colors">
            <span>
              {CONTACT_TYPES.find(t => t.value === contactType)?.label}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${contactTypeOpen ? "rotate-180" : ""}`} />
          </button>
          {contactTypeOpen && (<div className="absolute top-full mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden z-50">
            {CONTACT_TYPES.map((type) => (<button key={type.value} onClick={() => {
              setContactType(type.value);
              setContactTypeOpen(false);
            }} className="w-full px-3 py-2 text-left text-[11px] hover:bg-canvas">
              {type.label}
            </button>))}
          </div>)}
        </div>
        {/* MESSAGE */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider font-bold">
            {t("contact.message")}
          </label>
          <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={5} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] focus:border-blue-500 outline-none resize-none" placeholder={t("contact.placeholderMessage")} />
        </div>
        {/* HONEYPOT (anti-spam) */}
        <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
        {contactError && (<div className="text-red-500 text-[11px] font-bold">
          {contactError}
        </div>)}
        {/* SEND BUTTON */}
        <button disabled={contactLoading || contactSuccess} onClick={async () => {
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
          }
          catch (err) {
            setContactError(t("contact.errorGeneric"));
          }
          finally {
            setContactLoading(false);
          }
        }} className={`w-full mt-2 text-[10px] font-black uppercase py-2 rounded-lg transition-all duration-300 ${contactSuccess
          ? "bg-emerald-500 text-white animate-in zoom-in duration-300"
          : contactLoading
            ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500 !text-white"}`}>
          {contactSuccess
            ? `✓ ${t("contact.sent")}`
            : contactLoading
              ? t("contact.sending")
              : t("contact.send")}
        </button>
      </>
    </div>) : selectedPedal && (selectedPedal.type === "power" || selectedPedal.capacity) ? (<SpecsPower selectedPower={selectedPedal} units={units} language={language} t={t} isUSA={isUSA} isEurope={isEurope} buildThomannUrl={buildThomannUrl} selectedInstanceId={selectedInstanceId} rotatePedal={rotatePedal} movePedalFront={movePedalFront} movePedalBack={movePedalBack} deletePedal={deletePedal} />) : selectedPedal ? (<SpecsPedal selectedPedal={selectedPedal} selectedInstanceId={selectedInstanceId} units={units} language={language} t={t} isCustomPedal={isCustomPedal} isImportedPedal={isImportedPedal} isUSA={isUSA} isEurope={isEurope} buildThomannUrl={buildThomannUrl} />) : selectedBoardDetails ? (<SpecsBoards selectedBoardDetails={selectedBoardDetails} units={units} language={language} t={t} isCustomBoard={isCustomBoard} buildThomannUrl={buildThomannUrl} getStoresForCountry={getStoresForCountry} hasBoardCommercialLinks={hasBoardCommercialLinks} selectedBoardInstanceId={selectedBoardInstanceId} rotateBoard={rotateBoard} moveBoardFront={moveBoardFront} moveBoardBack={moveBoardBack} deleteBoard={deleteBoard} isUSA={isUSA} isEurope={isEurope} />) : (
      <SearchAllGear
        pedalsLibrary={pedalsLibrary} boardsLibrary={boardsLibrary} powerLibrary={powerLibrary}
        newPedals={newPedals} newBoards={newBoards} newPower={newPower} newGearLoading={newGearLoading}
        libraryLoading={libraryLoading} libraryError={libraryError} boardsStatus={boardsStatus} powerStatus={powerStatus}
        finderPedals={finderPedals} existingBoards={existingBoards} powerFinderBoards={powerFinderBoards}
        selectSuggestedBoard={selectSuggestedBoard}
        addItem={addGear}
        onOpenGear={(query, category) => setGearView({ query, category })}
        units={units} t={t} groupItems={groupItems}
        customPanel={<CustomPanel customType={customType} setCustomType={setCustomType} customName={customName} setCustomName={setCustomName} customColor={customColor} setCustomColor={setCustomColor} customWidth={customWidth} setCustomWidth={setCustomWidth} customDepth={customDepth} setCustomDepth={setCustomDepth} addCustomItem={addCustomItem} isPedalValid={isPedalValid} isBoardValid={isBoardValid} minValue={minValue} maxValue={maxValue} displayMin={displayMin} displayMax={displayMax} units={units} unitLabel={unitLabel} withUnit={withUnit} t={t} />}
      />)}
    {(gearView || replacement) && createPortal(
      <GearCatalog
        key={replacement ? "replace" : "library"}
        replacement={replacement}
        pedals={pedalsLibrary} boards={boardsLibrary} power={powerLibrary}
        newPedals={newPedals}
        newBoards={newBoards}
        newPower={newPower}
        newGearLoading={newGearLoading}
        loading={libraryLoading} error={libraryError} boardsStatus={boardsStatus} powerStatus={powerStatus}
        initialQuery={replacement ? "" : gearView?.query ?? ""} initialCategory={gearView?.category}
        language={language} units={units} t={t}
        isUSA={isUSA} isEurope={isEurope} buildThomannUrl={buildThomannUrl}
        onClose={replacement?.onClose ?? (() => {
          setGearView(null);
          onReturnToCanvas?.();
        })}
        onAdd={(kind, item) => {
          if (replacement) {
            replacement.onChoose(item);
            return;
          }
          setGearView(null);
          addGear(kind, item);
        }}
      />,
      document.body,
    )}
  </div>);
}
