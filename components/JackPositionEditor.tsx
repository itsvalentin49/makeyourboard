
"use client";

import { useState, useRef, useEffect } from "react";
import type { PointerEvent } from "react";

import {
    Plus,
    Trash2,
    Copy,
    ClipboardPaste,
    ChevronLeft,
    ChevronRight,
    Save,
    Cable,
    Search,
    Sun,
    Moon,
    Layers,
    Check,
    X,
} from "lucide-react";

import {
    CONNECTOR_TYPES,
    CONNECTOR_FORMATS,
    CONNECTOR_LABELS,
    createConnector,
    getConnectorPoint,
    getConnectorColor,
    getConnectorLabel,
    getDefaultConnectorFormat,
    parseConnectors,
} from "@/utils/connectors";

import type {
    PedalConnector,
    ConnectorType,
    ConnectorFormat,
    ConnectorSide,
    ConnectorChannel,
} from "@/utils/connectors";

import styles from "./JackPositionEditor.module.css";

/* =========================================================
   TYPES
   ========================================================= */

export type CalibrationPedal = {
    id: string | number;
    brand: string;
    name: string;
    width: number;
    depth: number;
    image?: string | null;
    image_url?: string | null;
    photo?: string | null;
    connectors?: unknown;
    connectors_verified?: boolean;
};

type Props = {
    pedals: CalibrationPedal[];

    onSave: (
        id: string | number,
        connectors: PedalConnector[],
        verified: boolean
    ) => Promise<void>;

    onSaveMultiple: (
        ids: (string | number)[],
        connectors: PedalConnector[],
        verified: boolean
    ) => Promise<void>;
};

type Filter =
    | "all"
    | "unverified"
    | "verified";

/* =========================================================
   CALIBRATION STATUS
   ========================================================= */

function getStatus(pedal: CalibrationPedal) {
    return pedal.connectors_verified === true &&
        parseConnectors(pedal.connectors) !== null
        ? "verified"
        : "unverified";
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function JackPositionEditor({
    pedals,
    onSave,
    onSaveMultiple,
}: Props) {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    const [selectedPedal, setSelectedPedal] =
        useState<CalibrationPedal | null>(null);

    const [connectors, setConnectors] =
        useState<PedalConnector[]>([]);

    const [activeId, setActiveId] =
        useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [linkInOut, setLinkInOut] = useState(false);
    const [message, setMessage] = useState("");
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [pasteFeedback, setPasteFeedback] = useState(false);

    useEffect(() => {
        if (!copyFeedback) return;

        const timer = window.setTimeout(
            () => setCopyFeedback(false),
            1500
        );

        return () => window.clearTimeout(timer);
    }, [copyFeedback]);

    useEffect(() => {
        if (!pasteFeedback) return;

        const timer = window.setTimeout(
            () => setPasteFeedback(false),
            1500
        );

        return () => window.clearTimeout(timer);
    }, [pasteFeedback]);

    const [darkMode, setDarkMode] = useState(true);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkQuery, setBulkQuery] = useState("");
    const [bulkSameBrand, setBulkSameBrand] = useState(true);
    const [bulkSameSize, setBulkSameSize] = useState(true);

    const [bulkIds, setBulkIds] =
        useState<(string | number)[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(
            "myb-connectors-theme"
        );

        if (saved !== null) {
            setDarkMode(saved === "dark");
        }
    }, []);

    function toggleTheme() {
        const next = !darkMode;

        setDarkMode(next);

        localStorage.setItem(
            "myb-connectors-theme",
            next ? "dark" : "light"
        );
    }


    const [copiedConnectors, setCopiedConnectors] =
        useState<PedalConnector[] | null>(null);

    const previewRef = useRef<HTMLDivElement>(null);

    const draggingId = useRef<string | null>(null);

    /* =========================================================
       FILTERS
       ========================================================= */

    const filteredPedals = pedals.filter(pedal => {
        const searchable =
            `${pedal.brand} ${pedal.name}`.toLowerCase();

        const matchesQuery = searchable.includes(
            query.trim().toLowerCase()
        );

        const matchesFilter =
            filter === "all" || getStatus(pedal) === filter;

        return matchesQuery && matchesFilter;
    });

    const selectedIndex = filteredPedals.findIndex(
        pedal => pedal.id === selectedPedal?.id
    );

    const activeConnector = connectors.find(
        connector => connector.id === activeId
    );

    /* =========================================================
       SELECT PEDAL
       ========================================================= */

    function loadPedal(pedal: CalibrationPedal) {
        const data = parseConnectors(pedal.connectors) ?? [];

        setSelectedPedal(pedal);
        setConnectors(structuredClone(data));
        setActiveId(data[0]?.id ?? null);
        setDirty(false);
        setMessage("");
        setLinkInOut(false);
    }

    function selectPedal(pedal: CalibrationPedal) {
        if (saving) return;

        if (
            dirty &&
            !window.confirm("Discard unsaved changes?")
        ) {
            return;
        }

        loadPedal(pedal);
    }

    function navigate(direction: number) {
        const next = filteredPedals[selectedIndex + direction];

        if (next) {
            selectPedal(next);
        }
    }

    /* =========================================================
       UPDATE CONNECTOR
       ========================================================= */

    function updateConnector(
        id: string,
        changes: Partial<PedalConnector>
    ) {
        setConnectors(previous => {
            const current = previous.find(
                connector => connector.id === id
            );

            if (!current) return previous;

            const updated: PedalConnector = {
                ...current,
                ...changes,
            };

            if (
                changes.type !== undefined ||
                changes.channel !== undefined ||
                changes.loop !== undefined ||
                changes.alternateTypes !== undefined
            ) {
                updated.alternateTypes = [
                    ...new Set(updated.alternateTypes ?? []),
                ].filter(type =>
                    type !== updated.type &&
                    CONNECTOR_LABELS[type] !== CONNECTOR_LABELS[updated.type]
                );

                updated.label = getConnectorLabel(
                    updated.type,
                    updated.channel,
                    updated.loop,
                    updated.alternateTypes
                );
            }

            const inputs = previous.filter(
                connector => connector.type === "input"
            );

            const outputs = previous.filter(
                connector => connector.type === "output"
            );

            const linkedConnector =
                current.type === "input"
                    ? outputs[0]
                    : current.type === "output"
                        ? inputs[0]
                        : undefined;

            const canLink =
                linkInOut &&
                (
                    changes.position !== undefined ||
                    changes.side !== undefined
                ) &&
                updated.type === current.type &&
                updated.channel === "mono" &&
                linkedConnector?.channel === "mono" &&
                inputs.length === 1 &&
                outputs.length === 1;

            return previous.map(connector => {
                if (connector.id === id) {
                    return updated;
                }

                if (
                    canLink &&
                    linkedConnector &&
                    connector.id === linkedConnector.id
                ) {
                    // Mono : jacks latéraux opposés.
                    if (updated.side === "L" || updated.side === "R") {
                        return {
                            ...connector,
                            side: updated.side === "L" ? "R" as const : "L" as const,
                            position: updated.position,
                        };
                    }

                    // Top Mono : jacks symétriques.
                    if (updated.side === "Top" || updated.side === "Down") {
                        return {
                            ...connector,
                            side: updated.side,
                            position: Math.round(
                                (100 - updated.position) * 10
                            ) / 10,
                        };
                    }
                }

                return connector;
            });
        });

        setDirty(true);
    }

    /* =========================================================
       ADD CONNECTOR
       ========================================================= */

    function addConnector(
        type: ConnectorType = "input",
        side: ConnectorSide = "R",
        position = 50,
        channel: ConnectorChannel | null = null
    ) {
        const connector = createConnector(
            type,
            side,
            position,
            channel
        );

        setConnectors(previous => [
            ...previous,
            connector,
        ]);

        setActiveId(connector.id);
        setDirty(true);

    }

    /* =========================================================
       DELETE CONNECTOR
       ========================================================= */

    function deleteConnector(id: string) {
        setConnectors(previous =>
            previous.filter(connector => connector.id !== id)
        );

        if (activeId === id) {
            setActiveId(null);
        }

        setDirty(true);

    }


    /* =========================================================
       QUICK PRESETS
       ========================================================= */

    function applyPreset(
        preset: "mono" | "stereo" | "top" | "top_stereo"
    ) {
        let next: PedalConnector[] = [];

        switch (preset) {
            case "mono":
                next = [
                    createConnector("input", "R", 50, "mono"),
                    createConnector("output", "L", 50, "mono"),
                ];
                break;

            case "stereo":
                next = [
                    createConnector("input", "R", 65, "L"),
                    createConnector("input", "R", 35, "R"),
                    createConnector("output", "L", 65, "L"),
                    createConnector("output", "L", 35, "R"),
                ];
                break;

            case "top":
                next = [
                    createConnector("input", "Top", 80, "mono"),
                    createConnector("output", "Top", 20, "mono"),
                ];
                break;

            case "top_stereo":
                next = [
                    createConnector("output", "Top", 10, "R"),
                    createConnector("output", "Top", 30, "L"),
                    createConnector("power_input", "Top", 50, null),
                    createConnector("input", "Top", 70, "R"),
                    createConnector("input", "Top", 90, "L"),
                ];
                break;
        }

        if (preset !== "top_stereo") {
            next.push(
                createConnector("power_input", "Top", 50, null)
            );
        }

        setLinkInOut(preset === "mono");

        setConnectors(next);
        setActiveId(next[0]?.id ?? null);
        setDirty(true);
    }

    /* =========================================================
       POINTER POSITION
       ========================================================= */

    function getPointerPosition(
        clientX: number,
        clientY: number
    ): {
        side: ConnectorSide;
        position: number;
    } | null {
        const element = previewRef.current;

        if (!element) return null;

        const rect = element.getBoundingClientRect();

        if (!rect.width || !rect.height) return null;

        const x = Math.max(
            0,
            Math.min(1, (clientX - rect.left) / rect.width)
        );

        const y = Math.max(
            0,
            Math.min(1, (clientY - rect.top) / rect.height)
        );

        const distances: {
            side: ConnectorSide;
            distance: number;
        }[] = [
                { side: "L", distance: x * rect.width },
                { side: "R", distance: (1 - x) * rect.width },
                { side: "Top", distance: y * rect.height },
                { side: "Down", distance: (1 - y) * rect.height },
            ];

        distances.sort((a, b) => a.distance - b.distance);

        const side = distances[0].side;

        const position =
            side === "L" || side === "R" ? y : x;

        return {
            side,
            position: Math.round(position * 1000) / 10,
        };
    }

    /* =========================================================
       PLACE CONNECTOR
       ========================================================= */

    function handlePreviewPointerDown(
        event: PointerEvent<HTMLDivElement>
    ) {
        if (!activeId || saving) return;

        const point = getPointerPosition(
            event.clientX,
            event.clientY
        );

        if (!point) return;

        updateConnector(activeId, point);
    }

    /* =========================================================
       DRAG CONNECTOR
       ========================================================= */

    function handleDragStart(
        event: PointerEvent<HTMLButtonElement>,
        id: string
    ) {
        if (saving) return;

        event.stopPropagation();

        setActiveId(id);
        draggingId.current = id;

        event.currentTarget.setPointerCapture(
            event.pointerId
        );
    }

    function handleDragMove(
        event: PointerEvent<HTMLButtonElement>
    ) {
        if (!draggingId.current || saving) return;

        const point = getPointerPosition(
            event.clientX,
            event.clientY
        );

        if (point) {
            updateConnector(draggingId.current, point);
        }
    }

    function handleDragEnd(
        event: PointerEvent<HTMLButtonElement>
    ) {
        draggingId.current = null;

        if (
            event.currentTarget.hasPointerCapture(
                event.pointerId
            )
        ) {
            event.currentTarget.releasePointerCapture(
                event.pointerId
            );
        }
    }

    /* =========================================================
       COPY / PASTE
       ========================================================= */

    async function copyConnectors() {
        setCopiedConnectors(
            structuredClone(connectors)
        );

        setMessage("");

        try {
            await navigator.clipboard.writeText(
                JSON.stringify(connectors, null, 2)
            );
        } catch {
            // Internal clipboard fallback
        }

        setCopyFeedback(true);
    }

    async function pasteConnectors() {
        if (saving) return;

        let data = copiedConnectors;

        try {
            const text = await navigator.clipboard.readText();

            data = parseConnectors(text) ?? data;
        } catch {
            // Internal clipboard fallback
        }

        if (data === null) {
            setMessage("No valid connectors to paste.");
            return;
        }

        if (
            connectors.length > 0 &&
            !window.confirm("Replace current connectors?")
        ) {
            return;
        }

        const next = structuredClone(data).map(
            connector => ({
                ...connector,
                id: crypto.randomUUID(),
            })
        );

        setLinkInOut(false);
        setConnectors(next);
        setActiveId(next[0]?.id ?? null);
        setDirty(true);
        setMessage("");
        setPasteFeedback(true);
    }

    /* =========================================================
       SAVE
       ========================================================= */

    async function saveConnectors(next = false) {
        if (!selectedPedal || saving) return;

        setSaving(true);
        setMessage("");

        const nextPedal =
            filteredPedals[selectedIndex + 1];

        try {
            await onSave(
                selectedPedal.id,
                connectors,
                true
            );

            setDirty(false);
            setMessage("Connectors saved.");

            if (next && nextPedal) {
                loadPedal(nextPedal);
            }
        } catch (error) {
            console.error(error);
            setMessage("Unable to save connectors.");
        } finally {
            setSaving(false);
        }
    }


    /* =========================================================
       BULK CALIBRATION
       ========================================================= */

    const bulkCandidates = pedals.filter(pedal => {
        if (!selectedPedal) return false;

        if (pedal.id === selectedPedal.id) {
            return false;
        }

        const searchable =
            `${pedal.brand} ${pedal.name}`.toLowerCase();

        if (
            !searchable.includes(
                bulkQuery.trim().toLowerCase()
            )
        ) {
            return false;
        }

        if (
            bulkSameBrand &&
            pedal.brand !== selectedPedal.brand
        ) {
            return false;
        }

        if (
            bulkSameSize &&
            (
                Number(pedal.width) !== Number(selectedPedal.width) ||
                Number(pedal.depth) !== Number(selectedPedal.depth)
            )
        ) {
            return false;
        }

        return true;
    });

    function openBulkEditor() {
        if (!selectedPedal || !connectors.length || saving) {
            return;
        }

        if (parseConnectors(connectors) === null) {
            setMessage("Invalid connector configuration.");
            return;
        }

        setBulkQuery("");
        setBulkSameBrand(true);
        setBulkSameSize(true);
        setBulkIds([]);
        setMessage("");
        setBulkOpen(true);
    }

    function toggleBulkPedal(id: string | number) {
        setBulkIds(previous =>
            previous.includes(id)
                ? previous.filter(value => value !== id)
                : previous.length < 100
                    ? [...previous, id]
                    : previous
        );
    }

    function selectAllBulkPedals() {
        setBulkIds(
            bulkCandidates
                .slice(0, 100)
                .map(pedal => pedal.id)
        );
    }

    async function applyBulkConnectors() {
        if (!bulkIds.length || !selectedPedal || saving) {
            return;
        }



        setSaving(true);

        try {
            await onSaveMultiple(
                bulkIds,
                connectors,
                true
            );

            setMessage(
                `Connectors applied to ${bulkIds.length} pedals.`
            );

            setBulkOpen(false);
            setBulkIds([]);
        } catch (error) {
            console.error(error);

            window.alert(
                error instanceof Error
                    ? error.message
                    : "Unable to update pedals."
            );
        } finally {
            setSaving(false);
        }
    }


    /* =========================================================
       IMAGE
       ========================================================= */

    const image =
        selectedPedal?.image ||
        selectedPedal?.image_url ||
        selectedPedal?.photo ||
        null;

    const ratio =
        selectedPedal &&
            selectedPedal.width > 0 &&
            selectedPedal.depth > 0
            ? selectedPedal.width / selectedPedal.depth
            : 0.55;

    const previewWidth = Math.min(
        420,
        340 * ratio
    );

    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <div
            className={styles.root}
            data-theme={darkMode ? "dark" : "light"}
        >
            <header className={styles.header}>
                <div className={styles.heading}>
                    <Cable size={24} />
                    <h1>Jack Position Editor</h1>
                </div>

                <button
                    type="button"
                    className={styles.themeButton}
                    onClick={toggleTheme}
                    title={darkMode ? "Light mode" : "Dark mode"}
                    aria-label={darkMode ? "Light mode" : "Dark mode"}
                >
                    {darkMode ? <Sun size={19} /> : <Moon size={19} />}
                </button>

                <span className={styles.counter}>
                    {pedals.filter(
                        pedal => getStatus(pedal) === "verified"
                    ).length}
                    {" / "}
                    {pedals.length} verified
                </span>
            </header>

            <div className={styles.layout}>

                {/* PRODUCT LIBRARY */}

                <aside className={styles.library}>
                    <div className={styles.search}>
                        <Search size={18} />

                        <input
                            value={query}
                            placeholder="Search brand or product..."
                            onChange={event =>
                                setQuery(event.target.value)
                            }
                        />
                    </div>

                    <select
                        className={styles.select}
                        value={filter}
                        onChange={event =>
                            setFilter(event.target.value as Filter)
                        }
                    >
                        <option value="all">All Pedals</option>
                        <option value="unverified">Not verified</option>
                        <option value="verified">Verified</option>
                    </select>

                    <div className={styles.productList}>
                        {filteredPedals.map(pedal => (
                            <button
                                key={pedal.id}
                                type="button"
                                disabled={saving}
                                className={styles.productButton}
                                data-active={
                                    selectedPedal?.id === pedal.id
                                }
                                onClick={() => selectPedal(pedal)}
                            >
                                <span className={styles.productText}>
                                    <small>{pedal.brand}</small>
                                    <strong>{pedal.name}</strong>
                                </span>

                                <span
                                    className={styles.statusDot}
                                    data-status={getStatus(pedal)}
                                />
                            </button>
                        ))}
                    </div>
                </aside>

                {/* MAIN EDITOR */}

                {!selectedPedal ? (
                    <div className={styles.empty}>
                        Select a pedal to start calibration.
                    </div>
                ) : (
                    <main className={styles.workspace}>

                        {/* PRODUCT TITLE */}

                        <div className={styles.productHeader}>
                            <div>
                                <small>{selectedPedal.brand}</small>
                                <h2>{selectedPedal.name}</h2>

                                <span>
                                    {selectedPedal.width} ×{" "}
                                    {selectedPedal.depth} mm
                                </span>
                            </div>

                            <div className={styles.navigation}>
                                <button
                                    type="button"
                                    disabled={selectedIndex <= 0 || saving}
                                    onClick={() => navigate(-1)}
                                    aria-label="Previous pedal"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        selectedIndex >= filteredPedals.length - 1 ||
                                        saving
                                    }
                                    onClick={() => navigate(1)}
                                    aria-label="Next pedal"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div className={styles.editorGrid}>

                            {/* PEDAL PREVIEW */}

                            <section className={styles.previewPanel}>
                                <h3>Connector positions</h3>

                                <div className={styles.previewArea}>
                                    <div
                                        ref={previewRef}
                                        className={styles.pedalPreview}
                                        style={{
                                            width: `min(${previewWidth}px, calc(100cqh * ${ratio}))`,
                                            maxWidth: "100%",
                                            aspectRatio: ratio,
                                        }}
                                        onPointerDown={handlePreviewPointerDown}
                                    >
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={selectedPedal.name}
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className={styles.placeholder}>
                                                {selectedPedal.name}
                                            </div>
                                        )}

                                        {connectors.map(connector => {
                                            const point =
                                                getConnectorPoint(connector);

                                            return (
                                                <button
                                                    key={connector.id}
                                                    type="button"
                                                    className={styles.marker}
                                                    data-active={
                                                        activeId === connector.id
                                                    }
                                                    style={{
                                                        left: `${point.x * 100}%`,
                                                        top: `${point.y * 100}%`,
                                                        background: getConnectorColor(
                                                            connector.type
                                                        ),
                                                    }}
                                                    title={connector.label}
                                                    aria-label={connector.label}
                                                    onPointerDown={event =>
                                                        handleDragStart(
                                                            event,
                                                            connector.id
                                                        )
                                                    }
                                                    onPointerMove={handleDragMove}
                                                    onPointerUp={handleDragEnd}
                                                    onPointerCancel={handleDragEnd}
                                                    onClick={() =>
                                                        setActiveId(connector.id)
                                                    }
                                                >
                                                    <span
                                                        className={styles.markerLabel}
                                                        data-side={connector.side}
                                                    >
                                                        {connector.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <p className={styles.hint}>
                                    Select a connector and click or drag
                                    to adjust its position.
                                </p>

                                <h3>Quick presets</h3>

                                <div className={styles.presets}>
                                    <button
                                        disabled={saving}
                                        onClick={() => applyPreset("mono")}
                                    >
                                        Mono
                                    </button>

                                    <button
                                        disabled={saving}
                                        onClick={() => applyPreset("stereo")}
                                    >
                                        Stereo
                                    </button>

                                    <button
                                        disabled={saving}
                                        onClick={() => applyPreset("top")}
                                    >
                                        Top Mono
                                    </button>

                                    <button
                                        disabled={saving}
                                        onClick={() => applyPreset("top_stereo")}
                                    >
                                        Top Stereo
                                    </button>
                                </div>
                            </section>

                            {/* CONNECTOR SETTINGS */}

                            <section className={styles.settingsPanel}>

                                <div className={styles.sectionHeader}>
                                    <h3>
                                        Connectors ({connectors.length})
                                    </h3>

                                    <div className={styles.connectorHeaderActions}>
                                        <label className={styles.linkToggle}>
                                            <input
                                                type="checkbox"
                                                checked={linkInOut}
                                                disabled={
                                                    saving ||
                                                    connectors.filter(c => c.type === "input").length !== 1 ||
                                                    connectors.filter(c => c.type === "output").length !== 1 ||
                                                    !connectors.some(c => c.type === "input" && c.channel === "mono") ||
                                                    !connectors.some(c => c.type === "output" && c.channel === "mono")
                                                }
                                                onChange={event =>
                                                    setLinkInOut(event.target.checked)
                                                }
                                            />

                                            Link In/Out
                                        </label>

                                        <button
                                            className={styles.addButton}
                                            disabled={saving}
                                            onClick={() => addConnector()}
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.connectorList}>
                                    {connectors.map(connector => (
                                        <div
                                            key={connector.id}
                                            className={styles.connectorRow}
                                            data-active={
                                                activeId === connector.id
                                            }
                                        >
                                            <button
                                                className={styles.connectorSelect}
                                                onClick={() =>
                                                    setActiveId(connector.id)
                                                }
                                            >
                                                <span
                                                    className={styles.connectorDot}
                                                    style={{
                                                        background: getConnectorColor(
                                                            connector.type
                                                        ),
                                                    }}
                                                />

                                                <strong>{connector.label}</strong>

                                                <small>
                                                    {connector.side} ·{" "}
                                                    {connector.position}%
                                                </small>
                                            </button>

                                            <button
                                                className={styles.deleteButton}
                                                disabled={saving}
                                                aria-label="Delete connector"
                                                onClick={() =>
                                                    deleteConnector(connector.id)
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* ACTIVE CONNECTOR */}

                                {activeConnector && (
                                    <fieldset
                                        className={styles.properties}
                                        disabled={saving}
                                    >
                                        <h3>Edit connector</h3>



                                        <label>
                                            Function

                                            <select
                                                value={activeConnector.type}
                                                onChange={event => {
                                                    const type =
                                                        event.target.value as ConnectorType;

                                                    updateConnector(
                                                        activeConnector.id,
                                                        {
                                                            type,
                                                            label: getConnectorLabel(
                                                                type,
                                                                type === "power_input" || type === "power_output"
                                                                    ? null
                                                                    : activeConnector.channel,
                                                                activeConnector.loop
                                                            ),
                                                            format:
                                                                activeConnector.channel === "stereo" &&
                                                                    getDefaultConnectorFormat(type) === "TS_635"
                                                                    ? "TRS_635"
                                                                    : getDefaultConnectorFormat(type),

                                                            side:
                                                                type === "power_input" || type === "power_output"
                                                                    ? "Top"
                                                                    : activeConnector.side,
                                                            channel:
                                                                type === "power_input" || type === "power_output"
                                                                    ? null
                                                                    : activeConnector.channel,
                                                        }
                                                    );
                                                }}
                                            >
                                                {CONNECTOR_TYPES
                                                    .filter(type =>
                                                        type !== "balanced_output" &&
                                                        type !== "other" ||
                                                        type === activeConnector.type
                                                    )
                                                    .filter(type =>
                                                        type !== "expression_output" ||
                                                        activeConnector.type === "expression_output"
                                                    )
                                                    .filter(type =>
                                                        type !== "expression_input" ||
                                                        activeConnector.type !== "expression_output"
                                                    )
                                                    .map(type => (
                                                        <option key={type} value={type}>
                                                            {CONNECTOR_LABELS[type]}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>

                                        <label>
                                            Physical format

                                            <select
                                                value={activeConnector.format}
                                                onChange={event =>
                                                    updateConnector(
                                                        activeConnector.id,
                                                        {
                                                            format:
                                                                event.target.value as ConnectorFormat,
                                                        }
                                                    )
                                                }
                                            >
                                                {CONNECTOR_FORMATS.map(format => (
                                                    <option
                                                        key={format}
                                                        value={format}
                                                    >
                                                        {format}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <div className={styles.additionalFunctions}>
                                            <span className={styles.additionalFunctionsLabel}>
                                                Additional functions
                                            </span>

                                            <div className={styles.additionalFunctionsRow}>
                                                {(activeConnector.alternateTypes ?? []).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        className={styles.functionChip}
                                                        disabled={saving}
                                                        title={`Remove ${CONNECTOR_LABELS[type]}`}
                                                        onClick={() =>
                                                            updateConnector(activeConnector.id, {
                                                                alternateTypes:
                                                                    (activeConnector.alternateTypes ?? [])
                                                                        .filter(item => item !== type),
                                                            })
                                                        }
                                                    >
                                                        {CONNECTOR_LABELS[type]}
                                                        <X size={12} />
                                                    </button>
                                                ))}

                                                <select
                                                    className={styles.addFunctionSelect}
                                                    aria-label="Add additional function"
                                                    value=""
                                                    disabled={saving}
                                                    onChange={event => {
                                                        if (!event.target.value) return;

                                                        const type =
                                                            event.target.value as ConnectorType;

                                                        updateConnector(activeConnector.id, {
                                                            alternateTypes: [
                                                                ...(activeConnector.alternateTypes ?? []),
                                                                type,
                                                            ],
                                                        });
                                                    }}
                                                >
                                                    <option value="">
                                                        + Add function
                                                    </option>

                                                    {CONNECTOR_TYPES
                                                        .filter(type =>
                                                            type !== "balanced_output" &&
                                                            type !== "other" &&
                                                            type !== "expression_output" &&
                                                            type !== activeConnector.type &&
                                                            CONNECTOR_LABELS[type] !==
                                                            CONNECTOR_LABELS[activeConnector.type] &&
                                                            !(activeConnector.alternateTypes ?? [])
                                                                .some(item =>
                                                                    CONNECTOR_LABELS[item] ===
                                                                    CONNECTOR_LABELS[type]
                                                                )
                                                        )
                                                        .map(type => (
                                                            <option key={type} value={type}>
                                                                {CONNECTOR_LABELS[type]}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                        </div>

                                        <label>
                                            Channel

                                            <select
                                                value={activeConnector.channel ?? ""}
                                                onChange={event => {
                                                    const channel = (
                                                        event.target.value || null
                                                    ) as ConnectorChannel | null;

                                                    updateConnector(
                                                        activeConnector.id,
                                                        {
                                                            channel,
                                                            label: getConnectorLabel(
                                                                activeConnector.type,
                                                                channel,
                                                                activeConnector.loop
                                                            ),
                                                            ...(channel === "stereo" &&
                                                                activeConnector.format === "TS_635"
                                                                ? { format: "TRS_635" as const }
                                                                : {}),
                                                        }
                                                    );
                                                }}
                                            >
                                                <option value="">Not applicable</option>
                                                <option value="mono">Mono</option>
                                                <option value="L">Left</option>
                                                <option value="R">Right</option>
                                                <option value="stereo">Stereo</option>
                                            </select>
                                        </label>

                                        <label>
                                            Side

                                            <select
                                                value={activeConnector.side}
                                                onChange={event =>
                                                    updateConnector(
                                                        activeConnector.id,
                                                        {
                                                            side:
                                                                event.target.value as ConnectorSide,
                                                        }
                                                    )
                                                }
                                            >
                                                <option value="L">Left</option>
                                                <option value="R">Right</option>
                                                <option value="Top">Top</option>
                                                <option value="Down">Bottom</option>
                                            </select>
                                        </label>

                                        <label>
                                            Position


                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={0.1}
                                                value={activeConnector.position}
                                                onChange={event =>
                                                    updateConnector(
                                                        activeConnector.id,
                                                        {
                                                            position: Number(
                                                                event.target.value
                                                            ),
                                                        }
                                                    )
                                                }
                                            />
                                        </label>

                                    </fieldset>
                                )}
                                <footer className={styles.footer}>
                                    <div className={styles.footerLeft}>
                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            disabled={saving || connectors.length === 0}
                                            onClick={openBulkEditor}
                                        >
                                            <Layers size={16} />
                                            Apply to multiple pedals
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            data-success={copyFeedback}
                                            onClick={copyConnectors}
                                        >
                                            {copyFeedback ? (
                                                <Check size={16} />
                                            ) : (
                                                <Copy size={16} />
                                            )}

                                            {copyFeedback ? "Copied" : "Copy"}
                                        </button>

                                        <button
                                            type="button"
                                            className={styles.secondaryButton}
                                            data-success={pasteFeedback}
                                            disabled={saving}
                                            onClick={pasteConnectors}
                                        >
                                            {pasteFeedback ? (
                                                <Check size={16} />
                                            ) : (
                                                <ClipboardPaste size={16} />
                                            )}

                                            {pasteFeedback ? "Pasted" : "Paste"}
                                        </button>
                                    </div>

                                    <div className={styles.footerRight}>
                                        <button
                                            className={styles.primaryButton}
                                            disabled={saving}
                                            onClick={() => saveConnectors(true)}
                                        >
                                            <Save size={16} />
                                            {saving ? "Saving..." : "Save"}
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </footer>
                            </section>
                        </div>

                        {/* FOOTER */}



                        {message && (
                            <p className={styles.message} role="status">
                                {message}
                            </p>
                        )}
                    </main>

                )}
            </div>

            {bulkOpen && selectedPedal && (
                <div className={styles.bulkOverlay}>
                    <section
                        className={styles.bulkModal}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Apply to multiple pedals"
                    >
                        <header className={styles.bulkHeader}>
                            <div>
                                <h2>Apply to multiple pedals</h2>
                                <p>
                                    Source: {selectedPedal.brand}{" "}
                                    {selectedPedal.name}
                                    {" · "}
                                    {connectors.length} connectors
                                </p>
                            </div>

                            <button
                                type="button"
                                className={styles.themeButton}
                                disabled={saving}
                                onClick={() => setBulkOpen(false)}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div className={styles.search}>
                            <Search size={18} />

                            <input
                                value={bulkQuery}
                                placeholder="Search pedals..."
                                disabled={saving}
                                onChange={event =>
                                    setBulkQuery(event.target.value)
                                }
                            />
                        </div>

                        <div className={styles.bulkFilters}>
                            <label className={styles.verified}>
                                <input
                                    type="checkbox"
                                    checked={bulkSameBrand}
                                    disabled={saving}
                                    onChange={event =>
                                        setBulkSameBrand(event.target.checked)
                                    }
                                />
                                Same brand
                            </label>

                            <label className={styles.verified}>
                                <input
                                    type="checkbox"
                                    checked={bulkSameSize}
                                    disabled={saving}
                                    onChange={event =>
                                        setBulkSameSize(event.target.checked)
                                    }
                                />
                                Same dimensions
                            </label>
                        </div>

                        <div className={styles.bulkActions}>
                            <span>
                                {bulkIds.length} selected ·{" "}
                                {bulkCandidates.length} matches
                            </span>

                            <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={saving}
                                onClick={selectAllBulkPedals}
                            >
                                Select all (max. 100)
                            </button>

                            <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={saving}
                                onClick={() => setBulkIds([])}
                            >
                                Clear
                            </button>
                        </div>

                        <div className={styles.bulkList}>
                            {bulkCandidates.map(pedal => (
                                <label
                                    key={pedal.id}
                                    className={styles.bulkRow}
                                    data-selected={bulkIds.includes(pedal.id)}
                                >
                                    <input
                                        type="checkbox"
                                        disabled={
                                            saving ||
                                            (
                                                bulkIds.length >= 100 &&
                                                !bulkIds.includes(pedal.id)
                                            )
                                        }
                                        checked={bulkIds.includes(pedal.id)}
                                        onChange={() =>
                                            toggleBulkPedal(pedal.id)
                                        }
                                    />

                                    <img
                                        src={
                                            pedal.image ||
                                            pedal.image_url ||
                                            pedal.photo ||
                                            undefined
                                        }
                                        alt=""
                                        loading="lazy"
                                    />

                                    <span className={styles.productText}>
                                        <small>{pedal.brand}</small>

                                        <strong>{pedal.name}</strong>

                                        <small>
                                            {pedal.width} × {pedal.depth} mm
                                        </small>
                                    </span>

                                    <span
                                        className={styles.statusDot}
                                        data-status={getStatus(pedal)}
                                    />
                                </label>
                            ))}

                            {bulkCandidates.length === 0 && (
                                <p className={styles.hint}>
                                    No matching pedals.
                                </p>
                            )}
                        </div>

                        <footer className={styles.bulkFooter}>


                            <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={saving}
                                onClick={() => setBulkOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={styles.primaryButton}
                                disabled={saving || bulkIds.length === 0}
                                onClick={applyBulkConnectors}
                            >
                                {saving
                                    ? "Saving..."
                                    : `Apply to ${bulkIds.length} pedals`}
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </div>
    );
}

