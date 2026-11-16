"use client";

import React from "react";
import Link from "next/link";

import {
    Menu,
    ChevronDown,
    Mail,
    BookOpen,
    Heart,
    X,
} from "lucide-react";

type Props = {
    t: (key: string) => string;
    supportUrl?: string;
};

export default function SiteMenu({
    t,
    supportUrl = "https://buy.stripe.com/14A8wPeGZ8uQ0tQ96I8Zq00",
}: Props) {
    const [open, setOpen] = React.useState(false);
    const [contactVisible, setContactVisible] =
        React.useState(false);

    const root = React.useRef<HTMLDivElement>(null);
    const id = React.useId();

    const close = () => {
        setOpen(false);
        setContactVisible(false);
    };

    React.useEffect(() => {
        if (!open) return;

        const outside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) {
                close();
            }
        };

        const escape = (event: KeyboardEvent) => {
            if (
                event.key === "Escape" &&
                !event.defaultPrevented
            ) {
                close();
            }
        };

        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);

        return () => {
            document.removeEventListener(
                "pointerdown",
                outside
            );

            document.removeEventListener(
                "keydown",
                escape
            );
        };
    }, [open]);

    const item =
        "myb-site-item flex min-h-9 w-full items-center gap-3 rounded-md px-2 py-2 text-left text-[12px]";

    return (
        <div
            ref={root}
            className="relative shrink-0"
            onClick={(event) => event.stopPropagation()}
        >
            <style>{`
                .myb-site-trigger,
                .myb-site-item {
                    border: 0 !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    cursor: pointer;
                    text-decoration: none;
                    box-sizing: border-box;
                }

                .myb-site-trigger {
                    color: var(--zinc-400);
                }

                .myb-site-trigger:hover,
                .myb-site-trigger[aria-expanded="true"] {
                    color: var(--zinc-100);
                }

                .myb-site-trigger:hover {
                    background: var(--zinc-800) !important;
                }

                .myb-site-item {
                    color: inherit;
                    font-size: 12px !important;
                }

                .myb-site-item:hover {
                    background: var(--zinc-800) !important;
                }

                .myb-site-item .myb-site-icon {
                    color: inherit;
                    flex-shrink: 0;
                }

                .myb-site-trigger:focus:not(:focus-visible),
                .myb-site-item:focus:not(:focus-visible) {
                    outline: none !important;
                }

                .myb-site-trigger:focus-visible,
                .myb-site-item:focus-visible {
                    outline: 2px solid var(--zinc-500) !important;
                    outline-offset: 2px;
                }

                .myb-site-panel {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .myb-site-panel::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <button
                type="button"
                aria-label={t("settings.resources")}
                title={t("settings.resources")}
                aria-expanded={open}
                aria-controls={id}
                onClick={() =>
                    open ? close() : setOpen(true)
                }
                className="myb-site-trigger flex h-9 w-9 items-center justify-center rounded-md"
            >
                <Menu size={20} />
            </button>

            {open && (
                <div
                    id={id}
                    className="myb-site-panel rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl"
                    style={{
                        position: "fixed",
                        zIndex: 160,
                        right: 10,
                        top: 58,
                        bottom: "auto",
                        width: 280,
                        minHeight: 202,
                        maxWidth: "calc(100vw - 20px)",
                        padding: 14,
                        overflow: "visible",
                        maxHeight: contactVisible ? "calc(100dvh - 68px)" : undefined,
                        overflowY: contactVisible ? "auto" : undefined,
                        boxSizing: "border-box",
                    }}
                >
                    {contactVisible ? (
                        <SettingsContactForm
                            t={t}
                            onBack={() =>
                                setContactVisible(false)
                            }
                        />
                    ) : (
                        <div className="flex flex-col"
                            style={{ minHeight: 172, justifyContent: "space-between" }}>

                            {/* Documentation */}
                            <Link
                                href="/docs"
                                onClick={close}
                                className={item}
                            >
                                <BookOpen
                                    size={18}
                                    className="myb-site-icon shrink-0 text-current"
                                />

                                <span>
                                    {t("help.documentation")}
                                </span>
                            </Link>

                            {/* Contact */}
                            <button
                                type="button"
                                onClick={() =>
                                    setContactVisible(true)
                                }
                                className={item}
                            >
                                <Mail
                                    size={18}
                                    className="myb-site-icon shrink-0 text-current"
                                />

                                <span>
                                    {t("footer.feedback")}
                                </span>
                            </button>

                            {/* Instagram */}
                            <a
                                href="https://www.instagram.com/makeyourboard_/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={item}
                            >
                                <img
                                    src="/logos/instagram.png"
                                    alt=""
                                    aria-hidden="true"
                                    style={{
                                        width: 18,
                                        height: 18,
                                        minWidth: 18,
                                        maxWidth: 18,
                                        objectFit: "contain",
                                        flexShrink: 0,
                                    }}
                                />

                                <span className="flex-1">
                                    Instagram
                                </span>
                            </a>

                            {/* Support */}
                            {supportUrl && (
                                <a
                                    href={supportUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={item}
                                >
                                    <Heart
                                        size={18}
                                        fill="currentColor"
                                        className="shrink-0 text-red-500"
                                    />

                                    <span className="min-w-0 flex-1">
                                        {t("settings.supportProject")}
                                    </span>
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