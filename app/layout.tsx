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

export const metadata: Metadata = {
  metadataBase: new URL("https://makeyourboard.com"),

  applicationName: "MakeYourBoard",

  alternates: {
    canonical: "https://makeyourboard.com",
  },

  title: {
    default: "MakeYourBoard | Guitar Pedalboard Builder",
    template: "%s | MakeYourBoard",
  },

  description:
  "Design your guitar pedalboard with real pedal sizes, drag-and-drop layout, power calculation, and high-quality export. Free and easy to use.",

  keywords: [
    "guitar pedalboard builder",
    "pedalboard planner",
    "pedalboard designer",
    "build pedalboard online",
    "guitar pedals layout",
  ],

openGraph: {
  title: "MakeYourBoard | Guitar Pedalboard Builder",
  description:
  "Design your guitar pedalboard with real pedal sizes, drag-and-drop layout, power calculation, and high-quality export. Free and easy to use.",
  url: "https://makeyourboard.com",
  siteName: "MakeYourBoard",
  images: [
    {
      url: "https://makeyourboard.com/og-image.png",
      width: 1200,
      height: 630,
      alt: "MakeYourBoard | Guitar Pedalboard Builder",
    },
  ],
  locale: "en_US",
  type: "website",
},

  twitter: {
    card: "summary_large_image",
    title: "MakeYourBoard | Guitar Pedalboard Builder",
  description:
  "Design your guitar pedalboard with real pedal sizes, drag-and-drop layout, power calculation, and high-quality export. Free and easy to use.",
    images: ["https://makeyourboard.com/og-image.png"],
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
    name: "MakeYourBoard",
    alternateName: ["Make Your Board", "Pedalboard Builder"],
    url: "https://makeyourboard.com",
  };

  const structuredDataApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MakeYourBoard",
    url: "https://makeyourboard.com",
    applicationCategory: "MusicApplication",
    operatingSystem: "All",
    description:
  "Design your guitar pedalboard with real pedal sizes, drag-and-drop layout, power calculation, and high-quality export. Free and easy to use.",
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

        {/* Structured Data - Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredDataWebsite),
          }}
        />

        {/* Structured Data - Web Application */}
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