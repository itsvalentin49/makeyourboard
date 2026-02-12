"use client";

import React from "react";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Plus,
  RotateCw,
  ShoppingCart,
  Settings,
  Trash2,
} from "lucide-react";

import SidebarLogo from "@/components/SidebarLogo";
import { mmToIn, formatWeight } from "@/utils/units";
import { getTranslator } from "@/utils/i18n";


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

  // Actions (callbacks from page)
  addPedal: (p: AnyRow) => void;
  selectBoard: (b: AnyRow) => void;
  addCustomItem: () => void;
  rotatePedal: (id: number) => void;
  deletePedal: (id: number) => void;
  rotateBoard: (id: number) => void;
  deleteBoard: (id: number) => void;

  // Settings
  canvasBg: string;
  setCanvasBg: (v: string) => void;

  language: "en" | "fr" | "es" | "de" | "it";
  setLanguage: (v: "en" | "fr" | "es" | "de" | "it") => void;

  units: "metric" | "imperial";
  setUnits: (v: "metric" | "imperial") => void;

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
}: Props) {

  const t = getTranslator(language);
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
  const [shopOpen, setShopOpen] = React.useState(false);
  const shopRef = React.useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);


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

    if (shopRef.current && !shopRef.current.contains(target)) {
      setShopOpen(false);
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

  const haystack = `${item.brand ?? ""} ${item.name ?? ""}`.toLowerCase();

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
    {/* OVERLAY MOBILE */}
    {mobileOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-30 md:hidden"
        onClick={() => setMobileOpen(false)}
      />
    )}

    <div
      className={`
        fixed inset-y-0 left-0 z-40 w-full md:w-80 md:flex-shrink-0
        bg-zinc-950 border-r border-zinc-800
        p-4 flex flex-col gap-6
        overflow-y-auto no-scrollbar
        transform transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}
      onClick={(e) => e.stopPropagation()}
    >

      <SidebarLogo />

      <button
  onClick={() => setMobileOpen(true)}
  className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
>
  <Plus size={24} />
</button>


      {/* PEDAL DETAILS */}
      {selectedPedal ? (
        <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300">
          <button
            onClick={() => setSelectedInstanceId(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="size-4" /> {t("sidebar.back")}
          </button>

          <div className="space-y-1">
            <p className="text-blue-500 text-[12px] font-black uppercase tracking-[0.2em]">
              {selectedPedal.brand}
            </p>
            <h2 className="text-l font-black text-[16px] leading-tight">
              {selectedPedal.name}
            </h2>
            <p className="text-zinc-500 text-[10px] font-medium">
              {selectedPedal.year || "No date"}
            </p>
{/*
            <div className="py-2 border-zinc-900">
              <p className="text-[12px] text-zinc-400 font-medium">
                {selectedPedal.overview}
              </p>
            </div>
*/}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2">
            <div className="flex gap-2 pointer-events-auto w-full">
              {/* ROTATE */}
              <button onClick={() => {if (selectedInstanceId !== null) {rotatePedal(selectedInstanceId);}
}}

  className="group pointer-events-auto flex-1 flex items-center justify-center px-4 py-3 rounded-xl
  bg-zinc-600/10 border border-zinc-500/20
  hover:bg-blue-500/10 hover:border-blue-400/70
  hover:ring-2 hover:ring-blue-500/30
  hover:shadow-lg
  active:scale-[0.99]
  transition-all duration-200"
>
  <div className="flex items-center gap-3">
    <RotateCw
      size={16}
      className="text-zinc-300 group-hover:text-white
      group-active:rotate-90 transition-transform duration-200"
    />
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white">
      {t("sidebar.rotate")}
    </span>
  </div>
</button>


              {/* DELETE */}
              <button
  onClick={() => {if (selectedInstanceId !== null) {deletePedal(selectedInstanceId);}
}}

  className="group pointer-events-auto flex-1 flex items-center justify-center px-4 py-3 rounded-xl
  bg-zinc-600/10 border border-zinc-500/20
  hover:bg-red-500/10 hover:border-red-400/80
  hover:ring-2 hover:ring-red-500/30
  hover:shadow-lg
  active:scale-[0.99]
  transition-all duration-200"
>
  <div className="flex items-center gap-3">
    <Trash2 size={16} className="text-zinc-400 group-hover:text-white transition-colors" />
    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white">
      {t("sidebar.delete")}
    </span>
  </div>
</button>

            </div>
          </div>

          {/* PEDAL INFO */}
          <div className="space-y-0.2 border-zinc-900">
            <div className="flex justify-between items-center py-2 border-b border-t border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.status")}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                  (selectedPedal.status || "").toLowerCase().includes("active")
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {selectedPedal.status || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.type")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-300">
                {selectedPedal.type || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.circuit")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-300">
                {selectedPedal.circuit || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.bypass")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-300">
                {selectedPedal.bypass || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.power")}
              </span>
              <span className="text-[11px] font-bold font-mono text-zinc-300">
                {selectedPedal.power || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("pedal.draw")}
              </span>
              <span className="text-[11px] font-bold font-mono">
                {selectedPedal.draw || 0} mA
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              {t("pedal.dimensions")}
            </span>
            <span className="text-[11px] font-bold font-mono">
              {units === "metric"
                ? `${selectedPedal.width} x ${selectedPedal.depth || 0} mm`
                : `${mmToIn(selectedPedal.width).toFixed(2)} x ${mmToIn(
                    selectedPedal.depth || 0
                  ).toFixed(2)} in`}
            </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              {t("pedal.weight")}
            </span>
            <span className="text-[11px] font-bold font-mono">
              {formatWeight(selectedPedal.weight || 0, units)}
            </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
               {t("pedal.origin")}
              </span>
              <span className="text-[11px] font-bold text-zinc-300">
                {selectedPedal.origin || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
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
                <span className="text-[11px] font-bold text-zinc-600">N/A</span>
              )}
            </div>

            <div className="pt-5 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider">
                {t("sidebar.buyOnline")}
              </span>

              <div className="relative mt-3" ref={shopRef}>
  <button
    onClick={() => setShopOpen((v) => !v)}
    className="flex items-center justify-between w-full px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600 transition-all group"
  >
    <div className="flex items-center gap-3">
      <ShoppingCart size={16} className="text-blue-400 group-hover:text-white" />
      <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 group-hover:text-white">
        {t("sidebar.shop")}
      </span>
    </div>
    <ChevronDown
      size={14}
      className={`text-blue-400 transition-transform ${
        shopOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {shopOpen && (
    <div className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
      {(isDiscontinued ? ["reverb"] : getStoresForCountry()).map((store) => {
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
    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-[11px] font-bold"
  >
    <img
      src={data.logo}
      alt={data.label}
      className="w-4 h-4 object-contain"
    />
    {data.label}
  </a>
);

      })}
    </div>
  )}
</div>

            </div>
          </div>
        </div>
      ) : selectedBoardDetails ? (
        // BOARD DETAILS
        <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-300">
          <button
            onClick={() => setSelectedBoardInstanceId(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="size-4" /> {t("sidebar.back")}
          </button>

          <div className="space-y-1">
            <p className="text-blue-500 text-[12px] font-black uppercase tracking-[0.2em]">
              {selectedBoardDetails.brand}
            </p>
            <h2 className="text-l font-black leading-tight">{selectedBoardDetails.name}</h2>
            <p className="text-zinc-500 text-[10px] font-medium">
              {selectedBoardDetails.year || "No date"}
            </p>
          </div>

          {/* ACTIONS */}
<div className="flex gap-2">
  <div className="flex gap-2 pointer-events-auto w-full">
    {/* ROTATE */}
    <button
      onClick={() => {
        if (selectedBoardInstanceId !== null) {
          rotateBoard(selectedBoardInstanceId);
        }
      }}
      className="group flex-1 flex items-center justify-center px-4 py-3 rounded-xl
      bg-zinc-600/10 border border-zinc-500/20
      hover:bg-blue-500/10 hover:border-blue-400/70
      hover:ring-2 hover:ring-blue-500/30
      active:scale-[0.99]
      transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <RotateCw size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {t("sidebar.rotate")}
        </span>
      </div>
    </button>

    {/* DELETE */}
    <button
      onClick={() => {
        if (selectedBoardInstanceId !== null) {
          deleteBoard(selectedBoardInstanceId);
        }
      }}
      className="group flex-1 flex items-center justify-center px-4 py-3 rounded-xl
      bg-zinc-600/10 border border-zinc-500/20
      hover:bg-red-500/10 hover:border-red-400/80
      hover:ring-2 hover:ring-red-500/30
      active:scale-[0.99]
      transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <Trash2 size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          {t("sidebar.delete")}
        </span>
      </div>
    </button>
  </div>
</div>


          <div className="space-y-0.5 border-zinc-900 pt-4">
            <div className="flex justify-between items-center py-2 border-b border-t border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("board.status")}
              </span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                  (selectedBoardDetails.status || "").toLowerCase().includes("active")
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {selectedBoardDetails.status || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("board.material")}
              </span>
              <span className="text-[11px] font-bold font-mono">
                {selectedBoardDetails.material || 0}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("board.profile")}
              </span>
              <span className="text-[11px] font-bold font-mono">
                {selectedBoardDetails.profile || 0}
              </span>
            </div>

            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              {t("board.dimensions")}
            </span>
            <span className="text-[11px] font-bold font-mono">
              {units === "metric"
                ? `${selectedBoardDetails.width} x ${
                    selectedBoardDetails.depth || 0
                  } mm`
                : `${mmToIn(selectedBoardDetails.width).toFixed(2)} x ${mmToIn(
                    selectedBoardDetails.depth || 0
                  ).toFixed(2)} in`}
            </span>
            </div>


            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              {t("board.weight")}
            </span>
            <span className="text-[11px] font-bold font-mono">
              {formatWeight(selectedBoardDetails.weight || 0, units)}
            </span>
            </div>


            <div className="flex justify-between items-center py-2.5 border-b border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                {t("board.origin")}
              </span>
              <span className="text-[11px] font-bold font-mono">
                {selectedBoardDetails.origin || 0}
              </span>
            </div>

            <div className="pt-5 space-y-4">
              <span className="text-[10px] uppercase font-black tracking-wider">
                {t("sidebar.buyOnline")}
              </span>

              <div className="relative mt-3" ref={shopRef}>
  <button
    onClick={() => setShopOpen((v) => !v)}
    className="flex items-center justify-between w-full px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600 transition-all group"
  >
    <div className="flex items-center gap-3">
      <ShoppingCart size={16} className="text-blue-400 group-hover:text-white" />
      <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 group-hover:text-white">
        {t("sidebar.shop")}
      </span>
    </div>
    <ChevronDown
      size={14}
      className={`text-blue-400 transition-transform ${
        shopOpen ? "rotate-180" : ""
      }`}
    />
  </button>

  {shopOpen && (
    <div className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">

      {((selectedBoardDetails.status || "").toLowerCase().includes("discontinued")
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

        return (
          <a
            key={store}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-[11px] font-bold"
          >
            {store === "reverb" && (
              <img src="/logos/reverb.png" className="w-5 h-5 object-contain" />
            )}
            {store === "sweetwater" && (
              <img src="/logos/sweetwater.png" className="w-5 h-5 object-contain" />
            )}
            {store === "woodbrass" && (
              <img src="/logos/woodbrass.png" className="w-5 h-5 object-contain" />
            )}
            {store.includes("thomann") && (
              <img src="/logos/thomann.png" className="w-5 h-5 object-contain" />
            )}

            {store === "reverb" && "Reverb"}
            {store === "sweetwater" && "Sweetwater"}
            {store === "woodbrass" && "Woodbrass"}
            {store.includes("thomann") && "Thomann"}
          </a>
        );
      })}
    </div>
  )}
</div>

            </div>
          </div>
        </div>
      ) : (
        // LIBRARY (default view)
        <>
          {/* ADD A PEDAL */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 px-1">
              <div className="w-[2px] h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t("sidebar.addPedal")}
              </span>
            </div>

            <div className="relative" style={{ zIndex: showPedalResults ? 60 : 10 }}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`${t("sidebar.searchPedal")}...`}
                  className={`w-full bg-zinc-900 border rounded-lg py-2 pl-4 pr-10 text-[11px] outline-none transition-all ${
                    showPedalResults
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-zinc-800"
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
                  className={`absolute right-3 size-3 text-zinc-600 transition-transform pointer-events-none ${
                    showPedalResults ? "rotate-180 text-blue-500" : ""
                  }`}
                />
              </div>

              {showPedalResults && (
                <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {Object.keys(groupItems(pedalsLibrary, pedalSearch)).length > 0 ? (
                    Object.keys(groupItems(pedalsLibrary, pedalSearch)).map((brand) => (
                      <div key={brand} className="flex flex-col border-b border-zinc-800/50">
                        <div className="px-4 py-1 text-[10px] font-black text-blue-400 bg-zinc-950/50 uppercase tracking-widest">
                          {brand}
                        </div>
                        {groupItems(pedalsLibrary, pedalSearch)[brand].map((p) => (
                          <button
                            key={p.id}
                            onClick={() => addPedal(p)}
                            className="w-full px-5 py-2 text-left hover:bg-zinc-800 text-zinc-300 text-[12px]"
                          >
                            <span className="font-bold opacity-50 mr-2">{brand}</span>
                            {p.name}
                          </button>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                      No pedals found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ADD A BOARD */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-[2px] h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t("sidebar.addBoard")}
              </span>
            </div>

            <div className="relative" style={{ zIndex: showBoardResults ? 60 : 5 }}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`${t("sidebar.searchBoard")}...`}
                  className={`w-full bg-zinc-900 border rounded-lg py-2 pl-4 pr-10 text-[11px] outline-none transition-all ${
                    showBoardResults
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-zinc-800"
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
                  className={`absolute right-3 size-3 text-zinc-600 transition-transform pointer-events-none ${
                    showBoardResults ? "rotate-180 text-blue-500" : ""
                  }`}
                />
              </div>

              {showBoardResults && (
                <div className="absolute top-10 left-0 right-0 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {Object.keys(groupItems(boardsLibrary, boardSearch)).length > 0 ? (
                    Object.keys(groupItems(boardsLibrary, boardSearch)).map((brand) => (
                      <div key={brand} className="flex flex-col border-b border-zinc-800/50">
                        <div className="px-4 py-1 text-[10px] font-black text-blue-400 bg-zinc-950/50 uppercase tracking-widest">
                          {brand}
                        </div>
                        {groupItems(boardsLibrary, boardSearch)[brand].map((b) => (
                          <button
                            key={b.id}
                            onClick={() => selectBoard(b)}
                            className="w-full px-5 py-2 text-left hover:bg-zinc-800 text-zinc-300 text-[12px]"
                          >
                            <span className="font-bold opacity-50 mr-2">{brand}</span>
                            {b.name}
                          </button>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[10px] text-zinc-600 uppercase font-bold tracking-widest">
                      No boards found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MAKE YOUR OWN */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2 px-1">
              <div className="w-[2px] h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t("custom.title")}
              </span>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">

              <input
                type="text"
                placeholder={t("custom.name")}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[11px] outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  key={`width-${units}`}
                  type="number"
                  placeholder={`${t("custom.width")} (${units === "metric" ? "mm" : "in"})`}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[11px] outline-none"
                />
                <input
                  key={`depth-${units}`}
                  type="number"
                  placeholder={`${t("custom.depth")} (${units === "metric" ? "mm" : "in"})`}
                  value={customDepth}
                  onChange={(e) => setCustomDepth(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-[11px] outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="relative size-6 rounded-full border border-zinc-700 overflow-hidden"
                    style={{ backgroundColor: customColor }}
                  >
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {customColor}
                  </span>
                </div>

                <button
                  onClick={addCustomItem}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> {t("custom.add")}
                </button>
              </div>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="flex flex-col gap-1 mt-4">
            <button
  onClick={() => setSettingsOpen((v) => !v)}
  className="flex items-center justify-between gap-2 px-1 w-full group"
>
  <div className="flex items-center gap-2">
    <Settings className="size-3 text-zinc-400" />
    <span className="text-[10px] font-black uppercase tracking-widest">
      {t("settings.title")}
    </span>
  </div>

  <ChevronDown
    className={`size-3 text-zinc-500 transition-transform duration-200 ${
      settingsOpen ? "rotate-180" : ""
    }`}
  />
</button>


  {settingsOpen && (
  <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">

              {/* BACKGROUND */}
              <div className="flex items-center gap-4">
                <span className="w-24 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                  {t("settings.background")}
                </span>

                <div ref={bgRef} className="relative flex-1">
                  <button
                type="button"
                onClick={() => setBgOpen((v) => !v)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2
                          text-[11px] text-left text-white
                          flex items-center justify-between
                          hover:border-zinc-600 transition-colors"
                          >
                            <span>
                            {t(`backgrounds.${canvasBg}`)}
                             </span>


                            <ChevronDown
                              className={`size-3 text-zinc-500 transition-transform ${
                                bgOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                  {bgOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                      {["neutral", "wood", "marble"].map((bg) => (
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
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LANGUAGE */}
              <div className="flex items-center gap-4">
                <span className="w-24 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                  {t("settings.language")}
                </span>

                <div ref={langRef} className="relative flex-1">
                  <button
                  type="button"
                  onClick={() => setLangOpen((v) => !v)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2
                            text-[11px] text-left text-white
                            flex items-center justify-between
                            hover:border-zinc-600 transition-colors"
                >
                  {t(`language.${language}`)}


                  <ChevronDown
                    className={`size-3 text-zinc-500 transition-transform ${
                      langOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                  {langOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                      {["en", "fr", "es", "de", "it"].map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setLanguage(l as any);
                            setLangOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-[11px] hover:bg-zinc-800"
                        >
                          {t(`language.${l}`)}

                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* UNITS */}
              <div className="flex items-center gap-4">
                <span className="w-24 text-[9px] text-zinc-500 uppercase font-black tracking-widest">
                   {t("settings.units")}
                </span>

                <div className="flex-1">
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    {["metric", "imperial"].map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnits(u as any)}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md ${
                          units === u
                            ? "bg-zinc-800 text-white"
                            : "text-zinc-600"
                        }`}
                      >
                        {u === "metric" ? "Metric" : "Imperial"}

                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>




        </>
      )}
                {/* PUSH TO BOTTOM */}
<div className="mt-auto" />

{/* FEEDBACK + DONATE */}
<div className="flex items-center justify-between mt-4 px-1">

  {/* FEEDBACK */}
  <a
    onClick={() =>
      (window.location.href =
        "mailto:contact@makeyourboard.com" +
        "?subject=Feedback" +
        "&body=Hi,%0D%0A%0D%0A" +
      "(feel free to delete this — you can suggest pedals or boards to add,%0D%0A" +
      "share ideas for improvements, or write in any language you like)%0D%0A%0D%0A" +
      "Thanks for using MakeYourBoard 🙂")
    }
    className="flex items-center gap-2 group cursor-pointer"
  >
    <span className="text-[12px]">💬</span>
    <span className="text-[10px] font-black uppercase tracking-light text-zinc-500 group-hover:text-white transition-colors duration-200">
      {t("footer.feedback")}
    </span>
  </a>

  {/* DONATE */}
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

