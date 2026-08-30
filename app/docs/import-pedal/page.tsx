import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Import a Pedal | MakeYourBoard Documentation",
    },
    description:
        "Learn how to import your own guitar pedal image into MakeYourBoard and define its dimensions, voltage and current draw.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/import-pedal",
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

export default function ImportPedalPage() {
    return (
        <DocsShell
            activePage="import-pedal"
            breadcrumb="Import a Pedal"
            toc={[
                {
                    href: "#open-import",
                    label: "Open Import",
                },
                {
                    href: "#choose-image",
                    label: "Choose an image",
                },
                {
                    href: "#pedal-details",
                    label: "Enter pedal details",
                },
                {
                    href: "#requirements",
                    label: "Image requirements",
                },
                {
                    href: "#preview",
                    label: "Preview your pedal",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Import a Pedal</h1>

                <p className="docs-intro">
                    If a pedal is not available in the MakeYourBoard {" "}
                    <DocLink href="/docs/pedals">
                        pedal library
                    </DocLink>
                    , you can import your own image and add it directly
                    to your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>
                    .
                </p>

                <p>
                    Define the pedal&apos;s real dimensions and power
                    requirements so the imported pedal can be positioned
                    accurately and included in your pedalboard planning.
                </p>
            </section>

            {/* OPEN IMPORT */}
            <section
                id="open-import"
                className="docs-section"
            >
                <h2>Open Import</h2>

                <p>
                    Open the Custom section in the left sidebar and
                    select the Import tab.
                </p>

                <p>
                    The Import tool allows you to create a pedal using
                    your own image instead of one from the MakeYourBoard
                    library.
                </p>

                <p>
                    If you do not need to use a product image, you can
                    also create a{" "}
                    <DocLink href="/docs/custom-gear">
                        custom pedal
                    </DocLink>{" "}
                    using your own dimensions and specifications.
                </p>
            </section>

            {/* CHOOSE IMAGE */}
            <section
                id="choose-image"
                className="docs-section"
            >
                <h2>Choose an Image</h2>

                <p>
                    Click Choose an Image and select a picture of the
                    pedal from your device.
                </p>

                <p>
                    For the best result, use a clear top-down image of
                    the pedal with as little empty space around it as
                    possible.
                </p>
            </section>

            {/* DETAILS */}
            <section
                id="pedal-details"
                className="docs-section"
            >
                <h2>Enter the Pedal Details</h2>

                <p>
                    Give the pedal a name, then enter its real width and
                    depth so MakeYourBoard can display it at the correct
                    scale on the canvas.
                </p>

                <p>
                    You can also enter its voltage and current draw in
                    milliamps. This information allows the imported
                    pedal to be taken into account when checking your{" "}
                    <DocLink href="/docs/power-supplies">
                        power supply setup
                    </DocLink>
                    .
                </p>
            </section>

            {/* REQUIREMENTS */}
            <section
                id="requirements"
                className="docs-section"
            >
                <h2>Image and Size Requirements</h2>

                <p>
                    MakeYourBoard accepts PNG, JPG and WEBP images.
                </p>

                <p>
                    The maximum image file size is 300 KB.
                </p>

                <p>
                    Pedal dimensions must be between 30 mm and 500 mm.
                </p>
            </section>

            {/* PREVIEW */}
            <section
                id="preview"
                className="docs-section"
            >
                <h2>Preview Your Pedal</h2>

                <p>
                    A preview is displayed while you configure the
                    imported pedal, allowing you to check the image,
                    proportions and dimensions before adding it to the
                    canvas.
                </p>

                <p>
                    Once everything looks correct, add the pedal to your
                    setup and position it alongside the other{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>{" "}
                    on your pedalboard.
                </p>
            </section>
        </DocsShell>
    );
}