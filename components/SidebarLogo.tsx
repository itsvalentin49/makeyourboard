"use client";

export default function SidebarLogo() {
  return (
    <div className="shrink-0 mb-8 select-none">
      <div className="flex items-start justify-between">

        {/* TEXTE */}
        <div className="flex flex-col leading-none">
          <div
            className="uppercase font-bold text-zinc-100 tracking-[0.32em]"
            style={{
              fontSize: 28,
              textShadow: "0 0 12px rgba(80,150,255,.25)",
            }}
          >
            MAKE YOUR
          </div>

          <div
            className="uppercase font-black text-zinc-100 mt-1"
            style={{
              fontSize: 44,
              letterSpacing: "0.04em",
              textShadow:
                "0 0 20px rgba(80,150,255,.6), 0 0 60px rgba(80,150,255,.35)",
            }}
          >
            BOARD
          </div>
        </div>

        {/* LOGO À DROITE */}
        <div className="flex items-end gap-[6px] mt-3 opacity-90">
          <span className="w-[5px] h-12 bg-zinc-100 rounded-full" />
          <span className="w-[5px] h-7 bg-zinc-100 rounded-full" />
          <span className="w-[5px] h-7 bg-zinc-100 rounded-full" />
          <span className="w-[5px] h-12 bg-zinc-100 rounded-full" />
        </div>

      </div>
    </div>
  );
}
