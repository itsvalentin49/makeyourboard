"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AnyRow } from "@/types/project";

export type CatalogStatus = "loading" | "ready" | "error";

type NormalizedErr = {
  message: string;
  meta?: Record<string, unknown>;
};

function normalizeSupabaseError(err: unknown): NormalizedErr {
  if (err instanceof Error) {
    return {
      message: err.message || "Unknown error",
      meta: { name: err.name, stack: err.stack },
    };
  }

  if (typeof err === "string") return { message: err };

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

async function fetchNewPedals(): Promise<AnyRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() - 30);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const { data, error } = await supabase
    .from("pedals")
    .select("*")
    .gte("year", formatDate(limitDate))
    .lte("year", formatDate(today))
    .order("year", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export function useLibrary() {
  const [pedalsLibrary, setPedalsLibrary] = useState<AnyRow[]>([]);
  const [boardsLibrary, setBoardsLibrary] = useState<AnyRow[]>([]);
  const [powerLibrary, setPowerLibrary] = useState<AnyRow[]>([]);
  const [boardsStatus, setBoardsStatus] = useState<CatalogStatus>("loading");
  const [powerStatus, setPowerStatus] = useState<CatalogStatus>("loading");
  const [newPedals, setNewPedals] = useState<AnyRow[]>([]);
  const [newPedalsLoading, setNewPedalsLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    fetchNewPedals()
      .then((pedals) => {
        if (!cancelled) {
          setNewPedals(pedals);
        }
      })
      .catch((err) => {
        console.error("[Supabase] Failed to load new pedals:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setNewPedalsLoading(false);
        }
      });

    async function loadCatalog(
      table: "pedals" | "boards" | "power",
      setRows: (rows: AnyRow[]) => void,
      settle: (error: string | null) => void,
    ) {
      try {
        const rows = await fetchTable(table, ["brand", "name"]);
        if (cancelled) return;
        setRows(rows);
        settle(null);
      } catch (err) {
        if (cancelled) return;
        const { message, meta } = normalizeSupabaseError(err);
        console.error(`[Supabase] Failed to load ${table}:`, message, meta, err);
        settle(message || "Failed to load library");
      }
    }

    void loadCatalog("pedals", setPedalsLibrary, (error) => {
      setLibraryError(error);
      setLoading(false);
    });
    void loadCatalog("boards", setBoardsLibrary, (error) => {
      setBoardsStatus(error ? "error" : "ready");
    });
    void loadCatalog("power", setPowerLibrary, (error) => {
      setPowerStatus(error ? "error" : "ready");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    pedalsLibrary,
    boardsLibrary,
    powerLibrary,
    boardsStatus,
    powerStatus,
    newPedals,
    newPedalsLoading,
    libraryError,
    loading,
  };
}