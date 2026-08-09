"use client";

type Props = {
  compact?: boolean;
};

export default function SidebarLogo({
  compact = false,
}: Props) {
  return (
    <div
      className={
        compact
          ? "select-none flex flex-col items-center"
          : "pb-0 pt-2 select-none flex flex-col items-center"
      }
    >
      <div
        className={
          compact
            ? "w-fit text-[22px] font-black tracking-tight leading-none"
            : "w-fit text-[34px] font-black tracking-tight leading-none"
        }
      >
        MakeYourBoard
      </div>

      <div
        className={
          compact
            ? "w-fit mt-1 text-[7px] font-bold tracking-[0.28em] uppercase leading-none whitespace-nowrap"
            : "w-fit mt-1 text-[10px] font-bold tracking-[0.37em] uppercase leading-none whitespace-nowrap"
        }
      >
        Guitar Pedalboard Builder
      </div>
    </div>
  );
}