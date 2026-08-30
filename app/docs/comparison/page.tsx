import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute:
            "Pedalboard Planner Comparison | MakeYourBoard",
    },
    description:
        "Compare MakeYourBoard with other online pedalboard planners including Pedal Playground, Pedalboard.App, Pedaltrain, RockBoard and Stompbox Garden.",
    alternates: {
        canonical:
            "https://makeyourboard.com/docs/comparison",
    },
};

function renderBadge(type: "yes" | "no") {
    return (
        <span
            className={
                type === "yes"
                    ? "docs-badge docs-badge-yes"
                    : "docs-badge docs-badge-no"
            }
            aria-label={type === "yes" ? "Yes" : "No"}
        >
            {type === "yes" ? "✓" : "✕"}
        </span>
    );
}

export default function ComparisonPage() {
    return (
        <DocsShell
            activePage="comparison"
            breadcrumb="Pedalboard Planner Comparison"
            toc={[
                {
                    href: "#features",
                    label: "Feature Comparison",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>
                    Pedalboard Planner Comparison
                </h1>
            </section>

            {/* TABLEAU */}
            <section
                id="features"
                className="docs-section"
            >
                <div className="docs-table-wrap">
                    <table className="docs-table">

                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>MakeYourBoard</th>
                                <th>Pedal Playground</th>
                                <th>Pedalboard.App</th>
                                <th>Pedaltrain</th>
                                <th>RockBoard</th>
                                <th>Stompbox Garden</th>
                            </tr>
                        </thead>

                        <tbody>

                            {/* FREE TO USE */}
                            <tr>
                                <td>
                                    Free to use
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* NO ACCOUNT */}
                            <tr>
                                <td>
                                    No account required for full use
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* MULTIPLE BRANDS */}
                            <tr>
                                <td>
                                    Boards from multiple brands
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* MULTIPLE BOARDS */}
                            <tr>
                                <td>
                                    Multiple boards in one project
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* POWER */}
                            <tr>
                                <td>
                                    Power compatibility
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* CABLE CLEARANCE */}
                            <tr>
                                <td>
                                    Cable clearance
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* SIGNAL PATH */}
                            <tr>
                                <td>
                                    Signal path
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* CUSTOM GEAR */}
                            <tr>
                                <td>
                                    Custom pedals & boards
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* IMPORT IMAGE */}
                            <tr>
                                <td>
                                    Import your own pedal image
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* PRODUCT RESEARCH */}
                            <tr>
                                <td>
                                    Product research tools
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* RETAILER LINKS */}
                            <tr>
                                <td>
                                    Retailer links
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* ZOOM */}
                            <tr>
                                <td>
                                    Simple canvas zoom
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* BACKGROUND */}
                            <tr>
                                <td>
                                    Change canvas background
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* DARK / LIGHT */}
                            <tr>
                                <td>
                                    Dark / Light mode
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* LANGUAGES */}
                            <tr>
                                <td>
                                    Multiple languages
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* UNITS */}
                            <tr>
                                <td>
                                    Metric / Imperial units
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* PNG EXPORT */}
                            <tr>
                                <td>
                                    PNG export
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                        </tbody>
                    </table>
                </div>

                <p className="docs-note">
                    Features may change over time. This
                    comparison is based on publicly available
                    product information.
                </p>
            </section>

        </DocsShell>
    );
}