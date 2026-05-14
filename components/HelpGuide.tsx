"use client";

import React, { useEffect, useState } from "react";
import { Info, X, MousePointer2, Zap, Share2, Download, LayoutPanelLeft, Cable,} from "lucide-react";

type Props = {
  t: (key: string) => string;
};

export function HelpGuide({ t }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem("myb_help_seen");

    if (!alreadySeen) {
      setOpen(true);
    }
  }, []);

  const closeGuide = () => {
    setOpen(false);
    localStorage.setItem("myb_help_seen", "true");
  };

  return (
    <div className="absolute top-6 right-6 z-[80]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          flex h-10 w-10 items-center justify-center rounded-full
          bg-zinc-900 text-white border border-zinc-800 shadow-2xl
          transition-all duration-200
          hover:scale-105 hover:border-blue-500 active:scale-95
        "
        aria-label={t("help.open")}
      >
        <Info size={18} style={{ color: "var(--foreground)",}}
      />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={closeGuide} />

          <div
            className="
              absolute right-0 top-12 z-[90]
              w-[400px] rounded-2xl
              bg-zinc-900 border border-zinc-800 shadow-2xl
              pt-6 px-5 pb-5
            "
            onClick={(e) => e.stopPropagation()}
          >
<div className="mb-8 select-none">
  <div className="text-[30px] font-black text-center tracking-tight leading-none">
    MakeYourBoard
  </div>

  <div
    className="
      mt-1
      text-zinc-500
      text-[10px]
      font-bold
      tracking-[0.25em]
      uppercase
      text-center
      leading-none
      whitespace-nowrap
      origin-left
      scale-x-[1.01]
    "
  >
    Guitar Pedalboard Builder
  </div>

</div>

            <div className="space-y-4 text-sm leading-snug">
              <div className="flex gap-3">
                <MousePointer2
                  size={18}
                  className="mt-0.5 shrink-0 text-green-500"
                />
                <div>
                  <div className="font-black">{t("help.gearTitle")}</div>
                  <p className="mt-0.5 text-zinc-400">
                    {t("help.gearText")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Cable
                    size={18}
                    className="mt-0.5 shrink-0 text-red-500"
                />

                <div>
                    <div className="font-black">
                    {t("help.jacksTitle")}
                    </div>

                    <p className="mt-0.5 text-zinc-400">
                    {t("help.jacksText")}
                    </p>
                </div>
                </div>

              <div className="flex gap-3">
                <Zap
                  size={18}
                  className="mt-0.5 shrink-0 text-yellow-500"
                />
                <div>
                  <div className="font-black">{t("help.powerTitle")}</div>
                  <p className="mt-0.5 text-zinc-400">
                    {t("help.powerText")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Download size={18} className="mt-0.5 shrink-0 text-blue-500"
                />
                <div>
                  <div className="font-black">{t("help.shareTitle")}</div>
                  <p className="mt-0.5 text-zinc-400">
                    {t("help.shareText")}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeGuide}
              className="
                mt-8 h-8 w-full rounded-md bg-blue-600
                !text-white text-[11px] font-black uppercase tracking-wide
                transition-colors hover:bg-blue-500
              "
            >
              {t("help.ok")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}