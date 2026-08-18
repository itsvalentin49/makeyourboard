"use client";

import React, { useEffect, useState } from "react";
import {
  MousePointer2,
  Zap,
  Download,
  Cable,
  Mail,
  Heart,
} from "lucide-react";

type Props = {
  t: (key: string) => string;
  mobile?: boolean;
  open: boolean;
  onClose: () => void;
  onContact?: () => void;
  supportUrl?: string;
};

export function HelpGuide({
  t,
  mobile = false,
  open,
  onClose,
  onContact,
  supportUrl,
}: Props) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;

    const hidden = localStorage.getItem("myb_help_hidden");
    setDontShowAgain(hidden === "true");
  }, [open]);

  const closeGuide = () => {
    if (dontShowAgain) {
      localStorage.setItem("myb_help_hidden", "true");
    } else {
      localStorage.removeItem("myb_help_hidden");
    }

    onClose();
  };

  const handleContact = () => {
    closeGuide();
    onContact?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* OVERLAY */}
      <div
        className="absolute inset-0 z-0 bg-black/20"
        onClick={closeGuide}
      />

      {/* MODAL */}
      <div
        className={`
        relative z-10
        ${mobile ? "w-[calc(100vw-32px)]" : "w-[520px]"}
        max-w-[520px]
        rounded-2xl
        bg-zinc-800
        border border-zinc-700
        pt-6 px-5 pb-5
      `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TITLE */}
        <div className="mb-6 text-center">
          <div className="text-[14px] font-black uppercase tracking-wider">
            {t("help.title")}
          </div>
        </div>

        {/* HELP */}
        <div className="space-y-4 text-sm leading-snug">
          <div className="flex gap-3">
            <MousePointer2
              size={18}
              className="mt-0.5 shrink-0 text-green-500"
            />

            <div>
              <div className="font-black">
                {t("help.gearTitle")}
              </div>

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
              <div className="font-black">
                {t("help.powerTitle")}
              </div>

              <p className="mt-0.5 text-zinc-400">
                {t("help.powerText")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Download
              size={18}
              className="mt-0.5 shrink-0 text-blue-500"
            />

            <div>
              <div className="font-black">
                {t("help.shareTitle")}
              </div>

              <p className="mt-0.5 text-zinc-400">
                {t("help.shareText")}
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT / SUPPORT */}
        <div className="mt-6 border-t border-zinc-700 pt-4 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleContact}
              className="
  h-9
  flex items-center justify-center gap-2
  rounded-lg
  bg-zinc-950
  border border-zinc-700
  text-[11px] font-bold
  transition-all
  hover:border-zinc-500
  hover:bg-canvas
"
            >
              <Mail size={15} />
              {t("footer.feedback")}
            </button>

            {supportUrl && (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeGuide}
                className="
  h-9
  flex items-center justify-center gap-2
  rounded-lg
  bg-zinc-950
  border border-zinc-700
  text-[11px] font-bold
  transition-all
  hover:border-zinc-500
  hover:bg-canvas
"
              >
                <Heart size={15} />
                {t("footer.donate")}
              </a>
            )}
          </div>
        </div>

        {/* DON'T SHOW AGAIN */}
        <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-300">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) =>
              setDontShowAgain(e.target.checked)
            }
            className="h-4 w-4 accent-blue-600"
          />

          {t("help.dontShowAgain")}
        </label>

        {/* OK */}
        <button
          type="button"
          onClick={closeGuide}
          className="
            mt-4
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