import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Export Your Pedalboard | MakeYourBoard Documentation",
    },
    description:
        "Learn how to export your MakeYourBoard pedalboard as a high-quality PNG or JPG image with a transparent, white or canvas background.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/export",
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

export default function ExportPage() {
    return (
        <DocsShell
            activePage="export"
            breadcrumb="Export"
            toc={[
                {
                    href: "#open-export",
                    label: "Open Export",
                },
                {
                    href: "#board-name",
                    label: "Add a pedalboard name",
                },
                {
                    href: "#background",
                    label: "Choose a background",
                },
                {
                    href: "#preview",
                    label: "Preview your export",
                },
                {
                    href: "#download",
                    label: "Export your pedalboard",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Export Your Pedalboard</h1>

                <p className="docs-intro">
                    Export your completed{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>{" "}
                    as a high-quality image that you can save, share or
                    use as a reference when assembling your real setup.
                </p>

                <p>
                    MakeYourBoard lets you choose the image format and
                    background, add a name to your pedalboard and preview
                    the final result before exporting it.
                </p>
            </section>

            {/* OPEN EXPORT */}
            <section
                id="open-export"
                className="docs-section"
            >
                <h2>Open Export</h2>

                <p>
                    Once your pedalboard layout is ready, open Menu
                    &gt; Export to access the export options.
                </p>

                <p>
                    The export tool creates a high-quality image of your
                    current pedalboard layout.
                </p>
            </section>

            {/* BOARD NAME */}
            <section
                id="board-name"
                className="docs-section"
            >
                <h2>Add a Pedalboard Name</h2>

                <p>
                    You can add a name to your pedalboard before
                    exporting it.
                </p>

                <p>
                    This is useful for identifying different setups,
                    versions or pedalboards when saving and sharing your
                    layouts.
                </p>
            </section>

            {/* BACKGROUND */}
            <section
                id="background"
                className="docs-section"
            >
                <h2>Choose an Export Background</h2>

                <p>
                    MakeYourBoard provides several export options
                    depending on how you want to use the final image.
                </p>

                <h3>Transparent PNG</h3>

                <p>
                    Export your pedalboard as a PNG with a transparent
                    background. This is useful when you want to place
                    the pedalboard image over another background or use
                    it in other visual projects.
                </p>

                <h3>White JPG</h3>

                <p>
                    Export your pedalboard as a JPG with a white
                    background for a simple image that is easy to view,
                    save and share.
                </p>

                <h3>Canvas Background PNG</h3>

                <p>
                    Export your pedalboard as a PNG using the background
                    currently selected for the MakeYourBoard canvas.
                </p>

                <p>
                    The canvas background can be changed in{" "}
                    <DocLink href="/docs/settings">
                        Settings
                    </DocLink>
                    , where you can choose between Neutral, Wood and
                    Aluminium backgrounds.
                </p>
            </section>

            {/* PREVIEW */}
            <section
                id="preview"
                className="docs-section"
            >
                <h2>Preview Your Export</h2>

                <p>
                    A preview of the final image is displayed before
                    export so you can check the pedalboard, its name and
                    the selected background.
                </p>

                <p>
                    Use the preview to make sure everything looks the
                    way you want before creating the final image.
                </p>
            </section>

            {/* DOWNLOAD */}
            <section
                id="download"
                className="docs-section"
            >
                <h2>Export Your Pedalboard</h2>

                <p>
                    Once you are happy with the preview, export the
                    image in your selected format.
                </p>

                <p>
                    The resulting high-quality image can be kept as a
                    reference for your setup or shared with other
                    musicians.
                </p>

                <p>
                    If you are still building your first setup, the{" "}
                    <DocLink href="/docs/getting-started">
                        Getting Started guide
                    </DocLink>{" "}
                    gives you an overview of the main MakeYourBoard
                    tools before export.
                </p>
            </section>
        </DocsShell>
    );
}