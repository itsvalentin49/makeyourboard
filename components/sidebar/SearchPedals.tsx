"use client";

import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type AnyRow = Record<string, any>;

type Props = {
  pedalsLibrary: AnyRow[];

  pedalSearch: string;
  setPedalSearch: (v: string) => void;

  showPedalResults: boolean;
  setShowPedalResults: (v: boolean) => void;

  setShowBoardResults: (v: boolean) => void;

  addPedal: (p: AnyRow) => void;

  pedalInputRef: React.RefObject<HTMLInputElement | null>;

  t: (key: string) => string;

  groupItems: (
    items: AnyRow[],
    filter: string
  ) => Record<string, AnyRow[]>;
};

function parseReleaseDate(value: any): Date | null {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}


function getPhysicalThumbnailSize(pedal: AnyRow) {
  const width = Number(pedal.width) || 0;
  const depth = Number(pedal.depth) || 0;

  const MAX_WIDTH = 52;
  const MAX_HEIGHT = 38;

  if (width <= 0 || depth <= 0) {
    return {
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
    };
  }

  /*
   * width / depth définit UNIQUEMENT la boîte physique.
   * On agrandit cette boîte au maximum dans 52 × 38 px
   * sans jamais modifier son ratio.
   */
  const scale = Math.min(
    MAX_WIDTH / width,
    MAX_HEIGHT / depth
  );

  return {
    width: Math.max(1, width * scale),
    height: Math.max(1, depth * scale),
  };
}

type CropBounds = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

const thumbnailCropCache = new Map<
  string,
  Promise<CropBounds | null>
>();

function getThumbnailCrop(
  src: string,
  image: HTMLImageElement
): Promise<CropBounds | null> {
  const cached = thumbnailCropCache.get(src);
  if (cached) return cached;

  const promise = new Promise<CropBounds | null>((resolve) => {
    try {
      const MAX_ANALYSIS_SIZE = 96;
      const ratio = Math.min(
        1,
        MAX_ANALYSIS_SIZE / Math.max(image.naturalWidth, image.naturalHeight)
      );

      const analysisWidth = Math.max(
        1,
        Math.round(image.naturalWidth * ratio)
      );
      const analysisHeight = Math.max(
        1,
        Math.round(image.naturalHeight * ratio)
      );

      const analysis = document.createElement("canvas");
      analysis.width = analysisWidth;
      analysis.height = analysisHeight;

      const context = analysis.getContext("2d", {
        willReadFrequently: true,
      });

      if (!context) {
        resolve(null);
        return;
      }

      context.clearRect(0, 0, analysisWidth, analysisHeight);
      context.drawImage(image, 0, 0, analysisWidth, analysisHeight);

      const pixels = context.getImageData(
        0,
        0,
        analysisWidth,
        analysisHeight
      ).data;

      let minX = analysisWidth;
      let minY = analysisHeight;
      let maxX = -1;
      let maxY = -1;
      const ALPHA_THRESHOLD = 10;

      for (let y = 0; y < analysisHeight; y++) {
        for (let x = 0; x < analysisWidth; x++) {
          const alpha =
            pixels[(y * analysisWidth + x) * 4 + 3];

          if (alpha > ALPHA_THRESHOLD) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX < minX || maxY < minY) {
        resolve(null);
        return;
      }

      const scaleX = image.naturalWidth / analysisWidth;
      const scaleY = image.naturalHeight / analysisHeight;

      const sx = Math.max(0, Math.floor(minX * scaleX));
      const sy = Math.max(0, Math.floor(minY * scaleY));
      const sourceRight = Math.min(
        image.naturalWidth,
        Math.ceil((maxX + 1) * scaleX)
      );
      const sourceBottom = Math.min(
        image.naturalHeight,
        Math.ceil((maxY + 1) * scaleY)
      );

      resolve({
        sx,
        sy,
        sw: Math.max(1, sourceRight - sx),
        sh: Math.max(1, sourceBottom - sy),
      });
    } catch {
      resolve(null);
    }
  });

  thumbnailCropCache.set(src, promise);
  return promise;
}

function PhysicalThumbnail({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [fallback, setFallback] = useState(false);

  /*
   * Ne charge/analyse que les miniatures proches de la zone visible.
   * Une recherche large ne lance donc plus des centaines de new Image().
   */
  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "160px 0px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";

    image.onload = async () => {
      if (cancelled) return;

      try {
        const crop = await getThumbnailCrop(src, image);
        if (cancelled) return;

        const sx = crop?.sx ?? 0;
        const sy = crop?.sy ?? 0;
        const sourceWidth = crop?.sw ?? image.naturalWidth;
        const sourceHeight = crop?.sh ?? image.naturalHeight;

        /*
         * La boîte respecte width/depth.
         * Le bitmap garde STRICTEMENT son ratio : contain uniquement.
         */
        const scale = Math.min(
          width / sourceWidth,
          height / sourceHeight
        );

        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const dpr = Math.max(1, window.devicePixelRatio || 1);

        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext("2d");
        if (!context) {
          setFallback(true);
          return;
        }

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(
          image,
          sx,
          sy,
          sourceWidth,
          sourceHeight,
          (width - drawWidth) / 2,
          (height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );

        setFallback(false);
      } catch {
        if (!cancelled) setFallback(true);
      }
    };

    image.onerror = () => {
      if (!cancelled) setFallback(true);
    };

    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, width, height, shouldLoad]);

  return (
    <div
      ref={hostRef}
      className="flex items-center justify-center"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {fallback ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="block max-w-full max-h-full w-auto h-auto object-contain"
        />
      ) : (
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={alt}
          className="block"
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      )}
    </div>
  );
}

function isNewPedal(value: any): boolean {
  const releaseDate = parseReleaseDate(value);

  if (!releaseDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 30);

  releaseDate.setHours(0, 0, 0, 0);

  return releaseDate >= limitDate && releaseDate <= today;
}

export default function SearchPedals({
  pedalsLibrary,
  pedalSearch,
  setPedalSearch,
  setShowPedalResults,
  setShowBoardResults,
  addPedal,
  pedalInputRef,
  t,
}: Props) {
  const deferredPedalSearch = useDeferredValue(pedalSearch);
  const search = deferredPedalSearch.trim().toLowerCase();
  const isSearching = pedalSearch.trim().length > 0;
  const isDeferredSearching = search.length > 0;

  const visiblePedals = useMemo(() => {
    if (!isDeferredSearching) {
      return pedalsLibrary
        .filter((pedal) => isNewPedal(pedal.year))
        .sort((a, b) => {
          const dateA =
            parseReleaseDate(a.year)?.getTime() || 0;

          const dateB =
            parseReleaseDate(b.year)?.getTime() || 0;

          return dateB - dateA;
        });
    }

    const terms = search.split(" ").filter(Boolean);

    return pedalsLibrary
      .filter((pedal) => {
        const rawType = String(
          pedal.type ?? ""
        );

        const translatedType = t(
          `pedal.type.${rawType}`
        );

        const haystack = `
          ${pedal.brand ?? ""}
          ${pedal.name ?? ""}
          ${rawType}
          ${translatedType}
        `.toLowerCase();

        return terms.every((term) =>
          haystack.includes(term)
        );
      })
      .sort((a, b) => {
        const brandA = String(
          a.brand || ""
        ).toLowerCase();

        const brandB = String(
          b.brand || ""
        ).toLowerCase();

        const nameA = String(
          a.name || ""
        ).toLowerCase();

        const nameB = String(
          b.name || ""
        ).toLowerCase();

        const typeA = String(
          a.type || ""
        ).toLowerCase();

        const typeB = String(
          b.type || ""
        ).toLowerCase();

        function getSearchScore(
          brand: string,
          name: string,
          type: string
        ) {
          // 1. La marque correspond exactement
          if (brand === search) return 0;

          // 2. La marque commence par la recherche
          if (brand.startsWith(search)) return 1;

          // 3. La marque contient la recherche
          if (brand.includes(search)) return 2;

          // 4. Le nom correspond exactement
          if (name === search) return 3;

          // 5. Le nom commence par la recherche
          if (name.startsWith(search)) return 4;

          // 6. Le nom contient la recherche
          if (name.includes(search)) return 5;

          // 7. Le type correspond exactement
          if (type === search) return 6;

          // 8. Le type contient la recherche
          if (type.includes(search)) return 7;

          return 8;
        }

        const scoreA = getSearchScore(
          brandA,
          nameA,
          typeA
        );

        const scoreB = getSearchScore(
          brandB,
          nameB,
          typeB
        );

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }

        const brandComparison =
          brandA.localeCompare(
            brandB,
            undefined,
            {
              sensitivity: "base",
            }
          );

        if (brandComparison !== 0) {
          return brandComparison;
        }

        return nameA.localeCompare(
          nameB,
          undefined,
          {
            sensitivity: "base",
          }
        );
      });
  }, [
    pedalsLibrary,
    search,
    isDeferredSearching,
    t,
  ]);

  const handlePedalHover = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const button = event.currentTarget;

    const shade = button.className.match(
      /(?:^|\s)hover:bg-zinc-(\d+)(?:\s|$)/
    )?.[1];

    if (!shade) return;

    button.style.setProperty(
      "background-color",
      `var(--zinc-${shade})`,
      "important"
    );
  };

  const handlePedalLeave = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.currentTarget.style.removeProperty(
      "background-color"
    );
  };

  return (
    <div className="flex flex-col mt-4 h-full min-h-0">
      {/* TITRE AU-DESSUS DE LA BARRE DE RECHERCHE */}

      <div className="mb-2 shrink-0">
        <div className="text-[11px] font-black uppercase tracking-wide">
          {t("pedalsMenu.title")}
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}

      <div className="relative flex items-center mb-4 shrink-0">
        <Search
          size={15}
          strokeWidth={2.5}
          className="absolute left-4 text-[#6f6a5d]"
        />

        <input
          ref={pedalInputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t(
            "pedalsMenu.searchPlaceholder"
          )}
          className="
            w-full
            h-[30px]
            bg-white
            !text-black
            placeholder:!text-zinc-500
            rounded-md
            pl-12
            pr-11
            text-[12px]
            font-bold
            outline-none
          "
          value={pedalSearch}
          onClick={(event) => {
            event.stopPropagation();

            setShowBoardResults(false);
            setShowPedalResults(true);
          }}
          onChange={(event) => {
            setPedalSearch(
              event.target.value
            );

            setShowPedalResults(true);
          }}
        />

        {pedalSearch && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              setPedalSearch("");

              pedalInputRef.current?.focus();
            }}
            className="
              absolute
              right-4
              flex
              items-center
              justify-center
              text-[#6f6a5d]
              hover:opacity-70
              transition-opacity
            "
            aria-label="Effacer la recherche"
          >
            <X
              size={15}
              strokeWidth={3}
            />
          </button>
        )}
      </div>

      {/* NOMBRE DE RÉSULTATS */}

      {isSearching && (
        <div className="mt-4 mb-2 shrink-0 text-[11px] font-bold">
          {t(
            visiblePedals.length <= 1
              ? "pedalsMenu.result"
              : "pedalsMenu.results"
          ).replace(
            "{count}",
            String(
              visiblePedals.length
            )
          )}
        </div>
      )}

      {/* RÉSULTATS */}

      <div className="flex flex-col gap-1 min-h-0 flex-1 overflow-hidden">
        {/* TEXTE NOUVEAUTÉS */}

        {!isSearching && (
          <div className="mt-4 shrink-0 text-[11px] font-bold">
            {t("pedalsMenu.latest")}
          </div>
        )}

        {/* LISTE */}

        <div className="flex flex-col gap-0 overflow-y-auto no-scrollbar pb-6 min-h-0">
          {visiblePedals.map(
            (pedal) => {
              const image =
                pedal.thumbnail ||
                null;

              const isNew =
                isNewPedal(
                  pedal.year
                );

              const thumbnailSize =
                getPhysicalThumbnailSize(
                  pedal
                );

              return (
                <button
                  key={pedal.id}
                  type="button"
                  onClick={() => {
                    addPedal(pedal);

                    setShowPedalResults(
                      false
                    );
                  }}
                  onMouseEnter={
                    handlePedalHover
                  }
                  onMouseLeave={
                    handlePedalLeave
                  }
                  className="
                    relative
                    w-full
                    min-h-[48px]
                    rounded-lg
                    bg-zinc-800
                    hover:bg-zinc-700
                    pl-[64px]
                    pr-2
                    py-1
                    flex
                    items-center
                    text-left
                    transition-colors
                    shrink-0
                    overflow-hidden
                  "
                >
                  {/* IMAGE COMPLÈTEMENT À GAUCHE */}

                  <div
                    className="
                      absolute
                      left-0
                      top-1/2
                      -translate-y-1/2
                      w-[56px]
                      h-[42px]
                      flex
                      items-center
                      justify-center
                      pointer-events-none
                      overflow-hidden
                    "
                  >
                    {image ? (
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: `${thumbnailSize.width}px`,
                          height: `${thumbnailSize.height}px`,
                        }}
                      >
                        <PhysicalThumbnail
                          src={image}
                          alt={`${pedal.brand || ""} ${pedal.name || ""}`}
                          width={thumbnailSize.width}
                          height={thumbnailSize.height}
                        />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-zinc-700" />
                    )}
                  </div>

                  {/* TEXTE */}

                  <div className="min-w-0 flex items-center flex-1">
                    <div className="min-w-0 flex-1">
                      {/* MARQUE */}

                      <div className="text-[12px] font-black leading-tight truncate">
                        {pedal.brand}
                      </div>

                      {/* NOM + BADGE NEW */}

                      <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-bold text-zinc-300 leading-tight mt-0.5">
                        <span className="truncate min-w-0">
                          {pedal.name}
                        </span>

                        {isNew && (
                          <span
                            className="
                              text-[8px]
                              font-black
                              uppercase
                              tracking-wider
                              text-green-500
                              shrink-0
                            "
                          >
                            {t(
                              "pedalsMenu.new"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}