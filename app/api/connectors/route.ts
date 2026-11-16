
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseConnectors } from "@/utils/connectors";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
            { error: "Not found." },
            { status: 404 }
        );
    }

    const allowedOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ];

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (
        !origin ||
        !allowedOrigins.includes(origin) ||
        !["localhost:3000", "127.0.0.1:3000"].includes(
            host ?? ""
        ) ||
        request.headers.get("sec-fetch-site") !== "same-origin"
    ) {
        return NextResponse.json(
            { error: "Access denied." },
            { status: 403 }
        );
    }

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { error: "Missing Supabase configuration." },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();

        if (!body || typeof body !== "object") {
            return NextResponse.json(
                { error: "Invalid request." },
                { status: 400 }
            );
        }

        const { id, ids, connectors, verified } = body;

        const requestedIds = Array.isArray(ids)
            ? ids
            : [id];

        const validIds =
            requestedIds.length > 0 &&
            requestedIds.length <= 100 &&
            requestedIds.every(
                value =>
                    (
                        typeof value === "string" &&
                        value.trim().length > 0
                    ) ||
                    (
                        typeof value === "number" &&
                        Number.isSafeInteger(value)
                    )
            );

        if (!validIds) {
            return NextResponse.json(
                { error: "Invalid pedal IDs." },
                { status: 400 }
            );
        }

        const uniqueIds = Array.from(new Set(requestedIds));

        const parsedConnectors = parseConnectors(connectors);

        if (
            parsedConnectors === null ||
            parsedConnectors.length > 100
        ) {
            return NextResponse.json(
                { error: "Invalid connectors data." },
                { status: 400 }
            );
        }

        if (typeof verified !== "boolean") {
            return NextResponse.json(
                { error: "Invalid verification status." },
                { status: 400 }
            );
        }

        const supabase = createClient(
            supabaseUrl,
            supabaseKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                },
            }
        );

        const { data: existing, error: lookupError } =
            await supabase
                .from("pedals")
                .select("id")
                .in("id", uniqueIds);

        if (lookupError || existing?.length !== uniqueIds.length) {
            return NextResponse.json(
                { error: "One or more pedals could not be found." },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("pedals")
            .update({
                connectors: parsedConnectors,
                connectors_verified: verified,
            })
            .in("id", uniqueIds)
            .select("id, connectors, connectors_verified");

        if (error) {
            console.error("[Connectors API]", error);

            return NextResponse.json(
                { error: "Unable to update pedals." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: data?.length ?? 0,
            pedal: data?.[0] ?? null,
            pedals: data ?? [],
        });
    } catch (error) {
        console.error("[Connectors API]", error);

        return NextResponse.json(
            { error: "Unable to save connectors." },
            { status: 500 }
        );
    }
}
