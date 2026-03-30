"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BoardCanvas from "@/components/BoardCanvas";

type SharedBoardData = {
  name?: string;
  pedals?: any[];
  boards?: any[];
};

export default function SharedBoardPage() {
  const params = useParams();
  const id = params?.id as string;

  const [board, setBoard] = useState<SharedBoardData | null>(null);

  // ✅ FIX HOOK POSITION (IMPORTANT)
  const [viewerProject, setViewerProject] = useState({
    name: "Shared Board",
    boardPedals: [],
    selectedBoards: [],
    zoom: 100,
    stageX: 0,
    stageY: 0,
  });

  useEffect(() => {
    if (!id) return;

    const fetchBoard = async () => {
      const { data, error } = await supabase
        .from("shared_boards")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(error);
        return;
      }

      const raw = data.data;

      const newBoard = {
        name: data.name,
        pedals: raw?.pedals || [],
        boards: raw?.boards || [],
      };

      setBoard(newBoard);

      // ================== 🔥 CENTERING FIX ==================

      const allItems = [
        ...(newBoard.pedals || []),
        ...(newBoard.boards || []),
      ];

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      allItems.forEach((p: any) => {
        const w = Number(p.width) || 80;
        const h = Number(p.depth) || 120;

        minX = Math.min(minX, p.x - w / 2);
        minY = Math.min(minY, p.y - h / 2);
        maxX = Math.max(maxX, p.x + w / 2);
        maxY = Math.max(maxY, p.y + h / 2);
      });

      const boardCenterX = (minX + maxX) / 2;
      const boardCenterY = (minY + maxY) / 2;

      const screenCenterX =
        typeof window !== "undefined" ? window.innerWidth / 2 : 0;

      const screenCenterY =
        typeof window !== "undefined" ? window.innerHeight / 2 : 0;

      const offsetX = screenCenterX - boardCenterX;
      const offsetY = screenCenterY - boardCenterY;

      const centeredPedals = (newBoard.pedals || []).map((p: any) => ({
        ...p,
        x: p.x + offsetX,
        y: p.y + offsetY,
      }));

      const centeredBoards = (newBoard.boards || []).map((b: any) => ({
        ...b,
        x: b.x + offsetX,
        y: b.y + offsetY,
      }));

      // ✅ UPDATE STATE UNE SEULE FOIS
      setViewerProject({
        name: newBoard.name || "Shared Board",
        boardPedals: centeredPedals,
        selectedBoards: centeredBoards,
        zoom: 100,
        stageX: 0,
        stageY: 0,
      });
    };

    fetchBoard();
  }, [id]);

  if (!board) {
    return (
      <div className="h-screen flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    );
  }

  const Canvas = BoardCanvas as any;

  return (
    <div className="h-screen w-full">
      <Canvas
        viewer
        activeProject={viewerProject}
        displaySizes={{}}
        handleSizeUpdate={() => {}}
        updateActiveProject={(updates: any) =>
          setViewerProject((prev) => ({ ...prev, ...updates }))
        }
        setMobileSidebarOpen={() => {}}
        setSpecsOpen={() => {}}
        setSelectedInstanceId={() => {}}
        setSelectedBoardInstanceId={() => {}}
        deletePedal={() => {}}
        rotatePedal={() => {}}
        deleteBoard={() => {}}
        rotateBoard={() => {}}
        closeSearchMenus={() => {}}
        setContactOpen={() => {}}
        selectedInstanceId={null}
        selectedBoardInstanceId={null}
        BACKGROUNDS={[]}
        canvasBg="neutral"
        units="metric"
        language="en"
      />
    </div>
  );
}