"use client";

import React from "react";

type Props = {
  selectedPedal: any;
  isUSA: boolean;
  isEurope: boolean;
  buildThomannUrl: (slug: string) => string;
  t: (key: string) => string;
};

export default function BuyOnline({
  selectedPedal,
  isUSA,
  isEurope,
  buildThomannUrl,
  t,
}: Props) {

  if (!selectedPedal) return null;

  const status = (selectedPedal.status || "").toLowerCase();
  let stores: string[] = [];

  if (status.includes("discontinued")) {
    stores = ["reverb"];
  } else {

    if (isUSA) {
      stores = ["sweetwater", "reverb"];
    }

    else if (isEurope) {

      if (selectedPedal?.thomann) {
        stores.push("thomann");
      }

      if (selectedPedal?.woodbrass) {
        stores.push("woodbrass");
      }

      stores.push("reverb");
    }

    else {
      stores = ["reverb"];
    }
  }

  return (
    <div className="mt-8">

<div className="mb-4">
  <div
    className="
      w-full
      text-[11px] font-black uppercase
      py-2 rounded-md
      bg-blue-500 !text-white
      transition-all duration-150
      text-center
      cursor-default
    "
  >
    {t("sidebar.buyOnline")}
  </div>
</div>

      <div className="flex flex-col">

        {stores.map((store) => {

          let url = "";

          if (store === "reverb") {
            url = `https://reverb.com/marketplace?query=${encodeURIComponent(
              `${selectedPedal.brand} ${selectedPedal.name}`
            )}`;
          }

          if (store === "sweetwater") {
            url = selectedPedal.sweetwater;
          }

          if (store === "woodbrass") {
            url = selectedPedal.woodbrass;
          }

          if (store === "thomann") {
            url = buildThomannUrl(selectedPedal.thomann);
          }

          if (!url) return null;

          const storeData = {
            sweetwater: { label: "Sweetwater", logo: "/logos/sweetwater.png" },
            woodbrass: { label: "Woodbrass", logo: "/logos/woodbrass.png" },
            reverb: { label: "Reverb", logo: "/logos/reverb.png" },
            thomann: { label: "Thomann", logo: "/logos/thomann.png" },
          };

          const data = storeData[store as keyof typeof storeData];

          return (
            <a
              key={store}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center gap-3
                px-3 py-3
                rounded-lg
                transition-all duration-200 ease-out
                hover:bg-zinc-900
                hover:scale-[1.02]
                active:scale-[0.98]
                group
              "
            >
              <img
                src={data.logo}
                alt={data.label}
                className="w-5 h-5 object-contain transition-transform duration-200 group-hover:scale-110"
              />

              <span className="
                text-[12px] font-semibold text-zinc-300
                transition-all duration-200
                group-hover:text-white
                group-hover:translate-x-1
              ">
                {data.label}
              </span>

            </a>
          );
        })}

      </div>
    </div>
  );
}