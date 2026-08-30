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
                    href: "#cable",
                    label: "Cable Clearance",
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
                    href: "#export",
                    label: "Export your Setup",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Getting Started</h1>
            </section>

            {/* WHAT IS MYB */}
            <section
                id="what-is-makeyourboard"
                className="docs-section"
            >
                <h2>What Is MakeYourBoard?</h2>

                <p>
                    MakeYourBoard is a free pedalboard planner for guitar
                    and bass setups. Its goal is simple: help you see how
                    your gear will fit together before you start mounting
                    pedals and connecting cables. The library includes
                    thousands of pedals, pedalboards and power supplies
                    with real product dimensions. Choose your pedalboard,
                    add your pedals and power supply, arrange everything
                    using realistic product dimensions and make sure your
                    setup has enough space for cables and power
                    connections. No account is required, so you can start
                    building your pedalboard immediately!
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
                    distortion, fuzz, delay or reverb. Add your pedals
                    to the canvas and move, rotate or reorder them freely
                    until you find a layout that works for your setup.
                    Select a pedal or pedalboard to open its information
                    panel and view available descriptions, technical
                    specifications and retailer links.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "16px",
                        marginTop: "28px",
                    }}
                >
                    <img
                        src="/docs/getting-started/build1-v3.webp"
                        alt="Choose a pedalboard in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/getting-started/build2-v3.webp"
                        alt="Search for pedals in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* CABLE CLEARANCE */}
            <section
                id="cable"
                className="docs-section"
            >
                <h2>Cable Clearance</h2>

                <p>
                    MakeYourBoard does more than show whether your pedals
                    physically fit on a board. The{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    tool can also help you estimate whether enough space
                    is available around audio jacks and power connectors.
                    Green clearance areas indicate that no obvious
                    overlap has been detected, while red areas highlight
                    places where another pedal may leave too little room
                    for your cables and connectors.
                </p>

                <div
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        margin: "28px auto 0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <img
                        src="/docs/getting-started/cable-clearance-ko.webp"
                        alt="Cable clearance warning in MakeYourBoard"
                        style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/getting-started/cable-clearance-ok.webp"
                        alt="Compatible cable clearance in MakeYourBoard"
                        style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
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
                    current requirements of your pedals. This can help
                    you identify potential compatibility issues before
                    wiring your real setup.
                </p>

                <p>
                    MakeYourBoard also provides recommendations based on
                    your setup. It can suggest which power supply outputs
                    to use for each pedal, provide useful wiring tips,
                    warn you when a more powerful power supply or
                    additional outputs may be required, or simply confirm
                    that your complete power setup is compatible.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        marginTop: "28px",
                    }}
                >
                    <img
                        src="/docs/getting-started/power-setup1.webp"
                        alt="Pedalboard power compatibility check in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/getting-started/power-setup2-v2.webp"
                        alt="Power supply output recommendations in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/getting-started/power-setup4.webp"
                        alt="Compatible pedalboard power setup in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* CUSTOM */}
            <section
                id="custom"
                className="docs-section"
            >
                <h2>Add Your Own Gear</h2>

                <p>
                    If the gear you need is not available in the
                    MakeYourBoard library, you can create a{" "}
                    <DocLink href="/docs/custom-gear">
                        custom pedal
                    </DocLink>{" "}
                    or pedalboard using your own dimensions and
                    specifications. You can also{" "}
                    <DocLink href="/docs/import-pedal">
                        import
                    </DocLink>{" "}
                    your own pedal image and define its name, dimensions,
                    voltage and current draw before adding it to the
                    canvas.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "20px",
                        marginTop: "28px",
                        flexWrap: "wrap",
                    }}
                >
                    <img
                        src="/docs/getting-started/custom-pedal2.webp"
                        alt="Create a custom pedal in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/getting-started/custom-board.webp"
                        alt="Create a custom pedalboard in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* EXPORT */}
            <section
                id="export"
                className="docs-section"
            >
                <h2>Export Your Setup</h2>

                <p>
                    When your pedalboard is ready, you can{" "}
                    <DocLink href="/docs/export">
                        export your setup
                    </DocLink>{" "}
                    as a high-quality image. Choose between a transparent
                    background, a white background or the background currently
                    selected on the MakeYourBoard canvas.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "28px",
                    }}
                >
                    <img
                        src="/docs/getting-started/export-board.webp"
                        alt="Export a pedalboard setup from MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

        </DocsShell>
    );
}