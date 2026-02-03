"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Zap, Weight, Trash2, Plus, Edit2, X, Star, Square, ChevronDown, ArrowLeft, ExternalLink, Check, RotateCw, ShoppingCart, History, Minus } from 'lucide-react';
import { Stage, Layer, Rect, Group, Line, Circle, Path, Text, Image as KonvaImage } from 'react-konva';
import Sidebar from "@/components/Sidebar";
import PedalImage from "@/components/PedalImage";
import { useLibrary } from "@/hooks/useLibrary";
import TopBarTabs from "@/components/TopBarTabs";
import BoardCanvas from "@/components/BoardCanvas";


const ZOOM_FACTOR = 1.5;
const MAX_PROJECTS = 8;
const STORAGE_KEY = "guitar-sandbox-data";


export default function PedalBoardApp() {
  const { pedalsLibrary, boardsLibrary, loadingLibrary, libraryError } = useLibrary();
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [workingBoard, setWorkingBoard] = useState({ boardPedals: [], selectedBoards: [], zoom: 100 });
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [tempName, setTempName] = useState("");
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [selectedBoardInstanceId, setSelectedBoardInstanceId] = useState(null);
  const [pedalSearch, setPedalSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showPedalResults, setShowPedalResults] = useState(false);
  const [showBoardResults, setShowBoardResults] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredBoardId, setHoveredBoardId] = useState(null);
  const [displaySizes, setDisplaySizes] = useState({});
  const [hydrated, setHydrated] = useState(false);

  
  const BACKGROUNDS = [
  { id: "neutral", label: "Neutral", type: "css" },
  { id: "wood", label: "Wood", type: "image", src: "/backgrounds/wood.webp" },
  { id: "marble", label: "Marble", type: "image", src: "/backgrounds/marble.webp" },
];

const [canvasBg, setCanvasBg] = useState("neutral");




  const [customType, setCustomType] = useState('pedal');
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customDepth, setCustomDepth] = useState('');
  const [customColor, setCustomColor] = useState('#3b82f6');

  const pedalSearchRef = useRef(null);
  const boardSearchRef = useRef(null);


  useEffect(() => {
    const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const activeProject = projects.find(p => p.id === activeProjectId) || workingBoard;
        const currentZoom = activeProject.zoom || 100;
        const delta = e.deltaY > 0 ? -5 : 5;
        const newZoom = Math.min(Math.max(currentZoom + delta, 25), 200);
        updateActiveProject({ zoom: newZoom });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeProjectId, projects, workingBoard]);

  useEffect(() => {
    const updateSize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', updateSize);
    updateSize();
    
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setProjects(parsed.projects || []);
      setActiveProjectId(parsed.activeProjectId || null);
      setWorkingBoard(parsed.workingBoard || { boardPedals: [], selectedBoards: [], zoom: 100 });
    }
    setHydrated(true);

    return () => { window.removeEventListener('resize', updateSize); };
  }, []);

  useEffect(() => {
  if (!hydrated) return;
  if (dimensions.width === 0) return;

  const dataToSave = JSON.stringify({ projects, activeProjectId, workingBoard });
  localStorage.setItem(STORAGE_KEY, dataToSave);
}, [hydrated, projects, activeProjectId, workingBoard, dimensions.width]);


  const closeSearchMenus = () => {
    setShowPedalResults(false);
    setShowBoardResults(false);
    setPedalSearch("");
    setBoardSearch("");
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || workingBoard;
  const currentZoom = activeProject.zoom || 100;

  const selectedPedal = activeProject.boardPedals.find(p => p.instanceId === selectedInstanceId);
  const selectedBoardDetails = activeProject.selectedBoards?.find(b => b.instanceId === selectedBoardInstanceId);

  const totalDraw = activeProject.boardPedals.reduce((sum, p) => sum + (Number(p.draw) || 0), 0);
  const totalWeight = activeProject.boardPedals.reduce((sum, p) => sum + (Number(p.weight) || 0), 0) + 
                     (activeProject.selectedBoards?.reduce((sum, b) => sum + (Number(b.weight) || 0), 0) || 0);

  const getDragBounds = (id, rotation, pos) => {
    const size = displaySizes[id];
    if (!size) return pos;
    const isVertical = (rotation / 90) % 2 !== 0;
    const w = (isVertical ? size.h : size.w) * (currentZoom / 100);
    const h = (isVertical ? size.w : size.h) * (currentZoom / 100);
    const stageW = (dimensions.width - 320);
    const stageH = (dimensions.height - 56);
    return { x: Math.max(w / 2, Math.min(stageW - w / 2, pos.x)), y: Math.max(h / 2, Math.min(stageH - h / 2, pos.y)) };
  };

  const getSelectedOutline = (item: any) => {
    const size = displaySizes[item.instanceId];
    if (!size) return null;

    const rot = item.rotation || 0;
    const isVertical = (rot / 90) % 2 !== 0;

    // size.w/h sont déjà en "pixels Konva" (ZOOM_FACTOR appliqué dans PedalImage via onSizeReady)
    const w = isVertical ? size.h : size.w;
    const h = isVertical ? size.w : size.h;

    return { w, h };
  };

  const resetCanvas = () => {
    if (window.confirm("Are you sure you want to clear the entire board?")) {
      updateActiveProject({ boardPedals: [], selectedBoards: [] });
      setSelectedInstanceId(null);
      setSelectedBoardInstanceId(null);
    }
  };

  const createNewProject = () => {
    if (projects.length >= MAX_PROJECTS) return;
    const newId = Date.now();
    const newProject = { id: newId, name: `BOARD ${projects.length + 1}`, boardPedals: [], selectedBoards: [], zoom: 100 };
    setProjects([...projects, newProject]);
    setActiveProjectId(newId);
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (newProjects.length === 0) {
      setActiveProjectId(null);
      setWorkingBoard({ boardPedals: [], selectedBoards: [], zoom: 100 });
    } else if (activeProjectId === id) {
      setActiveProjectId(newProjects[0].id);
    }
  };

  const startEditing = (project, e) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setTempName(project.name);
  };

  const saveName = () => {
    setProjects(projects.map(p => p.id === editingProjectId ? { ...p, name: tempName.toUpperCase() } : p));
    setEditingProjectId(null);
  };

  const updateActiveProject = (updates) => {
    if (activeProjectId) {
      setProjects(projects.map(p => p.id === activeProjectId ? { ...p, ...updates } : p));
    } else {
      setWorkingBoard(prev => ({ ...prev, ...updates }));
    }
  };

  const addPedal = (pedal) => {
    const newPedal = { ...pedal, instanceId: Date.now(), x: (dimensions.width - 320) / 2, y: (dimensions.height - 56) / 2, rotation: 0 };
    updateActiveProject({ boardPedals: [...activeProject.boardPedals, newPedal] });
    closeSearchMenus();
  };

  const selectBoard = (board) => {
    const newBoard = { ...board, instanceId: Date.now(), x: (dimensions.width - 320) / 2, y: (dimensions.height - 56) / 2, rotation: 0 };
    updateActiveProject({ selectedBoards: [...(activeProject.selectedBoards || []), newBoard] });
    closeSearchMenus();
  };

  const addCustomItem = () => {
    if (!customWidth || !customDepth) return;
    const item = {
      instanceId: Date.now(),
      name: customName || `Custom ${customType}`,
      brand: "Custom",
      width: parseFloat(customWidth),
      depth: parseFloat(customDepth),
      color: customColor,
      x: (dimensions.width - 320) / 2,
      y: (dimensions.height - 56) / 2,
      rotation: 0,
      draw: 0,
      weight: 0
    };
    if (customType === 'pedal') {
      updateActiveProject({ boardPedals: [...activeProject.boardPedals, item] });
    } else {
      updateActiveProject({ selectedBoards: [...(activeProject.selectedBoards || []), item] });
    }
    setCustomWidth(''); setCustomDepth(''); setCustomName('');
  };

  const handleSizeUpdate = (id, w, h) => { 
    setDisplaySizes(prev => {
        if (prev[id]?.w === w && prev[id]?.h === h) return prev;
        return { ...prev, [id]: { w, h } };
    }); 
  };
  const rotatePedal = (id) => { updateActiveProject({ boardPedals: activeProject.boardPedals.map(p => p.instanceId === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p) }); };
  const deletePedal = (id) => { updateActiveProject({ boardPedals: activeProject.boardPedals.filter(p => p.instanceId !== id) }); setSelectedInstanceId(null); };
  const rotateBoard = (id) => { updateActiveProject({ selectedBoards: activeProject.selectedBoards.map(b => b.instanceId === id ? { ...b, rotation: (b.rotation + 90) % 360 } : b) }); };
  const deleteBoard = (id) => { updateActiveProject({ selectedBoards: activeProject.selectedBoards.filter(b => b.instanceId !== id) }); setSelectedBoardInstanceId(null); };

  const groupItems = (items, filter) => {
    if (!items) return {};
    const searchTerms = filter.toLowerCase().trim();
    return items
      .filter(i => {
        const fullName = `${i.brand} ${i.name}`.toLowerCase();
        return fullName.includes(searchTerms);
      })
      .reduce((acc, item) => { 
        if (!acc[item.brand]) acc[item.brand] = []; 
        acc[item.brand].push(item); 
        return acc; 
      }, {});
  };

  const handleStageClick = (e) => { 
    if (e.target === e.target.getStage()) { setSelectedInstanceId(null); setSelectedBoardInstanceId(null); closeSearchMenus(); } 
  };

  const getDynamicBounds = (id, rotation) => {
    const size = displaySizes[id];
    if (!size) return { w: 0, h: 0 };
    const isVertical = (rotation / 90) % 2 !== 0;
    return { w: isVertical ? size.h : size.w, h: isVertical ? size.w : size.h };
  };

  if (dimensions.width === 0) return null;

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans fixed inset-0 select-none" onClick={closeSearchMenus}>
      {/* SIDEBAR */}
      <Sidebar
  pedalsLibrary={pedalsLibrary}
  boardsLibrary={boardsLibrary}
  showPedalResults={showPedalResults}
  setShowPedalResults={setShowPedalResults}
  showBoardResults={showBoardResults}
  setShowBoardResults={setShowBoardResults}
  pedalSearch={pedalSearch}
  setPedalSearch={setPedalSearch}
  boardSearch={boardSearch}
  setBoardSearch={setBoardSearch}
  selectedPedal={selectedPedal}
  selectedBoardDetails={selectedBoardDetails}
  selectedInstanceId={selectedInstanceId}
  selectedBoardInstanceId={selectedBoardInstanceId}
  setSelectedInstanceId={setSelectedInstanceId}
  setSelectedBoardInstanceId={setSelectedBoardInstanceId}
  customType={customType}
  setCustomType={setCustomType}
  customName={customName}
  setCustomName={setCustomName}
  customWidth={customWidth}
  setCustomWidth={setCustomWidth}
  customDepth={customDepth}
  setCustomDepth={setCustomDepth}
  customColor={customColor}
  setCustomColor={setCustomColor}
  addPedal={addPedal}
  selectBoard={selectBoard}
  addCustomItem={addCustomItem}
  resetCanvas={resetCanvas}
  rotatePedal={rotatePedal}
  deletePedal={deletePedal}
/>


            {/* BOARD AREA */}
      <div className="flex-1 relative bg-[#2c2c2e] bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,transparent_50%,rgba(0,0,0,0.1)_100%)] flex flex-col">
        
        <TopBarTabs
          projects={projects}
          setProjects={setProjects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          editingProjectId={editingProjectId}
          tempName={tempName}
          setTempName={setTempName}
          startEditing={startEditing}
          saveName={saveName}
          deleteProject={deleteProject}
          createNewProject={createNewProject}
        />

        <BoardCanvas
          dimensions={dimensions}
          activeProject={activeProject}
          selectedInstanceId={selectedInstanceId}
          setSelectedInstanceId={setSelectedInstanceId}
          selectedBoardInstanceId={selectedBoardInstanceId}
          setSelectedBoardInstanceId={setSelectedBoardInstanceId}
          displaySizes={displaySizes}
          handleSizeUpdate={handleSizeUpdate}
          updateActiveProject={updateActiveProject}
          getDragBounds={getDragBounds}
          closeSearchMenus={closeSearchMenus}
          BACKGROUNDS={BACKGROUNDS}
          canvasBg={canvasBg}
          setCanvasBg={setCanvasBg}
        />
        
      </div>
    </div>
  );
}
