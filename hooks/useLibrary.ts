// hooks/useLibrary.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AnyRow } from "@/types/project";

type NormalizedErr = {
  message: string;
  meta?: Record<string, unknown>;
};

function normalizeSupabaseError(err: unknown): NormalizedErr {
  // Error classique (TypeError, Error, etc.)
  if (err instanceof Error) {
    return {
      message: err.message || "Unknown error",
      meta: { name: err.name, stack: err.stack },
    };
  }

  // string
  if (typeof err === "string") return { message: err };

  // objets (PostgrestError, AuthError, etc.)
  if (err && typeof err === "object") {
    const e = err as any;
    const message =
      e.message ??
      e.error_description ??
      e.msg ??
      "Unknown error (object)";

    return {
      message: String(message),
      meta: {
        code: e.code,
        details: e.details,
        hint: e.hint,
        status: e.status,
      },
    };
  }

  return { message: "Unknown error" };
}

async function fetchTable(table: string, orderCols: string[] = []) {
  let q = supabase.from(table).select("*");

  for (const col of orderCols) {
    q = q.order(col, { ascending: true });
  }

  const { data, error } = await q;

  if (!error) return (data ?? []) as AnyRow[];

  // Si l'erreur vient d'un tri sur colonne inexistante, on retente sans order()
  const msg = String((error as any)?.message ?? "").toLowerCase();
  if (msg.includes("column") && msg.includes("does not exist")) {
    const retry = await supabase.from(table).select("*");
    if (retry.error) throw retry.error;
    return (retry.data ?? []) as AnyRow[];
  }

  throw error;
}

export function useLibrary() {
  const [pedalsLibrary, setPedalsLibrary] = useState<AnyRow[]>([]);
  const [boardsLibrary, setBoardsLibrary] = useState<AnyRow[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLibraryError(null);

        // ✅ adapte les noms de tables si besoin
        const [pedals, boards] = await Promise.all([
          fetchTable("pedals", ["brand", "name"]),
          fetchTable("boards", ["brand", "name"]),
        ]);

        if (cancelled) return;
        setPedalsLibrary(pedals);
        setBoardsLibrary(boards);
      } catch (err) {
        if (cancelled) return;

        const n = normalizeSupabaseError(err);
        console.error("[Supabase] useLibrary failed:", n.message, n.meta, err);
        setLibraryError(n.message || "Failed to load library");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { pedalsLibrary, boardsLibrary, libraryError, loading };
}
