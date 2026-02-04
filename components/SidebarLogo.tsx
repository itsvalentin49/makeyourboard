"use client";

export default function SidebarLogo() {
  return (
    <div className="shrink-0 mb-8 select-none">
      <div className="flex items-start justify-between">

        {/* TEXTE */}
        <div className="flex flex-col leading-none">
          <div
            className="uppercase font-bold text-zinc-100"
            style={{
              fontSize: 30,
              textShadow: "0 0 10px rgba(80,150,255,.35), 0 0 24px rgba(80,150,255,.15)",
            }}
          >
            MAKE YOUR BOARD
          </div>
        </div>
      </div>
    </div>
  );
}
