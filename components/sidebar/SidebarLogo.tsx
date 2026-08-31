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
          ? "select-none inline-flex flex-col"
          : "pb-0 pt-2 select-none inline-flex flex-col"
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
            ? "w-full mt-1 flex items-center justify-between text-[7px] font-bold uppercase leading-none whitespace-nowrap"
            : "w-full mt-1 flex items-center justify-between text-[10px] font-bold uppercase leading-none whitespace-nowrap"
        }
      >
        <span
          style={{
            letterSpacing: compact ? "1px" : "3.5px",
          }}
        >
          GUITAR
        </span>

        <span
          style={{
            letterSpacing: compact ? "1px" : "3.5px",
          }}
        >
          PEDALBOARD
        </span>

        <span
          style={{
            letterSpacing: compact ? "1px" : "3.5px",
          }}
        >
          PLANNER
        </span>
      </div>
    </div>
  );
}