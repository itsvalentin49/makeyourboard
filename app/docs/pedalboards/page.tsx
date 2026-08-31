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
                    label: "Pedalboard information",
                },
                {
                    href: "#retailers",
                    label: "Retailer links",
                },
                {
                    href: "#multiple-boards",
                    label: "Multiple pedalboards",
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
                </p>

                <p>
                    Once your pedals are positioned, you can use{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    to check whether enough room is available around
                    their audio jacks and power connectors.
                </p>

                <h3>Rotate a pedalboard</h3>

                <p>
                    Select a pedalboard and use the rotate action to
                    change its orientation.
                </p>

                <h3>Move to front or back</h3>

                <p>
                    Pedalboards can be moved to the foreground or
                    background when several items overlap on the canvas.
                </p>

                <h3>Delete a pedalboard</h3>

                <p>
                    Select a pedalboard and use the delete action to
                    remove it from the current setup.
                </p>
            </section>

            {/* BOARD INFO */}
            <section
                id="board-info"
                className="docs-section"
            >
                <h2>Pedalboard Information</h2>

                <p>
                    Select a pedalboard to access its information panel.
                    Depending on the available product data, you can
                    view its description and technical specifications.
                </p>

                <p>
                    Technical information can include dimensions,
                    weight, material and other useful product details.
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
                    can find the selected pedalboard.
                </p>

                <p>
                    Retailer availability may vary depending on the
                    product and your location.
                </p>
            </section>

            {/* MULTIPLE BOARDS */}
            <section
                id="multiple-boards"
                className="docs-section"
            >
                <h2>Manage Multiple Pedalboards</h2>

                <p>
                    MakeYourBoard lets you manage up to five separate
                    pedalboards.
                </p>

                <p>
                    Open Menu &gt; Pedalboards to create a new
                    pedalboard tab, switch between your different
                    setups, rename them or delete a project you no
                    longer need.
                </p>

                <p>
                    Each tab keeps its own pedalboard layout, allowing
                    you to work on several setups without mixing them
                    together.
                </p>

                <p>
                    When a setup is complete, you can{" "}
                    <DocLink href="/docs/export">
                        export your pedalboard
                    </DocLink>{" "}
                    as a high-quality image to save it as a reference or share it with other
                    musicians.
                </p>
            </section>
        </DocsShell>
    );
}