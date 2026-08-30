import type { Metadata } from "next";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Getting Started | MakeYourBoard Documentation",
    },
    description:
        "Discover MakeYourBoard, a free online guitar pedalboard planner for building, arranging and checking your pedalboard setup before assembling it in real life.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/getting-started",
    },
};

function DocLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
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

export default function GettingStartedPage() {
    return (
        <DocsShell
            activePage="getting-started"
            breadcrumb="Getting Started"
            toc={[
                {
                    href: "#what-is-makeyourboard",
                    label: "What is MakeYourBoard?",
                },
                {
                    href: "#build",
                    label: "Build your pedalboard",
                },
                {
                    href: "#plan",
                    label: "Plan your layout",
                },
                {
                    href: "#power",
                    label: "Check your power setup",
                },
                {
                    href: "#custom",
                    label: "Add your own gear",
                },
                {
                    href: "#manage",
                    label: "Manage and export",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Getting Started</h1>

                <p className="docs-intro">
                    MakeYourBoard is a free online guitar pedalboard
                    planner designed to help you build, visualize and
                    check your setup before assembling it in real life.
                </p>

                <p>
                    Choose your pedalboard, add your pedals and power
                    supply, arrange everything using realistic product
                    dimensions and make sure your setup has enough space
                    for cables and power connections.
                </p>

                <p>
                    No account is required, so you can start building
                    your pedalboard immediately.
                </p>
            </section>

            {/* WHAT IS MYB */}
            <section
                id="what-is-makeyourboard"
                className="docs-section"
            >
                <h2>What Is MakeYourBoard?</h2>

                <p>
                    MakeYourBoard is a visual planning tool for guitar,
                    bass and effects pedal setups. Its goal is simple:
                    help you see how your gear will fit together before
                    you start mounting pedals and connecting cables.
                </p>

                <p>
                    The library includes thousands of pedals,
                    pedalboards and power supplies with real product
                    dimensions whenever manufacturer specifications are
                    available.
                </p>
            </section>

            {/* BUILD */}
            <section
                id="build"
                className="docs-section"
            >
                <h2>Build Your Pedalboard</h2>

                <p>
                    Start by choosing a{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>
                    , then search the{" "}
                    <DocLink href="/docs/pedals">
                        pedal library
                    </DocLink>{" "}
                    by brand, model or effect type such as overdrive,
                    distortion, fuzz, delay or reverb.
                </p>

                <p>
                    Add your pedals to the canvas and move, rotate or
                    reorder them freely until you find a layout that
                    works for your setup.
                </p>

                <p>
                    Select a pedal or pedalboard to open its information
                    panel and view available descriptions, technical
                    specifications and retailer links.
                </p>
            </section>

            {/* PLAN */}
            <section
                id="plan"
                className="docs-section"
            >
                <h2>Plan Your Layout</h2>

                <p>
                    MakeYourBoard does more than show whether your pedals
                    physically fit on a board. The{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    tool can also help you estimate whether enough space
                    is available around audio jacks and power connectors.
                </p>

                <p>
                    Green clearance areas indicate that no obvious
                    overlap has been detected, while red areas highlight
                    places where another pedal may leave too little room
                    for your cables and connectors.
                </p>
            </section>

            {/* POWER */}
            <section
                id="power"
                className="docs-section"
            >
                <h2>Check Your Power Setup</h2>

                <p>
                    Add a{" "}
                    <DocLink href="/docs/power-supplies">
                        power supply
                    </DocLink>{" "}
                    to your pedalboard and use the Power Supply tool to
                    compare its available outputs with the voltage and
                    current requirements of your pedals.
                </p>

                <p>
                    This can help you identify potential compatibility
                    issues before wiring your real setup.
                </p>
            </section>

            {/* CUSTOM */}
            <section
                id="custom"
                className="docs-section"
            >
                <h2>Add Your Own Gear</h2>

                <p>
                    If the gear you need is not available in the
                    MakeYourBoard library, you can{" "}
                    <DocLink href="/docs/custom-gear">
                        create a custom pedal or pedalboard
                    </DocLink>{" "}
                    using your own dimensions and specifications.
                </p>

                <p>
                    You can also{" "}
                    <DocLink href="/docs/import-pedal">
                        import your own pedal image
                    </DocLink>{" "}
                    and define its name, dimensions, voltage and current
                    draw before adding it to the canvas.
                </p>
            </section>

            {/* MANAGE */}
            <section
                id="manage"
                className="docs-section"
            >
                <h2>Manage and Export Your Setup</h2>

                <p>
                    You can create and manage up to five separate
                    pedalboards from Menu &gt; Pedalboards, making it
                    easy to work on different rigs or different versions
                    of the same setup.
                </p>

                <p>
                    When your pedalboard is ready, you can{" "}
                    <DocLink href="/docs/export">
                        export it as a high-quality image
                    </DocLink>{" "}
                    with a transparent background, white background or
                    the background currently selected on the canvas.
                </p>

                <p>
                    The{" "}
                    <DocLink href="/docs/settings">
                        Settings
                    </DocLink>{" "}
                    also let you choose between metric and imperial
                    units, Light and Dark mode, several interface
                    languages and different canvas backgrounds.
                </p>
            </section>
        </DocsShell>
    );
}