import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DealFlow — AI Deal Sourcing Agent",
  description: "Your AI analyst that scans Product Hunt, GitHub & more 24/7, scores deals against your thesis, and delivers a daily brief.",
  keywords: ["deal sourcing", "VC", "angel investor", "AI agent", "startup discovery"],
  openGraph: {
    title: "DealFlow — AI Deal Sourcing Agent",
    description: "Never miss the next breakout company. AI-powered deal sourcing for investors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
