"use client";

import React from "react";
import Link from "next/link";
import {
    ChevronDown,
    Sun,
    Moon,
    Check,
    Menu,
    X,
} from "lucide-react";

import type { Language } from "@/utils/i18n";
import { openOnboardingTour } from "@/components/OnboardingTour";

type Background = {
    id: string;
    label: string;
    type: "css" | "image";
    src?: string;
    thumbSrc?: string;
};

type Props = {
    t: (key: string) => string;
    canvasBg: string;
    setCanvasBg: (v: string) => void;
    language: Language;
    setLanguage: (v: Language) => void;
    units: "metric" | "imperial";
    setUnits: (v: "metric" | "imperial") => void;
    backgrounds: Background[];
};

function SettingsContent({
    t,
    canvasBg,
    setCanvasBg,
    language,
    setLanguage,
    units,
    setUnits,
    backgrounds,
    placement,
}: Props & {
    placement: "top" | "bottom";
}) {
    const [bgOpen, setBgOpen] = React.useState(false);
    const [langOpen, setLangOpen] = React.useState(false);

    const [theme, setTheme] = React.useState<
        "dark" | "light"
    >(() => {
        if (typeof window === "undefined") return "light";

        return document.documentElement.classList.contains("light")
            ? "light"
            : "dark";
    });

    const bgRef = React.useRef<HTMLDivElement>(null);
    const langRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const sync = () =>
            setTheme(
                document.documentElement.classList.contains("light")
                    ? "light"
                    : "dark"
            );

        sync();

        const observer = new MutationObserver(sync);

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                langRef.current &&
                !langRef.current.contains(e.target as Node)
            ) {
                setLangOpen(false);
            }

            if (
                bgRef.current &&
                !bgRef.current.contains(e.target as Node)
            ) {
                setBgOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const LANGUAGE_LABELS: Record<Language, string> = {
        en: "English",
        fr: "Français",
        es: "Español",
        de: "Deutsch",
        it: "Italiano",
        pt: "Português",
        zh: "中文",
    };

    const selectedBackground =
        backgrounds.find(
            (background) => background.id === canvasBg
        ) || backgrounds[0];

    const getBackgroundLabel = (background: Background) => {
        const translated = t(`backgrounds.${background.id}`);

        if (
            translated &&
            translated !== `backgrounds.${background.id}`
        ) {
            return translated;
        }

        return background.label;
    };

    const handleThemeChange = (value: "dark" | "light") => {
        setTheme(value);

        document.documentElement.classList.toggle(
            "light",
            value === "light"
        );

        document.documentElement.classList.toggle(
            "dark",
            value === "dark"
        );

        localStorage.setItem("theme", value);
    };

    const row = "myb-setting-row";
    const control = "myb-menu-control";
    const segment = "myb-menu-segment";

    const rowStyle = {
        gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1.8fr)",
    };

    const swatch = (background: Background) => (
        <span
            aria-hidden="true"
            className="myb-background-swatch"
            style={{
                backgroundImage:
                    background.type === "image" &&
                        (background.thumbSrc || background.src)
                        ? `url("${background.thumbSrc || background.src}")`
                        : undefined,
            }}
        />
    );

    const dropdownPosition: React.CSSProperties =
        placement === "bottom"
            ? {
                bottom: "calc(100% + 6px)",
                top: "auto",
            }
            : {
                top: "calc(100% + 6px)",
                bottom: "auto",
            };

    return (
        <div className="myb-settings-panel">
            <style>{`
                .myb-settings-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    overflow: visible;
                }

                .myb-settings-panel .myb-setting-row {
                    display: grid;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }

                .myb-settings-panel button {
                    cursor: pointer;
                    border: 0 !important;
                    box-shadow: none !important;
                    margin: 0 !important;
                    color: inherit;
                }

                .myb-settings-panel button:focus-visible {
                    outline: 2px solid var(--zinc-500) !important;
                    outline-offset: 2px;
                }

                .myb-settings-panel .myb-menu-control {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    width: 100%;
                    min-width: 0;
                    min-height: 34px;
                    padding: 0 10px !important;
                    border-radius: 9px !important;
                    background: var(--zinc-950) !important;
                    font-size: 11px !important;
                    box-sizing: border-box;
                }

                .myb-settings-panel .myb-menu-control:hover {
                    background: var(--zinc-800) !important;
                }

                .myb-settings-panel .myb-segments {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 3px;
                    padding: 3px;
                    border-radius: 9px;
                    background: var(--zinc-950);
                    box-sizing: border-box;
                }

                .myb-settings-panel .myb-menu-segment {
                    display: flex;
                    min-width: 0;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    min-height: 28px;
                    padding: 3px 4px !important;
                    border-radius: 6px !important;
                    font-size: 11px !important;
                    background: transparent !important;
                }

                .myb-settings-panel .myb-menu-segment:hover {
                    background: var(--zinc-800) !important;
                }

                .myb-settings-panel .myb-menu-segment[aria-pressed="true"] {
                    background: var(--zinc-700) !important;
                    font-weight: 600;
                }

                .myb-settings-panel .myb-dropdown {
                    position: absolute;
                    right: 0;
                    left: 0;
                    z-index: 50;
                    padding: 4px;
                    border: 1px solid var(--zinc-700);
                    border-radius: 10px;
                    background: var(--zinc-900);
                    box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
                    max-height: min(220px, 35dvh);
                    overflow-y: auto;
                    overflow-x: hidden;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    box-sizing: border-box;
                    overscroll-behavior: contain;
                }

                .myb-settings-panel .myb-dropdown::-webkit-scrollbar {
                    display: none;
                    width: 0;
                    height: 0;
                }

                .myb-settings-panel .myb-menu-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    width: 100%;
                    min-width: 0;
                    min-height: 30px;
                    padding: 5px 8px !important;
                    border-radius: 6px !important;
                    background: transparent !important;
                    box-sizing: border-box;
                    font-size: 11px !important;
                    text-align: left;
                }

                .myb-settings-panel .myb-menu-option:hover {
                    background: var(--zinc-800) !important;
                }

                .myb-settings-panel .myb-background-swatch {
                    display: block;
                    flex: 0 0 24px;
                    width: 24px;
                    min-width: 24px;
                    max-width: 24px;
                    height: 16px;
                    min-height: 16px;
                    max-height: 16px;
                    border-radius: 4px;
                    border: 1px solid var(--zinc-700);
                    background-color: var(--zinc-600);
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    overflow: hidden;
                    box-sizing: border-box;
                }

                .myb-settings-panel .myb-option-label {
                    display: block;
                    flex: 1 1 0%;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-align: left;
                }

                .myb-settings-panel .myb-background-option[aria-pressed="true"] {
                    background: var(--zinc-800) !important;
                    font-weight: 600;
                }
            `}</style>

            {/* Language */}
            <div className={row} style={rowStyle}>
                <span className="text-[12px]">
                    {t("settings.language")}
                </span>

                <div
                    ref={langRef}
                    className="relative min-w-0"
                    style={{
                        zIndex: langOpen ? 60 : 1,
                    }}
                >
                    <button
                        type="button"
                        aria-expanded={langOpen}
                        onClick={() => {
                            setLangOpen((v) => !v);
                            setBgOpen(false);
                        }}
                        className={control}
                    >
                        <span className="myb-option-label">
                            {LANGUAGE_LABELS[language]}
                        </span>

                        <ChevronDown
                            size={14}
                            className="shrink-0 text-zinc-400"
                        />
                    </button>

                    {langOpen && (
                        <div
                            className="myb-dropdown"
                            style={dropdownPosition}
                        >
                            {(
                                Object.keys(
                                    LANGUAGE_LABELS
                                ) as Language[]
                            ).map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    aria-pressed={language === l}
                                    onClick={() => {
                                        setLanguage(l);
                                        setLangOpen(false);
                                    }}
                                    className="myb-menu-option"
                                >
                                    <span className="myb-option-label">
                                        {LANGUAGE_LABELS[l]}
                                    </span>

                                    {language === l && (
                                        <Check
                                            size={13}
                                            className="shrink-0"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Units */}
            <div className={row} style={rowStyle}>
                <span className="text-[12px]">
                    {t("settings.units")}
                </span>

                <div className="myb-segments">
                    <button
                        type="button"
                        title={t(
                            "settings.unitsOptions.metric"
                        )}
                        aria-pressed={units === "metric"}
                        onClick={() => setUnits("metric")}
                        className={segment}
                    >
                        mm
                    </button>

                    <button
                        type="button"
                        title={t(
                            "settings.unitsOptions.imperial"
                        )}
                        aria-pressed={units === "imperial"}
                        onClick={() => setUnits("imperial")}
                        className={segment}
                    >
                        in
                    </button>
                </div>
            </div>

            {/* Theme */}
            <div className={row} style={rowStyle}>
                <span className="text-[12px]">
                    {t("settings.theme")}
                </span>

                <div className="myb-segments">
                    <button
                        type="button"
                        aria-pressed={theme === "light"}
                        onClick={() =>
                            handleThemeChange("light")
                        }
                        className={segment}
                    >
                        <Sun
                            size={14}
                            className="shrink-0"
                        />

                        <span className="truncate">
                            {t("settings.themeOptions.light")}
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={theme === "dark"}
                        onClick={() =>
                            handleThemeChange("dark")
                        }
                        className={segment}
                    >
                        <Moon
                            size={14}
                            className="shrink-0"
                        />

                        <span className="truncate">
                            {t("settings.themeOptions.dark")}
                        </span>
                    </button>
                </div>
            </div>

            {/* Background */}
            <div className={row} style={{ ...rowStyle, display: "none" }}>
                <span className="text-[12px]">
                    {t("settings.background")}
                </span>

                <div
                    ref={bgRef}
                    className="relative min-w-0"
                    style={{
                        zIndex: bgOpen ? 60 : 1,
                    }}
                >
                    <button
                        type="button"
                        aria-expanded={bgOpen}
                        onClick={() => {
                            setBgOpen((v) => !v);
                            setLangOpen(false);
                        }}
                        className={control}
                    >
                        <span className="myb-option-label">
                            {selectedBackground
                                ? getBackgroundLabel(
                                    selectedBackground
                                )
                                : ""}
                        </span>

                        {selectedBackground &&
                            swatch(selectedBackground)}

                        <ChevronDown
                            size={14}
                            className="shrink-0 text-zinc-400"
                        />
                    </button>

                    {bgOpen && (
                        <div
                            className="myb-dropdown"
                            style={dropdownPosition}
                        >
                            {backgrounds.map((background) => (
                                <button
                                    key={background.id}
                                    type="button"
                                    aria-pressed={
                                        canvasBg === background.id
                                    }
                                    onClick={() => {
                                        setCanvasBg(background.id);
                                        setBgOpen(false);
                                    }}
                                    className="myb-menu-option myb-background-option"
                                >
                                    <span className="myb-option-label">
                                        {getBackgroundLabel(
                                            background
                                        )}
                                    </span>

                                    {swatch(background)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SettingsMenu({
    placement = "top",
    supportUrl = "https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00",
    ...props
}: Props & {
    placement?: "top" | "bottom";
    supportUrl?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [contactVisible, setContactVisible] = React.useState(false);
    const close = () => { setOpen(false); setContactVisible(false); };
    const root = React.useRef<HTMLDivElement>(null);
    const id = React.useId();

    React.useEffect(() => {
        if (!open) return;

        const outside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) {
                close();
            }
        };

        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                close();
            }
        };

        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);

        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    return (
        <div
            ref={root}
            className="relative pointer-events-auto shrink-0"
            onClick={(event) => event.stopPropagation()}
        >
            <style>{`
.myb-settings-trigger {
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    color: var(--foreground);
    cursor: pointer;
    transition: background-color 150ms ease;
}

.myb-settings-trigger:hover {
    background: var(--zinc-800) !important;
}

                .myb-settings-trigger:focus:not(:focus-visible) {
                    outline: none !important;
                }

                .myb-settings-trigger:focus-visible {
                    outline: 2px solid var(--zinc-500, #71717a) !important;
                    outline-offset: 2px;
                }
.myb-unified-shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 0;
    min-height: 60px;
    padding: 8px 3px;
    border: 0 !important;
    box-shadow: none !important;
    border-radius: 8px;
    background: var(--zinc-950) !important;
    color: inherit;
    font-size: 12px;
    line-height: 1.25;
    text-align: center;
    text-decoration: none;
    overflow-wrap: anywhere;
    cursor: pointer;
    transition: background-color 150ms ease;
}
.myb-unified-shortcut:hover { background: var(--zinc-800) !important; }
.myb-unified-shortcut:focus-visible { outline: 2px solid var(--zinc-500); outline-offset: 2px; }
.myb-unified-support { flex-direction: row; min-height: 34px; padding: 8px; }
            `}</style>

            <button
                type="button"
                aria-label={props.t("settings.title")}
                title={props.t("settings.title")}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => open ? close() : setOpen(true)}
                className="myb-settings-trigger flex h-9 w-9 items-center justify-center rounded-lg"
            >
                <Menu size={20} />
            </button>

            {open && (
                <div
                    id={id}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl"
                    style={{
                        position: "fixed",
                        zIndex: 160,
                        right: 10,
                        top: 58,
                        bottom: "auto",
                        width: 280,
                        maxWidth: "calc(100vw - 20px)",
                        padding: 14,
                        overflow: "visible",
                        boxSizing: "border-box",
                    }}
                >
                    {contactVisible ? (
                        <SettingsContactForm t={props.t} onBack={() => setContactVisible(false)} />
                    ) : (
                        <div className="flex flex-col gap-3">
                            <SettingsContent {...props} placement={placement} />
                            <div className="grid grid-cols-3 gap-2">
                                <Link href="/docs" onClick={close} className="myb-unified-shortcut" title={props.t("help.documentation")}>
                                    <img
                                        src="/logos/notes.webp"
                                        alt=""
                                        width={18}
                                        height={18}
                                        style={{ objectFit: "contain" }}
                                    />
                                    <span>{props.t("help.documentation")}</span>
                                </Link>
                                <button type="button" onClick={() => setContactVisible(true)} className="myb-unified-shortcut">
                                    <img
                                        src="/logos/mail.webp"
                                        alt=""
                                        width={18}
                                        height={18}
                                        style={{ objectFit: "contain" }}
                                    />
                                    <span>{props.t("footer.feedback")}</span>
                                </button>
                                <a href="https://www.instagram.com/makeyourboard_/" target="_blank" rel="noopener noreferrer" className="myb-unified-shortcut">
                                    <img src="/logos/instagram.png" alt="" width={18} height={18} style={{ objectFit: "contain" }} />
                                    <span>Instagram</span>
                                </a>
                            </div>
                            <button
                                type="button"
                                className="myb-unified-shortcut myb-unified-support"
                                onClick={() => {
                                    close();
                                    openOnboardingTour();
                                }}
                            >
                                <img
                                    src="/logos/play.webp"
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="shrink-0"
                                    style={{ objectFit: "contain" }}
                                />
                                <span>{props.t("onboarding.replay")}</span>
                            </button>
                            {supportUrl && (

                                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="myb-unified-shortcut myb-unified-support">
                                    <img
                                        src="/logos/heart.webp"
                                        alt=""
                                        width={18}
                                        height={18}
                                        className="shrink-0"
                                        style={{ objectFit: "contain" }}
                                    />
                                    <span>{props.t("settings.supportProject")}</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function SettingsContactForm({
    t,
    onBack,
}: {
    t: (key: string) => string;
    onBack: () => void;
}) {
    const [email, setEmail] = React.useState("");
    const [type, setType] = React.useState("question");
    const [typeOpen, setTypeOpen] = React.useState(false);

    const typeRef = React.useRef<HTMLDivElement>(null);
    const typeButtonRef =
        React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        const outside = (event: MouseEvent) => {
            if (
                typeRef.current &&
                !typeRef.current.contains(event.target as Node)
            ) {
                setTypeOpen(false);
            }
        };

        document.addEventListener("mousedown", outside);

        return () => {
            document.removeEventListener(
                "mousedown",
                outside
            );
        };
    }, []);

    const [message, setMessage] = React.useState("");
    const [honeypot, setHoneypot] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState("");
    const [emailError, setEmailError] = React.useState("");

    const id = React.useId();

    const field =
        "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-[11px]";

    return (
        <form
            noValidate
            className="myb-settings-contact flex flex-col gap-4"
            onSubmit={async (event) => {
                event.preventDefault();

                if (loading || success || honeypot) return;

                setError("");
                setEmailError("");

                if (!email.trim() || !message.trim()) {
                    setError(t("contact.errorRequired"));
                    return;
                }

                if (
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                        email.trim()
                    )
                ) {
                    setEmailError(
                        t("contact.errorInvalidEmail")
                    );

                    return;
                }

                setLoading(true);

                try {
                    const response = await fetch("/api/contact", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            email: email.trim(),
                            subject: "MakeYourBoard Contact",
                            message: message.trim(),
                            type,
                            honeypot,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(
                            "Contact request failed"
                        );
                    }

                    setSuccess(true);
                    setEmail("");
                    setMessage("");
                } catch {
                    setError(t("contact.errorGeneric"));
                } finally {
                    setLoading(false);
                }
            }}
        >
            <style>{`
                .myb-settings-contact input:focus,
                .myb-settings-contact input:focus-visible,
                .myb-settings-contact select:focus,
                .myb-settings-contact select:focus-visible,
                .myb-settings-contact textarea:focus,
                .myb-settings-contact textarea:focus-visible {
                    outline: none !important;
                    box-shadow: none !important;
                    border-color: var(--zinc-800) !important;
                }

                .myb-contact-close {
                    cursor: pointer;
                    border: 0 !important;
                    background: transparent;
                    box-shadow: none !important;
                }

                .myb-contact-close:hover {
                    background-color: var(--zinc-800);
                }

                .myb-contact-type-option:hover,
                .myb-contact-type-option:focus-visible {
                    background-color: var(--zinc-800);
                }

                .myb-contact-type-button:focus,
                .myb-contact-type-button:focus-visible {
                    outline: none !important;
                    box-shadow: none !important;
                }

                .myb-contact-send {
                    cursor: pointer;
                }

                .myb-contact-send:hover:not(:disabled) {
                    background-color: #3b82f6 !important;
                }

                .myb-contact-send:disabled {
                    cursor: not-allowed;
                }

                .myb-contact-send[data-success="true"] {
                    background-color: #10b981 !important;
                    color: white !important;
                    opacity: 1 !important;
                    cursor: default;
                }
            `}</style>

            <div
                className="flex items-center justify-between gap-3"
                style={{
                    marginBottom: 16,
                    minHeight: 24,
                }}
            >
                <h2 className="m-0 text-xs font-bold uppercase tracking-wider">
                    {t("contact.title")}
                </h2>

                <button
                    type="button"
                    onClick={onBack}
                    aria-label={t("sidebar.back")}
                    className="myb-contact-close flex h-6 w-6 items-center justify-center rounded-md"
                >
                    <X
                        size={18}
                        aria-hidden="true"
                    />
                </button>
            </div>

            {/* Email */}
            <div
                className="flex flex-col"
                style={{ gap: 4 }}
            >
                <label
                    htmlFor={id + "-email"}
                    className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider"
                >
                    {t("contact.email")}

                    <input
                        style={{
                            height: 36,
                            minHeight: 36,
                            boxSizing: "border-box",
                        }}
                        id={id + "-email"}
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError("");
                        }}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={
                            emailError
                                ? id + "-email-error"
                                : undefined
                        }
                        placeholder={t(
                            "contact.placeholderEmail"
                        )}
                        className={
                            field +
                            " font-normal normal-case tracking-normal"
                        }
                    />
                </label>

                {emailError && (
                    <p
                        id={id + "-email-error"}
                        role="alert"
                        className="m-0 text-[11px] leading-relaxed text-red-500"
                        style={{ margin: 0 }}
                    >
                        {emailError}
                    </p>
                )}
            </div>

            {/* Contact type */}
            <div
                ref={typeRef}
                className="relative flex flex-col gap-2"
                onKeyDown={(event) => {
                    if (
                        event.key === "Escape" &&
                        typeOpen
                    ) {
                        event.preventDefault();
                        setTypeOpen(false);
                        typeButtonRef.current?.focus();
                    }
                }}
            >
                <span
                    id={id + "-type-label"}
                    className="text-[10px] font-bold uppercase tracking-wider"
                >
                    {t("contact.type")}
                </span>

                <button
                    ref={typeButtonRef}
                    id={id + "-type"}
                    type="button"
                    aria-labelledby={
                        id + "-type-label " + id + "-type-value"
                    }
                    aria-expanded={typeOpen}
                    aria-controls={id + "-type-menu"}
                    onClick={() =>
                        setTypeOpen((open) => !open)
                    }
                    className={
                        field +
                        " myb-contact-type-button flex items-center justify-between gap-2 text-left"
                    }
                    style={{
                        height: 36,
                        minHeight: 36,
                        boxSizing: "border-box",
                        cursor: "pointer",
                    }}
                >
                    <span id={id + "-type-value"}>
                        {t("contact.types." + type)}
                    </span>

                    <ChevronDown
                        size={14}
                        style={{
                            transform: typeOpen
                                ? "rotate(180deg)"
                                : "none",
                        }}
                        aria-hidden="true"
                    />
                </button>

                {typeOpen && (
                    <div
                        id={id + "-type-menu"}
                        className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            zIndex: 50,
                        }}
                    >
                        {[
                            "question",
                            "request",
                            "bug",
                            "other",
                        ].map((value) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={type === value}
                                className="myb-contact-type-option flex w-full items-center justify-between px-3 text-left text-[11px]"
                                style={{
                                    height: 32,
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setType(value);
                                    setTypeOpen(false);
                                    typeButtonRef.current?.focus();
                                }}
                            >
                                <span>
                                    {t("contact.types." + value)}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Message */}
            <label
                htmlFor={id + "-message"}
                className="flex flex-col gap-2 text-[10px] font-bold uppercase tracking-wider"
            >
                {t("contact.message")}

                <textarea
                    id={id + "-message"}
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    rows={6}
                    placeholder={t(
                        "contact.placeholderMessage"
                    )}
                    className={
                        field +
                        " resize-none font-normal normal-case tracking-normal"
                    }
                />
            </label>

            {/* Honeypot */}
            <input
                type="text"
                value={honeypot}
                onChange={(e) =>
                    setHoneypot(e.target.value)
                }
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
            />

            {error && (
                <p
                    role="alert"
                    className="text-[11px] text-red-500"
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                style={{
                    height: 36,
                    minHeight: 36,
                    maxHeight: 36,
                    boxSizing: "border-box",
                    paddingTop: 0,
                    paddingBottom: 0,
                }}
                aria-live="polite"
                data-success={
                    success ? "true" : "false"
                }
                disabled={loading || success}
                className="myb-contact-send h-9 rounded-lg bg-blue-600 text-[10px] font-black uppercase !text-white disabled:opacity-50"
            >
                {success
                    ? t("contact.sent")
                    : loading
                        ? t("contact.sending")
                        : t("contact.send")}
            </button>
        </form>
    );
}

