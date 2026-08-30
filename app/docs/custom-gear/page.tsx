import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Custom Gear | MakeYourBoard Documentation",
    },
    description:
        "Learn how to create custom pedals and pedalboards in MakeYourBoard using your own dimensions, colors, materials, jack positions and power requirements.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/custom-gear",
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

export default function CustomGearPage() {
    return (
        <DocsShell
            activePage="custom-gear"
            breadcrumb="Custom Gear"
            toc={[
                {
                    href: "#custom-pedal",
                    label: "Create a custom pedal",
                },
                {
                    href: "#pedal-jacks",
                    label: "Jacks and power",
                },
                {
                    href: "#custom-board",
                    label: "Create a custom pedalboard",
                },
                {
                    href: "#preview",
                    label: "Live preview",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Custom Gear</h1>

                <p className="docs-intro">
                    Create your own custom pedals and pedalboards when
                    the product you need is not available in the
                    MakeYourBoard library.
                </p>

                <p>
                    Custom gear can be configured using your own
                    dimensions and specifications, helping you keep
                    your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>{" "}
                    layout as accurate as possible.
                </p>
            </section>

            {/* CUSTOM PEDAL */}
            <section
                id="custom-pedal"
                className="docs-section"
            >
                <h2>Create a Custom Pedal</h2>

                <p>
                    Open the Custom section from the left sidebar and
                    choose the pedal option to create your own pedal.
                </p>

                <p>
                    Enter a name and define the width and depth of the
                    pedal using the real dimensions of your product.
                </p>

                <p>
                    You can also choose a color so the custom pedal is
                    easy to identify on the canvas.
                </p>

                <p>
                    If you prefer to use an actual image of the pedal,
                    you can instead{" "}
                    <DocLink href="/docs/import-pedal">
                        import your own pedal image
                    </DocLink>
                    .
                </p>

                <h3>Power requirements</h3>

                <p>
                    Define the pedal voltage and current draw so
                    MakeYourBoard can take its power requirements into
                    account when{" "}
                    <DocLink href="/docs/power-supplies">
                        checking power supply compatibility
                    </DocLink>
                    .
                </p>
            </section>

            {/* JACKS */}
            <section
                id="pedal-jacks"
                className="docs-section"
            >
                <h2>Jacks and Power Connector Position</h2>

                <p>
                    Custom pedals can include the position of their
                    audio jacks and power connector.
                </p>

                <p>
                    These positions are used by MakeYourBoard to
                    estimate the additional space required around the
                    pedal for patch cables, connectors and the power
                    cable.
                </p>

                <p>
                    This allows custom pedals to work with the{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    tool, helping you check whether enough space is
                    available around the pedal for its connections.
                </p>
            </section>

            {/* CUSTOM BOARD */}
            <section
                id="custom-board"
                className="docs-section"
            >
                <h2>Create a Custom Pedalboard</h2>

                <p>
                    Choose the pedalboard option in the Custom section
                    to create a board using your own dimensions.
                </p>

                <p>
                    Enter the width and depth of the pedalboard, then
                    choose the appearance that best matches your real
                    board.
                </p>

                <p>
                    Available material styles include black, wood and
                    aluminium.
                </p>

                <p>
                    The custom pedalboard can then be added to the
                    canvas and used like any other{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>{" "}
                    in MakeYourBoard.
                </p>
            </section>

            {/* PREVIEW */}
            <section
                id="preview"
                className="docs-section"
            >
                <h2>Live Preview</h2>

                <p>
                    A preview is displayed while you configure custom
                    gear so you can immediately see the proportions
                    and appearance of the item you are creating.
                </p>

                <p>
                    This makes it easier to check your dimensions and
                    settings before adding the custom pedal or
                    pedalboard to the canvas.
                </p>

                <p>
                    Once added, custom pedals can be positioned and
                    managed alongside the other{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>{" "}
                    in your setup.
                </p>
            </section>
        </DocsShell>
    );
}