
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AnyRow } from "@/types/project";

export type CatalogStatus = "loading" | "ready" | "error";

type NormalizedErr = {
  message: string;
  meta?: Record<string, unknown>;
};

type GearTable = "pedals" | "boards" | "power";

function normalizeSupabaseError(err: unknown): NormalizedErr {
  if (err instanceof Error) {
    return {
      message: err.message || "Unknown error",
      meta: { name: err.name, stack: err.stack },
    };
  }

  if (typeof err === "string") {
    return { message: err };
  }

  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;

    return {
      message: String(
        e.message ??
        e.error_description ??
        e.msg ??
        "Unknown error (object)"
      ),
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

async function fetchTable(
  table: GearTable,
  orderCols: string[] = []
): Promise<AnyRow[]> {
  const PAGE_SIZE = 100;
  const allRows: AnyRow[] = [];
  let from = 0;
  let useOrdering = orderCols.length > 0;

  while (true) {
    let query = supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (useOrdering) {
      for (const col of orderCols) {
        query = query.order(col, { ascending: true });
      }
    }

    let { data, error } = await query;

    if (error && useOrdering) {
      const message = String(error.message ?? "").toLowerCase();

      if (
        message.includes("column") &&
        message.includes("does not exist")
      ) {
        useOrdering = false;

        const retry = await supabase
          .from(table)
          .select("*")
          .range(from, from + PAGE_SIZE - 1);

        data = retry.data;
        error = retry.error;
      }
    }

    if (error) throw error;
    if (!data?.length) break;

    allRows.push(...data);

    if (data.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return allRows;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function fetchRecentTable(
  table: GearTable
): Promise<AnyRow[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() - 30);

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .gte("year", formatDate(limitDate))
    .lte("year", formatDate(today))
    .order("year", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export function useLibrary() {
  const [pedalsLibrary, setPedalsLibrary] =
    useState<AnyRow[]>([]);

  const [boardsLibrary, setBoardsLibrary] =
    useState<AnyRow[]>([]);

  const [powerLibrary, setPowerLibrary] =
    useState<AnyRow[]>([]);

  const [boardsStatus, setBoardsStatus] =
    useState<CatalogStatus>("loading");

  const [powerStatus, setPowerStatus] =
    useState<CatalogStatus>("loading");

  const [newPedals, setNewPedals] =
    useState<AnyRow[]>([]);

  const [newBoards, setNewBoards] =
    useState<AnyRow[]>([]);

  const [newPower, setNewPower] =
    useState<AnyRow[]>([]);

  const [newPedalsLoading, setNewPedalsLoading] =
    useState(true);

  const [newGearLoading, setNewGearLoading] =
    useState(true);

  const [libraryError, setLibraryError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    // Load recent products from all three categories first.
    // Each request is independent: one failure does not
    // prevent the other categories from being displayed.

    const recentRequests = [
      fetchRecentTable("pedals"),
      fetchRecentTable("boards"),
      fetchRecentTable("power"),
    ] as const;

    void Promise.allSettled(recentRequests)
      .then((results) => {
        if (cancelled) return;

        const [pedalsResult, boardsResult, powerResult] =
          results;

        if (pedalsResult.status === "fulfilled") {
          setNewPedals(pedalsResult.value);
        } else {
          console.error(
            "[Supabase] Failed to load new pedals:",
            pedalsResult.reason
          );
        }

        if (boardsResult.status === "fulfilled") {
          setNewBoards(boardsResult.value);
        } else {
          console.error(
            "[Supabase] Failed to load new boards:",
            boardsResult.reason
          );
        }

        if (powerResult.status === "fulfilled") {
          setNewPower(powerResult.value);
        } else {
          console.error(
            "[Supabase] Failed to load new power supplies:",
            powerResult.reason
          );
        }
      })
      .finally(() => {
        if (cancelled) return;

        setNewPedalsLoading(false);
        setNewGearLoading(false);
      });

    // Full catalogs continue loading in parallel.

    async function loadCatalog(
      table: GearTable,
      setRows: (rows: AnyRow[]) => void,
      settle: (error: string | null) => void
    ) {
      try {
        const rows = await fetchTable(table, [
          "brand",
          "name",
        ]);

        if (cancelled) return;

        setRows(rows);
        settle(null);
      } catch (err) {
        if (cancelled) return;

        const { message, meta } =
          normalizeSupabaseError(err);

        console.error(
          `[Supabase] Failed to load ${table}:`,
          message,
          meta,
          err
        );

        settle(message || "Failed to load library");
      }
    }

    void loadCatalog(
      "pedals",
      setPedalsLibrary,
      (error) => {
        setLibraryError(error);
        setLoading(false);
      }
    );

    void loadCatalog(
      "boards",
      setBoardsLibrary,
      (error) => {
        setBoardsStatus(
          error ? "error" : "ready"
        );
      }
    );

    void loadCatalog(
      "power",
      setPowerLibrary,
      (error) => {
        setPowerStatus(
          error ? "error" : "ready"
        );
      }
    );

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
    newBoards,
    newPower,

    newPedalsLoading,
    newGearLoading,

    libraryError,
    loading,
  };
}
