import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Power Supplies | MakeYourBoard Documentation",
    },
    description:
        "Learn how to add and manage pedalboard power supplies in MakeYourBoard, view technical specifications and check power compatibility with your pedals.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/power-supplies",
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

export default function PowerSuppliesPage() {
    return (
        <DocsShell
            activePage="power-supplies"
            breadcrumb="Power Supplies"
            toc={[
                {
                    href: "#add-power-supply",
                    label: "Add a power supply",
                },
                {
                    href: "#arrange",
                    label: "Arrange your power supply",
                },
                {
                    href: "#power-info",
                    label: "Power supply information",
                },
                {
                    href: "#compatibility",
                    label: "Power compatibility",
                },
                {
                    href: "#retailers",
                    label: "Retailer links",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Power Supplies</h1>

                <p className="docs-intro">
                    Add a pedalboard power supply to your setup,
                    position it on the canvas and check whether it can
                    safely power your pedals.
                </p>

                <p>
                    MakeYourBoard combines realistic product dimensions
                    with voltage and current information to help you
                    plan both the physical layout of your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>{" "}
                    and the power requirements of your{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>
                    .
                </p>
            </section>

            {/* ADD POWER SUPPLY */}
            <section
                id="add-power-supply"
                className="docs-section"
            >
                <h2>Add a Power Supply</h2>

                <p>
                    Open the power supply library from the left sidebar
                    and search for a power supply by brand or model.
                </p>

                <p>
                    Select a power supply from the results to add it
                    directly to the canvas. MakeYourBoard uses the real
                    dimensions of each product whenever manufacturer
                    specifications are available.
                </p>
            </section>

            {/* ARRANGE */}
            <section
                id="arrange"
                className="docs-section"
            >
                <h2>Arrange Your Power Supply</h2>

                <p>
                    Drag the power supply freely around the canvas to
                    position it where you want it in your setup.
                </p>

                <p>
                    When arranging the rest of your setup, you can also
                    use{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    to check the space available around your pedals for
                    audio jacks, patch cables and power connectors.
                </p>

                <h3>Rotate a power supply</h3>

                <p>
                    Select the power supply and use the rotate action
                    to change its orientation.
                </p>

                <h3>Move to front or back</h3>

                <p>
                    Power supplies can be moved to the foreground or
                    background when items overlap, allowing you to
                    control their stacking order on the canvas.
                </p>

                <h3>Delete a power supply</h3>

                <p>
                    Select the power supply and use the delete action
                    to remove it from your current setup.
                </p>
            </section>

            {/* POWER INFO */}
            <section
                id="power-info"
                className="docs-section"
            >
                <h2>Power Supply Information</h2>

                <p>
                    Select a power supply to access its information
                    panel. Depending on the available product data,
                    you can view its description and technical
                    specifications.
                </p>

                <p>
                    Technical information can include dimensions,
                    weight, available outputs, supported voltages and
                    the maximum current available from each output.
                </p>
            </section>

            {/* COMPATIBILITY */}
            <section
                id="compatibility"
                className="docs-section"
            >
                <h2>Check Power Compatibility</h2>

                <p>
                    Once a power supply and{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>{" "}
                    have been added to your setup, open Menu &gt; Power
                    Supply to check their compatibility.
                </p>

                <p>
                    MakeYourBoard compares the voltage and current
                    requirements of your pedals with the available
                    outputs of the selected power supply.
                </p>

                <p>
                    Compatible pedals are identified as valid, while
                    potential voltage, current or output compatibility
                    issues are highlighted so you can review your setup
                    before wiring the real pedalboard.
                </p>

                <p>
                    Power requirements can also be defined when you{" "}
                    <DocLink href="/docs/custom-gear">
                        create a custom pedal
                    </DocLink>{" "}
                    or{" "}
                    <DocLink href="/docs/import-pedal">
                        import your own pedal
                    </DocLink>
                    , allowing these pedals to be included in your power
                    setup.
                </p>
            </section>

            {/* RETAILERS */}
            <section
                id="retailers"
                className="docs-section"
            >
                <h2>Retailer Links</h2>

                <p>
                    When retailer links are available, MakeYourBoard
                    provides direct access to online stores where you
                    can find the selected power supply.
                </p>

                <p>
                    Retailer availability may vary depending on the
                    product and your location.
                </p>
            </section>
        </DocsShell>
    );
}