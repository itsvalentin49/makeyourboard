"use client";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="mb-5 mt-1 px-1 select-none">

      {/* TITLE */}
      <div className="text-[34px] font-black tracking-tight leading-none">
        MakeYourBoard
      </div>

      {/* SUBTITLE */}
<div
  className="
    mt-1
    text-zinc-500
    text-[11px]
    font-bold
    tracking-[0.205em]
    uppercase
    leading-none
    whitespace-nowrap
    origin-left
    scale-x-[1.09]
  "
>
  Guitar Pedalboard Builder
</div>

    </div>
  );
}