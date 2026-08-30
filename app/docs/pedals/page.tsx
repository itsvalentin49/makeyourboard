import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Pedals | MakeYourBoard Documentation",
    },
    description:
        "Learn how to add, search, arrange, rotate and manage guitar pedals in MakeYourBoard, view pedal specifications and find retailer links.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/pedals",
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

export default function PedalsPage() {
    return (
        <DocsShell
            activePage="pedals"
            breadcrumb="Pedals"
            toc={[
                {
                    href: "#add-pedal",
                    label: "Add a pedal",
                },
                {
                    href: "#arrange",
                    label: "Arrange your pedals",
                },
                {
                    href: "#pedal-info",
                    label: "Pedal information",
                },
                {
                    href: "#retailers",
                    label: "Retailer links",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Pedals</h1>

                <p className="docs-intro">
                    Search thousands of guitar pedals, add them to your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>{" "}
                    and arrange your setup using real product dimensions.
                </p>

                <p>
                    MakeYourBoard lets you quickly position, rotate and
                    organize pedals on the canvas while keeping useful
                    product information and specifications close at hand.
                </p>
            </section>

            {/* ADD A PEDAL */}
            <section
                id="add-pedal"
                className="docs-section"
            >
                <h2>Add a Pedal</h2>

                <p>
                    Use the pedal search bar in the left sidebar to find
                    a pedal by brand, model or effect type such as
                    overdrive, distortion, fuzz, delay, reverb or chorus.
                </p>

                <p>
                    Select a pedal from the results to add it directly
                    to the canvas. Recently added pedals are displayed
                    below the search bar so you can also discover the
                    latest additions to the MakeYourBoard library.
                </p>

                <p>
                    If you cannot find a pedal, you can{" "}
                    <DocLink href="/docs/custom-gear">
                        create your own custom pedal
                    </DocLink>{" "}
                    or{" "}
                    <DocLink href="/docs/import-pedal">
                        import your own pedal image
                    </DocLink>
                    .
                </p>
            </section>

            {/* ARRANGE */}
            <section
                id="arrange"
                className="docs-section"
            >
                <h2>Arrange Your Pedals</h2>

                <p>
                    Drag pedals freely around the canvas to build your
                    layout. MakeYourBoard uses the real dimensions of
                    each pedal whenever manufacturer specifications are
                    available.
                </p>

                <p>
                    You can also use{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    to check whether enough space is available around
                    your pedals for audio jacks, patch cables and power
                    connectors.
                </p>

                <h3>Rotate a pedal</h3>

                <p>
                    Select a pedal and use the rotate action to change
                    its orientation on the pedalboard.
                </p>

                <h3>Move to front or back</h3>

                <p>
                    Pedals can be moved to the foreground or background
                    when items overlap, giving you control over their
                    stacking order on the canvas.
                </p>

                <h3>Delete a pedal</h3>

                <p>
                    Select a pedal and use the delete action to remove
                    it from your current pedalboard.
                </p>
            </section>

            {/* PEDAL INFO */}
            <section
                id="pedal-info"
                className="docs-section"
            >
                <h2>Pedal Information</h2>

                <p>
                    Select a pedal to access its information panel.
                    Depending on the available product data, you can
                    view a description and technical specifications
                    for the selected pedal.
                </p>

                <p>
                    Technical information can include dimensions,
                    weight, power requirements, current draw, circuit
                    type and bypass type. Voltage and current information
                    can also be used to{" "}
                    <DocLink href="/docs/power-supplies">
                        check power supply compatibility
                    </DocLink>{" "}
                    for your setup.
                </p>
            </section>

            {/* RETAILERS */}
            <section
                id="retailers"
                className="docs-section"
            >
                <h2>Retailer Links</h2>

                <p>
                    When retailer links are available for a pedal,
                    MakeYourBoard provides direct access to online
                    stores where you can find the product.
                </p>

                <p>
                    Retailer availability may vary depending on the
                    pedal and your location.
                </p>
            </section>
        </DocsShell>
    );
}