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
  const PAGE_SIZE = 100;
  let allRows: AnyRow[] = [];
  let from = 0;

  while (true) {
    let q = supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    for (const col of orderCols) {
      q = q.order(col, { ascending: true });
    }

    const { data, error } = await q;

    if (error) {
      const msg = String((error as any)?.message ?? "").toLowerCase();
      if (msg.includes("column") && msg.includes("does not exist")) {
        const retry = await supabase
          .from(table)
          .select("*")
          .range(from, from + PAGE_SIZE - 1);

        if (retry.error) throw retry.error;
        if (!retry.data || retry.data.length === 0) break;

        allRows.push(...retry.data);
        if (retry.data.length < PAGE_SIZE) break;

        from += PAGE_SIZE;
        continue;
      }

      throw error;
    }

    if (!data || data.length === 0) break;

    allRows.push(...data);

    if (data.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return allRows;
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
