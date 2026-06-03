"use client";

type Props = {
  compact?: boolean;
};

export default function SidebarLogo({ compact = false }: Props) {
  return (
    <div
      className={
        compact
          ? "select-none"
          : "px-1 pb-0 pt-2 select-none"
      }
    >
      <div
        className={
          compact
            ? "text-[22px] font-black tracking-tight leading-none"
            : "text-[34px] font-black tracking-tight leading-none"
        }
      >
        MakeYourBoard
      </div>

      <div
        className={
          compact
            ? "mt-1 text-zinc-500 text-[7px] font-bold tracking-[0.28em] uppercase leading-none whitespace-nowrap"
            : "mt-1 text-zinc-500 text-[10px] font-bold tracking-[0.37em] uppercase leading-none whitespace-nowrap"
        }
      >
        Guitar Pedalboard Builder
      </div>
    </div>
  );
}