import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.makeyourboard.com";
const SITE_NAME = "MakeYourBoard";

const SITE_TITLE =
  "MakeYourBoard | Guitar Pedalboard Planner  ";

const SITE_DESCRIPTION =
  "Guitar pedalboard planner with thousands of pedals, real dimensions, power supply compatibility, cable clearance checks and high-quality image export.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  alternates: {
    canonical: SITE_URL,
  },

  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "MakeYourBoard Guitar Pedalboard Planner",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();

  const country =
    headersList.get("x-vercel-ip-country") || "FR";

  const structuredDataWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: "Make Your Board",
    inLanguage: "en",
  };

  const structuredDataApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: SITE_DESCRIPTION,

    applicationCategory: "DesignApplication",
    operatingSystem: "All",

    isAccessibleForFree: true,

    offers: {
      "@type": "Offer",
      price: 0,
    },

    featureList: [
      "Guitar pedalboard planning",
      "Thousands of guitar pedals",
      "Real pedal dimensions",
      "Drag and drop pedal layout",
      "Power supply compatibility",
      "Cable clearance checking",
      "Custom pedals and pedalboards",
      "High-quality image export",
    ],
  };

  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MYB_COUNTRY__ = ${JSON.stringify(
              country
            )};`,
          }}
        />

        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredDataWebsite
            ),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredDataApp
            ),
          }}
        />

        <Analytics />
      </body>
    </html>
  );
}