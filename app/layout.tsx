import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://makeyourboard.com";
const SITE_NAME = "MakeYourBoard";
const SITE_TITLE = "MakeYourBoard | Guitar Pedalboard Builder";
const SITE_DESCRIPTION =
  "Design your guitar pedalboard with real pedal sizes, drag-and-drop layout, power calculation, and high-quality export. Free and easy to use.";

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

  keywords: [
    "guitar pedalboard builder",
    "pedalboard planner",
    "pedalboard designer",
    "build pedalboard online",
    "guitar pedals layout",
  ],

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
        alt: SITE_TITLE,
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
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredDataWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    alternateName: "Make Your Board",
  };

  const structuredDataApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    applicationCategory: "MusicApplication",
    operatingSystem: "All",
    description: SITE_DESCRIPTION,
  };

  return (
    <html lang="en" className="light">
      <head>
        <link rel="preload" as="image" href="/backgrounds/wood.webp" />
        <link rel="preload" as="image" href="/backgrounds/carpet.webp" />
        <link rel="preload" as="image" href="/backgrounds/stripes.webp" />
        <link rel="preload" as="image" href="/backgrounds/fabric.webp" />
        <link rel="preload" as="image" href="/backgrounds/houndstooth.webp" />
        <link rel="preload" as="image" href="/backgrounds/steel.webp" />
        <link rel="preload" as="image" href="/backgrounds/coast.webp" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {children}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataWebsite),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataApp),
          }}
        />

        <Analytics />
      </body>
    </html>
  );
}