
"use client";

import type { ReactNode } from "react";
import SidebarLogo from "./sidebar/SidebarLogo";
import styles from "./CatalogBanner.module.css";

type Props = {
    actions?: ReactNode;
};

export default function CatalogBanner({ actions }: Props) {
    return (
        <header className={styles.banner}>
            <div className={styles.logo}>
                <SidebarLogo />
            </div>

            {actions && (
                <div className={styles.actions}>
                    {actions}
                </div>
            )}
        </header>
    );
}
