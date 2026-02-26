"use client";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="shrink-0 mb-2 select-none">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div
            className="uppercase font-bold text-zinc-100"
            style={{ fontSize: 30 }}
          >
            MAKE YOUR BOARD
          </div>

          <p className="mt-4 text-[11px] italic text-zinc-500/80 leading-relaxed max-w-[300px]">
            {t("sidebar.subtitleLine1")}
            <br />
            {t("sidebar.subtitleLine2")}
          </p>
        </div>
      </div>
    </div>
  );
}