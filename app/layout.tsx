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

  title: {
    default: "MakeYourBoard – Online Guitar Pedalboard Builder",
    template: "%s | MakeYourBoard",
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
    title: "MakeYourBoard – Online Guitar Pedalboard Builder",
    description:
      "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",
    url: "https://makeyourboard.com",
    siteName: "MakeYourBoard",
    images: [
      {
        url: "https://makeyourboard.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MakeYourBoard – Online Guitar Pedalboard Builder",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "MakeYourBoard – Online Guitar Pedalboard Builder",
    description:
      "Build and design your guitar pedalboard online. Add pedals, boards, customize layout, calculate power consumption and visualize your setup in real time.",
    images: ["https://makeyourboard.com/og-image.jpg"],
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
        <Analytics />
      </body>
    </html>
  );
}