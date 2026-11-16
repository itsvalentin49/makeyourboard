
"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { createPortal } from "react-dom";
import { X } from "lucide-react";

import styles from "./OnboardingTour.module.css";

const STORAGE_KEY = "myb-onboarding-v2";
const OPEN_EVENT = "myb:open-onboarding";

type Placement = "top" | "bottom" | "left" | "right" | "center";

type Props = {
    t: (key: string) => string;
    enabled?: boolean;
};

type TourStep = {
    id: string;
    selector?: string;
    placement: Placement;
};

type Rect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

type Position = {
    top: number;
    left: number;
    width: number;
    placement: Placement;
};

/* =========================
   TOUR STEPS
   ========================= */

const STEPS: TourStep[] = [
    {
        id: "welcome",
        placement: "center",
    },
    {
        id: "catalogue",
        selector: '[data-tour="catalogue"]',
        placement: "bottom",
    },
    {
        id: "canvas",
        selector: '[data-tour="canvas"]',
        placement: "center",
    },
    {
        id: "boards",
        selector: '[data-tour="boards"]',
        placement: "top",
    },
    {
        id: "cables",
        selector: '[data-tour="cables"]',
        placement: "top",
    },
    {
        id: "power",
        selector: '[data-tour="power"]',
        placement: "top",
    },
    {
        id: "share",
        selector: '[data-tour="export"]',
        placement: "top",
    },
];

const SPOTLIGHT_PADDING = 6;
const VIEWPORT_MARGIN = 16;
const POPOVER_GAP = 16;

/* =========================
   OPEN FROM SETTINGS
   ========================= */

export function openOnboardingTour() {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new Event(OPEN_EVENT));
}

/* =========================
   TARGET HELPERS
   ========================= */

function findVisibleTarget(
    selector?: string
): HTMLElement | null {
    if (!selector) return null;

    const elements = Array.from(
        document.querySelectorAll<HTMLElement>(selector)
    );

    return (
        elements.find((element) => {
            const rect = element.getBoundingClientRect();
            const computed = window.getComputedStyle(element);

            return (
                rect.width > 0 &&
                rect.height > 0 &&
                computed.display !== "none" &&
                computed.visibility !== "hidden" &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth
            );
        }) ?? null
    );
}

function getTargetRect(element: HTMLElement): Rect | null {
    const rect = element.getBoundingClientRect();

    const left = Math.max(
        0,
        rect.left - SPOTLIGHT_PADDING
    );

    const top = Math.max(
        0,
        rect.top - SPOTLIGHT_PADDING
    );

    const right = Math.min(
        window.innerWidth,
        rect.right + SPOTLIGHT_PADDING
    );

    const bottom = Math.min(
        window.innerHeight,
        rect.bottom + SPOTLIGHT_PADDING
    );

    if (right <= left || bottom <= top) {
        return null;
    }

    return {
        top,
        left,
        width: right - left,
        height: bottom - top,
    };
}

function clamp(
    value: number,
    min: number,
    max: number
) {
    return Math.min(
        Math.max(value, min),
        Math.max(min, max)
    );
}

/* =========================
   COMPONENT
   ========================= */

export default function OnboardingTour({
    t,
    enabled = true,
}: Props) {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const [targetRect, setTargetRect] =
        useState<Rect | null>(null);

    const [position, setPosition] =
        useState<Position | null>(null);

    const popoverRef = useRef<HTMLDivElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const step = STEPS[stepIndex];

    const isWelcome = stepIndex === 0;
    const isLast = stepIndex === STEPS.length - 1;

    /* =========================
       TRANSLATIONS
       ========================= */

    const tr = useCallback(
        (key: string) => t(`onboarding.${key}`),
        [t]
    );

    /* =========================
       OPEN / CLOSE
       ========================= */

    const startTour = useCallback(() => {
        previousFocusRef.current =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        setStepIndex(0);
        setTargetRect(null);
        setPosition(null);
        setOpen(true);
    }, []);

    const finishTour = useCallback(() => {
        try {
            window.localStorage.setItem(
                STORAGE_KEY,
                "completed"
            );
        } catch {
            // Storage may be unavailable.
        }

        setOpen(false);
        setStepIndex(0);
        setTargetRect(null);
        setPosition(null);

        requestAnimationFrame(() => {
            previousFocusRef.current?.focus();
        });
    }, []);

    const goNext = useCallback(() => {
        if (stepIndex >= STEPS.length - 1) {
            finishTour();
            return;
        }

        setStepIndex((current) =>
            Math.min(current + 1, STEPS.length - 1)
        );
    }, [stepIndex, finishTour]);

    const goBack = useCallback(() => {
        setStepIndex((current) =>
            Math.max(0, current - 1)
        );
    }, []);

    /* =========================
       FIRST VISIT
       ========================= */

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !enabled) return;

        let seen = false;

        try {
            seen =
                window.localStorage.getItem(STORAGE_KEY) ===
                "completed";
        } catch {
            // Continue without persistent storage.
        }

        if (seen) return;

        const timer = window.setTimeout(() => {
            startTour();
        }, 500);

        return () => {
            window.clearTimeout(timer);
        };
    }, [mounted, enabled, startTour]);

    /* =========================
       REOPEN FROM SETTINGS
       ========================= */

    useEffect(() => {
        if (!enabled) return;

        const handleOpen = () => {
            startTour();
        };

        window.addEventListener(
            OPEN_EVENT,
            handleOpen
        );

        return () => {
            window.removeEventListener(
                OPEN_EVENT,
                handleOpen
            );
        };
    }, [enabled, startTour]);

    /* =========================
       POSITIONING
       ========================= */

    const updatePosition = useCallback(() => {
        const popover = popoverRef.current;

        if (!popover) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const width = Math.min(
            isWelcome ? 400 : 340,
            viewportWidth - VIEWPORT_MARGIN * 2
        );

        const height = Math.min(
            popover.getBoundingClientRect().height,
            viewportHeight - VIEWPORT_MARGIN * 2
        );

        const target = findVisibleTarget(step.selector);

        const rect = target
            ? step.id === "canvas"
                ? (() => {
                    const bounds = target.getBoundingClientRect();
                    return {
                        top: bounds.top + 6,
                        left: bounds.left + 6,
                        width: Math.max(0, bounds.width - 12),
                        height: Math.max(0, bounds.height - 12),
                    };
                })()
                : getTargetRect(target)
            : null;

        setTargetRect(rect);

        // Welcome screen or unavailable target.
        if (
            isWelcome ||
            !rect ||
            step.placement === "center"
        ) {
            setPosition({
                top: Math.max(
                    VIEWPORT_MARGIN,
                    (viewportHeight - height) / 2
                ),
                left: (viewportWidth - width) / 2,
                width,
                placement: "center",
            });

            return;
        }

        const targetBottom = rect.top + rect.height;
        const targetRight = rect.left + rect.width;

        const candidates: Record<
            Exclude<Placement, "center">,
            { top: number; left: number }
        > = {
            top: {
                top: rect.top - height - POPOVER_GAP,
                left:
                    rect.left + rect.width / 2 - width / 2,
            },

            bottom: {
                top: targetBottom + POPOVER_GAP,
                left:
                    rect.left + rect.width / 2 - width / 2,
            },

            left: {
                top:
                    rect.top + rect.height / 2 - height / 2,
                left: rect.left - width - POPOVER_GAP,
            },

            right: {
                top:
                    rect.top + rect.height / 2 - height / 2,
                left: targetRight + POPOVER_GAP,
            },
        };

        const order: Exclude<Placement, "center">[] = [
            step.placement,
            ...(
                ["top", "bottom", "left", "right"] as const
            ).filter((value) => value !== step.placement),
        ];

        const selected = order.find((placement) => {
            const candidate = candidates[placement];

            if (
                placement === "top" ||
                placement === "bottom"
            ) {
                return (
                    candidate.top >= VIEWPORT_MARGIN &&
                    candidate.top + height <=
                    viewportHeight - VIEWPORT_MARGIN
                );
            }

            return (
                candidate.left >= VIEWPORT_MARGIN &&
                candidate.left + width <=
                viewportWidth - VIEWPORT_MARGIN
            );
        });

        if (!selected) {
            setPosition({
                top: Math.max(
                    VIEWPORT_MARGIN,
                    (viewportHeight - height) / 2
                ),
                left: (viewportWidth - width) / 2,
                width,
                placement: "center",
            });

            return;
        }

        const candidate = candidates[selected];

        setPosition({
            top: clamp(
                candidate.top,
                VIEWPORT_MARGIN,
                viewportHeight - height - VIEWPORT_MARGIN
            ),

            left: clamp(
                candidate.left,
                VIEWPORT_MARGIN,
                viewportWidth - width - VIEWPORT_MARGIN
            ),

            width,
            placement: selected,
        });
    }, [step, isWelcome]);

    useEffect(() => {
        if (!open) return;

        let frame = 0;

        const scheduleUpdate = () => {
            cancelAnimationFrame(frame);

            frame = requestAnimationFrame(() => {
                updatePosition();
            });
        };

        scheduleUpdate();

        window.addEventListener(
            "resize",
            scheduleUpdate
        );

        window.addEventListener(
            "scroll",
            scheduleUpdate,
            true
        );

        const observer = new ResizeObserver(
            scheduleUpdate
        );

        if (popoverRef.current) {
            observer.observe(popoverRef.current);
        }

        const target = findVisibleTarget(step.selector);

        if (target) {
            observer.observe(target);
        }

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();

            window.removeEventListener(
                "resize",
                scheduleUpdate
            );

            window.removeEventListener(
                "scroll",
                scheduleUpdate,
                true
            );
        };
    }, [open, step, updatePosition]);

    /* =========================
       KEYBOARD / ACCESSIBILITY
       ========================= */

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();

                finishTour();

                return;
            }

            if (event.key === "Tab") {
                const focusable =
                    popoverRef.current?.querySelectorAll<HTMLElement>(
                        "button:not(:disabled), [href], [tabindex='0']"
                    );

                if (!focusable?.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                const outside =
                    !popoverRef.current?.contains(
                        document.activeElement
                    );

                if (
                    event.shiftKey &&
                    (document.activeElement === first || outside)
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (
                    !event.shiftKey &&
                    (document.activeElement === last || outside)
                ) {
                    event.preventDefault();
                    first.focus();
                }

                return;
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                event.stopPropagation();

                goNext();
            }

            if (
                event.key === "ArrowLeft" &&
                stepIndex > 0
            ) {
                event.preventDefault();
                event.stopPropagation();

                goBack();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
            true
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown,
                true
            );
        };
    }, [
        open,
        stepIndex,
        finishTour,
        goNext,
        goBack,
    ]);

    useEffect(() => {
        if (!open || !position) return;

        nextButtonRef.current?.focus({
            preventScroll: true,
        });
    }, [open, stepIndex, Boolean(position)]);

    /* =========================
       RENDER CONDITIONS
       ========================= */

    if (!mounted || !enabled || !open) {
        return null;
    }

    const popoverWidth = Math.min(
        isWelcome ? 400 : 340,
        window.innerWidth - VIEWPORT_MARGIN * 2
    );

    const arrowPosition =
        position && targetRect
            ? position.placement === "top" ||
                position.placement === "bottom"
                ? clamp(
                    targetRect.left +
                    targetRect.width / 2 -
                    position.left,
                    20,
                    position.width - 20
                )
                : clamp(
                    targetRect.top +
                    targetRect.height / 2 -
                    position.top,
                    20,
                    Math.max(
                        20,
                        (popoverRef.current?.offsetHeight ?? 100) -
                        20
                    )
                )
            : 0;

    /* =========================
       RENDER
       ========================= */

    return createPortal(
        <div
            className={styles.root}
            aria-label={tr("label")}
        >
            {/* DARK OVERLAY */}

            {targetRect && !isWelcome ? (
                <div
                    className={styles.spotlight}
                    style={{
                        top: targetRect.top,
                        left: targetRect.left,
                        width: targetRect.width,
                        height: targetRect.height,
                        background:
                            step.id === "canvas"
                                ? "rgb(0 0 0 / 65%)"
                                : "transparent",
                    }}
                />
            ) : (
                <div className={styles.overlay} />
            )}

            {/* BLOCK CANVAS INTERACTIONS */}

            <div
                className={styles.interactionShield}
                aria-hidden="true"
            />

            {/* TUTORIAL POPOVER */}

            <div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="myb-tour-title"
                aria-describedby="myb-tour-description"
                data-placement={position?.placement ?? "center"}
                className={`${styles.popover} ${isWelcome
                    ? styles.welcomePopover
                    : ""
                    }`}
                style={{
                    top: position?.top ?? 16,
                    left: position?.left ?? 16,
                    width: position?.width ?? popoverWidth,
                    visibility: position ? "visible" : "hidden",
                }}
            >
                {/* POPOVER ARROW */}

                {!isWelcome &&
                    position &&
                    targetRect &&
                    position.placement !== "center" && (
                        <div
                            className={styles.arrow}
                            style={
                                position.placement === "top" ||
                                    position.placement === "bottom"
                                    ? { left: arrowPosition }
                                    : { top: arrowPosition }
                            }
                            aria-hidden="true"
                        />
                    )}

                {/* WELCOME BANNER */}

                {isWelcome && (
                    <div className={styles.welcomeBanner}>
                        <span className={styles.welcomeBrand}>
                            MakeYourBoard
                        </span>

                        <span className={styles.version}>
                            2.0
                        </span>
                    </div>
                )}

                {/* CLOSE BUTTON */}

                <button
                    type="button"
                    className={`${styles.closeButton} ${isWelcome
                        ? styles.welcomeCloseButton
                        : ""
                        }`}
                    aria-label={tr("close")}
                    onClick={finishTour}
                >
                    <X size={15} strokeWidth={2} />
                </button>

                {/* CONTENT */}

                <div className={styles.content}>
                    <h2
                        id="myb-tour-title"
                        className={styles.title}
                    >
                        {tr(`${step.id}.title`)}
                    </h2>

                    <p
                        id="myb-tour-description"
                        className={styles.description}
                    >
                        {tr(`${step.id}.description`)}
                    </p>

                    {/* FOOTER */}

                    <div className={styles.footer}>
                        <div
                            className={styles.progress}
                            aria-label={`${stepIndex + 1} / ${STEPS.length}`}
                        >
                            {STEPS.map((item, index) => (
                                <span
                                    key={item.id}
                                    className={`${styles.dot} ${index === stepIndex
                                        ? styles.activeDot
                                        : ""
                                        }`}
                                    aria-current={
                                        index === stepIndex
                                            ? "step"
                                            : undefined
                                    }
                                />
                            ))}
                        </div>

                        <div className={styles.buttons}>
                            {isWelcome ? (
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={finishTour}
                                >
                                    {tr("skip")}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.secondaryButton}
                                    onClick={goBack}
                                >
                                    {tr("back")}
                                </button>
                            )}

                            <button
                                ref={nextButtonRef}
                                type="button"
                                className={styles.primaryButton}
                                onClick={goNext}
                            >
                                {isWelcome
                                    ? tr("start")
                                    : isLast
                                        ? tr("finish")
                                        : tr("next")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
