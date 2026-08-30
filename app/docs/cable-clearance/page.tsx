import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "Cable Clearance | MakeYourBoard Documentation",
    },
    description:
        "Learn how to use MakeYourBoard cable clearance tools to check whether there is enough space around your pedals for patch cables, audio jacks and power connectors.",
    alternates: {
        canonical:
            "https://www.makeyourboard.com/docs/cable-clearance",
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

export default function CableClearancePage() {
    return (
        <DocsShell
            activePage="cable-clearance"
            breadcrumb="Cable Clearance"
            toc={[
                {
                    href: "#open",
                    label: "Open cable clearance",
                },
                {
                    href: "#how-it-works",
                    label: "How it works",
                },
                {
                    href: "#green",
                    label: "Green clearance area",
                },
                {
                    href: "#red",
                    label: "Red clearance area",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section">
                <h1>Cable Clearance</h1>

                <p className="docs-intro">
                    Check whether your{" "}
                    <DocLink href="/docs/pedals">
                        pedals
                    </DocLink>{" "}
                    are positioned with enough space around their audio
                    jacks and power connectors before assembling your
                    real pedalboard.
                </p>

                <p>
                    MakeYourBoard can display additional clearance areas
                    around each pedal to help you identify layouts where
                    patch cables or power connectors may be too close to
                    another pedal.
                </p>
            </section>

            {/* OPEN */}
            <section
                id="open"
                className="docs-section"
            >
                <h2>Open Cable Clearance</h2>

                <p>
                    Open Menu &gt; Cables to display the cable clearance
                    information for the pedals currently placed on your{" "}
                    <DocLink href="/docs/pedalboards">
                        pedalboard
                    </DocLink>
                    .
                </p>

                <p>
                    The clearance areas are based on the location of the
                    pedal&apos;s audio jacks and power connector when this
                    information is available.
                </p>
            </section>

            {/* HOW IT WORKS */}
            <section
                id="how-it-works"
                className="docs-section"
            >
                <h2>How Cable Clearance Works</h2>

                <p>
                    MakeYourBoard adds a visual area around the parts of
                    each pedal where additional space may be required for
                    patch cables, jack connectors and power cables.
                </p>

                <p>
                    This makes it easier to see whether pedals placed very
                    close together may leave enough room for the physical
                    connectors used on a real pedalboard.
                </p>

                <p>
                    Cable clearance also works with{" "}
                    <DocLink href="/docs/custom-gear">
                        custom pedals
                    </DocLink>{" "}
                    when jack and power connector positions have been
                    defined.
                </p>

                <p>
                    Cable clearance is intended as a planning aid. The
                    exact amount of space required can still vary depending
                    on the cables and connectors you use.
                </p>
            </section>

            {/* GREEN */}
            <section
                id="green"
                className="docs-section"
            >
                <h2>Green Clearance Area</h2>

                <p>
                    A green clearance area indicates that the space
                    reserved for the pedal&apos;s cables and connectors does
                    not overlap another pedal.
                </p>

                <p>
                    In this situation, MakeYourBoard has not detected an
                    obvious spacing conflict around that connection area.
                </p>
            </section>

            {/* RED */}
            <section
                id="red"
                className="docs-section"
            >
                <h2>Red Clearance Area</h2>

                <p>
                    A red clearance area indicates that the estimated
                    space required for cables or connectors overlaps
                    another pedal.
                </p>

                <p>
                    This does not necessarily mean that the layout is
                    impossible, but it indicates that there may not be
                    enough room for the cables or connectors you intend
                    to use.
                </p>

                <p>
                    Try moving the pedals slightly farther apart and
                    check the clearance again until the potential conflict
                    is resolved.
                </p>

                <p>
                    You can also review your{" "}
                    <DocLink href="/docs/power-supplies">
                        power supply setup
                    </DocLink>{" "}
                    to make sure the physical layout and power
                    requirements of your pedalboard work together.
                </p>
            </section>
        </DocsShell>
    );
}