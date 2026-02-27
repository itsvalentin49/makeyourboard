"use client";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="shrink-0 -mt-3 mb-2 select-none text-center">

      {/* TITLE */}
      <div>
        <div
          className="uppercase font-bold text-zinc-100"
          style={{ fontSize: 26 }}
        >
          MAKE YOUR BOARD
        </div>
      </div>
    </div>
  );
}