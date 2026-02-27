"use client";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="shrink-0 -mt-3 mb-2 select-none">

      {/* TITLE */}
      <div>
        <div
          className="uppercase font-bold text-zinc-100"
          style={{ fontSize: 30 }}
        >
          MAKE YOUR BOARD
        </div>

        {/* WHITE STRONG LINE (like TopBar) */}
        <div className="mt-1 h-px bg-white -mx-4" />
      </div>

      {/* SUBTITLE */}
      <p className="mt-4 text-[11px] italic text-zinc-500/80 leading-relaxed max-w-[300px]">
        {t("sidebar.subtitleLine1")}
        <br />
        {t("sidebar.subtitleLine2")}
      </p>

    </div>
  );
}