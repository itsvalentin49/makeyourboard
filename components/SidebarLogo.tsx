"use client";

type Props = {
  t: (key: string) => string;
};

export default function SidebarLogo({ t }: Props) {
  return (
    <div className="shrink-0 -mt-1 mb-1 select-none text-center">

      {/* TITLE */}
      <div>
        <div
          className="uppercase font-bold text-white"
          style={{ fontSize: 24.5 }}
        >
          MAKE YOUR BOARD
        </div>
      </div>
    </div>
  );
}