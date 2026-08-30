import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute:
            "Pedalboard Planner Comparison | MakeYourBoard",
    },
    description:
        "Compare MakeYourBoard with other online pedalboard planners including Pedal Playground, Pedalboard.App, Pedaltrain and RockBoard.",
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

                        <colgroup>
                            <col className="docs-col-feature" />
                            <col className="docs-col-site" />
                            <col className="docs-col-site" />
                            <col className="docs-col-site" />
                            <col className="docs-col-site" />
                            <col className="docs-col-site" />
                        </colgroup>

                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>MakeYourBoard</th>
                                <th>Pedal Playground</th>
                                <th>Pedalboard.App</th>
                                <th>Pedaltrain</th>
                                <th>RockBoard</th>
                            </tr>
                        </thead>

                        <tbody>


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
                            </tr>

                            {/* EASY TO USE */}
                            <tr>
                                <td>
                                    Easy to use
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
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
                                <td>{renderBadge("no")}</td>
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
                                <td>{renderBadge("no")}</td>
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
                                <td>{renderBadge("yes")}</td>
                            </tr>

                            {/* RETAILER LINKS */}
                            <tr>
                                <td>
                                    Retailer links
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* ZOOM */}
                            <tr>
                                <td>
                                    Easy zoom & drag
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("yes")}</td>
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
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* UNITS */}
                            <tr>
                                <td>
                                    Metric / Imperial units
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                                <td>{renderBadge("no")}</td>
                            </tr>

                            {/* PNG EXPORT */}
                            <tr>
                                <td>
                                    Hight quality PNG export
                                </td>

                                <td>{renderBadge("yes")}</td>
                                <td>{renderBadge("no")}</td>
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