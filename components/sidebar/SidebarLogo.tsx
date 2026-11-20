"use client";

type Props = {
  compact?: boolean;
};

export default function SidebarLogo({ compact = false }: Props) {
  const subtitle = "GUITAR PEDALBOARD PLANNER";

  return (
    <div
      className="myb-sidebar-logo px-1 select-none inline-flex flex-col w-fit"
      style={{
        WebkitTextSizeAdjust: "100%",
        textSizeAdjust: "100%",
      }}
    >
      <div
        className={
          compact
            ? "myb-logo-title relative text-[22px] font-black tracking-tight leading-none"
            : "myb-logo-title relative text-[34px] font-black tracking-tight leading-none"
        }
        style={{ overflow: "visible" }}
      >
        MakeYourBoard

        <img
          src="/images/bonnet-noel.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          style={{
            position: "absolute",
            width: "1.15em",
            height: "1.15em",
            left: "-0.18em",
            top: "-0.36em",
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>

      <div
        aria-label={subtitle}
        className="myb-logo-subtitle flex w-full justify-between font-medium"
        style={{
          fontSize: compact ? 7 : 10,
          lineHeight: 1,
          marginTop: 3,
        }}
      >
        {subtitle.split("").map((char, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{
              fontSize: "inherit",
              display: "inline-block",
              transform: "scale(0.8)",
              transformOrigin: "center",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </div>
    </div>
  );
}