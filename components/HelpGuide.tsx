"use client";

import React, { useEffect, useState } from "react";
import { MousePointer2, Zap, Download, Cable } from "lucide-react";

type Props = {
  t: (key: string) => string;
  mobile?: boolean;
  forceClose?: boolean;
};

export function HelpGuide({
  t,
  mobile = false,
  forceClose = false,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (forceClose) {
      setOpen(false);
    }
  }, [forceClose]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center">
      <div
        className="
          fixed inset-0 z-[70]
        "
        onClick={() => setOpen(false)}
      />

      <div
        className={`
          relative z-[90]
          ${mobile ? "w-[calc(100vw-32px)]" : "w-[520px]"}
          max-w-[520px]
          rounded-2xl
          bg-zinc-900
          border
          border-zinc-800
          shadow-2xl
          pt-6
          px-5
          pb-5
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 text-center">
          <div className="text-[14px] font-black uppercase tracking-wider">
            {t("help.title")}
          </div>
        </div>

        <div className="space-y-4 text-sm leading-snug">
          <div className="flex gap-3">
            <MousePointer2 size={18} className="mt-0.5 shrink-0 text-green-500" />
            <div>
              <div className="font-black">{t("help.gearTitle")}</div>
              <p className="mt-0.5 text-zinc-400">{t("help.gearText")}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Cable size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <div className="font-black">{t("help.jacksTitle")}</div>
              <p className="mt-0.5 text-zinc-400">{t("help.jacksText")}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Zap size={18} className="mt-0.5 shrink-0 text-yellow-500" />
            <div>
              <div className="font-black">{t("help.powerTitle")}</div>
              <p className="mt-0.5 text-zinc-400">{t("help.powerText")}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Download size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <div>
              <div className="font-black">{t("help.shareTitle")}</div>
              <p className="mt-0.5 text-zinc-400">{t("help.shareText")}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="
            mt-8
            h-8
            w-full
            rounded-md
            bg-blue-600
            !text-white
            text-[11px]
            font-black
            uppercase
            tracking-wide
            transition-colors
            hover:bg-blue-500
          "
        >
          {t("help.ok")}
        </button>
      </div>
    </div>
  );
}