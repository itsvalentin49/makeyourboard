import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Settings | MakeYourBoard Documentation",
    },
    description:
        "Learn how to customize MakeYourBoard settings including language, light and dark mode, metric or imperial units and canvas backgrounds.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/settings",
    },
};

function DocLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link href={href}>
            <span
                style={{
                    color: "#2563eb",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    fontWeight: 650,
                }}
            >
                {children}
            </span>
        </Link>
    );
}

export default function SettingsPage() {
    return (
        <DocsShell
            activePage="settings"
            breadcrumb="Settings"
            toc={[
                {
                    href: "#open-settings",
                    label: "Open Settings",
                },
                {
                    href: "#language",
                    label: "Language",
                },
                {
                    href: "#appearance",
                    label: "Light and dark mode",
                },
                {
                    href: "#units",
                    label: "Measurement units",
                },
                {
                    href: "#background",
                    label: "Canvas background",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Settings</h1>

                <p className="docs-intro">
                    Customize MakeYourBoard to match your language,
                    preferred measurement system, display mode and
                    workspace appearance.
                </p>

                <p>
                    These settings let you adapt the MakeYourBoard pedalboard planner MakeYourBoard pedalboard planner to the way you prefer to work.
                </p>
            </section>

            {/* OPEN SETTINGS */}
            <section
                id="open-settings"
                className="docs-section"
            >
                <h2>Open Settings</h2>

                <p>
                    Open Menu &gt; Settings to access the available
                    customization options while working on your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>
                    .
                </p>
            </section>

            {/* LANGUAGE */}
            <section
                id="language"
                className="docs-section"
            >
                <h2>Language</h2>

                <p>
                    MakeYourBoard is available in English, Chinese,
                    Spanish, French, Portuguese, German and Italian.
                </p>

                <p>
                    Select your preferred language in Settings to update
                    the MakeYourBoard interface.
                </p>
            </section>

            {/* APPEARANCE */}
            <section
                id="appearance"
                className="docs-section"
            >
                <h2>Light and Dark Mode</h2>

                <p>
                    Choose between Light and Dark mode depending on your
                    preference and working environment.
                </p>

                <p>
                    Light mode provides a brighter interface, while Dark
                    mode reduces the overall brightness of the interface
                    when working in darker environments.
                </p>
            </section>

            {/* UNITS */}
            <section
                id="units"
                className="docs-section"
            >
                <h2>Measurement Units</h2>

                <p>
                    MakeYourBoard supports both metric and imperial
                    measurement systems.
                </p>

                <p>
                    Choose Metric to display dimensions in millimeters
                    and weights using metric units, or Imperial to use
                    the measurement system you are more familiar with.
                </p>
            </section>

            {/* BACKGROUND */}
            <section
                id="background"
                className="docs-section"
            >
                <h2>Canvas Background</h2>

                <p>
                    Choose the background displayed behind your
                    pedalboard on the canvas.
                </p>

                <p>
                    The default Neutral background provides a simple
                    workspace, while Wood and Aluminium backgrounds
                    offer alternative visual styles.
                </p>

                <p>
                    The selected canvas background can also be included
                    when you{" "}
                    <DocLink href="/docs/export">
                        export your pedalboard
                    </DocLink>{" "}
                    as a PNG image.
                </p>
            </section>
        </DocsShell>
    );
}