import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";
import {
    RotateCw,
    ArrowUp,
    ArrowDown,
    Trash2,
} from "lucide-react";

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
                    a pedal by brand, model or effect type (such as
                    overdrive, delay, reverb...).
                    Select a pedal from the results to add it directly
                    to the canvas. Recently added pedals are displayed
                    below the search bar so you can also discover the
                    latest additions to the MakeYourBoard library.
                    If you cannot find a pedal, you can create your own{" "}
                    <DocLink href="/docs/custom-gear">
                        custom pedal
                    </DocLink>{" "}
                    or{" "}
                    <DocLink href="/docs/import-pedal">
                        import
                    </DocLink>{" "}
                    your own pedal image.
                </p>

                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "12px",
                        marginTop: "28px",
                        flexWrap: "wrap",
                    }}
                >
                    <img
                        src="/docs/pedals/pedals-search-pedal.webp"
                        alt="Search a pedal by brand or model in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-search-effect.webp"
                        alt="Search guitar pedals by effect type in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-custom-pedal.webp"
                        alt="Create a custom pedal in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-import-pedal.webp"
                        alt="Import your own pedal image in MakeYourBoard"
                        style={{
                            width: "190px",
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
                <h2>Arrange Your Pedals</h2>

                <p>
                    Drag pedals freely around the canvas to build your
                    layout. MakeYourBoard uses the real dimensions of
                    each pedal whenever manufacturer specifications are
                    available.
                    You can also use{" "}
                    <DocLink href="/docs/cable-clearance">
                        Cable Clearance
                    </DocLink>{" "}
                    to check whether enough space is available around
                    your pedals for audio jacks, patch cables and power
                    connectors.
                </p>

                <p>

                </p>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "10px",
                        margin: "32px 0 10px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>
                        Rotate a pedal
                    </h3>

                    <div
                        style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "10px",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <RotateCw size={18} strokeWidth={2} />
                    </div>
                </div>

                <p>
                    Select a pedal and use the rotate button to change its orientation on the pedalboard.
                </p>
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "12px",
                        marginTop: "28px",
                        flexWrap: "wrap",
                    }}
                >
                    <img
                        src="/docs/pedals/pedals-rotate-up.webp"
                        alt="Pedal rotated upward in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-rotate-right.webp"
                        alt="Pedal rotated right in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-rotate-down.webp"
                        alt="Pedal rotated downward in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-rotate-left.webp"
                        alt="Pedal rotated left in MakeYourBoard"
                        style={{
                            width: "190px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "10px",
                        margin: "32px 0 10px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>
                        Move to front or back
                    </h3>

                    <div
                        style={{
                            display: "flex",
                            gap: "6px",
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "10px",
                                background: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ArrowUp size={18} strokeWidth={2} />
                        </div>

                        <div
                            style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "10px",
                                background: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ArrowDown size={18} strokeWidth={2} />
                        </div>
                    </div>
                </div>

                <p>
                    Pedals can be moved to the foreground or background
                    when items overlap, giving you control over their
                    stacking order on the canvas.
                </p>
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "16px",
                        marginTop: "28px",
                        flexWrap: "wrap",
                    }}
                >
                    <img
                        src="/docs/pedals/pedals-move-front.webp"
                        alt="Move a pedal to the front in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />

                    <img
                        src="/docs/pedals/pedals-move-back.webp"
                        alt="Move a pedal to the back in MakeYourBoard"
                        style={{
                            width: "250px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            borderRadius: "10px",
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "10px",
                        margin: "32px 0 10px",
                    }}
                >
                    <h3 style={{ margin: 0 }}>
                        Delete a pedal
                    </h3>

                    <div
                        style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "10px",
                            background: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Trash2 size={18} strokeWidth={2} />
                    </div>
                </div>

                <p>
                    Select a pedal and use the delete action button to remove
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
                    Technical information can include dimensions,
                    weight, voltage, current draw, manual... Voltage and current draw
                    can also be used to check{" "}
                    <DocLink href="/docs/power-supplies">
                        power supply compatibility
                    </DocLink>{" "}
                    for your setup.
                    When retailer links are available for a pedal,
                    MakeYourBoard provides direct access to online
                    stores where you can find the product.
                    Retailer availability may vary depending on the
                    pedal and your location.
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
                        src="/docs/pedals/pedals-infos2.webp"
                        alt="Pedal information panel in MakeYourBoard"
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

        </DocsShell>
    );
}