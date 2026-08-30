import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Getting Started | MakeYourBoard Documentation",
    },
    description:
        "Learn how to use MakeYourBoard, the free online guitar pedalboard planner. Choose a pedalboard, add pedals, arrange your setup and export your layout.",
    alternates: {
        canonical:
            "https://makeyourboard.com/docs/getting-started",
    },
};

export default function GettingStartedPage() {
    return (
        <DocsShell
            activePage="getting-started"
            breadcrumb="Getting Started"
            toc={[
                {
                    href: "#choose-board",
                    label: "Choose your pedalboard",
                },
                {
                    href: "#add-pedals",
                    label: "Add your pedals",
                },
                {
                    href: "#arrange",
                    label: "Arrange your setup",
                },
                {
                    href: "#power",
                    label: "Add a power supply",
                },
                {
                    href: "#export",
                    label: "Export your pedalboard",
                },
            ]}
        >

            <section className="docs-section">

                <h1>Getting Started</h1>

                <p className="docs-intro">
                    MakeYourBoard is a free online guitar pedalboard
                    planner that helps you build and visualize your
                    setup before assembling it in real life.
                </p>

                <p>
                    Choose your pedalboard, add your pedals and power
                    supply, arrange everything using realistic product
                    dimensions and check that your setup works before
                    putting it together.
                </p>

            </section>

            <section
                id="choose-board"
                className="docs-section"
            >
                <h2>Choose Your Pedalboard</h2>

                <p>
                    Start by opening the pedalboard library and choosing
                    the board you want to use.
                </p>

                <p>
                    MakeYourBoard displays pedalboards using their real
                    dimensions whenever manufacturer specifications are
                    available, allowing you to accurately visualize the
                    usable space.
                </p>
            </section>

            <section
                id="add-pedals"
                className="docs-section"
            >
                <h2>Add Your Pedals</h2>

                <p>
                    Search the pedal library and add your pedals to the
                    canvas. You can move and rotate each pedal until you
                    find the layout that works best for your setup.
                </p>

                <p>
                    If a product is not available in the library, you
                    can also create a custom pedal using your own
                    dimensions.
                </p>
            </section>

            <section
                id="arrange"
                className="docs-section"
            >
                <h2>Arrange Your Setup</h2>

                <p>
                    Drag your pedals around the board to experiment with
                    different layouts.
                </p>

                <p>
                    MakeYourBoard can also display additional clearance
                    around pedals to help you leave enough room for
                    patch cables and connectors.
                </p>
            </section>

            <section
                id="power"
                className="docs-section"
            >
                <h2>Add a Power Supply</h2>

                <p>
                    Add your power supply to the pedalboard and
                    MakeYourBoard can compare its available outputs with
                    the requirements of your pedals.
                </p>

                <p>
                    This helps identify possible voltage, current or
                    output compatibility issues before wiring your real
                    pedalboard.
                </p>
            </section>

            <section
                id="export"
                className="docs-section"
            >
                <h2>Export Your Pedalboard</h2>

                <p>
                    Once you are happy with your layout, use the export
                    tool to create an image of your pedalboard.
                </p>

                <p>
                    You can save the image as a reference or share your
                    setup with other musicians.
                </p>
            </section>

        </DocsShell>
    );
}