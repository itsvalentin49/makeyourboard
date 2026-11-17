"use client";

import { useEffect, useRef, type ReactNode } from "react";
import SpecsPedal from "@/components/sidebar/SpecsPedals";
import SpecsPower from "@/components/sidebar/SpecsPower";
import SpecsBoards from "@/components/sidebar/SpecsBoards";
import { getTranslator, type Language } from "@/utils/i18n";

type AnyRow = Record<string, any>;

type Props = {
    filters?: ReactNode;
    custom?: ReactNode;
    selectedPedal?: AnyRow;
    onAddToBoard?: (pedal: AnyRow) => void;
    replacementMode?: boolean;
    selectedBoardDetails?: AnyRow;
    boardsLibrary?: AnyRow[];
    onSelectBoard?: (board: AnyRow) => void;
    selectedInstanceId?: number | null;
    selectedBoardInstanceId?: number | null;
    language: Language;
    units: "metric" | "imperial";
    country: string;
    isUSA: boolean;
    isEurope: boolean;
    onClose?: () => void;
    onRecommendationsHostChange?: (host: HTMLDivElement | null) => void;
    rotatePedal: (id: number) => void;
    movePedalFront: (id: number) => void;
    movePedalBack: (id: number) => void;
    deletePedal: (id: number) => void;
    rotateBoard: (id: number) => void;
    moveBoardFront: (id: number) => void;
    moveBoardBack: (id: number) => void;
    deleteBoard: (id: number) => void;
};

export default function SidebarFilter({
    filters,
    custom,
    selectedPedal,
    onAddToBoard,
    replacementMode = false,
    selectedBoardDetails,
    boardsLibrary = [],
    onSelectBoard,
    selectedInstanceId = null,
    selectedBoardInstanceId = null,
    language,
    units,
    country,
    isUSA,
    isEurope,
    onClose,
    onRecommendationsHostChange,
    rotatePedal,
    movePedalFront,
    movePedalBack,
    deletePedal,
    rotateBoard,
    moveBoardFront,
    moveBoardBack,
    deleteBoard,
}: Props) {
    const translate = getTranslator(language);
    const t = (key: string) => translate(
        replacementMode && key === "customPanel.addToBoard" ? "replacement.previewAction" : key
    );
    const detailsScrollerRef = useRef<HTMLDivElement>(null);
    const selectedKey = selectedPedal
        ? `pedal:${selectedPedal.id ?? selectedPedal.slug ?? ""}:${selectedPedal.brand ?? ""}:${selectedPedal.name ?? ""}`
        : selectedBoardDetails
            ? `board:${selectedBoardDetails.id ?? ""}:${selectedBoardDetails.name ?? ""}`
            : "none";

    useEffect(() => {
        if (detailsScrollerRef.current) detailsScrollerRef.current.scrollTop = 0;
    }, [selectedKey]);
    const hasSelection = Boolean(selectedPedal || selectedBoardDetails);
    const isImportedPedal = selectedPedal?.slug === "custom-upload";
    const isCustomPedal = selectedPedal?.brand === "Custom" && !isImportedPedal;
    const isCustomBoard = selectedBoardDetails?.brand === "Custom";
    const hasBoardCommercialLinks = Boolean(
        selectedBoardDetails?.sweetwater ||
        selectedBoardDetails?.woodbrass ||
        selectedBoardDetails?.thomann
    );

    const buildThomannUrl = (slug: string) => {
        const domains: Record<string, string> = {
            FR: "thomann.fr",
            NL: "thomann.nl",
            DE: "thomann.de",
            ES: "thomann.es",
            IT: "thomann.it",
            PT: "thomann.pt",
        };
        const domain = domains[country.toUpperCase()] || "thomann.de";
        return `https://www.${domain}/${slug}`;
    };

    const getStoresForCountry = () => {
        const c = country.toUpperCase();
        if (["US", "CA", "MX", "BR", "AR", "CL", "CO", "PE"].includes(c)) {
            return ["sweetwater"];
        }
        if (c === "FR") return ["woodbrass", "thomann"];
        if (c === "NL") return ["thomann_nl"];
        if (c === "DE") return ["thomann_de"];
        if (c === "ES") return ["thomann_es"];
        if (c === "IT") return ["thomann_it"];
        if (c === "PT") return ["thomann_pt"];
        return ["thomann_de"];
    };

    return (
        <div className="flex h-full w-full min-h-0 min-w-0 flex-col bg-transparent">
            {hasSelection ? (
                <div ref={detailsScrollerRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden break-words px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {selectedPedal &&
                        (selectedPedal.type === "power" || selectedPedal.capacity) ? (
                        <>
                            <SpecsPower
                                selectedPower={selectedPedal}
                                onAddToBoard={onAddToBoard}
                                units={units}
                                language={language}
                                t={t}
                                isUSA={isUSA}
                                isEurope={isEurope}
                                buildThomannUrl={buildThomannUrl}
                                selectedInstanceId={selectedInstanceId}
                                rotatePedal={rotatePedal}
                                movePedalFront={movePedalFront}
                                movePedalBack={movePedalBack}
                                deletePedal={deletePedal}
                            />

                            <div
                                ref={onRecommendationsHostChange}
                                className="mt-6 min-w-0"
                            />
                        </>
                    ) : selectedPedal ? (
                        <>
                            <SpecsPedal
                                selectedPedal={selectedPedal}
                                onAddToBoard={onAddToBoard}
                                selectedInstanceId={selectedInstanceId}
                                units={units}
                                language={language}
                                t={t}
                                isCustomPedal={isCustomPedal}
                                isImportedPedal={isImportedPedal}
                                isUSA={isUSA}
                                isEurope={isEurope}
                                buildThomannUrl={buildThomannUrl}
                            />
                            {/* Recommendations are mounted here by the desktop catalog.
                                This is inside the same independent scroll container. */}
                            <div ref={onRecommendationsHostChange} className="mt-6 min-w-0" />
                        </>
                    ) : selectedBoardDetails ? (
                        <SpecsBoards
                            selectedBoardDetails={selectedBoardDetails}
                            boardsLibrary={boardsLibrary}
                            onSelectBoard={onSelectBoard}
                            onAddToBoard={onAddToBoard}
                            units={units}
                            language={language}
                            t={t}
                            isCustomBoard={isCustomBoard}
                            buildThomannUrl={buildThomannUrl}
                            getStoresForCountry={getStoresForCountry}
                            hasBoardCommercialLinks={hasBoardCommercialLinks}
                            selectedBoardInstanceId={selectedBoardInstanceId}
                            rotateBoard={rotateBoard}
                            moveBoardFront={moveBoardFront}
                            moveBoardBack={moveBoardBack}
                            deleteBoard={deleteBoard}
                            isUSA={isUSA}
                            isEurope={isEurope}
                        />
                    ) : null}
                </div>
            ) : (
                <>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                        {filters}
                    </div>
                    <div className="shrink-0 px-5 pb-5 pt-3">
                        {custom}
                    </div>
                </>
            )}
        </div>
    );
}