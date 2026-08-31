import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Pedalboards | MakeYourBoard Documentation",
    },
    description:
        "Learn how to add, arrange, rotate and manage pedalboards in MakeYourBoard, view board specifications and create up to five separate pedalboard projects.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/pedalboards",
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

export default function PedalboardsPage() {
    return (
        <DocsShell
            activePage="pedalboards"
            breadcrumb="Pedalboards"
            toc={[
                {
                    href: "#add-board",
                    label: "Add a pedalboard",
                },
                {
                    href: "#arrange",
                    label: "Arrange your pedalboard",
                },
                {
                    href: "#board-info",
                    label: "Pedalboard specifications",
                },
                {
                    href: "#multiple-boards",
                    label: "Manage multiple pedalboards",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Pedalboards</h1>

                <p className="docs-intro">
                    Choose a pedalboard from the MakeYourBoard library
                    and build your setup using realistic product
                    dimensions.
                    Add your{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>{" "}
                    to the board, then move, rotate and arrange
                    everything freely on the canvas while keeping useful
                    product information and technical specifications
                    close at hand.
                </p>
            </section>

            {/* ADD BOARD */}
            <section
                id="add-board"
                className="docs-section"
            >
                <h2>Add a Pedalboard</h2>

                <p>
                    Open the pedalboard library from the left sidebar
                    and search for a board by brand or model.
                    Select a pedalboard from the results to add it to
                    your setup.
                    If the board you need is not available in the
                    library, you can{" "}
                    <DocLink href="/docs/custom-gear">
                        create your own custom pedalboard
                    </DocLink>{" "}
                    using its real width, depth and preferred material
                    style.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        gap: "20px",
                        marginTop: "28px",
                        flexWrap: "wrap",
                    }}
                >
                    <img
                        src="/docs/pedalboards/pedalboards-add.webp"
                        alt="Add a pedalboard from the MakeYourBoard library"
                        style={{
                            width: "320px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedalboards/pedalboards-custom.webp"
                        alt="Create a custom pedalboard in MakeYourBoard"
                        style={{
                            width: "320px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* ARRANGE */}
            <section
                id="arrange"
                className="docs-section"
            >
                <h2>Arrange Your Pedalboard</h2>

                <p>
                    Drag a pedalboard around the canvas to position it
                    exactly where you want it, then arrange your pedals
                    on top of it to build your layout.
                    Pedals and power supplies can also be moved behind
                    the pedalboard when needed. This is useful for
                    representing gear mounted underneath the board,
                    such as a power supply or other accessories.
                </p>

                <p>
                    Once your pedals are positioned, you can use{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    to check whether enough room is available around
                    their audio jacks and power connectors. Clearance
                    conflicts are only checked between items on the same
                    layer, so an item placed underneath the pedalboard
                    will not interfere with the clearance of a pedal
                    positioned above it.
                </p>

                <div
                    style={{
                        width: "100%",
                        maxWidth: "680px",
                        margin: "28px auto 0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <img
                        src="/docs/pedalboards/pedalboards-move-front.webp"
                        alt="Move an item in front of a pedalboard in MakeYourBoard"
                        style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedalboards/pedalboards-move-back.webp"
                        alt="Move a power supply or pedal behind a pedalboard in MakeYourBoard"
                        style={{
                            width: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* BOARD SPECIFICATIONS */}
            <section
                id="board-info"
                className="docs-section"
            >
                <h2>Pedalboard Specifications</h2>

                <p>
                    Select a pedalboard to open its specifications panel.
                    Depending on the available product data, you can view
                    its dimensions, weight, material and other useful
                    technical details. When retailer links are available,
                    MakeYourBoard also provides direct access to online
                    stores where you can find the selected pedalboard.
                    Retailer availability may vary depending on the product
                    and your location.
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
                        src="/docs/pedalboards/pedalboards-infos.webp"
                        alt="Pedalboard specifications and retailer links in MakeYourBoard"
                        style={{
                            width: "320px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>
            </section>

            {/* MULTIPLE BOARDS */}
            <section
                id="multiple-boards"
                className="docs-section"
            >
                <h2>Manage Multiple Pedalboards</h2>

                <p>
                    MakeYourBoard lets you manage up to 7 separate
                    pedalboards. Open Menu &gt; Pedalboards to create a new
                    pedalboard tab, switch between your different
                    setups, rename them or delete a project you no
                    longer need.
                    Each tab keeps its own pedalboard layout, allowing
                    you to work on several setups without mixing them
                    together.
                    When a setup is complete, you can{" "}
                    <DocLink href="/docs/export">
                        export your pedalboard
                    </DocLink>{" "}
                    as a high-quality image to save it as a reference or share it with other
                    musicians.
                </p>

                <p>

                </p>

                <p>

                </p>
            </section>
        </DocsShell>
    );
}