
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import JackPositionEditor from "@/components/JackPositionEditor";

import type {
    CalibrationPedal,
} from "@/components/JackPositionEditor";

import type {
    PedalConnector,
} from "@/utils/connectors";

/* =========================================================
   LOAD PEDALS FROM SUPABASE
   ========================================================= */

async function fetchPedals(): Promise<CalibrationPedal[]> {
    const PAGE_SIZE = 500;
    const allPedals: CalibrationPedal[] = [];

    let from = 0;

    while (true) {
        const { data, error } = await supabase
            .from("pedals")
            .select("*")
            .order("brand", { ascending: true })
            .order("name", { ascending: true })
            .order("id", { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        if (!data?.length) break;

        const rows: CalibrationPedal[] = data.map(row => ({
            id: row.id,
            brand: row.brand,
            name: row.name,
            width: Number(row.width),
            depth: Number(row.depth),
            image: row.image ?? null,
            image_url: row.image_url ?? null,
            photo: row.photo ?? null,
            connectors: row.connectors ?? null,
            connectors_verified: Boolean(
                row.connectors_verified
            ),
        }));

        allPedals.push(...rows);

        if (data.length < PAGE_SIZE) break;

        from += PAGE_SIZE;
    }

    return allPedals;
}

/* =========================================================
   ADMIN PAGE
   ========================================================= */

export default function ConnectorsAdminPage() {
    const [pedals, setPedals] =
        useState<CalibrationPedal[]>([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] =
        useState<string | null>(null);

    /* =========================================================
       LOAD LIBRARY
       ========================================================= */

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") {
            return;
        }

        let cancelled = false;

        async function loadPedals() {
            try {
                const rows = await fetchPedals();

                if (cancelled) return;

                setPedals(rows);
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "[Connectors] Failed to load pedals:",
                    err
                );

                setError(
                    err && typeof err === "object" &&
                        "message" in err
                        ? String(err.message)
                        : "Unable to load pedals."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadPedals();

        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       TEMPORARY LOCAL SAVE
       ========================================================= */


    async function saveMultipleConnectors(
        ids: (string | number)[],
        connectors: PedalConnector[],
        verified: boolean
    ): Promise<void> {
        const response = await fetch("/api/connectors", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ids,
                connectors,
                verified,
            }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Unable to save connectors."
            );
        }

        if (result.count !== new Set(ids).size) {
            throw new Error(
                "Unexpected number of updated pedals. Reload the page before retrying."
            );
        }

        setPedals(previous =>
            previous.map(pedal => {
                const updated = result.pedals.find(
                    (row: { id: string | number }) =>
                        row.id === pedal.id
                );

                return updated
                    ? {
                        ...pedal,
                        connectors: updated.connectors,
                        connectors_verified:
                            updated.connectors_verified,
                    }
                    : pedal;
            })
        );
    }

    async function saveConnectors(
        id: string | number,
        connectors: PedalConnector[],
        verified: boolean
    ): Promise<void> {
        await saveMultipleConnectors(
            [id],
            connectors,
            verified
        );
    }


    /* =========================================================
       LOCAL DEVELOPMENT ONLY
       ========================================================= */

    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    /* =========================================================
       LOADING
       ========================================================= */

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">
                Loading pedals...
            </div>
        );
    }

    /* =========================================================
       ERROR
       ========================================================= */

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-900 text-white">
                <p>Unable to load pedal library.</p>

                <p className="text-sm text-red-400">
                    {error}
                </p>

                <button
                    className="rounded-lg bg-zinc-700 px-4 py-2"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    /* =========================================================
       EDITOR
       ========================================================= */

    return (
        <JackPositionEditor
            pedals={pedals}
            onSave={saveConnectors}
            onSaveMultiple={saveMultipleConnectors}
        />
    );
}
