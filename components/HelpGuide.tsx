"use client";

import {
  MousePointer2,
  Zap,
  Download,
  Cable,
  Mail,
  Heart,
} from "lucide-react";

import SidebarLogo from "@/components/sidebar/SidebarLogo";

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
  const closeGuide = () => {
    onClose();
  };

  const handleContact = () => {
    closeGuide();
    onContact?.();
  };

  if (!open) return null;

  return (
    <div
      className={
        mobile
          ? `
          fixed
          z-[100]
          left-0
          right-0
          bottom-0
          top-[calc(64px+env(safe-area-inset-top))]
          overflow-y-auto
          overflow-x-hidden
          overscroll-contain
          bg-zinc-800
          [scrollbar-width:none]
          [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        `
          : "fixed inset-0 z-[300] flex items-center justify-center"
      }
    >
      {/* OVERLAY DESKTOP UNIQUEMENT */}
      {!mobile && (
        <div
          className="absolute inset-0 z-0 bg-black/20"
          onClick={closeGuide}
        />
      )}

      {/* CONTENU */}
      <div
        className={
          mobile
            ? `
            relative
            w-full
            min-h-full
            bg-zinc-800
            border-0
            rounded-none
            p-6
          `
            : `
            relative
            z-10
            w-[520px]
            max-w-[520px]
            max-h-[calc(100vh-32px)]
            overflow-y-auto
            no-scrollbar
            rounded-2xl
            bg-zinc-800
            border
            border-zinc-700
            pt-6
            px-5
            pb-5
          `
        }
        onClick={(e) => e.stopPropagation()}
      >

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <SidebarLogo compact={mobile} />
        </div>

        {/* BIENVENUE */}
        <div className="mb-6">
          <div className="text-[12px] font-black mb-1">
            {t("help.welcomeTitle")}
          </div>
          <p className="text-[12px] leading-[1.55] text-zinc-400">
            {t("help.welcomeText")}
          </p>

        </div>

        {/* HELP */}
        <div className="space-y-4 leading-snug">
          {/* MATÉRIEL */}
          <div className="flex gap-3">
            <MousePointer2
              size={18}
              className="mt-0.5 shrink-0 text-green-500"
            />

            <div>
              <div className="text-[12px] font-black">
                {t("help.gearTitle")}
              </div>

              <p className="mt-0.5 text-[12px] leading-[1.45] text-zinc-400">
                {t("help.gearText")}
              </p>
            </div>
          </div>

          {/* CÂBLES */}
          <div className="flex gap-3">
            <Cable
              size={18}
              className="mt-0.5 shrink-0 text-red-500"
            />

            <div>
              <div className="text-[12px] font-black">
                {t("help.jacksTitle")}
              </div>

              <p className="mt-0.5 text-[12px] leading-[1.45] text-zinc-400">
                {t("help.jacksText")}
              </p>
            </div>
          </div>

          {/* ALIMENTATION */}
          <div className="flex gap-3">
            <Zap
              size={18}
              className="mt-0.5 shrink-0 text-yellow-500"
            />

            <div>
              <div className="text-[12px] font-black">
                {t("help.powerTitle")}
              </div>

              <p className="mt-0.5 text-[12px] leading-[1.45] text-zinc-400">
                {t("help.powerText")}
              </p>
            </div>
          </div>

          {/* EXPORT */}
          <div className="flex gap-3">
            <Download
              size={18}
              className="mt-0.5 shrink-0 text-blue-500"
            />

            <div>
              <div className="text-[12px] font-black">
                {t("help.shareTitle")}
              </div>

              <p className="mt-0.5 text-[12px] leading-[1.45] text-zinc-400">
                {t("help.shareText")}
              </p>
            </div>
          </div>
        </div>

        {/* CONTACT / SUPPORT */}
        <div className="mt-6">
          <div className="mb-4">
            <div className="text-[12px] font-black mb-1">
              {t("help.contactTitle")}
            </div>

            <p className="text-[12px] leading-[1.5] text-zinc-400">
              {t("help.contactText")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* CONTACT */}
            <button
              type="button"
              onClick={handleContact}
              className="
                h-9
                flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-zinc-950
                border
                border-zinc-700
                text-[12px]
                font-bold
                transition-all
                hover:border-zinc-500
                hover:bg-canvas
              "
            >
              <Mail size={15} />
              {t("footer.feedback")}
            </button>

            {/* SUPPORT */}
            {supportUrl && (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeGuide}
                className="
                  h-9
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-zinc-950
                  border
                  border-zinc-700
                  text-[12px]
                  font-bold
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
      </div>
    </div>
  );
}