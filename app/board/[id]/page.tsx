"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTranslator, type Language } from "@/utils/i18n";

type ErrorKey =
    | "share.invalidSharedBoard"
    | "share.sharedBoardNotFound"
    | null;

export default function SharedBoardPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [language, setLanguage] = useState<Language>("en");
    const [errorKey, setErrorKey] = useState<ErrorKey>(null);

    const t = getTranslator(language);

    /* ================= LANGUAGE ================= */

    useEffect(() => {
        try {
            const settings = JSON.parse(
                localStorage.getItem("myb_settings") || "{}"
            );

            const savedLanguage = settings?.language;

            const allowedLanguages: Language[] = [
                "en",
                "fr",
                "es",
                "de",
                "it",
                "pt",
                "zh",
            ];

            if (
                savedLanguage &&
                allowedLanguages.includes(savedLanguage)
            ) {
                setLanguage(savedLanguage);
            }
        } catch {
            // Si les settings sont invalides,
            // on garde l'anglais par défaut.
        }
    }, []);

    /* ================= LOAD SHARED BOARD ================= */

    useEffect(() => {
        const loadSharedBoard = async () => {
            const id = params.id;

            if (!id) {
                setErrorKey("share.invalidSharedBoard");
                return;
            }

            const { data, error } = await supabase
                .from("shared_boards")
                .select("id, name, data")
                .eq("id", id)
                .single();

            if (error || !data) {
                console.error(
                    "Unable to load shared board:",
                    error
                );

                setErrorKey("share.sharedBoardNotFound");
                return;
            }

            sessionStorage.setItem(
                "myb_shared_board_import",
                JSON.stringify({
                    id: data.id,
                    name: data.name,
                    data: data.data,
                })
            );

            router.replace("/");
        };

        loadSharedBoard();
    }, [params.id, router]);

    /* ================= ERROR ================= */

    if (errorKey) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">
                        {t("share.sharedBoardUnavailable")}
                    </h1>

                    <p className="text-sm text-zinc-500">
                        {t(errorKey)}
                    </p>
                </div>
            </main>
        );
    }

    /* ================= LOADING ================= */

    return (
        <main className="min-h-screen flex items-center justify-center">
            <div className="text-sm text-zinc-500">
                {t("share.loadingSharedBoard")}
            </div>
        </main>
    );
}