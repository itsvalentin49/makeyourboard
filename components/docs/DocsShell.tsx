import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type TocItem = {
    href: string;
    label: string;
};

type Props = {
    activePage: "getting-started" | "faq" | "comparison";
    breadcrumb: string;
    toc: TocItem[];
    children: ReactNode;
};

export default function DocsShell({
    activePage,
    breadcrumb,
    toc,
    children,
}: Props) {
    return (
        <main className="docs-page">

            {/* HEADER */}
            <header className="docs-header">
                <div className="docs-header-inner">

                    <Link href="/" className="docs-back">
                        <ArrowLeft size={16} />
                        MakeYourBoard
                    </Link>

                    <Link href="/" className="docs-open">
                        Open Pedalboard Planner
                    </Link>

                </div>
            </header>

            <div className="docs-layout">

                {/* COLONNE GAUCHE */}
                <aside className="docs-sidebar">
                    <div className="docs-sidebar-inner">

                        <div className="docs-brand">
                            MakeYourBoard
                        </div>

                        <div className="docs-nav-section">
                            <div className="docs-nav-title">
                                Pedalboard Planner
                            </div>

                            <Link
                                href="/docs/getting-started"
                                className={`docs-nav-link ${activePage === "getting-started"
                                    ? "active"
                                    : ""
                                    }`}
                            >
                                Getting Started
                            </Link>
                        </div>

                        <div className="docs-nav-section">
                            <div className="docs-nav-title">
                                Resources
                            </div>

                            <Link
                                href="/docs/faq"
                                className={`docs-nav-link ${activePage === "faq"
                                    ? "active"
                                    : ""
                                    }`}
                            >
                                FAQ
                            </Link>

                            <Link
                                href="/docs/comparison"
                                className={`docs-nav-link ${activePage === "comparison"
                                    ? "active"
                                    : ""
                                    }`}
                            >
                                Pedalboard Planner Comparison
                            </Link>
                        </div>

                    </div>
                </aside>

                {/* CONTENU CENTRAL */}
                <article className="docs-content">

                    <div className="docs-breadcrumb">
                        <span>Documentation</span>
                        <span>/</span>
                        <span>{breadcrumb}</span>
                    </div>

                    {children}

                </article>

                {/* COLONNE DROITE */}
                <aside className="docs-toc">
                    <div className="docs-toc-inner">

                        <div className="docs-toc-title">
                            On this page
                        </div>

                        <nav>
                            {toc.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                    </div>
                </aside>

            </div>
        </main>
    );
}