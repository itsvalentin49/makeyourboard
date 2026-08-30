import type { Metadata } from "next";
import DocsShell from "@/components/docs/DocsShell";

export const metadata: Metadata = {
    title: {
        absolute: "MakeYourBoard FAQ | Pedalboard Planner Help",
    },
    description:
        "Frequently asked questions about MakeYourBoard, the free online guitar pedalboard planner.",
    alternates: {
        canonical:
            "https://makeyourboard.com/docs/faq",
    },
};

export default function FAQPage() {
    return (
        <DocsShell
            activePage="faq"
            breadcrumb="FAQ"
            toc={[
                {
                    href: "#free",
                    label: "Is MakeYourBoard free?",
                },
                {
                    href: "#account",
                    label: "Do I need an account?",
                },
                {
                    href: "#dimensions",
                    label: "Are dimensions accurate?",
                },
                {
                    href: "#custom",
                    label: "Can I create custom gear?",
                },
                {
                    href: "#multiple-boards",
                    label: "Can I use multiple pedalboards?",
                },
                {
                    href: "#import",
                    label: "Can I import my own pedal?",
                },
                {
                    href: "#power",
                    label: "Power compatibility",
                },
                {
                    href: "#languages",
                    label: "Multiple languages",
                },
                {
                    href: "#export",
                    label: "Can I export my board?",
                },
            ]}
        >
            {/* INTRO */}
            <section className="docs-section docs-faq-intro">
                <h1>Frequently Asked Questions</h1>
            </section>

            {/* FAQ */}
            <section className="docs-section">

                {/* FREE */}
                <div
                    id="free"
                    className="docs-faq"
                >
                    <h3>
                        Is MakeYourBoard free?
                    </h3>

                    <p>
                        Yes. MakeYourBoard is a free online guitar
                        pedalboard planning tool.
                    </p>
                </div>

                {/* ACCOUNT */}
                <div
                    id="account"
                    className="docs-faq"
                >
                    <h3>
                        Do I need an account to use MakeYourBoard?
                    </h3>

                    <p>
                        No. MakeYourBoard can be used without creating
                        an account, including building and exporting
                        your pedalboard.
                    </p>
                </div>

                {/* DIMENSIONS */}
                <div
                    id="dimensions"
                    className="docs-faq"
                >
                    <h3>
                        Are pedal and pedalboard dimensions accurate?
                    </h3>

                    <p>
                        MakeYourBoard uses real product dimensions
                        whenever manufacturer specifications are
                        available.
                    </p>
                </div>

                {/* CUSTOM */}
                <div
                    id="custom"
                    className="docs-faq"
                >
                    <h3>
                        Can I create custom pedals and pedalboards?
                    </h3>

                    <p>
                        Yes. Custom pedals and pedalboards can be
                        created using your own dimensions when a
                        product is not available in the library.
                    </p>
                </div>

                {/* MULTIPLE BOARDS */}
                <div
                    id="multiple-boards"
                    className="docs-faq"
                >
                    <h3>
                        Can I use multiple pedalboards?
                    </h3>

                    <p>
                        Yes. You can manage multiple pedalboards by
                        creating a separate tab for each one from
                        Menu &gt; Pedalboards.
                    </p>
                </div>

                {/* IMPORT */}
                <div
                    id="import"
                    className="docs-faq"
                >
                    <h3>
                        Can I import my own pedal image?
                    </h3>

                    <p>
                        Yes. If you cannot find a pedal in the library,
                        you can add it yourself using the Import tab
                        and define its dimensions.
                    </p>
                </div>

                {/* POWER */}
                <div
                    id="power"
                    className="docs-faq"
                >
                    <h3>
                        Can MakeYourBoard check my power supply?
                    </h3>

                    <p>
                        Yes. MakeYourBoard compares the requirements
                        of your pedals with the available outputs of
                        your power supply and highlights compatibility
                        issues.
                    </p>
                </div>

                {/* LANGUAGES */}
                <div
                    id="languages"
                    className="docs-faq"
                >
                    <h3>
                        Is MakeYourBoard available in multiple languages?
                    </h3>

                    <p>
                        Yes. MakeYourBoard is available in English,
                        Chinese, Spanish, French, Portuguese, German
                        and Italian.
                    </p>
                </div>

                {/* EXPORT */}
                <div
                    id="export"
                    className="docs-faq"
                >
                    <h3>
                        Can I export my pedalboard?
                    </h3>

                    <p>
                        Yes. Your completed pedalboard can be exported
                        as an image for reference or sharing.
                    </p>
                </div>

            </section>

        </DocsShell>
    );
}