"use client";

import Image from "next/image";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="flex items-start gap-3 mb-3 mt-2 select-none">

      {/* LOGO */}
      <Image
        src="/logos/logo.png"
        alt="Make Your Board logo"
        width={38}
        height={38}
        className="shrink-0 object-contain"
        priority
      />

      {/* TEXT */}
      <div className="flex items-center mt-[2px]">
        <span className="text-white font-bold text-[20px] whitespace-nowrap">
          MAKE YOUR BOARD
        </span>
      </div>

    </div>
  );
}