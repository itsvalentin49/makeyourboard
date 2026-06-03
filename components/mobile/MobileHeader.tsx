"use client";

import SidebarLogo from "@/components/sidebar/SidebarLogo";
import { Plus, Minus } from "lucide-react";

type Props = {
  t: (key: string) => string;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  setSelectedInstanceId: (v: number | null) => void;
  setSelectedBoardInstanceId: (v: number | null) => void;
  desktop?: boolean;
};

export default function MobileHeader({
  t,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  setSelectedInstanceId,
  setSelectedBoardInstanceId,
  desktop = false,
}: Props) {
  return (
    <div
      className="
        relative
        z-50
        bg-zinc-950
        flex items-center justify-between
        px-4
        shrink-0
      "
      style={{
        paddingTop: desktop ? 0 : "env(safe-area-inset-top)",
        height: desktop ? "64px" : "calc(64px + env(safe-area-inset-top))",
      }}
    >
      <div className={desktop ? "pl-4" : ""}>
        {!desktop && <SidebarLogo compact />}
      </div>

      {!desktop && (
        <button
          type="button"
          onClick={() => {
            if (mobileSidebarOpen) {
              setMobileSidebarOpen(false);
              return;
            }

            setSelectedInstanceId(null);
            setSelectedBoardInstanceId(null);
            setMobileSidebarOpen(true);
          }}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            z-50
            w-[30px] h-[30px]
            rounded-full
            bg-[#3b82f6]
            text-white
            flex items-center justify-center
            shadow-2xl
            active:scale-95
            transition-transform
          "
        >
          {mobileSidebarOpen ? (
            <Minus size={22} strokeWidth={2.4} />
          ) : (
            <Plus size={22} strokeWidth={2.4} />
          )}
        </button>
      )}
    </div>
  );
}