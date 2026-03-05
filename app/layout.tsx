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

  applicationName: "Make Your Board",

  alternates: {
    canonical: "https://makeyourboard.com",
  },

  title: {
    default: "Make Your Board – Guitar Pedalboard Builder Online",
    template: "%s | Make Your Board",
  },

  description:
    "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",

  keywords: [
    "guitar pedalboard builder",
    "pedalboard planner",
    "pedalboard designer",
    "build pedalboard online",
    "guitar pedals layout",
  ],

  openGraph: {
    title: "Make Your Board – Guitar Pedalboard Builder",
    description:
      "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",
    url: "https://makeyourboard.com",
    siteName: "Make Your Board",
    images: [
      {
        url: "https://makeyourboard.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Make Your Board – Guitar Pedalboard Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Make Your Board – Guitar Pedalboard Builder Online",
    description:
      "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",
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
    name: "Make Your Board",
    alternateName: "MakeYourBoard",
    url: "https://makeyourboard.com",
  };

  const structuredDataApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Make Your Board",
    url: "https://makeyourboard.com",
    applicationCategory: "MusicApplication",
    operatingSystem: "All",
    description:
      "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
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