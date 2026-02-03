"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AnyRow = Record<string, any>;

async function fetchAllRows(tableName: string) {
  const pageSize = 1000;
  let from = 0;
  let all: AnyRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;

    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;

    from += pageSize;
  }

  return all;
}

export function useLibrary() {
  const [pedalsLibrary, setPedalsLibrary] = useState<AnyRow[]>([]);
  const [boardsLibrary, setBoardsLibrary] = useState<AnyRow[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoadingLibrary(true);
        setLibraryError(null);

        const [pData, bData] = await Promise.all([
          fetchAllRows("pedals"),
          fetchAllRows("boards"),
        ]);

        if (cancelled) return;

        setPedalsLibrary(pData || []);
        setBoardsLibrary(bData || []);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Supabase Error:", err);
        setLibraryError(err?.message || "Failed to load library");
      } finally {
        if (cancelled) return;
        setLoadingLibrary(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { pedalsLibrary, boardsLibrary, loadingLibrary, libraryError };
}
